/**
 * Layer 5: Workflow - Daily News Discovery Workflow
 * Daily workflow for scraping and analyzing news (runs at 06:00 HKT or manual)
 *
 * Nodes:
 * 1.1 - Initialize daily session
 * 1.2 - Query Notion for topic sources
 * 1.3 - Prepare scrape targets
 * 1.4 - Multi-source scraper (streaming)
 * 1.5 - News analyst agent (streaming)
 * 1.8A - Stream to UI (WebSocket)
 * 1.8B - Batch sync to Notion
 * 1.8C - Display summary
 * 1.9 - Log and monitor
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  MultiSourceScraperTool,
  createMultiSourceScraper,
  type Source,
  type ScrapedArticle,
  type ScrapeResult,
} from '../tools/multi-source-scraper';
import { NewsAnalystAgent, createNewsAnalystAgent, type AnalyzedArticle } from '../agents/news-analyst';
import { NotionTool } from '../tools/notion-tool';
import { TopicDatabaseInitializer } from '../scripts/init-topic-databases';

export interface DailyNewsInput {
  topicId: string;
  topicName: string;
  sources?: Source[];
  minImportanceScore?: number;
  maxArticlesPerSource?: number;
}

export interface DailyNewsOutput {
  success: boolean;
  sessionId: string;
  topicId: string;
  sourcesScanned: number;
  articlesFound: number;
  articlesAnalyzed: number;
  highImportanceCount: number;
  analyzedArticles: AnalyzedArticle[];
  failedSources: string[];
  error?: string;
  _meta: {
    workflowId: string;
    startedAt: string;
    completedAt?: string;
    duration?: number;
    nodes: NodeStatus[];
  };
}

export interface NodeStatus {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metrics?: Record<string, number | string>;
}

export interface ScanProgress {
  sourcesScanned: number;
  totalSources: number;
  articlesFound: number;
  articlesAnalyzed: number;
  highImportanceCount: number;
  currentSource?: string;
  status: 'scanning' | 'analyzing' | 'syncing' | 'complete' | 'failed';
}

export interface DailyNewsWorkflowEvents {
  node_started: (node: NodeStatus) => void;
  node_completed: (node: NodeStatus) => void;
  node_failed: (node: NodeStatus) => void;
  source_status_update: (data: { sourceId: string; sourceName: string; status: string; articlesFound?: number }) => void;
  article_scraped: (article: ScrapedArticle) => void;
  article_analyzed: (article: AnalyzedArticle) => void;
  progress_update: (progress: ScanProgress) => void;
  workflow_completed: (output: DailyNewsOutput) => void;
  workflow_failed: (error: string) => void;
}

const WORKFLOW_NODES = [
  { id: '1.1', name: 'Initialize Session', cantoneseName: '初始化日常會話' },
  { id: '1.2', name: 'Query Topic Sources', cantoneseName: '查詢 Topic Sources' },
  { id: '1.3', name: 'Prepare Scrape Targets', cantoneseName: '準備爬蟲目標' },
  { id: '1.4', name: 'Multi-Source Scraper', cantoneseName: '多源爬蟲工具' },
  { id: '1.5', name: 'News Analyst', cantoneseName: '新聞分析官' },
  { id: '1.8A', name: 'Stream to UI', cantoneseName: '串流到 UI' },
  { id: '1.8B', name: 'Batch Sync Notion', cantoneseName: '批量同步 Notion' },
  { id: '1.8C', name: 'Display Summary', cantoneseName: '展示摘要' },
  { id: '1.9', name: 'Log and Monitor', cantoneseName: '日誌及監控' },
];

export class DailyNewsDiscoveryWorkflow extends EventEmitter {
  private workflowName = 'DailyNewsDiscoveryWorkflow';
  private scraper: MultiSourceScraperTool;
  private newsAnalyst: NewsAnalystAgent;
  private notionTool: NotionTool;
  private dbInitializer: TopicDatabaseInitializer;

  // WebSocket broadcast callback (set by caller)
  private broadcastCallback?: (event: string, data: unknown) => void;

  constructor(options?: {
    scraper?: MultiSourceScraperTool;
    newsAnalyst?: NewsAnalystAgent;
    notionTool?: NotionTool;
    dbInitializer?: TopicDatabaseInitializer;
  }) {
    super();
    this.scraper = options?.scraper || createMultiSourceScraper({
      concurrentSources: 5,
      requestsPerMinute: 120,
      maxRetries: 3,
    });
    this.newsAnalyst = options?.newsAnalyst || createNewsAnalystAgent();
    this.notionTool = options?.notionTool || new NotionTool();
    this.dbInitializer = options?.dbInitializer || new TopicDatabaseInitializer(this.notionTool);

    // Wire up scraper events
    this.scraper.on('source_status_update', data => {
      this.emit('source_status_update', data);
      this.broadcast('source_status_update', data);
    });
    this.scraper.on('article_scraped', article => {
      this.emit('article_scraped', article);
    });

    // Wire up analyst events
    this.newsAnalyst.on('article_analyzed', article => {
      this.emit('article_analyzed', article);
      this.broadcast('article_analyzed', article);
    });
  }

  /**
   * Set WebSocket broadcast callback
   */
  setBroadcastCallback(callback: (event: string, data: unknown) => void): void {
    this.broadcastCallback = callback;
  }

  /**
   * Broadcast event via WebSocket
   */
  private broadcast(event: string, data: unknown): void {
    if (this.broadcastCallback) {
      this.broadcastCallback(event, data);
    }
  }

  /**
   * Execute the daily workflow
   */
  async execute(input: DailyNewsInput): Promise<DailyNewsOutput> {
    const workflowId = uuidv4();
    const startedAt = new Date().toISOString();

    const context = {
      workflowId,
      sessionId: `daily-${input.topicId}-${Date.now()}`,
      nodes: WORKFLOW_NODES.map(n => ({
        nodeId: n.id,
        nodeName: n.name,
        status: 'pending' as const,
      })),
      sources: [] as Source[],
      scrapedArticles: [] as ScrapedArticle[],
      analyzedArticles: [] as AnalyzedArticle[],
      failedSources: [] as string[],
      progress: {
        sourcesScanned: 0,
        totalSources: 0,
        articlesFound: 0,
        articlesAnalyzed: 0,
        highImportanceCount: 0,
        status: 'scanning' as const,
      } as ScanProgress,
    };

    console.log(`[${this.workflowName}] Starting workflow ${workflowId} for topic ${input.topicId}`);

    try {
      // 1.1 Initialize session
      await this.executeNode('1.1', async () => {
        console.log(`[Node 1.1] Initializing session: ${context.sessionId}`);
        return { sessionId: context.sessionId };
      }, context);

      // 1.2 Query sources
      await this.executeNode('1.2', async () => {
        console.log(`[Node 1.2] Querying sources for topic: ${input.topicId}`);

        if (input.sources && input.sources.length > 0) {
          context.sources = input.sources;
        } else {
          // Query from Notion
          const sourcesDb = process.env.NOTION_TOPIC_SOURCES_DB;
          if (sourcesDb) {
            const result = await this.notionTool.queryDatabase(sourcesDb, {
              filter: {
                and: [
                  { property: 'Status', select: { equals: 'Active' } },
                  // Would need Topic relation filter here
                ],
              },
            });

            context.sources = result.pages.map(page => ({
              sourceId: page.id,
              name: String(this.notionTool.extractPropertyValue(page.properties['Source Name'])),
              primaryUrl: String(this.notionTool.extractPropertyValue(page.properties['Primary URL'])),
              contentTypes: (this.notionTool.extractPropertyValue(page.properties['Content Types']) as string[]) || ['articles'],
            }));
          }
        }

        context.progress.totalSources = context.sources.length;
        return { sourcesCount: context.sources.length };
      }, context);

      // 1.3 Prepare targets
      await this.executeNode('1.3', async () => {
        console.log(`[Node 1.3] Preparing ${context.sources.length} scrape targets`);
        const activeUrls = context.sources
          .filter(s => s.primaryUrl)
          .map(s => s.primaryUrl);
        return { urlCount: activeUrls.length };
      }, context);

      // 1.4 Multi-source scraper (streaming)
      await this.executeNode('1.4', async () => {
        console.log(`[Node 1.4] Starting multi-source scraper`);

        const results = await this.scraper.scrapeAllSources(
          context.sources,
          input.maxArticlesPerSource || 5
        );

        for (const result of results) {
          if (result.status === 'failed') {
            context.failedSources.push(result.sourceName);
          } else {
            context.scrapedArticles.push(...result.articles);
          }
          context.progress.sourcesScanned++;
          context.progress.articlesFound = context.scrapedArticles.length;
          this.emitProgress(context.progress);
        }

        return {
          scrapedCount: context.scrapedArticles.length,
          failedCount: context.failedSources.length,
        };
      }, context);

      // 1.5 News analyst (streaming)
      context.progress.status = 'analyzing';
      this.emitProgress(context.progress);

      await this.executeNode('1.5', async () => {
        console.log(`[Node 1.5] Analyzing ${context.scrapedArticles.length} articles`);

        const result = await this.newsAnalyst.analyzeArticles({
          articles: context.scrapedArticles,
          topicName: input.topicName,
          minImportanceScore: input.minImportanceScore || 60,
        });

        context.analyzedArticles = result.analyzedArticles;
        context.progress.articlesAnalyzed = result.analyzedArticles.length;
        context.progress.highImportanceCount = result.highImportanceCount;
        this.emitProgress(context.progress);

        return {
          analyzedCount: result.analyzedArticles.length,
          highImportanceCount: result.highImportanceCount,
        };
      }, context);

      // 1.8A Stream to UI (already done via events)
      await this.executeNode('1.8A', async () => {
        console.log(`[Node 1.8A] Streaming complete`);
        return { streamed: true };
      }, context);

      // 1.8B Batch sync to Notion
      context.progress.status = 'syncing';
      this.emitProgress(context.progress);

      await this.executeNode('1.8B', async () => {
        console.log(`[Node 1.8B] Syncing ${context.analyzedArticles.length} articles to Notion`);

        const newsDb = process.env.NOTION_DAILY_NEWS_DB;
        const topicPageId = input.topicId;

        if (!newsDb) {
          console.log(`[Node 1.8B] Notion database not configured, skipping sync`);
          return { synced: 0 };
        }

        let synced = 0;
        for (const article of context.analyzedArticles) {
          try {
            await this.dbInitializer.addDailyNewsArticle(newsDb, topicPageId, {
              title: article.title,
              sourceName: article.source_name,
              sourceUrl: article.source_url,
              contentSummary: article.content_summary,
              publishedDate: article.published_at,
              importanceScore: article.importance_score,
              keyInsights: article.key_insights,
              actionItems: article.action_items,
              tags: article.tags,
              scoreBreakdown: article.score_breakdown,
            });
            synced++;
          } catch (error) {
            console.error(`[Node 1.8B] Failed to sync article: ${article.title}`, error);
          }
        }

        return { synced };
      }, context);

      // 1.8C Display summary
      await this.executeNode('1.8C', async () => {
        console.log(`[Node 1.8C] Displaying summary`);
        context.progress.status = 'complete';
        this.emitProgress(context.progress);
        return { displayed: true };
      }, context);

      // 1.9 Log and monitor
      await this.executeNode('1.9', async () => {
        console.log(`[Node 1.9] Logging workflow completion`);
        return {
          sourcesScanned: context.progress.sourcesScanned,
          articlesFound: context.progress.articlesFound,
          articlesAnalyzed: context.progress.articlesAnalyzed,
          highImportanceCount: context.progress.highImportanceCount,
        };
      }, context);

      const completedAt = new Date().toISOString();
      const output: DailyNewsOutput = {
        success: true,
        sessionId: context.sessionId,
        topicId: input.topicId,
        sourcesScanned: context.progress.sourcesScanned,
        articlesFound: context.progress.articlesFound,
        articlesAnalyzed: context.progress.articlesAnalyzed,
        highImportanceCount: context.progress.highImportanceCount,
        analyzedArticles: context.analyzedArticles,
        failedSources: context.failedSources,
        _meta: {
          workflowId,
          startedAt,
          completedAt,
          duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
          nodes: context.nodes,
        },
      };

      this.emit('workflow_completed', output);
      this.broadcast('scan_complete', output);
      console.log(`[${this.workflowName}] Workflow completed successfully`);

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.progress.status = 'failed';
      this.emitProgress(context.progress);

      console.error(`[${this.workflowName}] Workflow failed:`, errorMessage);
      this.emit('workflow_failed', errorMessage);
      this.broadcast('error_occurred', { message: errorMessage });

      return {
        success: false,
        sessionId: context.sessionId,
        topicId: input.topicId,
        sourcesScanned: context.progress.sourcesScanned,
        articlesFound: context.progress.articlesFound,
        articlesAnalyzed: context.progress.articlesAnalyzed,
        highImportanceCount: context.progress.highImportanceCount,
        analyzedArticles: context.analyzedArticles,
        failedSources: context.failedSources,
        error: errorMessage,
        _meta: {
          workflowId,
          startedAt,
          completedAt: new Date().toISOString(),
          nodes: context.nodes,
        },
      };
    }
  }

  /**
   * Execute a node
   */
  private async executeNode(
    nodeId: string,
    handler: () => Promise<Record<string, unknown>>,
    context: { nodes: NodeStatus[] }
  ): Promise<void> {
    const node = context.nodes.find(n => n.nodeId === nodeId);
    if (!node) return;

    node.status = 'running';
    node.startedAt = new Date().toISOString();
    this.emit('node_started', node);

    try {
      const result = await handler();
      node.status = 'completed';
      node.completedAt = new Date().toISOString();
      node.metrics = result as Record<string, number | string>;
      this.emit('node_completed', node);
    } catch (error) {
      node.status = 'failed';
      node.completedAt = new Date().toISOString();
      node.error = error instanceof Error ? error.message : String(error);
      this.emit('node_failed', node);
      throw error;
    }
  }

  /**
   * Emit progress update
   */
  private emitProgress(progress: ScanProgress): void {
    this.emit('progress_update', { ...progress });
    this.broadcast('progress_update', progress);
  }
}

// Export factory function
export function createDailyNewsWorkflow(options?: {
  scraper?: MultiSourceScraperTool;
  newsAnalyst?: NewsAnalystAgent;
  notionTool?: NotionTool;
  dbInitializer?: TopicDatabaseInitializer;
}): DailyNewsDiscoveryWorkflow {
  return new DailyNewsDiscoveryWorkflow(options);
}

export default DailyNewsDiscoveryWorkflow;
