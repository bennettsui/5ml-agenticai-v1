/**
 * Layer 3: Agent - Google Ads Data Fetcher
 * Technical media buyer agent for Google Ads data collection via GAQL
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getTenantContextResolver, GoogleCredentials } from '../execution/tenant-context';

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v17';

export interface GoogleFetcherInput extends AgentInput {
  since: string;
  until: string;
}

export interface NormalizedGoogleMetric {
  platform: 'google';
  customerId: string;
  campaignId: string;
  campaignName: string;
  adId: string;
  adName: string;
  date: string;
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

export class GoogleDataFetcherAgent extends BaseAgent {
  constructor() {
    super({
      name: 'google-data-fetcher-agent',
      role: 'Technical Media Buyer - Google Ads',
      temperature: 0,
      systemPrompt: `You are a technical media buyer specializing in Google Ads.
Your role is to fetch and validate advertising data using GAQL queries.
Always ensure data integrity and handle the SearchStream response correctly.`,
    });
  }

  async execute(input: GoogleFetcherInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const resolver = getTenantContextResolver();
      const googleCreds = await resolver.getGoogleCredentials(input.tenantId);

      if (!googleCreds) {
        return {
          success: false,
          error: 'Google Ads credentials not configured for tenant',
          metadata: { agentName: this.getName(), executionTime: Date.now() - startTime },
        };
      }

      const rawData = await this.fetchMetrics(googleCreds, input.since, input.until);
      const normalized = rawData.map((row) => this.normalizeRow(googleCreds.customerId, row));

      return {
        success: true,
        data: normalized,
        metadata: {
          agentName: this.getName(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: { agentName: this.getName(), executionTime: Date.now() - startTime },
      };
    }
  }

  private async fetchMetrics(creds: GoogleCredentials, since: string, until: string): Promise<any[]> {
    const accessToken = await this.getAccessToken(creds);
    const cleanId = creds.customerId.replace(/-/g, '');

    const query = `
      SELECT
        campaign.id, campaign.name,
        ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type,
        segments.date,
        metrics.impressions, metrics.clicks, metrics.ctr,
        metrics.average_cpc, metrics.cost_micros,
        metrics.conversions, metrics.conversions_value
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${since}' AND '${until}'
        AND ad_group_ad.status != 'REMOVED'
    `.trim();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': creds.developerToken,
      'Content-Type': 'application/json',
    };

    if (creds.loginCustomerId) {
      headers['login-customer-id'] = creds.loginCustomerId.replace(/-/g, '');
    }

    const url = `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Ads API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const results: any[] = [];

    for (const batch of data) {
      if (batch.results) {
        results.push(...batch.results);
      }
    }

    console.log(`[GoogleDataFetcher] Fetched ${results.length} rows for ${creds.customerId}`);
    return results;
  }

  private async getAccessToken(creds: GoogleCredentials): Promise<string> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      throw new Error(`Failed to refresh Google token: ${body}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }

  private normalizeRow(customerId: string, row: any): NormalizedGoogleMetric {
    const impressions = parseInt(row.metrics?.impressions || '0', 10);
    const clicks = parseInt(row.metrics?.clicks || '0', 10);
    const costMicros = parseInt(row.metrics?.costMicros || '0', 10);
    const spend = costMicros / 1_000_000;
    const conversions = row.metrics?.conversions ?? null;
    const revenue = row.metrics?.conversionsValue ?? null;

    return {
      platform: 'google',
      customerId,
      campaignId: String(row.campaign?.id || ''),
      campaignName: row.campaign?.name || '',
      adId: row.adGroupAd?.ad?.id ? String(row.adGroupAd.ad.id) : '',
      adName: row.adGroupAd?.ad?.name || '',
      date: row.segments?.date || '',
      impressions,
      clicks,
      spend,
      conversions: conversions !== null ? parseFloat(conversions) : null,
      revenue: revenue !== null ? parseFloat(revenue) : null,
      cpc: clicks > 0 ? spend / clicks : null,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
      ctr: row.metrics?.ctr ?? null,
      roas: revenue !== null && spend > 0 ? parseFloat(revenue) / spend : null,
    };
  }
}

export function createGoogleDataFetcherAgent(): GoogleDataFetcherAgent {
  return new GoogleDataFetcherAgent();
}

export default GoogleDataFetcherAgent;
