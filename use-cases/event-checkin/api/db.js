'use strict';

const Database = require('better-sqlite3');
const path = require('path');

// SQLite database file stored in use-cases/event-checkin/data/
const DB_PATH = process.env.EVENT_CHECKIN_DB_PATH || path.join(__dirname, '..', 'data', 'event-checkin.db');

let db;

/**
 * Get the singleton database connection.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');   // Better concurrent performance
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Initialize the database schema.
 * Creates the participants table if it doesn't exist.
 */
function init() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      color        TEXT    NOT NULL CHECK(color IN ('Red','Purple','Blue','Green')),
      title        TEXT,
      first_name   TEXT,
      last_name    TEXT,
      full_name    TEXT    NOT NULL,
      organization TEXT,
      status       TEXT    NOT NULL DEFAULT 'not_checked_in'
                           CHECK(status IN ('not_checked_in','checked_in')),
      remarks      TEXT,
      created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  // Trigger to keep updated_at current
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS participants_updated_at
    AFTER UPDATE ON participants
    BEGIN
      UPDATE participants
      SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = NEW.id;
    END;
  `);

  console.log(`[DB] Initialized at: ${DB_PATH}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find participant by ID.
 */
function findById(id) {
  return getDb().prepare('SELECT * FROM participants WHERE id = ?').get(id);
}

/**
 * Search participants by a freetext query across name, org, and color fields.
 * Returns rows ordered by color then full_name.
 */
function search(query) {
  const like = `%${query}%`;
  return getDb()
    .prepare(`
      SELECT * FROM participants
      WHERE  full_name    LIKE ? COLLATE NOCASE
          OR first_name   LIKE ? COLLATE NOCASE
          OR last_name    LIKE ? COLLATE NOCASE
          OR organization LIKE ? COLLATE NOCASE
          OR color        LIKE ? COLLATE NOCASE
      ORDER BY color, full_name
    `)
    .all(like, like, like, like, like);
}

/**
 * Insert a new participant. Returns the created row.
 */
function insert(data) {
  const stmt = getDb().prepare(`
    INSERT INTO participants (color, title, first_name, last_name, full_name, organization, status, remarks)
    VALUES (@color, @title, @first_name, @last_name, @full_name, @organization, @status, @remarks)
  `);
  const info = stmt.run({
    color:        data.color,
    title:        data.title        || null,
    first_name:   data.first_name   || null,
    last_name:    data.last_name    || null,
    full_name:    data.full_name,
    organization: data.organization || null,
    status:       data.status       || 'not_checked_in',
    remarks:      data.remarks      || null,
  });
  return findById(info.lastInsertRowid);
}

/**
 * Update arbitrary fields on a participant. Returns the updated row.
 */
function update(id, fields) {
  const allowed = ['color','title','first_name','last_name','full_name','organization','status','remarks'];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([k]) => `${k} = @${k}`).join(', ');
  const params     = Object.fromEntries(entries);
  params.id        = id;

  getDb().prepare(`UPDATE participants SET ${setClauses} WHERE id = @id`).run(params);
  return findById(id);
}

/**
 * Delete a participant by ID.
 */
function remove(id) {
  getDb().prepare('DELETE FROM participants WHERE id = ?').run(id);
}

/**
 * Paginated list with optional filters.
 * Returns { rows, total }.
 */
function list({ page = 1, pageSize = 50, color, status, query } = {}) {
  const conditions = [];
  const params     = {};

  if (color)  { conditions.push('color = @color');              params.color  = color; }
  if (status) { conditions.push('status = @status');            params.status = status; }
  if (query)  {
    conditions.push(`(full_name LIKE @q COLLATE NOCASE OR first_name LIKE @q COLLATE NOCASE
                      OR last_name LIKE @q COLLATE NOCASE OR organization LIKE @q COLLATE NOCASE)`);
    params.q = `%${query}%`;
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const total = getDb()
    .prepare(`SELECT COUNT(*) AS cnt FROM participants ${where}`)
    .get(params).cnt;

  const rows = getDb()
    .prepare(`SELECT * FROM participants ${where} ORDER BY id DESC LIMIT ${pageSize} OFFSET ${offset}`)
    .all(params);

  return { rows, total };
}

/**
 * Bulk status update. Returns count of changed rows.
 */
function bulkStatus(ids, status) {
  const placeholders = ids.map(() => '?').join(',');
  const info = getDb()
    .prepare(`UPDATE participants SET status = ? WHERE id IN (${placeholders})`)
    .run(status, ...ids);
  return info.changes;
}

/**
 * Bulk delete. Returns count of deleted rows.
 */
function bulkDelete(ids) {
  const placeholders = ids.map(() => '?').join(',');
  const info = getDb()
    .prepare(`DELETE FROM participants WHERE id IN (${placeholders})`)
    .run(...ids);
  return info.changes;
}

/**
 * Find existing participant by deduplication key: (full_name, organization, color).
 * Used during import to skip or update duplicates.
 */
function findDuplicate(fullName, organization, color) {
  return getDb()
    .prepare(`
      SELECT * FROM participants
      WHERE full_name    = ?
        AND color        = ?
        AND (organization = ? OR (organization IS NULL AND ? IS NULL))
    `)
    .get(fullName, color, organization, organization);
}

/**
 * Fetch all checked-in participants for export.
 */
function getCheckedIn() {
  return getDb()
    .prepare(`SELECT * FROM participants WHERE status = 'checked_in' ORDER BY color, full_name`)
    .all();
}

module.exports = { init, getDb, findById, search, insert, update, remove, list, bulkStatus, bulkDelete, findDuplicate, getCheckedIn };
