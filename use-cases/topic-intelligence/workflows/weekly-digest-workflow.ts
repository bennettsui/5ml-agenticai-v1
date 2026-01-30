/**
 * Layer 5: Workflow - Weekly News Digest Workflow
 * Weekly workflow for generating and sending newsletter (runs Monday 08:00 HKT or manual)
 *
 * Nodes:
 * 2.1 - Initialize weekly session
 * 2.2 - Query Notion for 7-day metadata
 * 2.3 - Fetch 7-day articles
 * 2.4 - Curate top 15 articles
 * 2.5 - NewsWriterAgent drafts HTML email
 * 2.6 - Validate HTML content
 * 2.7 - Send via Resend
 * 2.8 - Archive to Notion
 * 2.9 - Generate report and log
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { NewsWriterAgent, createNewsWriterAgent, type NewsWriterOutput } from '../agents/news-writer';
import { type AnalyzedArticle } from '../agents/news-analyst';
import { NotionTool } from '../tools/notion-tool';
import { ResendEmailTool, resendEmailTool, type BatchEmailResult } from '../tools/resend-email-tool';
import { TopicDatabaseInitializer } from '../scripts/init-topic-databases';

export interface WeeklyDigestInput {
  topicId: string;
  topicName: string;
  weekStart?: string; // ISO date, defaults to last Monday
  recipients: string[];
  articles?: AnalyzedArticle[]; // Optional: pass articles directly instead of querying
  dashboardUrl?: string;
}

export interface WeeklyDigestOutput {
  success: boolean;
  sessionId: string;
  topicId: string;
  weekStart: string;
  totalArticles: number;
  highImportanceCount: number;
  articlesIncluded: number;
  emailSubject: string;
  emailsSent: number;
  emailsFailed: number;
  error?: string;
  _meta: {
    workflowId: string;
    startedAt: string;
    completedAt?: string;
    duration?: number;
    nodes: NodeStatus[];
    htmlSizeKb?: number;
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

const WORKFLOW_NODES = [
  { id: '2.1', name: 'Initialize Session', cantoneseName: '初始化週訊會話' },
  { id: '2.2', name: 'Query Notion Metadata', cantoneseName: '查詢 Notion DBs' },
  { id: '2.3', name: 'Fetch 7-Day Articles', cantoneseName: '獲取 7 日文章' },
  { id: '2.4', name: 'Curate Top Stories', cantoneseName: '精選頂級新聞' },
  { id: '2.5', name: 'News Writer Agent', cantoneseName: '新聞編寫官' },
  { id: '2.6', name: 'Validate HTML', cantoneseName: '驗證 HTML' },
  { id: '2.7', name: 'Send via Resend', cantoneseName: '透過 Resend 發送' },
  { id: '2.8', name: 'Archive to Notion', cantoneseName: '存檔 Notion' },
  { id: '2.9', name: 'Generate Report', cantoneseName: '生成報告及日誌' },
];

export class WeeklyNewsDigestWorkflow extends EventEmitter {
  private workflowName = 'WeeklyNewsDigestWorkflow';
  private newsWriter: NewsWriterAgent;
  private notionTool: NotionTool;
  private emailTool: ResendEmailTool;
  private dbInitializer: TopicDatabaseInitializer;

  constructor(options?: {
    newsWriter?: NewsWriterAgent;
    notionTool?: NotionTool;
    emailTool?: ResendEmailTool;
    dbInitializer?: TopicDatabaseInitializer;
  }) {
    super();
    this.newsWriter = options?.newsWriter || createNewsWriterAgent();
    this.notionTool = options?.notionTool || new NotionTool();
    this.emailTool = options?.emailTool || resendEmailTool;
    this.dbInitializer = options?.dbInitializer || new TopicDatabaseInitializer(this.notionTool);
  }

  /**
   * Execute the weekly digest workflow
   */
  async execute(input: WeeklyDigestInput): Promise<WeeklyDigestOutput> {
    const workflowId = uuidv4();
    const startedAt = new Date().toISOString();

    // Calculate week start (last Monday)
    const weekStart = input.weekStart || this.getLastMonday();

    const context = {
      workflowId,
      sessionId: `weekly-${input.topicId}-${Date.now()}`,
      nodes: WORKFLOW_NODES.map(n => ({
        nodeId: n.id,
        nodeName: n.name,
        status: 'pending' as const,
      })),
      weekStart,
      articles: [] as AnalyzedArticle[],
      curatedArticles: [] as AnalyzedArticle[],
      newsletter: null as NewsWriterOutput | null,
      emailResult: null as BatchEmailResult | null,
      totalArticles: 0,
      highImportanceCount: 0,
    };

    console.log(`[${this.workflowName}] Starting workflow ${workflowId} for topic ${input.topicId}`);

    try {
      // 2.1 Initialize session
      await this.executeNode('2.1', async () => {
        console.log(`[Node 2.1] Initializing session: ${context.sessionId}`);
        return { sessionId: context.sessionId, weekStart };
      }, context);

      // 2.2 Query Notion metadata
      await this.executeNode('2.2', async () => {
        console.log(`[Node 2.2] Querying Notion for week metadata`);

        // This would query topic settings
        return { topicId: input.topicId, weekStart };
      }, context);

      // 2.3 Fetch 7-day articles
      await this.executeNode('2.3', async () => {
        console.log(`[Node 2.3] Fetching articles from ${weekStart}`);

        if (input.articles && input.articles.length > 0) {
          context.articles = input.articles;
        } else {
          // Query from Notion
          const newsDb = process.env.NOTION_DAILY_NEWS_DB;
          if (newsDb) {
            const sevenDaysAgo = new Date(weekStart);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const result = await this.notionTool.queryDatabase(newsDb, {
              filter: {
                and: [
                  {
                    property: 'Scraped Date',
                    date: { on_or_after: sevenDaysAgo.toISOString() },
                  },
                ],
              },
              sorts: [
                { property: 'Importance Score', direction: 'descending' },
              ],
              pageSize: 50,
            });

            context.articles = result.pages.map(page => ({
              article_id: page.id,
              title: String(this.notionTool.extractPropertyValue(page.properties['Title'])),
              source_name: String(this.notionTool.extractPropertyValue(page.properties['Source Name'])),
              source_url: String(this.notionTool.extractPropertyValue(page.properties['Source URL'])),
              published_at: String(this.notionTool.extractPropertyValue(page.properties['Published Date']) || ''),
              content_summary: String(this.notionTool.extractPropertyValue(page.properties['Content Summary'])),
              importance_score: Number(this.notionTool.extractPropertyValue(page.properties['Importance Score'])) || 50,
              score_breakdown: {
                relevance: 50,
                actionability: 50,
                authority: 50,
                timeliness: 50,
                originality: 50,
              },
              key_insights: String(this.notionTool.extractPropertyValue(page.properties['Key Insights']) || '').split('\n'),
              action_items: String(this.notionTool.extractPropertyValue(page.properties['Action Items']) || '').split('\n'),
              tags: (this.notionTool.extractPropertyValue(page.properties['Tags']) as string[]) || [],
            }));
          }
        }

        context.totalArticles = context.articles.length;
        context.highImportanceCount = context.articles.filter(a => a.importance_score >= 80).length;

        return {
          articlesFound: context.articles.length,
          highImportance: context.highImportanceCount,
        };
      }, context);

      // 2.4 Curate top 15
      await this.executeNode('2.4', async () => {
        console.log(`[Node 2.4] Curating top 15 articles`);

        // Sort by importance and take top 15
        context.curatedArticles = [...context.articles]
          .sort((a, b) => b.importance_score - a.importance_score)
          .slice(0, 15);

        return { curatedCount: context.curatedArticles.length };
      }, context);

      // 2.5 News Writer Agent
      await this.executeNode('2.5', async () => {
        console.log(`[Node 2.5] Generating newsletter with NewsWriterAgent`);

        try {
          context.newsletter = await this.newsWriter.generateDigest({
            topicId: input.topicId,
            topicName: input.topicName,
            articles: context.curatedArticles,
            weekDate: weekStart,
            totalArticlesThisWeek: context.totalArticles,
            highImportanceCount: context.highImportanceCount,
            recipientCount: input.recipients.length,
            dashboardUrl: input.dashboardUrl,
          });
        } catch (error) {
          console.warn(`[Node 2.5] LLM failed, using fallback template`);
          // Use fallback template
          const fallbackHtml = this.newsWriter.generateFallbackTemplate({
            topicId: input.topicId,
            topicName: input.topicName,
            articles: context.curatedArticles,
            weekDate: weekStart,
            totalArticlesThisWeek: context.totalArticles,
            highImportanceCount: context.highImportanceCount,
            dashboardUrl: input.dashboardUrl,
          });

          context.newsletter = {
            subject: `${input.topicName} Weekly Brief: ${this.formatWeekDate(weekStart)}`,
            previewText: `本週 ${input.topicName} 精選新聞`,
            htmlContent: fallbackHtml,
            articlesIncluded: context.curatedArticles.length,
            _meta: {
              model: 'fallback-template',
              generatedAt: new Date().toISOString(),
              htmlSizeKb: Math.round(Buffer.byteLength(fallbackHtml, 'utf8') / 1024 * 100) / 100,
            },
          };
        }

        return {
          subject: context.newsletter.subject,
          articlesIncluded: context.newsletter.articlesIncluded,
          htmlSizeKb: context.newsletter._meta.htmlSizeKb,
        };
      }, context);

      // 2.6 Validate HTML
      await this.executeNode('2.6', async () => {
        console.log(`[Node 2.6] Validating HTML content`);

        if (!context.newsletter?.htmlContent) {
          throw new Error('No HTML content generated');
        }

        const html = context.newsletter.htmlContent;
        const issues: string[] = [];

        // Basic validation
        if (!html.includes('<!DOCTYPE')) {
          issues.push('Missing DOCTYPE');
        }
        if (!html.includes('<html')) {
          issues.push('Missing html tag');
        }
        if (html.length > 100 * 1024) {
          issues.push('HTML too large (>100KB)');
        }

        return {
          valid: issues.length === 0,
          issues,
          sizeKb: Math.round(html.length / 1024 * 100) / 100,
        };
      }, context);

      // 2.7 Send via Resend
      await this.executeNode('2.7', async () => {
        console.log(`[Node 2.7] Sending to ${input.recipients.length} recipients`);

        if (!this.emailTool.isAvailable()) {
          console.warn(`[Node 2.7] Resend not configured, skipping email send`);
          return { sent: 0, failed: 0, skipped: true };
        }

        if (input.recipients.length === 0) {
          console.warn(`[Node 2.7] No recipients, skipping email send`);
          return { sent: 0, failed: 0, skipped: true };
        }

        // Validate emails
        const { valid, invalid } = this.emailTool.validateEmails(input.recipients);

        if (invalid.length > 0) {
          console.warn(`[Node 2.7] Invalid emails: ${invalid.join(', ')}`);
        }

        if (valid.length === 0) {
          return { sent: 0, failed: input.recipients.length, skipped: false };
        }

        context.emailResult = await this.emailTool.sendEDM(
          valid,
          context.newsletter!.subject,
          context.newsletter!.htmlContent,
          input.topicId
        );

        return {
          sent: context.emailResult.totalSent,
          failed: context.emailResult.totalFailed,
        };
      }, context);

      // 2.8 Archive to Notion
      await this.executeNode('2.8', async () => {
        console.log(`[Node 2.8] Archiving digest to Notion`);

        const digestDb = process.env.NOTION_WEEKLY_DIGEST_DB;
        if (!digestDb) {
          console.warn(`[Node 2.8] Notion database not configured, skipping archive`);
          return { archived: false };
        }

        try {
          await this.dbInitializer.addWeeklyDigest(digestDb, input.topicId, {
            weekStart,
            totalArticles: context.totalArticles,
            highImportanceCount: context.highImportanceCount,
            topStoriesCount: context.curatedArticles.length,
            emailSubject: context.newsletter!.subject,
            emailHtml: context.newsletter!.htmlContent,
            sentTo: input.recipients,
            status: context.emailResult?.totalSent ? 'Sent' : 'Draft',
          });

          return { archived: true };
        } catch (error) {
          console.error(`[Node 2.8] Failed to archive:`, error);
          return { archived: false, error: String(error) };
        }
      }, context);

      // 2.9 Generate report
      await this.executeNode('2.9', async () => {
        console.log(`[Node 2.9] Generating final report`);

        const report = {
          topicId: input.topicId,
          topicName: input.topicName,
          weekStart,
          totalArticles: context.totalArticles,
          highImportanceCount: context.highImportanceCount,
          articlesIncluded: context.curatedArticles.length,
          emailsSent: context.emailResult?.totalSent || 0,
          emailsFailed: context.emailResult?.totalFailed || 0,
          htmlSizeKb: context.newsletter?._meta.htmlSizeKb || 0,
        };

        console.log(`[Node 2.9] Report:`, JSON.stringify(report, null, 2));
        return report;
      }, context);

      const completedAt = new Date().toISOString();
      const output: WeeklyDigestOutput = {
        success: true,
        sessionId: context.sessionId,
        topicId: input.topicId,
        weekStart,
        totalArticles: context.totalArticles,
        highImportanceCount: context.highImportanceCount,
        articlesIncluded: context.curatedArticles.length,
        emailSubject: context.newsletter?.subject || '',
        emailsSent: context.emailResult?.totalSent || 0,
        emailsFailed: context.emailResult?.totalFailed || 0,
        _meta: {
          workflowId,
          startedAt,
          completedAt,
          duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
          nodes: context.nodes,
          htmlSizeKb: context.newsletter?._meta.htmlSizeKb,
        },
      };

      this.emit('workflow_completed', output);
      console.log(`[${this.workflowName}] Workflow completed successfully`);

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`[${this.workflowName}] Workflow failed:`, errorMessage);
      this.emit('workflow_failed', errorMessage);

      return {
        success: false,
        sessionId: context.sessionId,
        topicId: input.topicId,
        weekStart,
        totalArticles: context.totalArticles,
        highImportanceCount: context.highImportanceCount,
        articlesIncluded: 0,
        emailSubject: '',
        emailsSent: 0,
        emailsFailed: 0,
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
   * Get last Monday date
   */
  private getLastMonday(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  /**
   * Format week date
   */
  private formatWeekDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

// Export factory function
export function createWeeklyDigestWorkflow(options?: {
  newsWriter?: NewsWriterAgent;
  notionTool?: NotionTool;
  emailTool?: ResendEmailTool;
  dbInitializer?: TopicDatabaseInitializer;
}): WeeklyNewsDigestWorkflow {
  return new WeeklyNewsDigestWorkflow(options);
}

export default WeeklyNewsDigestWorkflow;
