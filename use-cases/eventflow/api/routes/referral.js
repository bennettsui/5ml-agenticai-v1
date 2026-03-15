'use strict';

/**
 * EventFlow — Referral & Ambassador Routes (P3)
 */

const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// ── Ambassador (public registration) ─────────────────────────────────────────

// POST /api/eventflow/referral/ambassador
router.post('/ambassador', async (req, res) => {
  try {
    const { name, email, social_handle, platform, follower_count, bio, categories } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const amb = await db.createAmbassador({ name, email, social_handle, platform, follower_count, bio, categories });
    res.status(201).json({ ambassador: amb, message: 'Application submitted! We will review and get back to you.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/referral/ambassadors (organizer: see their event ambassadors)
router.get('/ambassadors', requireAuth, async (req, res) => {
  try {
    const ambassadors = await db.listAmbassadors();
    res.json({ ambassadors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Referral Programs (organizer-managed per event) ──────────────────────────

// POST /api/eventflow/referral/programs
router.post('/programs', requireAuth, async (req, res) => {
  try {
    const { event_id, scheme, discount_pct, reward_amount, reward_type } = req.body;
    const event = await db.findEventById(parseInt(event_id));
    if (!event || event.organizer_id !== req.organizer.id)
      return res.status(403).json({ error: 'Not your event' });
    const program = await db.createReferralProgram({ event_id, scheme, discount_pct, reward_amount, reward_type });
    // Auto-generate a referral discount code for the event
    const refCode = 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase();
    await db.createDiscountCode({
      event_id: parseInt(event_id), code: refCode, type: 'percent',
      value: discount_pct || 10, source: 'referral',
    });
    res.status(201).json({ program, ref_code: refCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/referral/programs/:eventId
router.get('/programs/:eventId', requireAuth, async (req, res) => {
  try {
    const program = await db.getReferralProgram(parseInt(req.params.eventId));
    const codes = await db.listDiscountCodes(parseInt(req.params.eventId));
    const refCodes = codes.filter(c => c.source === 'referral');
    res.json({ program, ref_codes: refCodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/referral/validate-code  (public — for registration)
router.post('/validate-code', async (req, res) => {
  try {
    const { event_id, code } = req.body;
    if (!event_id || !code) return res.status(400).json({ error: 'event_id and code required' });
    const discount = await db.validateDiscountCode(parseInt(event_id), code);
    if (!discount) return res.status(404).json({ valid: false, error: 'Invalid or expired code' });
    res.json({ valid: true, type: discount.type, value: discount.value, source: discount.source, id: discount.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
