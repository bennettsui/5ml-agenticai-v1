/**
 * Layer 3: Agent - Recommendation Writer (Client-facing)
 * Client-service performance lead for generating actionable reports
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getTenantContextResolver } from '../execution/tenant-context';
import { DetectedAnomaly } from './anomaly-detector';

export interface RecommendationWriterInput extends AgentInput {
  periodStart: string;
  periodEnd: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpm: number;
    roas: number;
  };
  previousMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
  };
  anomalies?: DetectedAnomaly[];
  funnelAnalysis?: any;
  budgetPlan?: any;
}

export interface Recommendation {
  executiveSummary: string;
  keyInsights: Array<{
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expectedOutcome: string;
  }>;
  channelRecommendations: {
    meta?: string;
    google?: string;
    blended?: string;
  };
}

export class RecommendationWriterAgent extends BaseAgent {
  constructor() {
    super({
      name: 'recommendation-writer-agent',
      role: 'Client-facing Performance Lead',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.4,
      maxTokens: 4096,
      systemPrompt: `You are a client-facing performance lead at a digital marketing agency.
Your role is to translate advertising performance data into clear, actionable recommendations.

Writing style guidelines:
1. Be concise and professional
2. Lead with insights, not data
3. Focus on business outcomes
4. Provide specific, actionable recommendations
5. Use positive framing when possible
6. Quantify impact where possible

Structure your recommendations to be presentation-ready for client meetings.`,
    });
  }

  async execute(input: RecommendationWriterInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      // Get tenant config for voice and KPIs
      const resolver = getTenantContextResolver();
      const config = await resolver.getTenantConfig(input.tenantId);

      const recommendation = await this.generateRecommendation(input, config);

      return {
        success: true,
        data: recommendation,
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

  private async generateRecommendation(input: RecommendationWriterInput, config: any): Promise<Recommendation> {
    const m = input.metrics;
    const prev = input.previousMetrics;

    // Calculate period-over-period changes
    const changes = prev ? {
      spend: ((m.spend - prev.spend) / prev.spend) * 100,
      conversions: ((m.conversions - prev.conversions) / prev.conversions) * 100,
      revenue: ((m.revenue - prev.revenue) / prev.revenue) * 100,
      roas: ((m.roas - prev.roas) / prev.roas) * 100,
    } : null;

    const prompt = `Generate a performance recommendation report for ${config.displayName || 'the client'}.

Period: ${input.periodStart} to ${input.periodEnd}

Current Performance:
- Spend: $${m.spend.toFixed(2)}
- Impressions: ${m.impressions.toLocaleString()}
- Clicks: ${m.clicks.toLocaleString()}
- CTR: ${m.ctr.toFixed(2)}%
- CPC: $${m.cpc.toFixed(2)}
- Conversions: ${m.conversions.toFixed(0)}
- Revenue: $${m.revenue.toFixed(2)}
- ROAS: ${m.roas.toFixed(2)}x

${changes ? `Period-over-Period Changes:
- Spend: ${changes.spend > 0 ? '+' : ''}${changes.spend.toFixed(1)}%
- Conversions: ${changes.conversions > 0 ? '+' : ''}${changes.conversions.toFixed(1)}%
- Revenue: ${changes.revenue > 0 ? '+' : ''}${changes.revenue.toFixed(1)}%
- ROAS: ${changes.roas > 0 ? '+' : ''}${changes.roas.toFixed(1)}%` : ''}

${input.anomalies && input.anomalies.length > 0 ? `
Detected Anomalies:
${input.anomalies.slice(0, 5).map((a) => `- ${a.campaignName}: ${a.metric} ${a.issueType} ${a.deltaPct.toFixed(1)}% (${a.severity})`).join('\n')}` : ''}

${input.funnelAnalysis?.bottleneck ? `
Funnel Bottleneck:
- Stage: ${input.funnelAnalysis.bottleneck.stage}
- Issue: ${input.funnelAnalysis.bottleneck.likelyCause}` : ''}

${input.budgetPlan ? `
Budget Status:
- Pacing: ${input.budgetPlan.pacingStatus} (${input.budgetPlan.pacingPct.toFixed(1)}%)
- Remaining: $${input.budgetPlan.remainingBudget.toFixed(2)} over ${input.budgetPlan.daysRemaining} days` : ''}

Client KPI Targets:
- Target ROAS: ${config.primaryKpis?.targetRoas || 3}x
- Target CPA: $${config.primaryKpis?.targetCpa || 50}

Brand Voice: ${config.brandVoice || 'professional'}

Generate the recommendation as JSON with this structure:
{
  "executiveSummary": "1-2 paragraph summary suitable for C-suite",
  "keyInsights": [
    {"title": "insight title", "description": "detail", "impact": "positive|negative|neutral"}
  ],
  "actionItems": [
    {"priority": "high|medium|low", "action": "specific action", "rationale": "why", "expectedOutcome": "result"}
  ],
  "channelRecommendations": {
    "meta": "Meta-specific recommendation",
    "google": "Google-specific recommendation",
    "blended": "Overall channel strategy"
  }
}

Limit to 3-5 key insights and 3-7 action items.`;

    const response = await this.callLLM(prompt);
    const parsed = this.parseJSON<Recommendation>(response);

    return parsed || {
      executiveSummary: 'Unable to generate summary',
      keyInsights: [],
      actionItems: [],
      channelRecommendations: {},
    };
  }
}

export function createRecommendationWriterAgent(): RecommendationWriterAgent {
  return new RecommendationWriterAgent();
}

export default RecommendationWriterAgent;
