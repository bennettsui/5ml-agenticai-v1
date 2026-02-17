/**
 * Growth Architect API Routes
 * Endpoints for growth plan generation, management, and weekly reviews
 */

const express = require('express');
const router = express.Router();
const { generateGrowthPlan } = require('../agents/growthArchitectOrchestrator');
const { generateWeeklyReview } = require('../agents/reportingAgent');

// Database (lazy-loaded)
let db;
try {
  db = require('../../../db');
} catch (e) {
  console.warn('[Growth API] Database module not available');
}

// ==========================================
// Initialization
// ==========================================

async function initGrowthDatabase() {
  if (!db || !db.pool) {
    console.warn('[Growth API] No database pool available');
    return;
  }

  try {
    const { initGrowthTables } = require('../db/growth-schema');
    await initGrowthTables(db.pool);
    console.log('✅ Growth tables initialized');
  } catch (error) {
    console.error('❌ Error initializing growth tables:', error.message);
  }
}

// Initialize on load
initGrowthDatabase().catch(console.error);

// ==========================================
// Growth Plan Generation
// ==========================================

/**
 * POST /api/growth/plan
 * Generate a full 6-block growth plan for a brand
 * Body: { brand_name, product_brief, icp_initial?, channels? }
 */
router.post('/plan', async (req, res) => {
  try {
    const { brand_name, product_brief, icp_initial = null, channels = [] } = req.body;

    if (!brand_name || !product_brief) {
      return res.status(400).json({ error: 'Missing required fields: brand_name, product_brief' });
    }

    console.log(`📋 Generating growth plan for: ${brand_name}`);

    const plan = await generateGrowthPlan(brand_name, product_brief, icp_initial, {
      db,
      model: 'deepseek',
    });

    res.json({
      success: true,
      data: plan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating plan:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/plan/:brand_name
 * Get the latest active growth plan for a brand
 */
router.get('/plan/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name } = req.params;
    const result = await db.pool.query(
      `SELECT id, brand_name, plan_data, status, phase, created_at, updated_at
       FROM growth_plans
       WHERE brand_name = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [brand_name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No active plan found for ${brand_name}` });
    }

    const plan = result.rows[0];
    res.json({
      success: true,
      data: {
        id: plan.id,
        brand_name: plan.brand_name,
        plan: plan.plan_data,
        status: plan.status,
        phase: plan.phase,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching plan:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/plans
 * List all growth plans with optional filtering
 * Query: ?brand_name=x&status=x&limit=10&offset=0
 */
router.get('/plans', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name, status = 'active', limit = 20, offset = 0 } = req.query;

    let query = 'SELECT id, brand_name, status, phase, created_at FROM growth_plans WHERE 1=1';
    const params = [];

    if (brand_name) {
      query += ' AND brand_name ILIKE $' + (params.length + 1);
      params.push(`%${brand_name}%`);
    }

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching plans:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Weekly Reviews
// ==========================================

/**
 * POST /api/growth/weekly-review
 * Generate a weekly review for a brand
 * Body: { brand_name, week_start?, week_end? }
 */
router.post('/weekly-review', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name } = req.body;

    if (!brand_name) {
      return res.status(400).json({ error: 'Missing required field: brand_name' });
    }

    // Default to last 7 days
    const today = new Date();
    const week_end = today.toISOString().split('T')[0];
    const week_start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log(`📊 Generating weekly review for ${brand_name} (${week_start} to ${week_end})`);

    const review = await generateWeeklyReview(db, brand_name, week_start, week_end, {
      model: 'deepseek',
    });

    // Save to database
    const result = await db.pool.query(
      `INSERT INTO growth_weekly_reviews (brand_name, week_start, week_end, summary, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [brand_name, week_start, week_end, JSON.stringify(review.summary), 'pending']
    );

    res.json({
      success: true,
      data: {
        review_id: result.rows[0]?.id,
        ...review,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating review:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/weekly-reviews/:brand_name
 * Get all weekly reviews for a brand
 */
router.get('/weekly-reviews/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.pool.query(
      `SELECT id, brand_name, week_start, week_end, summary, status, created_at
       FROM growth_weekly_reviews
       WHERE brand_name = $1
       ORDER BY week_start DESC
       LIMIT $2 OFFSET $3`,
      [brand_name, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/weekly-review/:id
 * Get a specific weekly review
 */
router.get('/weekly-review/:id', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;

    const result = await db.pool.query(
      `SELECT id, brand_name, week_start, week_end, summary, human_decisions, status, created_at
       FROM growth_weekly_reviews
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching review:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Experiments
// ==========================================

/**
 * GET /api/growth/experiments/:brand_name
 * List experiments for a brand
 */
router.get('/experiments/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query =
      `SELECT id, plan_id, brand_name, hypothesis, channel, status, tags, created_at, updated_at
       FROM growth_experiments
       WHERE brand_name = $1`;
    const params = [brand_name];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching experiments:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/growth/experiments/:id
 * Update experiment status or add results
 */
router.patch('/experiments/:id', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { status, result_data, tags } = req.body;

    const updates = [];
    const params = [id];

    if (status) {
      updates.push('status = $' + (params.length + 1));
      params.push(status);
    }

    if (result_data) {
      updates.push('result_data = $' + (params.length + 1));
      params.push(JSON.stringify(result_data));
    }

    if (tags) {
      updates.push('tags = $' + (params.length + 1));
      params.push(JSON.stringify(tags));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = now()');

    const result = await db.pool.query(
      `UPDATE growth_experiments
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating experiment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Metrics
// ==========================================

/**
 * GET /api/growth/metrics/:brand_name
 * Get metrics snapshots for a brand
 */
router.get('/metrics/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand_name } = req.params;
    const { channel, limit = 50, offset = 0 } = req.query;

    let query =
      `SELECT id, brand_name, snapshot_date, channel, ctr, cpc, cvr, cpa, roas, cac, ltv, spend, revenue, created_at
       FROM growth_metrics_snapshots
       WHERE brand_name = $1`;
    const params = [brand_name];

    if (channel) {
      query += ' AND channel = $' + (params.length + 1);
      params.push(channel);
    }

    query += ' ORDER BY snapshot_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/growth/metrics
 * Save metrics snapshot
 */
router.post('/metrics', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const {
      brand_name,
      snapshot_date,
      channel,
      ctr,
      cpc,
      cvr,
      cpa,
      roas,
      cac,
      ltv,
      spend,
      revenue,
      raw_data,
    } = req.body;

    if (!brand_name || !snapshot_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.pool.query(
      `INSERT INTO growth_metrics_snapshots (brand_name, snapshot_date, channel, ctr, cpc, cvr, cpa, roas, cac, ltv, spend, revenue, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        brand_name,
        snapshot_date,
        channel,
        ctr,
        cpc,
        cvr,
        cpa,
        roas,
        cac,
        ltv,
        spend,
        revenue,
        raw_data ? JSON.stringify(raw_data) : null,
      ]
    );

    res.json({
      success: true,
      data: { id: result.rows[0]?.id },
    });
  } catch (error) {
    console.error('Error saving metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
