'use strict';

const router = require('express').Router();
const db     = require('../db');
const { broadcast } = require('../sse');
const { sendConfirmation } = require('../notifications/email');
const { scheduleForAttendee, sendOrganizerPush } = require('../notifications/engine');
const push = require('../notifications/push');

// GET /api/eventflow/public/events  — published public event listing
router.get('/events', async (req, res) => {
  try {
    const { search, category, limit = 20, offset = 0 } = req.query;
    const events = await db.listEvents({
      status: 'published', publicOnly: true,
      search: search || null,
      category: category || null,
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

// GET /api/eventflow/public/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.listCategories();
    res.json({ categories });
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

    const [tiers, stats, formFields] = await Promise.all([
      db.listTiers(event.id),
      db.getEventStats(event.id),
      db.listFormFields(event.id),
    ]);

    // Don't expose checkin_pin or organizer internal data
    const { checkin_pin: _, organizer_email: __, ...safe } = event;
    res.json({ event: { ...safe, tiers, stats, formFields } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/public/events/:slug/form-fields
router.get('/events/:slug/form-fields', async (req, res) => {
  try {
    const event = await db.findEventBySlug(req.params.slug);
    if (!event || event.status !== 'published') return res.status(404).json({ error: 'Event not found' });
    const fields = await db.listFormFields(event.id);
    res.json({ fields });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: strip dangerous HTML/script content from user strings
function sanitizeStr(v, maxLen = 500) {
  if (v == null) return null;
  return String(v)
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[<>'"`;]/g, '')          // strip injection chars
    .trim()
    .substring(0, maxLen) || null;
}

// POST /api/eventflow/public/events/:slug/rsvp
router.post('/events/:slug/rsvp', async (req, res) => {
  try {
    const event = await db.findEventBySlug(req.params.slug);
    if (!event || event.status !== 'published') return res.status(404).json({ error: 'Event not found' });

    const {
      first_name, last_name, email, organization, phone, title,
      tier_id, notify_whatsapp, notify_line, line_user_id,
      custom_responses,  // object: { field_key: value }
      _session_id,       // optional: participant app session ID for push linking
    } = req.body;

    // Sanitize core fields
    const s_first = sanitizeStr(first_name, 100);
    const s_last  = sanitizeStr(last_name, 100);
    const s_email = sanitizeStr(email, 254);
    const s_org   = sanitizeStr(organization, 200);
    const s_phone = sanitizeStr(phone, 30);
    const s_title = sanitizeStr(title, 20);

    if (!s_first || !s_last || !s_email || !s_email.includes('@')) {
      return res.status(400).json({ error: 'first_name, last_name and valid email required' });
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

    // Validate custom form fields
    const formFields = await db.listFormFields(event.id);
    const sanitizedCustom = {};
    for (const field of formFields) {
      const val = custom_responses?.[field.field_key];
      if (field.required && (val == null || String(val).trim() === '')) {
        return res.status(400).json({ error: `Field "${field.label}" is required` });
      }
      if (val != null) {
        sanitizedCustom[field.field_key] = sanitizeStr(String(val), 1000);
      }
    }

    // Upsert contact (email-dedup master record)
    const contact = await db.upsertContact({
      email: s_email, first_name: s_first, last_name: s_last,
      phone: s_phone, organization: s_org, title: s_title,
      source_event_id: event.id,
    });

    // Create attendee (store custom responses in metadata)
    const attendee = await db.createAttendee({
      event_id: event.id,
      tier_id: tier.id,
      contact_id: contact.id,
      first_name: s_first, last_name: s_last, email: s_email,
      phone: s_phone, organization: s_org, title: s_title,
      notify_whatsapp: !!notify_whatsapp,
      notify_line: !!notify_line,
      line_user_id: line_user_id ? sanitizeStr(line_user_id, 100) : null,
      metadata: {
        ...sanitizedCustom,
        ...(_session_id ? { _session_id: String(_session_id).slice(0, 128) } : {}),
      },
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

    // Push notification to organizer (fire-and-forget)
    const { title: pushTitle, body: pushBody } = push.templates.new_attendee(s_first, s_last, event.title);
    sendOrganizerPush(event.organizer_id, pushTitle, pushBody, {
      type: 'new_attendee',
      event_id: event.id,
      event_slug: event.slug,
    }).catch(() => {});

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
