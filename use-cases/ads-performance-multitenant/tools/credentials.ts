/**
 * Multi-tenant credentials management
 * Resolves per-tenant Meta and Google Ads credentials from the database
 */

export interface TenantContext {
  tenantId: string;
}

export interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
}

export interface GoogleAdsCredentials {
  customerId: string;
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  loginCustomerId?: string;
}

interface PoolClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/**
 * Get Meta Ads credentials for a given tenant.
 */
export async function getMetaCredentialsForTenant(
  pool: PoolClient,
  tenantId: string
): Promise<MetaCredentials> {
  const result = await pool.query(
    `SELECT account_id, access_token, extra
     FROM client_credentials
     WHERE tenant_id = $1 AND service = 'meta_ads'
     LIMIT 1`,
    [tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error(`No Meta Ads credentials found for tenant: ${tenantId}`);
  }

  const row = result.rows[0];
  const accessToken = row.access_token as string;

  if (!accessToken) {
    throw new Error(`Meta Ads access_token is missing for tenant: ${tenantId}`);
  }

  return {
    adAccountId: row.account_id as string,
    accessToken,
  };
}

/**
 * Get Google Ads credentials for a given tenant.
 */
export async function getGoogleAdsCredentialsForTenant(
  pool: PoolClient,
  tenantId: string
): Promise<GoogleAdsCredentials> {
  const result = await pool.query(
    `SELECT account_id, refresh_token, extra
     FROM client_credentials
     WHERE tenant_id = $1 AND service = 'google_ads'
     LIMIT 1`,
    [tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error(`No Google Ads credentials found for tenant: ${tenantId}`);
  }

  const row = result.rows[0];
  const extra = (row.extra || {}) as Record<string, string>;
  const refreshToken = row.refresh_token as string;

  if (!refreshToken) {
    throw new Error(`Google Ads refresh_token is missing for tenant: ${tenantId}`);
  }

  return {
    customerId: row.account_id as string,
    developerToken: extra.developer_token || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: extra.client_id || process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: extra.client_secret || process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken,
    loginCustomerId: extra.login_customer_id,
  };
}

/**
 * List all tenants that have any ads credentials configured.
 */
export async function listTenantsWithCredentials(
  pool: PoolClient
): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT tenant_id FROM client_credentials ORDER BY tenant_id`
  );
  return result.rows.map((row) => row.tenant_id as string);
}
