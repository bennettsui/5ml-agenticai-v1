/**
 * Layer 3: Agent - Meta Data Fetcher
 * Technical media buyer agent for Meta Ads data collection
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getToolExecutor } from '../execution/tool-executor';
import { getTenantContextResolver } from '../execution/tenant-context';

const META_API_BASE = 'https://graph.facebook.com/v20.0';

export interface MetaFetcherInput extends AgentInput {
  since: string;
  until: string;
  breakdowns?: string[];
}

export interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  ad_id?: string;
  ad_name?: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  reach?: string;
  clicks: string;
  spend: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  website_purchase_roas?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

export interface NormalizedMetaMetric {
  platform: 'meta';
  accountId: string;
  campaignId: string;
  campaignName: string;
  adId: string;
  adName: string;
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

export class MetaDataFetcherAgent extends BaseAgent {
  constructor() {
    super({
      name: 'meta-data-fetcher-agent',
      role: 'Technical Media Buyer - Meta',
      temperature: 0,
      systemPrompt: `You are a technical media buyer specializing in Meta Ads.
Your role is to fetch and validate advertising data from the Meta Marketing API.
Always ensure data integrity and handle pagination correctly.`,
    });
  }

  async execute(input: MetaFetcherInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const resolver = getTenantContextResolver();
      const metaCreds = await resolver.getMetaCredentials(input.tenantId);

      if (!metaCreds) {
        return {
          success: false,
          error: 'Meta credentials not configured for tenant',
          metadata: { agentName: this.getName(), executionTime: Date.now() - startTime },
        };
      }

      const { accountId, accessToken } = metaCreds;
      const rawData = await this.fetchInsights(accountId, input.since, input.until, accessToken);
      const normalized = rawData.map((row) => this.normalizeRow(accountId, row));

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

  private async fetchInsights(accountId: string, since: string, until: string, token: string): Promise<MetaInsightRow[]> {
    const acctId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    const fields = [
      'campaign_id', 'campaign_name', 'ad_id', 'ad_name',
      'date_start', 'date_stop',
      'impressions', 'reach', 'clicks', 'spend',
      'actions', 'action_values', 'website_purchase_roas',
      'cpc', 'cpm', 'ctr',
    ].join(',');

    const url = `${META_API_BASE}/${acctId}/insights?` +
      new URLSearchParams({
        time_range: JSON.stringify({ since, until }),
        level: 'ad',
        time_increment: '1',
        fields,
        limit: '500',
        access_token: token,
      }).toString();

    const allRows: MetaInsightRow[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Meta API error ${response.status}: ${body}`);
      }

      const json = await response.json();
      if (json.data) {
        allRows.push(...json.data);
      }

      nextUrl = json.paging?.next || null;
    }

    console.log(`[MetaDataFetcher] Fetched ${allRows.length} rows for ${acctId}`);
    return allRows;
  }

  private normalizeRow(accountId: string, row: MetaInsightRow): NormalizedMetaMetric {
    const conversions = this.extractConversions(row.actions);
    const revenue = this.extractRevenue(row.action_values);
    const roas = this.extractRoas(row.website_purchase_roas);

    return {
      platform: 'meta',
      accountId,
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      adId: row.ad_id || '',
      adName: row.ad_name || '',
      date: row.date_start,
      impressions: parseInt(row.impressions, 10) || 0,
      reach: parseInt(row.reach || '0', 10) || 0,
      clicks: parseInt(row.clicks, 10) || 0,
      spend: parseFloat(row.spend) || 0,
      conversions,
      revenue,
      cpc: row.cpc ? parseFloat(row.cpc) : null,
      cpm: row.cpm ? parseFloat(row.cpm) : null,
      ctr: row.ctr ? parseFloat(row.ctr) : null,
      roas,
    };
  }

  private extractConversions(actions?: Array<{ action_type: string; value: string }>): number | null {
    if (!actions) return null;
    const purchase = actions.find(
      (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    return purchase ? parseFloat(purchase.value) : null;
  }

  private extractRevenue(actionValues?: Array<{ action_type: string; value: string }>): number | null {
    if (!actionValues) return null;
    const purchase = actionValues.find(
      (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    return purchase ? parseFloat(purchase.value) : null;
  }

  private extractRoas(roas?: Array<{ action_type: string; value: string }>): number | null {
    if (!roas || roas.length === 0) return null;
    const purchase = roas.find((r) => r.action_type === 'offsite_conversion.fb_pixel_purchase');
    return purchase ? parseFloat(purchase.value) : (roas[0] ? parseFloat(roas[0].value) : null);
  }
}

export function createMetaDataFetcherAgent(): MetaDataFetcherAgent {
  return new MetaDataFetcherAgent();
}

export default MetaDataFetcherAgent;
