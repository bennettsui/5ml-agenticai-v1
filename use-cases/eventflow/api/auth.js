'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.EVENTFLOW_JWT_SECRET || 'eventflow-dev-secret-change-in-prod';
const EXPIRES = '30d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/** Middleware — require valid organizer JWT */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.organizer = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Middleware — attach organizer if token present, but don't fail */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.organizer = verifyToken(header.slice(7)); } catch { /* ignore */ }
  }
  next();
}

module.exports = { signToken, verifyToken, requireAuth, optionalAuth };
