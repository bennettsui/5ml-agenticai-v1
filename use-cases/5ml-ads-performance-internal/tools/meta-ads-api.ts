/**
 * Meta Marketing API (Insights) wrapper
 * Fetches campaign-level daily performance data from Meta Ads
 */

export interface MetaDailyMetric {
  platform: 'meta';
  accountId: string;
  campaignId: string;
  campaignName: string;
  date: string; // YYYY-MM-DD
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

interface MetaApiActionValue {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  actions?: MetaApiAction[];
  action_values?: MetaApiActionValue[];
  website_purchase_roas?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

interface MetaApiResponse {
  data: MetaInsightRow[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

const META_API_BASE = 'https://graph.facebook.com/v20.0';

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractConversions(actions?: MetaApiAction[]): number | null {
  if (!actions) return null;
  const purchaseAction = actions.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseAction ? parseFloat(purchaseAction.value) : null;
}

function extractRevenue(actionValues?: MetaApiActionValue[]): number | null {
  if (!actionValues) return null;
  const purchaseValue = actionValues.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseValue ? parseFloat(purchaseValue.value) : null;
}

function extractRoas(roas?: Array<{ action_type: string; value: string }>): number | null {
  if (!roas || roas.length === 0) return null;
  const purchaseRoas = roas.find(
    (r) => r.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseRoas ? parseFloat(purchaseRoas.value) : (roas[0] ? parseFloat(roas[0].value) : null);
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

/**
 * Fetch Meta Ads insights for a given account and date range.
 * Handles pagination automatically with simple backoff on rate limits.
 */
export async function fetchMetaInsights({
  accountId,
  since,
  until,
  accessToken,
}: MetaInsightsParams): Promise<MetaDailyMetric[]> {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is required but not provided');
  }

  const acctId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const results: MetaDailyMetric[] = [];

  let url: string | null =
    `${META_API_BASE}/${acctId}/insights?` +
    new URLSearchParams({
      time_range: JSON.stringify({ since, until }),
      level: 'campaign',
      time_increment: '1',
      fields: INSIGHT_FIELDS,
      limit: '500',
      access_token: token,
    }).toString();

  let retries = 0;
  const maxRetries = 3;

  while (url) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        retries++;
        if (retries > maxRetries) {
          throw new Error('Meta API rate limit exceeded after max retries');
        }
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`[Meta API] Rate limited, retrying in ${waitTime}ms (attempt ${retries}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Meta API] Error response:', {
          status: response.status,
          body: errorBody.substring(0, 500),
        });
        throw new Error(`Meta API error ${response.status}: ${errorBody}`);
      }

      const json: MetaApiResponse = await response.json();
      retries = 0;

      for (const row of json.data) {
        results.push(normalizeRow(accountId, row));
      }

      url = json.paging?.next || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw error;
      }
      console.error('[Meta API] Request failed:', error);
      throw error;
    }
  }

  console.log(`[Meta API] Fetched ${results.length} daily metrics for account ${accountId}`);
  return results;
}

/**
 * Fetch Meta Ad Accounts accessible by the current token.
 */
export async function fetchMetaAdAccounts(token?: string): Promise<any[]> {
  const accessToken = token || process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN is required');
  }

  const results: any[] = [];
  let url: string | null =
    `${META_API_BASE}/me/adaccounts?` +
    new URLSearchParams({
      fields: 'id,name,account_id,account_status,currency,business_name',
      limit: '100',
      access_token: accessToken,
    }).toString();

  let retries = 0;
  const maxRetries = 3;

  while (url) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        retries++;
        if (retries > maxRetries) {
          throw new Error('Meta API rate limit exceeded after max retries');
        }
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`[Meta API] Rate limited, retrying in ${waitTime}ms`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Meta API] Error response:', {
          status: response.status,
          body: errorBody.substring(0, 500),
        });
        throw new Error(`Meta API error ${response.status}: ${errorBody}`);
      }

      const json = await response.json();
      retries = 0;

      if (Array.isArray(json.data)) {
        results.push(...json.data);
      }

      url = json.paging?.next || null;
    } catch (error) {
      console.error('[Meta API] Request failed:', error);
      throw error;
    }
  }

  console.log(`[Meta API] Fetched ${results.length} ad accounts`);
  return results;
}
