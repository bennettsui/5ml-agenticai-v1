/**
 * Layer 3: Agent - Normalizer
 * Data engineer agent for computing unified metrics
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { NormalizedMetaMetric } from './meta-data-fetcher';
import { NormalizedGoogleMetric } from './google-data-fetcher';

export interface NormalizerInput extends AgentInput {
  metaData?: NormalizedMetaMetric[];
  googleData?: NormalizedGoogleMetric[];
}

export interface UnifiedMetric {
  platform: 'meta' | 'google';
  accountId: string;
  campaignId: string;
  campaignName: string;
  adId: string;
  adName: string;
  date: string;
  impressions: number;
  reach?: number;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  // Computed metrics
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  cpa: number | null;
  cvr: number | null;
  roas: number | null;
}

export class NormalizerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'normalizer-agent',
      role: 'Analytics Engineer',
      temperature: 0,
      systemPrompt: `You are an analytics engineer specializing in advertising metrics.
Your role is to normalize data from different ad platforms into a unified schema
and compute standard performance metrics (CPC, CPM, CTR, CPA, CVR, ROAS).`,
    });
  }

  async execute(input: NormalizerInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const unified: UnifiedMetric[] = [];

      // Normalize Meta data
      if (input.metaData) {
        for (const row of input.metaData) {
          unified.push(this.normalizeMetaRow(row));
        }
      }

      // Normalize Google data
      if (input.googleData) {
        for (const row of input.googleData) {
          unified.push(this.normalizeGoogleRow(row));
        }
      }

      return {
        success: true,
        data: unified,
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

  private normalizeMetaRow(row: NormalizedMetaMetric): UnifiedMetric {
    return {
      platform: 'meta',
      accountId: row.accountId,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      adId: row.adId,
      adName: row.adName,
      date: row.date,
      impressions: row.impressions,
      reach: row.reach,
      clicks: row.clicks,
      spend: row.spend,
      conversions: row.conversions,
      revenue: row.revenue,
      cpc: this.computeCpc(row.spend, row.clicks),
      cpm: this.computeCpm(row.spend, row.impressions),
      ctr: this.computeCtr(row.clicks, row.impressions),
      cpa: this.computeCpa(row.spend, row.conversions),
      cvr: this.computeCvr(row.conversions, row.clicks),
      roas: this.computeRoas(row.revenue, row.spend),
    };
  }

  private normalizeGoogleRow(row: NormalizedGoogleMetric): UnifiedMetric {
    return {
      platform: 'google',
      accountId: row.customerId,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      adId: row.adId,
      adName: row.adName,
      date: row.date,
      impressions: row.impressions,
      clicks: row.clicks,
      spend: row.spend,
      conversions: row.conversions,
      revenue: row.revenue,
      cpc: this.computeCpc(row.spend, row.clicks),
      cpm: this.computeCpm(row.spend, row.impressions),
      ctr: this.computeCtr(row.clicks, row.impressions),
      cpa: this.computeCpa(row.spend, row.conversions),
      cvr: this.computeCvr(row.conversions, row.clicks),
      roas: this.computeRoas(row.revenue, row.spend),
    };
  }

  private computeCpc(spend: number, clicks: number): number | null {
    return clicks > 0 ? spend / clicks : null;
  }

  private computeCpm(spend: number, impressions: number): number | null {
    return impressions > 0 ? (spend / impressions) * 1000 : null;
  }

  private computeCtr(clicks: number, impressions: number): number | null {
    return impressions > 0 ? (clicks / impressions) * 100 : null;
  }

  private computeCpa(spend: number, conversions: number | null): number | null {
    if (conversions === null || conversions === 0) return null;
    return spend / conversions;
  }

  private computeCvr(conversions: number | null, clicks: number): number | null {
    if (conversions === null || clicks === 0) return null;
    return (conversions / clicks) * 100;
  }

  private computeRoas(revenue: number | null, spend: number): number | null {
    if (revenue === null || spend === 0) return null;
    return revenue / spend;
  }
}

export function createNormalizerAgent(): NormalizerAgent {
  return new NormalizerAgent();
}

export default NormalizerAgent;
