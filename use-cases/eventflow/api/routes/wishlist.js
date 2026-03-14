'use strict';

/**
 * EventFlow — Wishlist / Feature Request Board
 * Public submit + vote. Admin-only status management.
 */

const router = require('express').Router();
const db = require('../db');

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.EVENTFLOW_ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// GET /api/eventflow/wishlist
router.get('/', async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    const items = await db.listWishlistItems({
      status: status || null,
      category: category || null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/wishlist
router.post('/', async (req, res) => {
  try {
    const { author_type, author_name, author_email, title, description, category } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });

    const item = await db.createWishlistItem({
      author_type: author_type || 'participant',
      author_name: author_name?.trim() || null,
      author_email: author_email?.trim() || null,
      title: title.trim(),
      description: description?.trim() || null,
      category: category || 'general',
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/wishlist/:id/vote
router.post('/:id/vote', async (req, res) => {
  try {
    const item = await db.voteWishlistItem(parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/wishlist/:id — admin only
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const item = await db.updateWishlistStatus(parseInt(req.params.id), status);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
