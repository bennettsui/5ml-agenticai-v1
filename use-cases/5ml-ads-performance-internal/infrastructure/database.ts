/**
 * Layer 1: Infrastructure - Database Configuration
 * PostgreSQL connection and table initialization for ads performance
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export class AdsDatabase {
  private pool: Pool | null = null;
  private initialized = false;

  constructor(private config?: DatabaseConfig) {}

  async connect(): Promise<void> {
    if (this.pool) return;

    const connectionString = this.config?.connectionString || process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('[AdsDatabase] Unexpected error on idle client:', err);
    });

    await this.initializeTables();
  }

  async getPool(): Promise<Pool> {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool!;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const pool = await this.getPool();
    return pool.query(sql, params);
  }

  async getClient(): Promise<PoolClient> {
    const pool = await this.getPool();
    return pool.connect();
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async initializeTables(): Promise<void> {
    if (this.initialized) return;

    const schema = `
      -- Core performance data table
      CREATE TABLE IF NOT EXISTS ads_daily_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        tenant_id TEXT NOT NULL DEFAULT '5ml-internal',
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        ad_id TEXT NOT NULL DEFAULT '',
        ad_name TEXT NOT NULL DEFAULT '',
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
        ON ads_daily_performance (platform, tenant_id, campaign_id, ad_id, date);
      CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_date
        ON ads_daily_performance (date);
      CREATE INDEX IF NOT EXISTS idx_ads_daily_performance_tenant
        ON ads_daily_performance (tenant_id, date);

      -- Client credentials for multi-tenant
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

      -- Tenants table with KPI targets
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        industry TEXT,
        business_model TEXT,
        primary_kpis JSONB DEFAULT '{}',
        brand_voice TEXT DEFAULT 'professional',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants (tenant_id);

      -- Campaign details
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

      -- Ad sets with targeting
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

      -- Ad creatives
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

      -- Audit log for governance
      CREATE TABLE IF NOT EXISTS ads_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        action TEXT NOT NULL,
        actor TEXT NOT NULL DEFAULT 'system',
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON ads_audit_log (tenant_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON ads_audit_log (action, created_at DESC);

      -- Anomaly alerts storage
      CREATE TABLE IF NOT EXISTS ads_anomalies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        campaign_id TEXT,
        ad_id TEXT,
        metric TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        current_value NUMERIC(18, 4),
        previous_value NUMERIC(18, 4),
        delta_pct NUMERIC(10, 2),
        explanation TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_anomalies_tenant ON ads_anomalies (tenant_id, detected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_anomalies_status ON ads_anomalies (status, detected_at DESC);

      -- Recommendations storage
      CREATE TABLE IF NOT EXISTS ads_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        report_type TEXT NOT NULL,
        executive_summary TEXT,
        key_insights JSONB,
        action_items JSONB,
        raw_analysis JSONB,
        generated_by TEXT NOT NULL DEFAULT 'recommendation-writer-agent',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_recommendations_tenant ON ads_recommendations (tenant_id, created_at DESC);
    `;

    try {
      await this.pool!.query(schema);
      this.initialized = true;
      console.log('[AdsDatabase] Tables initialized successfully');
    } catch (error) {
      console.error('[AdsDatabase] Failed to initialize tables:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let dbInstance: AdsDatabase | null = null;

export function getDatabase(config?: DatabaseConfig): AdsDatabase {
  if (!dbInstance) {
    dbInstance = new AdsDatabase(config);
  }
  return dbInstance;
}

export default AdsDatabase;
