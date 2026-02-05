/**
 * Ads Performance API Routes
 * Provides endpoints for querying ad performance data and triggering sync workflows
 */

const express = require('express');
const router = express.Router();

// Database (lazy-loaded)
let db;
try {
  db = require('../../../db');
} catch (e) {
  console.warn('[Ads API] Database module not available');
}

// ==========================================
// Database Initialization
// ==========================================

async function initAdsDatabase() {
  if (!db || !db.pool) {
    console.warn('[Ads API] No database pool available, skipping init');
    return;
  }

  try {
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS ads_daily_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        tenant_id TEXT NOT NULL DEFAULT '5ml-internal',
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        date DATE NOT NULL,
        impressions BIGINT NOT NULL DEFAULT 0,
        reach BIGINT,
        clicks BIGINT NOT NULL DEFAULT 0,
        spend NUMERIC(18, 4) NOT NULL DEFAULT 0,
        conversions NUMERIC(18, 4),
        revenue NUMERIC(18, 4),
        cpc NUMERIC(18, 4),
        cpm NUMERIC(18, 4),
        ctr NUMERIC(10, 6),
        roas NUMERIC(10, 6),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_daily_perf_unique
        ON ads_daily_performance (platform, tenant_id, campaign_id, date);

      CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_date
        ON ads_daily_performance (date);

      CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_tenant
        ON ads_daily_performance (tenant_id, date);

      CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_campaign
        ON ads_daily_performance (platform, campaign_id, date);

      CREATE TABLE IF NOT EXISTS client_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        service TEXT NOT NULL,
        account_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        extra JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_client_credentials_tenant_service
        ON client_credentials (tenant_id, service);
    `);
    console.log('✅ Ads performance tables initialized');
  } catch (error) {
    console.error('[Ads API] Failed to initialize tables:', error.message);
  }
}

// Initialize on load
initAdsDatabase();

// ==========================================
// Helper Functions
// ==========================================

function getDateRange(from, to) {
  const now = new Date();
  const defaultTo = now.toISOString().split('T')[0];
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return {
    from: from || defaultFrom,
    to: to || defaultTo,
  };
}

// ==========================================
// GET /api/ads/performance
// Query ad performance data with filters
// ==========================================
router.get('/performance', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || '5ml-internal';

    const conditions = ['date >= $1', 'date <= $2', 'tenant_id = $3'];
    const params = [from, to, tenantId];

    if (platform !== 'all') {
      conditions.push('platform = $4');
      params.push(platform);
    }

    const sql = `
      SELECT
        id, platform, tenant_id, account_id,
        campaign_id, campaign_name,
        date::text, impressions, reach, clicks, spend,
        conversions, revenue, cpc, cpm, ctr, roas,
        created_at, updated_at
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      ORDER BY date DESC, campaign_name ASC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        from,
        to,
        platform,
        tenantId,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('[Ads API] Performance query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/performance/aggregated
// Aggregated daily metrics for charts
// ==========================================
router.get('/performance/aggregated', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || '5ml-internal';

    const conditions = ['date >= $1', 'date <= $2', 'tenant_id = $3'];
    const params = [from, to, tenantId];

    if (platform !== 'all') {
      conditions.push('platform = $4');
      params.push(platform);
    }

    const sql = `
      SELECT
        date::text,
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as roas
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      GROUP BY date
      ORDER BY date ASC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, platform, tenantId },
    });
  } catch (error) {
    console.error('[Ads API] Aggregated query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/performance/campaigns
// Campaign-level aggregation for ROAS bar chart
// ==========================================
router.get('/performance/campaigns', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || '5ml-internal';

    const conditions = ['date >= $1', 'date <= $2', 'tenant_id = $3'];
    const params = [from, to, tenantId];

    if (platform !== 'all') {
      conditions.push('platform = $4');
      params.push(platform);
    }

    const sql = `
      SELECT
        platform,
        campaign_id,
        campaign_name,
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as roas,
        CASE WHEN SUM(clicks) > 0
          THEN (SUM(spend) / NULLIF(SUM(clicks), 0))::numeric(18,4)
          ELSE 0 END as avg_cpc
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      GROUP BY platform, campaign_id, campaign_name
      ORDER BY roas DESC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, platform, tenantId },
    });
  } catch (error) {
    console.error('[Ads API] Campaigns query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/performance/kpis
// Summary KPIs for the dashboard cards
// ==========================================
router.get('/performance/kpis', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || '5ml-internal';

    const conditions = ['date >= $1', 'date <= $2', 'tenant_id = $3'];
    const params = [from, to, tenantId];

    if (platform !== 'all') {
      conditions.push('platform = $4');
      params.push(platform);
    }

    const kpiSql = `
      SELECT
        SUM(spend)::numeric(18,2) as total_spend,
        SUM(conversions)::numeric(18,2) as total_conversions,
        SUM(revenue)::numeric(18,2) as total_revenue,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as blended_roas,
        SUM(impressions)::bigint as total_impressions,
        SUM(clicks)::bigint as total_clicks,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(clicks)::numeric / SUM(impressions) * 100)::numeric(10,2)
          ELSE 0 END as avg_ctr
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
    `;

    const kpiResult = await db.pool.query(kpiSql, params);

    // Top 3 campaigns by ROAS
    const topCampaignsSql = `
      SELECT
        platform,
        campaign_name,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as roas,
        SUM(spend)::numeric(18,2) as spend
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      GROUP BY platform, campaign_id, campaign_name
      HAVING SUM(spend) > 0
      ORDER BY roas DESC
      LIMIT 3
    `;

    const topResult = await db.pool.query(topCampaignsSql, params);

    res.json({
      success: true,
      data: {
        ...kpiResult.rows[0],
        top_campaigns_by_roas: topResult.rows,
      },
      meta: { from, to, platform, tenantId },
    });
  } catch (error) {
    console.error('[Ads API] KPIs query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/tenants
// List all tenants with ads data
// ==========================================
router.get('/tenants', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const sql = `
      SELECT DISTINCT tenant_id,
        COUNT(DISTINCT campaign_id)::int as campaign_count,
        MIN(date)::text as earliest_date,
        MAX(date)::text as latest_date
      FROM ads_daily_performance
      GROUP BY tenant_id
      ORDER BY tenant_id
    `;

    const result = await db.pool.query(sql);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Ads API] Tenants query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST /api/ads/sync
// Trigger a manual sync for a tenant
// ==========================================
router.post('/sync', async (req, res) => {
  try {
    const tenantId = req.body.tenant_id || '5ml-internal';
    const since = req.body.since;
    const until = req.body.until;

    if (!since || !until) {
      return res.status(400).json({ error: 'since and until are required (YYYY-MM-DD)' });
    }

    // For now, return instructions on how to run the sync
    // In production, this would trigger the workflow
    res.json({
      success: true,
      message: `Sync requested for tenant ${tenantId} from ${since} to ${until}`,
      workflow: 'daily-sync',
      params: { tenantId, since, until },
      note: 'Workflow execution requires the orchestrator to be running. Use the daily-sync workflow with these parameters.',
    });
  } catch (error) {
    console.error('[Ads API] Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST /api/ads/credentials
// Add/update client credentials for multi-tenant
// ==========================================
router.post('/credentials', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { tenant_id, service, account_id, access_token, refresh_token, extra } = req.body;

    if (!tenant_id || !service || !account_id) {
      return res.status(400).json({ error: 'tenant_id, service, and account_id are required' });
    }

    const sql = `
      INSERT INTO client_credentials (tenant_id, service, account_id, access_token, refresh_token, extra)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id, service)
      DO UPDATE SET
        account_id = EXCLUDED.account_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        extra = EXCLUDED.extra,
        updated_at = now()
      RETURNING id, tenant_id, service, account_id, created_at, updated_at
    `;

    const result = await db.pool.query(sql, [
      tenant_id,
      service,
      account_id,
      access_token || null,
      refresh_token || null,
      extra ? JSON.stringify(extra) : null,
    ]);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Ads API] Credentials error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/overview
// Multi-tenant overview aggregation
// ==========================================
router.get('/overview', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);

    const sql = `
      SELECT
        tenant_id,
        SUM(spend)::numeric(18,2) as total_spend,
        SUM(conversions)::numeric(18,2) as total_conversions,
        SUM(revenue)::numeric(18,2) as total_revenue,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as blended_roas,
        COUNT(DISTINCT campaign_id)::int as campaign_count
      FROM ads_daily_performance
      WHERE date >= $1 AND date <= $2
      GROUP BY tenant_id
      ORDER BY total_spend DESC
    `;

    const result = await db.pool.query(sql, [from, to]);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to },
    });
  } catch (error) {
    console.error('[Ads API] Overview query error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
