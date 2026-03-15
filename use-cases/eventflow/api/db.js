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
      plan          TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro','explab_staff')),
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
      is_public      BOOLEAN NOT NULL DEFAULT true,
      category       TEXT,
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_wishlist (
      id           SERIAL PRIMARY KEY,
      author_type  TEXT NOT NULL DEFAULT 'participant' CHECK(author_type IN ('organizer','participant')),
      author_name  TEXT,
      author_email TEXT,
      title        TEXT NOT NULL,
      description  TEXT,
      category     TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('feature','ux','integration','ai','general')),
      votes        INTEGER NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','planned','done','declined')),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_ns_pending ON ef_notification_schedule(scheduled_at) WHERE status = 'pending';`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_attendees_event ON ef_attendees(event_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_attendees_code ON ef_attendees(registration_code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_events_slug ON ef_events(slug);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_events_status ON ef_events(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_wishlist_votes ON ef_wishlist(votes DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_form_fields (
      id          SERIAL PRIMARY KEY,
      event_id    INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE,
      field_key   TEXT NOT NULL,
      field_type  TEXT NOT NULL DEFAULT 'text'
                    CHECK(field_type IN ('text','email','phone','number','textarea','select','checkbox','date')),
      label       TEXT NOT NULL,
      placeholder TEXT,
      required    BOOLEAN NOT NULL DEFAULT false,
      options     JSONB,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(event_id, field_key)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_form_fields_event ON ef_form_fields(event_id, sort_order);`);

  // Migrate existing ef_events — add is_public, category columns if missing
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE ef_events ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE ef_events ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `).catch(() => {});

  // Migrate plan column to allow explab_staff (safe to run multiple times)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE ef_organizers DROP CONSTRAINT IF EXISTS ef_organizers_plan_check;
      ALTER TABLE ef_organizers ADD CONSTRAINT ef_organizers_plan_check
        CHECK(plan IN ('free','pro','explab_staff'));
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `).catch(() => {});

  // Participant preference profiles (anonymous, keyed by browser session_id)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_participant_profiles (
      session_id   TEXT PRIMARY KEY,
      role         TEXT,
      interests    TEXT[],
      location     TEXT,
      how_heard    TEXT,
      dismissed    TEXT[] NOT NULL DEFAULT '{}',
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Tier extensions (P2) ────────────────────────────────────────────────────
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS tier_type TEXT NOT NULL DEFAULT 'general';
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS sale_starts_at TIMESTAMPTZ;
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMPTZ;
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS benefits JSONB NOT NULL DEFAULT '[]';
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE ef_ticket_tiers ADD COLUMN IF NOT EXISTS max_per_order INTEGER;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `).catch(() => {});

  // ── Discount codes (P1) ─────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_discount_codes (
      id          SERIAL PRIMARY KEY,
      event_id    INTEGER REFERENCES ef_events(id) ON DELETE CASCADE,
      code        TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'percent' CHECK(type IN ('percent','fixed')),
      value       INTEGER NOT NULL,
      max_uses    INTEGER,
      uses        INTEGER NOT NULL DEFAULT 0,
      expires_at  TIMESTAMPTZ,
      source      TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','referral')),
      owner_id    INTEGER,
      active      BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(event_id, code)
    );
  `);

  // ── Referral programs + ambassador (P3) ─────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_referral_programs (
      id             SERIAL PRIMARY KEY,
      event_id       INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE UNIQUE,
      scheme         TEXT NOT NULL DEFAULT 'discount_share'
                       CHECK(scheme IN ('discount_share','commission')),
      discount_pct   INTEGER NOT NULL DEFAULT 10,
      reward_amount  INTEGER NOT NULL DEFAULT 0,
      reward_type    TEXT NOT NULL DEFAULT 'credit' CHECK(reward_type IN ('credit','cash')),
      active         BOOLEAN NOT NULL DEFAULT true,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_ambassador_profiles (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL,
      social_handle  TEXT,
      platform       TEXT,
      follower_count INTEGER,
      bio            TEXT,
      categories     TEXT[],
      status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','active','inactive')),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_referral_events (
      id            SERIAL PRIMARY KEY,
      code_id       INTEGER NOT NULL REFERENCES ef_discount_codes(id),
      attendee_id   INTEGER REFERENCES ef_attendees(id),
      reward_amount INTEGER NOT NULL DEFAULT 0,
      paid_out      BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Sponsor matching (P5) ────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_sponsor_profiles (
      id             SERIAL PRIMARY KEY,
      company        TEXT NOT NULL,
      contact_name   TEXT,
      contact_email  TEXT NOT NULL,
      contact_phone  TEXT,
      industries     TEXT[],
      event_types    TEXT[],
      budget_range   TEXT,
      description    TEXT,
      website        TEXT,
      status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','active','inactive')),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_event_sponsor_flags (
      event_id      INTEGER PRIMARY KEY REFERENCES ef_events(id) ON DELETE CASCADE,
      seeking       BOOLEAN NOT NULL DEFAULT false,
      brief         TEXT,
      package_types TEXT[],
      budget_range  TEXT,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_sponsor_matches (
      id         SERIAL PRIMARY KEY,
      event_id   INTEGER NOT NULL REFERENCES ef_events(id),
      sponsor_id INTEGER NOT NULL REFERENCES ef_sponsor_profiles(id),
      status     TEXT NOT NULL DEFAULT 'proposed'
                   CHECK(status IN ('proposed','accepted','declined','completed')),
      notes      TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── KOL sourcing (P6) ───────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_kol_profiles (
      id              SERIAL PRIMARY KEY,
      name            TEXT NOT NULL,
      handle          TEXT,
      platforms       TEXT[],
      follower_counts JSONB NOT NULL DEFAULT '{}',
      categories      TEXT[],
      bio             TEXT,
      contact_email   TEXT NOT NULL,
      contact_phone   TEXT,
      rate_range      TEXT,
      status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','active','inactive')),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_kol_briefs (
      id           SERIAL PRIMARY KEY,
      event_id     INTEGER NOT NULL REFERENCES ef_events(id) ON DELETE CASCADE,
      organizer_id INTEGER NOT NULL REFERENCES ef_organizers(id),
      budget_range TEXT,
      deliverables TEXT,
      deadline     TIMESTAMPTZ,
      categories   TEXT[],
      notes        TEXT,
      status       TEXT NOT NULL DEFAULT 'open'
                     CHECK(status IN ('open','matched','closed')),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_kol_applications (
      id        SERIAL PRIMARY KEY,
      brief_id  INTEGER NOT NULL REFERENCES ef_kol_briefs(id),
      kol_id    INTEGER NOT NULL REFERENCES ef_kol_profiles(id),
      proposal  TEXT,
      status    TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','accepted','declined')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Agency services + inquiries (P4) ────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_agency_inquiries (
      id           SERIAL PRIMARY KEY,
      service_slug TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT,
      company      TEXT,
      event_date   DATE,
      budget_range TEXT,
      notes        TEXT,
      status       TEXT NOT NULL DEFAULT 'new'
                     CHECK(status IN ('new','contacted','quoted','closed')),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Indexes ──────────────────────────────────────────────────────────────────
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_discount_codes_event ON ef_discount_codes(event_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_discount_codes_code  ON ef_discount_codes(code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_kol_status ON ef_kol_profiles(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_sponsor_status ON ef_sponsor_profiles(status);`);
  // Push notification tokens (Expo Push)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ef_push_tokens (
      id          SERIAL PRIMARY KEY,
      token       TEXT NOT NULL,
      context     TEXT NOT NULL CHECK(context IN ('participant','organizer')),
      context_id  TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(token)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ef_push_tokens_ctx ON ef_push_tokens(context, context_id);`);

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
        start_at, end_at, timezone, capacity, checkin_pin, settings, is_public, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
      data.is_public !== false,
      data.category || null,
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
                   'start_at','end_at','timezone','capacity','checkin_pin','settings','status',
                   'is_public','category'];
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

async function listEvents({ organizerId, status, search, category, publicOnly = false, limit = 20, offset = 0 } = {}) {
  const conds = []; const params = []; let i = 1;
  if (organizerId) { conds.push(`e.organizer_id = $${i++}`); params.push(organizerId); }
  if (status)      { conds.push(`e.status = $${i++}`);       params.push(status); }
  if (category)    { conds.push(`e.category = $${i++}`);     params.push(category); }
  if (publicOnly)  { conds.push(`e.is_public = true`); }
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

async function listCategories() {
  const { rows } = await pool.query(
    `SELECT category, COUNT(*)::int AS count
     FROM ef_events WHERE status = 'published' AND is_public = true AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`
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

// ─── Wishlist ──────────────────────────────────────────────────────────────────

async function createWishlistItem({ author_type, author_name, author_email, title, description, category }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_wishlist (author_type, author_name, author_email, title, description, category)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [author_type || 'participant', author_name || null, author_email || null,
     title, description || null, category || 'general']
  );
  return rows[0];
}

async function listWishlistItems({ status, category, limit = 50, offset = 0 } = {}) {
  const conds = []; const params = []; let i = 1;
  if (status)   { conds.push(`status = $${i++}`);   params.push(status); }
  if (category) { conds.push(`category = $${i++}`); params.push(category); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM ef_wishlist ${where} ORDER BY votes DESC, created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return rows;
}

async function voteWishlistItem(id) {
  const { rows } = await pool.query(
    `UPDATE ef_wishlist SET votes = votes + 1 WHERE id = $1 RETURNING *`, [id]
  );
  return rows[0] || null;
}

async function updateWishlistStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_wishlist SET status = $1 WHERE id = $2 RETURNING *`, [status, id]
  );
  return rows[0] || null;
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

// ─── Form Fields ──────────────────────────────────────────────────────────────

async function listFormFields(eventId) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_form_fields WHERE event_id = $1 ORDER BY sort_order, id`, [eventId]
  );
  return rows;
}

async function createFormField(eventId, { field_key, field_type, label, placeholder, required, options, sort_order }) {
  // sanitize field_key: alphanumeric + underscore only
  const safeKey = String(field_key).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 50);
  const { rows } = await pool.query(
    `INSERT INTO ef_form_fields (event_id, field_key, field_type, label, placeholder, required, options, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [eventId, safeKey, field_type || 'text', String(label).substring(0, 100),
     placeholder ? String(placeholder).substring(0, 200) : null,
     required === true, options || null, sort_order || 0]
  );
  return rows[0];
}

async function updateFormField(id, eventId, updates) {
  const allowed = ['field_type','label','placeholder','required','options','sort_order'];
  const entries = Object.entries(updates).filter(([k]) => allowed.includes(k));
  if (!entries.length) return null;
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const vals = entries.map(([, v]) => v);
  const { rows } = await pool.query(
    `UPDATE ef_form_fields SET ${set} WHERE id = $${vals.length + 1} AND event_id = $${vals.length + 2} RETURNING *`,
    [...vals, id, eventId]
  );
  return rows[0] || null;
}

async function deleteFormField(id, eventId) {
  await pool.query(`DELETE FROM ef_form_fields WHERE id = $1 AND event_id = $2`, [id, eventId]);
}

// ─── Discount Codes ───────────────────────────────────────────────────────────

async function createDiscountCode({ event_id, code, type, value, max_uses, expires_at, source, owner_id }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_discount_codes (event_id, code, type, value, max_uses, expires_at, source, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [event_id || null, code.toUpperCase(), type || 'percent', value,
     max_uses || null, expires_at || null, source || 'manual', owner_id || null]
  );
  return rows[0];
}

async function listDiscountCodes(eventId) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_discount_codes WHERE event_id = $1 ORDER BY created_at DESC`, [eventId]
  );
  return rows;
}

async function validateDiscountCode(eventId, code) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_discount_codes
     WHERE event_id = $1 AND code = $2 AND active = true
       AND (max_uses IS NULL OR uses < max_uses)
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [eventId, code.toUpperCase()]
  );
  return rows[0] || null;
}

async function redeemDiscountCode(id) {
  const { rows } = await pool.query(
    `UPDATE ef_discount_codes SET uses = uses + 1 WHERE id = $1 RETURNING *`, [id]
  );
  return rows[0];
}

async function updateDiscountCode(id, eventId, fields) {
  const allowed = ['active', 'max_uses', 'expires_at', 'value'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return null;
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE ef_discount_codes SET ${set} WHERE id = $${entries.length + 1} AND event_id = $${entries.length + 2} RETURNING *`,
    [...entries.map(([, v]) => v), id, eventId]
  );
  return rows[0];
}

async function deleteDiscountCode(id, eventId) {
  await pool.query(`DELETE FROM ef_discount_codes WHERE id = $1 AND event_id = $2`, [id, eventId]);
}

// ─── Referral / Ambassador ────────────────────────────────────────────────────

async function createReferralProgram({ event_id, scheme, discount_pct, reward_amount, reward_type }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_referral_programs (event_id, scheme, discount_pct, reward_amount, reward_type)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (event_id) DO UPDATE SET scheme=$2, discount_pct=$3, reward_amount=$4, reward_type=$5, active=true
     RETURNING *`,
    [event_id, scheme || 'discount_share', discount_pct || 10, reward_amount || 0, reward_type || 'credit']
  );
  return rows[0];
}

async function getReferralProgram(eventId) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_referral_programs WHERE event_id = $1 AND active = true`, [eventId]
  );
  return rows[0] || null;
}

async function createAmbassador({ name, email, social_handle, platform, follower_count, bio, categories }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_ambassador_profiles (name, email, social_handle, platform, follower_count, bio, categories)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, email.toLowerCase(), social_handle || null, platform || null,
     follower_count || null, bio || null, categories || null]
  );
  return rows[0];
}

async function listAmbassadors(status) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_ambassador_profiles ${status ? 'WHERE status=$1' : ''} ORDER BY created_at DESC`,
    status ? [status] : []
  );
  return rows;
}

async function updateAmbassadorStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_ambassador_profiles SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
  );
  return rows[0];
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

async function createSponsorProfile({ company, contact_name, contact_email, contact_phone, industries, event_types, budget_range, description, website }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_sponsor_profiles (company, contact_name, contact_email, contact_phone, industries, event_types, budget_range, description, website)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [company, contact_name || null, contact_email.toLowerCase(), contact_phone || null,
     industries || null, event_types || null, budget_range || null, description || null, website || null]
  );
  return rows[0];
}

async function listSponsorProfiles(status) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_sponsor_profiles ${status ? 'WHERE status=$1' : ''} ORDER BY created_at DESC`,
    status ? [status] : []
  );
  return rows;
}

async function updateSponsorStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_sponsor_profiles SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
  );
  return rows[0];
}

async function upsertEventSponsorFlag(eventId, { seeking, brief, package_types, budget_range }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_event_sponsor_flags (event_id, seeking, brief, package_types, budget_range)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (event_id) DO UPDATE SET seeking=$2, brief=$3, package_types=$4, budget_range=$5, updated_at=NOW()
     RETURNING *`,
    [eventId, seeking, brief || null, package_types || null, budget_range || null]
  );
  return rows[0];
}

async function getEventSponsorFlag(eventId) {
  const { rows } = await pool.query(`SELECT * FROM ef_event_sponsor_flags WHERE event_id = $1`, [eventId]);
  return rows[0] || null;
}

async function listSeekingSponsorEvents() {
  const { rows } = await pool.query(
    `SELECT f.*, e.title, e.slug, e.start_at, o.name AS organizer_name, o.email AS organizer_email
     FROM ef_event_sponsor_flags f
     JOIN ef_events e ON f.event_id = e.id
     JOIN ef_organizers o ON e.organizer_id = o.id
     WHERE f.seeking = true ORDER BY e.start_at ASC`
  );
  return rows;
}

async function createSponsorMatch(eventId, sponsorId, notes) {
  const { rows } = await pool.query(
    `INSERT INTO ef_sponsor_matches (event_id, sponsor_id, notes) VALUES ($1,$2,$3) RETURNING *`,
    [eventId, sponsorId, notes || null]
  );
  return rows[0];
}

async function listSponsorMatches() {
  const { rows } = await pool.query(
    `SELECT m.*, e.title AS event_title, e.slug, s.company, s.contact_email
     FROM ef_sponsor_matches m
     JOIN ef_events e ON m.event_id = e.id
     JOIN ef_sponsor_profiles s ON m.sponsor_id = s.id
     ORDER BY m.created_at DESC`
  );
  return rows;
}

async function updateSponsorMatchStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_sponsor_matches SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
  );
  return rows[0];
}

// ─── KOL ──────────────────────────────────────────────────────────────────────

async function createKolProfile({ name, handle, platforms, follower_counts, categories, bio, contact_email, contact_phone, rate_range }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_kol_profiles (name, handle, platforms, follower_counts, categories, bio, contact_email, contact_phone, rate_range)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [name, handle || null, platforms || null,
     JSON.stringify(follower_counts || {}), categories || null,
     bio || null, contact_email.toLowerCase(), contact_phone || null, rate_range || null]
  );
  return rows[0];
}

async function listKolProfiles(status) {
  const { rows } = await pool.query(
    `SELECT * FROM ef_kol_profiles ${status ? 'WHERE status=$1' : ''} ORDER BY created_at DESC`,
    status ? [status] : []
  );
  return rows;
}

async function updateKolStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_kol_profiles SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
  );
  return rows[0];
}

async function createKolBrief(eventId, organizerId, { budget_range, deliverables, deadline, categories, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_kol_briefs (event_id, organizer_id, budget_range, deliverables, deadline, categories, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [eventId, organizerId, budget_range || null, deliverables || null,
     deadline || null, categories || null, notes || null]
  );
  return rows[0];
}

async function listKolBriefs(organizerId) {
  const { rows } = await pool.query(
    `SELECT b.*, e.title AS event_title FROM ef_kol_briefs b
     JOIN ef_events e ON b.event_id = e.id
     WHERE b.organizer_id = $1 ORDER BY b.created_at DESC`,
    [organizerId]
  );
  return rows;
}

async function listAllKolBriefs() {
  const { rows } = await pool.query(
    `SELECT b.*, e.title AS event_title, o.name AS organizer_name
     FROM ef_kol_briefs b
     JOIN ef_events e ON b.event_id = e.id
     JOIN ef_organizers o ON b.organizer_id = o.id
     ORDER BY b.created_at DESC`
  );
  return rows;
}

// ─── Agency Inquiries ─────────────────────────────────────────────────────────

async function createAgencyInquiry({ service_slug, contact_name, email, phone, company, event_date, budget_range, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO ef_agency_inquiries (service_slug, contact_name, email, phone, company, event_date, budget_range, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [service_slug, contact_name, email.toLowerCase(), phone || null, company || null,
     event_date || null, budget_range || null, notes || null]
  );
  return rows[0];
}

async function listAgencyInquiries() {
  const { rows } = await pool.query(
    `SELECT * FROM ef_agency_inquiries ORDER BY created_at DESC`
  );
  return rows;
}

async function updateInquiryStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE ef_agency_inquiries SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
  );
  return rows[0];
}

module.exports = {
  init,
  // organizer
  createOrganizer, findOrganizerByEmail, findOrganizerById, updateOrganizer,
  // events
  createEvent, updateEvent, findEventBySlug, findEventById, listEvents, listCategories, deleteEvent, generateSlug,
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
  // wishlist
  createWishlistItem, listWishlistItems, voteWishlistItem, updateWishlistStatus,
  // form fields
  listFormFields, createFormField, updateFormField, deleteFormField,
  // discount codes (P1)
  createDiscountCode, listDiscountCodes, validateDiscountCode, redeemDiscountCode, updateDiscountCode, deleteDiscountCode,
  // referral / ambassador (P3)
  createReferralProgram, getReferralProgram, createAmbassador, listAmbassadors, updateAmbassadorStatus,
  // sponsors (P5)
  createSponsorProfile, listSponsorProfiles, updateSponsorStatus,
  upsertEventSponsorFlag, getEventSponsorFlag, listSeekingSponsorEvents,
  createSponsorMatch, listSponsorMatches, updateSponsorMatchStatus,
  // KOL (P6)
  createKolProfile, listKolProfiles, updateKolStatus,
  createKolBrief, listKolBriefs, listAllKolBriefs,
  // agency inquiries (P4)
  createAgencyInquiry, listAgencyInquiries, updateInquiryStatus,
  // push tokens
  upsertPushToken, deletePushToken, getPushTokensByContext,
};

// ─── Push Tokens ──────────────────────────────────────────────────────────────

async function upsertPushToken(token, context, contextId) {
  await pool.query(
    `INSERT INTO ef_push_tokens (token, context, context_id, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (token) DO UPDATE SET context=$2, context_id=$3, updated_at=NOW()`,
    [token, context, String(contextId)]
  );
}

async function deletePushToken(token) {
  await pool.query(`DELETE FROM ef_push_tokens WHERE token=$1`, [token]);
}

async function getPushTokensByContext(context, contextId) {
  const { rows } = await pool.query(
    `SELECT token FROM ef_push_tokens WHERE context=$1 AND context_id=$2`,
    [context, String(contextId)]
  );
  return rows.map(r => r.token);
}
