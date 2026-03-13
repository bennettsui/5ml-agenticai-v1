'use strict';

/**
 * EventFlow — Database Layer (PostgreSQL)
 * All tables prefixed with ef_ to avoid collisions.
 * RD Symposium data stays in event_checkin_participants (untouched).
 */

const { pool } = require('../../../db');

// ─── Schema Init ──────────────────────────────────────────────────────────────

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_organizers (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'free',
      stripe_account_id TEXT,
      settings      JSONB NOT NULL DEFAULT '{}',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_events (
      id             SERIAL PRIMARY KEY,
      organizer_id   INTEGER NOT NULL REFERENCES ef_organizers(id) ON DELETE CASCADE,
      slug           TEXT UNIQUE NOT NULL,
      title          TEXT NOT NULL,
      description    TEXT,
      banner_url     TEXT,
      location       TEXT,
      location_detail JSONB NOT NULL DEFAULT '{}',
      start_at       TIMESTAMPTZ NOT NULL,
      end_at         TIMESTAMPTZ NOT NULL,
      timezone       TEXT NOT NULL DEFAULT 'Asia/Hong_Kong',
      status         TEXT NOT NULL DEFAULT 'draft'
                       CHECK(status IN ('draft','published','ended','cancelled')),
      capacity       INTEGER,
      checkin_pin    TEXT NOT NULL DEFAULT '0000',
      settings       JSONB NOT NULL DEFAULT '{}',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_ticket_tiers (
      id          SERIAL PRIMARY KEY,
      event_id    INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      price       INTEGER NOT NULL DEFAULT 0,
      currency    TEXT NOT NULL DEFAULT 'HKD',
      capacity    INTEGER,
      sold        INTEGER NOT NULL DEFAULT 0,
      color       TEXT NOT NULL DEFAULT 'Blue',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_contacts (
      id             SERIAL PRIMARY KEY,
      email          TEXT UNIQUE NOT NULL,
      first_name     TEXT,
      last_name      TEXT,
      phone          TEXT,
      organization   TEXT,
      title          TEXT,
      metadata       JSONB NOT NULL DEFAULT '{}',
      source_event_id INTEGER REFERENCES ef_events(id),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_attendees (
      id                SERIAL PRIMARY KEY,
      event_id          INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE,
      tier_id           INTEGER REFERENCES ef_ticket_tiers(id),
      contact_id        INTEGER REFERENCES ef_contacts(id),
      registration_code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
      status            TEXT NOT NULL DEFAULT 'registered'
                          CHECK(status IN ('registered','checked_in','cancelled')),
      title             TEXT,
      first_name        TEXT NOT NULL,
      last_name         TEXT NOT NULL,
      organization      TEXT,
      email             TEXT NOT NULL,
      phone             TEXT,
      remarks           TEXT,
      notify_whatsapp   BOOLEAN NOT NULL DEFAULT false,
      notify_line       BOOLEAN NOT NULL DEFAULT false,
      line_user_id      TEXT,
      metadata          JSONB NOT NULL DEFAULT '{}',
      checked_in_at     TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_payments (
      id          SERIAL PRIMARY KEY,
      attendee_id INTEGER NOT NULL REFERENCES ef_attendees(id),
      amount      INTEGER NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'HKD',
      platform_fee INTEGER NOT NULL DEFAULT 0,
      gateway     TEXT NOT NULL DEFAULT 'stripe',
      gateway_ref TEXT,
      status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','paid','refunded','failed')),
      paid_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_notification_schedule (
      id           SERIAL PRIMARY KEY,
      attendee_id  INTEGER NOT NULL REFERENCES ef_attendees(id) ON DELETE CASCADE,
      event_id     INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE,
      contact_id   INTEGER REFERENCES ef_contacts(id),
      type         TEXT NOT NULL,
      channel      TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      sent_at      TIMESTAMPTZ,
      status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK(status IN ('pending','sent','failed','skipped')),
      error        TEXT,
      provider_ref TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_ns_pending ON ef_notification_schedule(scheduled_at) WHERE status = 'pending';`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_attendees_event ON ef_attendees(event_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_attendees_code ON ef_attendees(registration_code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_events_slug ON ef_events(slug);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_events_status ON ef_events(status);`);

  console.log('[eventflow] DB tables ready');
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 40) || 'event';
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// ─── Organizer ────────────────────────────────────────────────────────────────

async function createOrganizer({ name, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_organizers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, plan, created_at`,
    [name, email, passwordHash]
  );
  return rows[0];
}

async function findOrganizerByEmail(email) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_organizers WHERE email = $1`, [email.toLowerCase()]
  );
  return rows[0] || null;
}

async function findOrganizerById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, email, plan, stripe_account_id, settings, created_at FROM ef_organizers WHERE id = $1`, [id]
  );
  return rows[0] || null;
}

async function updateOrganizer(id, fields) {
  const allowed = ['name', 'settings', 'stripe_account_id'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return findOrganizerById(id);
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE ef_organizers SET ${set}, updated_at = NOW() WHERE id = $${entries.length + 1} RETURNING id, name, email, plan, settings`,
    [...entries.map(([, v]) => v), id]
  );
  return rows[0];
}

// ─── Events ───────────────────────────────────────────────────────────────────

async function createEvent(organizerId, data) {
  const slug = await resolveSlug(data.slug || generateSlug(data.title));
  const { rows } = await pool.query(
    `INSERT INTO ef_events
       (organizer_id, slug, title, description, banner_url, location, location_detail,
        start_at, end_at, timezone, capacity, checkin_pin, settings)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      organizerId, slug, data.title, data.description || null,
      data.banner_url || null, data.location || null,
      JSON.stringify(data.location_detail || {}),
      data.start_at, data.end_at,
      data.timezone || 'Asia/Hong_Kong',
      data.capacity || null,
      data.checkin_pin || String(Math.floor(1000 + Math.random() * 9000)),
      JSON.stringify(data.settings || {}),
    ]
  );
  return rows[0];
}

async function resolveSlug(slug, attempt = 0) {
  const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
  const { rows } = await pool.query(`SELECT id FROM ef_events WHERE slug = $1`, [candidate]);
  if (!rows.length) return candidate;
  return resolveSlug(slug, attempt + 1);
}

async function updateEvent(id, organizerId, fields) {
  const allowed = ['title','description','banner_url','location','location_detail',
                   'start_at','end_at','timezone','capacity','checkin_pin','settings','status'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return findEventById(id);
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const vals = [...entries.map(([, v]) => v), id, organizerId];
  const { rows } = await pool.query(
    `UPDATE ef_events SET ${set}, updated_at = NOW() WHERE id = $${entries.length + 1} AND organizer_id = $${entries.length + 2} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

async function findEventBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT e.*, o.name AS organizer_name, o.email AS organizer_email
     FROM ef_events e JOIN ef_organizers o ON e.organizer_id = o.id
     WHERE e.slug = $1`, [slug]
  );
  return rows[0] || null;
}

async function findEventById(id) {
  const { rows } = await pool.query(
    `SELECT e.*, o.name AS organizer_name, o.email AS organizer_email
     FROM ef_events e JOIN ef_organizers o ON e.organizer_id = o.id
     WHERE e.id = $1`, [id]
  );
  return rows[0] || null;
}

async function listEvents({ organizerId, status, search, limit = 20, offset = 0 } = {}) {
  const conds = []; const params = []; let i = 1;
  if (organizerId) { conds.push(`e.organizer_id = $${i++}`); params.push(organizerId); }
  if (status)      { conds.push(`e.status = $${i++}`);       params.push(status); }
  if (search)      { conds.push(`(e.title ILIKE $${i} OR e.location ILIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT e.*, o.name AS organizer_name
     FROM ef_events e JOIN ef_organizers o ON e.organizer_id = o.id
     ${where} ORDER BY e.start_at ASC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return rows;
}

async function deleteEvent(id, organizerId) {
  await pool.query(`DELETE FROM ef_events WHERE id = $1 AND organizer_id = $2`, [id, organizerId]);
}

// ─── Ticket Tiers ─────────────────────────────────────────────────────────────

async function createTier(eventId, data) {
  const { rows } = await pool.query(
    `INSERT INTO ef_ticket_tiers (event_id, name, description, price, currency, capacity, color, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [eventId, data.name, data.description || null, data.price || 0,
     data.currency || 'HKD', data.capacity || null,
     data.color || 'Blue', data.sort_order || 0]
  );
  return rows[0];
}

async function listTiers(eventId) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_ticket_tiers WHERE event_id = $1 ORDER BY sort_order, id`, [eventId]
  );
  return rows;
}

async function updateTier(id, eventId, fields) {
  const allowed = ['name','description','price','currency','capacity','color','sort_order','is_active'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return null;
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE ef_ticket_tiers SET ${set} WHERE id = $${entries.length + 1} AND event_id = $${entries.length + 2} RETURNING *`,
    [...entries.map(([, v]) => v), id, eventId]
  );
  return rows[0];
}

async function deleteTier(id, eventId) {
  await pool.query(`DELETE FROM ef_ticket_tiers WHERE id = $1 AND event_id = $2`, [id, eventId]);
}

async function incrementTierSold(tierId) {
  await pool.query(`UPDATE ef_ticket_tiers SET sold = sold + 1 WHERE id = $1`, [tierId]);
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

async function upsertContact({ email, first_name, last_name, phone, organization, title, source_event_id }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_contacts (email, first_name, last_name, phone, organization, title, source_event_id, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (email) DO UPDATE SET
       first_name   = COALESCE(EXCLUDED.first_name, ef_contacts.first_name),
       last_name    = COALESCE(EXCLUDED.last_name,  ef_contacts.last_name),
       phone        = COALESCE(EXCLUDED.phone,       ef_contacts.phone),
       organization = COALESCE(EXCLUDED.organization,ef_contacts.organization),
       title        = COALESCE(EXCLUDED.title,       ef_contacts.title),
       last_seen_at = NOW()
     RETURNING *`,
    [email.toLowerCase(), first_name || null, last_name || null,
     phone || null, organization || null, title || null, source_event_id || null]
  );
  return rows[0];
}

async function listContacts({ organizerId, search, limit = 50, offset = 0 }) {
  const { rows } = await pool.query(
    `SELECT DISTINCT c.*, COUNT(a.id)::int AS event_count
     FROM ef_contacts c
     JOIN ef_attendees a ON a.contact_id = c.id
     JOIN ef_events e ON a.event_id = e.id
     WHERE e.organizer_id = $1
       AND ($2::text IS NULL OR c.email ILIKE $2 OR c.first_name ILIKE $2 OR c.last_name ILIKE $2 OR c.organization ILIKE $2)
     GROUP BY c.id
     ORDER BY c.last_seen_at DESC
     LIMIT $3 OFFSET $4`,
    [organizerId, search ? `%${search}%` : null, limit, offset]
  );
  return rows;
}

// ─── Attendees ────────────────────────────────────────────────────────────────

async function createAttendee(data) {
  const { rows } = await pool.query(
    `INSERT INTO ef_attendees
       (event_id, tier_id, contact_id, title, first_name, last_name,
        organization, email, phone, remarks, notify_whatsapp, notify_line, line_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [data.event_id, data.tier_id || null, data.contact_id || null,
     data.title || null, data.first_name, data.last_name,
     data.organization || null, data.email.toLowerCase(),
     data.phone || null, data.remarks || null,
     data.notify_whatsapp || false, data.notify_line || false,
     data.line_user_id || null]
  );
  return rows[0];
}

async function findAttendeeByCode(code) {
  const { rows } = await pool.query(
    `SELECT a.*, e.title AS event_title, e.start_at, e.end_at, e.location,
            t.name AS tier_name, t.color AS tier_color
     FROM ef_attendees a
     JOIN ef_events e ON a.event_id = e.id
     LEFT JOIN ef_ticket_tiers t ON a.tier_id = t.id
     WHERE a.registration_code = $1`, [code]
  );
  return rows[0] || null;
}

async function findAttendeeById(id) {
  const { rows } = await pool.query(`SELECT * FROM ef_attendees WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function searchAttendees(eventId, query) {
  const like = `%${query}%`;
  const { rows } = await pool.query(
    `SELECT a.*, t.name AS tier_name, t.color AS tier_color
     FROM ef_attendees a LEFT JOIN ef_ticket_tiers t ON a.tier_id = t.id
     WHERE a.event_id = $1 AND a.status != 'cancelled'
       AND (a.first_name ILIKE $2 OR a.last_name ILIKE $2 OR a.organization ILIKE $2 OR a.email ILIKE $2)
     ORDER BY a.last_name, a.first_name LIMIT 20`,
    [eventId, like]
  );
  return rows;
}

async function listAttendees(eventId, { status, tier_id, page = 1, pageSize = 50, query } = {}) {
  const conds = [`a.event_id = $1`]; const params = [eventId]; let i = 2;
  if (status)  { conds.push(`a.status = $${i++}`);  params.push(status); }
  if (tier_id) { conds.push(`a.tier_id = $${i++}`); params.push(tier_id); }
  if (query) {
    conds.push(`(a.first_name ILIKE $${i} OR a.last_name ILIKE $${i} OR a.organization ILIKE $${i} OR a.email ILIKE $${i})`);
    params.push(`%${query}%`); i++;
  }
  const where = `WHERE ${conds.join(' AND ')}`;
  const { rows: [{ cnt }] } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM ef_attendees a ${where}`, params
  );
  const { rows } = await pool.query(
    `SELECT a.*, t.name AS tier_name, t.color AS tier_color
     FROM ef_attendees a LEFT JOIN ef_ticket_tiers t ON a.tier_id = t.id
     ${where} ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  return { rows, total: cnt };
}

async function checkInAttendee(id) {
  const { rows } = await pool.query(
    `UPDATE ef_attendees SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'registered' RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function checkInAttendeeByCode(code) {
  const { rows } = await pool.query(
    `UPDATE ef_attendees SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
     WHERE registration_code = $1 AND status = 'registered' RETURNING *`,
    [code]
  );
  return rows[0] || null;
}

async function getEventStats(eventId) {
  const { rows: [stats] } = await pool.query(
    `SELECT
       COUNT(*)::int                                              AS total,
       COUNT(*) FILTER (WHERE status = 'checked_in')::int        AS checked_in,
       COUNT(*) FILTER (WHERE status = 'registered')::int        AS registered,
       COUNT(*) FILTER (WHERE status = 'cancelled')::int         AS cancelled
     FROM ef_attendees WHERE event_id = $1`, [eventId]
  );
  const { rows: byTier } = await pool.query(
    `SELECT t.name, t.color,
       COUNT(a.id)::int                                       AS total,
       COUNT(a.id) FILTER (WHERE a.status = 'checked_in')::int AS checked_in
     FROM ef_ticket_tiers t
     LEFT JOIN ef_attendees a ON a.tier_id = t.id AND a.status != 'cancelled'
     WHERE t.event_id = $1 GROUP BY t.id`, [eventId]
  );
  const { rows: recent } = await pool.query(
    `SELECT first_name, last_name, organization, tier_id, checked_in_at
     FROM ef_attendees WHERE event_id = $1 AND status = 'checked_in'
     ORDER BY checked_in_at DESC LIMIT 10`, [eventId]
  );
  return { ...stats, by_tier: byTier, recent_checkins: recent };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

async function createPayment({ attendee_id, amount, currency, platform_fee, gateway, gateway_ref }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_payments (attendee_id, amount, currency, platform_fee, gateway, gateway_ref)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [attendee_id, amount, currency, platform_fee || 0, gateway || 'stripe', gateway_ref || null]
  );
  return rows[0];
}

async function updatePaymentStatus(gatewayRef, status, paidAt) {
  const { rows } = await pool.query(
    `UPDATE ef_payments SET status = $1, paid_at = $2 WHERE gateway_ref = $3 RETURNING *`,
    [status, paidAt || null, gatewayRef]
  );
  return rows[0];
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function scheduleNotifications(attendeeId, eventId, contactId, eventStartAt, channels) {
  const start = new Date(eventStartAt);
  const items = [];

  for (const channel of channels) {
    items.push({ type: 'confirmation',  scheduledAt: new Date() });
    items.push({ type: 'reminder_7d',   scheduledAt: new Date(start - 7 * 864e5) });
    items.push({ type: 'reminder_1d',   scheduledAt: new Date(start - 864e5) });
    items.push({ type: 'doors_open',    scheduledAt: start });
    items.push({ type: 'post_event_1d', scheduledAt: new Date(start.getTime() + 864e5) });
  }

  for (const item of items) {
    if (item.scheduledAt <= new Date() && item.type !== 'confirmation') continue;
    await pool.query(
      `INSERT INTO ef_notification_schedule (attendee_id, event_id, contact_id, type, channel, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [attendeeId, eventId, contactId || null, item.type, channels[items.indexOf(item) % channels.length] || 'email', item.scheduledAt]
    );
  }
}

async function scheduleAllChannels(attendeeId, eventId, contactId, eventStartAt, channels) {
  const start = new Date(eventStartAt);
  const types = [
    { type: 'confirmation',  delay: 0 },
    { type: 'reminder_7d',   delay: -7 * 864e5 },
    { type: 'reminder_1d',   delay: -864e5 },
    { type: 'doors_open',    delay: 0, useStart: true },
    { type: 'post_event_1d', delay: 864e5, useStart: true },
  ];

  const rows = [];
  for (const ch of channels) {
    for (const t of types) {
      const scheduledAt = t.useStart
        ? new Date(start.getTime() + t.delay)
        : new Date(Date.now() + t.delay);
      if (scheduledAt <= new Date() && t.type !== 'confirmation') continue;
      rows.push({ type: t.type, channel: ch, scheduledAt });
    }
  }

  for (const r of rows) {
    await pool.query(
      `INSERT INTO ef_notification_schedule (attendee_id, event_id, contact_id, type, channel, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [attendeeId, eventId, contactId || null, r.type, r.channel, r.scheduledAt]
    );
  }
}

async function getDueNotifications(limit = 50) {
  const { rows } = await pool.query(
    `SELECT ns.*, a.first_name, a.last_name, a.email, a.phone,
            a.notify_whatsapp, a.notify_line, a.line_user_id,
            e.title AS event_title, e.start_at, e.end_at, e.location, e.slug,
            e.banner_url, e.timezone,
            t.name AS tier_name
     FROM ef_notification_schedule ns
     JOIN ef_attendees a ON ns.attendee_id = a.id
     JOIN ef_events e ON ns.event_id = e.id
     LEFT JOIN ef_ticket_tiers t ON a.tier_id = t.id
     WHERE ns.status = 'pending' AND ns.scheduled_at <= NOW()
     ORDER BY ns.scheduled_at ASC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function markNotificationSent(id, providerRef) {
  await pool.query(
    `UPDATE ef_notification_schedule SET status = 'sent', sent_at = NOW(), provider_ref = $2 WHERE id = $1`,
    [id, providerRef || null]
  );
}

async function markNotificationFailed(id, error) {
  await pool.query(
    `UPDATE ef_notification_schedule SET status = 'failed', error = $2 WHERE id = $1`,
    [id, error]
  );
}

async function getNotificationLog(eventId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT ns.*, a.first_name, a.last_name, a.email
     FROM ef_notification_schedule ns
     JOIN ef_attendees a ON ns.attendee_id = a.id
     WHERE ns.event_id = $1
     ORDER BY ns.created_at DESC LIMIT $2`,
    [eventId, limit]
  );
  return rows;
}

module.exports = {
  init,
  // organizer
  createOrganizer, findOrganizerByEmail, findOrganizerById, updateOrganizer,
  // events
  createEvent, updateEvent, findEventBySlug, findEventById, listEvents, deleteEvent, generateSlug,
  // tiers
  createTier, listTiers, updateTier, deleteTier, incrementTierSold,
  // contacts
  upsertContact, listContacts,
  // attendees
  createAttendee, findAttendeeByCode, findAttendeeById, searchAttendees,
  listAttendees, checkInAttendee, checkInAttendeeByCode, getEventStats,
  // payments
  createPayment, updatePaymentStatus,
  // notifications
  scheduleAllChannels, getDueNotifications, markNotificationSent, markNotificationFailed, getNotificationLog,
};
