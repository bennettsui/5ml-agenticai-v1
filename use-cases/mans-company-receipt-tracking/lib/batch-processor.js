/**
 * Batch Processor - Complete receipt processing workflow
 * with detailed debug checkpoints
 */

const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../../../db');

/**
 * Log processing step to database and console
 */
async function logProcessing(batchId, level, step, message, details = null) {
  try {
    console.log(`[${level.toUpperCase()}] [${step}] ${message}`);
    await db.query(
      `INSERT INTO processing_logs (batch_id, log_level, step, message, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [batchId, level, step, message, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error logging processing step:', error);
  }
}

/**
 * Process receipt batch with detailed checkpoints
 */
async function processReceiptBatch(batchId, dropboxUrl, clientName, uploadedFiles = null) {
  const wsServer = require('../../../services/websocket-server');
  let downloadedFiles = [];
  const useUploads = Array.isArray(uploadedFiles) && uploadedFiles.length > 0;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 [BATCH ${batchId}] Starting receipt processing`);
    if (useUploads) {
      console.log(`📁 Uploads: ${uploadedFiles.length} files`);
    } else {
      console.log(`📁 Dropbox: ${dropboxUrl.substring(0, 50)}...`);
    }
    console.log(`👤 Client: ${clientName}`);
    console.log(`${'='.repeat(60)}\n`);

    // CHECKPOINT 1: Update status
    console.log('✓ CHECKPOINT 1: Setting status to processing...');
    await db.query(
      "UPDATE receipt_batches SET status = 'processing', updated_at = NOW() WHERE batch_id = $1",
      [batchId]
    );
    await logProcessing(batchId, 'info', 'batch_start', 'Batch processing started');
    wsServer.sendStatus(batchId, { status: 'processing', progress: 5 });

    // CHECKPOINT 2: Validate environment
    console.log('✓ CHECKPOINT 2: Checking environment...');
    if (!useUploads && !process.env.DROPBOX_ACCESS_TOKEN) {
      throw new Error('DROPBOX_ACCESS_TOKEN not configured');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    console.log('✅ Environment OK\n');

    // CHECKPOINT 3: Collect receipts
    console.log('✓ CHECKPOINT 3: Collecting receipts...');
    if (useUploads) {
      await logProcessing(batchId, 'info', 'upload_start', 'Using uploaded receipts');
      wsServer.sendProgress(batchId, { progress: 10, message: 'Preparing uploads...' });
      downloadedFiles = uploadedFiles;
      if (downloadedFiles.length === 0) {
        throw new Error('No receipts uploaded');
      }
    } else {
      await logProcessing(batchId, 'info', 'download_start', 'Downloading receipts');
      wsServer.sendProgress(batchId, { progress: 10, message: 'Downloading...' });

      const DropboxConnector = require('../../../tools/dropbox-connector');
      const dropbox = new DropboxConnector(process.env.DROPBOX_ACCESS_TOKEN);

      const downloadResults = await dropbox.downloadReceipts(
        dropboxUrl,
        `/tmp/receipts/${batchId}`,
        (p) => {
          wsServer.sendProgress(batchId, {
            progress: 10 + (p.progress * 0.2),
            message: `Downloading ${p.current}/${p.total}`
          });
        }
      );

      downloadedFiles = downloadResults.results.filter(r => r.success);
      if (downloadedFiles.length === 0) {
        throw new Error('No receipts downloaded');
      }
    }

    await db.query(
      'UPDATE receipt_batches SET total_receipts = $1 WHERE batch_id = $2',
      [downloadedFiles.length, batchId]
    );
    console.log(`✅ Collected ${downloadedFiles.length} receipts\n`);

    // CHECKPOINT 4A: Tesseract OCR for bounding boxes (with timeout protection)
    console.log('✓ CHECKPOINT 4A: Extracting bounding boxes with Tesseract...');
    await logProcessing(batchId, 'info', 'tesseract_start', 'Extracting bounding boxes');
    wsServer.sendProgress(batchId, { progress: 30, message: 'Extracting bounding boxes...' });

    let tesseractResults = [];
    try {
      const TesseractOCR = require('../../../tools/tesseract-ocr');
      const tesseract = new TesseractOCR();

      const imagePaths = downloadedFiles.map(f => f.path);

      // Add overall timeout for batch processing (5 minutes)
      const batchPromise = tesseract.processBatch(imagePaths, (p) => {
        const progress = 30 + (p.progress * 0.2);
        wsServer.sendProgress(batchId, {
          progress: Math.round(progress),
          message: `Tesseract ${p.current}/${p.total}`
        });
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tesseract batch timeout (5 minutes)')), 300000)
      );

      tesseractResults = await Promise.race([batchPromise, timeoutPromise]);

      // Terminate Tesseract worker to free resources
      await tesseract.terminate();

      console.log(`✅ Tesseract: ${tesseractResults.filter(r => r.success).length} successful\n`);
      await logProcessing(batchId, 'info', 'tesseract_complete', `Tesseract completed: ${tesseractResults.filter(r => r.success).length} successful`);

    } catch (error) {
      console.error(`⚠️ [Tesseract] Failed, continuing without bounding boxes:`, error.message);
      await logProcessing(batchId, 'warning', 'tesseract_failed', `Tesseract failed: ${error.message}`);

      // Create empty results so processing can continue
      tesseractResults = downloadedFiles.map(f => ({
        success: false,
        imagePath: f.path,
        error: 'Tesseract timeout or failure',
        boxes: []
      }));
    }

    // CHECKPOINT 4B: Claude Vision OCR for structured data
    console.log('✓ CHECKPOINT 4B: Running Claude Vision OCR...');
    await logProcessing(batchId, 'info', 'ocr_start', 'Starting Claude OCR');
    wsServer.sendProgress(batchId, { progress: 50, message: 'Processing with Claude Vision...' });

    const OCRProcessor = require('../../../tools/ocr-processor');
    const ocr = new OCRProcessor(process.env.ANTHROPIC_API_KEY);

    const ocrResults = await ocr.processBatch(imagePaths, (p) => {
      const progress = 50 + (p.progress * 0.2);
      wsServer.sendProgress(batchId, {
        progress: Math.round(progress),
        message: `Claude OCR ${p.current}/${p.total}`
      });

      db.query(
        'UPDATE receipt_batches SET processed_receipts = $1, failed_receipts = $2 WHERE batch_id = $3',
        [p.successful, p.failed, batchId]
      ).catch(console.error);
    });

    console.log(`✅ Claude OCR: ${ocrResults.successful} successful\n`);

    // CHECKPOINT 5: Save to database
    console.log('✓ CHECKPOINT 5: Saving to database...');
    wsServer.sendProgress(batchId, { progress: 70, message: 'Saving receipts...' });

    let totalAmount = 0;
    let savedCount = 0;

    for (const result of ocrResults.results) {
      if (!result.success || !result.data) continue;

      try {
        const data = result.data;
        const filename = path.basename(result.image_path);
        const fileData = downloadedFiles.find(f => f.path === result.image_path);

        // Find corresponding Tesseract result for bounding boxes
        const tesseractResult = tesseractResults.find(tr => tr.imagePath === result.image_path);
        const ocrBoxes = tesseractResult?.success ? tesseractResult.boxes : null;

        await db.query(
          `INSERT INTO receipts (
            batch_id, image_path, image_hash,
            receipt_date, vendor, description, amount, currency,
            tax_amount, receipt_number, payment_method,
            ocr_confidence, ocr_raw_text, ocr_boxes,
            category_id, category_name, categorization_confidence,
            deductible, deductible_amount, non_deductible_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            batchId, filename, fileData?.hash || '',
            data.date || new Date().toISOString().split('T')[0],
            data.vendor || 'Unknown', data.description || '',
            data.amount || 0, data.currency || 'HKD',
            data.tax_amount || 0, data.receipt_number || '',
            data.payment_method || '', data.confidence || 0.8,
            result.raw_text || '', ocrBoxes ? JSON.stringify(ocrBoxes) : null,
            '5100', 'Office Expenses',
            0.8, true, data.amount || 0, 0
          ]
        );

        totalAmount += (data.amount || 0);
        savedCount++;
      } catch (err) {
        console.error(`Error saving receipt:`, err.message);
      }
    }

    await db.query(
      `UPDATE receipt_batches
       SET total_amount = $1, deductible_amount = $1,
           processed_receipts = $2
       WHERE batch_id = $3`,
      [totalAmount, savedCount, batchId]
    );

    console.log(`✅ Saved ${savedCount} receipts (HKD ${totalAmount.toFixed(2)})\n`);

    // CHECKPOINT 6: Export Excel
    console.log('✓ CHECKPOINT 6: Exporting Excel...');
    await logProcessing(batchId, 'info', 'export_start', 'Exporting Excel report');
    wsServer.sendProgress(batchId, { progress: 85, message: 'Exporting Excel...' });

    const exportDir = process.env.EXCEL_OUTPUT_DIR || '/tmp/excel-exports';
    const outputPath = path.join(exportDir, `receipts_${batchId}.xlsx`);
    const fs = require('fs').promises;
    await fs.mkdir(exportDir, { recursive: true });

    const receiptsResult = await db.query(
      `SELECT
        receipt_date, vendor, description, amount, currency, tax_amount,
        receipt_number, payment_method, category_id, category_name,
        deductible, deductible_amount, non_deductible_amount
       FROM receipts
       WHERE batch_id = $1
       ORDER BY receipt_date ASC, vendor ASC`,
      [batchId]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '5ML Agentic AI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Receipts');
    sheet.columns = [
      { header: 'Date', key: 'receipt_date', width: 12 },
      { header: 'Vendor', key: 'vendor', width: 24 },
      { header: 'Description', key: 'description', width: 36 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 8 },
      { header: 'Tax', key: 'tax_amount', width: 10 },
      { header: 'Receipt #', key: 'receipt_number', width: 16 },
      { header: 'Payment', key: 'payment_method', width: 12 },
      { header: 'Category ID', key: 'category_id', width: 12 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Deductible', key: 'deductible', width: 12 },
      { header: 'Deductible Amount', key: 'deductible_amount', width: 18 },
      { header: 'Non-Deductible', key: 'non_deductible_amount', width: 18 }
    ];

    receiptsResult.rows.forEach(row => {
      sheet.addRow({
        receipt_date: row.receipt_date,
        vendor: row.vendor,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        tax_amount: row.tax_amount,
        receipt_number: row.receipt_number,
        payment_method: row.payment_method,
        category_id: row.category_id,
        category_name: row.category_name,
        deductible: row.deductible,
        deductible_amount: row.deductible_amount,
        non_deductible_amount: row.non_deductible_amount
      });
    });

    await workbook.xlsx.writeFile(outputPath);

    await db.query(
      `UPDATE receipt_batches
       SET excel_file_path = $1
       WHERE batch_id = $2`,
      [outputPath, batchId]
    );

    await logProcessing(batchId, 'info', 'export_complete', 'Excel export complete');

    // CHECKPOINT 7: Complete
    console.log('✓ CHECKPOINT 7: Finalizing...');
    await db.query(
      `UPDATE receipt_batches
       SET status = 'completed', completed_at = NOW()
       WHERE batch_id = $1`,
      [batchId]
    );

    wsServer.sendStatus(batchId, {
      status: 'completed',
      progress: 100,
      message: 'Complete!'
    });

    console.log(`✅ BATCH ${batchId} COMPLETE: ${savedCount} receipts, HKD ${totalAmount.toFixed(2)}\n`);
    await logProcessing(batchId, 'info', 'batch_completed', 'Processing completed successfully');

  } catch (error) {
    console.error(`\n❌ ERROR in batch ${batchId}:`, error);
    console.error(error.stack);

    await db.query(
      "UPDATE receipt_batches SET status = 'failed' WHERE batch_id = $1",
      [batchId]
    );

    wsServer.sendStatus(batchId, {
      status: 'failed',
      message: error.message
    });

    await logProcessing(batchId, 'error', 'batch_failed', `Failed: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });
  } finally {
    // Cleanup downloaded files
    if (downloadedFiles.length > 0) {
      try {
        const fs = require('fs').promises;
        for (const file of downloadedFiles) {
          await fs.unlink(file.path).catch(() => {});
        }
        console.log('🗑️  Cleaned up temporary files');
      } catch (err) {
        console.error('Cleanup warning:', err.message);
      }
    }
  }
}

module.exports = { processReceiptBatch };
