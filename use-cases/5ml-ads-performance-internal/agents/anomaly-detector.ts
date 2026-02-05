/**
 * Layer 3: Agent - Anomaly Detector
 * Performance watchdog agent for detecting metric anomalies
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getDbExecutor } from '../execution/db-executor';
import { getKnowledgeManager } from '../knowledge';

export interface AnomalyDetectorInput extends AgentInput {
  currentPeriod: { start: string; end: string };
  previousPeriod: { start: string; end: string };
  platform?: 'meta' | 'google' | 'all';
}

export interface DetectedAnomaly {
  campaignId: string;
  campaignName: string;
  platform: 'meta' | 'google';
  metric: string;
  issueType: 'drop' | 'increase' | 'spike' | 'plateau';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  previousValue: number;
  deltaPct: number;
  explanation: string;
}

interface DetectionRule {
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  direction: 'drop' | 'increase' | 'both';
}

const DEFAULT_RULES: DetectionRule[] = [
  { metric: 'roas', threshold: -20, severity: 'high', direction: 'drop' },
  { metric: 'cpa', threshold: 25, severity: 'high', direction: 'increase' },
  { metric: 'ctr', threshold: -15, severity: 'medium', direction: 'drop' },
  { metric: 'cpc', threshold: 30, severity: 'medium', direction: 'increase' },
  { metric: 'spend', threshold: 50, severity: 'low', direction: 'both' },
  { metric: 'impressions', threshold: -30, severity: 'medium', direction: 'drop' },
  { metric: 'conversions', threshold: -25, severity: 'high', direction: 'drop' },
];

export class AnomalyDetectorAgent extends BaseAgent {
  private rules: DetectionRule[];

  constructor(customRules?: DetectionRule[]) {
    super({
      name: 'anomaly-detector-agent',
      role: 'Performance Watchdog',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      systemPrompt: `You are a performance watchdog specializing in advertising analytics.
Your role is to detect anomalies in ad performance metrics and explain their potential causes.
Focus on actionable insights that help advertisers understand what changed and why.

When explaining anomalies:
1. Be specific about the magnitude of change
2. Suggest possible causes (seasonality, competition, creative fatigue, audience saturation)
3. Recommend initial investigation steps`,
    });
    this.rules = customRules || DEFAULT_RULES;
  }

  async execute(input: AnomalyDetectorInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const dbExecutor = getDbExecutor();
      const platform = input.platform || 'all';

      // Get campaign-level metrics for both periods
      const [currentMetrics, previousMetrics] = await Promise.all([
        dbExecutor.getMetricsByCampaign(input.tenantId, platform, input.currentPeriod.start, input.currentPeriod.end),
        dbExecutor.getMetricsByCampaign(input.tenantId, platform, input.previousPeriod.start, input.previousPeriod.end),
      ]);

      // Build lookup for previous period
      const previousLookup = new Map<string, any>();
      for (const row of previousMetrics) {
        previousLookup.set(`${row.platform}:${row.campaign_id}`, row);
      }

      // Detect anomalies
      const anomalies: DetectedAnomaly[] = [];

      for (const current of currentMetrics) {
        const key = `${current.platform}:${current.campaign_id}`;
        const previous = previousLookup.get(key);

        if (!previous) continue; // New campaign, skip

        for (const rule of this.rules) {
          const anomaly = this.checkRule(current, previous, rule);
          if (anomaly) {
            anomalies.push(anomaly);
          }
        }
      }

      // Sort by severity and delta
      anomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return Math.abs(b.deltaPct) - Math.abs(a.deltaPct);
      });

      // If there are significant anomalies, get LLM explanations for top ones
      if (anomalies.length > 0) {
        const topAnomalies = anomalies.slice(0, 5);
        const explanations = await this.getExplanations(topAnomalies, input.tenantId);

        for (let i = 0; i < topAnomalies.length; i++) {
          if (explanations[i]) {
            topAnomalies[i].explanation = explanations[i];
          }
        }
      }

      return {
        success: true,
        data: {
          anomalies,
          summary: {
            total: anomalies.length,
            critical: anomalies.filter((a) => a.severity === 'critical').length,
            high: anomalies.filter((a) => a.severity === 'high').length,
            medium: anomalies.filter((a) => a.severity === 'medium').length,
            low: anomalies.filter((a) => a.severity === 'low').length,
          },
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

  private checkRule(current: any, previous: any, rule: DetectionRule): DetectedAnomaly | null {
    const currentVal = parseFloat(current[rule.metric]) || 0;
    const previousVal = parseFloat(previous[rule.metric]) || 0;

    if (previousVal === 0) return null;

    const deltaPct = ((currentVal - previousVal) / previousVal) * 100;

    let triggered = false;
    let issueType: DetectedAnomaly['issueType'] = 'drop';

    if (rule.direction === 'drop' && deltaPct <= rule.threshold) {
      triggered = true;
      issueType = 'drop';
    } else if (rule.direction === 'increase' && deltaPct >= rule.threshold) {
      triggered = true;
      issueType = 'increase';
    } else if (rule.direction === 'both' && Math.abs(deltaPct) >= Math.abs(rule.threshold)) {
      triggered = true;
      issueType = deltaPct > 0 ? 'spike' : 'drop';
    }

    if (!triggered) return null;

    return {
      campaignId: current.campaign_id,
      campaignName: current.campaign_name,
      platform: current.platform,
      metric: rule.metric,
      issueType,
      severity: rule.severity,
      currentValue: currentVal,
      previousValue: previousVal,
      deltaPct: Math.round(deltaPct * 100) / 100,
      explanation: `${rule.metric.toUpperCase()} ${issueType} of ${Math.abs(deltaPct).toFixed(1)}%`,
    };
  }

  private async getExplanations(anomalies: DetectedAnomaly[], tenantId: string): Promise<string[]> {
    const prompt = `Analyze these advertising performance anomalies and provide brief explanations for each:

${anomalies.map((a, i) => `${i + 1}. Campaign "${a.campaignName}" (${a.platform}):
   - Metric: ${a.metric}
   - Change: ${a.deltaPct > 0 ? '+' : ''}${a.deltaPct.toFixed(1)}%
   - From ${a.previousValue.toFixed(2)} to ${a.currentValue.toFixed(2)}
   - Severity: ${a.severity}`).join('\n\n')}

For each anomaly, provide:
1. A likely explanation (1-2 sentences)
2. Recommended action

Format your response as a JSON array of explanation strings.`;

    try {
      const response = await this.callLLM(prompt);
      const parsed = this.parseJSON<string[]>(response);
      return parsed || anomalies.map(() => 'Unable to generate explanation');
    } catch {
      return anomalies.map(() => 'Unable to generate explanation');
    }
  }
}

export function createAnomalyDetectorAgent(rules?: DetectionRule[]): AnomalyDetectorAgent {
  return new AnomalyDetectorAgent(rules);
}

export default AnomalyDetectorAgent;
