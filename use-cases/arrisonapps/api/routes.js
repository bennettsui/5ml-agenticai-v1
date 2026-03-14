'use strict';
/**
 * Arrisonapps Cigar System — Main Router
 *
 * Mounts:
 *   /api/arrisonapps/v1          → public storefront API
 *   /api/arrisonapps/v1/admin    → admin / CRM / inventory
 *   /api/arrisonapps/v1/agent    → 5ML agentic integration
 *   /api/arrisonapps/v1/health   → health check
 */

const express     = require('express');
const router      = express.Router();
const publicRoutes = require('./routes/public');
const adminRoutes  = require('./routes/admin');
const agentRoutes  = require('./routes/agent');
const { initArrisonappsDb } = require('../db/schema');

// Initialise schema lazily (called from index.js after DB is available)
router.initDb = async (pool) => {
  await initArrisonappsDb(pool);
};

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'arrisonapps', version: '1.0.0' });
});

// Public storefront (authentication optional)
router.use('/', publicRoutes);

// Admin (requires JWT with admin roles)
router.use('/admin', adminRoutes);

// 5ML Agentic (requires X-Agent-Key header)
router.use('/agent', agentRoutes);

module.exports = router;
