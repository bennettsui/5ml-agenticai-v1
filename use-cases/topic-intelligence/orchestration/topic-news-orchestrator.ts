/**
 * Layer 6: Orchestration - Topic-Based News Orchestrator
 * 主題新聞策展指揮官 - Manages multi-topic news monitoring system
 *
 * Responsibilities:
 * - Multi-topic management
 * - Daily scheduling (06:00 HKT default)
 * - Weekly scheduling (Monday 08:00 HKT default)
 * - Manual trigger support
 * - Topic lifecycle management
 * - Health monitoring
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  SetupTopicAndSourcesWorkflow,
  createSetupTopicWorkflow,
  type SetupTopicInput,
  type SetupTopicOutput,
} from '../workflows/setup-topic-workflow';
import {
  DailyNewsDiscoveryWorkflow,
  createDailyNewsWorkflow,
  type DailyNewsInput,
  type DailyNewsOutput,
} from '../workflows/daily-news-workflow';
import {
  WeeklyNewsDigestWorkflow,
  createWeeklyDigestWorkflow,
  type WeeklyDigestInput,
  type WeeklyDigestOutput,
} from '../workflows/weekly-digest-workflow';
import { NotionTool } from '../tools/notion-tool';
import type { Source } from '../tools/multi-source-scraper';

export interface Topic {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  keywords: string[];
  sources: Source[];
  dailyScanConfig: {
    enabled: boolean;
    time: string; // "HH:MM"
    timezone: string;
  };
  weeklyDigestConfig: {
    enabled: boolean;
    day: string;
    time: string;
    timezone: string;
    recipientList: string[];
  };
  lastDailyScan?: string;
  nextDailyScan?: string;
  lastWeeklyDigest?: string;
  nextWeeklyDigest?: string;
}

export interface ScheduledJob {
  id: string;
  topicId: string;
  type: 'daily' | 'weekly';
  scheduledTime: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  timeout?: NodeJS.Timeout;
}

export interface HealthStatus {
  orchestratorStatus: 'healthy' | 'degraded' | 'down';
  activeTopics: number;
  topics: TopicHealth[];
  apiHealth: {
    notion: 'ok' | 'error' | 'unknown';
    resend: 'ok' | 'error' | 'unknown';
    internalLlm: 'ok' | 'error' | 'unknown';
  };
  failedJobs24h: number;
  uptime: number;
}

export interface TopicHealth {
  topicId: string;
  topicName: string;
  status: string;
  lastDailyScan?: string;
  nextDailyScan?: string;
  lastWeeklyDigest?: string;
  nextWeeklyDigest?: string;
}

export interface OrchestratorConfig {
  id: string;
  name: string;
  chineseName: string;
  cantoneseName: string;
  timeZone: string;
  defaultSchedules: {
    dailyScanTime: string;
    weeklyDigestDay: string;
    weeklyDigestTime: string;
  };
  apiRateLimits: {
    notion: { requestsPerSecond: number; burstSize: number };
    resend: { emailsPerMinute: number; burstSize: number };
    multiSourceScraper: { concurrentSources: number; requestsPerMinute: number };
  };
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  id: 'orchestrator-topic-news',
  name: 'TopicBasedNewsOrchestrator',
  chineseName: '主題新聞策展指揮官',
  cantoneseName: '主題新聞策展指揮官',
  timeZone: 'Asia/Hong_Kong',
  defaultSchedules: {
    dailyScanTime: '06:00',
    weeklyDigestDay: 'monday',
    weeklyDigestTime: '08:00',
  },
  apiRateLimits: {
    notion: { requestsPerSecond: 3, burstSize: 10 },
    resend: { emailsPerMinute: 60, burstSize: 100 },
    multiSourceScraper: { concurrentSources: 5, requestsPerMinute: 120 },
  },
};

export class TopicBasedNewsOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private topics: Map<string, Topic> = new Map();
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private runningJobs: Map<string, ScheduledJob> = new Map();
  private failedJobs: Array<{ jobId: string; topicId: string; time: Date; error: string }> = [];
  private startTime: Date;
  private notionTool: NotionTool;

  // Workflow factories
  private setupWorkflowFactory: () => SetupTopicAndSourcesWorkflow;
  private dailyWorkflowFactory: () => DailyNewsDiscoveryWorkflow;
  private weeklyWorkflowFactory: () => WeeklyNewsDigestWorkflow;

  // WebSocket broadcast callback
  private broadcastCallback?: (topicId: string, event: string, data: unknown) => void;

  constructor(
    config?: Partial<OrchestratorConfig>,
    options?: {
      notionTool?: NotionTool;
      setupWorkflowFactory?: () => SetupTopicAndSourcesWorkflow;
      dailyWorkflowFactory?: () => DailyNewsDiscoveryWorkflow;
      weeklyWorkflowFactory?: () => WeeklyNewsDigestWorkflow;
    }
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();
    this.notionTool = options?.notionTool || new NotionTool();
    this.setupWorkflowFactory = options?.setupWorkflowFactory || createSetupTopicWorkflow;
    this.dailyWorkflowFactory = options?.dailyWorkflowFactory || createDailyNewsWorkflow;
    this.weeklyWorkflowFactory = options?.weeklyWorkflowFactory || createWeeklyDigestWorkflow;
  }

  /**
   * Set WebSocket broadcast callback
   */
  setBroadcastCallback(callback: (topicId: string, event: string, data: unknown) => void): void {
    this.broadcastCallback = callback;
  }

  /**
   * Initialize orchestrator and load topics
   */
  async initialize(): Promise<void> {
    console.log(`[${this.config.name}] Initializing orchestrator...`);

    // Load active topics from Notion
    await this.loadTopicsFromNotion();

    // Schedule jobs for all active topics
    for (const [topicId, topic] of this.topics) {
      if (topic.status === 'active') {
        this.scheduleTopicJobs(topicId);
      }
    }

    console.log(`[${this.config.name}] Initialized with ${this.topics.size} topics`);
    this.emit('initialized', { topicsCount: this.topics.size });
  }

  /**
   * Load topics from Notion database
   */
  private async loadTopicsFromNotion(): Promise<void> {
    const topicsMasterDb = process.env.NOTION_TOPICS_MASTER_DB;
    const sourcesDb = process.env.NOTION_TOPIC_SOURCES_DB;

    if (!topicsMasterDb) {
      console.warn(`[${this.config.name}] Topics database not configured`);
      return;
    }

    try {
      const result = await this.notionTool.queryAllPages(topicsMasterDb);

      for (const page of result) {
        const status = String(
          this.notionTool.extractPropertyValue(page.properties['Status']) || 'active'
        ).toLowerCase();

        if (status === 'archived') continue;

        const topic: Topic = {
          id: page.id,
          name: String(this.notionTool.extractPropertyValue(page.properties['Topic Name'])),
          status: status as 'active' | 'paused',
          keywords: String(
            this.notionTool.extractPropertyValue(page.properties['Keywords']) || ''
          ).split(',').map(k => k.trim()).filter(Boolean),
          sources: [],
          dailyScanConfig: {
            enabled: status === 'active',
            time: String(
              this.notionTool.extractPropertyValue(page.properties['Daily Scan Time']) ||
                this.config.defaultSchedules.dailyScanTime
            ).replace(' HKT', ''),
            timezone: this.config.timeZone,
          },
          weeklyDigestConfig: {
            enabled: status === 'active',
            day: String(
              this.notionTool.extractPropertyValue(page.properties['Weekly Digest Day']) ||
                this.config.defaultSchedules.weeklyDigestDay
            ).toLowerCase(),
            time: String(
              this.notionTool.extractPropertyValue(page.properties['Weekly Digest Time']) ||
                this.config.defaultSchedules.weeklyDigestTime
            ).replace(' HKT', ''),
            timezone: this.config.timeZone,
            recipientList: [],
          },
          lastDailyScan: this.notionTool.extractPropertyValue(page.properties['Last Scan']) as string,
          lastWeeklyDigest: this.notionTool.extractPropertyValue(
            page.properties['Last Digest Sent']
          ) as string,
        };

        // Load sources for this topic if sources DB is configured
        if (sourcesDb) {
          topic.sources = await this.loadTopicSources(sourcesDb, page.id);
        }

        this.topics.set(page.id, topic);
      }
    } catch (error) {
      console.error(`[${this.config.name}] Failed to load topics:`, error);
    }
  }

  /**
   * Load sources for a topic
   */
  private async loadTopicSources(sourcesDb: string, topicId: string): Promise<Source[]> {
    try {
      const result = await this.notionTool.queryDatabase(sourcesDb, {
        filter: {
          property: 'Status',
          select: { equals: 'Active' },
        },
      });

      return result.pages.map(page => ({
        sourceId: page.id,
        name: String(this.notionTool.extractPropertyValue(page.properties['Source Name'])),
        primaryUrl: String(this.notionTool.extractPropertyValue(page.properties['Primary URL'])),
        contentTypes: (this.notionTool.extractPropertyValue(page.properties['Content Types']) as string[]) || ['articles'],
      }));
    } catch (error) {
      console.error(`[${this.config.name}] Failed to load sources for topic ${topicId}:`, error);
      return [];
    }
  }

  // ==================== Topic Management ====================

  /**
   * Setup a new topic (one-time workflow)
   */
  async setupTopic(input: SetupTopicInput): Promise<SetupTopicOutput> {
    console.log(`[${this.config.name}] Setting up new topic: ${input.topicName}`);

    const workflow = this.setupWorkflowFactory();
    const result = await workflow.execute(input);

    if (result.success && result.topicPageId) {
      // Add to managed topics
      const topic: Topic = {
        id: result.topicPageId,
        name: input.topicName,
        status: 'active',
        keywords: input.keywords || [],
        sources: result.sources?.map(s => ({
          sourceId: s.source_id,
          name: s.name,
          primaryUrl: s.primary_url,
          contentTypes: s.content_types,
        })) || [],
        dailyScanConfig: {
          enabled: true,
          time: input.dailyScanTime || this.config.defaultSchedules.dailyScanTime,
          timezone: this.config.timeZone,
        },
        weeklyDigestConfig: {
          enabled: true,
          day: input.weeklyDigestDay?.toLowerCase() || this.config.defaultSchedules.weeklyDigestDay,
          time: input.weeklyDigestTime || this.config.defaultSchedules.weeklyDigestTime,
          timezone: this.config.timeZone,
          recipientList: input.recipientEmails || [],
        },
      };

      this.topics.set(topic.id, topic);
      this.scheduleTopicJobs(topic.id);

      this.emit('topic_created', topic);
    }

    return result;
  }

  /**
   * Pause a topic
   */
  async pauseTopic(topicId: string): Promise<boolean> {
    const topic = this.topics.get(topicId);
    if (!topic) return false;

    topic.status = 'paused';
    this.cancelTopicJobs(topicId);

    console.log(`[${this.config.name}] Paused topic: ${topic.name}`);
    this.emit('topic_paused', { topicId, topicName: topic.name });

    return true;
  }

  /**
   * Resume a topic
   */
  async resumeTopic(topicId: string): Promise<boolean> {
    const topic = this.topics.get(topicId);
    if (!topic) return false;

    topic.status = 'active';
    this.scheduleTopicJobs(topicId);

    console.log(`[${this.config.name}] Resumed topic: ${topic.name}`);
    this.emit('topic_resumed', { topicId, topicName: topic.name });

    return true;
  }

  /**
   * Archive a topic
   */
  async archiveTopic(topicId: string): Promise<boolean> {
    const topic = this.topics.get(topicId);
    if (!topic) return false;

    topic.status = 'archived';
    this.cancelTopicJobs(topicId);
    this.topics.delete(topicId);

    console.log(`[${this.config.name}] Archived topic: ${topic.name}`);
    this.emit('topic_archived', { topicId, topicName: topic.name });

    return true;
  }

  /**
   * Update topic settings
   */
  async updateTopic(
    topicId: string,
    updates: {
      name?: string;
      keywords?: string[];
      dailyScanConfig?: {
        enabled: boolean;
        time: string;
        timezone?: string;
      };
      weeklyDigestConfig?: {
        enabled: boolean;
        day: string;
        time: string;
        timezone?: string;
        recipientList: string[];
      };
    }
  ): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    const topic = this.topics.get(topicId);
    if (!topic) {
      return { success: false, error: 'Topic not found' };
    }

    try {
      // Update topic fields
      if (updates.name !== undefined) {
        topic.name = updates.name;
      }

      if (updates.keywords !== undefined) {
        topic.keywords = updates.keywords;
      }

      if (updates.dailyScanConfig !== undefined) {
        topic.dailyScanConfig = {
          enabled: updates.dailyScanConfig.enabled,
          time: updates.dailyScanConfig.time,
          timezone: updates.dailyScanConfig.timezone || this.config.timeZone,
        };
      }

      if (updates.weeklyDigestConfig !== undefined) {
        topic.weeklyDigestConfig = {
          enabled: updates.weeklyDigestConfig.enabled,
          day: updates.weeklyDigestConfig.day,
          time: updates.weeklyDigestConfig.time,
          timezone: updates.weeklyDigestConfig.timezone || this.config.timeZone,
          recipientList: updates.weeklyDigestConfig.recipientList,
        };
      }

      // Update in Notion if database is configured
      const topicsMasterDb = process.env.NOTION_TOPICS_MASTER_DB;
      if (topicsMasterDb) {
        await this.notionTool.updatePage(topicId, {
          'Topic Name': { title: [{ text: { content: topic.name } }] },
          'Keywords': { rich_text: [{ text: { content: topic.keywords.join(', ') } }] },
          'Daily Scan Time': { rich_text: [{ text: { content: `${topic.dailyScanConfig.time} HKT` } }] },
          'Weekly Digest Day': {
            select: { name: topic.weeklyDigestConfig.day.charAt(0).toUpperCase() + topic.weeklyDigestConfig.day.slice(1) },
          },
          'Weekly Digest Time': { rich_text: [{ text: { content: `${topic.weeklyDigestConfig.time} HKT` } }] },
          'Recipient Emails': { rich_text: [{ text: { content: topic.weeklyDigestConfig.recipientList.join(', ') } }] },
        });
      }

      // Reschedule jobs with new settings
      if (topic.status === 'active') {
        this.scheduleTopicJobs(topicId);
      }

      console.log(`[${this.config.name}] Updated topic: ${topic.name}`);
      this.emit('topic_updated', { topicId, topic });

      return { success: true, topic };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name}] Failed to update topic ${topicId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ==================== Manual Triggers ====================

  /**
   * Manually trigger daily scan for a topic
   */
  async triggerDailyScan(topicId: string): Promise<DailyNewsOutput> {
    const topic = this.topics.get(topicId);
    if (!topic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    console.log(`[${this.config.name}] Manual trigger: Daily scan for ${topic.name}`);

    const workflow = this.dailyWorkflowFactory();

    // Set broadcast callback for real-time updates
    if (this.broadcastCallback) {
      workflow.setBroadcastCallback((event, data) => {
        this.broadcastCallback!(topicId, event, data);
      });
    }

    const result = await workflow.execute({
      topicId: topic.id,
      topicName: topic.name,
      sources: topic.sources,
    });

    // Update last scan time
    if (result.success) {
      topic.lastDailyScan = new Date().toISOString();
    }

    this.emit('daily_scan_completed', { topicId, result });
    return result;
  }

  /**
   * Manually trigger weekly digest for a topic
   */
  async triggerWeeklyDigest(topicId: string): Promise<WeeklyDigestOutput> {
    const topic = this.topics.get(topicId);
    if (!topic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    console.log(`[${this.config.name}] Manual trigger: Weekly digest for ${topic.name}`);

    const workflow = this.weeklyWorkflowFactory();
    const result = await workflow.execute({
      topicId: topic.id,
      topicName: topic.name,
      recipients: topic.weeklyDigestConfig.recipientList,
    });

    // Update last digest time
    if (result.success) {
      topic.lastWeeklyDigest = new Date().toISOString();
    }

    this.emit('weekly_digest_completed', { topicId, result });
    return result;
  }

  // ==================== Scheduling ====================

  /**
   * Schedule jobs for a topic
   */
  private scheduleTopicJobs(topicId: string): void {
    const topic = this.topics.get(topicId);
    if (!topic || topic.status !== 'active') return;

    // Cancel existing jobs
    this.cancelTopicJobs(topicId);

    // Schedule daily scan
    if (topic.dailyScanConfig.enabled) {
      const nextDaily = this.calculateNextRunTime(
        topic.dailyScanConfig.time,
        topic.dailyScanConfig.timezone
      );
      this.scheduleJob(topicId, 'daily', nextDaily);
      topic.nextDailyScan = nextDaily.toISOString();
    }

    // Schedule weekly digest
    if (topic.weeklyDigestConfig.enabled) {
      const nextWeekly = this.calculateNextWeeklyRunTime(
        topic.weeklyDigestConfig.day,
        topic.weeklyDigestConfig.time,
        topic.weeklyDigestConfig.timezone
      );
      this.scheduleJob(topicId, 'weekly', nextWeekly);
      topic.nextWeeklyDigest = nextWeekly.toISOString();
    }

    console.log(
      `[${this.config.name}] Scheduled jobs for ${topic.name}: ` +
        `Daily=${topic.nextDailyScan}, Weekly=${topic.nextWeeklyDigest}`
    );
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(topicId: string, type: 'daily' | 'weekly', scheduledTime: Date): void {
    const jobId = `${topicId}-${type}-${Date.now()}`;
    const delay = scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      // Run immediately if time has passed
      this.executeJob(jobId, topicId, type);
      return;
    }

    const timeout = setTimeout(() => {
      this.executeJob(jobId, topicId, type);
    }, delay);

    const job: ScheduledJob = {
      id: jobId,
      topicId,
      type,
      scheduledTime,
      status: 'scheduled',
      timeout,
    };

    this.scheduledJobs.set(jobId, job);
  }

  /**
   * Execute a scheduled job
   */
  private async executeJob(jobId: string, topicId: string, type: 'daily' | 'weekly'): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.status = 'running';
      this.runningJobs.set(jobId, job);
      this.scheduledJobs.delete(jobId);
    }

    try {
      if (type === 'daily') {
        await this.triggerDailyScan(topicId);
      } else {
        await this.triggerWeeklyDigest(topicId);
      }

      if (job) job.status = 'completed';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (job) job.status = 'failed';
      this.failedJobs.push({
        jobId,
        topicId,
        time: new Date(),
        error: errorMessage,
      });

      // Clean old failed jobs (keep last 24h)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.failedJobs = this.failedJobs.filter(j => j.time.getTime() > cutoff);

      console.error(
        `[${this.config.name}] Job ${type} failed for topic ${topicId}:`,
        errorMessage
      );
    } finally {
      this.runningJobs.delete(jobId);

      // Reschedule for next run
      this.scheduleTopicJobs(topicId);
    }
  }

  /**
   * Cancel jobs for a topic
   */
  private cancelTopicJobs(topicId: string): void {
    for (const [jobId, job] of this.scheduledJobs) {
      if (job.topicId === topicId && job.timeout) {
        clearTimeout(job.timeout);
        this.scheduledJobs.delete(jobId);
      }
    }
  }

  /**
   * Calculate next daily run time
   */
  private calculateNextRunTime(time: string, _timezone: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date();

    next.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Calculate next weekly run time
   */
  private calculateNextWeeklyRunTime(day: string, time: string, _timezone: string): Date {
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDay = dayMap[day.toLowerCase()] ?? 1;
    const [hours, minutes] = time.split(':').map(Number);

    const now = new Date();
    const next = new Date();

    next.setHours(hours, minutes, 0, 0);

    // Calculate days until target day
    const currentDay = now.getDay();
    let daysUntil = targetDay - currentDay;

    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
      daysUntil += 7;
    }

    next.setDate(next.getDate() + daysUntil);

    return next;
  }

  // ==================== Health & Monitoring ====================

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    const topics: TopicHealth[] = [];

    for (const [id, topic] of this.topics) {
      topics.push({
        topicId: id,
        topicName: topic.name,
        status: topic.status,
        lastDailyScan: topic.lastDailyScan,
        nextDailyScan: topic.nextDailyScan,
        lastWeeklyDigest: topic.lastWeeklyDigest,
        nextWeeklyDigest: topic.nextWeeklyDigest,
      });
    }

    const failedLast24h = this.failedJobs.filter(
      j => j.time.getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (failedLast24h > 5) status = 'degraded';
    if (this.topics.size === 0 && this.runningJobs.size === 0) status = 'down';

    return {
      orchestratorStatus: status,
      activeTopics: Array.from(this.topics.values()).filter(t => t.status === 'active').length,
      topics,
      apiHealth: {
        notion: process.env.NOTION_API_KEY ? 'ok' : 'unknown',
        resend: process.env.RESEND_API_KEY ? 'ok' : 'unknown',
        internalLlm: process.env.INTERNAL_LLM_API_KEY ? 'ok' : 'unknown',
      },
      failedJobs24h: failedLast24h,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Get topic by ID
   */
  getTopic(topicId: string): Topic | undefined {
    return this.topics.get(topicId);
  }

  /**
   * Get all topics
   */
  getAllTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Get orchestrator config
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Shutdown orchestrator
   */
  shutdown(): void {
    console.log(`[${this.config.name}] Shutting down...`);

    // Cancel all scheduled jobs
    for (const [, job] of this.scheduledJobs) {
      if (job.timeout) {
        clearTimeout(job.timeout);
      }
    }

    this.scheduledJobs.clear();
    this.emit('shutdown');
  }
}

// Export factory function
export function createTopicNewsOrchestrator(
  config?: Partial<OrchestratorConfig>,
  options?: {
    notionTool?: NotionTool;
    setupWorkflowFactory?: () => SetupTopicAndSourcesWorkflow;
    dailyWorkflowFactory?: () => DailyNewsDiscoveryWorkflow;
    weeklyWorkflowFactory?: () => WeeklyNewsDigestWorkflow;
  }
): TopicBasedNewsOrchestrator {
  return new TopicBasedNewsOrchestrator(config, options);
}

export default TopicBasedNewsOrchestrator;
