'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Transcription Admin Routes
// Base path: /api/transcription/admin
//
// Exposes error logs, error code definitions, and usage stats for ops/admin use.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const db      = require('../api/db');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transcription/admin/errors
// List recent error logs (newest first).
// Query params: limit (max 500, default 100), offset (default 0)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/errors', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 500);
    const offset = parseInt(req.query.offset || '0', 10);
    const logs   = await db.listErrorLogs({ limit, offset });
    return res.json({ ok: true, logs });
  } catch (err) {
    console.error('[transcription-admin] listErrors error:', err.message);
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transcription/admin/error-codes
// Return all error code definitions with messages.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/error-codes', (_req, res) => {
  const table = Object.entries(db.ERROR_MESSAGES).map(([code, message]) => ({ code, message }));
  return res.json({ ok: true, error_codes: table });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transcription/admin/stats
// Aggregated usage statistics across all transcription jobs.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const stats = await db.getStats();
    return res.json({ ok: true, stats });
  } catch (err) {
    console.error('[transcription-admin] stats error:', err.message);
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
  }
});

module.exports = { router };
