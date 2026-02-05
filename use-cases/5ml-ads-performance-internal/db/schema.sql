-- Ads Daily Performance Schema
-- Stores normalized daily campaign metrics from Meta and Google Ads

CREATE TABLE IF NOT EXISTS ads_daily_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,                    -- 'meta' | 'google'
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

-- Unique constraint for upserts (one row per platform/tenant/campaign/date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_daily_perf_unique
  ON ads_daily_performance (platform, tenant_id, campaign_id, date);

-- Query by date range
CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_date
  ON ads_daily_performance (date);

-- Query by tenant and date
CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_tenant
  ON ads_daily_performance (tenant_id, date);

-- Query by platform, campaign, and date
CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_campaign
  ON ads_daily_performance (platform, campaign_id, date);

-- Multi-tenant client credentials table
CREATE TABLE IF NOT EXISTS client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL,              -- 'meta_ads' | 'google_ads'
  account_id TEXT NOT NULL,           -- ad account ID / customer ID
  access_token TEXT,                  -- for Meta long-lived token
  refresh_token TEXT,                 -- for Google Ads OAuth
  extra JSONB,                        -- any extra fields (developer token, login customer ID, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_credentials_tenant_service
  ON client_credentials (tenant_id, service);
