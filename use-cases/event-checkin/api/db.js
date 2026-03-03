'use strict';

/**
 * db.js — Event Check-in Database Layer (PostgreSQL)
 *
 * Uses the shared pg pool from the root db.js so data persists
 * across Fly.io restarts (no more ephemeral SQLite).
 *
 * Table: event_checkin_participants
 */

const { pool } = require('../../../db');

const TABLE = 'event_checkin_participants';

// ─── Schema init ──────────────────────────────────────────────────────────────

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id           SERIAL PRIMARY KEY,
      color        TEXT        NOT NULL CHECK(color IN ('Red','Purple','Blue','Green')),
      title        TEXT,
      first_name   TEXT,
      last_name    TEXT,
      full_name    TEXT        NOT NULL,
      organization TEXT,
      status       TEXT        NOT NULL DEFAULT 'not_checked_in'
                               CHECK(status IN ('not_checked_in','checked_in')),
      remarks      TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Trigger to keep updated_at current on every UPDATE
  await pool.query(`
    CREATE OR REPLACE FUNCTION event_checkin_set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'event_checkin_participants_updated_at'
      ) THEN
        CREATE TRIGGER event_checkin_participants_updated_at
        BEFORE UPDATE ON ${TABLE}
        FOR EACH ROW EXECUTE FUNCTION event_checkin_set_updated_at();
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_checkin_chats (
      id         SERIAL PRIMARY KEY,
      question   TEXT        NOT NULL,
      answer     TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log(`[event-checkin] DB table "${TABLE}" ready`);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function search(query) {
  const like = `%${query}%`;
  const trimmed = query.trim();
  const params = [like];
  let idClause = '';
  if (/^\d+$/.test(trimmed)) {
    params.push(parseInt(trimmed, 10));
    idClause = `OR id = $2`;
  }
  const { rows } = await pool.query(`
    SELECT * FROM ${TABLE}
    WHERE  full_name    ILIKE $1
        OR first_name   ILIKE $1
        OR last_name    ILIKE $1
        OR organization ILIKE $1
        OR color        ILIKE $1
        ${idClause}
    ORDER BY color, full_name
  `, params);
  return rows;
}

async function insert(data) {
  const customId = data.id ? parseInt(data.id, 10) : null;

  if (customId) {
    const { rows } = await pool.query(`
      INSERT INTO ${TABLE}
        (id, color, title, first_name, last_name, full_name, organization, status, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      customId,
      data.color,
      data.title        || null,
      data.first_name   || null,
      data.last_name    || null,
      data.full_name,
      data.organization || null,
      data.status       || 'not_checked_in',
      data.remarks      || null,
    ]);
    // Keep the sequence ahead of the manually assigned ID
    await pool.query(
      `SELECT setval(pg_get_serial_sequence('${TABLE}', 'id'), GREATEST((SELECT MAX(id) FROM ${TABLE}), 1))`
    );
    return rows[0];
  }

  const { rows } = await pool.query(`
    INSERT INTO ${TABLE}
      (color, title, first_name, last_name, full_name, organization, status, remarks)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    data.color,
    data.title        || null,
    data.first_name   || null,
    data.last_name    || null,
    data.full_name,
    data.organization || null,
    data.status       || 'not_checked_in',
    data.remarks      || null,
  ]);
  return rows[0];
}

async function update(id, fields) {
  const allowed = ['color','title','first_name','last_name','full_name','organization','status','remarks'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return findById(id);

  const setClauses = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values     = [...entries.map(([, v]) => v), id];

  const { rows } = await pool.query(
    `UPDATE ${TABLE} SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

async function remove(id) {
  await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
}

async function list({ page = 1, pageSize = 50, color, status, query } = {}) {
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (color)  { conditions.push(`color = $${idx++}`);  params.push(color); }
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (query) {
    const trimmedQ = String(query).trim();
    if (/^\d+$/.test(trimmedQ)) {
      conditions.push(`(full_name ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR organization ILIKE $${idx} OR id = $${idx + 1})`);
      params.push(`%${trimmedQ}%`, parseInt(trimmedQ, 10));
      idx += 2;
    } else {
      conditions.push(`(full_name ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR organization ILIKE $${idx})`);
      params.push(`%${trimmedQ}%`);
      idx++;
    }
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const { rows: [{ cnt }] } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM ${TABLE} ${where}`, params
  );

  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE} ${where} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, pageSize, offset]
  );

  return { rows, total: cnt };
}

async function bulkStatus(ids, status) {
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
  const { rowCount } = await pool.query(
    `UPDATE ${TABLE} SET status = $1 WHERE id IN (${placeholders})`,
    [status, ...ids]
  );
  return rowCount;
}

async function bulkDelete(ids) {
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rowCount } = await pool.query(
    `DELETE FROM ${TABLE} WHERE id IN (${placeholders})`,
    ids
  );
  return rowCount;
}

async function findDuplicate(fullName, organization, color) {
  const { rows } = await pool.query(`
    SELECT * FROM ${TABLE}
    WHERE full_name = $1
      AND color     = $2
      AND (organization = $3 OR (organization IS NULL AND $3 IS NULL))
    LIMIT 1
  `, [fullName, color, organization || null]);
  return rows[0] || null;
}

async function getCheckedIn() {
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE} WHERE status = 'checked_in' ORDER BY color, full_name`
  );
  return rows;
}

async function saveChat(question, answer) {
  const { rows } = await pool.query(
    `INSERT INTO event_checkin_chats (question, answer) VALUES ($1, $2) RETURNING *`,
    [question, answer]
  );
  return rows[0];
}

async function getChats({ limit = 200 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM event_checkin_chats ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { init, findById, search, insert, update, remove, list, bulkStatus, bulkDelete, findDuplicate, getCheckedIn, saveChat, getChats };
