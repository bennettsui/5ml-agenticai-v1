'use strict';

/**
 * EventFlow — Discount Code Routes (P1)
 * Organizer manages codes per event. Public validate endpoint for registration.
 */

const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const { requireAuth } = require('../auth');

// POST /api/eventflow/events/:eventId/discounts
router.post('/', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });

    const { code, type, value, max_uses, expires_at } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'code and value required' });
    if (type === 'percent' && (value < 1 || value > 100))
      return res.status(400).json({ error: 'percent must be 1-100' });

    const discount = await db.createDiscountCode({ event_id: eventId, code, type, value, max_uses, expires_at });
    res.status(201).json({ discount });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code already exists for this event' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/events/:eventId/discounts
router.get('/', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const codes = await db.listDiscountCodes(eventId);
    res.json({ codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/events/:eventId/discounts/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const updated = await db.updateDiscountCode(parseInt(req.params.id), eventId, req.body);
    res.json({ discount: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/eventflow/events/:eventId/discounts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    await db.deleteDiscountCode(parseInt(req.params.id), eventId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/public/:slug/validate-code  (mounted separately in public.js)
// We expose a standalone validate endpoint here too for direct use
router.post('/validate', async (req, res) => {
  try {
    const { event_id, code } = req.body;
    if (!event_id || !code) return res.status(400).json({ error: 'event_id and code required' });
    const discount = await db.validateDiscountCode(parseInt(event_id), code);
    if (!discount) return res.status(404).json({ error: 'Invalid or expired code' });
    res.json({ valid: true, type: discount.type, value: discount.value, id: discount.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
