/**
 * Layer 6: Orchestration & Workflow
 * Scheduling and parallel execution for ads performance tasks
 */

import { EventEmitter } from 'events';
import * as cron from 'node-cron';
import {
  createTask,
  TaskType,
  DailySyncTask,
  WeeklyAnalysisTask,
  MonthlyExecutiveSummaryTask,
  CrossTenantOverviewTask,
  TaskResult,
} from '../tasks';
import { getTenantContextResolver, TenantConfig } from '../execution/tenant-context';
import { getCache } from '../infrastructure/cache';
import { logAudit } from '../governance';

// ===========================================
// Orchestrator Configuration
// ===========================================

export interface OrchestratorConfig {
  timezone: string;
  schedules: {
    dailySyncTime: string;      // HH:MM format
    weeklyReportDay: string;    // monday, tuesday, etc.
    weeklyReportTime: string;   // HH:MM format
    monthlyReportDay: number;   // 1-28
    monthlyReportTime: string;  // HH:MM format
  };
  parallelization: {
    maxConcurrentTenants: number;
    maxConcurrentTasks: number;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  timezone: 'Asia/Hong_Kong',
  schedules: {
    dailySyncTime: '07:00',        // Before 8 AM HKT — sync yesterday's new data
    weeklyReportDay: 'monday',
    weeklyReportTime: '09:00',
    monthlyReportDay: 1,
    monthlyReportTime: '10:00',
  },
  parallelization: {
    maxConcurrentTenants: 5,
    maxConcurrentTasks: 10,
  },
  retryPolicy: {
    maxRetries: 3,
    retryDelayMs: 5000,
  },
};

// ===========================================
// Scheduled Job Tracking
// ===========================================

interface ScheduledJob {
  id: string;
  taskType: TaskType;
  tenantId: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: TaskResult;
  error?: string;
  retries: number;
}

// ===========================================
// Ads Performance Orchestrator
// ===========================================

export class AdsPerformanceOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private scheduledCronJobs: Map<string, cron.ScheduledTask> = new Map();
  private runningJobs: Map<string, ScheduledJob> = new Map();
  private jobHistory: ScheduledJob[] = [];
  private isRunning = false;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the orchestrator with all scheduled jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Orchestrator] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Orchestrator] Starting with config:', JSON.stringify(this.config.schedules));

    // Schedule daily sync for all tenants
    this.scheduleDailySync();

    // Schedule weekly reports
    this.scheduleWeeklyReports();

    // Schedule monthly reports
    this.scheduleMonthlyReports();

    // Schedule cross-tenant overview (internal only)
    this.scheduleCrossTenantOverview();

    this.emit('started');
    console.log('[Orchestrator] Started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    for (const [name, job] of this.scheduledCronJobs) {
      job.stop();
      console.log(`[Orchestrator] Stopped cron job: ${name}`);
    }
    this.scheduledCronJobs.clear();
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Schedule daily sync at configured time
   */
  private scheduleDailySync(): void {
    const [hour, minute] = this.config.schedules.dailySyncTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log('[Orchestrator] Running daily sync for all tenants');
        await this.runDailySyncAllTenants();
      },
      { timezone: this.config.timezone }
    );

    this.scheduledCronJobs.set('daily-sync', job);
    console.log(`[Orchestrator] Daily sync scheduled at ${this.config.schedules.dailySyncTime} ${this.config.timezone}`);
  }

  /**
   * Schedule weekly reports
   */
  private scheduleWeeklyReports(): void {
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    const dayNum = dayMap[this.config.schedules.weeklyReportDay.toLowerCase()] || 1;
    const [hour, minute] = this.config.schedules.weeklyReportTime.split(':');
    const cronExpression = `${minute} ${hour} * * ${dayNum}`;

    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log('[Orchestrator] Running weekly reports for all tenants');
        await this.runWeeklyReportsAllTenants();
      },
      { timezone: this.config.timezone }
    );

    this.scheduledCronJobs.set('weekly-reports', job);
    console.log(`[Orchestrator] Weekly reports scheduled for ${this.config.schedules.weeklyReportDay} at ${this.config.schedules.weeklyReportTime}`);
  }

  /**
   * Schedule monthly reports
   */
  private scheduleMonthlyReports(): void {
    const [hour, minute] = this.config.schedules.monthlyReportTime.split(':');
    const cronExpression = `${minute} ${hour} ${this.config.schedules.monthlyReportDay} * *`;

    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log('[Orchestrator] Running monthly reports for all tenants');
        await this.runMonthlyReportsAllTenants();
      },
      { timezone: this.config.timezone }
    );

    this.scheduledCronJobs.set('monthly-reports', job);
    console.log(`[Orchestrator] Monthly reports scheduled for day ${this.config.schedules.monthlyReportDay} at ${this.config.schedules.monthlyReportTime}`);
  }

  /**
   * Schedule cross-tenant overview (weekly, internal only)
   */
  private scheduleCrossTenantOverview(): void {
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    const dayNum = dayMap[this.config.schedules.weeklyReportDay.toLowerCase()] || 1;
    const [hour, minute] = this.config.schedules.weeklyReportTime.split(':');
    // Run 30 minutes after weekly reports
    const adjustedMinute = (parseInt(minute) + 30) % 60;
    const adjustedHour = parseInt(minute) + 30 >= 60 ? parseInt(hour) + 1 : parseInt(hour);
    const cronExpression = `${adjustedMinute} ${adjustedHour} * * ${dayNum}`;

    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log('[Orchestrator] Running cross-tenant overview');
        await this.runCrossTenantOverview();
      },
      { timezone: this.config.timezone }
    );

    this.scheduledCronJobs.set('cross-tenant-overview', job);
  }

  // ===========================================
  // Manual Triggers
  // ===========================================

  /**
   * Manually trigger daily sync for a specific tenant
   */
  async triggerDailySync(tenantId: string, date?: string): Promise<TaskResult> {
    const task = new DailySyncTask();
    const jobId = `daily-sync-${tenantId}-${Date.now()}`;

    const job: ScheduledJob = {
      id: jobId,
      taskType: 'daily-sync',
      tenantId,
      status: 'running',
      scheduledAt: new Date(),
      startedAt: new Date(),
      retries: 0,
    };

    this.runningJobs.set(jobId, job);
    this.emit('job_started', job);

    try {
      const result = await task.execute({ tenantId, date });
      job.status = result.success ? 'completed' : 'failed';
      job.completedAt = new Date();
      job.result = result;

      await logAudit(tenantId, 'daily_sync', 'ads_performance', tenantId, {
        date,
        success: result.success,
        duration: result.metadata?.duration,
      });

      this.emit('job_completed', job);
      return result;
    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      this.emit('job_failed', job);
      throw error;
    } finally {
      this.runningJobs.delete(jobId);
      this.jobHistory.push(job);
    }
  }

  /**
   * Manually trigger weekly analysis for a specific tenant
   */
  async triggerWeeklyAnalysis(tenantId: string, monthlyBudget?: number): Promise<TaskResult> {
    const task = new WeeklyAnalysisTask();

    // Calculate week boundaries
    const now = new Date();
    const currentWeekEnd = new Date(now);
    currentWeekEnd.setDate(now.getDate() - now.getDay()); // Last Sunday

    const currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekEnd.getDate() - 6);

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(currentWeekStart.getDate() - 1);

    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekEnd.getDate() - 6);

    const result = await task.execute({
      tenantId,
      currentWeekStart: currentWeekStart.toISOString().split('T')[0],
      currentWeekEnd: currentWeekEnd.toISOString().split('T')[0],
      previousWeekStart: previousWeekStart.toISOString().split('T')[0],
      previousWeekEnd: previousWeekEnd.toISOString().split('T')[0],
      monthlyBudget,
    });

    await logAudit(tenantId, 'weekly_analysis', 'ads_performance', tenantId, {
      success: result.success,
      duration: result.metadata?.duration,
    });

    return result;
  }

  /**
   * Manually trigger monthly summary for a specific tenant
   */
  async triggerMonthlySummary(tenantId: string, month?: string): Promise<TaskResult> {
    const task = new MonthlyExecutiveSummaryTask();

    // Default to previous month
    const now = new Date();
    const targetMonth = month || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    const result = await task.execute({ tenantId, month: targetMonth });

    await logAudit(tenantId, 'monthly_summary', 'ads_performance', tenantId, {
      month: targetMonth,
      success: result.success,
    });

    return result;
  }

  /**
   * Manually trigger cross-tenant overview
   */
  async triggerCrossTenantOverview(): Promise<TaskResult> {
    return this.runCrossTenantOverview();
  }

  // ===========================================
  // Batch Operations
  // ===========================================

  /**
   * Run daily sync for all tenants with credentials
   */
  async runDailySyncAllTenants(): Promise<Map<string, TaskResult>> {
    const resolver = getTenantContextResolver();
    const tenants = await resolver.listTenants();
    const results = new Map<string, TaskResult>();

    // Run in parallel with concurrency limit
    const chunks = this.chunkArray(tenants, this.config.parallelization.maxConcurrentTenants);

    for (const chunk of chunks) {
      const promises = chunk.map(async (tenant) => {
        try {
          const result = await this.triggerDailySync(tenant.tenantId);
          results.set(tenant.tenantId, result);
        } catch (error: any) {
          results.set(tenant.tenantId, {
            success: false,
            errors: [error.message],
            metadata: { taskName: 'DailySyncTask', duration: 0, stepsCompleted: 0, totalSteps: 0 },
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Run weekly reports for all tenants
   */
  async runWeeklyReportsAllTenants(): Promise<Map<string, TaskResult>> {
    const resolver = getTenantContextResolver();
    const tenants = await resolver.listTenants();
    const results = new Map<string, TaskResult>();

    const chunks = this.chunkArray(tenants, this.config.parallelization.maxConcurrentTenants);

    for (const chunk of chunks) {
      const promises = chunk.map(async (tenant) => {
        try {
          const result = await this.triggerWeeklyAnalysis(tenant.tenantId);
          results.set(tenant.tenantId, result);
        } catch (error: any) {
          results.set(tenant.tenantId, {
            success: false,
            errors: [error.message],
            metadata: { taskName: 'WeeklyAnalysisTask', duration: 0, stepsCompleted: 0, totalSteps: 0 },
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Run monthly reports for all tenants
   */
  async runMonthlyReportsAllTenants(): Promise<Map<string, TaskResult>> {
    const resolver = getTenantContextResolver();
    const tenants = await resolver.listTenants();
    const results = new Map<string, TaskResult>();

    const chunks = this.chunkArray(tenants, this.config.parallelization.maxConcurrentTenants);

    for (const chunk of chunks) {
      const promises = chunk.map(async (tenant) => {
        try {
          const result = await this.triggerMonthlySummary(tenant.tenantId);
          results.set(tenant.tenantId, result);
        } catch (error: any) {
          results.set(tenant.tenantId, {
            success: false,
            errors: [error.message],
            metadata: { taskName: 'MonthlyExecutiveSummaryTask', duration: 0, stepsCompleted: 0, totalSteps: 0 },
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Run cross-tenant overview (internal only)
   */
  private async runCrossTenantOverview(): Promise<TaskResult> {
    const task = new CrossTenantOverviewTask();

    // Last 7 days
    const now = new Date();
    const periodEnd = now.toISOString().split('T')[0];
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await task.execute({
      tenantId: '5ml-internal',
      periodStart,
      periodEnd,
    });

    await logAudit('5ml-internal', 'cross_tenant_overview', 'ads_performance', null, {
      periodStart,
      periodEnd,
      success: result.success,
    });

    return result;
  }

  // ===========================================
  // Health & Status
  // ===========================================

  /**
   * Get orchestrator health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'down';
    isRunning: boolean;
    scheduledJobs: string[];
    runningJobsCount: number;
    recentFailures: number;
    uptime: number;
  } {
    const recentJobs = this.jobHistory.filter(
      (j) => j.completedAt && Date.now() - j.completedAt.getTime() < 24 * 60 * 60 * 1000
    );
    const recentFailures = recentJobs.filter((j) => j.status === 'failed').length;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (!this.isRunning) {
      status = 'down';
    } else if (recentFailures > recentJobs.length * 0.3) {
      status = 'degraded';
    }

    return {
      status,
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledCronJobs.keys()),
      runningJobsCount: this.runningJobs.size,
      recentFailures,
      uptime: process.uptime(),
    };
  }

  /**
   * Get recent job history
   */
  getJobHistory(limit = 50): ScheduledJob[] {
    return this.jobHistory.slice(-limit);
  }

  // ===========================================
  // Utilities
  // ===========================================

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance
let orchestratorInstance: AdsPerformanceOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestratorConfig>): AdsPerformanceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AdsPerformanceOrchestrator(config);
  }
  return orchestratorInstance;
}

export default AdsPerformanceOrchestrator;
