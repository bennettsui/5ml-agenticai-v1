/**
 * Layer 3: Agent - Internal Strategy (5ML-only)
 * Agency-level strategist for cross-tenant insights
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getDbExecutor } from '../execution/db-executor';
import { getTenantContextResolver } from '../execution/tenant-context';

export interface InternalStrategyInput extends AgentInput {
  periodStart: string;
  periodEnd: string;
}

export interface TenantPerformance {
  tenantId: string;
  displayName: string;
  industry?: string;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  hitKpiTarget: boolean;
}

export interface CrossTenantInsight {
  category: string;
  insight: string;
  affectedTenants: string[];
  recommendation: string;
}

export interface InternalStrategyReport {
  summary: string;
  tenantPerformance: TenantPerformance[];
  topPerformers: TenantPerformance[];
  underperformers: TenantPerformance[];
  crossTenantInsights: CrossTenantInsight[];
  bestPractices: string[];
  systemicIssues: string[];
  agencyMetrics: {
    totalManagedSpend: number;
    averageRoas: number;
    clientsHittingKpis: number;
    totalClients: number;
  };
}

export class InternalStrategyAgent extends BaseAgent {
  constructor() {
    super({
      name: 'internal-strategy-agent',
      role: '5ML ECD / Strategy Voice',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.4,
      maxTokens: 4096,
      systemPrompt: `You are the internal strategist at 5 Miles Lab, a digital marketing agency.
Your role is to analyze performance across all client accounts and identify:
1. Recurring patterns and best practices
2. Systemic issues affecting multiple clients
3. Creative approaches that consistently outperform
4. Strategic opportunities for the agency

This analysis is for internal use only - be direct, analytical, and strategic.
Focus on insights that can improve agency operations and client outcomes.`,
    });
  }

  async execute(input: InternalStrategyInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const dbExecutor = getDbExecutor();
      const resolver = getTenantContextResolver();

      // Get all tenants
      const tenants = await resolver.listTenants();

      // Get performance for each tenant
      const tenantPerformance: TenantPerformance[] = [];

      for (const tenant of tenants) {
        const metrics = await dbExecutor.getAggregatedMetrics(
          tenant.tenantId,
          'all',
          input.periodStart,
          input.periodEnd
        );

        const spend = parseFloat(metrics.spend) || 0;
        const conversions = parseFloat(metrics.conversions) || 0;
        const revenue = parseFloat(metrics.revenue) || 0;
        const roas = parseFloat(metrics.roas) || 0;
        const cpa = conversions > 0 ? spend / conversions : 0;

        const targetRoas = tenant.primaryKpis?.targetRoas || 3;
        const hitKpiTarget = roas >= targetRoas;

        tenantPerformance.push({
          tenantId: tenant.tenantId,
          displayName: tenant.displayName,
          industry: tenant.industry,
          spend,
          conversions,
          revenue,
          roas,
          cpa,
          hitKpiTarget,
        });
      }

      // Sort by ROAS for top/bottom performers
      const sorted = [...tenantPerformance]
        .filter((t) => t.spend > 0)
        .sort((a, b) => b.roas - a.roas);

      const topPerformers = sorted.slice(0, 3);
      const underperformers = sorted.slice(-3).reverse();

      // Calculate agency-wide metrics
      const totalManagedSpend = tenantPerformance.reduce((sum, t) => sum + t.spend, 0);
      const totalRevenue = tenantPerformance.reduce((sum, t) => sum + t.revenue, 0);
      const averageRoas = totalManagedSpend > 0 ? totalRevenue / totalManagedSpend : 0;
      const clientsHittingKpis = tenantPerformance.filter((t) => t.hitKpiTarget).length;

      // Generate cross-tenant insights
      const insights = await this.generateInsights({
        tenantPerformance,
        topPerformers,
        underperformers,
        agencyMetrics: {
          totalManagedSpend,
          averageRoas,
          clientsHittingKpis,
          totalClients: tenantPerformance.length,
        },
      });

      return {
        success: true,
        data: {
          summary: insights.summary,
          tenantPerformance,
          topPerformers,
          underperformers,
          crossTenantInsights: insights.crossTenantInsights,
          bestPractices: insights.bestPractices,
          systemicIssues: insights.systemicIssues,
          agencyMetrics: {
            totalManagedSpend,
            averageRoas,
            clientsHittingKpis,
            totalClients: tenantPerformance.length,
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

  private async generateInsights(data: any): Promise<{
    summary: string;
    crossTenantInsights: CrossTenantInsight[];
    bestPractices: string[];
    systemicIssues: string[];
  }> {
    const prompt = `Analyze this cross-client performance data for 5 Miles Lab agency:

Agency Overview:
- Total Managed Spend: $${data.agencyMetrics.totalManagedSpend.toFixed(2)}
- Average ROAS: ${data.agencyMetrics.averageRoas.toFixed(2)}x
- Clients Hitting KPIs: ${data.agencyMetrics.clientsHittingKpis}/${data.agencyMetrics.totalClients}

Top Performers:
${data.topPerformers.map((t: TenantPerformance) => `- ${t.displayName} (${t.industry || 'N/A'}): ROAS ${t.roas.toFixed(2)}x, Spend $${t.spend.toFixed(2)}`).join('\n')}

Underperformers:
${data.underperformers.map((t: TenantPerformance) => `- ${t.displayName} (${t.industry || 'N/A'}): ROAS ${t.roas.toFixed(2)}x, CPA $${t.cpa.toFixed(2)}`).join('\n')}

All Clients:
${data.tenantPerformance.map((t: TenantPerformance) => `- ${t.displayName}: ROAS ${t.roas.toFixed(2)}x, ${t.hitKpiTarget ? 'HIT KPI' : 'MISSED KPI'}`).join('\n')}

Generate internal strategy insights as JSON:
{
  "summary": "2-3 sentence executive summary for agency leadership",
  "crossTenantInsights": [
    {
      "category": "Creative|Audience|Channel|Budget|Timing",
      "insight": "pattern observed across clients",
      "affectedTenants": ["tenant names"],
      "recommendation": "agency-wide action"
    }
  ],
  "bestPractices": ["practice that top performers are using"],
  "systemicIssues": ["issues affecting multiple clients"]
}

Focus on actionable insights that can be applied across the agency.`;

    try {
      const response = await this.callLLM(prompt);
      const parsed = this.parseJSON<{
        summary: string;
        crossTenantInsights: CrossTenantInsight[];
        bestPractices: string[];
        systemicIssues: string[];
      }>(response);

      return parsed || {
        summary: 'Unable to generate summary',
        crossTenantInsights: [],
        bestPractices: [],
        systemicIssues: [],
      };
    } catch {
      return {
        summary: 'Unable to generate summary',
        crossTenantInsights: [],
        bestPractices: [],
        systemicIssues: [],
      };
    }
  }
}

export function createInternalStrategyAgent(): InternalStrategyAgent {
  return new InternalStrategyAgent();
}

export default InternalStrategyAgent;
