'use strict';

/**
 * EventFlow — Super Admin Routes
 * Protected by EVENTFLOW_ADMIN_SECRET header (x-admin-secret).
 * Gives platform-wide visibility and management.
 */

const router = require('express').Router();
const db     = require('../db');
const { pool } = require('../../../../db');

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const secret = process.env.EVENTFLOW_ADMIN_SECRET || '5milesLab01';
  const provided = req.headers['x-admin-secret'] || req.query._secret;
  if (!provided || provided !== secret) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
}

router.use(requireAdmin);

// ─── Platform Stats ───────────────────────────────────────────────────────────

// GET /api/eventflow/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [org, events, attendees, checkins, contacts] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM ef_organizers`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ef_events`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ef_attendees WHERE status != 'cancelled'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ef_attendees WHERE status = 'checked_in'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ef_contacts`),
    ]);
    const [byStatus, recent] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int FROM ef_events GROUP BY status`),
      pool.query(`SELECT e.title, e.start_at, e.status, o.name AS organizer_name,
                    COUNT(a.id)::int AS registered
                  FROM ef_events e
                  JOIN ef_organizers o ON e.organizer_id = o.id
                  LEFT JOIN ef_attendees a ON a.event_id = e.id AND a.status != 'cancelled'
                  GROUP BY e.id, o.name
                  ORDER BY e.created_at DESC LIMIT 5`),
    ]);
    res.json({
      stats: {
        organizers: org.rows[0].count,
        events:     events.rows[0].count,
        attendees:  attendees.rows[0].count,
        checkins:   checkins.rows[0].count,
        contacts:   contacts.rows[0].count,
      },
      byStatus: byStatus.rows,
      recentEvents: recent.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Organizers ───────────────────────────────────────────────────────────────

// GET /api/eventflow/admin/organizers
router.get('/organizers', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.email, o.plan, o.created_at,
              COUNT(DISTINCT e.id)::int        AS event_count,
              COUNT(DISTINCT a.id)::int        AS attendee_count
       FROM ef_organizers o
       LEFT JOIN ef_events e ON e.organizer_id = o.id
       LEFT JOIN ef_attendees a ON a.event_id = e.id AND a.status != 'cancelled'
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json({ organizers: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/admin/organizers/:id
router.patch('/organizers/:id', async (req, res) => {
  try {
    const { plan } = req.body;
    const { rows } = await pool.query(
      `UPDATE ef_organizers SET plan = COALESCE($1, plan), updated_at = NOW()
       WHERE id = $2 RETURNING id, name, email, plan`,
      [plan || null, req.params.id]
    );
    res.json({ organizer: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Events ───────────────────────────────────────────────────────────────────

// GET /api/eventflow/admin/events
router.get('/events', async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    const conds = []; const params = []; let i = 1;
    if (status)   { conds.push(`e.status = $${i++}`);   params.push(status); }
    if (category) { conds.push(`e.category = $${i++}`); params.push(category); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT e.id, e.slug, e.title, e.status, e.is_public, e.category, e.start_at, e.end_at, e.location,
              o.id AS organizer_id, o.name AS organizer_name, o.email AS organizer_email,
              COUNT(a.id)::int    AS registered,
              COUNT(a.id) FILTER (WHERE a.status = 'checked_in')::int AS checked_in
       FROM ef_events e
       JOIN ef_organizers o ON e.organizer_id = o.id
       LEFT JOIN ef_attendees a ON a.event_id = e.id AND a.status != 'cancelled'
       ${where}
       GROUP BY e.id, o.id
       ORDER BY e.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ events: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/admin/events/:id
router.get('/events/:id', async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const [tiers, stats, attendees] = await Promise.all([
      db.listTiers(event.id),
      db.getEventStats(event.id),
      db.listAttendees(event.id, { pageSize: 100 }),
    ]);
    res.json({ event, tiers, stats, attendees: attendees.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/admin/events/:id/status
router.patch('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['draft', 'published', 'ended', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { rows } = await pool.query(
      `UPDATE ef_events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, status`,
      [status, req.params.id]
    );
    res.json({ event: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/eventflow/admin/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ef_events WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Notifications Overview ───────────────────────────────────────────────────

// GET /api/eventflow/admin/notifications
router.get('/notifications', async (req, res) => {
  try {
    const { rows: summary } = await pool.query(
      `SELECT type, channel, status, COUNT(*)::int
       FROM ef_notification_schedule
       GROUP BY type, channel, status
       ORDER BY type, channel, status`
    );
    const { rows: recent } = await pool.query(
      `SELECT ns.id, ns.type, ns.channel, ns.status, ns.scheduled_at, ns.sent_at,
              a.first_name, a.last_name, a.email, e.title AS event_title
       FROM ef_notification_schedule ns
       JOIN ef_attendees a ON ns.attendee_id = a.id
       JOIN ef_events e ON ns.event_id = e.id
       ORDER BY ns.created_at DESC LIMIT 50`
    );
    res.json({ summary, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sponsors (P5) ───────────────────────────────────────────────────────────

router.get('/sponsors', async (req, res) => {
  try {
    const sponsors = await db.listSponsorProfiles();
    const seeking  = await db.listSeekingSponsorEvents();
    const matches  = await db.listSponsorMatches();
    res.json({ sponsors, seeking, matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/sponsors/:id/status', async (req, res) => {
  try {
    const updated = await db.updateSponsorStatus(parseInt(req.params.id), req.body.status);
    res.json({ sponsor: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sponsors/match', async (req, res) => {
  try {
    const { event_id, sponsor_id, notes } = req.body;
    const match = await db.createSponsorMatch(parseInt(event_id), parseInt(sponsor_id), notes);
    res.status(201).json({ match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/sponsors/matches/:id/status', async (req, res) => {
  try {
    const updated = await db.updateSponsorMatchStatus(parseInt(req.params.id), req.body.status);
    res.json({ match: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── KOL (P6) ────────────────────────────────────────────────────────────────

router.get('/kol', async (req, res) => {
  try {
    const profiles = await db.listKolProfiles();
    const briefs   = await db.listAllKolBriefs();
    res.json({ profiles, briefs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/kol/:id/status', async (req, res) => {
  try {
    const updated = await db.updateKolStatus(parseInt(req.params.id), req.body.status);
    res.json({ profile: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Ambassadors (P3) ────────────────────────────────────────────────────────

router.get('/ambassadors', async (req, res) => {
  try {
    const ambassadors = await db.listAmbassadors();
    res.json({ ambassadors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/ambassadors/:id/status', async (req, res) => {
  try {
    const updated = await db.updateAmbassadorStatus(parseInt(req.params.id), req.body.status);
    res.json({ ambassador: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Agency Inquiries (P4) ───────────────────────────────────────────────────

router.get('/inquiries', async (req, res) => {
  try {
    const inquiries = await db.listAgencyInquiries();
    res.json({ inquiries });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/inquiries/:id/status', async (req, res) => {
  try {
    const updated = await db.updateInquiryStatus(parseInt(req.params.id), req.body.status);
    res.json({ inquiry: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
