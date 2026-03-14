'use strict';

const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../auth');
const { broadcast } = require('../sse');

// ─── Event CRUD ───────────────────────────────────────────────────────────────

// GET /api/eventflow/events
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;
    const events = await db.listEvents({
      organizerId: req.organizer.id,
      status: status || null,
      search: search || null,
      limit: parseInt(limit), offset: parseInt(offset),
    });
    // attach tiers to each event
    const withTiers = await Promise.all(events.map(async (e) => ({
      ...e,
      tiers: await db.listTiers(e.id),
      stats: await db.getEventStats(e.id),
    })));
    res.json({ events: withTiers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/events
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, banner_url, location, location_detail,
            start_at, end_at, timezone, capacity, checkin_pin, settings, tiers } = req.body;

    if (!title) return res.status(400).json({ error: 'title required' });
    if (!start_at || !end_at) return res.status(400).json({ error: 'start_at and end_at required' });

    const event = await db.createEvent(req.organizer.id, {
      title, description, banner_url, location, location_detail,
      start_at, end_at, timezone, capacity, checkin_pin, settings,
    });

    // Create default tier if none provided
    const tierDefs = tiers?.length ? tiers : [{ name: 'General Admission', price: 0, color: 'Blue' }];
    const createdTiers = await Promise.all(tierDefs.map((t) => db.createTier(event.id, t)));

    res.status(201).json({ event: { ...event, tiers: createdTiers } });
  } catch (err) {
    console.error('[eventflow/events/create]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/events/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });

    const [tiers, stats] = await Promise.all([
      db.listTiers(event.id),
      db.getEventStats(event.id),
    ]);
    res.json({ event: { ...event, tiers, stats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/events/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.updateEvent(id, req.organizer.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Event not found or not yours' });
    res.json({ event: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/eventflow/events/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteEvent(parseInt(req.params.id), req.organizer.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/events/:id/publish
router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.updateEvent(id, req.organizer.id, { status: 'published' });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json({ event: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tiers ────────────────────────────────────────────────────────────────────

// POST /api/eventflow/events/:id/tiers
router.post('/:id/tiers', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const tier = await db.createTier(event.id, req.body);
    res.status(201).json({ tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/events/:id/tiers/:tierId
router.patch('/:id/tiers/:tierId', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const tier = await db.updateTier(parseInt(req.params.tierId), event.id, req.body);
    res.json({ tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/eventflow/events/:id/tiers/:tierId
router.delete('/:id/tiers/:tierId', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    await db.deleteTier(parseInt(req.params.tierId), event.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendee Management (Organizer) ─────────────────────────────────────────

// GET /api/eventflow/events/:id/attendees
router.get('/:id/attendees', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });

    const { status, tier_id, page = 1, pageSize = 50, query } = req.query;
    const result = await db.listAttendees(event.id, {
      status: status || null, tier_id: tier_id ? parseInt(tier_id) : null,
      page: parseInt(page), pageSize: parseInt(pageSize), query: query || null,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/events/:id/stats
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const stats = await db.getEventStats(event.id);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SSE stream for live dashboard
router.get('/:id/stream', requireAuth, (req, res) => {
  const eventId = parseInt(req.params.id);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);

  const { addClient, removeClient } = require('../sse');
  addClient(eventId, res);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => { clearInterval(heartbeat); removeClient(eventId, res); });
});

// Manual check-in from admin
router.post('/:id/attendees/:attendeeId/checkin', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });

    const attendee = await db.checkInAttendee(parseInt(req.params.attendeeId));
    if (!attendee) return res.status(409).json({ error: 'Already checked in or not found' });

    broadcast(event.id, 'attendee_checkedin', { attendee });
    res.json({ attendee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Form Fields ──────────────────────────────────────────────────────────────

// GET /api/eventflow/events/:id/form-fields  (also used publicly via public routes)
router.get('/:id/form-fields', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const fields = await db.listFormFields(event.id);
    res.json({ fields });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/eventflow/events/:id/form-fields
router.post('/:id/form-fields', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const { field_key, field_type, label, placeholder, required, options, sort_order } = req.body;
    if (!label || !field_key) return res.status(400).json({ error: 'label and field_key are required' });
    const field = await db.createFormField(event.id, { field_key, field_type, label, placeholder, required, options, sort_order });
    res.status(201).json({ field });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Field key already exists for this event' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/events/:id/form-fields/:fid
router.patch('/:id/form-fields/:fid', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const field = await db.updateFormField(parseInt(req.params.fid), event.id, req.body);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    res.json({ field });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/eventflow/events/:id/form-fields/:fid
router.delete('/:id/form-fields/:fid', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    await db.deleteFormField(parseInt(req.params.fid), event.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
