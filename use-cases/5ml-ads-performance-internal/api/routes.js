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
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, service)
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// Meta Ads API - Fetch + Normalize
// ==========================================

const META_API_BASE = 'https://graph.facebook.com/v20.0';
const META_INSIGHT_FIELDS = [
  'campaign_id', 'campaign_name', 'date_start', 'date_stop',
  'impressions', 'reach', 'clicks', 'spend',
  'actions', 'action_values', 'website_purchase_roas',
  'cpc', 'cpm', 'ctr',
].join(',');

function extractConversions(actions) {
  if (!actions) return null;
  const pa = actions.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return pa ? parseFloat(pa.value) : null;
}

function extractRevenue(actionValues) {
  if (!actionValues) return null;
  const pv = actionValues.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return pv ? parseFloat(pv.value) : null;
}

function extractRoas(roas) {
  if (!roas || roas.length === 0) return null;
  const pr = roas.find((r) => r.action_type === 'offsite_conversion.fb_pixel_purchase');
  return pr ? parseFloat(pr.value) : (roas[0] ? parseFloat(roas[0].value) : null);
}

function normalizeMetaRow(accountId, row) {
  return {
    platform: 'meta',
    accountId,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    date: row.date_start,
    impressions: parseInt(row.impressions, 10) || 0,
    reach: parseInt(row.reach, 10) || 0,
    clicks: parseInt(row.clicks, 10) || 0,
    spend: parseFloat(row.spend) || 0,
    conversions: extractConversions(row.actions),
    revenue: extractRevenue(row.action_values),
    cpc: row.cpc ? parseFloat(row.cpc) : null,
    cpm: row.cpm ? parseFloat(row.cpm) : null,
    ctr: row.ctr ? parseFloat(row.ctr) : null,
    roas: extractRoas(row.website_purchase_roas),
  };
}

async function fetchMetaInsights(accountId, since, until, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required');

  const acctId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const results = [];

  let url =
    `${META_API_BASE}/${acctId}/insights?` +
    new URLSearchParams({
      time_range: JSON.stringify({ since, until }),
      level: 'campaign',
      time_increment: '1',
      fields: META_INSIGHT_FIELDS,
      limit: '500',
      access_token: token,
    }).toString();

  let retries = 0;
  while (url) {
    const response = await fetch(url);

    if (response.status === 429) {
      retries++;
      if (retries > 3) throw new Error('Meta API rate limit exceeded after max retries');
      const wait = Math.pow(2, retries) * 1000;
      console.warn(`[Meta API] Rate limited, retrying in ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Meta API error ${response.status}: ${body}`);
    }

    const json = await response.json();
    retries = 0;

    for (const row of json.data) {
      results.push(normalizeMetaRow(accountId, row));
    }

    url = json.paging?.next || null;
  }

  console.log(`[Meta API] Fetched ${results.length} daily metrics for ${acctId}`);
  return results;
}

// ==========================================
// Google Ads API - Fetch + Normalize
// ==========================================

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

async function getGoogleAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google OAuth error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizeGoogleRow(customerId, row) {
  if (!row.campaign?.id || !row.segments?.date) return null;

  const costMicros = row.metrics?.costMicros ? parseInt(row.metrics.costMicros, 10) : 0;
  const spend = costMicros / 1_000_000;
  const impressions = row.metrics?.impressions ? parseInt(row.metrics.impressions, 10) : 0;
  const clicks = row.metrics?.clicks ? parseInt(row.metrics.clicks, 10) : 0;
  const conversions = row.metrics?.conversions ?? null;
  const revenue = row.metrics?.conversionsValue ?? null;

  return {
    platform: 'google',
    customerId,
    campaignId: String(row.campaign.id),
    campaignName: row.campaign.name || '',
    date: row.segments.date,
    impressions,
    clicks,
    spend,
    conversions,
    revenue,
    cpc: clicks > 0 ? spend / clicks : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    ctr: row.metrics?.ctr ?? null,
    roas: revenue !== null && spend > 0 ? revenue / spend : null,
  };
}

async function fetchGoogleAdsMetrics(customerId, since, until, credentials) {
  const devToken = credentials.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const cId = credentials.clientId || process.env.GOOGLE_ADS_CLIENT_ID;
  const cSecret = credentials.clientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET;
  const rToken = credentials.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const loginCid = credentials.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is required');
  if (!cId) throw new Error('GOOGLE_ADS_CLIENT_ID is required');
  if (!cSecret) throw new Error('GOOGLE_ADS_CLIENT_SECRET is required');
  if (!rToken) throw new Error('GOOGLE_ADS_REFRESH_TOKEN is required');

  const accessToken = await getGoogleAccessToken(cId, cSecret, rToken);
  const cleanId = customerId.replace(/-/g, '');

  const query = `
    SELECT
      campaign.id, campaign.name, segments.date,
      metrics.impressions, metrics.clicks, metrics.ctr,
      metrics.average_cpc, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
  `.trim();

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  };
  if (loginCid) headers['login-customer-id'] = loginCid.replace(/-/g, '');

  const url = `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Ads API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const results = [];

  for (const batch of data) {
    if (batch.results) {
      for (const row of batch.results) {
        const metric = normalizeGoogleRow(customerId, row);
        if (metric) results.push(metric);
      }
    }
  }

  console.log(`[Google Ads API] Fetched ${results.length} daily metrics for ${customerId}`);
  return results;
}

// ==========================================
// DB Upsert helper
// ==========================================

async function upsertMetrics(pool, metrics, tenantId) {
  let count = 0;
  for (const m of metrics) {
    const accountId = m.accountId || m.customerId || '';
    const reach = m.reach ?? null;

    await pool.query(
      `INSERT INTO ads_daily_performance
        (platform, tenant_id, account_id, campaign_id, campaign_name, date,
         impressions, reach, clicks, spend, conversions, revenue, cpc, cpm, ctr, roas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (platform, tenant_id, campaign_id, date)
       DO UPDATE SET
         campaign_name = EXCLUDED.campaign_name,
         impressions = EXCLUDED.impressions,
         reach = EXCLUDED.reach,
         clicks = EXCLUDED.clicks,
         spend = EXCLUDED.spend,
         conversions = EXCLUDED.conversions,
         revenue = EXCLUDED.revenue,
         cpc = EXCLUDED.cpc,
         cpm = EXCLUDED.cpm,
         ctr = EXCLUDED.ctr,
         roas = EXCLUDED.roas,
         updated_at = now()`,
      [
        m.platform, tenantId, accountId, m.campaignId, m.campaignName, m.date,
        m.impressions, reach, m.clicks, m.spend, m.conversions, m.revenue,
        m.cpc, m.cpm, m.ctr, m.roas,
      ]
    );
    count++;
  }
  return count;
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
// Trigger a live sync from Meta and/or Google Ads
// ==========================================
router.post('/sync', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const tenantId = req.body.tenant_id || '5ml-internal';
    const since = req.body.since;
    const until = req.body.until;
    const platforms = req.body.platforms || ['meta', 'google']; // default both

    if (!since || !until) {
      return res.status(400).json({ error: 'since and until are required (YYYY-MM-DD)' });
    }

    const results = { meta: null, google: null, errors: [] };

    // --- Meta sync ---
    if (platforms.includes('meta')) {
      const metaAccountId = req.body.meta_account_id || process.env.META_AD_ACCOUNT_ID;
      const metaToken = req.body.meta_access_token || process.env.META_ACCESS_TOKEN;

      if (metaAccountId && metaToken) {
        try {
          console.log(`[Sync] Fetching Meta Ads for ${metaAccountId} (${since} to ${until})...`);
          const metaMetrics = await fetchMetaInsights(metaAccountId, since, until, metaToken);
          const metaCount = await upsertMetrics(db.pool, metaMetrics, tenantId);
          results.meta = { fetched: metaMetrics.length, upserted: metaCount };
          console.log(`[Sync] Meta: ${metaCount} rows upserted`);
        } catch (err) {
          console.error('[Sync] Meta error:', err.message);
          results.errors.push({ platform: 'meta', error: err.message });
        }
      } else {
        results.errors.push({
          platform: 'meta',
          error: 'Missing META_AD_ACCOUNT_ID or META_ACCESS_TOKEN',
        });
      }
    }

    // --- Google sync ---
    if (platforms.includes('google')) {
      const googleCustomerId = req.body.google_customer_id || process.env.GOOGLE_ADS_CUSTOMER_ID;
      const googleCreds = {
        developerToken: req.body.google_developer_token,
        clientId: req.body.google_client_id,
        clientSecret: req.body.google_client_secret,
        refreshToken: req.body.google_refresh_token,
        loginCustomerId: req.body.google_login_customer_id,
      };

      if (googleCustomerId) {
        try {
          console.log(`[Sync] Fetching Google Ads for ${googleCustomerId} (${since} to ${until})...`);
          const googleMetrics = await fetchGoogleAdsMetrics(googleCustomerId, since, until, googleCreds);
          const googleCount = await upsertMetrics(db.pool, googleMetrics, tenantId);
          results.google = { fetched: googleMetrics.length, upserted: googleCount };
          console.log(`[Sync] Google: ${googleCount} rows upserted`);
        } catch (err) {
          console.error('[Sync] Google error:', err.message);
          results.errors.push({ platform: 'google', error: err.message });
        }
      } else {
        results.errors.push({
          platform: 'google',
          error: 'Missing GOOGLE_ADS_CUSTOMER_ID',
        });
      }
    }

    const hasData = results.meta || results.google;

    res.json({
      success: hasData ? true : false,
      data: results,
      meta: { tenantId, since, until, platforms },
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

// ==========================================
// GET /api/ads/meta/adaccounts
// Discover ad accounts accessible by the current Meta token
// ==========================================
router.get('/meta/adaccounts', async (req, res) => {
  try {
    const token = req.query.access_token || process.env.META_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: 'META_ACCESS_TOKEN is required (set as env var or pass as ?access_token=)' });
    }

    const url = `${META_API_BASE}/me/adaccounts?` +
      new URLSearchParams({
        fields: 'id,name,account_id,account_status,currency,business_name',
        limit: '100',
        access_token: token,
      }).toString();

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: `Meta API error: ${body}` });
    }

    const json = await response.json();

    res.json({
      success: true,
      data: json.data,
      hint: 'Use the "id" field (e.g. act_123456789) as META_AD_ACCOUNT_ID',
    });
  } catch (error) {
    console.error('[Ads API] Ad accounts lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
