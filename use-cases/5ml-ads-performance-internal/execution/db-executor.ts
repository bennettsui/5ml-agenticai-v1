/**
 * Layer 2: Execution Engine - Database Executor
 * Batch operations for ads performance data
 */

import { getDatabase, AdsDatabase } from '../infrastructure/database';

export interface NormalizedMetric {
  platform: 'meta' | 'google';
  accountId?: string;
  customerId?: string;
  campaignId: string;
  campaignName: string;
  adId?: string;
  adName?: string;
  date: string;
  impressions: number;
  reach?: number;
  clicks: number;
  spend: number;
  conversions?: number;
  revenue?: number;
  cpc?: number;
  cpm?: number;
  ctr?: number;
  roas?: number;
}

export interface CampaignData {
  platform: 'meta' | 'google';
  campaignId: string;
  campaignName: string;
  objective?: string;
  status?: string;
  effectiveStatus?: string;
  buyingType?: string;
  bidStrategy?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  budgetRemaining?: number;
  startTime?: string;
  stopTime?: string;
  createdTime?: string;
  updatedTime?: string;
  rawData?: any;
}

export interface AdSetData {
  platform: 'meta' | 'google';
  campaignId: string;
  adsetId: string;
  adsetName: string;
  status?: string;
  effectiveStatus?: string;
  optimizationGoal?: string;
  billingEvent?: string;
  bidStrategy?: string;
  bidAmount?: number;
  dailyBudget?: number;
  lifetimeBudget?: number;
  targeting?: any;
  startTime?: string;
  endTime?: string;
  rawData?: any;
}

export interface CreativeData {
  platform: 'meta' | 'google';
  adId: string;
  adName?: string;
  adsetId?: string;
  campaignId?: string;
  creativeId?: string;
  creativeName?: string;
  title?: string;
  body?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  linkUrl?: string;
  ctaType?: string;
  status?: string;
  effectiveStatus?: string;
  rawCreative?: any;
  rawAd?: any;
}

export class DbExecutor {
  private db: AdsDatabase;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Batch upsert daily metrics
   */
  async saveDailyMetricsBatch(metrics: NormalizedMetric[], tenantId: string): Promise<number> {
    let count = 0;

    for (const m of metrics) {
      const accountId = m.accountId || m.customerId || '';
      const reach = m.reach ?? null;
      const adId = m.adId || '';
      const adName = m.adName || '';

      await this.db.query(
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
          m.impressions, reach, m.clicks, m.spend, m.conversions ?? null, m.revenue ?? null,
          m.cpc ?? null, m.cpm ?? null, m.ctr ?? null, m.roas ?? null,
        ]
      );
      count++;
    }

    return count;
  }

  /**
   * Batch upsert campaigns
   */
  async saveCampaignsBatch(campaigns: CampaignData[], tenantId: string, accountId: string): Promise<number> {
    let count = 0;

    for (const c of campaigns) {
      await this.db.query(
        `INSERT INTO ads_campaigns
          (platform, tenant_id, account_id, campaign_id, campaign_name, objective, status,
           effective_status, buying_type, bid_strategy, daily_budget, lifetime_budget,
           budget_remaining, start_time, stop_time, created_time, updated_time, raw_data, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now())
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
           raw_data = EXCLUDED.raw_data,
           synced_at = now()`,
        [
          c.platform, tenantId, accountId, c.campaignId, c.campaignName,
          c.objective ?? null, c.status ?? null, c.effectiveStatus ?? null,
          c.buyingType ?? null, c.bidStrategy ?? null,
          c.dailyBudget ?? null, c.lifetimeBudget ?? null, c.budgetRemaining ?? null,
          c.startTime ?? null, c.stopTime ?? null, c.createdTime ?? null, c.updatedTime ?? null,
          c.rawData ? JSON.stringify(c.rawData) : null,
        ]
      );
      count++;
    }

    return count;
  }

  /**
   * Batch upsert ad sets
   */
  async saveAdSetsBatch(adsets: AdSetData[], tenantId: string, accountId: string): Promise<number> {
    let count = 0;

    for (const a of adsets) {
      await this.db.query(
        `INSERT INTO ads_adsets
          (platform, tenant_id, account_id, campaign_id, adset_id, adset_name, status,
           effective_status, optimization_goal, billing_event, bid_strategy, bid_amount,
           daily_budget, lifetime_budget, targeting, start_time, end_time, raw_data, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now())
         ON CONFLICT (platform, tenant_id, adset_id)
         DO UPDATE SET
           adset_name = EXCLUDED.adset_name,
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
           raw_data = EXCLUDED.raw_data,
           synced_at = now()`,
        [
          a.platform, tenantId, accountId, a.campaignId, a.adsetId, a.adsetName,
          a.status ?? null, a.effectiveStatus ?? null,
          a.optimizationGoal ?? null, a.billingEvent ?? null, a.bidStrategy ?? null,
          a.bidAmount ?? null, a.dailyBudget ?? null, a.lifetimeBudget ?? null,
          a.targeting ? JSON.stringify(a.targeting) : null,
          a.startTime ?? null, a.endTime ?? null,
          a.rawData ? JSON.stringify(a.rawData) : null,
        ]
      );
      count++;
    }

    return count;
  }

  /**
   * Batch upsert creatives
   */
  async saveCreativesBatch(creatives: CreativeData[], tenantId: string, accountId: string): Promise<number> {
    let count = 0;

    for (const c of creatives) {
      await this.db.query(
        `INSERT INTO ads_creatives
          (platform, tenant_id, account_id, ad_id, ad_name, adset_id, campaign_id,
           creative_id, creative_name, title, body, description, image_url, thumbnail_url,
           video_id, link_url, call_to_action_type, status, effective_status,
           raw_creative, raw_ad, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, now())
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
          c.platform, tenantId, accountId, c.adId, c.adName ?? null,
          c.adsetId ?? null, c.campaignId ?? null,
          c.creativeId ?? null, c.creativeName ?? null,
          c.title ?? null, c.body ?? null, c.description ?? null,
          c.imageUrl ?? null, c.thumbnailUrl ?? null, c.videoId ?? null,
          c.linkUrl ?? null, c.ctaType ?? null,
          c.status ?? null, c.effectiveStatus ?? null,
          c.rawCreative ? JSON.stringify(c.rawCreative) : null,
          c.rawAd ? JSON.stringify(c.rawAd) : null,
        ]
      );
      count++;
    }

    return count;
  }

  /**
   * Query aggregated metrics for analysis
   */
  async getAggregatedMetrics(
    tenantId: string,
    platform: 'meta' | 'google' | 'all',
    startDate: string,
    endDate: string
  ): Promise<any> {
    const conditions = ['date >= $1', 'date <= $2'];
    const params: any[] = [startDate, endDate];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    const result = await this.db.query(
      `SELECT
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue,
        CASE WHEN SUM(clicks) > 0 THEN (SUM(spend) / SUM(clicks))::numeric(18,4) ELSE 0 END as cpc,
        CASE WHEN SUM(impressions) > 0 THEN (SUM(spend) / SUM(impressions) * 1000)::numeric(18,4) ELSE 0 END as cpm,
        CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::numeric / SUM(impressions) * 100)::numeric(10,4) ELSE 0 END as ctr,
        CASE WHEN SUM(spend) > 0 THEN (SUM(revenue) / SUM(spend))::numeric(10,4) ELSE 0 END as roas
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}`,
      params
    );

    return result.rows[0];
  }

  /**
   * Query metrics by campaign for comparison
   */
  async getMetricsByCampaign(
    tenantId: string,
    platform: 'meta' | 'google' | 'all',
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const conditions = ['date >= $1', 'date <= $2'];
    const params: any[] = [startDate, endDate];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    const result = await this.db.query(
      `SELECT
        platform,
        campaign_id,
        MAX(campaign_name) as campaign_name,
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue,
        CASE WHEN SUM(clicks) > 0 THEN (SUM(spend) / SUM(clicks))::numeric(18,4) ELSE 0 END as cpc,
        CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::numeric / SUM(impressions) * 100)::numeric(10,4) ELSE 0 END as ctr,
        CASE WHEN SUM(spend) > 0 THEN (SUM(revenue) / SUM(spend))::numeric(10,4) ELSE 0 END as roas
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      GROUP BY platform, campaign_id
      ORDER BY spend DESC`,
      params
    );

    return result.rows;
  }

  /**
   * Get daily trend data
   */
  async getDailyTrend(
    tenantId: string,
    platform: 'meta' | 'google' | 'all',
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const conditions = ['date >= $1', 'date <= $2'];
    const params: any[] = [startDate, endDate];

    if (tenantId !== 'all') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    if (platform !== 'all') {
      params.push(platform);
      conditions.push(`platform = $${params.length}`);
    }

    const result = await this.db.query(
      `SELECT
        date::text,
        SUM(impressions)::bigint as impressions,
        SUM(clicks)::bigint as clicks,
        SUM(spend)::numeric(18,2) as spend,
        SUM(conversions)::numeric(18,2) as conversions,
        SUM(revenue)::numeric(18,2) as revenue
      FROM ads_daily_performance
      WHERE ${conditions.join(' AND ')}
      GROUP BY date
      ORDER BY date ASC`,
      params
    );

    return result.rows;
  }

  /**
   * Clean up old campaign-level data after ad-level sync
   */
  async cleanupCampaignLevelData(tenantId: string, platform: string, startDate: string, endDate: string): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM ads_daily_performance
       WHERE tenant_id = $1 AND platform = $2 AND date >= $3 AND date <= $4 AND ad_id = ''`,
      [tenantId, platform, startDate, endDate]
    );

    return result.rowCount || 0;
  }
}

// Singleton instance
let dbExecutorInstance: DbExecutor | null = null;

export function getDbExecutor(): DbExecutor {
  if (!dbExecutorInstance) {
    dbExecutorInstance = new DbExecutor();
  }
  return dbExecutorInstance;
}

export default DbExecutor;
