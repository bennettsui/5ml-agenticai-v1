/**
 * Batch Processor - Complete receipt processing workflow
 *
 * OCR flow:
 *   1. Google Vision  → raw text + word-level bounding boxes
 *   2. DeepSeek       → structure text into fields + categorisation
 *
 * Supports: images (JPG/PNG/WebP) and PDFs (each page → one receipt row).
 * Image data is stored as base64 in receipts.image_data for the OCR viewer.
 */

const path = require('path');
const fsSync = require('fs');
const fs = require('fs').promises;
const ExcelJS = require('exceljs');
const db = require('../../../db');

let schemaEnsured = false;

async function ensureReceiptsSchema() {
  if (schemaEnsured) return;
  // pg does not support multiple statements in one query() call — run separately
  await db.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS ocr_boxes    JSONB`);
  await db.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_data   TEXT`);
  await db.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS remarks      TEXT`);
  await db.query(`ALTER TABLE receipt_batches ADD COLUMN IF NOT EXISTS ocr_provider  VARCHAR(50) DEFAULT 'google-vision'`);
  await db.query(`ALTER TABLE receipt_batches ADD COLUMN IF NOT EXISTS token_usage   JSONB`);
  schemaEnsured = true;
}

async function logProcessing(batchId, level, step, message, details = null) {
  try {
    console.log(`[${level.toUpperCase()}] [${step}] ${message}`);
    await db.query(
      `INSERT INTO processing_logs (batch_id, log_level, step, message, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [batchId, level, step, message, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Error writing log:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Load previous learning (remarks) from DB to inject as context
// ---------------------------------------------------------------------------
async function loadPreviousLearning(limit = 40) {
  try {
    const result = await db.query(
      `SELECT vendor, category_name, remarks
       FROM receipts
       WHERE remarks IS NOT NULL AND trim(remarks) <> ''
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    if (result.rows.length === 0) return null;
    return result.rows
      .map(r => `- ${r.vendor} (${r.category_name || 'uncategorised'}): ${r.remarks}`)
      .join('\n');
  } catch {
    return null; // non-fatal — proceed without learning context
  }
}

// Pricing per 1M tokens (USD)
const DEEPSEEK_PRICE = { input: 0.27, output: 1.10 };

function calcDeepSeekCost(inputTokens, outputTokens) {
  return (inputTokens / 1e6) * DEEPSEEK_PRICE.input + (outputTokens / 1e6) * DEEPSEEK_PRICE.output;
}

// ---------------------------------------------------------------------------
// DeepSeek: structure raw OCR text into receipt fields
// ---------------------------------------------------------------------------
async function structureWithDeepSeek(rawText, filename, learningContext = null) {
  const fetch = require('node-fetch');
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const learningSection = learningContext
    ? `\nPrevious categorisation learning (apply these rules when they match):
${learningContext}
`
    : '';

  const prompt = `You are a receipt data extraction specialist. Extract structured data from this receipt OCR text.
${learningSection}
Receipt filename: ${filename}
OCR text:
---
${rawText}
---

Return ONLY valid JSON with these exact fields (no markdown, no explanation):
{
  "vendor": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "amount": 0.00,
  "currency": "HKD",
  "tax_amount": 0.00,
  "receipt_number": "optional receipt/invoice number",
  "payment_method": "cash/credit/debit/octopus/etc",
  "description": "brief description of purchase",
  "category": "Food & Beverage | Transport | Office Supplies | Entertainment | Utilities | Professional Services | Other",
  "deductible": true,
  "confidence": 0.95
}

Rules:
- date must be YYYY-MM-DD format; if unclear use today: ${new Date().toISOString().split('T')[0]}
- amount must be a number (no currency symbol)
- currency default HKD unless clearly different
- confidence: 0.0-1.0 based on how clear the receipt text is`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Capture token usage from DeepSeek response (OpenAI-compatible format)
  const modelUsed    = data.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const inputTokens  = data.usage?.prompt_tokens     || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const _usage = {
    model:        modelUsed,
    inputTokens,
    outputTokens,
    totalTokens:  inputTokens + outputTokens,
    costUsd:      calcDeepSeekCost(inputTokens, outputTokens),
  };

  // Strip any accidental markdown fences
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    parsed._usage = _usage;
    return parsed;
  } catch {
    // Best-effort fallback
    return {
      vendor: 'Unknown',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'HKD',
      tax_amount: 0,
      receipt_number: '',
      payment_method: '',
      description: rawText.substring(0, 100),
      category: 'Other',
      deductible: true,
      confidence: 0.3,
      _usage,
    };
  }
}

// ---------------------------------------------------------------------------
// Map DeepSeek category label to a category_id
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  'Food & Beverage': '5200',
  'Transport': '5300',
  'Office Supplies': '5100',
  'Entertainment': '5400',
  'Utilities': '5500',
  'Professional Services': '5600',
  'Other': '5900',
};

// ---------------------------------------------------------------------------
// Process a single receipt file (image or PDF page)
// ---------------------------------------------------------------------------
async function processOneFile(filePath, originalFilename, batchId, pageNumber, wsServer, learningContext = null) {
  const GoogleVisionOCR = require('./google-vision-ocr');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const vision = new GoogleVisionOCR(process.env.GEMINI_API_KEY);
  const ext = path.extname(filePath).toLowerCase();

  let pages;
  if (ext === '.pdf') {
    pages = await vision.processFile(filePath);
  } else {
    pages = await vision.processFile(filePath);
  }

  const results = [];
  for (const page of pages) {
    const label = pages.length > 1 ? `${originalFilename} (page ${page.pageNumber})` : originalFilename;

    const ocrUsage = page.usage || {};
    const ocrCostStr = ocrUsage.costUsd != null ? ` | $${ocrUsage.costUsd.toFixed(5)}` : '';
    wsServer.sendProgress(batchId, {
      message: `Gemini OCR [${ocrUsage.model || 'gemini-2.0-flash'}]: ${label} — ${page.boxes.length} words | in:${ocrUsage.inputTokens||0} out:${ocrUsage.outputTokens||0}${ocrCostStr}`,
    });

    if (!page.text || page.text.trim().length < 5) {
      results.push({
        success: false,
        filename: label,
        error: 'No readable text detected by Google Vision',
        page,
      });
      continue;
    }

    // Read image data for storage
    let imageData = null;
    let imageMime = 'image/jpeg';
    try {
      const buf = await fs.readFile(filePath);
      imageData = buf.toString('base64');
      const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
      imageMime = mimeMap[ext] || 'image/jpeg';
    } catch { /* non-fatal */ }

    wsServer.sendProgress(batchId, { message: `DeepSeek: structuring ${label}...` });

    let structured;
    try {
      structured = await structureWithDeepSeek(page.text, label, learningContext);
      const du = structured._usage;
      if (du) {
        const dsCostStr = du.costUsd != null ? ` | $${du.costUsd.toFixed(5)}` : '';
        wsServer.sendProgress(batchId, {
          message: `DeepSeek [${du.model}]: ${label} — in:${du.inputTokens} out:${du.outputTokens}${dsCostStr}`,
        });
      }
    } catch (err) {
      wsServer.sendProgress(batchId, { message: `DeepSeek warning for ${label}: ${err.message}` });
      structured = {
        vendor: 'Unknown',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'HKD',
        tax_amount: 0,
        receipt_number: '',
        payment_method: '',
        description: '',
        category: 'Other',
        deductible: true,
        confidence: 0.3,
      };
    }

    results.push({
      success: true,
      filename: label,
      page,
      structured,
      imageData,
      imageMime,
      usageOcr: page.usage || null,
      usageDs:  structured._usage || null,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main batch processor
// ---------------------------------------------------------------------------
async function processReceiptBatch(batchId, dropboxUrl, clientName, uploadedFiles = null, ocrModel = 'google-vision') {
  const wsServer = require('../../../services/websocket-server');
  let downloadedFiles = [];
  const useUploads = Array.isArray(uploadedFiles) && uploadedFiles.length > 0;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 [BATCH ${batchId}] Starting receipt processing`);
    console.log(`📁 Source: ${useUploads ? `${uploadedFiles.length} uploaded files` : `Dropbox: ${(dropboxUrl || '').substring(0, 50)}`}`);
    console.log(`👤 Client: ${clientName}`);
    console.log(`🧠 OCR: Google Vision + DeepSeek`);
    console.log(`${'='.repeat(60)}\n`);

    // Step 1: Ensure schema (must run before any column references)
    await ensureReceiptsSchema();

    // Step 2: Set status
    await db.query(
      "UPDATE receipt_batches SET status='processing', ocr_provider='google-vision', updated_at=NOW() WHERE batch_id=$1",
      [batchId]
    );
    await logProcessing(batchId, 'info', 'batch_start', 'Processing started — Google Vision + DeepSeek');
    wsServer.sendStatus(batchId, { status: 'processing', progress: 5 });

    // Step 3a: Env check
    if (!useUploads && !process.env.DROPBOX_ACCESS_TOKEN) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured');
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Step 3b: Collect files
    wsServer.sendProgress(batchId, { progress: 10, message: useUploads ? 'Preparing uploads...' : 'Downloading from Dropbox...' });

    if (useUploads) {
      downloadedFiles = uploadedFiles;
    } else {
      const DropboxConnector = require('../../../tools/dropbox-connector');
      const dropbox = new DropboxConnector(process.env.DROPBOX_ACCESS_TOKEN);
      const downloadResults = await dropbox.downloadReceipts(
        dropboxUrl,
        `/tmp/receipts/${batchId}`,
        (p) => wsServer.sendProgress(batchId, { progress: 10 + (p.progress * 0.1), message: `Downloading ${p.current}/${p.total}` })
      );
      downloadedFiles = downloadResults.results.filter(r => r.success);
      if (downloadedFiles.length === 0) throw new Error('No files downloaded from Dropbox');
    }

    await logProcessing(batchId, 'info', 'files_ready', `${downloadedFiles.length} file(s) ready for OCR`);

    // Load previous learning to guide DeepSeek categorisation
    const learningContext = await loadPreviousLearning(40);
    if (learningContext) {
      const count = learningContext.split('\n').length;
      await logProcessing(batchId, 'info', 'learning_loaded', `Loaded ${count} previous learning note(s) for context`);
      wsServer.sendProgress(batchId, { progress: 20, message: `${downloadedFiles.length} file(s) ready — ${count} learning notes applied` });
    } else {
      wsServer.sendProgress(batchId, { progress: 20, message: `${downloadedFiles.length} file(s) collected — starting OCR` });
    }

    // Step 4: OCR each file
    const allReceipts = [];   // { success, filename, structured, page, imageData, imageMime, error }
    let fileIdx = 0;

    for (const fileEntry of downloadedFiles) {
      fileIdx++;
      const filePath = fileEntry.path;
      const originalName = fileEntry.filename || path.basename(filePath);
      const progressBase = 20 + Math.round(((fileIdx - 1) / downloadedFiles.length) * 50);

      wsServer.sendProgress(batchId, {
        progress: progressBase,
        message: `OCR ${fileIdx}/${downloadedFiles.length}: ${originalName}`,
      });
      await logProcessing(batchId, 'info', 'ocr_file', `Processing: ${originalName}`);

      try {
        const fileResults = await processOneFile(filePath, originalName, batchId, fileIdx, wsServer, learningContext);
        allReceipts.push(...fileResults);
      } catch (err) {
        const errMsg = err.message || 'Unknown error';
        await logProcessing(batchId, 'error', 'ocr_error', `Failed: ${originalName} — ${errMsg}`);
        wsServer.sendProgress(batchId, { message: `Error on ${originalName}: ${errMsg}` });
        allReceipts.push({ success: false, filename: originalName, error: errMsg });
      }

      // Update progress count
      await db.query(
        'UPDATE receipt_batches SET processed_receipts=$1 WHERE batch_id=$2',
        [allReceipts.filter(r => r.success).length, batchId]
      );
    }

    // Update total receipt count (PDF pages expand the count)
    await db.query(
      'UPDATE receipt_batches SET total_receipts=$1 WHERE batch_id=$2',
      [allReceipts.length, batchId]
    );

    // Accumulate token usage across all receipts in this batch
    const tokenUsage = {
      models: {},   // keyed by model name
      totalCostUsd: 0,
    };
    function addUsage(u) {
      if (!u) return;
      if (!tokenUsage.models[u.model]) {
        tokenUsage.models[u.model] = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      }
      tokenUsage.models[u.model].inputTokens  += u.inputTokens  || 0;
      tokenUsage.models[u.model].outputTokens += u.outputTokens || 0;
      tokenUsage.models[u.model].costUsd      += u.costUsd      || 0;
      tokenUsage.totalCostUsd                 += u.costUsd      || 0;
    }
    for (const item of allReceipts) {
      addUsage(item.usageOcr);
      addUsage(item.usageDs);
    }

    // Log cost summary to processing log
    const modelLines = Object.entries(tokenUsage.models)
      .map(([m, u]) => `${m}: in:${u.inputTokens} out:${u.outputTokens} $${u.costUsd.toFixed(5)}`)
      .join(' | ');
    await logProcessing(batchId, 'info', 'token_usage', `Token usage — ${modelLines} | TOTAL: $${tokenUsage.totalCostUsd.toFixed(5)}`);
    wsServer.sendProgress(batchId, {
      message: `Token usage — ${modelLines} | TOTAL: $${tokenUsage.totalCostUsd.toFixed(4)}`,
    });

    // Step 5: Save to DB
    wsServer.sendProgress(batchId, { progress: 72, message: 'Saving to database...' });
    await logProcessing(batchId, 'info', 'save_start', `Saving ${allReceipts.filter(r => r.success).length} receipts`);

    let totalAmount = 0;
    let savedCount = 0;
    let failedCount = 0;

    for (const item of allReceipts) {
      if (!item.success) {
        failedCount++;
        continue;
      }
      const s = item.structured;
      const categoryId = CATEGORY_MAP[s.category] || '5900';
      const categoryName = s.category || 'Other';
      const amount = typeof s.amount === 'number' ? s.amount : Number(s.amount) || 0;
      const taxAmount = typeof s.tax_amount === 'number' ? s.tax_amount : Number(s.tax_amount) || 0;
      const deductible = s.deductible !== false;
      const imageDataUri = item.imageData ? `data:${item.imageMime};base64,${item.imageData}` : null;

      try {
        await db.query(
          `INSERT INTO receipts (
            batch_id, image_path, image_hash,
            receipt_date, vendor, description, amount, currency,
            tax_amount, receipt_number, payment_method,
            ocr_confidence, ocr_raw_text, ocr_boxes,
            category_id, category_name, categorization_confidence, categorization_reasoning,
            deductible, deductible_amount, non_deductible_amount,
            image_data
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
          [
            batchId,
            item.filename,
            '',
            s.date || new Date().toISOString().split('T')[0],
            s.vendor || 'Unknown',
            s.description || '',
            amount,
            s.currency || 'HKD',
            taxAmount,
            s.receipt_number || '',
            s.payment_method || '',
            s.confidence || 0.85,
            item.page?.text || '',
            item.page?.boxes ? JSON.stringify(item.page.boxes) : null,
            categoryId,
            categoryName,
            s.confidence || 0.85,
            '',
            deductible,
            amount,
            0,
            imageDataUri,
          ]
        );
        totalAmount += amount;
        savedCount++;
      } catch (err) {
        console.error(`Save error for ${item.filename}:`, err.message);
        failedCount++;
      }
    }

    await db.query(
      `UPDATE receipt_batches
       SET total_amount=$1, deductible_amount=$1,
           processed_receipts=$2, failed_receipts=$3,
           token_usage=$4
       WHERE batch_id=$5`,
      [totalAmount, savedCount, failedCount, JSON.stringify(tokenUsage), batchId]
    );

    console.log(`✅ Saved ${savedCount} receipts (total ${totalAmount.toFixed(2)}), ${failedCount} failed`);
    await logProcessing(batchId, 'info', 'save_complete', `${savedCount} receipts saved`);

    // Step 6: Generate Excel
    wsServer.sendProgress(batchId, { progress: 87, message: 'Generating Excel P&L...' });
    await logProcessing(batchId, 'info', 'excel_start', 'Generating Excel export');

    const exportDir = process.env.EXCEL_OUTPUT_DIR || '/tmp/excel-exports';
    const outputPath = path.join(exportDir, `receipts_${batchId}.xlsx`);
    await fs.mkdir(exportDir, { recursive: true });

    const receiptsResult = await db.query(
      `SELECT receipt_date, vendor, description, amount, currency, tax_amount,
              receipt_number, payment_method, category_id, category_name,
              deductible, deductible_amount, non_deductible_amount, remarks
       FROM receipts WHERE batch_id=$1 ORDER BY receipt_date ASC, vendor ASC`,
      [batchId]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '5ML Agentic AI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('P&L');
    sheet.columns = [
      { header: 'Date',            key: 'receipt_date',          width: 12 },
      { header: 'Vendor',          key: 'vendor',                width: 24 },
      { header: 'Description',     key: 'description',           width: 36 },
      { header: 'Amount',          key: 'amount',                width: 12 },
      { header: 'Currency',        key: 'currency',              width: 8  },
      { header: 'Tax',             key: 'tax_amount',            width: 10 },
      { header: 'Receipt #',       key: 'receipt_number',        width: 16 },
      { header: 'Payment',         key: 'payment_method',        width: 12 },
      { header: 'Category ID',     key: 'category_id',           width: 12 },
      { header: 'Category',        key: 'category_name',         width: 20 },
      { header: 'Deductible',      key: 'deductible',            width: 12 },
      { header: 'Ded. Amount',     key: 'deductible_amount',     width: 16 },
      { header: 'Non-Ded. Amount', key: 'non_deductible_amount', width: 16 },
      { header: 'Remarks',         key: 'remarks',               width: 30 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    receiptsResult.rows.forEach(row => sheet.addRow(row));

    await workbook.xlsx.writeFile(outputPath);
    await db.query(
      'UPDATE receipt_batches SET excel_file_path=$1 WHERE batch_id=$2',
      [outputPath, batchId]
    );
    await logProcessing(batchId, 'info', 'excel_complete', 'Excel export complete');

    // Step 7: Complete
    await db.query(
      "UPDATE receipt_batches SET status='completed', completed_at=NOW() WHERE batch_id=$1",
      [batchId]
    );

    wsServer.sendStatus(batchId, { status: 'completed', progress: 100, message: 'All done!' });
    console.log(`✅ BATCH ${batchId} COMPLETE — ${savedCount} receipts`);
    await logProcessing(batchId, 'info', 'batch_completed', 'Batch completed successfully');

  } catch (error) {
    console.error(`\n❌ BATCH ${batchId} ERROR:`, error.message);

    await db.query(
      "UPDATE receipt_batches SET status='failed' WHERE batch_id=$1",
      [batchId]
    ).catch(() => {});

    wsServer.sendStatus(batchId, { status: 'failed', message: error.message });

    await logProcessing(batchId, 'error', 'batch_failed', `Batch failed: ${error.message}`, {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    // Cleanup temp files
    if (downloadedFiles.length > 0) {
      for (const file of downloadedFiles) {
        await fs.unlink(file.path).catch(() => {});
      }
    }
  }
}

module.exports = { processReceiptBatch };
