'use strict';

/**
 * EventFlow — KOL / KOC Routes (P6)
 * Public: KOL registration.
 * Organizer: brief creation.
 * Admin: approval + matching in admin.js.
 */

const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// POST /api/eventflow/kol/register  (public)
router.post('/register', async (req, res) => {
  try {
    const { name, handle, platforms, follower_counts, categories,
            bio, contact_email, contact_phone, rate_range } = req.body;
    if (!name || !contact_email) return res.status(400).json({ error: 'name and contact_email required' });
    const profile = await db.createKolProfile({
      name, handle, platforms, follower_counts, categories,
      bio, contact_email, contact_phone, rate_range,
    });
    res.status(201).json({ profile, message: 'Profile submitted for review. We will contact you within 3 business days.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/kol/profiles  (public — active KOLs)
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await db.listKolProfiles('active');
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/kol/briefs  (organizer)
router.post('/briefs', requireAuth, async (req, res) => {
  try {
    const { event_id, budget_range, deliverables, deadline, categories, notes } = req.body;
    const event = await db.findEventById(parseInt(event_id));
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const brief = await db.createKolBrief(parseInt(event_id), req.organizer.id,
      { budget_range, deliverables, deadline, categories, notes });
    res.status(201).json({ brief });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/kol/briefs  (organizer — their briefs)
router.get('/briefs', requireAuth, async (req, res) => {
  try {
    const briefs = await db.listKolBriefs(req.organizer.id);
    res.json({ briefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
