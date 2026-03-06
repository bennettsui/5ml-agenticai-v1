'use strict';

/**
 * routes/checkin.js
 * Public check-in API — used by reception staff on the check-in page.
 *
 * Mounted at: /api/participants
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─── GET /api/participants/search?query=... ────────────────────────────────────
// Returns up to 100 participants matching the free-text query across
// full_name, first_name, last_name, organization, color.
router.get('/search', (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) return res.json([]);

  try {
    const rows = db.search(query);
    res.json(rows);
  } catch (err) {
    console.error('[search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── POST /api/participants/:id/checkin ───────────────────────────────────────
// Sets status = "checked_in", optionally saves remarks.
// Broadcasts "participant_updated" to all connected WS clients.
router.post('/:id/checkin', (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : undefined;

  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updates = { status: 'checked_in' };
    if (remarks !== undefined) updates.remarks = remarks;

    const updated = db.update(id, updates);
    req.app.locals.io.emit('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[checkin]', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// ─── POST /api/participants/:id/remarks ───────────────────────────────────────
// Updates remarks only, without changing status.
// Broadcasts "participant_updated" to all connected WS clients.
router.post('/:id/remarks', (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : '';

  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updated = db.update(id, { remarks });
    req.app.locals.io.emit('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[remarks]', err);
    res.status(500).json({ error: 'Remarks update failed' });
  }
});

// ─── POST /api/participants ───────────────────────────────────────────────────
// Creates a new participant (from "add new" on the check-in page).
// Broadcasts "participant_created" to all connected WS clients.
router.post('/', (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, remarks } = req.body;

  if (!color || !full_name) {
    return res.status(400).json({ error: 'color and full_name are required' });
  }
  if (!['Red','Purple','Blue','Green'].includes(color)) {
    return res.status(400).json({ error: 'color must be Red, Purple, Blue, or Green' });
  }

  try {
    const participant = db.insert({ color, title, first_name, last_name, full_name, organization, remarks });
    req.app.locals.io.emit('participant_created', { type: 'participant_created', payload: participant });
    res.status(201).json(participant);
  } catch (err) {
    console.error('[create participant]', err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

module.exports = router;
