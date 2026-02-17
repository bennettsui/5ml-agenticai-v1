/**
 * Growth Architect API Routes
 * Endpoints for growth plan generation, management, and weekly reviews
 */

const express = require('express');
const router = express.Router();
const { generateGrowthPlan } = require('../agents/growthArchitectOrchestrator');
const { generateWeeklyReview } = require('../agents/reportingAgent');
const { generateCopyAssets } = require('../agents/copyAgent');
const { generateSocialContent } = require('../agents/socialAgent');
const { designCrmFlow, generateEdmCampaign } = require('../agents/crmCommunicationAgent');

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

// ==========================================
// Phase 2: Asset Generation (nanobanana + social)
// ==========================================

/**
 * POST /api/growth/assets/generate
 * Generate copy or social assets for a brand
 * Body: { brand_name, agent, asset_type, channel, funnel_stage, icp, product_brief, ... }
 */
router.post('/assets/generate', async (req, res) => {
  try {
    const {
      brand_name,
      agent = 'copy',        // 'copy' | 'social'
      asset_type,
      channel,
      funnel_stage = 'awareness',
      icp,
      product_brief,
      campaign_theme,
      pillar = 'education',
      platform,
      format,
      experiment_hypothesis,
      variants = 3,
      count = 2,
    } = req.body;

    if (!brand_name || !icp || !product_brief) {
      return res.status(400).json({ error: 'Missing required: brand_name, icp, product_brief' });
    }

    let result;

    if (agent === 'copy') {
      if (!asset_type || !channel) {
        return res.status(400).json({ error: 'Copy agent requires: asset_type, channel' });
      }
      result = await generateCopyAssets(
        brand_name, icp, product_brief, asset_type, funnel_stage,
        channel, experiment_hypothesis, { variants }
      );
    } else if (agent === 'social') {
      if (!platform || !format) {
        return res.status(400).json({ error: 'Social agent requires: platform, format' });
      }
      result = await generateSocialContent(
        brand_name, icp, product_brief, platform, format,
        campaign_theme || '', pillar, { count }
      );
    } else {
      return res.status(400).json({ error: 'Invalid agent. Use: copy | social' });
    }

    // Save assets to DB if available
    const savedIds = [];
    if (db && db.pool) {
      const assetsToSave = result.variants || result.assets || [];
      for (const asset of assetsToSave) {
        try {
          const r = await db.pool.query(
            `INSERT INTO growth_assets (brand_name, asset_type, channel, funnel_stage, tag, content, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
              asset.brand_name || brand_name,
              asset.asset_type,
              asset.channel,
              asset.funnel_stage,
              asset.tag,
              JSON.stringify(asset.content),
              'draft',
            ]
          );
          savedIds.push(r.rows[0]?.id);
        } catch (dbErr) {
          console.warn('[growth/assets] DB save error:', dbErr.message);
        }
      }
    }

    res.json({
      success: true,
      data: { ...result, saved_ids: savedIds },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[growth/assets/generate] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/assets/:brand_name
 * List assets for a brand with optional filters
 */
router.get('/assets/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name } = req.params;
    const { asset_type, channel, funnel_stage, status, limit = 50, offset = 0 } = req.query;

    let query = `SELECT id, brand_name, asset_type, channel, funnel_stage, tag, content, status, performance, created_at
                 FROM growth_assets WHERE brand_name = $1`;
    const params = [brand_name];

    if (asset_type) { query += ` AND asset_type = $${params.length + 1}`; params.push(asset_type); }
    if (channel)    { query += ` AND channel = $${params.length + 1}`;    params.push(channel); }
    if (funnel_stage) { query += ` AND funnel_stage = $${params.length + 1}`; params.push(funnel_stage); }
    if (status)     { query += ` AND status = $${params.length + 1}`;     params.push(status); }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('[growth/assets] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/growth/assets/:id
 * Update asset status or add performance data
 */
router.patch('/assets/:id', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { id } = req.params;
    const { status, performance } = req.body;

    const updates = ['updated_at = now()'];
    const params = [id];

    if (status)      { updates.push(`status = $${params.length + 1}`);      params.push(status); }
    if (performance) { updates.push(`performance = $${params.length + 1}`);  params.push(JSON.stringify(performance)); }

    const result = await db.pool.query(
      `UPDATE growth_assets SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[growth/assets PATCH] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Phase 2: CRM Flows
// ==========================================

/**
 * POST /api/growth/crm-flows
 * Design a CRM communication flow for a brand
 */
router.post('/crm-flows', async (req, res) => {
  try {
    const { brand_name, product_brief, icp, trigger_event, audience_segment, flow_type } = req.body;

    if (!brand_name || !product_brief || !icp || !trigger_event) {
      return res.status(400).json({ error: 'Missing required: brand_name, product_brief, icp, trigger_event' });
    }

    const result = await designCrmFlow(
      brand_name, product_brief, icp, trigger_event,
      audience_segment || 'all', flow_type || 'lead_nurture'
    );

    // Save to DB
    let flowId = null;
    if (db && db.pool) {
      try {
        const r = await db.pool.query(
          `INSERT INTO growth_crm_flows (brand_name, flow_name, trigger_event, audience_segment, flow_steps, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            brand_name,
            result.flow?.flow_name || `${brand_name} ${flow_type}`,
            trigger_event,
            audience_segment || 'all',
            JSON.stringify(result.flow?.steps || []),
            'draft',
          ]
        );
        flowId = r.rows[0]?.id;
      } catch (dbErr) {
        console.warn('[crm-flows] DB save error:', dbErr.message);
      }
    }

    res.json({ success: true, data: { flow_id: flowId, ...result }, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[growth/crm-flows] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/crm-flows/:brand_name
 * List CRM flows for a brand
 */
router.get('/crm-flows/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.pool.query(
      `SELECT id, brand_name, flow_name, trigger_event, audience_segment, flow_steps, status, created_at
       FROM growth_crm_flows WHERE brand_name = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [brand_name, limit, offset]
    );

    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('[growth/crm-flows GET] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Phase 2: EDM Campaigns
// ==========================================

/**
 * POST /api/growth/edm/generate
 * Generate an EDM campaign (HTML email)
 */
router.post('/edm/generate', async (req, res) => {
  try {
    const { brand_name, product_brief, icp, campaign_type, campaign_theme } = req.body;

    if (!brand_name || !product_brief || !icp || !campaign_type) {
      return res.status(400).json({ error: 'Missing required: brand_name, product_brief, icp, campaign_type' });
    }

    const result = await generateEdmCampaign(
      brand_name, product_brief, icp, campaign_type, campaign_theme || campaign_type
    );

    // Save to DB
    let campaignId = null;
    if (db && db.pool) {
      try {
        const r = await db.pool.query(
          `INSERT INTO growth_edm_campaigns
             (brand_name, campaign_name, campaign_type, subject, preview_text, html_content, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            brand_name,
            result.campaign_name,
            result.campaign_type,
            result.subject,
            result.preview_text,
            result.html_content,
            'draft',
          ]
        );
        campaignId = r.rows[0]?.id;
      } catch (dbErr) {
        console.warn('[edm/generate] DB save error:', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        campaign_id: campaignId,
        campaign_name: result.campaign_name,
        subject: result.subject,
        preview_text: result.preview_text,
        html_content: result.html_content,
        _meta: result._meta,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[growth/edm/generate] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/edm/:brand_name
 * List EDM campaigns for a brand
 */
router.get('/edm/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.pool.query(
      `SELECT id, brand_name, campaign_name, campaign_type, subject, preview_text,
              status, sent_at, open_rate, click_rate, created_at
       FROM growth_edm_campaigns WHERE brand_name = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [brand_name, limit, offset]
    );

    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('[growth/edm GET] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/edm/:brand_name/:id/preview
 * Get full HTML of a specific EDM
 */
router.get('/edm/:brand_name/:id/preview', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { id } = req.params;
    const result = await db.pool.query(
      `SELECT html_content, subject FROM growth_edm_campaigns WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    // Return raw HTML for iframe preview
    res.setHeader('Content-Type', 'text/html');
    res.send(result.rows[0].html_content);
  } catch (error) {
    console.error('[growth/edm/preview] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Knowledge Base (KB) & RAG
// ==========================================

/**
 * POST /api/growth/kb/seed
 * Seed KB for a brand based on growth plan
 * Body: { brand_name, plan_id?, content_type? }
 */
router.post('/kb/seed', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name, plan_id } = req.body;
    if (!brand_name) return res.status(400).json({ error: 'Missing brand_name' });

    console.log(`🌱 Seeding KB for ${brand_name}`);

    // Fetch growth plan if available
    let planData = {};
    if (plan_id) {
      const planResult = await db.pool.query(
        `SELECT plan_data FROM growth_plans WHERE id = $1`,
        [plan_id]
      );
      if (planResult.rows.length > 0) {
        planData = planResult.rows[0].plan_data;
      }
    }

    // Seed KB entries from plan
    const kbEntries = [];

    // Add ICP data
    if (planData?.block_1?.icp_segments) {
      planData.block_1.icp_segments.forEach((segment, idx) => {
        kbEntries.push({
          category: 'icp',
          title: `ICP Segment ${idx + 1}: ${segment.name || 'Unnamed'}`,
          content: JSON.stringify(segment),
          metadata: { plan_id, segment_index: idx },
        });
      });
    }

    // Add growth loop data
    if (planData?.block_2?.growth_loops) {
      planData.block_2.growth_loops.forEach((loop, idx) => {
        kbEntries.push({
          category: 'experiment',
          title: `Growth Loop ${idx + 1}: ${loop.name || 'Unnamed'}`,
          content: JSON.stringify(loop),
          metadata: { plan_id, loop_index: idx },
        });
      });
    }

    // Add playbook / strategy
    if (planData?.block_5) {
      kbEntries.push({
        category: 'playbook',
        title: `Growth Infrastructure & Tooling`,
        content: JSON.stringify(planData.block_5),
        metadata: { plan_id },
      });
    }

    // Insert KB entries
    let inserted = 0;
    for (const entry of kbEntries) {
      try {
        await db.pool.query(
          `INSERT INTO growth_kb (brand_name, category, title, content, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            brand_name,
            entry.category,
            entry.title,
            entry.content,
            JSON.stringify(entry.metadata),
          ]
        );
        inserted++;
      } catch (e) {
        console.warn(`[KB seed] Failed to insert ${entry.title}:`, e.message);
      }
    }

    res.json({
      success: true,
      message: `Seeded ${inserted} KB entries for ${brand_name}`,
      entries_count: inserted,
    });
  } catch (error) {
    console.error('[KB seed] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/kb/:brand_name
 * Search KB for a brand by category or query
 * Query: ?category=icp&search=senior&limit=20
 */
router.get('/kb/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name } = req.params;
    const { category, search, limit = 20, offset = 0 } = req.query;

    let query = `SELECT id, brand_name, category, title, content, metadata, created_at
                 FROM growth_kb WHERE brand_name = $1`;
    const params = [brand_name];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[KB GET] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/growth/kb/:id
 * Delete a KB entry
 */
router.delete('/kb/:id', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { id } = req.params;
    const result = await db.pool.query(
      `DELETE FROM growth_kb WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'KB entry not found' });

    res.json({ success: true, message: 'KB entry deleted' });
  } catch (error) {
    console.error('[KB DELETE] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROAS & Financial Modeling
// ==========================================

/**
 * POST /api/growth/roas/analyze
 * Analyze performance data and build ROAS model
 * Body: { brand_name, product_brief, plan_id?, days? }
 */
router.post('/roas/analyze', async (req, res) => {
  try {
    const { brand_name, product_brief, plan_id, days = 90 } = req.body;
    if (!brand_name || !product_brief) {
      return res.status(400).json({ error: 'Missing brand_name or product_brief' });
    }

    console.log(`💰 Analyzing ROAS for ${brand_name}`);

    const analyticsAgent = require('../agents/growthAnalyticsAgent');
    const analysis = await analyticsAgent.analyzePerformanceAndBuildModel(
      db,
      brand_name,
      product_brief,
      { days }
    );

    // Save ROAS model
    const roasModel =
      db && db.pool && plan_id
        ? await analyticsAgent.createRoasModel(db, brand_name, plan_id, analysis)
        : null;

    // Project scenarios
    const scenarios = await analyticsAgent.projectRevenueScenarios(analysis);

    res.json({
      success: true,
      analysis,
      roas_model_id: roasModel?.id,
      scenarios,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ROAS analyze] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/roas/:brand_name
 * Get ROAS models for a brand
 */
router.get('/roas/:brand_name', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { brand_name } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const result = await db.pool.query(
      `SELECT id, brand_name, plan_id, base_spend, base_revenue, base_roas,
              channel_mix, scaling_assumptions, projections, status, created_at
       FROM growth_roas_models
       WHERE brand_name = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [brand_name, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[ROAS GET] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/growth/roas/:brand_name/:id
 * Get a specific ROAS model with full details
 */
router.get('/roas/:brand_name/:id', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { id } = req.params;

    const result = await db.pool.query(
      `SELECT id, brand_name, plan_id, base_spend, base_revenue, base_roas,
              channel_mix, scaling_assumptions, projections, ltv_assumptions,
              break_even_spend, status, created_at
       FROM growth_roas_models
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'ROAS model not found' });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[ROAS GET by ID] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/growth/roas/:id
 * Update ROAS model (status, scaling_assumptions, etc.)
 */
router.patch('/roas/:id', async (req, res) => {
  try {
    if (!db || !db.pool) return res.status(503).json({ error: 'Database not available' });

    const { id } = req.params;
    const { status, scaling_assumptions, ltv_assumptions } = req.body;

    const updates = [];
    const params = [id];

    if (status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (scaling_assumptions) {
      updates.push(`scaling_assumptions = $${params.length + 1}`);
      params.push(JSON.stringify(scaling_assumptions));
    }

    if (ltv_assumptions) {
      updates.push(`ltv_assumptions = $${params.length + 1}`);
      params.push(JSON.stringify(ltv_assumptions));
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = now()');

    const result = await db.pool.query(
      `UPDATE growth_roas_models SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'ROAS model not found' });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[ROAS PATCH] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
