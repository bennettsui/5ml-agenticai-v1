/**
 * Database operations for ads daily performance
 * Handles upsert, query, and aggregation of ad metrics
 */

import type { MetaDailyMetric } from './meta-ads-api';
import type { GoogleDailyMetric } from './google-ads-api';

type DailyMetric = MetaDailyMetric | GoogleDailyMetric;

export interface AdsDailyPerformanceRow {
  id: string;
  platform: string;
  tenantId: string;
  accountId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  reach: number | null;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  roas: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdsPerformanceQuery {
  tenantId?: string;
  platform?: 'meta' | 'google' | 'all';
  from: string;
  to: string;
}

interface PoolClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/**
 * Upsert a batch of daily metrics into ads_daily_performance table.
 * Uses ON CONFLICT to update existing rows for the same platform/campaign/date.
 */
export async function upsertAdsDailyPerformance(
  pool: PoolClient,
  metrics: DailyMetric[],
  tenantId: string = '5ml-internal'
): Promise<number> {
  if (metrics.length === 0) return 0;

  let insertedCount = 0;

  for (const metric of metrics) {
    const accountId = 'accountId' in metric ? metric.accountId : ('customerId' in metric ? metric.customerId : '');
    const reach = 'reach' in metric ? metric.reach : null;

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
        metric.platform,
        tenantId,
        accountId,
        metric.campaignId,
        metric.campaignName,
        metric.date,
        metric.impressions,
        reach,
        metric.clicks,
        metric.spend,
        metric.conversions,
        metric.revenue,
        metric.cpc,
        metric.cpm,
        metric.ctr,
        metric.roas,
      ]
    );
    insertedCount++;
  }

  console.log(`[DB] Upserted ${insertedCount} rows for tenant ${tenantId}`);
  return insertedCount;
}

/**
 * Query ads performance data with filters.
 */
export async function queryAdsPerformance(
  pool: PoolClient,
  query: AdsPerformanceQuery
): Promise<AdsDailyPerformanceRow[]> {
  const conditions: string[] = ['date >= $1', 'date <= $2'];
  const params: unknown[] = [query.from, query.to];
  let paramIndex = 3;

  if (query.tenantId) {
    conditions.push(`tenant_id = $${paramIndex}`);
    params.push(query.tenantId);
    paramIndex++;
  }

  if (query.platform && query.platform !== 'all') {
    conditions.push(`platform = $${paramIndex}`);
    params.push(query.platform);
    paramIndex++;
  }

  const sql = `
    SELECT
      id, platform, tenant_id as "tenantId", account_id as "accountId",
      campaign_id as "campaignId", campaign_name as "campaignName",
      date::text, impressions, reach, clicks, spend,
      conversions, revenue, cpc, cpm, ctr, roas,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM ads_daily_performance
    WHERE ${conditions.join(' AND ')}
    ORDER BY date DESC, campaign_name ASC
  `;

  const result = await pool.query(sql, params);
  return result.rows as unknown as AdsDailyPerformanceRow[];
}

/**
 * Query aggregated performance grouped by date (for chart data).
 */
export async function queryAdsPerformanceAggregated(
  pool: PoolClient,
  query: AdsPerformanceQuery
): Promise<Record<string, unknown>[]> {
  const conditions: string[] = ['date >= $1', 'date <= $2'];
  const params: unknown[] = [query.from, query.to];
  let paramIndex = 3;

  if (query.tenantId) {
    conditions.push(`tenant_id = $${paramIndex}`);
    params.push(query.tenantId);
    paramIndex++;
  }

  if (query.platform && query.platform !== 'all') {
    conditions.push(`platform = $${paramIndex}`);
    params.push(query.platform);
    paramIndex++;
  }

  const sql = `
    SELECT
      date::text,
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(spend)::numeric(18,2) as spend,
      SUM(conversions)::numeric(18,2) as conversions,
      SUM(revenue)::numeric(18,2) as revenue,
      CASE WHEN SUM(spend) > 0
        THEN (SUM(revenue) / SUM(spend))::numeric(10,2)
        ELSE 0 END as roas
    FROM ads_daily_performance
    WHERE ${conditions.join(' AND ')}
    GROUP BY date
    ORDER BY date ASC
  `;

  const result = await pool.query(sql, params);
  return result.rows;
}
