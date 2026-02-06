/**
 * Meta Marketing API (Insights) wrapper
 * Fetches campaign-level daily performance data from Meta Ads
 *
 * Error types:
 * - 'tls': SSL/TLS certificate errors
 * - 'timeout': Request timeout
 * - 'network': DNS, connection errors
 * - 'meta-api': Meta API returned error response
 * - 'config': Missing configuration
 * - 'unknown': Other errors
 */

const META_API_BASE = 'https://graph.facebook.com/v20.0';

// Custom error class with type information
export class MetaApiError extends Error {
  type: 'tls' | 'timeout' | 'network' | 'meta-api' | 'config' | 'unknown';
  status?: number;
  metaError?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
  code?: string;

  constructor(
    message: string,
    type: MetaApiError['type'],
    options?: {
      status?: number;
      metaError?: MetaApiError['metaError'];
      code?: string;
    }
  ) {
    super(message);
    this.name = 'MetaApiError';
    this.type = type;
    this.status = options?.status;
    this.metaError = options?.metaError;
    this.code = options?.code;
  }
}

/**
 * Safe fetch wrapper with timeout and error classification
 */
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      let bodyText: string;
      try {
        bodyText = await res.text();
      } catch {
        bodyText = '<failed_to_read_body>';
      }

      // Try to parse Meta error JSON
      let metaError: MetaApiError['metaError'] | undefined;
      try {
        const parsed = JSON.parse(bodyText);
        metaError = parsed.error;
      } catch {
        metaError = undefined;
      }

      throw new MetaApiError(
        `Meta API HTTP ${res.status}: ${metaError?.message || bodyText.substring(0, 200)}`,
        'meta-api',
        { status: res.status, metaError }
      );
    }

    return res;
  } catch (err: any) {
    // Already a MetaApiError, rethrow
    if (err instanceof MetaApiError) {
      throw err;
    }

    // Abort = timeout
    if (err?.name === 'AbortError') {
      throw new MetaApiError('Meta API request timed out', 'timeout');
    }

    // TLS / certificate errors
    const errMsg = err?.message?.toLowerCase() || '';
    if (
      err?.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
      err?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      err?.code === 'CERT_HAS_EXPIRED' ||
      errMsg.includes('self-signed certificate') ||
      errMsg.includes('certificate')
    ) {
      throw new MetaApiError(
        `TLS certificate error: ${err.message}`,
        'tls',
        { code: err.code }
      );
    }

    // Network errors (DNS, connection refused, etc.)
    if (err?.code === 'ENOTFOUND' || err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') {
      throw new MetaApiError(
        `Network error: ${err.message}`,
        'network',
        { code: err.code }
      );
    }

    // Unknown error
    throw new MetaApiError(
      err?.message || 'Unknown error',
      'unknown',
      { code: err?.code }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generic paginated Meta API fetcher
 */
async function fetchMetaPaginated<T>(
  initialUrl: string,
  timeoutMs = 15000
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = initialUrl;

  while (url) {
    const res = await safeFetch(url, {}, timeoutMs);
    const json = (await res.json()) as {
      data?: T[];
      paging?: { next?: string };
    };

    if (Array.isArray(json.data)) {
      results.push(...json.data);
    }

    url = json.paging?.next || null;
  }

  return results;
}

// ==========================================
// Types
// ==========================================

export interface MetaDailyMetric {
  platform: 'meta';
  accountId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  roas: number | null;
}

export interface MetaInsightsParams {
  accountId: string;
  since: string;
  until: string;
  accessToken?: string;
}

interface MetaApiAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  actions?: MetaApiAction[];
  action_values?: MetaApiAction[];
  website_purchase_roas?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

const INSIGHT_FIELDS = [
  'campaign_id',
  'campaign_name',
  'date_start',
  'date_stop',
  'impressions',
  'reach',
  'clicks',
  'spend',
  'actions',
  'action_values',
  'website_purchase_roas',
  'cpc',
  'cpm',
  'ctr',
].join(',');

// ==========================================
// Helper functions
// ==========================================

function extractConversions(actions?: MetaApiAction[]): number | null {
  if (!actions) return null;
  const purchaseAction = actions.find(
    (a) =>
      a.action_type === 'purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseAction ? parseFloat(purchaseAction.value) : null;
}

function extractRevenue(actionValues?: MetaApiAction[]): number | null {
  if (!actionValues) return null;
  const purchaseValue = actionValues.find(
    (a) =>
      a.action_type === 'purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseValue ? parseFloat(purchaseValue.value) : null;
}

function extractRoas(
  roas?: Array<{ action_type: string; value: string }>
): number | null {
  if (!roas || roas.length === 0) return null;
  const purchaseRoas = roas.find(
    (r) => r.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseRoas
    ? parseFloat(purchaseRoas.value)
    : roas[0]
    ? parseFloat(roas[0].value)
    : null;
}

function normalizeRow(accountId: string, row: MetaInsightRow): MetaDailyMetric {
  return {
    platform: 'meta',
    accountId,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    date: row.date_start,
    impressions: parseInt(row.impressions, 10) || 0,
    reach: parseInt(row.reach, 10) || 0,
    clicks: parseInt(row.clicks, 10) || 0,
    spend: parseFloat(row.spend) || 0,
    conversions: extractConversions(row.actions),
    revenue: extractRevenue(row.action_values),
    cpc: row.cpc ? parseFloat(row.cpc) : null,
    cpm: row.cpm ? parseFloat(row.cpm) : null,
    ctr: row.ctr ? parseFloat(row.ctr) : null,
    roas: extractRoas(row.website_purchase_roas),
  };
}

// ==========================================
// Main API functions
// ==========================================

/**
 * Fetch Meta Ads insights for a given account and date range
 */
export async function fetchMetaInsights({
  accountId,
  since,
  until,
  accessToken,
}: MetaInsightsParams): Promise<MetaDailyMetric[]> {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new MetaApiError('META_ACCESS_TOKEN is required but not provided', 'config');
  }

  const acctId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

  const url =
    `${META_API_BASE}/${acctId}/insights?` +
    new URLSearchParams({
      time_range: JSON.stringify({ since, until }),
      level: 'campaign',
      time_increment: '1',
      fields: INSIGHT_FIELDS,
      limit: '500',
      access_token: token,
    }).toString();

  try {
    const rawRows = await fetchMetaPaginated<MetaInsightRow>(url, 20000);
    const results = rawRows.map((row) => normalizeRow(accountId, row));
    console.log(`[Meta API] Fetched ${results.length} daily metrics for account ${accountId}`);
    return results;
  } catch (err) {
    if (err instanceof MetaApiError) {
      console.error('META_INSIGHTS_ERROR', {
        message: err.message,
        type: err.type,
        status: err.status,
        metaError: err.metaError,
        code: err.code,
      });
    }
    throw err;
  }
}

/**
 * Fetch Meta Ad Accounts accessible by the current token
 */
export async function fetchMetaAdAccounts(token?: string): Promise<any[]> {
  const accessToken = token || process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new MetaApiError('META_ACCESS_TOKEN is required', 'config');
  }

  const url =
    `${META_API_BASE}/me/adaccounts?` +
    new URLSearchParams({
      fields: 'id,name,account_id,account_status,currency,business_name',
      limit: '100',
      access_token: accessToken,
    }).toString();

  try {
    const accounts = await fetchMetaPaginated<any>(url, 15000);
    console.log(`[Meta API] Fetched ${accounts.length} ad accounts`);
    return accounts;
  } catch (err) {
    if (err instanceof MetaApiError) {
      console.error('META_ADACCOUNTS_ERROR', {
        message: err.message,
        type: err.type,
        status: err.status,
        metaError: err.metaError,
        code: err.code,
      });
    }
    throw err;
  }
}

/**
 * Health check for Meta API connection
 * Tests both TLS connectivity and token validity
 */
export async function metaHealthCheck(): Promise<{
  status: 'ok' | 'error';
  type?: MetaApiError['type'];
  message?: string;
  statusCode?: number;
  metaError?: MetaApiError['metaError'];
  code?: string;
  nodeExtraCaCerts?: string;
}> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return {
      status: 'error',
      type: 'config',
      message: 'META_ACCESS_TOKEN is not configured',
    };
  }

  try {
    // Use minimal request to test token + TLS
    const url =
      `${META_API_BASE}/me?` +
      new URLSearchParams({
        fields: 'id',
        access_token: token,
      }).toString();

    await safeFetch(url, {}, 8000);

    return { status: 'ok' };
  } catch (err) {
    if (err instanceof MetaApiError) {
      return {
        status: 'error',
        type: err.type,
        message: err.message,
        statusCode: err.status,
        metaError: err.metaError,
        code: err.code,
        nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
      };
    }

    return {
      status: 'error',
      type: 'unknown',
      message: err instanceof Error ? err.message : String(err),
      nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set',
    };
  }
}
