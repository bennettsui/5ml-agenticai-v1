/**
 * Tools index for Multi-tenant Ads Performance
 */

export { fetchMetaInsightsForTenant } from './meta-ads-api';
export type { TenantMetaDailyMetric } from './meta-ads-api';

export { fetchGoogleAdsMetricsForTenant } from './google-ads-api';
export type { TenantGoogleDailyMetric } from './google-ads-api';

export {
  getMetaCredentialsForTenant,
  getGoogleAdsCredentialsForTenant,
  listTenantsWithCredentials,
} from './credentials';
export type { MetaCredentials, GoogleAdsCredentials, TenantContext } from './credentials';

// Re-export shared DB operations
export {
  upsertAdsDailyPerformance,
  queryAdsPerformance,
  queryAdsPerformanceAggregated,
} from '../../5ml-ads-performance-internal/tools/db-ops';
