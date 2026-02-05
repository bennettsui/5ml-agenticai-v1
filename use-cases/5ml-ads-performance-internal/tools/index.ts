/**
 * Tools index for 5ML Internal Ads Performance
 */

export { fetchMetaInsights } from './meta-ads-api';
export type { MetaDailyMetric } from './meta-ads-api';

export { fetchGoogleAdsMetrics } from './google-ads-api';
export type { GoogleDailyMetric } from './google-ads-api';

export { upsertAdsDailyPerformance, queryAdsPerformance, queryAdsPerformanceAggregated } from './db-ops';
export type { AdsDailyPerformanceRow, AdsPerformanceQuery } from './db-ops';
