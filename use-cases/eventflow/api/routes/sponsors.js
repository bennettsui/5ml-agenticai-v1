'use strict';

/**
 * EventFlow — Sponsor Routes (P5)
 * Public: sponsor registration.
 * Organizer: set seeking flag on event.
 * Admin: managed separately in admin.js.
 */

const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// POST /api/eventflow/sponsors/register  (public)
router.post('/register', async (req, res) => {
  try {
    const { company, contact_name, contact_email, contact_phone,
            industries, event_types, budget_range, description, website } = req.body;
    if (!company || !contact_email) return res.status(400).json({ error: 'company and contact_email required' });
    const sponsor = await db.createSponsorProfile({
      company, contact_name, contact_email, contact_phone,
      industries, event_types, budget_range, description, website,
    });
    res.status(201).json({ sponsor, message: 'Registration received. Our team will reach out within 2 business days.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/sponsors/seeking  (public — events seeking sponsors)
router.get('/seeking', async (req, res) => {
  try {
    const events = await db.listSeekingSponsorEvents();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/sponsors/events/:eventId/flag  (organizer)
router.post('/events/:eventId/flag', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const { seeking, brief, package_types, budget_range } = req.body;
    const flag = await db.upsertEventSponsorFlag(eventId, { seeking, brief, package_types, budget_range });
    res.json({ flag });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/sponsors/events/:eventId/flag  (organizer)
router.get('/events/:eventId/flag', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await db.findEventById(eventId);
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const flag = await db.getEventSponsorFlag(eventId);
    res.json({ flag: flag || { event_id: eventId, seeking: false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
