/**
 * Multi-tenant Google Ads API wrapper
 * Extends the internal Google Ads tool with tenant credential resolution
 */

import { fetchGoogleAdsMetrics } from '../../5ml-ads-performance-internal/tools/google-ads-api';
import type { GoogleDailyMetric } from '../../5ml-ads-performance-internal/tools/google-ads-api';
import { getGoogleAdsCredentialsForTenant } from './credentials';

interface PoolClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface TenantGoogleDailyMetric extends GoogleDailyMetric {
  tenantId: string;
}

/**
 * Fetch Google Ads metrics for a specific tenant.
 * Resolves credentials from the database before making API calls.
 */
export async function fetchGoogleAdsMetricsForTenant(
  pool: PoolClient,
  tenantId: string,
  since: string,
  until: string
): Promise<TenantGoogleDailyMetric[]> {
  const credentials = await getGoogleAdsCredentialsForTenant(pool, tenantId);

  console.log(`[Google Ads] Fetching for tenant ${tenantId} (customer: ${credentials.customerId})`);

  const metrics = await fetchGoogleAdsMetrics({
    customerId: credentials.customerId,
    since,
    until,
    developerToken: credentials.developerToken,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken: credentials.refreshToken,
    loginCustomerId: credentials.loginCustomerId,
  });

  return metrics.map((m) => ({
    ...m,
    tenantId,
  }));
}
