/**
 * API Routes for Man's Accounting Firm Receipt Tracking
 *
 * Endpoints for receipt processing workflow:
 * - POST /receipts/process - Start new batch processing
 * - GET /receipts/batches - List processing batches
 * - GET /receipts/batches/:batchId - Get batch details
 * - GET /receipts/batches/:batchId/status - Get real-time status
 * - GET /receipts/batches/:batchId/download - Download Excel export
 * - GET /receipts/:receiptId - Get individual receipt details
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const path = require('path');
const fs = require('fs').promises;
const { processReceiptBatch } = require('../lib/batch-processor');

// Import tools (will be compiled from TypeScript)
// For now, using placeholder functions - will be replaced with actual imports

/**
 * POST /receipts/process
 *
 * Start processing receipts from Dropbox folder
 *
 * Body:
 * {
 *   "client_name": "Man's Accounting Firm",
 *   "dropbox_url": "https://www.dropbox.com/sh/abc123",
 *   "period_start": "2026-01-01",
 *   "period_end": "2026-01-31"
 * }
 */
router.post('/process', async (req, res) => {
  try {
    const { client_name, dropbox_url, period_start, period_end } = req.body;

    // Validate required fields
    if (!client_name || !dropbox_url) {
      return res.status(400).json({
        success: false,
        error: 'client_name and dropbox_url are required',
      });
    }

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is not set. Please configure PostgreSQL database.',
        help: 'Run: fly postgres create && fly postgres attach <postgres-app-name>',
      });
    }

    // Create new batch in database
    const batchResult = await db.query(
      `INSERT INTO receipt_batches (
        client_name, dropbox_url, status, period_start, period_end
      ) VALUES ($1, $2, 'pending', $3, $4)
      RETURNING batch_id, created_at`,
      [client_name, dropbox_url, period_start || null, period_end || null]
    );

    const batchId = batchResult.rows[0].batch_id;

    // Log the start of processing
    await db.query(
      `INSERT INTO processing_logs (batch_id, log_level, step, message)
       VALUES ($1, 'info', 'batch_created', 'New batch created for processing')`,
      [batchId]
    );

    // Start async processing (don't wait for completion)
    processReceiptBatch(batchId, dropbox_url, client_name).catch(error => {
      console.error(`Error processing batch ${batchId}:`, error);
    });

    res.json({
      success: true,
      batch_id: batchId,
      status: 'pending',
      message: 'Receipt processing started. Use /batches/:batchId/status to check progress.',
      created_at: batchResult.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error starting receipt processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start receipt processing',
      details: error.message,
    });
  }
});

/**
 * GET /receipts/batches
 *
 * List all processing batches (paginated)
 */
router.get('/batches', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, client_name } = req.query;

    let query = 'SELECT * FROM v_recent_batches WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (client_name) {
      paramCount++;
      query += ` AND client_name ILIKE $${paramCount}`;
      params.push(`%${client_name}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM receipt_batches WHERE 1=1' +
        (status ? ` AND status = '${status}'` : '') +
        (client_name ? ` AND client_name ILIKE '%${client_name}%'` : '')
    );

    res.json({
      success: true,
      batches: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batches',
    });
  }
});

/**
 * GET /receipts/batches/:batchId
 *
 * Get detailed batch information with receipts
 */
router.get('/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch info
    const batchResult = await db.query(
      'SELECT * FROM receipt_batches WHERE batch_id = $1',
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    const batch = batchResult.rows[0];

    // Get receipts
    const receiptsResult = await db.query(
      `SELECT
        receipt_id, receipt_date, vendor, description, amount, currency,
        category_id, category_name, deductible_amount, non_deductible_amount,
        categorization_confidence, requires_review, reviewed
       FROM receipts
       WHERE batch_id = $1
       ORDER BY receipt_date DESC`,
      [batchId]
    );

    // Get category statistics
    const statsResult = await db.query(
      'SELECT * FROM category_statistics WHERE batch_id = $1 ORDER BY total_amount DESC',
      [batchId]
    );

    res.json({
      success: true,
      batch,
      receipts: receiptsResult.rows,
      category_statistics: statsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch details',
    });
  }
});

/**
 * GET /receipts/batches/:batchId/status
 *
 * Get real-time processing status
 */
router.get('/batches/:batchId/status', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await db.query(
      `SELECT
        batch_id, status, total_receipts, processed_receipts, failed_receipts,
        total_amount, deductible_amount, created_at, updated_at
       FROM receipt_batches
       WHERE batch_id = $1`,
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    const batch = result.rows[0];

    // Calculate progress
    const progress =
      batch.total_receipts > 0
        ? Math.round((batch.processed_receipts / batch.total_receipts) * 100)
        : 0;

    // Get recent logs
    const logsResult = await db.query(
      `SELECT log_level, step, message, created_at
       FROM processing_logs
       WHERE batch_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [batchId]
    );

    res.json({
      success: true,
      batch_id: batch.batch_id,
      status: batch.status,
      progress,
      total_receipts: batch.total_receipts,
      processed_receipts: batch.processed_receipts,
      failed_receipts: batch.failed_receipts,
      total_amount: parseFloat(batch.total_amount || 0),
      deductible_amount: parseFloat(batch.deductible_amount || 0),
      recent_logs: logsResult.rows,
      updated_at: batch.updated_at,
    });
  } catch (error) {
    console.error('Error fetching batch status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch status',
    });
  }
});

/**
 * GET /receipts/batches/:batchId/download
 *
 * Download Excel export for completed batch
 */
router.get('/batches/:batchId/download', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await db.query(
      'SELECT status, excel_file_path, client_name FROM receipt_batches WHERE batch_id = $1',
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    const batch = result.rows[0];

    if (batch.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Batch processing not completed yet',
        status: batch.status,
      });
    }

    if (!batch.excel_file_path) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not available',
      });
    }

    // Check if file exists
    try {
      await fs.access(batch.excel_file_path);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found on server',
      });
    }

    // Send file
    const filename = `${batch.client_name.replace(/[^a-zA-Z0-9]/g, '_')}_receipts_${batchId.substring(0, 8)}.xlsx`;

    res.download(batch.excel_file_path, filename, err => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download file',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error preparing download:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to prepare download',
    });
  }
});

/**
 * GET /receipts/:receiptId
 *
 * Get individual receipt details
 */
router.get('/:receiptId', async (req, res) => {
  try {
    const { receiptId } = req.params;

    const result = await db.query(
      'SELECT * FROM receipts WHERE receipt_id = $1',
      [receiptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    res.json({
      success: true,
      receipt: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt',
    });
  }
});

/**
 * GET /receipts/analytics/categories
 *
 * Get category breakdown analytics
 */
router.get('/analytics/categories', async (req, res) => {
  try {
    const { batch_id } = req.query;

    let query = 'SELECT * FROM v_category_breakdown';
    const params = [];

    if (batch_id) {
      query = `
        SELECT
          category_id, category_name,
          COUNT(*) as receipt_count,
          SUM(amount) as total_amount,
          SUM(deductible_amount) as deductible_amount,
          SUM(non_deductible_amount) as non_deductible_amount,
          AVG(categorization_confidence) as avg_confidence
        FROM receipts
        WHERE batch_id = $1
        GROUP BY category_id, category_name
        ORDER BY total_amount DESC
      `;
      params.push(batch_id);
    }

    const result = await db.query(query, params);

    res.json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category analytics',
    });
  }
});

/**
 * GET /receipts/analytics/compliance
 *
 * Get compliance issues summary
 */
router.get('/analytics/compliance', async (req, res) => {
  try {
    const { batch_id } = req.query;

    let query = 'SELECT * FROM v_compliance_issues';
    const params = [];

    if (batch_id) {
      query += ' WHERE batch_id = $1';
      params.push(batch_id);
    }

    query += ' ORDER BY error_count DESC, warning_count DESC LIMIT 100';

    const result = await db.query(query, params);

    res.json({
      success: true,
      compliance_issues: result.rows,
      total_issues: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching compliance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance analytics',
    });
  }
});

// =============================================================================
// OCR VIEWER ENDPOINTS
// =============================================================================

const ocrViewerRouter = require('./ocr-viewer');
router.use('/', ocrViewerRouter);

// =============================================================================
// DATABASE INITIALIZATION ENDPOINT
// =============================================================================

const initDbRouter = require('./init-db-endpoint');
router.use('/', initDbRouter);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// processReceiptBatch function moved to ../lib/batch-processor.js

module.exports = router;
