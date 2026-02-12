/**
 * Multi-tenant Meta Ads API wrapper
 * Extends the internal Meta Ads tool with tenant credential resolution
 */

import { fetchMetaInsights } from '../../5ml-ads-performance-internal/tools/meta-ads-api';
import type { MetaDailyMetric } from '../../5ml-ads-performance-internal/tools/meta-ads-api';
import { getMetaCredentialsForTenant } from './credentials';

interface PoolClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface TenantMetaDailyMetric extends MetaDailyMetric {
  tenantId: string;
}

/**
 * Fetch Meta Ads insights for a specific tenant.
 * Resolves credentials from the database before making API calls.
 */
export async function fetchMetaInsightsForTenant(
  pool: PoolClient,
  tenantId: string,
  since: string,
  until: string
): Promise<TenantMetaDailyMetric[]> {
  const credentials = await getMetaCredentialsForTenant(pool, tenantId);

  console.log(`[Meta Ads] Fetching for tenant ${tenantId} (account: ${credentials.adAccountId})`);

  const metrics = await fetchMetaInsights({
    accountId: credentials.adAccountId,
    since,
    until,
    accessToken: credentials.accessToken,
  });

  return metrics.map((m) => ({
    ...m,
    tenantId,
  }));
}
