/**
 * Layer 3: Agent - Funnel Analyzer
 * Performance strategist for analyzing conversion funnels
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getDbExecutor } from '../execution/db-executor';
import { getTenantContextResolver } from '../execution/tenant-context';

export interface FunnelAnalyzerInput extends AgentInput {
  startDate: string;
  endDate: string;
  platform?: 'meta' | 'google' | 'all';
}

export interface FunnelStage {
  name: string;
  metric: string;
  value: number;
  dropoffPct?: number;
}

export interface FunnelAnalysis {
  stages: FunnelStage[];
  bottleneck: {
    stage: string;
    dropoffPct: number;
    likelyCause: string;
    recommendation: string;
  } | null;
  overallCvr: number;
  insights: string[];
}

export class FunnelAnalyzerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'funnel-analyzer-agent',
      role: 'Funnel Strategist',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      systemPrompt: `You are a funnel strategist specializing in advertising performance analysis.
Your role is to analyze the Impressions → Clicks → Conversions → Revenue chain and identify bottlenecks.

When analyzing funnels:
1. Calculate stage-by-stage conversion rates
2. Identify where the biggest drop-offs occur
3. Diagnose likely causes based on patterns:
   - Low CTR = creative/audience mismatch
   - High CTR but low CVR = landing page or offer issues
   - High CVR but low AOV = pricing or upsell opportunities
4. Provide specific, actionable recommendations`,
    });
  }

  async execute(input: FunnelAnalyzerInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const dbExecutor = getDbExecutor();
      const platform = input.platform || 'all';

      // Get aggregated metrics
      const metrics = await dbExecutor.getAggregatedMetrics(
        input.tenantId,
        platform,
        input.startDate,
        input.endDate
      );

      // Build funnel stages
      const impressions = parseInt(metrics.impressions) || 0;
      const clicks = parseInt(metrics.clicks) || 0;
      const conversions = parseFloat(metrics.conversions) || 0;
      const revenue = parseFloat(metrics.revenue) || 0;

      const stages: FunnelStage[] = [
        { name: 'Impressions', metric: 'impressions', value: impressions },
        {
          name: 'Clicks',
          metric: 'clicks',
          value: clicks,
          dropoffPct: impressions > 0 ? ((impressions - clicks) / impressions) * 100 : 0,
        },
        {
          name: 'Conversions',
          metric: 'conversions',
          value: conversions,
          dropoffPct: clicks > 0 ? ((clicks - conversions) / clicks) * 100 : 0,
        },
      ];

      if (revenue > 0) {
        stages.push({
          name: 'Revenue',
          metric: 'revenue',
          value: revenue,
          dropoffPct: 0, // Revenue doesn't have a dropoff in the traditional sense
        });
      }

      // Calculate rates
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const overallCvr = impressions > 0 ? (conversions / impressions) * 100 : 0;
      const aov = conversions > 0 ? revenue / conversions : 0;

      // Get LLM analysis for bottleneck identification
      const analysis = await this.analyzeFunnel({
        impressions,
        clicks,
        conversions,
        revenue,
        ctr,
        cvr,
        aov,
        stages,
      }, input.tenantId);

      return {
        success: true,
        data: {
          stages,
          rates: { ctr, cvr, overallCvr, aov },
          bottleneck: analysis.bottleneck,
          insights: analysis.insights,
        },
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

  private async analyzeFunnel(data: any, tenantId: string): Promise<{ bottleneck: any; insights: string[] }> {
    // Get tenant context for KPI targets
    const resolver = getTenantContextResolver();
    const config = await resolver.getTenantConfig(tenantId);

    const targetCtr = config.primaryKpis?.targetCtr || 1.5;
    const targetCpa = config.primaryKpis?.targetCpa || 50;

    const prompt = `Analyze this advertising funnel and identify the main bottleneck:

Funnel Metrics:
- Impressions: ${data.impressions.toLocaleString()}
- Clicks: ${data.clicks.toLocaleString()} (CTR: ${data.ctr.toFixed(2)}%)
- Conversions: ${data.conversions.toFixed(0)} (CVR: ${data.cvr.toFixed(2)}%)
- Revenue: $${data.revenue.toFixed(2)}
- AOV: $${data.aov.toFixed(2)}

Client Targets:
- Target CTR: ${targetCtr}%
- Target CPA: $${targetCpa}

Stage Drop-offs:
${data.stages.map((s: FunnelStage) => `- ${s.name}: ${s.value.toLocaleString()}${s.dropoffPct ? ` (${s.dropoffPct.toFixed(1)}% drop)` : ''}`).join('\n')}

Provide your analysis as JSON with this structure:
{
  "bottleneck": {
    "stage": "name of the problem stage",
    "dropoffPct": numeric drop-off percentage,
    "likelyCause": "explanation of why this stage is underperforming",
    "recommendation": "specific action to improve this stage"
  },
  "insights": ["insight 1", "insight 2", "insight 3"]
}

If no significant bottleneck exists (all stages performing well), set bottleneck to null.`;

    try {
      const response = await this.callLLM(prompt);
      const parsed = this.parseJSON<{ bottleneck: any; insights: string[] }>(response);

      return parsed || {
        bottleneck: null,
        insights: ['Unable to generate funnel analysis'],
      };
    } catch {
      return {
        bottleneck: null,
        insights: ['Unable to generate funnel analysis'],
      };
    }
  }
}

export function createFunnelAnalyzerAgent(): FunnelAnalyzerAgent {
  return new FunnelAnalyzerAgent();
}

export default FunnelAnalyzerAgent;
