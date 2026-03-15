'use strict';

/**
 * Push token registration endpoints
 * POST /api/eventflow/push/register   - store a push token
 * DELETE /api/eventflow/push/token    - remove a push token
 */

const router   = require('express').Router();
const db       = require('../db');
const { requireAuth } = require('../auth');

// POST /register — called by both participant and organizer apps on startup
// Body: { token, context: 'participant'|'organizer', context_id: sessionId|organizerId }
router.post('/register', async (req, res) => {
  try {
    const { token, context, context_id } = req.body;

    if (!token || !token.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ error: 'Invalid push token format' });
    }
    if (!context || !['participant', 'organizer'].includes(context)) {
      return res.status(400).json({ error: 'context must be participant or organizer' });
    }
    if (!context_id) {
      return res.status(400).json({ error: 'context_id is required' });
    }

    // For organizer context, validate JWT to prevent token theft
    if (context === 'organizer') {
      try {
        const auth = require('../auth');
        const organizer = await auth.verifyToken(req.headers.authorization?.replace('Bearer ', ''));
        if (!organizer || String(organizer.id) !== String(context_id)) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      } catch {
        return res.status(403).json({ error: 'Invalid token' });
      }
    }

    await db.upsertPushToken(token, context, context_id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[eventflow/push/register]', err.message);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// DELETE /token — unregister (called on logout or notification permission revoked)
router.delete('/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    await db.deletePushToken(token);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove push token' });
  }
});

module.exports = router;
