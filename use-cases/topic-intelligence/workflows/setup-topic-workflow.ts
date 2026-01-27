/**
 * Layer 5: Workflow - Setup Topic and Sources Workflow
 * One-time workflow for setting up a new topic with its sources
 *
 * Nodes:
 * S.1 - Receive user input (Topic Name, Keywords)
 * S.2 - Validate topic
 * S.3 - Generate keywords if not provided
 * S.4 - Activate SourceCuratorAgent to find 20 sources
 * S.5 - Validate URLs
 * S.6 - Display sources for user approval
 * S.7 - Save topic and sources to Notion
 * S.8 - Initialize Notion databases
 * S.9 - Schedule daily and weekly workflows
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SourceCuratorAgent, type CuratedSource } from '../agents/source-curator';
import { NotionTool } from '../tools/notion-tool';
import { InternalLLMTool } from '../tools/internal-llm-tool';
import { TopicDatabaseInitializer, type TopicDatabaseIds } from '../scripts/init-topic-databases';

export interface SetupTopicInput {
  topicName: string;
  keywords?: string[];
  createdBy?: string;
  dailyScanTime?: string;
  weeklyDigestDay?: string;
  weeklyDigestTime?: string;
  recipientEmails?: string[];
}

export interface SetupTopicOutput {
  success: boolean;
  topicId?: string;
  topicPageId?: string;
  sources?: CuratedSource[];
  databaseIds?: TopicDatabaseIds;
  error?: string;
  _meta: {
    workflowId: string;
    startedAt: string;
    completedAt?: string;
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
  output?: unknown;
}

export interface WorkflowEvents {
  node_started: (node: NodeStatus) => void;
  node_completed: (node: NodeStatus) => void;
  node_failed: (node: NodeStatus) => void;
  sources_discovered: (sources: CuratedSource[]) => void;
  sources_approved: (sources: CuratedSource[]) => void;
  workflow_completed: (output: SetupTopicOutput) => void;
  workflow_failed: (error: string) => void;
}

type NodeHandler = (
  input: SetupTopicInput,
  context: WorkflowContext
) => Promise<unknown>;

interface WorkflowContext {
  workflowId: string;
  nodes: NodeStatus[];
  generatedKeywords?: string[];
  discoveredSources?: CuratedSource[];
  validatedSources?: CuratedSource[];
  approvedSources?: CuratedSource[];
  topicPageId?: string;
  databaseIds?: TopicDatabaseIds;
}

const WORKFLOW_NODES: Array<{
  id: string;
  name: string;
  cantoneseName: string;
}> = [
  { id: 'S.1', name: 'Receive User Input', cantoneseName: '接收用戶輸入' },
  { id: 'S.2', name: 'Validate Topic', cantoneseName: '驗證主題' },
  { id: 'S.3', name: 'Generate Keywords', cantoneseName: '生成關鍵詞' },
  { id: 'S.4', name: 'Activate Source Curator', cantoneseName: '激活源頭策展官' },
  { id: 'S.5', name: 'Validate URLs', cantoneseName: '驗證 URLs' },
  { id: 'S.6', name: 'Display for Approval', cantoneseName: '展示供審批' },
  { id: 'S.7', name: 'Save to Notion', cantoneseName: '存儲到 Notion' },
  { id: 'S.8', name: 'Initialize Databases', cantoneseName: '初始化 DBs' },
  { id: 'S.9', name: 'Schedule Workflows', cantoneseName: '排程工作流' },
];

export class SetupTopicAndSourcesWorkflow extends EventEmitter {
  private workflowName = 'SetupTopicAndSourcesWorkflow';
  private sourceCurator: SourceCuratorAgent;
  private notionTool: NotionTool;
  private llmTool: InternalLLMTool;
  private dbInitializer: TopicDatabaseInitializer;

  // External approval callback (set by caller)
  private approvalCallback?: (sources: CuratedSource[]) => Promise<CuratedSource[]>;

  constructor(options?: {
    sourceCurator?: SourceCuratorAgent;
    notionTool?: NotionTool;
    llmTool?: InternalLLMTool;
    dbInitializer?: TopicDatabaseInitializer;
  }) {
    super();
    this.sourceCurator = options?.sourceCurator || new SourceCuratorAgent();
    this.notionTool = options?.notionTool || new NotionTool();
    this.llmTool = options?.llmTool || new InternalLLMTool();
    this.dbInitializer = options?.dbInitializer || new TopicDatabaseInitializer(this.notionTool);
  }

  /**
   * Set the approval callback for user source review
   */
  setApprovalCallback(
    callback: (sources: CuratedSource[]) => Promise<CuratedSource[]>
  ): void {
    this.approvalCallback = callback;
  }

  /**
   * Execute the workflow
   */
  async execute(input: SetupTopicInput): Promise<SetupTopicOutput> {
    const workflowId = uuidv4();
    const startedAt = new Date().toISOString();

    const context: WorkflowContext = {
      workflowId,
      nodes: WORKFLOW_NODES.map(n => ({
        nodeId: n.id,
        nodeName: n.name,
        status: 'pending' as const,
      })),
    };

    console.log(`[${this.workflowName}] Starting workflow ${workflowId}`);

    try {
      // Execute nodes sequentially
      await this.executeNode('S.1', this.nodeReceiveInput, input, context);
      await this.executeNode('S.2', this.nodeValidateTopic, input, context);
      await this.executeNode('S.3', this.nodeGenerateKeywords, input, context);
      await this.executeNode('S.4', this.nodeActivateCurator, input, context);
      await this.executeNode('S.5', this.nodeValidateUrls, input, context);
      await this.executeNode('S.6', this.nodeDisplayForApproval, input, context);
      await this.executeNode('S.7', this.nodeSaveToNotion, input, context);
      await this.executeNode('S.8', this.nodeInitializeDatabases, input, context);
      await this.executeNode('S.9', this.nodeScheduleWorkflows, input, context);

      const output: SetupTopicOutput = {
        success: true,
        topicId: workflowId,
        topicPageId: context.topicPageId,
        sources: context.approvedSources,
        databaseIds: context.databaseIds,
        _meta: {
          workflowId,
          startedAt,
          completedAt: new Date().toISOString(),
          nodes: context.nodes,
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
   * Execute a single node
   */
  private async executeNode(
    nodeId: string,
    handler: NodeHandler,
    input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<void> {
    const node = context.nodes.find(n => n.nodeId === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.status = 'running';
    node.startedAt = new Date().toISOString();
    this.emit('node_started', node);

    try {
      const output = await handler.call(this, input, context);
      node.status = 'completed';
      node.completedAt = new Date().toISOString();
      node.output = output;
      this.emit('node_completed', node);
    } catch (error) {
      node.status = 'failed';
      node.completedAt = new Date().toISOString();
      node.error = error instanceof Error ? error.message : String(error);
      this.emit('node_failed', node);
      throw error;
    }
  }

  // ==================== Node Handlers ====================

  /**
   * S.1 - Receive user input
   */
  private async nodeReceiveInput(
    input: SetupTopicInput,
    _context: WorkflowContext
  ): Promise<{ topicName: string; keywords: string[] }> {
    console.log(`[Node S.1] Receiving input for topic: ${input.topicName}`);
    return {
      topicName: input.topicName,
      keywords: input.keywords || [],
    };
  }

  /**
   * S.2 - Validate topic
   */
  private async nodeValidateTopic(
    input: SetupTopicInput,
    _context: WorkflowContext
  ): Promise<{ valid: boolean }> {
    console.log(`[Node S.2] Validating topic: ${input.topicName}`);

    if (!input.topicName || input.topicName.trim().length < 2) {
      throw new Error('Topic name must be at least 2 characters');
    }

    if (input.topicName.length > 100) {
      throw new Error('Topic name must be less than 100 characters');
    }

    return { valid: true };
  }

  /**
   * S.3 - Generate keywords if not provided
   */
  private async nodeGenerateKeywords(
    input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ keywords: string[] }> {
    console.log(`[Node S.3] Processing keywords for topic: ${input.topicName}`);

    if (input.keywords && input.keywords.length > 0) {
      console.log(`[Node S.3] Using provided keywords: ${input.keywords.join(', ')}`);
      context.generatedKeywords = input.keywords;
      return { keywords: input.keywords };
    }

    // Generate keywords using LLM
    console.log(`[Node S.3] Generating keywords using LLM`);

    const prompt = `Generate 5-10 relevant search keywords for the topic "${input.topicName}".
These keywords should help find authoritative content creators and sources.
Return only a JSON array of strings, no explanation.
Example: ["keyword1", "keyword2", "keyword3"]`;

    const response = await this.llmTool.callLLM(
      '5ml-source-curator-v1',
      prompt,
      { topic: input.topicName },
      { temperature: 0.5, maxTokens: 200 }
    );

    const keywords = this.llmTool.parseJSONResponse<string[]>(response);
    context.generatedKeywords = keywords;

    console.log(`[Node S.3] Generated keywords: ${keywords.join(', ')}`);
    return { keywords };
  }

  /**
   * S.4 - Activate Source Curator Agent
   */
  private async nodeActivateCurator(
    input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ sourcesCount: number }> {
    console.log(`[Node S.4] Activating Source Curator for: ${input.topicName}`);

    const result = await this.sourceCurator.curateSources({
      topicName: input.topicName,
      keywords: context.generatedKeywords || input.keywords,
    });

    context.discoveredSources = result.sources;
    this.emit('sources_discovered', result.sources);

    console.log(`[Node S.4] Discovered ${result.sources.length} sources`);
    return { sourcesCount: result.sources.length };
  }

  /**
   * S.5 - Validate URLs
   */
  private async nodeValidateUrls(
    _input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ validCount: number; invalidCount: number }> {
    console.log(`[Node S.5] Validating URLs for ${context.discoveredSources?.length} sources`);

    const validSources: CuratedSource[] = [];
    const invalidSources: CuratedSource[] = [];

    for (const source of context.discoveredSources || []) {
      // Basic URL validation
      try {
        new URL(source.primary_url);
        validSources.push(source);
      } catch {
        console.warn(`[Node S.5] Invalid URL for ${source.name}: ${source.primary_url}`);
        invalidSources.push(source);
      }
    }

    context.validatedSources = validSources;

    console.log(`[Node S.5] Valid: ${validSources.length}, Invalid: ${invalidSources.length}`);
    return { validCount: validSources.length, invalidCount: invalidSources.length };
  }

  /**
   * S.6 - Display for user approval
   */
  private async nodeDisplayForApproval(
    _input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ approvedCount: number }> {
    console.log(`[Node S.6] Displaying ${context.validatedSources?.length} sources for approval`);

    if (!this.approvalCallback) {
      // No approval callback set, auto-approve all
      console.log(`[Node S.6] No approval callback, auto-approving all sources`);
      context.approvedSources = context.validatedSources;
    } else {
      // Wait for user approval
      context.approvedSources = await this.approvalCallback(context.validatedSources || []);
      this.emit('sources_approved', context.approvedSources);
    }

    console.log(`[Node S.6] Approved ${context.approvedSources?.length} sources`);
    return { approvedCount: context.approvedSources?.length || 0 };
  }

  /**
   * S.7 - Save to Notion
   */
  private async nodeSaveToNotion(
    input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ topicPageId: string; sourcesAdded: number }> {
    console.log(`[Node S.7] Saving topic and sources to Notion`);

    // Check if we have database IDs from environment
    const topicsMasterDb = process.env.NOTION_TOPICS_MASTER_DB;
    const topicSourcesDb = process.env.NOTION_TOPIC_SOURCES_DB;

    if (!topicsMasterDb || !topicSourcesDb) {
      console.log(`[Node S.7] Notion database IDs not configured, skipping save`);
      context.topicPageId = `local-${context.workflowId}`;
      return { topicPageId: context.topicPageId, sourcesAdded: 0 };
    }

    // Create topic
    const topicResult = await this.dbInitializer.createTopic(topicsMasterDb, {
      name: input.topicName,
      keywords: context.generatedKeywords || input.keywords || [],
      createdBy: input.createdBy,
      dailyScanTime: input.dailyScanTime,
      weeklyDigestDay: input.weeklyDigestDay,
      weeklyDigestTime: input.weeklyDigestTime,
    });

    context.topicPageId = topicResult.id;

    // Add sources
    const sourcesResult = await this.dbInitializer.addSourcesToTopic(
      topicSourcesDb,
      topicResult.id,
      (context.approvedSources || []).map(s => ({
        name: s.name,
        title: s.title,
        primaryUrl: s.primary_url,
        secondaryUrls: s.secondary_urls,
        contentTypes: s.content_types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
        authorityScore: s.authority_score,
        focusAreas: s.focus_areas,
        postingFrequency: s.posting_frequency.charAt(0).toUpperCase() + s.posting_frequency.slice(1),
        whySelected: s.why_selected,
      }))
    );

    console.log(`[Node S.7] Topic saved: ${topicResult.id}, Sources: ${sourcesResult.success}`);
    return { topicPageId: topicResult.id, sourcesAdded: sourcesResult.success };
  }

  /**
   * S.8 - Initialize databases
   */
  private async nodeInitializeDatabases(
    _input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ initialized: boolean }> {
    console.log(`[Node S.8] Checking database initialization`);

    // Check if databases already exist
    const hasAllDbs = !!(
      process.env.NOTION_TOPICS_MASTER_DB &&
      process.env.NOTION_TOPIC_SOURCES_DB &&
      process.env.NOTION_DAILY_NEWS_DB &&
      process.env.NOTION_WEEKLY_DIGEST_DB
    );

    if (hasAllDbs) {
      console.log(`[Node S.8] Databases already configured, skipping initialization`);
      context.databaseIds = {
        topicsMaster: process.env.NOTION_TOPICS_MASTER_DB!,
        topicSources: process.env.NOTION_TOPIC_SOURCES_DB!,
        dailyNews: process.env.NOTION_DAILY_NEWS_DB!,
        weeklyDigest: process.env.NOTION_WEEKLY_DIGEST_DB!,
      };
      return { initialized: false };
    }

    // Initialize databases if parent page ID is available
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
    if (parentPageId) {
      const result = await this.dbInitializer.initializeAllDatabases(parentPageId);
      if (result.success && result.databases) {
        context.databaseIds = result.databases;
        console.log(`[Node S.8] Databases initialized successfully`);
        return { initialized: true };
      }
    }

    console.log(`[Node S.8] Database initialization skipped (no parent page ID)`);
    return { initialized: false };
  }

  /**
   * S.9 - Schedule workflows
   */
  private async nodeScheduleWorkflows(
    input: SetupTopicInput,
    context: WorkflowContext
  ): Promise<{ scheduled: boolean }> {
    console.log(`[Node S.9] Scheduling workflows for topic`);

    // This would integrate with a job scheduler
    // For now, we log the schedule configuration
    const scheduleConfig = {
      topicId: context.topicPageId,
      topicName: input.topicName,
      dailyScan: {
        time: input.dailyScanTime || '06:00 HKT',
        enabled: true,
      },
      weeklyDigest: {
        day: input.weeklyDigestDay || 'Monday',
        time: input.weeklyDigestTime || '08:00 HKT',
        enabled: true,
        recipients: input.recipientEmails || [],
      },
    };

    console.log(`[Node S.9] Schedule config:`, JSON.stringify(scheduleConfig, null, 2));

    // In production, this would register with the orchestrator
    // For now, return success
    return { scheduled: true };
  }
}

// Export factory function
export function createSetupTopicWorkflow(options?: {
  sourceCurator?: SourceCuratorAgent;
  notionTool?: NotionTool;
  llmTool?: InternalLLMTool;
  dbInitializer?: TopicDatabaseInitializer;
}): SetupTopicAndSourcesWorkflow {
  return new SetupTopicAndSourcesWorkflow(options);
}

export default SetupTopicAndSourcesWorkflow;
