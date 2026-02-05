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

CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_date
  ON ads_daily_performance (date);

CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_tenant
  ON ads_daily_performance (tenant_id, date);

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, service)
);

CREATE INDEX IF NOT EXISTS idx_client_credentials_tenant_service
  ON client_credentials (tenant_id, service);

-- Campaign details table
-- Stores campaign-level metadata: objective, status, budget, bidding strategy
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

-- Ad set details table
-- Stores targeting, budget, bidding, optimization at the ad-set level
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
  targeting JSONB,                    -- Full targeting spec (age, gender, geo, interests, behaviors, etc.)
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
-- Stores ad creatives with images, copy, CTAs, and link URLs
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
