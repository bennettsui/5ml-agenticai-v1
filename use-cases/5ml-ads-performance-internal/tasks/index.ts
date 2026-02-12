/**
 * Layer 5: Task Definitions
 * Reusable workflow templates for ads performance intelligence
 */

import { EventEmitter } from 'events';
import {
  createMetaDataFetcherAgent,
  createGoogleDataFetcherAgent,
  createNormalizerAgent,
  createAnomalyDetectorAgent,
  createFunnelAnalyzerAgent,
  createBudgetPlannerAgent,
  createRecommendationWriterAgent,
  createInternalStrategyAgent,
} from '../agents';
import { getDbExecutor } from '../execution/db-executor';
import { getTenantContextResolver } from '../execution/tenant-context';
import { getDatabase } from '../infrastructure/database';

// ===========================================
// Task Base Class
// ===========================================

export interface TaskInput {
  tenantId: string;
  [key: string]: any;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  errors?: string[];
  metadata?: {
    taskName: string;
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
  };
}

export interface TaskStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

export abstract class BaseTask extends EventEmitter {
  protected steps: TaskStep[] = [];
  protected startTime: number = 0;

  abstract get name(): string;
  abstract execute(input: TaskInput): Promise<TaskResult>;

  protected emitProgress(step: string, status: TaskStep['status'], data?: any): void {
    this.emit('progress', { step, status, data, timestamp: Date.now() });
  }

  protected async runStep<T>(
    stepName: string,
    fn: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    const step: TaskStep = { name: stepName, status: 'running' };
    this.steps.push(step);
    this.emitProgress(stepName, 'running');

    const stepStart = Date.now();

    try {
      const result = await fn();
      step.status = 'completed';
      step.result = result;
      step.duration = Date.now() - stepStart;
      this.emitProgress(stepName, 'completed', result);
      return { success: true, result };
    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      step.duration = Date.now() - stepStart;
      this.emitProgress(stepName, 'failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// ===========================================
// Daily Sync Task
// ===========================================

export interface DailySyncInput extends TaskInput {
  date?: string; // defaults to yesterday
  platforms?: ('meta' | 'google')[];
  syncDetails?: boolean;
}

export class DailySyncTask extends BaseTask {
  get name(): string {
    return 'DailySyncTask';
  }

  async execute(input: DailySyncInput): Promise<TaskResult> {
    this.startTime = Date.now();
    this.steps = [];
    const errors: string[] = [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = input.date || yesterday.toISOString().split('T')[0];
    const platforms = input.platforms || ['meta', 'google'];
    const syncDetails = input.syncDetails !== false;

    const dbExecutor = getDbExecutor();
    let totalUpserted = 0;

    // Step 1: Fetch Meta data
    if (platforms.includes('meta')) {
      const metaResult = await this.runStep('fetch-meta-insights', async () => {
        const agent = createMetaDataFetcherAgent();
        return agent.execute({
          tenantId: input.tenantId,
          since: targetDate,
          until: targetDate,
        });
      });

      if (metaResult.success && metaResult.result?.success) {
        const metrics = metaResult.result.data;
        const upsertResult = await this.runStep('upsert-meta-metrics', async () => {
          const count = await dbExecutor.saveDailyMetricsBatch(metrics, input.tenantId);
          await dbExecutor.cleanupCampaignLevelData(input.tenantId, 'meta', targetDate, targetDate);
          return count;
        });
        if (upsertResult.success) {
          totalUpserted += upsertResult.result || 0;
        }
      } else {
        errors.push(`Meta fetch failed: ${metaResult.error || metaResult.result?.error}`);
      }
    }

    // Step 2: Fetch Google data
    if (platforms.includes('google')) {
      const googleResult = await this.runStep('fetch-google-metrics', async () => {
        const agent = createGoogleDataFetcherAgent();
        return agent.execute({
          tenantId: input.tenantId,
          since: targetDate,
          until: targetDate,
        });
      });

      if (googleResult.success && googleResult.result?.success) {
        const metrics = googleResult.result.data;
        const upsertResult = await this.runStep('upsert-google-metrics', async () => {
          const count = await dbExecutor.saveDailyMetricsBatch(metrics, input.tenantId);
          await dbExecutor.cleanupCampaignLevelData(input.tenantId, 'google', targetDate, targetDate);
          return count;
        });
        if (upsertResult.success) {
          totalUpserted += upsertResult.result || 0;
        }
      } else {
        errors.push(`Google fetch failed: ${googleResult.error || googleResult.result?.error}`);
      }
    }

    const completedSteps = this.steps.filter((s) => s.status === 'completed').length;

    return {
      success: errors.length === 0,
      data: {
        date: targetDate,
        totalUpserted,
        platforms,
      },
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        taskName: this.name,
        duration: Date.now() - this.startTime,
        stepsCompleted: completedSteps,
        totalSteps: this.steps.length,
      },
    };
  }
}

// ===========================================
// Weekly Analysis Task
// ===========================================

export interface WeeklyAnalysisInput extends TaskInput {
  currentWeekStart: string;
  currentWeekEnd: string;
  previousWeekStart: string;
  previousWeekEnd: string;
  platform?: 'meta' | 'google' | 'all';
  monthlyBudget?: number;
}

export class WeeklyAnalysisTask extends BaseTask {
  get name(): string {
    return 'WeeklyAnalysisTask';
  }

  async execute(input: WeeklyAnalysisInput): Promise<TaskResult> {
    this.startTime = Date.now();
    this.steps = [];
    const errors: string[] = [];

    const platform = input.platform || 'all';

    // Step 1: Detect anomalies
    const anomalyResult = await this.runStep('detect-anomalies', async () => {
      const agent = createAnomalyDetectorAgent();
      return agent.execute({
        tenantId: input.tenantId,
        currentPeriod: { start: input.currentWeekStart, end: input.currentWeekEnd },
        previousPeriod: { start: input.previousWeekStart, end: input.previousWeekEnd },
        platform,
      });
    });

    // Step 2: Analyze funnel
    const funnelResult = await this.runStep('analyze-funnel', async () => {
      const agent = createFunnelAnalyzerAgent();
      return agent.execute({
        tenantId: input.tenantId,
        startDate: input.currentWeekStart,
        endDate: input.currentWeekEnd,
        platform,
      });
    });

    // Step 3: Budget planning (if budget provided)
    let budgetResult: any = null;
    if (input.monthlyBudget) {
      const budgetPlanResult = await this.runStep('plan-budget', async () => {
        const agent = createBudgetPlannerAgent();
        // Calculate month boundaries from current week
        const currentDate = new Date(input.currentWeekEnd);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        return agent.execute({
          tenantId: input.tenantId,
          monthlyBudget: input.monthlyBudget!,
          startDate: monthStart,
          endDate: monthEnd,
          currentDate: input.currentWeekEnd,
          platform,
        });
      });
      budgetResult = budgetPlanResult.result;
    }

    // Step 4: Get aggregated metrics for recommendation
    const dbExecutor = getDbExecutor();
    const [currentMetrics, previousMetrics] = await Promise.all([
      dbExecutor.getAggregatedMetrics(input.tenantId, platform, input.currentWeekStart, input.currentWeekEnd),
      dbExecutor.getAggregatedMetrics(input.tenantId, platform, input.previousWeekStart, input.previousWeekEnd),
    ]);

    // Step 5: Generate recommendations
    const recommendationResult = await this.runStep('generate-recommendations', async () => {
      const agent = createRecommendationWriterAgent();
      return agent.execute({
        tenantId: input.tenantId,
        periodStart: input.currentWeekStart,
        periodEnd: input.currentWeekEnd,
        metrics: {
          spend: parseFloat(currentMetrics.spend) || 0,
          impressions: parseInt(currentMetrics.impressions) || 0,
          clicks: parseInt(currentMetrics.clicks) || 0,
          conversions: parseFloat(currentMetrics.conversions) || 0,
          revenue: parseFloat(currentMetrics.revenue) || 0,
          ctr: parseFloat(currentMetrics.ctr) || 0,
          cpc: parseFloat(currentMetrics.cpc) || 0,
          cpm: parseFloat(currentMetrics.cpm) || 0,
          roas: parseFloat(currentMetrics.roas) || 0,
        },
        previousMetrics: {
          spend: parseFloat(previousMetrics.spend) || 0,
          impressions: parseInt(previousMetrics.impressions) || 0,
          clicks: parseInt(previousMetrics.clicks) || 0,
          conversions: parseFloat(previousMetrics.conversions) || 0,
          revenue: parseFloat(previousMetrics.revenue) || 0,
          roas: parseFloat(previousMetrics.roas) || 0,
        },
        anomalies: anomalyResult.result?.success ? anomalyResult.result.data.anomalies : [],
        funnelAnalysis: funnelResult.result?.success ? funnelResult.result.data : null,
        budgetPlan: budgetResult?.success ? budgetResult.data : null,
      });
    });

    // Store recommendation in database
    if (recommendationResult.success && recommendationResult.result?.success) {
      await this.runStep('store-recommendation', async () => {
        const db = getDatabase();
        await db.query(
          `INSERT INTO ads_recommendations
            (tenant_id, period_start, period_end, report_type, executive_summary, key_insights, action_items, raw_analysis, generated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            input.tenantId,
            input.currentWeekStart,
            input.currentWeekEnd,
            'weekly',
            recommendationResult.result.data.executiveSummary,
            JSON.stringify(recommendationResult.result.data.keyInsights),
            JSON.stringify(recommendationResult.result.data.actionItems),
            JSON.stringify({
              anomalies: anomalyResult.result?.data,
              funnel: funnelResult.result?.data,
              budget: budgetResult?.data,
            }),
            'recommendation-writer-agent',
          ]
        );
      });
    }

    const completedSteps = this.steps.filter((s) => s.status === 'completed').length;

    return {
      success: completedSteps === this.steps.length,
      data: {
        anomalies: anomalyResult.result?.success ? anomalyResult.result.data : null,
        funnel: funnelResult.result?.success ? funnelResult.result.data : null,
        budget: budgetResult?.success ? budgetResult.data : null,
        recommendation: recommendationResult.result?.success ? recommendationResult.result.data : null,
      },
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        taskName: this.name,
        duration: Date.now() - this.startTime,
        stepsCompleted: completedSteps,
        totalSteps: this.steps.length,
      },
    };
  }
}

// ===========================================
// Monthly Executive Summary Task
// ===========================================

export interface MonthlyExecutiveSummaryInput extends TaskInput {
  month: string; // YYYY-MM format
}

export class MonthlyExecutiveSummaryTask extends BaseTask {
  get name(): string {
    return 'MonthlyExecutiveSummaryTask';
  }

  async execute(input: MonthlyExecutiveSummaryInput): Promise<TaskResult> {
    this.startTime = Date.now();
    this.steps = [];

    // Parse month
    const [year, month] = input.month.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    // Previous month for comparison
    const prevMonthStart = new Date(year, month - 2, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(year, month - 1, 0).toISOString().split('T')[0];

    const dbExecutor = getDbExecutor();

    // Get metrics
    const [currentMetrics, previousMetrics] = await Promise.all([
      dbExecutor.getAggregatedMetrics(input.tenantId, 'all', monthStart, monthEnd),
      dbExecutor.getAggregatedMetrics(input.tenantId, 'all', prevMonthStart, prevMonthEnd),
    ]);

    // Generate executive summary
    const summaryResult = await this.runStep('generate-executive-summary', async () => {
      const agent = createRecommendationWriterAgent();
      return agent.execute({
        tenantId: input.tenantId,
        periodStart: monthStart,
        periodEnd: monthEnd,
        metrics: {
          spend: parseFloat(currentMetrics.spend) || 0,
          impressions: parseInt(currentMetrics.impressions) || 0,
          clicks: parseInt(currentMetrics.clicks) || 0,
          conversions: parseFloat(currentMetrics.conversions) || 0,
          revenue: parseFloat(currentMetrics.revenue) || 0,
          ctr: parseFloat(currentMetrics.ctr) || 0,
          cpc: parseFloat(currentMetrics.cpc) || 0,
          cpm: parseFloat(currentMetrics.cpm) || 0,
          roas: parseFloat(currentMetrics.roas) || 0,
        },
        previousMetrics: {
          spend: parseFloat(previousMetrics.spend) || 0,
          impressions: parseInt(previousMetrics.impressions) || 0,
          clicks: parseInt(previousMetrics.clicks) || 0,
          conversions: parseFloat(previousMetrics.conversions) || 0,
          revenue: parseFloat(previousMetrics.revenue) || 0,
          roas: parseFloat(previousMetrics.roas) || 0,
        },
      });
    });

    // Store in database
    if (summaryResult.success && summaryResult.result?.success) {
      await this.runStep('store-executive-summary', async () => {
        const db = getDatabase();
        await db.query(
          `INSERT INTO ads_recommendations
            (tenant_id, period_start, period_end, report_type, executive_summary, key_insights, action_items, raw_analysis, generated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            input.tenantId,
            monthStart,
            monthEnd,
            'monthly',
            summaryResult.result.data.executiveSummary,
            JSON.stringify(summaryResult.result.data.keyInsights),
            JSON.stringify(summaryResult.result.data.actionItems),
            JSON.stringify({ currentMetrics, previousMetrics }),
            'recommendation-writer-agent',
          ]
        );
      });
    }

    const completedSteps = this.steps.filter((s) => s.status === 'completed').length;

    return {
      success: completedSteps === this.steps.length,
      data: summaryResult.result?.success ? summaryResult.result.data : null,
      metadata: {
        taskName: this.name,
        duration: Date.now() - this.startTime,
        stepsCompleted: completedSteps,
        totalSteps: this.steps.length,
      },
    };
  }
}

// ===========================================
// Cross-Tenant Overview Task (Agency Level)
// ===========================================

export interface CrossTenantOverviewInput extends TaskInput {
  periodStart: string;
  periodEnd: string;
}

export class CrossTenantOverviewTask extends BaseTask {
  get name(): string {
    return 'CrossTenantOverviewTask';
  }

  async execute(input: CrossTenantOverviewInput): Promise<TaskResult> {
    this.startTime = Date.now();
    this.steps = [];

    // Run internal strategy agent
    const strategyResult = await this.runStep('generate-internal-strategy', async () => {
      const agent = createInternalStrategyAgent();
      return agent.execute({
        tenantId: '5ml-internal', // Always runs as internal
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      });
    });

    const completedSteps = this.steps.filter((s) => s.status === 'completed').length;

    return {
      success: strategyResult.success && strategyResult.result?.success,
      data: strategyResult.result?.success ? strategyResult.result.data : null,
      metadata: {
        taskName: this.name,
        duration: Date.now() - this.startTime,
        stepsCompleted: completedSteps,
        totalSteps: this.steps.length,
      },
    };
  }
}

// ===========================================
// Task Factory
// ===========================================

export type TaskType = 'daily-sync' | 'weekly-analysis' | 'monthly-summary' | 'cross-tenant-overview';

export function createTask(type: TaskType): BaseTask {
  switch (type) {
    case 'daily-sync':
      return new DailySyncTask();
    case 'weekly-analysis':
      return new WeeklyAnalysisTask();
    case 'monthly-summary':
      return new MonthlyExecutiveSummaryTask();
    case 'cross-tenant-overview':
      return new CrossTenantOverviewTask();
    default:
      throw new Error(`Unknown task type: ${type}`);
  }
}

export {
  DailySyncTask,
  WeeklyAnalysisTask,
  MonthlyExecutiveSummaryTask,
  CrossTenantOverviewTask,
};
