'use strict';

/**
 * EventFlow — Participant preference profile
 * Anonymous, keyed by a browser-generated session_id stored in localStorage.
 */

const router = require('express').Router();
const db     = require('../db');

// GET /api/eventflow/participant/profile?sid=<session_id>
router.get('/profile', async (req, res) => {
  const { sid } = req.query;
  if (!sid) return res.json({ profile: null });
  try {
    const row = await db.pool.query(
      'SELECT * FROM ef_participant_profiles WHERE session_id = $1',
      [sid]
    );
    res.json({ profile: row.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/participant/profile
// Body: { sid, key, value }  — upserts a single preference key
router.post('/profile', async (req, res) => {
  const { sid, key, value } = req.body;
  if (!sid || !key) return res.status(400).json({ error: 'sid and key required' });

  const ALLOWED = ['role', 'interests', 'location', 'how_heard', 'dismissed'];
  if (!ALLOWED.includes(key)) return res.status(400).json({ error: 'invalid key' });

  try {
    await db.pool.query(`
      INSERT INTO ef_participant_profiles (session_id, ${key}, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (session_id) DO UPDATE SET ${key} = $2, updated_at = NOW()
    `, [sid, value]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
