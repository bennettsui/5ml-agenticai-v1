'use strict';

const router = require('express').Router();
const db     = require('../db');
const { broadcast } = require('../sse');

// ─── Kiosk Auth ───────────────────────────────────────────────────────────────

// POST /api/eventflow/checkin/auth
// Kiosk login — validates event + PIN, returns event info
router.post('/auth', async (req, res) => {
  try {
    const { event_id, pin } = req.body;
    if (!event_id || !pin) return res.status(400).json({ error: 'event_id and pin required' });

    const event = await db.findEventById(parseInt(event_id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.checkin_pin !== String(pin)) return res.status(401).json({ error: 'Invalid PIN' });

    const tiers = await db.listTiers(event.id);
    const stats = await db.getEventStats(event.id);
    const { checkin_pin: _, organizer_email: __, password_hash: ___, ...safeEvent } = event;
    res.json({ event: { ...safeEvent, tiers, stats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QR Scan (redirect flow) ──────────────────────────────────────────────────

// GET /api/eventflow/checkin/scan/:code
// Browser-based QR scan redirect — sends attendee to their QR page
router.get('/scan/:code', async (req, res) => {
  try {
    const attendee = await db.findAttendeeByCode(req.params.code);
    if (!attendee) return res.status(404).send('QR code not found');
    res.redirect(`/eventflow/success?code=${req.params.code}`);
  } catch (err) {
    res.status(500).send('Error processing QR code');
  }
});

// POST /api/eventflow/checkin/scan/:code
// Kiosk QR scan — returns attendee info for display
router.post('/scan/:code', async (req, res) => {
  try {
    const attendee = await db.findAttendeeByCode(req.params.code);
    if (!attendee) return res.status(404).json({ error: 'Invalid QR code' });

    res.json({
      attendee: {
        id: attendee.id,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        organization: attendee.organization,
        tier_name: attendee.tier_name,
        tier_color: attendee.tier_color,
        status: attendee.status,
        registration_code: attendee.registration_code,
        event_id: attendee.event_id,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/checkin/checkin/:id
// Check in by attendee ID (after scan confirms)
router.post('/checkin/:id', async (req, res) => {
  try {
    const attendee = await db.checkInAttendee(parseInt(req.params.id));
    if (!attendee) {
      // May already be checked in — return current state
      const current = await db.findAttendeeById(parseInt(req.params.id));
      if (current?.status === 'checked_in') {
        return res.json({ attendee: current, already: true });
      }
      return res.status(404).json({ error: 'Attendee not found' });
    }

    broadcast(attendee.event_id, 'attendee_checkedin', {
      id: attendee.id,
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      organization: attendee.organization,
    });

    res.json({ attendee, already: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/checkin/events/:id/search?q=...
// Manual name search for kiosk
router.get('/events/:id/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ attendees: [] });
    const attendees = await db.searchAttendees(parseInt(req.params.id), q.trim());
    res.json({ attendees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/checkin/events/:id/stats
// Live stats for kiosk display
router.get('/events/:id/stats', async (req, res) => {
  try {
    const stats = await db.getEventStats(parseInt(req.params.id));
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SSE for kiosk live updates
router.get('/events/:id/stream', (req, res) => {
  const eventId = parseInt(req.params.id);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);

  const { addClient, removeClient } = require('../sse');
  addClient(eventId, res);

  const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch { clearInterval(hb); } }, 25000);
  req.on('close', () => { clearInterval(hb); removeClient(eventId, res); });
});

module.exports = router;
