'use strict';

const router = require('express').Router();
const db     = require('../db');
const { broadcast } = require('../sse');
const { sendConfirmation } = require('../notifications/email');
const { scheduleForAttendee } = require('../notifications/engine');

// GET /api/eventflow/public/events  — published event listing
router.get('/events', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    const events = await db.listEvents({
      status: 'published', search: search || null,
      limit: parseInt(limit), offset: parseInt(offset),
    });
    const withTiers = await Promise.all(events.map(async (e) => ({
      ...e,
      tiers: await db.listTiers(e.id),
    })));
    res.json({ events: withTiers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/public/events/:slug
router.get('/events/:slug', async (req, res) => {
  try {
    const event = await db.findEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'published') return res.status(404).json({ error: 'Event not found' });

    const [tiers, stats] = await Promise.all([
      db.listTiers(event.id),
      db.getEventStats(event.id),
    ]);

    // Don't expose checkin_pin or organizer internal data
    const { checkin_pin: _, organizer_email: __, ...safe } = event;
    res.json({ event: { ...safe, tiers, stats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/public/events/:slug/rsvp
router.post('/events/:slug/rsvp', async (req, res) => {
  try {
    const event = await db.findEventBySlug(req.params.slug);
    if (!event || event.status !== 'published') return res.status(404).json({ error: 'Event not found' });

    const {
      first_name, last_name, email, organization, phone, title,
      tier_id, notify_whatsapp, notify_line, line_user_id,
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name and email required' });
    }

    // Validate tier belongs to event
    const tiers = await db.listTiers(event.id);
    const tier = tier_id
      ? tiers.find((t) => t.id === parseInt(tier_id) && t.is_active)
      : tiers[0];

    if (!tier) return res.status(400).json({ error: 'Invalid ticket tier' });

    // Check capacity
    if (tier.capacity && tier.sold >= tier.capacity) {
      return res.status(409).json({ error: 'This ticket tier is sold out' });
    }

    // Upsert contact (email-dedup master record)
    const contact = await db.upsertContact({
      email, first_name, last_name, phone, organization, title,
      source_event_id: event.id,
    });

    // Create attendee
    const attendee = await db.createAttendee({
      event_id: event.id,
      tier_id: tier.id,
      contact_id: contact.id,
      first_name, last_name, email, phone, organization, title,
      notify_whatsapp: !!notify_whatsapp,
      notify_line: !!notify_line,
      line_user_id: line_user_id || null,
    });

    await db.incrementTierSold(tier.id);

    // Fire confirmation email async (don't block response)
    sendConfirmation({ attendee, event, tier }).catch((err) =>
      console.error('[eventflow/rsvp] email error:', err.message)
    );

    // Schedule all future notifications
    scheduleForAttendee(attendee, event).catch((err) =>
      console.error('[eventflow/rsvp] schedule error:', err.message)
    );

    // Broadcast to live dashboards
    broadcast(event.id, 'attendee_registered', {
      id: attendee.id, first_name, last_name, organization, tier_name: tier.name,
    });

    res.status(201).json({
      attendee: {
        id: attendee.id,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        email: attendee.email,
        registration_code: attendee.registration_code,
        tier: tier.name,
        event_title: event.title,
        event_start: event.start_at,
        event_location: event.location,
        event_slug: event.slug,
      },
    });
  } catch (err) {
    console.error('[eventflow/rsvp]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/eventflow/public/qr/:code — serve QR SVG for success page
router.get('/qr/:code', async (req, res) => {
  try {
    const { toSVG } = require('../qr');
    const svg = await toSVG(req.params.code);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    res.status(500).send('');
  }
});

module.exports = router;
