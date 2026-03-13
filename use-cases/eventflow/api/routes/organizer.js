'use strict';

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const { signToken, requireAuth } = require('../auth');

// POST /api/eventflow/organizer/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await db.findOrganizerByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const organizer = await db.createOrganizer({ name, email: email.toLowerCase(), passwordHash });

    const token = signToken({ id: organizer.id, email: organizer.email, name: organizer.name });
    res.status(201).json({ token, organizer });
  } catch (err) {
    console.error('[eventflow/organizer/signup]', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/eventflow/organizer/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const organizer = await db.findOrganizerByEmail(email.toLowerCase());
    if (!organizer) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, organizer.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: organizer.id, email: organizer.email, name: organizer.name });
    const { password_hash: _, ...safe } = organizer;
    res.json({ token, organizer: safe });
  } catch (err) {
    console.error('[eventflow/organizer/login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/eventflow/organizer/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const organizer = await db.findOrganizerById(req.organizer.id);
    if (!organizer) return res.status(404).json({ error: 'Organizer not found' });
    res.json({ organizer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/eventflow/organizer/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const updated = await db.updateOrganizer(req.organizer.id, req.body);
    res.json({ organizer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eventflow/organizer/contacts
router.get('/contacts', requireAuth, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    const contacts = await db.listContacts({
      organizerId: req.organizer.id,
      search: search || null,
      limit: parseInt(limit), offset: parseInt(offset),
    });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
