/**
 * Layer 3: Agent - Budget & Pacing Planner
 * Media planner for budget optimization and allocation
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { getDbExecutor } from '../execution/db-executor';

export interface BudgetPlannerInput extends AgentInput {
  monthlyBudget: number;
  startDate: string; // First day of budget period
  endDate: string;   // Last day of budget period
  currentDate?: string;
  platform?: 'meta' | 'google' | 'all';
}

export interface PlatformAllocation {
  platform: 'meta' | 'google';
  currentSpend: number;
  recommendedDailySpend: number;
  performanceScore: number;
  allocationPct: number;
}

export interface BudgetPlan {
  totalBudget: number;
  spentToDate: number;
  remainingBudget: number;
  daysElapsed: number;
  daysRemaining: number;
  plannedDailySpend: number;
  actualDailySpend: number;
  pacingStatus: 'under' | 'on-track' | 'over';
  pacingPct: number;
  platformAllocations: PlatformAllocation[];
  recommendations: string[];
}

export class BudgetPlannerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'budget-pacing-planner-agent',
      role: 'Media Planner / Optimizer',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      systemPrompt: `You are a media planner specializing in budget optimization across Meta and Google Ads.
Your role is to:
1. Track budget pacing against plan
2. Recommend daily spend adjustments
3. Suggest optimal allocation between platforms based on performance
4. Flag under/over-spending risks

Provide specific, actionable recommendations with percentages and dollar amounts.`,
    });
  }

  async execute(input: BudgetPlannerInput): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const dbExecutor = getDbExecutor();
      const platform = input.platform || 'all';
      const today = input.currentDate || new Date().toISOString().split('T')[0];

      // Calculate days
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const currentDate = new Date(today);

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysElapsed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysRemaining = Math.max(0, totalDays - daysElapsed);

      // Get current spend
      const metrics = await dbExecutor.getAggregatedMetrics(
        input.tenantId,
        platform,
        input.startDate,
        today
      );

      const spentToDate = parseFloat(metrics.spend) || 0;
      const remainingBudget = input.monthlyBudget - spentToDate;

      // Calculate pacing
      const plannedDailySpend = input.monthlyBudget / totalDays;
      const plannedSpendToDate = plannedDailySpend * daysElapsed;
      const actualDailySpend = daysElapsed > 0 ? spentToDate / daysElapsed : 0;
      const pacingPct = plannedSpendToDate > 0 ? (spentToDate / plannedSpendToDate) * 100 : 0;

      let pacingStatus: BudgetPlan['pacingStatus'] = 'on-track';
      if (pacingPct < 85) pacingStatus = 'under';
      else if (pacingPct > 115) pacingStatus = 'over';

      // Get platform-specific metrics
      const [metaMetrics, googleMetrics] = await Promise.all([
        dbExecutor.getAggregatedMetrics(input.tenantId, 'meta', input.startDate, today),
        dbExecutor.getAggregatedMetrics(input.tenantId, 'google', input.startDate, today),
      ]);

      const platformAllocations = this.calculateAllocations(metaMetrics, googleMetrics, remainingBudget, daysRemaining);

      // Get LLM recommendations
      const recommendations = await this.generateRecommendations({
        totalBudget: input.monthlyBudget,
        spentToDate,
        remainingBudget,
        daysElapsed,
        daysRemaining,
        plannedDailySpend,
        actualDailySpend,
        pacingStatus,
        pacingPct,
        platformAllocations,
      });

      return {
        success: true,
        data: {
          totalBudget: input.monthlyBudget,
          spentToDate,
          remainingBudget,
          daysElapsed,
          daysRemaining,
          plannedDailySpend,
          actualDailySpend,
          pacingStatus,
          pacingPct,
          platformAllocations,
          recommendations,
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

  private calculateAllocations(
    metaMetrics: any,
    googleMetrics: any,
    remainingBudget: number,
    daysRemaining: number
  ): PlatformAllocation[] {
    const metaSpend = parseFloat(metaMetrics.spend) || 0;
    const googleSpend = parseFloat(googleMetrics.spend) || 0;
    const totalSpend = metaSpend + googleSpend;

    // Calculate performance scores based on ROAS
    const metaRoas = parseFloat(metaMetrics.roas) || 0;
    const googleRoas = parseFloat(googleMetrics.roas) || 0;
    const totalRoas = metaRoas + googleRoas;

    // Default to 50/50 if no performance data
    let metaAllocationPct = 50;
    let googleAllocationPct = 50;

    if (totalRoas > 0) {
      // Allocate based on ROAS performance
      metaAllocationPct = (metaRoas / totalRoas) * 100;
      googleAllocationPct = (googleRoas / totalRoas) * 100;
    } else if (totalSpend > 0) {
      // Fall back to current allocation
      metaAllocationPct = (metaSpend / totalSpend) * 100;
      googleAllocationPct = (googleSpend / totalSpend) * 100;
    }

    const recommendedDailyTotal = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

    return [
      {
        platform: 'meta',
        currentSpend: metaSpend,
        recommendedDailySpend: recommendedDailyTotal * (metaAllocationPct / 100),
        performanceScore: metaRoas,
        allocationPct: Math.round(metaAllocationPct),
      },
      {
        platform: 'google',
        currentSpend: googleSpend,
        recommendedDailySpend: recommendedDailyTotal * (googleAllocationPct / 100),
        performanceScore: googleRoas,
        allocationPct: Math.round(googleAllocationPct),
      },
    ];
  }

  private async generateRecommendations(plan: Omit<BudgetPlan, 'recommendations'>): Promise<string[]> {
    const prompt = `Analyze this budget pacing situation and provide 3-5 specific recommendations:

Budget Overview:
- Total Budget: $${plan.totalBudget.toFixed(2)}
- Spent to Date: $${plan.spentToDate.toFixed(2)} (${((plan.spentToDate / plan.totalBudget) * 100).toFixed(1)}%)
- Remaining: $${plan.remainingBudget.toFixed(2)}
- Days Elapsed: ${plan.daysElapsed} / Days Remaining: ${plan.daysRemaining}

Pacing:
- Planned Daily Spend: $${plan.plannedDailySpend.toFixed(2)}
- Actual Daily Spend: $${plan.actualDailySpend.toFixed(2)}
- Pacing Status: ${plan.pacingStatus} (${plan.pacingPct.toFixed(1)}%)

Platform Performance:
${plan.platformAllocations.map((p) => `- ${p.platform.toUpperCase()}: Spent $${p.currentSpend.toFixed(2)}, ROAS ${p.performanceScore.toFixed(2)}, Recommended ${p.allocationPct}% allocation`).join('\n')}

Provide recommendations as a JSON array of strings. Focus on:
1. Whether to increase/decrease overall spend
2. How to reallocate between platforms
3. Specific daily budget targets
4. Risk flags if applicable`;

    try {
      const response = await this.callLLM(prompt);
      const parsed = this.parseJSON<string[]>(response);
      return parsed || ['Maintain current pacing and monitor performance'];
    } catch {
      return ['Maintain current pacing and monitor performance'];
    }
  }
}

export function createBudgetPlannerAgent(): BudgetPlannerAgent {
  return new BudgetPlannerAgent();
}

export default BudgetPlannerAgent;
