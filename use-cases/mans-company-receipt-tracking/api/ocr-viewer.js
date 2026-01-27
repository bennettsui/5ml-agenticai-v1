/**
 * OCR Viewer API Routes
 * Endpoints for viewing receipts with bounding box overlays
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const path = require('path');
const fs = require('fs').promises;

/**
 * GET /api/receipts/:receiptId/ocr-data
 *
 * Get OCR visualization data for a receipt
 * Returns: receipt data + bounding boxes + image URL
 */
router.get('/:receiptId/ocr-data', async (req, res) => {
  try {
    const { receiptId } = req.params;

    // Get receipt with batch info
    const result = await db.query(
      `SELECT r.*, rb.batch_id as batch_uuid
       FROM receipts r
       JOIN receipt_batches rb ON r.batch_id = rb.batch_id
       WHERE r.receipt_id = $1`,
      [receiptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    const receipt = result.rows[0];

    res.json({
      success: true,
      receipt_id: receipt.receipt_id,
      image_url: `/api/receipts/${receiptId}/image`,
      image_filename: receipt.image_path,
      ocr_boxes: receipt.ocr_boxes || [],
      structured_data: {
        vendor: receipt.vendor,
        date: receipt.receipt_date,
        amount: parseFloat(receipt.amount),
        currency: receipt.currency,
        description: receipt.description,
        receipt_number: receipt.receipt_number,
        payment_method: receipt.payment_method,
        category: receipt.category_name,
        confidence: parseFloat(receipt.ocr_confidence || 0),
      },
      raw_text: receipt.ocr_raw_text,
    });
  } catch (error) {
    console.error('Error fetching OCR data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch OCR data',
    });
  }
});

/**
 * GET /api/receipts/:receiptId/image
 *
 * Serve the receipt image file
 * Note: Images are stored in /tmp/receipts/{batchId}/
 */
router.get('/:receiptId/image', async (req, res) => {
  try {
    const { receiptId } = req.params;

    // Get receipt with batch info
    const result = await db.query(
      `SELECT r.image_path, rb.batch_id
       FROM receipts r
       JOIN receipt_batches rb ON r.batch_id = rb.batch_id
       WHERE r.receipt_id = $1`,
      [receiptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    const { image_path, batch_id } = result.rows[0];
    const imagePath = path.join('/tmp/receipts', batch_id, image_path);

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found (may have been cleaned up)',
        hint: 'Consider implementing permanent storage (S3, Fly volumes)',
      });
    }

    // Determine content type
    const ext = path.extname(image_path).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Stream the file
    const fileStream = require('fs').createReadStream(imagePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve image',
    });
  }
});

/**
 * GET /api/receipts/batch/:batchId/receipts
 *
 * List all receipts in a batch with OCR preview data
 */
router.get('/batch/:batchId/receipts', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await db.query(
      `SELECT
        receipt_id, image_path, vendor, receipt_date,
        amount, currency, ocr_confidence,
        CASE WHEN ocr_boxes IS NOT NULL THEN true ELSE false END as has_ocr_boxes
       FROM receipts
       WHERE batch_id = $1
       ORDER BY receipt_date DESC, created_at DESC`,
      [batchId]
    );

    res.json({
      success: true,
      batch_id: batchId,
      receipts: result.rows.map(r => ({
        receipt_id: r.receipt_id,
        image_filename: r.image_path,
        image_url: `/api/receipts/${r.receipt_id}/image`,
        ocr_data_url: `/api/receipts/${r.receipt_id}/ocr-data`,
        vendor: r.vendor,
        date: r.receipt_date,
        amount: parseFloat(r.amount),
        currency: r.currency,
        confidence: parseFloat(r.ocr_confidence || 0),
        has_visualization: r.has_ocr_boxes,
      })),
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching batch receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch receipts',
    });
  }
});

module.exports = router;
