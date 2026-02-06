/**
 * Google Ads API wrapper
 * Fetches campaign-level daily performance data via GAQL (Google Ads Query Language)
 */

export interface GoogleDailyMetric {
  platform: 'google';
  customerId: string;
  campaignId: string;
  campaignName: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  roas: number | null;
}

interface GoogleAdsParams {
  customerId: string;
  since: string;
  until: string;
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  loginCustomerId?: string;
}

interface GoogleAdsOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleAdsSearchStreamRow {
  campaign?: {
    id?: string;
    name?: string;
  };
  segments?: {
    date?: string;
  };
  metrics?: {
    impressions?: string;
    clicks?: string;
    ctr?: number;
    averageCpc?: string;
    costMicros?: string;
    conversions?: number;
    conversionsValue?: number;
  };
}

interface GoogleAdsSearchResponse {
  results?: GoogleAdsSearchStreamRow[];
  nextPageToken?: string;
  totalResultsCount?: string;
}

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exchange a refresh token for a fresh access token via Google OAuth2.
 */
async function getAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google OAuth token error ${response.status}: ${errorBody}`);
  }

  const data: GoogleAdsOAuthTokenResponse = await response.json();
  return data.access_token;
}

function buildGaqlQuery(since: string, until: string): string {
  return `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
  `.trim();
}

function normalizeRow(customerId: string, row: GoogleAdsSearchStreamRow): GoogleDailyMetric | null {
  if (!row.campaign?.id || !row.segments?.date) return null;

  const costMicros = row.metrics?.costMicros ? parseInt(row.metrics.costMicros, 10) : 0;
  const spend = costMicros / 1_000_000;
  const impressions = row.metrics?.impressions ? parseInt(row.metrics.impressions, 10) : 0;
  const clicks = row.metrics?.clicks ? parseInt(row.metrics.clicks, 10) : 0;
  const conversions = row.metrics?.conversions ?? null;
  const revenue = row.metrics?.conversionsValue ?? null;

  return {
    platform: 'google',
    customerId,
    campaignId: row.campaign.id,
    campaignName: row.campaign.name || '',
    date: row.segments.date,
    impressions,
    clicks,
    spend,
    conversions,
    revenue,
    cpc: clicks > 0 ? spend / clicks : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    ctr: row.metrics?.ctr ?? null,
    roas: revenue !== null && spend > 0 ? revenue / spend : null,
  };
}

/**
 * Fetch Google Ads metrics for a given customer and date range.
 * Uses the Google Ads REST API with SearchStream.
 */
export async function fetchGoogleAdsMetrics({
  customerId,
  since,
  until,
  developerToken,
  clientId,
  clientSecret,
  refreshToken,
  loginCustomerId,
}: GoogleAdsParams): Promise<GoogleDailyMetric[]> {
  const devToken = developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const cId = clientId || process.env.GOOGLE_ADS_CLIENT_ID;
  const cSecret = clientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET;
  const rToken = refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const loginCid = loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is required');
  if (!cId) throw new Error('GOOGLE_ADS_CLIENT_ID is required');
  if (!cSecret) throw new Error('GOOGLE_ADS_CLIENT_SECRET is required');
  if (!rToken) throw new Error('GOOGLE_ADS_REFRESH_TOKEN is required');

  const accessToken = await getAccessToken({
    clientId: cId,
    clientSecret: cSecret,
    refreshToken: rToken,
  });

  const cleanCustomerId = customerId.replace(/-/g, '');
  const query = buildGaqlQuery(since, until);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  };

  if (loginCid) {
    headers['login-customer-id'] = loginCid.replace(/-/g, '');
  }

  const url = `${GOOGLE_ADS_BASE}/customers/${cleanCustomerId}:search`;

  let retries = 0;
  const maxRetries = 3;
  const results: GoogleDailyMetric[] = [];

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (response.status === 429) {
        retries++;
        if (retries > maxRetries) {
          throw new Error('Google Ads API rate limit exceeded after max retries');
        }
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`[Google Ads API] Rate limited, retrying in ${waitTime}ms (attempt ${retries}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google Ads API error ${response.status}: ${errorBody}`);
      }

      const data: GoogleAdsSearchResponse = await response.json();

      // Handle search endpoint response (single object with results array)
      if (data.results) {
        for (const row of data.results) {
          const metric = normalizeRow(customerId, row);
          if (metric) {
            results.push(metric);
          }
        }
      }

      break;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw error;
      }
      console.error('[Google Ads API] Request failed:', error);
      throw error;
    }
  }

  console.log(`[Google Ads API] Fetched ${results.length} daily metrics for customer ${customerId}`);
  return results;
}
