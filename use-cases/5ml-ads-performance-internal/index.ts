/**
 * 5 Miles Lab - Ads Performance Intelligence
 * 7-Layer Agentic Architecture for Multi-Tenant Ad Performance Analysis
 *
 * Architecture Overview:
 * =====================
 * Layer 1: Infrastructure    - Database (PostgreSQL) and Cache (Redis)
 * Layer 2: Execution Engine  - Tool executor, DB executor, Tenant context resolver
 * Layer 3: Agents            - 8 specialized AI agents for different tasks
 * Layer 4: Knowledge         - Metric definitions and industry benchmarks
 * Layer 5: Tasks             - Composable task definitions (daily sync, weekly, monthly)
 * Layer 6: Orchestration     - Scheduling and parallel execution with node-cron
 * Layer 7: Governance        - Tenant isolation, audit logging, compliance
 */

// ===========================================
// Layer 1: Infrastructure
// ===========================================
export {
  AdsDatabase,
  getDatabase,
  DatabaseConfig,
} from './infrastructure/database';

export {
  AdsCache,
  getCache,
  CacheConfig,
} from './infrastructure/cache';

// ===========================================
// Layer 2: Execution Engine
// ===========================================
export {
  ToolExecutor,
  getToolExecutor,
  ToolResult,
  ToolParams,
} from './execution/tool-executor';

export {
  DbExecutor,
  getDbExecutor,
  NormalizedMetric,
} from './execution/db-executor';

export {
  TenantContextResolver,
  getTenantContextResolver,
  TenantContext,
  TenantConfig,
  MetaCredentials,
  GoogleCredentials,
} from './execution/tenant-context';

// ===========================================
// Layer 3: Agents
// ===========================================
export {
  BaseAgent,
  AgentInput,
  AgentOutput,
} from './agents/base-agent';

export {
  MetaDataFetcherAgent,
  createMetaDataFetcherAgent,
} from './agents/meta-data-fetcher';

export {
  GoogleDataFetcherAgent,
  createGoogleDataFetcherAgent,
} from './agents/google-data-fetcher';

export {
  NormalizerAgent,
  createNormalizerAgent,
} from './agents/normalizer-agent';

export {
  AnomalyDetectorAgent,
  createAnomalyDetectorAgent,
} from './agents/anomaly-detector';

export {
  FunnelAnalyzerAgent,
  createFunnelAnalyzerAgent,
} from './agents/funnel-analyzer';

export {
  BudgetPlannerAgent,
  createBudgetPlannerAgent,
} from './agents/budget-planner';

export {
  RecommendationWriterAgent,
  createRecommendationWriterAgent,
} from './agents/recommendation-writer';

export {
  InternalStrategyAgent,
  createInternalStrategyAgent,
} from './agents/internal-strategy';

export {
  createAgent,
  getAgentTypes,
  AgentType,
  AgentRegistry,
} from './agents';

// ===========================================
// Layer 4: Knowledge Management
// ===========================================
export {
  KnowledgeManager,
  getKnowledgeManager,
  METRIC_DEFINITIONS,
  INDUSTRY_BENCHMARKS,
  MetricDefinition,
  IndustryBenchmark,
} from './knowledge';

// ===========================================
// Layer 5: Task Definitions
// ===========================================
export {
  BaseTask,
  TaskType,
  TaskResult,
  createTask,
  DailySyncTask,
  WeeklyAnalysisTask,
  MonthlyExecutiveSummaryTask,
  CrossTenantOverviewTask,
} from './tasks';

// ===========================================
// Layer 6: Orchestration
// ===========================================
export {
  AdsPerformanceOrchestrator,
  getOrchestrator,
  OrchestratorConfig,
} from './orchestration';

// ===========================================
// Layer 7: Governance
// ===========================================
export {
  logAudit,
  queryAuditLogs,
  getTenantPermissions,
  checkPermission,
  validateTenantAccess,
  applyRetentionPolicy,
  exportTenantData,
  deleteTenantData,
  canRolePerformAction,
  generateComplianceReport,
  AuditAction,
  AuditLogEntry,
  TenantPermissions,
  Role,
  ComplianceReport,
} from './governance';

// ===========================================
// Quick Start Functions
// ===========================================

/**
 * Initialize all infrastructure (database + cache)
 */
export async function initializeInfrastructure(): Promise<void> {
  const db = getDatabase();
  await db.connect();
  console.log('[AdsPerformance] Database initialized');

  const cache = getCache();
  await cache.connect();
  console.log('[AdsPerformance] Cache initialized');
}

/**
 * Start the orchestrator with default configuration
 */
export async function startOrchestrator(): Promise<AdsPerformanceOrchestrator> {
  const { AdsPerformanceOrchestrator: Orchestrator, getOrchestrator: getOrch } = await import('./orchestration');
  const orchestrator = getOrch();
  await orchestrator.start();
  return orchestrator;
}

/**
 * Run a one-time daily sync for a tenant
 */
export async function runDailySync(tenantId: string, date?: string): Promise<TaskResult> {
  const { DailySyncTask } = await import('./tasks');
  const task = new DailySyncTask();
  return task.execute({ tenantId, date });
}

/**
 * Run weekly analysis for a tenant
 */
export async function runWeeklyAnalysis(tenantId: string): Promise<TaskResult> {
  const orchestrator = getOrchestrator();
  return orchestrator.triggerWeeklyAnalysis(tenantId);
}

/**
 * Get health status of the system
 */
export function getSystemHealth(): {
  orchestrator: ReturnType<AdsPerformanceOrchestrator['getHealth']>;
} {
  const orchestrator = getOrchestrator();
  return {
    orchestrator: orchestrator.getHealth(),
  };
}
