# Ads Performance Intelligence Layer - 7-Layer Architecture

> Multi-tenant advertising performance analysis system for 5 Miles Lab and clients
> Version: 1.0
> Last Updated: February 2026

## Table of Contents

1. [Introduction](#1-introduction)
2. [7-Layer Overview for Ads Performance](#2-7-layer-overview-for-ads-performance)
3. [Layer 1 – Infrastructure & Storage](#3-layer-1--infrastructure--storage)
4. [Layer 2 – Execution Engine](#4-layer-2--execution-engine)
5. [Layer 3 – Roles & Agents](#5-layer-3--roles--agents)
6. [Layer 4 – Knowledge Management](#6-layer-4--knowledge-management)
7. [Layer 5 – Task Definitions](#7-layer-5--task-definitions)
8. [Layer 6 – Orchestration & Scheduling](#8-layer-6--orchestration--scheduling)
9. [Layer 7 – Governance & Compliance](#9-layer-7--governance--compliance)
10. [Future Extensions](#10-future-extensions)

---

## 1. Introduction

### Purpose

This document defines the architecture for a **reusable, multi-tenant Ads Performance Intelligence Layer** built on top of the 5ML 7-layer agentic infrastructure. The system provides:

- **Internal Use (5ML)**: Agency-level performance dashboard across all clients
- **External Use (Clients)**: Per-client dashboards with actionable recommendations

### Channels Supported

| Platform | API | Key Metrics |
|----------|-----|-------------|
| **Meta Ads** | Marketing API v20.0 Insights | impressions, reach, clicks, spend, conversions, revenue, CPC, CPM, CTR, ROAS |
| **Google Ads** | Google Ads API v17 (GAQL) | impressions, clicks, cost_micros, conversions, conversions_value, CTR, CPC |

### Existing Foundation

This architecture extends and integrates with:

- **Core Infrastructure**: `index.js`, `db.js`, Fly.io deployment
- **Existing Use Case**: `use-cases/5ml-ads-performance-internal/` (single-tenant foundation)
- **Multi-tenant Schema**: `use-cases/ads-performance-multitenant/` (credential management)
- **Knowledge Layer**: `knowledge/` (vector search, multi-source connectors)
- **Frontend**: `frontend/` (Next.js 15 dashboard)

---

## 2. 7-Layer Overview for Ads Performance

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 7: GOVERNANCE & COMPLIANCE                                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │
│ │ Tenant Isolation│ │ Credential Vault│ │   Audit Logs    │             │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘             │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 6: ORCHESTRATION & WORKFLOW                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Scheduler (node-cron)  │  Workflow Engine  │  Parallel Executor    │ │
│ │  daily-sync-all-tenants │  weekly-report    │  Meta || Google fetch │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 5: TASK DEFINITIONS                                               │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ │ DailySync     │ │ WeeklyAnalysis│ │ MonthlySummary│ │ CrossTenant   │ │
│ │ Task          │ │ Task          │ │ Task          │ │ Overview Task │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: KNOWLEDGE MANAGEMENT                                           │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐       │
│ │ Metric Definitions│ │ Industry Benchmarks│ │ Client-specific KB│       │
│ │ KB                │ │ KB                 │ │                   │       │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: ROLES & AGENTS                                                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ Meta Data  │ │ Google Ads │ │ Normalizer │ │ Anomaly    │             │
│ │ Fetcher    │ │ Fetcher    │ │ Agent      │ │ Detector   │             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ Funnel     │ │ Budget &   │ │ Recommend  │ │ Internal   │             │
│ │ Analyzer   │ │ Pacing     │ │ Writer     │ │ Strategy   │             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: EXECUTION ENGINE                                               │
│ ┌───────────────────────────────────────────────────────────────────┐   │
│ │ ToolExecutor │ DbExecutor │ TenantContextResolver │ ErrorHandler  │   │
│ └───────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: INFRASTRUCTURE & STORAGE                                       │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ Fly.io     │ │ PostgreSQL │ │ Redis      │ │ Express.js │             │
│ │ Compute    │ │ Database   │ │ Cache      │ │ API        │             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1 – Infrastructure & Storage

### 3.1 Compute (Fly.io)

| Component | Purpose | Scaling |
|-----------|---------|---------|
| **API App** | Express.js server, dashboard API | 1-3 instances |
| **Worker App** | Scheduled sync jobs, report generation | 1 instance |
| **Redis** | Caching, rate limit tracking | Fly.io managed |

### 3.2 Database Schema (PostgreSQL)

#### Core Tables

```sql
-- ==========================================
-- TABLE: ads_daily_performance
-- Purpose: Normalized daily ad metrics (ad-level granularity)
-- ==========================================
CREATE TABLE ads_daily_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant & Platform
  platform TEXT NOT NULL,                    -- 'meta' | 'google'
  tenant_id TEXT NOT NULL DEFAULT '5ml-internal',
  account_id TEXT NOT NULL,

  -- Campaign & Ad Hierarchy
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  ad_id TEXT NOT NULL DEFAULT '',            -- Empty for campaign-level legacy data
  ad_name TEXT NOT NULL DEFAULT '',

  -- Time Dimension
  date DATE NOT NULL,

  -- Core Metrics
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT,                              -- Meta-specific
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(18, 4) NOT NULL DEFAULT 0,
  conversions NUMERIC(18, 4),
  revenue NUMERIC(18, 4),

  -- Computed Metrics (stored for query performance)
  cpc NUMERIC(18, 4),                        -- spend / clicks
  cpm NUMERIC(18, 4),                        -- (spend / impressions) * 1000
  ctr NUMERIC(10, 6),                        -- (clicks / impressions) * 100
  roas NUMERIC(10, 6),                       -- revenue / spend

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for upserts
  CONSTRAINT uq_ads_daily_performance
    UNIQUE (platform, tenant_id, campaign_id, ad_id, date)
);

-- Performance indexes
CREATE INDEX idx_ads_daily_perf_tenant_date
  ON ads_daily_performance (tenant_id, date);
CREATE INDEX idx_ads_daily_perf_campaign
  ON ads_daily_performance (platform, campaign_id, date);


-- ==========================================
-- TABLE: client_credentials
-- Purpose: Per-tenant API credentials storage
-- ==========================================
CREATE TABLE client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL,                     -- 'meta_ads' | 'google_ads'
  account_id TEXT NOT NULL,                  -- ad account ID

  -- Credentials (encrypted at rest)
  access_token TEXT,
  refresh_token TEXT,

  -- Service-specific config
  extra JSONB,                               -- developer_token, login_customer_id, etc.

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_client_credentials UNIQUE (tenant_id, service)
);


-- ==========================================
-- TABLE: tenants
-- Purpose: Tenant configuration and KPI targets
-- ==========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,

  -- Business Context
  industry TEXT,                             -- 'ecommerce', 'lead_gen', 'app', etc.
  business_model TEXT,                       -- Detailed description

  -- KPI Targets
  primary_kpis JSONB DEFAULT '{}',           -- {target_cpa, target_roas, target_ctr, etc.}

  -- Report Configuration
  report_config JSONB DEFAULT '{}',          -- {tone, frequency, recipients, etc.}

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================================
-- TABLE: ads_campaigns
-- Purpose: Campaign metadata and settings
-- ==========================================
CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,

  -- Campaign Settings
  objective TEXT,                            -- 'CONVERSIONS', 'TRAFFIC', 'AWARENESS', etc.
  status TEXT,                               -- 'ACTIVE', 'PAUSED', 'ARCHIVED'
  effective_status TEXT,
  buying_type TEXT,
  bid_strategy TEXT,

  -- Budget
  daily_budget NUMERIC(18, 4),
  lifetime_budget NUMERIC(18, 4),
  budget_remaining NUMERIC(18, 4),

  -- Schedule
  start_time TIMESTAMPTZ,
  stop_time TIMESTAMPTZ,

  -- Metadata
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_ads_campaigns UNIQUE (platform, tenant_id, campaign_id)
);


-- ==========================================
-- TABLE: ads_adsets
-- Purpose: Ad set details with targeting
-- ==========================================
CREATE TABLE ads_adsets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  adset_name TEXT NOT NULL,

  -- Settings
  status TEXT,
  effective_status TEXT,
  optimization_goal TEXT,
  billing_event TEXT,
  bid_strategy TEXT,
  bid_amount NUMERIC(18, 4),

  -- Budget
  daily_budget NUMERIC(18, 4),
  lifetime_budget NUMERIC(18, 4),

  -- Targeting (full JSON)
  targeting JSONB,

  -- Schedule
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  -- Metadata
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_ads_adsets UNIQUE (platform, tenant_id, adset_id)
);


-- ==========================================
-- TABLE: ads_creatives
-- Purpose: Ad creative assets and copy
-- ==========================================
CREATE TABLE ads_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  ad_name TEXT,

  -- Hierarchy
  adset_id TEXT,
  campaign_id TEXT,
  creative_id TEXT,
  creative_name TEXT,

  -- Creative Content
  title TEXT,
  body TEXT,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  video_id TEXT,
  link_url TEXT,
  call_to_action_type TEXT,

  -- Status
  status TEXT,
  effective_status TEXT,

  -- Raw Data
  raw_creative JSONB,
  raw_ad JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_ads_creatives UNIQUE (platform, tenant_id, ad_id)
);
```

#### Indexing Strategy

```sql
-- Tenant-scoped queries (most common)
CREATE INDEX idx_perf_tenant_date ON ads_daily_performance (tenant_id, date DESC);
CREATE INDEX idx_perf_tenant_platform_date ON ads_daily_performance (tenant_id, platform, date DESC);

-- Cross-tenant analytics (5ML internal)
CREATE INDEX idx_perf_date ON ads_daily_performance (date DESC);
CREATE INDEX idx_perf_platform_date ON ads_daily_performance (platform, date DESC);

-- Campaign drill-down
CREATE INDEX idx_perf_campaign ON ads_daily_performance (campaign_id, date DESC);
CREATE INDEX idx_creatives_campaign ON ads_creatives (campaign_id);
CREATE INDEX idx_adsets_campaign ON ads_adsets (campaign_id);
```

### 3.3 Cache (Redis)

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `kpis:{tenant_id}:{date_range}` | 5 min | Dashboard KPI cards |
| `monthly:{tenant_id}:{month}` | 1 hour | Monthly aggregations |
| `ratelimit:meta:{account_id}` | 1 hour | API rate limit tracking |
| `ratelimit:google:{customer_id}` | 1 hour | API rate limit tracking |

---

## 4. Layer 2 – Execution Engine

### 4.1 Core Components

```typescript
// ==========================================
// ToolExecutor
// Generic executor for Meta & Google API calls
// ==========================================
interface ToolExecutor {
  runTool(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<ToolResult>;
}

type ToolName =
  | 'meta.fetchInsightsForTenant'
  | 'meta.fetchCampaigns'
  | 'meta.fetchAdSets'
  | 'meta.fetchAds'
  | 'google.fetchMetricsForTenant'
  | 'google.fetchCampaigns'
  | 'google.listAccessibleCustomers';

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    apiCalls: number;
    duration: number;
    rateLimitRemaining?: number;
  };
}


// ==========================================
// DbExecutor
// Batch database operations
// ==========================================
interface DbExecutor {
  saveDailyMetricsBatch(
    records: NormalizedMetric[],
    tenantId: string
  ): Promise<{ inserted: number; updated: number }>;

  saveCampaignsBatch(
    campaigns: Campaign[],
    tenantId: string,
    platform: Platform
  ): Promise<number>;

  saveAdSetsBatch(
    adsets: AdSet[],
    tenantId: string,
    platform: Platform
  ): Promise<number>;

  saveCreativesBatch(
    creatives: Creative[],
    tenantId: string,
    platform: Platform
  ): Promise<number>;
}


// ==========================================
// TenantContextResolver
// Retrieves tenant credentials and config
// ==========================================
interface TenantContextResolver {
  getMetaCredentials(tenantId: string): Promise<MetaCredentials | null>;
  getGoogleCredentials(tenantId: string): Promise<GoogleCredentials | null>;
  getTenantConfig(tenantId: string): Promise<TenantConfig | null>;
  listActiveTenants(): Promise<string[]>;
}

interface MetaCredentials {
  accessToken: string;
  adAccountId: string;  // act_XXXXX
}

interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  loginCustomerId: string;  // MCC ID
  customerId: string;       // Target account
}

interface TenantConfig {
  tenantId: string;
  displayName: string;
  industry: string;
  primaryKpis: {
    targetCpa?: number;
    targetRoas?: number;
    targetCtr?: number;
  };
  reportConfig: {
    tone: 'formal' | 'conversational';
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients?: string[];
  };
}
```

### 4.2 Error Handling & Retry Strategy

```typescript
// Retry configuration per API
const RETRY_CONFIG = {
  meta: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    retryableCodes: [429, 500, 502, 503, 504],
  },
  google: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    retryableCodes: ['RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'INTERNAL'],
  },
};

// Error logging structure
interface SyncError {
  timestamp: string;
  tenantId: string;
  platform: 'meta' | 'google';
  operation: string;
  errorCode: string | number;
  errorMessage: string;
  retryAttempt: number;
  resolved: boolean;
}
```

---

## 5. Layer 3 – Roles & Agents

### 5.1 Agent Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Meta Data   │    │ Google Ads  │    │ Normalizer  │          │
│  │ Fetcher     │───▶│ Fetcher     │───▶│ Agent       │──▶ DB    │
│  │ Agent       │    │ Agent       │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      ANALYSIS PIPELINE                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Anomaly     │    │ Funnel      │    │ Budget &    │          │
│  │ Detector    │    │ Analyzer    │    │ Pacing      │          │
│  │ Agent       │    │ Agent       │    │ Planner     │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                  │
│         └─────────────────▼──────────────────┘                  │
│                    ┌─────────────┐                               │
│                    │ Recommend   │                               │
│                    │ Writer      │──▶ Reports                    │
│                    │ Agent       │                               │
│                    └─────────────┘                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     5ML INTERNAL ONLY                             │
│                    ┌─────────────┐                               │
│                    │ Internal    │                               │
│                    │ Strategy    │──▶ Agency Insights            │
│                    │ Agent       │                               │
│                    └─────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Agent Definitions

#### 1. Meta Data Fetcher Agent

```json
{
  "name": "meta-data-fetcher",
  "role": "Technical Media Buyer – Meta",
  "description": "Fetches ad-level daily metrics from Meta Marketing API",

  "tools": [
    "meta.fetchInsightsForTenant",
    "meta.fetchCampaigns",
    "meta.fetchAdSets",
    "meta.fetchAds"
  ],

  "input": {
    "tenant_id": "string",
    "date_range": {
      "since": "YYYY-MM-DD",
      "until": "YYYY-MM-DD"
    },
    "breakdowns": ["optional: device, country, age, etc."]
  },

  "output": {
    "metrics": [
      {
        "platform": "meta",
        "account_id": "act_XXXXX",
        "campaign_id": "string",
        "campaign_name": "string",
        "ad_id": "string",
        "ad_name": "string",
        "date": "YYYY-MM-DD",
        "impressions": "number",
        "reach": "number",
        "clicks": "number",
        "spend": "number",
        "conversions": "number | null",
        "revenue": "number | null",
        "cpc": "number | null",
        "cpm": "number | null",
        "ctr": "number | null",
        "roas": "number | null"
      }
    ],
    "campaigns": ["Campaign[]"],
    "adsets": ["AdSet[]"],
    "creatives": ["Creative[]"]
  },

  "error_handling": {
    "rate_limit": "Exponential backoff with max 3 retries",
    "invalid_token": "Alert and skip tenant",
    "api_error": "Log and retry once"
  }
}
```

#### 2. Google Ads Data Fetcher Agent

```json
{
  "name": "google-ads-data-fetcher",
  "role": "Technical Media Buyer – Google",
  "description": "Fetches ad-level daily metrics from Google Ads API using GAQL",

  "tools": [
    "google.fetchMetricsForTenant",
    "google.fetchCampaigns",
    "google.listAccessibleCustomers"
  ],

  "gaql_query": "
    SELECT
      campaign.id, campaign.name,
      ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type,
      segments.date,
      metrics.impressions, metrics.clicks, metrics.ctr,
      metrics.average_cpc, metrics.cost_micros,
      metrics.conversions, metrics.conversions_value
    FROM ad_group_ad
    WHERE segments.date BETWEEN '{since}' AND '{until}'
      AND ad_group_ad.status != 'REMOVED'
  ",

  "input": {
    "tenant_id": "string",
    "date_range": {
      "since": "YYYY-MM-DD",
      "until": "YYYY-MM-DD"
    }
  },

  "output": {
    "metrics": [
      {
        "platform": "google",
        "customer_id": "XXX-XXX-XXXX",
        "campaign_id": "string",
        "campaign_name": "string",
        "ad_id": "string",
        "ad_name": "string",
        "date": "YYYY-MM-DD",
        "impressions": "number",
        "clicks": "number",
        "spend": "number (converted from micros)",
        "conversions": "number | null",
        "revenue": "number | null",
        "cpc": "number | null",
        "cpm": "number | null",
        "ctr": "number | null",
        "roas": "number | null"
      }
    ],
    "campaigns": ["Campaign[]"]
  }
}
```

#### 3. Normalizer Agent

```json
{
  "name": "normalizer-agent",
  "role": "Analytics Engineer",
  "description": "Unifies Meta and Google raw data into a common schema, computes derived metrics",

  "tools": [],

  "input": {
    "meta_rows": ["MetaRawMetric[]"],
    "google_rows": ["GoogleRawMetric[]"]
  },

  "transformations": {
    "cost_micros_to_dollars": "cost_micros / 1_000_000",
    "cpc": "spend / clicks (if clicks > 0)",
    "cpm": "(spend / impressions) * 1000 (if impressions > 0)",
    "ctr": "(clicks / impressions) * 100 (if impressions > 0)",
    "cpa": "spend / conversions (if conversions > 0)",
    "roas": "revenue / spend (if spend > 0)"
  },

  "output": {
    "normalized_records": [
      {
        "platform": "meta | google",
        "tenant_id": "string",
        "account_id": "string",
        "campaign_id": "string",
        "campaign_name": "string",
        "ad_id": "string",
        "ad_name": "string",
        "date": "YYYY-MM-DD",
        "impressions": "number",
        "reach": "number | null",
        "clicks": "number",
        "spend": "number",
        "conversions": "number | null",
        "revenue": "number | null",
        "cpc": "number | null",
        "cpm": "number | null",
        "ctr": "number | null",
        "roas": "number | null"
      }
    ]
  }
}
```

#### 4. Anomaly Detector Agent

```json
{
  "name": "anomaly-detector-agent",
  "role": "Performance Watchdog",
  "description": "Identifies significant changes in key metrics compared to previous periods",

  "model": "claude-3-5-sonnet",

  "input": {
    "current_period": {
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD",
      "metrics": {
        "total_spend": "number",
        "total_impressions": "number",
        "total_clicks": "number",
        "total_conversions": "number",
        "total_revenue": "number",
        "avg_cpc": "number",
        "avg_cpm": "number",
        "avg_ctr": "number",
        "blended_roas": "number"
      }
    },
    "previous_period": "same structure",
    "tenant_config": {
      "target_cpa": "number | null",
      "target_roas": "number | null",
      "target_ctr": "number | null"
    }
  },

  "detection_rules": {
    "roas_drop": {
      "threshold": -20,
      "severity": "high"
    },
    "cpa_increase": {
      "threshold": 25,
      "severity": "high"
    },
    "ctr_drop": {
      "threshold": -15,
      "severity": "medium"
    },
    "spend_spike": {
      "threshold": 50,
      "severity": "medium"
    },
    "impressions_drop": {
      "threshold": -30,
      "severity": "low"
    }
  },

  "output": {
    "anomalies": [
      {
        "metric": "roas",
        "current_value": 1.8,
        "previous_value": 2.5,
        "change_pct": -28,
        "severity": "high",
        "campaign_id": "string | null (if campaign-specific)",
        "platform": "meta | google | blended",
        "explanation": "ROAS dropped 28% week-over-week, below target of 2.0"
      }
    ],
    "summary": "string (2-3 sentence overview)"
  }
}
```

#### 5. Funnel Analyzer Agent

```json
{
  "name": "funnel-analyzer-agent",
  "role": "Funnel Strategist",
  "description": "Analyzes the conversion funnel to identify bottlenecks",

  "model": "claude-3-5-sonnet",

  "input": {
    "funnel_metrics": {
      "awareness": {
        "impressions": "number",
        "reach": "number",
        "cpm": "number"
      },
      "consideration": {
        "clicks": "number",
        "ctr": "number",
        "cpc": "number"
      },
      "conversion": {
        "conversions": "number",
        "cvr": "number (conversions / clicks)",
        "cpa": "number",
        "revenue": "number",
        "roas": "number"
      }
    },
    "industry_benchmarks": {
      "avg_ctr": "number",
      "avg_cvr": "number",
      "avg_cpm": "number"
    }
  },

  "analysis_framework": {
    "impression_to_click": "If CTR is low (<1%), likely creative/audience issue",
    "click_to_conversion": "If CVR is low (<2% for ecom), likely landing page/offer issue",
    "cost_efficiency": "Compare CPC and CPM to benchmarks"
  },

  "output": {
    "bottleneck_stage": "awareness | consideration | conversion",
    "diagnosis": {
      "primary_issue": "string",
      "likely_causes": ["string"],
      "confidence": "high | medium | low"
    },
    "recommendations": [
      {
        "action": "string",
        "expected_impact": "string",
        "priority": "high | medium | low"
      }
    ]
  }
}
```

#### 6. Budget & Pacing Planner Agent

```json
{
  "name": "budget-pacing-planner-agent",
  "role": "Media Planner",
  "description": "Analyzes spend pacing and recommends budget allocation",

  "model": "claude-3-5-sonnet",

  "input": {
    "budget_config": {
      "monthly_budget": "number",
      "period_start": "YYYY-MM-DD",
      "period_end": "YYYY-MM-DD"
    },
    "current_spend": {
      "total": "number",
      "by_platform": {
        "meta": "number",
        "google": "number"
      },
      "by_campaign": [
        {
          "campaign_id": "string",
          "campaign_name": "string",
          "platform": "string",
          "spend": "number",
          "roas": "number"
        }
      ]
    },
    "days_elapsed": "number",
    "days_remaining": "number"
  },

  "calculations": {
    "planned_spend_to_date": "monthly_budget * (days_elapsed / total_days)",
    "pacing_variance_pct": "((current_spend - planned_spend) / planned_spend) * 100",
    "required_daily_spend": "(monthly_budget - current_spend) / days_remaining"
  },

  "output": {
    "pacing_status": "on_track | under_pacing | over_pacing",
    "variance_pct": "number",
    "required_daily_spend": "number",
    "allocation_recommendations": [
      {
        "platform": "meta | google",
        "action": "increase | decrease | maintain",
        "amount_pct": "number",
        "reason": "string"
      }
    ],
    "campaign_recommendations": [
      {
        "campaign_id": "string",
        "action": "scale | pause | maintain",
        "reason": "string"
      }
    ]
  }
}
```

#### 7. Recommendation Writer Agent (Client-facing)

```json
{
  "name": "recommendation-writer-agent",
  "role": "Client-facing Performance Lead",
  "description": "Generates polished, actionable performance reports for clients",

  "model": "claude-3-5-sonnet",

  "input": {
    "anomalies": ["Anomaly[]"],
    "funnel_analysis": "FunnelAnalysis",
    "budget_plan": "BudgetPlan",
    "kpis": "KpiSummary",
    "tenant_config": {
      "display_name": "string",
      "tone": "formal | conversational",
      "target_cpa": "number | null",
      "target_roas": "number | null"
    }
  },

  "output_format": {
    "executive_summary": "string (2-3 paragraphs, high-level performance story)",
    "key_metrics": [
      {
        "metric": "string",
        "value": "string",
        "trend": "up | down | stable",
        "vs_target": "above | below | on_target"
      }
    ],
    "key_insights": [
      {
        "insight": "string",
        "impact": "string",
        "priority": "high | medium | low"
      }
    ],
    "recommended_actions": [
      {
        "action": "string",
        "rationale": "string",
        "expected_outcome": "string",
        "urgency": "immediate | this_week | this_month"
      }
    ],
    "next_steps": ["string"]
  }
}
```

#### 8. Internal Strategy Agent (5ML Only)

```json
{
  "name": "internal-strategy-agent",
  "role": "5ML-level Strategist",
  "description": "Generates cross-tenant insights for agency leadership",

  "model": "claude-3-5-sonnet",

  "input": {
    "tenant_summaries": [
      {
        "tenant_id": "string",
        "display_name": "string",
        "industry": "string",
        "period_metrics": {
          "spend": "number",
          "roas": "number",
          "cpa": "number",
          "ctr": "number"
        },
        "target_hit": "boolean",
        "anomaly_count": "number"
      }
    ],
    "period": {
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD"
    }
  },

  "analysis_areas": {
    "performance_ranking": "Rank tenants by ROAS, spend efficiency",
    "pattern_detection": "Find common issues or successes across clients",
    "best_practices": "Identify strategies that work well",
    "risk_alerts": "Flag at-risk accounts"
  },

  "output": {
    "agency_overview": "string (executive summary for 5ML leadership)",
    "top_performers": [
      {
        "tenant_id": "string",
        "highlight": "string"
      }
    ],
    "attention_needed": [
      {
        "tenant_id": "string",
        "issue": "string",
        "recommended_action": "string"
      }
    ],
    "industry_insights": [
      {
        "insight": "string",
        "applicable_tenants": ["string"]
      }
    ],
    "strategic_recommendations": ["string"]
  }
}
```

---

## 6. Layer 4 – Knowledge Management

### 6.1 Metric Definitions KB

Location: `knowledge/ads-metrics/definitions.json`

```json
{
  "metrics": {
    "cpc": {
      "name": "Cost Per Click",
      "formula": "spend / clicks",
      "description": "The average cost paid for each click on your ad",
      "good_when": "lower",
      "typical_range": {
        "search": "0.50 - 3.00 USD",
        "display": "0.10 - 0.50 USD",
        "social": "0.20 - 1.50 USD"
      }
    },
    "cpm": {
      "name": "Cost Per Mille (Thousand Impressions)",
      "formula": "(spend / impressions) * 1000",
      "description": "The cost to show your ad 1,000 times",
      "good_when": "depends on objective",
      "typical_range": {
        "awareness": "2.00 - 15.00 USD",
        "consideration": "5.00 - 25.00 USD"
      }
    },
    "ctr": {
      "name": "Click-Through Rate",
      "formula": "(clicks / impressions) * 100",
      "description": "Percentage of impressions that resulted in a click",
      "good_when": "higher",
      "typical_range": {
        "search": "2.0% - 5.0%",
        "display": "0.3% - 1.0%",
        "social": "0.5% - 2.0%"
      }
    },
    "cvr": {
      "name": "Conversion Rate",
      "formula": "(conversions / clicks) * 100",
      "description": "Percentage of clicks that resulted in a conversion",
      "good_when": "higher",
      "typical_range": {
        "ecommerce": "1.5% - 4.0%",
        "lead_gen": "2.0% - 10.0%"
      }
    },
    "cpa": {
      "name": "Cost Per Acquisition",
      "formula": "spend / conversions",
      "description": "The average cost to acquire one conversion",
      "good_when": "lower",
      "typical_range": "Varies significantly by industry"
    },
    "roas": {
      "name": "Return On Ad Spend",
      "formula": "revenue / spend",
      "description": "Revenue generated for every dollar spent on ads",
      "good_when": "higher",
      "typical_range": {
        "breakeven": "1.0x",
        "healthy": "2.0x - 4.0x",
        "excellent": "4.0x+"
      }
    }
  }
}
```

### 6.2 Industry Benchmarks KB

Location: `knowledge/ads-metrics/benchmarks.json`

```json
{
  "benchmarks": {
    "ecommerce": {
      "meta": {
        "ctr": { "low": 0.5, "median": 1.0, "high": 2.0 },
        "cpc": { "low": 0.30, "median": 0.70, "high": 1.50 },
        "cvr": { "low": 1.0, "median": 2.5, "high": 5.0 },
        "roas": { "low": 1.5, "median": 2.5, "high": 4.0 }
      },
      "google_search": {
        "ctr": { "low": 2.0, "median": 3.5, "high": 6.0 },
        "cpc": { "low": 0.50, "median": 1.20, "high": 3.00 },
        "cvr": { "low": 2.0, "median": 3.5, "high": 6.0 }
      },
      "google_display": {
        "ctr": { "low": 0.2, "median": 0.5, "high": 1.0 },
        "cpm": { "low": 2.00, "median": 5.00, "high": 12.00 }
      }
    },
    "lead_gen": {
      "meta": {
        "ctr": { "low": 0.8, "median": 1.5, "high": 3.0 },
        "cpl": { "low": 5.00, "median": 25.00, "high": 100.00 }
      },
      "google_search": {
        "ctr": { "low": 3.0, "median": 5.0, "high": 8.0 },
        "cpl": { "low": 10.00, "median": 50.00, "high": 200.00 }
      }
    }
  },
  "last_updated": "2026-01-01",
  "sources": ["Meta Business Help Center", "Google Ads Benchmarks", "WordStream"]
}
```

### 6.3 Client-specific KB

Location: `knowledge/tenants/{tenant_id}/config.json`

```json
{
  "tenant_id": "acme-corp",
  "display_name": "ACME Corporation",

  "business_context": {
    "industry": "ecommerce",
    "business_model": "DTC fashion brand targeting HK young professionals",
    "primary_products": ["Apparel", "Accessories"],
    "average_order_value": 450,
    "target_customer": "25-35 year old urban professionals"
  },

  "kpi_targets": {
    "target_roas": 3.0,
    "target_cpa": 150,
    "target_ctr": 1.5,
    "monthly_budget": 50000
  },

  "report_preferences": {
    "tone": "conversational",
    "language": "en",
    "include_benchmarks": true,
    "highlight_creative_performance": true
  },

  "channel_strategy": {
    "meta": {
      "primary_objective": "conversions",
      "campaign_types": ["Advantage+", "Dynamic Product Ads"]
    },
    "google": {
      "primary_objective": "conversions",
      "campaign_types": ["Search", "Performance Max"]
    }
  }
}
```

### 6.4 Knowledge Access Patterns

```typescript
// Knowledge layer integration
interface KnowledgeService {
  // Get metric definition for report generation
  getMetricDefinition(metric: string): MetricDefinition;

  // Get benchmark for comparison
  getBenchmark(
    industry: string,
    platform: string,
    metric: string
  ): BenchmarkRange;

  // Get tenant-specific config
  getTenantKB(tenantId: string): TenantKB;

  // Vector search for relevant insights (future)
  searchInsights(query: string, tenantId?: string): Insight[];
}
```

---

## 7. Layer 5 – Task Definitions

### 7.1 DailySyncTask

```json
{
  "task_id": "daily-sync-task",
  "name": "Daily Sync Task",
  "description": "Fetches and stores yesterday's ad metrics for a single tenant",

  "input": {
    "tenant_id": "string",
    "date": "YYYY-MM-DD (defaults to yesterday)"
  },

  "steps": [
    {
      "step": 1,
      "name": "resolve_credentials",
      "agent": null,
      "action": "TenantContextResolver.getMetaCredentials + getGoogleCredentials",
      "output": "credentials"
    },
    {
      "step": 2,
      "name": "fetch_meta",
      "agent": "meta-data-fetcher",
      "parallel_with": "fetch_google",
      "input": {
        "tenant_id": "{{input.tenant_id}}",
        "date_range": {
          "since": "{{input.date}}",
          "until": "{{input.date}}"
        }
      },
      "output": "meta_data",
      "skip_if": "!credentials.meta"
    },
    {
      "step": 3,
      "name": "fetch_google",
      "agent": "google-ads-data-fetcher",
      "parallel_with": "fetch_meta",
      "input": {
        "tenant_id": "{{input.tenant_id}}",
        "date_range": {
          "since": "{{input.date}}",
          "until": "{{input.date}}"
        }
      },
      "output": "google_data",
      "skip_if": "!credentials.google"
    },
    {
      "step": 4,
      "name": "normalize",
      "agent": "normalizer-agent",
      "input": {
        "meta_rows": "{{meta_data.metrics}}",
        "google_rows": "{{google_data.metrics}}"
      },
      "output": "normalized_records"
    },
    {
      "step": 5,
      "name": "save_to_db",
      "agent": null,
      "action": "DbExecutor.saveDailyMetricsBatch",
      "input": {
        "records": "{{normalized_records}}",
        "tenant_id": "{{input.tenant_id}}"
      },
      "output": "save_result"
    },
    {
      "step": 6,
      "name": "cleanup_legacy",
      "agent": null,
      "action": "DbExecutor.deleteCampaignLevelRows",
      "description": "Remove old campaign-level rows now that ad-level data exists"
    }
  ],

  "output": {
    "tenant_id": "{{input.tenant_id}}",
    "date": "{{input.date}}",
    "records_synced": "{{save_result.inserted + save_result.updated}}",
    "platforms": ["meta", "google"]
  }
}
```

### 7.2 WeeklyAnalysisTask

```json
{
  "task_id": "weekly-analysis-task",
  "name": "Weekly Analysis Task",
  "description": "Performs deep-dive analysis for a tenant and generates recommendations",

  "input": {
    "tenant_id": "string",
    "period": {
      "current_from": "YYYY-MM-DD",
      "current_to": "YYYY-MM-DD",
      "compare_from": "YYYY-MM-DD",
      "compare_to": "YYYY-MM-DD"
    }
  },

  "steps": [
    {
      "step": 1,
      "name": "load_tenant_config",
      "action": "KnowledgeService.getTenantKB",
      "output": "tenant_config"
    },
    {
      "step": 2,
      "name": "aggregate_current_metrics",
      "action": "DbExecutor.aggregateMetrics(tenant_id, current_period)",
      "output": "current_metrics"
    },
    {
      "step": 3,
      "name": "aggregate_previous_metrics",
      "action": "DbExecutor.aggregateMetrics(tenant_id, previous_period)",
      "output": "previous_metrics"
    },
    {
      "step": 4,
      "name": "detect_anomalies",
      "agent": "anomaly-detector-agent",
      "input": {
        "current_period": "{{current_metrics}}",
        "previous_period": "{{previous_metrics}}",
        "tenant_config": "{{tenant_config.kpi_targets}}"
      },
      "output": "anomalies"
    },
    {
      "step": 5,
      "name": "analyze_funnel",
      "agent": "funnel-analyzer-agent",
      "input": {
        "funnel_metrics": "{{current_metrics.funnel}}",
        "industry_benchmarks": "KnowledgeService.getBenchmarks(tenant_config.industry)"
      },
      "output": "funnel_analysis"
    },
    {
      "step": 6,
      "name": "plan_budget",
      "agent": "budget-pacing-planner-agent",
      "input": {
        "budget_config": "{{tenant_config.budget}}",
        "current_spend": "{{current_metrics.spend}}",
        "days_elapsed": "calculated",
        "days_remaining": "calculated"
      },
      "output": "budget_plan"
    },
    {
      "step": 7,
      "name": "write_recommendations",
      "agent": "recommendation-writer-agent",
      "input": {
        "anomalies": "{{anomalies}}",
        "funnel_analysis": "{{funnel_analysis}}",
        "budget_plan": "{{budget_plan}}",
        "kpis": "{{current_metrics.kpis}}",
        "tenant_config": "{{tenant_config}}"
      },
      "output": "report"
    }
  ],

  "output": {
    "tenant_id": "{{input.tenant_id}}",
    "period": "{{input.period}}",
    "report": "{{report}}",
    "anomaly_count": "{{anomalies.length}}",
    "generated_at": "timestamp"
  }
}
```

### 7.3 MonthlyExecutiveSummaryTask

```json
{
  "task_id": "monthly-executive-summary-task",
  "name": "Monthly Executive Summary Task",
  "description": "Generates C-suite level monthly performance summary",

  "input": {
    "tenant_id": "string",
    "month": "YYYY-MM"
  },

  "steps": [
    {
      "step": 1,
      "name": "load_monthly_metrics",
      "action": "DbExecutor.getMonthlyMetrics(tenant_id, month)",
      "output": "monthly_metrics"
    },
    {
      "step": 2,
      "name": "load_previous_month",
      "action": "DbExecutor.getMonthlyMetrics(tenant_id, previous_month)",
      "output": "previous_month_metrics"
    },
    {
      "step": 3,
      "name": "generate_summary",
      "agent": "recommendation-writer-agent",
      "prompt_variant": "executive_monthly",
      "input": {
        "current_month": "{{monthly_metrics}}",
        "previous_month": "{{previous_month_metrics}}",
        "tenant_config": "loaded from KB"
      },
      "output": "executive_summary"
    }
  ],

  "output": {
    "summary": "{{executive_summary}}",
    "key_metrics": {
      "total_spend": "number",
      "total_revenue": "number",
      "roas": "number",
      "mom_change": "percentage"
    }
  }
}
```

### 7.4 CrossTenantOverviewTask

```json
{
  "task_id": "cross-tenant-overview-task",
  "name": "Cross-Tenant Overview Task",
  "description": "5ML agency-level analysis across all clients",

  "input": {
    "period": {
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD"
    }
  },

  "steps": [
    {
      "step": 1,
      "name": "list_active_tenants",
      "action": "TenantContextResolver.listActiveTenants()",
      "output": "tenant_ids"
    },
    {
      "step": 2,
      "name": "aggregate_per_tenant",
      "action": "parallel_for_each(tenant_ids, DbExecutor.aggregateMetrics)",
      "output": "tenant_summaries"
    },
    {
      "step": 3,
      "name": "generate_agency_insights",
      "agent": "internal-strategy-agent",
      "input": {
        "tenant_summaries": "{{tenant_summaries}}",
        "period": "{{input.period}}"
      },
      "output": "agency_insights"
    }
  ],

  "output": {
    "agency_overview": "{{agency_insights.agency_overview}}",
    "top_performers": "{{agency_insights.top_performers}}",
    "attention_needed": "{{agency_insights.attention_needed}}",
    "strategic_recommendations": "{{agency_insights.strategic_recommendations}}"
  },

  "access": "5ml-internal-only"
}
```

---

## 8. Layer 6 – Orchestration & Scheduling

### 8.1 Workflow Registry

```json
{
  "workflows": {
    "daily-sync-tenant": {
      "task": "DailySyncTask",
      "trigger": "manual | scheduled",
      "timeout_ms": 300000
    },
    "daily-sync-all-tenants": {
      "task": "DailySyncTask",
      "trigger": "scheduled",
      "schedule": "0 8 * * *",
      "timezone": "Asia/Hong_Kong",
      "description": "Sync all active tenants at 08:00 HKT daily",
      "parallelism": 3
    },
    "weekly-report-tenant": {
      "task": "WeeklyAnalysisTask",
      "trigger": "scheduled",
      "schedule": "0 9 * * 1",
      "timezone": "Asia/Hong_Kong",
      "description": "Generate weekly reports every Monday 09:00 HKT"
    },
    "monthly-summary-tenant": {
      "task": "MonthlyExecutiveSummaryTask",
      "trigger": "scheduled",
      "schedule": "0 10 1 * *",
      "timezone": "Asia/Hong_Kong",
      "description": "Generate monthly summaries on 1st of each month"
    },
    "cross-tenant-overview": {
      "task": "CrossTenantOverviewTask",
      "trigger": "scheduled",
      "schedule": "0 11 * * 1",
      "timezone": "Asia/Hong_Kong",
      "description": "Agency-wide overview every Monday 11:00 HKT"
    }
  }
}
```

### 8.2 Orchestrator Implementation

```typescript
// Simplified orchestrator pseudocode
class AdsPerformanceOrchestrator {
  private scheduler: NodeCron;
  private taskRegistry: Map<string, TaskDefinition>;
  private workflowRegistry: Map<string, WorkflowConfig>;

  async initialize() {
    // Register scheduled workflows
    for (const [name, config] of this.workflowRegistry) {
      if (config.trigger === 'scheduled') {
        this.scheduler.schedule(config.schedule, () => {
          this.runWorkflow(name);
        }, { timezone: config.timezone });
      }
    }
  }

  async runWorkflow(workflowName: string, input?: Record<string, unknown>) {
    const workflow = this.workflowRegistry.get(workflowName);
    const task = this.taskRegistry.get(workflow.task);

    // Handle parallel multi-tenant workflows
    if (workflowName === 'daily-sync-all-tenants') {
      const tenants = await this.tenantResolver.listActiveTenants();
      return this.runParallel(
        tenants.map(t => () => this.executeTask(task, { tenant_id: t })),
        workflow.parallelism
      );
    }

    return this.executeTask(task, input);
  }

  private async executeTask(task: TaskDefinition, input: Record<string, unknown>) {
    const context = { input, results: {} };

    for (const step of task.steps) {
      // Handle parallel steps
      if (step.parallel_with) {
        const parallelStep = task.steps.find(s => s.name === step.parallel_with);
        const [result1, result2] = await Promise.all([
          this.executeStep(step, context),
          this.executeStep(parallelStep, context)
        ]);
        context.results[step.name] = result1;
        context.results[parallelStep.name] = result2;
      } else if (!context.results[step.name]) {
        // Skip if already executed as part of parallel
        context.results[step.name] = await this.executeStep(step, context);
      }
    }

    return this.buildOutput(task.output, context);
  }
}
```

### 8.3 Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DAILY SYNC ALL TENANTS                              │
│                        (08:00 HKT)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                                                       │
│  │ List Active  │                                                       │
│  │ Tenants      │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              PARALLEL (max 3 concurrent)                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │ Tenant A    │  │ Tenant B    │  │ Tenant C    │  ...          │  │
│  │  │ DailySync   │  │ DailySync   │  │ DailySync   │               │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │  │
│  │         │                │                │                       │  │
│  │         ▼                ▼                ▼                       │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │              PER TENANT (parallel fetch)                  │    │  │
│  │  │  ┌─────────────┐        ┌─────────────┐                   │    │  │
│  │  │  │ Meta Fetch  │   ||   │ Google Fetch│                   │    │  │
│  │  │  └──────┬──────┘        └──────┬──────┘                   │    │  │
│  │  │         │                      │                          │    │  │
│  │  │         └──────────┬───────────┘                          │    │  │
│  │  │                    ▼                                      │    │  │
│  │  │             ┌─────────────┐                                │    │  │
│  │  │             │ Normalize   │                                │    │  │
│  │  │             └──────┬──────┘                                │    │  │
│  │  │                    ▼                                      │    │  │
│  │  │             ┌─────────────┐                                │    │  │
│  │  │             │ Save to DB  │                                │    │  │
│  │  │             └─────────────┘                                │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                              ▼                                          │
│                     ┌─────────────┐                                     │
│                     │ Log Results │                                     │
│                     │ Alert Errors│                                     │
│                     └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Layer 7 – Governance & Compliance

### 9.1 Tenant Isolation

```typescript
// All database queries MUST include tenant_id filter
interface TenantIsolationPolicy {
  // Query wrapper that enforces tenant_id
  wrapQuery<T>(
    query: string,
    params: unknown[],
    tenantId: string
  ): { query: string; params: unknown[] };

  // Validate user has access to tenant
  validateAccess(userId: string, tenantId: string): Promise<boolean>;
}

// Example enforcement
const getMetrics = async (tenantId: string, dateRange: DateRange) => {
  // ALWAYS filter by tenant_id
  const sql = `
    SELECT * FROM ads_daily_performance
    WHERE tenant_id = $1 AND date >= $2 AND date <= $3
  `;
  return db.query(sql, [tenantId, dateRange.from, dateRange.to]);
};
```

### 9.2 Credential Security

```typescript
// Credential storage and access
interface CredentialVault {
  // Store credentials (encrypted at rest)
  storeCredentials(
    tenantId: string,
    service: 'meta_ads' | 'google_ads',
    credentials: EncryptedCredentials
  ): Promise<void>;

  // Retrieve credentials (decrypted)
  getCredentials(
    tenantId: string,
    service: 'meta_ads' | 'google_ads'
  ): Promise<DecryptedCredentials>;

  // Rotate credentials
  rotateCredentials(
    tenantId: string,
    service: string,
    newCredentials: EncryptedCredentials
  ): Promise<void>;
}

// Implementation notes:
// - Use Fly.io secrets for encryption keys
// - access_token and refresh_token stored encrypted
// - Audit log for all credential access
```

### 9.3 Audit Logging

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Actor
  actor_type TEXT NOT NULL,        -- 'system' | 'user' | 'agent'
  actor_id TEXT,                   -- user_id or agent_name

  -- Action
  action TEXT NOT NULL,            -- 'data_sync', 'report_generated', 'credentials_accessed'
  resource_type TEXT NOT NULL,     -- 'ads_daily_performance', 'client_credentials', etc.
  resource_id TEXT,

  -- Context
  tenant_id TEXT,
  workflow_id TEXT,

  -- Details
  metadata JSONB,                  -- Additional context

  -- Indexes
  INDEX idx_audit_tenant_time (tenant_id, timestamp DESC),
  INDEX idx_audit_action_time (action, timestamp DESC)
);
```

Logged events:
- Data sync start/complete/error
- Credential access
- Report generation
- Anomaly detection alerts
- User access to tenant data

### 9.4 Access Control

```typescript
// Role-based access control
type Role = '5ml-admin' | '5ml-user' | 'client-admin' | 'client-viewer';

interface AccessControl {
  roles: {
    '5ml-admin': {
      canViewAllTenants: true,
      canModifyCredentials: true,
      canRunCrossTenantAnalysis: true
    },
    '5ml-user': {
      canViewAllTenants: true,
      canModifyCredentials: false,
      canRunCrossTenantAnalysis: true
    },
    'client-admin': {
      canViewAllTenants: false,
      tenantScope: 'own',
      canModifyCredentials: true
    },
    'client-viewer': {
      canViewAllTenants: false,
      tenantScope: 'own',
      canModifyCredentials: false
    }
  }
}
```

### 9.5 Data Retention Policy

| Data Type | Retention Period | Notes |
|-----------|------------------|-------|
| `ads_daily_performance` | 2 years | Core metrics, needed for YoY comparison |
| `ads_campaigns` | 2 years | Campaign metadata |
| `ads_adsets` | 1 year | Targeting details |
| `ads_creatives` | 1 year | Creative assets |
| `audit_logs` | 1 year | Compliance requirement |
| `generated_reports` | 6 months | Can be regenerated |

Archival strategy:
- Monthly: Move data older than retention period to cold storage (S3)
- Quarterly: Review and purge archived data beyond compliance requirements

---

## 10. Future Extensions

### 10.1 Phase 2 Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| **Real-time Alerts** | WebSocket notifications for anomaly detection | High |
| **Creative Performance AI** | Analyze creative elements driving performance | High |
| **Automated Recommendations** | Auto-apply budget/bid recommendations | Medium |
| **Attribution Modeling** | Multi-touch attribution analysis | Medium |
| **Competitor Intelligence** | Integrate competitive benchmarking data | Low |

### 10.2 Additional Platforms

Potential future integrations:
- TikTok Ads API
- LinkedIn Ads API
- Twitter/X Ads API
- Programmatic DSPs (DV360, The Trade Desk)

### 10.3 Advanced Analytics

- **Predictive Modeling**: Forecast future performance based on historical trends
- **Incrementality Testing**: Measure true lift from ad spend
- **Marketing Mix Modeling**: Optimize budget allocation across channels

---

## Appendix A: API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ads/performance` | GET | Query daily performance data |
| `/api/ads/performance/aggregated` | GET | Aggregated daily metrics for charts |
| `/api/ads/performance/campaigns` | GET | Campaign-level aggregation |
| `/api/ads/performance/ads` | GET | Ad-level aggregation with creative metadata |
| `/api/ads/performance/kpis` | GET | KPI summary with period comparison |
| `/api/ads/performance/monthly` | GET | Monthly aggregated metrics |
| `/api/ads/tenants` | GET | List all tenants with data |
| `/api/ads/sync` | POST | Trigger data sync for tenant |
| `/api/ads/meta/adaccounts` | GET | Discover Meta ad accounts |
| `/api/ads/google/accounts` | GET | Discover Google Ads accounts |
| `/api/ads/campaigns/details` | GET | Campaign metadata |
| `/api/ads/adsets/details` | GET | Ad set details with targeting |
| `/api/ads/creatives/details` | GET | Ad creative details |

---

## Appendix B: Environment Variables

```bash
# Database
DATABASE_URL=postgres://...

# Meta Ads API
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=act_XXXXX  # Default account (optional)

# Google Ads API
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=XXX-XXX-XXXX  # MCC ID

# Redis
REDIS_URL=redis://...

# Application
NODE_ENV=production
PORT=8080
API_BASE_URL=https://your-domain.fly.dev
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | 5ML Engineering | Initial architecture document |
