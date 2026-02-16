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

      -- Campaign details table
      CREATE TABLE IF NOT EXISTS ads_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        objective TEXT,
        status TEXT,
        effective_status TEXT,
        buying_type TEXT,
        bid_strategy TEXT,
        daily_budget NUMERIC(18, 4),
        lifetime_budget NUMERIC(18, 4),
        budget_remaining NUMERIC(18, 4),
        start_time TIMESTAMPTZ,
        stop_time TIMESTAMPTZ,
        created_time TIMESTAMPTZ,
        updated_time TIMESTAMPTZ,
        raw_data JSONB,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (platform, tenant_id, campaign_id)
      );

      CREATE INDEX IF NOT EXISTS idx_ads_campaigns_tenant
        ON ads_campaigns (tenant_id);

      -- Ad set details table (targeting, budget, bidding at ad-set level)
      CREATE TABLE IF NOT EXISTS ads_adsets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        adset_id TEXT NOT NULL,
        adset_name TEXT NOT NULL,
        status TEXT,
        effective_status TEXT,
        optimization_goal TEXT,
        billing_event TEXT,
        bid_strategy TEXT,
        bid_amount NUMERIC(18, 4),
        daily_budget NUMERIC(18, 4),
        lifetime_budget NUMERIC(18, 4),
        targeting JSONB,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        created_time TIMESTAMPTZ,
        updated_time TIMESTAMPTZ,
        raw_data JSONB,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (platform, tenant_id, adset_id)
      );

      CREATE INDEX IF NOT EXISTS idx_ads_adsets_tenant
        ON ads_adsets (tenant_id);

      CREATE INDEX IF NOT EXISTS idx_ads_adsets_campaign
        ON ads_adsets (tenant_id, campaign_id);

      -- Ad + creative details table
      CREATE TABLE IF NOT EXISTS ads_creatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        ad_id TEXT NOT NULL,
        ad_name TEXT,
        adset_id TEXT,
        campaign_id TEXT,
        creative_id TEXT,
        creative_name TEXT,
        title TEXT,
        body TEXT,
        description TEXT,
        image_url TEXT,
        thumbnail_url TEXT,
        video_id TEXT,
        link_url TEXT,
        call_to_action_type TEXT,
        status TEXT,
        effective_status TEXT,
        raw_creative JSONB,
        raw_ad JSONB,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (platform, tenant_id, ad_id)
      );

      CREATE INDEX IF NOT EXISTS idx_ads_creatives_tenant
        ON ads_creatives (tenant_id);

      CREATE INDEX IF NOT EXISTS idx_ads_creatives_campaign
        ON ads_creatives (tenant_id, campaign_id);

      -- Ad-level columns migration (add ad_id, ad_name to daily performance)
      ALTER TABLE ads_daily_performance ADD COLUMN IF NOT EXISTS ad_id TEXT NOT NULL DEFAULT '';
      ALTER TABLE ads_daily_performance ADD COLUMN IF NOT EXISTS ad_name TEXT NOT NULL DEFAULT '';

      -- Recreate unique index to include ad_id
      DROP INDEX IF EXISTS idx_ads_daily_perf_unique;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_daily_perf_unique
        ON ads_daily_performance (platform, tenant_id, campaign_id, ad_id, date);
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

// Normalize Meta account ID to act_ format
function normalizeAccountId(accountId) {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

// ==========================================
// Meta Ads API - Fetch + Normalize
// ==========================================

const META_API_BASE = 'https://graph.facebook.com/v20.0';
const META_INSIGHT_FIELDS = [
  'campaign_id', 'campaign_name', 'ad_id', 'ad_name',
  'date_start', 'date_stop',
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
    adId: row.ad_id || '',
    adName: row.ad_name || '',
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

// Generic paginated Meta API fetcher with rate-limit retry
async function fetchMetaPaginated(url) {
  const results = [];
  let retries = 0;
  let currentUrl = url;

  while (currentUrl) {
    try {
      const response = await fetch(currentUrl);

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
        // Log detailed API error
        console.error('META_API_RESPONSE_ERROR', JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          body: body.substring(0, 500),
          url: currentUrl.replace(/access_token=[^&]+/, 'access_token=***'),
        }));
        throw new Error(`Meta API error ${response.status}: ${body}`);
      }

      const json = await response.json();
      retries = 0;

      if (json.data) {
        for (const row of json.data) {
          results.push(row);
        }
      }

      currentUrl = json.paging?.next || null;
    } catch (err) {
      // Log full error details for debugging
      console.error('META_FETCH_ERROR', JSON.stringify({
        message: err.message,
        code: err.code,
        cause: err.cause?.message,
        type: err.name,
        url: currentUrl?.replace(/access_token=[^&]+/, 'access_token=***'),
        nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
      }));
      throw err;
    }
  }

  return results;
}

async function fetchMetaInsights(accountId, since, until, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required');

  const acctId = normalizeAccountId(accountId);

  const url =
    `${META_API_BASE}/${acctId}/insights?` +
    new URLSearchParams({
      time_range: JSON.stringify({ since, until }),
      level: 'ad',
      time_increment: '1',
      fields: META_INSIGHT_FIELDS,
      limit: '500',
      access_token: token,
    }).toString();

  const rawRows = await fetchMetaPaginated(url);
  const results = rawRows.map((row) => normalizeMetaRow(accountId, row));

  console.log(`[Meta API] Fetched ${results.length} daily metrics for ${acctId}`);
  return results;
}

// Fetch campaign details from Meta
async function fetchMetaCampaigns(accountId, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required');

  const acctId = normalizeAccountId(accountId);
  const fields = [
    'id', 'name', 'objective', 'status', 'effective_status',
    'buying_type', 'bid_strategy',
    'daily_budget', 'lifetime_budget', 'budget_remaining',
    'start_time', 'stop_time', 'created_time', 'updated_time',
  ].join(',');

  const url = `${META_API_BASE}/${acctId}/campaigns?` +
    new URLSearchParams({ fields, limit: '500', access_token: token }).toString();

  const data = await fetchMetaPaginated(url);
  console.log(`[Meta API] Fetched ${data.length} campaigns for ${acctId}`);
  return data;
}

// Fetch ad set details (includes targeting) from Meta
async function fetchMetaAdSets(accountId, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required');

  const acctId = normalizeAccountId(accountId);
  const fields = [
    'id', 'name', 'campaign_id', 'status', 'effective_status',
    'optimization_goal', 'billing_event',
    'bid_strategy', 'bid_amount',
    'daily_budget', 'lifetime_budget',
    'targeting',
    'start_time', 'end_time', 'created_time', 'updated_time',
  ].join(',');

  const url = `${META_API_BASE}/${acctId}/adsets?` +
    new URLSearchParams({ fields, limit: '500', access_token: token }).toString();

  const data = await fetchMetaPaginated(url);
  console.log(`[Meta API] Fetched ${data.length} ad sets for ${acctId}`);
  return data;
}

// Fetch ads with creative details from Meta
async function fetchMetaAds(accountId, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required');

  const acctId = normalizeAccountId(accountId);
  const fields = [
    'id', 'name', 'adset_id', 'campaign_id',
    'status', 'effective_status',
    'creative{id,name,title,body,image_url,image_hash,thumbnail_url,video_id,link_url,call_to_action_type,object_story_spec}',
    'created_time', 'updated_time',
  ].join(',');

  const url = `${META_API_BASE}/${acctId}/ads?` +
    new URLSearchParams({ fields, limit: '500', access_token: token }).toString();

  const data = await fetchMetaPaginated(url);
  console.log(`[Meta API] Fetched ${data.length} ads for ${acctId}`);
  return data;
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
    adId: row.adGroupAd?.ad?.id ? String(row.adGroupAd.ad.id) : '',
    adName: row.adGroupAd?.ad?.name || '',
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
      campaign.id, campaign.name,
      ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type,
      segments.date,
      metrics.impressions, metrics.clicks, metrics.ctr,
      metrics.average_cpc, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND ad_group_ad.status != 'REMOVED'
  `.trim();

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  };
  if (loginCid) headers['login-customer-id'] = loginCid.replace(/-/g, '');

  const url = `${GOOGLE_ADS_BASE}/customers/${cleanId}:search`;

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

  // Handle search endpoint response (single object with results array)
  if (data.results) {
    for (const row of data.results) {
      const metric = normalizeGoogleRow(customerId, row);
      if (metric) results.push(metric);
    }
  }

  console.log(`[Google Ads API] Fetched ${results.length} daily metrics for ${customerId}`);
  return results;
}

// ==========================================
// Google Ads API - Fetch Campaign Details
// ==========================================

async function fetchGoogleAdsCampaigns(customerId, credentials) {
  const devToken = credentials.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const cId = credentials.clientId || process.env.GOOGLE_ADS_CLIENT_ID;
  const cSecret = credentials.clientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET;
  const rToken = credentials.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const loginCid = credentials.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!cId || !cSecret || !rToken) throw new Error('Google OAuth credentials required');

  const accessToken = await getGoogleAccessToken(cId, cSecret, rToken);
  const cleanId = customerId.replace(/-/g, '');

  const query = `
    SELECT
      campaign.id, campaign.name,
      campaign.advertising_channel_type,
      campaign.status,
      campaign.bidding_strategy_type,
      campaign.start_date, campaign.end_date
    FROM campaign
  `.trim();

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  };
  if (loginCid) headers['login-customer-id'] = loginCid.replace(/-/g, '');

  const url = `${GOOGLE_ADS_BASE}/customers/${cleanId}:search`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Ads campaign details error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const campaigns = [];

  // Handle search endpoint response (single object with results array)
  if (data.results) {
    for (const row of data.results) {
      if (row.campaign) {
        campaigns.push({
          id: String(row.campaign.id),
          name: row.campaign.name || '',
          objective: row.campaign.advertisingChannelType || null,
          status: row.campaign.status || null,
          effective_status: row.campaign.status || null,
          buying_type: null,
          bid_strategy: row.campaign.biddingStrategyType || null,
          daily_budget: null,
          lifetime_budget: null,
          budget_remaining: null,
          start_time: row.campaign.startDate || null,
          stop_time: row.campaign.endDate || null,
          created_time: null,
          updated_time: null,
        });
      }
    }
  }

  console.log(`[Google Ads API] Fetched ${campaigns.length} campaign details for ${customerId}`);
  return campaigns;
}

// ==========================================
// DB Upsert helpers
// ==========================================

async function upsertMetrics(pool, metrics, tenantId) {
  let count = 0;
  for (const m of metrics) {
    const accountId = m.accountId || m.customerId || '';
    const reach = m.reach ?? null;
    const adId = m.adId || '';
    const adName = m.adName || '';

    await pool.query(
      `INSERT INTO ads_daily_performance
        (platform, tenant_id, account_id, campaign_id, campaign_name, ad_id, ad_name, date,
         impressions, reach, clicks, spend, conversions, revenue, cpc, cpm, ctr, roas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (platform, tenant_id, campaign_id, ad_id, date)
       DO UPDATE SET
         campaign_name = EXCLUDED.campaign_name,
         ad_name = EXCLUDED.ad_name,
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
        m.platform, tenantId, accountId, m.campaignId, m.campaignName, adId, adName, m.date,
        m.impressions, reach, m.clicks, m.spend, m.conversions, m.revenue,
        m.cpc, m.cpm, m.ctr, m.roas,
      ]
    );
    count++;
  }
  return count;
}

async function upsertCampaigns(pool, campaigns, tenantId, accountId, platform) {
  let count = 0;
  for (const c of campaigns) {
    await pool.query(
      `INSERT INTO ads_campaigns
        (platform, tenant_id, account_id, campaign_id, campaign_name,
         objective, status, effective_status, buying_type, bid_strategy,
         daily_budget, lifetime_budget, budget_remaining,
         start_time, stop_time, created_time, updated_time, raw_data, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now())
       ON CONFLICT (platform, tenant_id, campaign_id)
       DO UPDATE SET
         campaign_name = EXCLUDED.campaign_name,
         objective = EXCLUDED.objective,
         status = EXCLUDED.status,
         effective_status = EXCLUDED.effective_status,
         buying_type = EXCLUDED.buying_type,
         bid_strategy = EXCLUDED.bid_strategy,
         daily_budget = EXCLUDED.daily_budget,
         lifetime_budget = EXCLUDED.lifetime_budget,
         budget_remaining = EXCLUDED.budget_remaining,
         start_time = EXCLUDED.start_time,
         stop_time = EXCLUDED.stop_time,
         created_time = EXCLUDED.created_time,
         updated_time = EXCLUDED.updated_time,
         raw_data = EXCLUDED.raw_data,
         synced_at = now()`,
      [
        platform, tenantId, accountId, c.id, c.name || '',
        c.objective || null, c.status || null, c.effective_status || null,
        c.buying_type || null, c.bid_strategy || null,
        c.daily_budget ? parseFloat(c.daily_budget) / 100 : null, // Meta budgets are in cents
        c.lifetime_budget ? parseFloat(c.lifetime_budget) / 100 : null,
        c.budget_remaining ? parseFloat(c.budget_remaining) / 100 : null,
        c.start_time || null, c.stop_time || null,
        c.created_time || null, c.updated_time || null,
        JSON.stringify(c),
      ]
    );
    count++;
  }
  return count;
}

async function upsertAdSets(pool, adsets, tenantId, accountId, platform) {
  let count = 0;
  for (const a of adsets) {
    await pool.query(
      `INSERT INTO ads_adsets
        (platform, tenant_id, account_id, campaign_id, adset_id, adset_name,
         status, effective_status, optimization_goal, billing_event,
         bid_strategy, bid_amount, daily_budget, lifetime_budget,
         targeting, start_time, end_time, created_time, updated_time, raw_data, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now())
       ON CONFLICT (platform, tenant_id, adset_id)
       DO UPDATE SET
         adset_name = EXCLUDED.adset_name,
         campaign_id = EXCLUDED.campaign_id,
         status = EXCLUDED.status,
         effective_status = EXCLUDED.effective_status,
         optimization_goal = EXCLUDED.optimization_goal,
         billing_event = EXCLUDED.billing_event,
         bid_strategy = EXCLUDED.bid_strategy,
         bid_amount = EXCLUDED.bid_amount,
         daily_budget = EXCLUDED.daily_budget,
         lifetime_budget = EXCLUDED.lifetime_budget,
         targeting = EXCLUDED.targeting,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         created_time = EXCLUDED.created_time,
         updated_time = EXCLUDED.updated_time,
         raw_data = EXCLUDED.raw_data,
         synced_at = now()`,
      [
        platform, tenantId, accountId, a.campaign_id || '', a.id, a.name || '',
        a.status || null, a.effective_status || null,
        a.optimization_goal || null, a.billing_event || null,
        a.bid_strategy || null,
        a.bid_amount ? parseFloat(a.bid_amount) / 100 : null,
        a.daily_budget ? parseFloat(a.daily_budget) / 100 : null,
        a.lifetime_budget ? parseFloat(a.lifetime_budget) / 100 : null,
        a.targeting ? JSON.stringify(a.targeting) : null,
        a.start_time || null, a.end_time || null,
        a.created_time || null, a.updated_time || null,
        JSON.stringify(a),
      ]
    );
    count++;
  }
  return count;
}

async function upsertAdsAndCreatives(pool, ads, tenantId, accountId, platform) {
  let count = 0;
  for (const ad of ads) {
    const creative = ad.creative || {};
    // Extract link_url from object_story_spec if available
    let linkUrl = creative.link_url || null;
    let ctaType = creative.call_to_action_type || null;
    if (!linkUrl && creative.object_story_spec) {
      const spec = creative.object_story_spec;
      if (spec.link_data) {
        linkUrl = spec.link_data.link || linkUrl;
        ctaType = ctaType || spec.link_data.call_to_action?.type || null;
      }
      if (spec.video_data) {
        linkUrl = linkUrl || spec.video_data.call_to_action?.value?.link || null;
        ctaType = ctaType || spec.video_data.call_to_action?.type || null;
      }
    }

    await pool.query(
      `INSERT INTO ads_creatives
        (platform, tenant_id, account_id, ad_id, ad_name,
         adset_id, campaign_id, creative_id, creative_name,
         title, body, description, image_url, thumbnail_url,
         video_id, link_url, call_to_action_type,
         status, effective_status, raw_creative, raw_ad, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,now())
       ON CONFLICT (platform, tenant_id, ad_id)
       DO UPDATE SET
         ad_name = EXCLUDED.ad_name,
         adset_id = EXCLUDED.adset_id,
         campaign_id = EXCLUDED.campaign_id,
         creative_id = EXCLUDED.creative_id,
         creative_name = EXCLUDED.creative_name,
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         thumbnail_url = EXCLUDED.thumbnail_url,
         video_id = EXCLUDED.video_id,
         link_url = EXCLUDED.link_url,
         call_to_action_type = EXCLUDED.call_to_action_type,
         status = EXCLUDED.status,
         effective_status = EXCLUDED.effective_status,
         raw_creative = EXCLUDED.raw_creative,
         raw_ad = EXCLUDED.raw_ad,
         synced_at = now()`,
      [
        platform, tenantId, accountId, ad.id, ad.name || null,
        ad.adset_id || null, ad.campaign_id || null,
        creative.id || null, creative.name || null,
        creative.title || null, creative.body || null, null, // description
        creative.image_url || null, creative.thumbnail_url || null,
        creative.video_id || null, linkUrl, ctaType,
        ad.status || null, ad.effective_status || null,
        creative ? JSON.stringify(creative) : null,
        JSON.stringify(ad),
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
    const tenantId = req.query.tenant_id || 'all';

    const conditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
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
    const tenantId = req.query.tenant_id || 'all';

    const conditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    // Deduplicate when viewing all tenants
    const source = tenantId === 'all'
      ? `(SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            date, impressions, clicks, spend, conversions, revenue
          FROM ads_daily_performance
          WHERE ${conditions.join(' AND ')}
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC) src`
      : `ads_daily_performance src WHERE ${conditions.join(' AND ')}`;

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
      FROM ${source}
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
// Campaign-level aggregation with dedup and extended metrics
// ==========================================
router.get('/performance/campaigns', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || 'all';

    const dateConditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (platform !== 'all') {
      params.push(platform);
      dateConditions.push(`platform = $${params.length}`);
    }

    let sql;

    if (tenantId === 'all') {
      // Deduplicate: same campaign synced under different tenant_ids appears once
      sql = `
        WITH deduped AS (
          SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            platform, tenant_id, account_id, campaign_id, campaign_name, date,
            impressions, reach, clicks, spend, conversions, revenue, cpc, cpm, ctr, roas
          FROM ads_daily_performance
          WHERE ${dateConditions.join(' AND ')}
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC
        ),
        campaign_info AS (
          SELECT DISTINCT ON (platform, campaign_id)
            platform, campaign_id,
            objective, status as campaign_status, effective_status as campaign_effective_status,
            buying_type, bid_strategy, daily_budget, lifetime_budget, budget_remaining,
            start_time, stop_time
          FROM ads_campaigns
          ORDER BY platform, campaign_id, synced_at DESC
        )
        SELECT
          p.platform,
          p.campaign_id,
          MAX(p.campaign_name) as campaign_name,
          MAX(p.tenant_id) as tenant_id,
          SUM(p.impressions)::bigint as impressions,
          COALESCE(SUM(p.reach), 0)::bigint as reach,
          SUM(p.clicks)::bigint as clicks,
          SUM(p.spend)::numeric(18,2) as spend,
          SUM(p.conversions)::numeric(18,2) as conversions,
          SUM(p.revenue)::numeric(18,2) as revenue,
          CASE WHEN SUM(p.spend) > 0
            THEN (SUM(p.revenue) / NULLIF(SUM(p.spend), 0))::numeric(10,2)
            ELSE 0 END as roas,
          CASE WHEN SUM(p.clicks) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.clicks), 0))::numeric(18,4)
            ELSE 0 END as avg_cpc,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.impressions), 0) * 1000)::numeric(18,4)
            ELSE 0 END as avg_cpm,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.clicks)::numeric / SUM(p.impressions) * 100)::numeric(10,2)
            ELSE 0 END as avg_ctr,
          c.objective,
          c.campaign_status,
          c.campaign_effective_status,
          c.buying_type,
          c.bid_strategy,
          c.daily_budget,
          c.lifetime_budget,
          c.budget_remaining,
          c.start_time,
          c.stop_time
        FROM deduped p
        LEFT JOIN campaign_info c ON c.platform = p.platform AND c.campaign_id = p.campaign_id
        GROUP BY p.platform, p.campaign_id,
                 c.objective, c.campaign_status, c.campaign_effective_status, c.buying_type,
                 c.bid_strategy, c.daily_budget, c.lifetime_budget, c.budget_remaining,
                 c.start_time, c.stop_time
        ORDER BY spend DESC
      `;
    } else {
      params.push(tenantId);
      const conditions = [...dateConditions, `p.tenant_id = $${params.length}`];

      sql = `
        SELECT
          p.platform,
          p.campaign_id,
          p.campaign_name,
          p.tenant_id,
          SUM(p.impressions)::bigint as impressions,
          COALESCE(SUM(p.reach), 0)::bigint as reach,
          SUM(p.clicks)::bigint as clicks,
          SUM(p.spend)::numeric(18,2) as spend,
          SUM(p.conversions)::numeric(18,2) as conversions,
          SUM(p.revenue)::numeric(18,2) as revenue,
          CASE WHEN SUM(p.spend) > 0
            THEN (SUM(p.revenue) / NULLIF(SUM(p.spend), 0))::numeric(10,2)
            ELSE 0 END as roas,
          CASE WHEN SUM(p.clicks) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.clicks), 0))::numeric(18,4)
            ELSE 0 END as avg_cpc,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.impressions), 0) * 1000)::numeric(18,4)
            ELSE 0 END as avg_cpm,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.clicks)::numeric / SUM(p.impressions) * 100)::numeric(10,2)
            ELSE 0 END as avg_ctr,
          c.objective,
          c.status as campaign_status,
          c.effective_status as campaign_effective_status,
          c.buying_type,
          c.bid_strategy,
          c.daily_budget,
          c.lifetime_budget,
          c.budget_remaining,
          c.start_time,
          c.stop_time
        FROM ads_daily_performance p
        LEFT JOIN ads_campaigns c
          ON c.platform = p.platform AND c.tenant_id = p.tenant_id AND c.campaign_id = p.campaign_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.platform, p.campaign_id, p.campaign_name, p.tenant_id,
                 c.objective, c.status, c.effective_status, c.buying_type,
                 c.bid_strategy, c.daily_budget, c.lifetime_budget, c.budget_remaining,
                 c.start_time, c.stop_time
        ORDER BY spend DESC
      `;
    }

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
// GET /api/ads/performance/ads
// Ad-level aggregation with creative metadata JOIN
// ==========================================
router.get('/performance/ads', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || 'all';

    const dateConditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (platform !== 'all') {
      params.push(platform);
      dateConditions.push(`platform = $${params.length}`);
    }

    let sql;

    if (tenantId === 'all') {
      sql = `
        WITH deduped AS (
          SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            platform, tenant_id, account_id, campaign_id, campaign_name,
            ad_id, ad_name, date,
            impressions, reach, clicks, spend, conversions, revenue, cpc, cpm, ctr, roas
          FROM ads_daily_performance
          WHERE ${dateConditions.join(' AND ')} AND ad_id != ''
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC
        ),
        campaign_info AS (
          SELECT DISTINCT ON (platform, campaign_id)
            platform, campaign_id, objective
          FROM ads_campaigns
          ORDER BY platform, campaign_id, synced_at DESC
        ),
        creative_info AS (
          SELECT DISTINCT ON (platform, ad_id)
            platform, ad_id, ad_name as creative_ad_name,
            title, body, image_url, thumbnail_url, video_id,
            link_url, call_to_action_type, status as ad_status, effective_status as ad_effective_status
          FROM ads_creatives
          ORDER BY platform, ad_id, synced_at DESC
        )
        SELECT
          p.platform,
          p.ad_id,
          MAX(p.ad_name) as ad_name,
          p.campaign_id,
          MAX(p.campaign_name) as campaign_name,
          MAX(p.tenant_id) as tenant_id,
          SUM(p.impressions)::bigint as impressions,
          COALESCE(SUM(p.reach), 0)::bigint as reach,
          SUM(p.clicks)::bigint as clicks,
          SUM(p.spend)::numeric(18,2) as spend,
          SUM(p.conversions)::numeric(18,2) as conversions,
          SUM(p.revenue)::numeric(18,2) as revenue,
          CASE WHEN SUM(p.spend) > 0
            THEN (SUM(p.revenue) / NULLIF(SUM(p.spend), 0))::numeric(10,2)
            ELSE 0 END as roas,
          CASE WHEN SUM(p.clicks) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.clicks), 0))::numeric(18,4)
            ELSE 0 END as avg_cpc,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.impressions), 0) * 1000)::numeric(18,4)
            ELSE 0 END as avg_cpm,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.clicks)::numeric / SUM(p.impressions) * 100)::numeric(10,2)
            ELSE 0 END as avg_ctr,
          ci.objective,
          cr.title as creative_title,
          cr.body as creative_body,
          cr.image_url as creative_image_url,
          cr.thumbnail_url as creative_thumbnail_url,
          cr.link_url as creative_link_url,
          cr.call_to_action_type as creative_cta,
          cr.video_id as creative_video_id,
          cr.ad_status as ad_status,
          cr.ad_effective_status as ad_effective_status
        FROM deduped p
        LEFT JOIN campaign_info ci ON ci.platform = p.platform AND ci.campaign_id = p.campaign_id
        LEFT JOIN creative_info cr ON cr.platform = p.platform AND cr.ad_id = p.ad_id
        GROUP BY p.platform, p.ad_id, p.campaign_id,
                 ci.objective,
                 cr.title, cr.body, cr.image_url, cr.thumbnail_url, cr.link_url,
                 cr.call_to_action_type, cr.video_id, cr.ad_status, cr.ad_effective_status
        ORDER BY spend DESC
      `;
    } else {
      params.push(tenantId);
      const conditions = [...dateConditions, `p.tenant_id = $${params.length}`];

      sql = `
        WITH creative_info AS (
          SELECT DISTINCT ON (platform, ad_id)
            platform, ad_id, ad_name as creative_ad_name,
            title, body, image_url, thumbnail_url, video_id,
            link_url, call_to_action_type, status as ad_status, effective_status as ad_effective_status
          FROM ads_creatives
          ORDER BY platform, ad_id, synced_at DESC
        )
        SELECT
          p.platform,
          p.ad_id,
          p.ad_name,
          p.campaign_id,
          p.campaign_name,
          p.tenant_id,
          SUM(p.impressions)::bigint as impressions,
          COALESCE(SUM(p.reach), 0)::bigint as reach,
          SUM(p.clicks)::bigint as clicks,
          SUM(p.spend)::numeric(18,2) as spend,
          SUM(p.conversions)::numeric(18,2) as conversions,
          SUM(p.revenue)::numeric(18,2) as revenue,
          CASE WHEN SUM(p.spend) > 0
            THEN (SUM(p.revenue) / NULLIF(SUM(p.spend), 0))::numeric(10,2)
            ELSE 0 END as roas,
          CASE WHEN SUM(p.clicks) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.clicks), 0))::numeric(18,4)
            ELSE 0 END as avg_cpc,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.spend) / NULLIF(SUM(p.impressions), 0) * 1000)::numeric(18,4)
            ELSE 0 END as avg_cpm,
          CASE WHEN SUM(p.impressions) > 0
            THEN (SUM(p.clicks)::numeric / SUM(p.impressions) * 100)::numeric(10,2)
            ELSE 0 END as avg_ctr,
          c.objective,
          cr.title as creative_title,
          cr.body as creative_body,
          cr.image_url as creative_image_url,
          cr.thumbnail_url as creative_thumbnail_url,
          cr.link_url as creative_link_url,
          cr.call_to_action_type as creative_cta,
          cr.video_id as creative_video_id,
          cr.ad_status as ad_status,
          cr.ad_effective_status as ad_effective_status
        FROM ads_daily_performance p
        LEFT JOIN ads_campaigns c
          ON c.platform = p.platform AND c.tenant_id = p.tenant_id AND c.campaign_id = p.campaign_id
        LEFT JOIN creative_info cr
          ON cr.platform = p.platform AND cr.ad_id = p.ad_id
        WHERE ${conditions.join(' AND ')} AND p.ad_id != ''
        GROUP BY p.platform, p.ad_id, p.ad_name, p.campaign_id, p.campaign_name, p.tenant_id,
                 c.objective,
                 cr.title, cr.body, cr.image_url, cr.thumbnail_url, cr.link_url,
                 cr.call_to_action_type, cr.video_id, cr.ad_status, cr.ad_effective_status
        ORDER BY spend DESC
      `;
    }

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, platform, tenantId },
    });
  } catch (error) {
    console.error('[Ads API] Ads query error:', error);
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
    const tenantId = req.query.tenant_id || 'all';

    // Calculate previous period (same duration, immediately before)
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const durationMs = toDate.getTime() - fromDate.getTime() + 86400000;
    const prevTo = new Date(fromDate.getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - durationMs + 86400000);
    const prevFromStr = prevFrom.toISOString().split('T')[0];
    const prevToStr = prevTo.toISOString().split('T')[0];

    const conditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    // Deduplicate when viewing all tenants to avoid double-counting
    const source = tenantId === 'all'
      ? `(SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            platform, campaign_id, campaign_name, date,
            impressions, clicks, spend, conversions, revenue
          FROM ads_daily_performance
          WHERE ${conditions.join(' AND ')}
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC) src`
      : `ads_daily_performance src WHERE ${conditions.join(' AND ')}`;

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
          ELSE 0 END as avg_ctr,
        CASE WHEN SUM(clicks) > 0
          THEN (SUM(spend) / NULLIF(SUM(clicks), 0))::numeric(18,4)
          ELSE 0 END as avg_cpc,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(spend) / NULLIF(SUM(impressions), 0) * 1000)::numeric(18,4)
          ELSE 0 END as avg_cpm
      FROM ${source}
    `;

    const kpiResult = await db.pool.query(kpiSql, params);

    // Previous period query
    const prevConditions = ['date >= $1', 'date <= $2'];
    const prevParams = [prevFromStr, prevToStr];

    if (tenantId !== 'all') {
      prevParams.push(tenantId);
      prevConditions.push(`tenant_id = $${prevParams.length}`);
    }

    if (platform !== 'all') {
      prevParams.push(platform);
      prevConditions.push(`platform = $${prevParams.length}`);
    }

    const prevSource = tenantId === 'all'
      ? `(SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            platform, campaign_id, campaign_name, date,
            impressions, clicks, spend, conversions, revenue
          FROM ads_daily_performance
          WHERE ${prevConditions.join(' AND ')}
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC) src`
      : `ads_daily_performance src WHERE ${prevConditions.join(' AND ')}`;

    const prevKpiSql = `
      SELECT
        SUM(spend)::numeric(18,2) as total_spend,
        SUM(impressions)::bigint as total_impressions,
        SUM(clicks)::bigint as total_clicks,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(clicks)::numeric / SUM(impressions) * 100)::numeric(10,2)
          ELSE 0 END as avg_ctr,
        CASE WHEN SUM(clicks) > 0
          THEN (SUM(spend) / NULLIF(SUM(clicks), 0))::numeric(18,4)
          ELSE 0 END as avg_cpc,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(spend) / NULLIF(SUM(impressions), 0) * 1000)::numeric(18,4)
          ELSE 0 END as avg_cpm
      FROM ${prevSource}
    `;

    const prevResult = await db.pool.query(prevKpiSql, prevParams);

    // Top 3 campaigns by spend (more useful than ROAS for most campaigns)
    const topCampaignsSql = `
      SELECT
        platform,
        campaign_name,
        SUM(spend)::numeric(18,2) as spend,
        CASE WHEN SUM(clicks) > 0
          THEN (SUM(spend) / NULLIF(SUM(clicks), 0))::numeric(18,4)
          ELSE 0 END as cpc,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(spend) / NULLIF(SUM(impressions), 0) * 1000)::numeric(18,4)
          ELSE 0 END as cpm
      FROM ${source}
      GROUP BY platform, campaign_id, campaign_name
      HAVING SUM(spend) > 0
      ORDER BY spend DESC
      LIMIT 3
    `;

    const topResult = await db.pool.query(topCampaignsSql, params);

    res.json({
      success: true,
      data: {
        ...kpiResult.rows[0],
        previous_period: prevResult.rows[0] || null,
        previous_period_range: { from: prevFromStr, to: prevToStr },
        top_campaigns_by_spend: topResult.rows,
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
// List all tenants (ad accounts) — merges performance data + stored credentials
// ==========================================
router.get('/tenants', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // 1) Accounts with actual synced performance data
    const perfSql = `
      SELECT tenant_id,
        MAX(account_id) as account_id,
        COUNT(DISTINCT campaign_id)::int as campaign_count,
        MIN(date)::text as earliest_date,
        MAX(date)::text as latest_date,
        SUM(spend)::numeric(18,2) as total_spend
      FROM ads_daily_performance
      GROUP BY tenant_id
    `;
    const perfResult = await db.pool.query(perfSql);
    const perfMap = new Map(perfResult.rows.map(r => [r.tenant_id, r]));

    // 2) All stored credentials (may include accounts not yet synced)
    const credSql = `
      SELECT tenant_id, service, account_id, created_at, updated_at
      FROM client_credentials
      ORDER BY tenant_id, service
    `;
    const credResult = await db.pool.query(credSql);

    // 3) Merge: start with performance data, then add credential-only accounts
    const merged = new Map();

    for (const row of perfResult.rows) {
      merged.set(row.tenant_id, {
        tenant_id: row.tenant_id,
        account_id: row.account_id,
        campaign_count: row.campaign_count,
        earliest_date: row.earliest_date,
        latest_date: row.latest_date,
        total_spend: row.total_spend,
        source: 'synced',
        credentials: [],
      });
    }

    for (const cred of credResult.rows) {
      const entry = merged.get(cred.tenant_id);
      const credInfo = { service: cred.service, account_id: cred.account_id, updated_at: cred.updated_at };
      if (entry) {
        entry.credentials.push(credInfo);
      } else {
        merged.set(cred.tenant_id, {
          tenant_id: cred.tenant_id,
          account_id: cred.account_id,
          campaign_count: 0,
          earliest_date: null,
          latest_date: null,
          total_spend: '0.00',
          source: 'credentials_only',
          credentials: [credInfo],
        });
      }
    }

    // Sort: synced accounts first (by spend), then credentials-only
    const data = Array.from(merged.values()).sort((a, b) => {
      if (a.source === 'synced' && b.source !== 'synced') return -1;
      if (a.source !== 'synced' && b.source === 'synced') return 1;
      return parseFloat(b.total_spend) - parseFloat(a.total_spend);
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Ads API] Tenants query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/campaigns/details
// Campaign details with budget, bidding, objective
// ==========================================
router.get('/campaigns/details', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const tenantId = req.query.tenant_id || 'all';
    const campaignId = req.query.campaign_id;

    const conditions = [];
    const params = [];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (campaignId) {
      params.push(campaignId);
      conditions.push(`campaign_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        platform, tenant_id, account_id, campaign_id, campaign_name,
        objective, status, effective_status, buying_type, bid_strategy,
        daily_budget, lifetime_budget, budget_remaining,
        start_time, stop_time, created_time, updated_time, synced_at
      FROM ads_campaigns
      ${whereClause}
      ORDER BY campaign_name ASC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Ads API] Campaign details query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/adsets/details
// Ad set details with targeting, budget, bidding
// Query by campaign_id (ignores tenant_id to avoid mismatch)
// ==========================================
router.get('/adsets/details', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const campaignId = req.query.campaign_id;

    const conditions = [];
    const params = [];

    if (campaignId) {
      params.push(campaignId);
      conditions.push(`campaign_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT DISTINCT ON (adset_id)
        platform, tenant_id, account_id, campaign_id,
        adset_id, adset_name, status, effective_status,
        optimization_goal, billing_event, bid_strategy, bid_amount,
        daily_budget, lifetime_budget,
        targeting,
        start_time, end_time, created_time, updated_time, synced_at
      FROM ads_adsets
      ${whereClause}
      ORDER BY adset_id, synced_at DESC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Ads API] Ad set details query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/creatives/details
// Ad creative details with images, copy, CTAs
// Query by campaign_id (ignores tenant_id to avoid mismatch)
// ==========================================
router.get('/creatives/details', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const campaignId = req.query.campaign_id;

    const conditions = [];
    const params = [];

    if (campaignId) {
      params.push(campaignId);
      conditions.push(`campaign_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT DISTINCT ON (ad_id)
        platform, tenant_id, account_id,
        ad_id, ad_name, adset_id, campaign_id,
        creative_id, creative_name,
        title, body, description,
        image_url, thumbnail_url, video_id,
        link_url, call_to_action_type,
        status, effective_status, synced_at
      FROM ads_creatives
      ${whereClause}
      ORDER BY ad_id, synced_at DESC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Ads API] Creatives query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST /api/ads/sync
// Trigger a live sync from Meta and/or Google Ads
// Now uses ad account ID as tenant_id for client separation
// ==========================================
router.post('/sync', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const since = req.body.since;
    const until = req.body.until;
    const platforms = req.body.platforms || ['meta', 'google'];
    // If sync_details is true, also fetch campaigns, ad sets, and creatives
    const syncDetails = req.body.sync_details !== false; // default true

    if (!since || !until) {
      return res.status(400).json({ error: 'since and until are required (YYYY-MM-DD)' });
    }

    const results = { meta: null, google: null, errors: [] };

    // --- Meta sync ---
    if (platforms.includes('meta')) {
      const metaAccountId = req.body.meta_account_id || process.env.META_AD_ACCOUNT_ID;
      const metaToken = req.body.meta_access_token || process.env.META_ACCESS_TOKEN;
      // Use the ad account ID as tenant_id for client separation
      const tenantId = req.body.tenant_id || metaAccountId || '5ml-internal';

      if (metaAccountId && metaToken) {
        try {
          console.log(`[Sync] Fetching Meta Ads for ${metaAccountId} (tenant: ${tenantId}, ${since} to ${until})...`);
          const metaMetrics = await fetchMetaInsights(metaAccountId, since, until, metaToken);
          const metaCount = await upsertMetrics(db.pool, metaMetrics, tenantId);
          results.meta = { fetched: metaMetrics.length, upserted: metaCount, tenant_id: tenantId };
          console.log(`[Sync] Meta: ${metaCount} rows upserted for tenant ${tenantId}`);

          // Clean up old campaign-level rows (ad_id='') now that we have ad-level data
          await db.pool.query(
            `DELETE FROM ads_daily_performance
             WHERE tenant_id = $1 AND platform = 'meta' AND date >= $2 AND date <= $3 AND ad_id = ''`,
            [tenantId, since, until]
          );

          // Also fetch campaign details, ad sets, and creatives
          if (syncDetails) {
            try {
              const [campaigns, adsets, ads] = await Promise.all([
                fetchMetaCampaigns(metaAccountId, metaToken),
                fetchMetaAdSets(metaAccountId, metaToken),
                fetchMetaAds(metaAccountId, metaToken),
              ]);

              const campCount = await upsertCampaigns(db.pool, campaigns, tenantId, metaAccountId, 'meta');
              const adsetCount = await upsertAdSets(db.pool, adsets, tenantId, metaAccountId, 'meta');
              const adCount = await upsertAdsAndCreatives(db.pool, ads, tenantId, metaAccountId, 'meta');

              results.meta.details = {
                campaigns: campCount,
                adsets: adsetCount,
                ads: adCount,
              };
              console.log(`[Sync] Meta details: ${campCount} campaigns, ${adsetCount} ad sets, ${adCount} ads`);
            } catch (detailErr) {
              console.error('[Sync] Meta details error:', detailErr.message);
              results.errors.push({ platform: 'meta_details', error: detailErr.message });
            }
          }
        } catch (err) {
          // Log full error details for debugging
          console.error('META_SYNC_ERROR', JSON.stringify({
            message: err.message,
            code: err.code,
            cause: err.cause?.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
            nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
          }, null, 2));

          results.errors.push({
            platform: 'meta',
            error: err.message,
            code: err.code || 'UNKNOWN',
          });
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
      const tenantId = req.body.tenant_id || googleCustomerId || '5ml-internal';
      const googleCreds = {
        developerToken: req.body.google_developer_token,
        clientId: req.body.google_client_id,
        clientSecret: req.body.google_client_secret,
        refreshToken: req.body.google_refresh_token,
        loginCustomerId: req.body.google_login_customer_id,
      };

      // Check if required Google Ads env vars are set (when not provided in request)
      const missingEnvVars = [];
      if (!googleCreds.developerToken && !process.env.GOOGLE_ADS_DEVELOPER_TOKEN) missingEnvVars.push('GOOGLE_ADS_DEVELOPER_TOKEN');
      if (!googleCreds.clientId && !process.env.GOOGLE_ADS_CLIENT_ID) missingEnvVars.push('GOOGLE_ADS_CLIENT_ID');
      if (!googleCreds.clientSecret && !process.env.GOOGLE_ADS_CLIENT_SECRET) missingEnvVars.push('GOOGLE_ADS_CLIENT_SECRET');
      if (!googleCreds.refreshToken && !process.env.GOOGLE_ADS_REFRESH_TOKEN) missingEnvVars.push('GOOGLE_ADS_REFRESH_TOKEN');

      if (missingEnvVars.length > 0) {
        results.errors.push({
          platform: 'google',
          error: `Missing Google Ads credentials: ${missingEnvVars.join(', ')}`,
          hint: 'Use GET /api/ads/google/health to diagnose credential issues',
        });
      } else if (googleCustomerId) {
        try {
          console.log(`[Sync] Fetching Google Ads for ${googleCustomerId} (tenant: ${tenantId}, ${since} to ${until})...`);
          const googleMetrics = await fetchGoogleAdsMetrics(googleCustomerId, since, until, googleCreds);
          const googleCount = await upsertMetrics(db.pool, googleMetrics, tenantId);
          results.google = { fetched: googleMetrics.length, upserted: googleCount, tenant_id: tenantId };
          console.log(`[Sync] Google: ${googleCount} rows upserted for tenant ${tenantId}`);

          // Clean up old campaign-level rows (ad_id='') now that we have ad-level data
          await db.pool.query(
            `DELETE FROM ads_daily_performance
             WHERE tenant_id = $1 AND platform = 'google' AND date >= $2 AND date <= $3 AND ad_id = ''`,
            [tenantId, since, until]
          );

          // Also fetch Google campaign details
          if (syncDetails) {
            try {
              const googleCampaigns = await fetchGoogleAdsCampaigns(googleCustomerId, googleCreds);
              const campCount = await upsertCampaigns(db.pool, googleCampaigns, tenantId, googleCustomerId, 'google');
              results.google.details = { campaigns: campCount };
              console.log(`[Sync] Google details: ${campCount} campaigns`);
            } catch (detailErr) {
              console.error('[Sync] Google details error:', detailErr.message);
              results.errors.push({ platform: 'google_details', error: detailErr.message });
            }
          }
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
      meta: { since, until, platforms },
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
        account_id,
        SUM(spend)::numeric(18,2) as total_spend,
        SUM(conversions)::numeric(18,2) as total_conversions,
        SUM(revenue)::numeric(18,2) as total_revenue,
        CASE WHEN SUM(spend) > 0
          THEN (SUM(revenue) / NULLIF(SUM(spend), 0))::numeric(10,2)
          ELSE 0 END as blended_roas,
        COUNT(DISTINCT campaign_id)::int as campaign_count
      FROM ads_daily_performance
      WHERE date >= $1 AND date <= $2
      GROUP BY tenant_id, account_id
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
    // Log full error details for debugging
    console.error('META_ADACCOUNTS_ERROR', JSON.stringify({
      message: error.message,
      code: error.code,
      cause: error.cause?.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
    }, null, 2));

    // Return detailed error for debugging
    res.status(500).json({
      error: error.message,
      code: error.code || 'UNKNOWN',
      debug: {
        nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
      },
    });
  }
});

// ==========================================
// GET /api/ads/meta/health
// Health check for Meta API connection (TLS + token)
// ==========================================
router.get('/meta/health', async (req, res) => {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({
      success: false,
      status: 'error',
      type: 'config',
      message: 'META_ACCESS_TOKEN is not configured',
    });
  }

  try {
    // Minimal request to test TLS + token validity
    const url = `${META_API_BASE}/me?` +
      new URLSearchParams({
        fields: 'id,name',
        access_token: token,
      }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      let metaError;
      try {
        metaError = JSON.parse(body).error;
      } catch {
        metaError = null;
      }

      console.error('META_HEALTH_ERROR', JSON.stringify({
        status: response.status,
        metaError,
        body: body.substring(0, 300),
      }));

      return res.status(502).json({
        success: false,
        status: 'error',
        type: 'meta-api',
        message: metaError?.message || `Meta API HTTP ${response.status}`,
        statusCode: response.status,
        metaError,
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      status: 'ok',
      user: { id: data.id, name: data.name },
    });
  } catch (error) {
    // Classify error type
    const errMsg = error.message?.toLowerCase() || '';
    let errorType = 'unknown';

    if (error.name === 'AbortError') {
      errorType = 'timeout';
    } else if (
      error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
      error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      errMsg.includes('certificate')
    ) {
      errorType = 'tls';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorType = 'network';
    }

    console.error('META_HEALTH_ERROR', JSON.stringify({
      message: error.message,
      code: error.code,
      type: errorType,
      nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
    }));

    res.status(503).json({
      success: false,
      status: 'error',
      type: errorType,
      message: error.message,
      code: error.code,
      nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
    });
  }
});

// ==========================================
// GET /api/ads/google/accounts
// Discover Google Ads accounts accessible via MCC
// ==========================================
router.get('/google/accounts', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    // Check each required var individually for better diagnostics
    const missingVars = [];
    if (!clientId) missingVars.push('GOOGLE_ADS_CLIENT_ID');
    if (!clientSecret) missingVars.push('GOOGLE_ADS_CLIENT_SECRET');
    if (!refreshToken) missingVars.push('GOOGLE_ADS_REFRESH_TOKEN');
    if (!devToken) missingVars.push('GOOGLE_ADS_DEVELOPER_TOKEN');

    if (missingVars.length > 0) {
      return res.status(400).json({
        error: `Google Ads credentials not configured`,
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        hint: 'Set these env vars on Fly.io using: fly secrets set GOOGLE_ADS_CLIENT_ID=xxx ...',
        envVarsStatus: {
          GOOGLE_ADS_CLIENT_ID: !!clientId,
          GOOGLE_ADS_CLIENT_SECRET: !!clientSecret,
          GOOGLE_ADS_REFRESH_TOKEN: !!refreshToken,
          GOOGLE_ADS_DEVELOPER_TOKEN: !!devToken,
          GOOGLE_ADS_LOGIN_CUSTOMER_ID: !!loginCustomerId,
        },
      });
    }

    const accessToken = await getGoogleAccessToken(clientId, clientSecret, refreshToken);

    if (loginCustomerId) {
      const cleanMcc = loginCustomerId.replace(/-/g, '');
      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.status,
          customer_client.manager
        FROM customer_client
        WHERE customer_client.manager = FALSE
      `.trim();

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': devToken,
        'login-customer-id': cleanMcc,
        'Content-Type': 'application/json',
      };

      const url = `${GOOGLE_ADS_BASE}/customers/${cleanMcc}:search`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const body = await response.text();
        return res.status(response.status).json({ error: `Google Ads API error: ${body}` });
      }

      const data = await response.json();
      const accounts = [];

      // Handle search endpoint response (single object with results array)
      if (data.results) {
        for (const row of data.results) {
          if (row.customerClient) {
            const rawId = String(row.customerClient.id);
            const formattedId = rawId.length === 10
              ? `${rawId.slice(0,3)}-${rawId.slice(3,6)}-${rawId.slice(6)}`
              : rawId;
            accounts.push({
              id: formattedId,
              raw_id: rawId,
              name: row.customerClient.descriptiveName || '',
              currency: row.customerClient.currencyCode || '',
              status: row.customerClient.status === 'ENABLED' ? 1 : 2,
              manager: row.customerClient.manager || false,
            });
          }
        }
      }

      res.json({
        success: true,
        data: accounts,
        hint: 'Use the "id" field as google_customer_id when syncing',
      });
    } else {
      const response = await fetch(
        `${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': devToken,
          },
        }
      );

      if (!response.ok) {
        const body = await response.text();
        return res.status(response.status).json({ error: `Google Ads API error: ${body}` });
      }

      const data = await response.json();
      const resourceNames = data.resourceNames || [];
      const accounts = resourceNames.map((rn) => {
        const id = rn.replace('customers/', '');
        return { id, raw_id: id, name: '', currency: '', status: 'UNKNOWN' };
      });

      res.json({ success: true, data: accounts });
    }
  } catch (error) {
    console.error('[Ads API] Google accounts lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/google/health
// Health check for Google Ads API connectivity
// ==========================================
router.get('/google/health', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    const checkedAt = new Date().toISOString();

    // Check which env vars are set
    const envVarsSet = {
      GOOGLE_ADS_DEVELOPER_TOKEN: !!devToken,
      GOOGLE_ADS_CLIENT_ID: !!clientId,
      GOOGLE_ADS_CLIENT_SECRET: !!clientSecret,
      GOOGLE_ADS_REFRESH_TOKEN: !!refreshToken,
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: !!loginCustomerId,
      GOOGLE_ADS_CUSTOMER_ID: !!customerId,
    };

    // Required vars for API calls
    const requiredVars = [
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
    ];

    const missingVars = requiredVars.filter((varName) => !envVarsSet[varName]);
    const allRequiredVarsSet = missingVars.length === 0;

    // If required vars are missing, return early
    if (!allRequiredVarsSet) {
      return res.json({
        success: false,
        data: {
          status: 'error',
          envVarsSet,
          allRequiredVarsSet: false,
          oauthStatus: 'not_tested',
          oauthError: `Missing required environment variables: ${missingVars.join(', ')}`,
          accessibleCustomers: [],
          apiVersion: GOOGLE_ADS_API_VERSION,
          checkedAt,
        },
      });
    }

    // Try OAuth token exchange
    let accessToken;
    let tokenExchangeMs;

    try {
      const tokenStart = Date.now();
      accessToken = await getGoogleAccessToken(clientId, clientSecret, refreshToken);
      tokenExchangeMs = Date.now() - tokenStart;
    } catch (error) {
      return res.json({
        success: false,
        data: {
          status: 'error',
          envVarsSet,
          allRequiredVarsSet: true,
          oauthStatus: 'error',
          oauthError: error.message,
          accessibleCustomers: [],
          apiVersion: GOOGLE_ADS_API_VERSION,
          checkedAt,
        },
      });
    }

    // Try listing accessible customers
    try {
      const apiStart = Date.now();
      const response = await fetch(
        `${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': devToken,
          },
        }
      );

      const apiCallMs = Date.now() - apiStart;

      if (!response.ok) {
        const body = await response.text();
        return res.json({
          success: false,
          data: {
            status: 'error',
            envVarsSet,
            allRequiredVarsSet: true,
            oauthStatus: 'success',
            oauthError: `Google Ads API error ${response.status}: ${body}`,
            accessibleCustomers: [],
            apiVersion: GOOGLE_ADS_API_VERSION,
            checkedAt,
            diagnostics: { tokenExchangeMs },
          },
        });
      }

      const data = await response.json();
      const resourceNames = data.resourceNames || [];

      // Format customer IDs
      const customers = resourceNames.map((rn) => {
        const id = rn.replace('customers/', '');
        if (id.length === 10) {
          return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
        }
        return id;
      });

      res.json({
        success: true,
        data: {
          status: 'connected',
          envVarsSet,
          allRequiredVarsSet: true,
          oauthStatus: 'success',
          accessibleCustomers: customers,
          apiVersion: GOOGLE_ADS_API_VERSION,
          checkedAt,
          diagnostics: {
            tokenExchangeMs,
            apiCallMs,
          },
        },
      });
    } catch (error) {
      res.json({
        success: false,
        data: {
          status: 'error',
          envVarsSet,
          allRequiredVarsSet: true,
          oauthStatus: 'success',
          oauthError: error.message,
          accessibleCustomers: [],
          apiVersion: GOOGLE_ADS_API_VERSION,
          checkedAt,
          diagnostics: { tokenExchangeMs },
        },
      });
    }
  } catch (error) {
    console.error('[Ads API] Google health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET /api/ads/performance/monthly
// Monthly aggregated metrics for comparison charts
// ==========================================
router.get('/performance/monthly', async (req, res) => {
  try {
    if (!db || !db.pool) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { from, to } = getDateRange(req.query.from, req.query.to);
    const platform = req.query.platform || 'all';
    const tenantId = req.query.tenant_id || 'all';

    const conditions = ['date >= $1', 'date <= $2'];
    const params = [from, to];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    const source = tenantId === 'all'
      ? `(SELECT DISTINCT ON (platform, campaign_id, ad_id, date)
            date, impressions, clicks, spend, conversions, revenue
          FROM ads_daily_performance
          WHERE ${conditions.join(' AND ')}
          ORDER BY platform, campaign_id, ad_id, date, updated_at DESC) src`
      : `ads_daily_performance src WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue,
        CASE WHEN SUM(clicks) > 0
          THEN (SUM(spend) / NULLIF(SUM(clicks), 0))::numeric(18,4)
          ELSE 0 END as cpc,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(spend) / NULLIF(SUM(impressions), 0) * 1000)::numeric(18,4)
          ELSE 0 END as cpm,
        CASE WHEN SUM(impressions) > 0
          THEN (SUM(clicks)::numeric / SUM(impressions) * 100)::numeric(10,2)
          ELSE 0 END as ctr
      FROM ${source}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const result = await db.pool.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, platform, tenantId },
    });
  } catch (error) {
    console.error('[Ads API] Monthly query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// Report Generation Routes
// ===========================================

/**
 * POST /api/ads/reports/generate
 * Generate monthly report in PPTX and/or PDF format
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const {
      tenant_id,
      month_year,
      format = 'both', // 'pptx', 'pdf', or 'both'
      client_name,
      brand_name,
      primary_color,
    } = req.body;

    if (!tenant_id || !month_year) {
      return res.status(400).json({ error: 'tenant_id and month_year are required' });
    }

    // Dynamic import for the report generator (ES module)
    const reportModule = await import('../reports/report-generator.js');
    const { generateMonthlyReport, getSampleReportData } = reportModule;

    // For now, use sample data - in production, fetch from database
    const reportData = getSampleReportData();

    // Override with request config
    reportData.config.clientName = client_name || tenant_id;
    reportData.config.brandName = brand_name || client_name || tenant_id;
    reportData.config.monthYear = month_year;
    reportData.config.reportDate = new Date().toISOString().split('T')[0];
    if (primary_color) {
      reportData.config.primaryColor = primary_color;
    }

    // Generate report
    const outputDir = '/tmp/reports';
    const fs = await import('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const result = await generateMonthlyReport(reportData, {
      format,
      outputDir,
      filename: `${tenant_id}_Report_${month_year.replace(/\s+/g, '_')}`,
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          pptxPath: result.pptxPath,
          pdfPath: result.pdfPath,
          message: 'Report generated successfully',
        },
      });
    } else {
      res.status(500).json({ error: result.error || 'Failed to generate report' });
    }
  } catch (error) {
    console.error('[Ads API] Report generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ads/reports/download/:filename
 * Download generated report file
 */
router.get('/reports/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `/tmp/reports/${filename}`;

    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    const ext = filename.split('.').pop().toLowerCase();
    const contentType = ext === 'pptx'
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : ext === 'pdf'
        ? 'application/pdf'
        : ext === 'html'
          ? 'text/html'
          : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('[Ads API] Report download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ads/reports/sample
 * Get sample report data structure for reference
 */
router.get('/reports/sample', async (req, res) => {
  try {
    const reportModule = await import('../reports/report-generator.js');
    const { getSampleReportData } = reportModule;
    res.json({ success: true, data: getSampleReportData() });
  } catch (error) {
    console.error('[Ads API] Sample data error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
