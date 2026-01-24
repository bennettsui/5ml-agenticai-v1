/**
 * API Routes for Topic Intelligence
 * Express router for all intelligence-related endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TopicBasedNewsOrchestrator, createTopicNewsOrchestrator } from '../orchestration/topic-news-orchestrator';
import { ScanWebSocketServer, getScanWebSocketServer } from '../websocket/scan-server';
import { TopicDatabaseInitializer, createTopicDatabaseInitializer } from '../scripts/init-topic-databases';
import type { SetupTopicInput } from '../workflows/setup-topic-workflow';

// Initialize orchestrator
let orchestrator: TopicBasedNewsOrchestrator | null = null;
let wsServer: ScanWebSocketServer | null = null;

export function initializeOrchestrator(): TopicBasedNewsOrchestrator {
  if (!orchestrator) {
    orchestrator = createTopicNewsOrchestrator();

    // Set up WebSocket broadcast
    wsServer = getScanWebSocketServer();
    orchestrator.setBroadcastCallback((topicId, event, data) => {
      wsServer!.broadcast(topicId, event, data);
    });

    // Initialize (load topics from Notion)
    orchestrator.initialize().catch(err => {
      console.error('[Intelligence API] Failed to initialize orchestrator:', err);
    });
  }
  return orchestrator;
}

export function getRouter(): Router {
  const router = Router();

  // Ensure orchestrator is initialized
  router.use((req: Request, res: Response, next: NextFunction) => {
    initializeOrchestrator();
    next();
  });

  // ==================== Topic Management ====================

  /**
   * POST /intelligence/topics
   * Setup a new topic with sources
   */
  router.post('/topics', async (req: Request, res: Response) => {
    try {
      const input: SetupTopicInput = {
        topicName: req.body.topicName,
        keywords: req.body.keywords,
        createdBy: req.body.createdBy,
        dailyScanTime: req.body.dailyScanTime,
        weeklyDigestDay: req.body.weeklyDigestDay,
        weeklyDigestTime: req.body.weeklyDigestTime,
        recipientEmails: req.body.recipientEmails,
      };

      if (!input.topicName) {
        return res.status(400).json({ error: 'Topic name is required' });
      }

      const result = await orchestrator!.setupTopic(input);

      if (result.success) {
        res.status(201).json({
          success: true,
          topicId: result.topicPageId,
          sourcesCount: result.sources?.length || 0,
          message: `Topic "${input.topicName}" created successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to create topic',
        });
      }
    } catch (error) {
      console.error('[POST /intelligence/topics] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * GET /intelligence/topics
   * Get all topics
   */
  router.get('/topics', async (_req: Request, res: Response) => {
    try {
      const topics = orchestrator!.getAllTopics();

      res.json({
        success: true,
        topics: topics.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          keywords: t.keywords,
          sourcesCount: t.sources.length,
          lastDailyScan: t.lastDailyScan,
          nextDailyScan: t.nextDailyScan,
          lastWeeklyDigest: t.lastWeeklyDigest,
          nextWeeklyDigest: t.nextWeeklyDigest,
        })),
      });
    } catch (error) {
      console.error('[GET /intelligence/topics] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * GET /intelligence/topics/:topicId
   * Get single topic details
   */
  router.get('/topics/:topicId', async (req: Request, res: Response) => {
    try {
      const topic = orchestrator!.getTopic(req.params.topicId);

      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found',
        });
      }

      res.json({
        success: true,
        topic: {
          id: topic.id,
          name: topic.name,
          status: topic.status,
          keywords: topic.keywords,
          sources: topic.sources,
          dailyScanConfig: topic.dailyScanConfig,
          weeklyDigestConfig: topic.weeklyDigestConfig,
          lastDailyScan: topic.lastDailyScan,
          nextDailyScan: topic.nextDailyScan,
          lastWeeklyDigest: topic.lastWeeklyDigest,
          nextWeeklyDigest: topic.nextWeeklyDigest,
        },
      });
    } catch (error) {
      console.error('[GET /intelligence/topics/:topicId] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * PUT /intelligence/topics/:topicId
   * Update topic settings (including subscription/recipient management)
   */
  router.put('/topics/:topicId', async (req: Request, res: Response) => {
    try {
      const { topicId } = req.params;
      const {
        name,
        keywords,
        dailyScanConfig,
        weeklyDigestConfig,
      } = req.body;

      // Parse keywords if string
      let parsedKeywords = keywords;
      if (typeof keywords === 'string') {
        parsedKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      }

      // Parse recipients if string
      let parsedRecipients = weeklyDigestConfig?.recipientList;
      if (typeof weeklyDigestConfig?.recipientList === 'string') {
        parsedRecipients = weeklyDigestConfig.recipientList
          .split(/[,\n]/)
          .map((e: string) => e.trim())
          .filter((e: string) => e && e.includes('@'));
      }

      const updates: {
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
      } = {};

      if (name !== undefined) {
        updates.name = name;
      }

      if (parsedKeywords !== undefined) {
        updates.keywords = parsedKeywords;
      }

      if (dailyScanConfig !== undefined) {
        updates.dailyScanConfig = {
          enabled: dailyScanConfig.enabled ?? true,
          time: dailyScanConfig.time || '06:00',
          timezone: dailyScanConfig.timezone || 'Asia/Hong_Kong',
        };
      }

      if (weeklyDigestConfig !== undefined) {
        updates.weeklyDigestConfig = {
          enabled: weeklyDigestConfig.enabled ?? true,
          day: weeklyDigestConfig.day || 'monday',
          time: weeklyDigestConfig.time || '08:00',
          timezone: weeklyDigestConfig.timezone || 'Asia/Hong_Kong',
          recipientList: parsedRecipients || [],
        };
      }

      const result = await orchestrator!.updateTopic(topicId, updates);

      if (result.success) {
        res.json({
          success: true,
          topic: result.topic,
          message: 'Topic settings updated successfully',
        });
      } else {
        res.status(result.error === 'Topic not found' ? 404 : 500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('[PUT /intelligence/topics/:topicId] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * PUT /intelligence/topics/:topicId/pause
   * Pause a topic
   */
  router.put('/topics/:topicId/pause', async (req: Request, res: Response) => {
    try {
      const success = await orchestrator!.pauseTopic(req.params.topicId);

      if (success) {
        res.json({ success: true, message: 'Topic paused' });
      } else {
        res.status(404).json({ success: false, error: 'Topic not found' });
      }
    } catch (error) {
      console.error('[PUT /intelligence/topics/:topicId/pause] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * PUT /intelligence/topics/:topicId/resume
   * Resume a topic
   */
  router.put('/topics/:topicId/resume', async (req: Request, res: Response) => {
    try {
      const success = await orchestrator!.resumeTopic(req.params.topicId);

      if (success) {
        res.json({ success: true, message: 'Topic resumed' });
      } else {
        res.status(404).json({ success: false, error: 'Topic not found' });
      }
    } catch (error) {
      console.error('[PUT /intelligence/topics/:topicId/resume] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * DELETE /intelligence/topics/:topicId
   * Archive a topic
   */
  router.delete('/topics/:topicId', async (req: Request, res: Response) => {
    try {
      const success = await orchestrator!.archiveTopic(req.params.topicId);

      if (success) {
        res.json({ success: true, message: 'Topic archived' });
      } else {
        res.status(404).json({ success: false, error: 'Topic not found' });
      }
    } catch (error) {
      console.error('[DELETE /intelligence/topics/:topicId] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // ==================== Orchestration Triggers ====================

  /**
   * POST /orchestration/trigger-scan
   * Manually trigger daily scan for a topic
   */
  router.post('/orchestration/trigger-scan', async (req: Request, res: Response) => {
    try {
      const topicId = req.query.topic_id as string || req.body.topicId;

      if (!topicId) {
        return res.status(400).json({ error: 'topic_id is required' });
      }

      const result = await orchestrator!.triggerDailyScan(topicId);

      res.json({
        success: result.success,
        sessionId: result.sessionId,
        sourcesScanned: result.sourcesScanned,
        articlesFound: result.articlesFound,
        articlesAnalyzed: result.articlesAnalyzed,
        highImportanceCount: result.highImportanceCount,
        error: result.error,
      });
    } catch (error) {
      console.error('[POST /orchestration/trigger-scan] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * POST /orchestration/trigger-digest
   * Manually trigger weekly digest for a topic
   */
  router.post('/orchestration/trigger-digest', async (req: Request, res: Response) => {
    try {
      const topicId = req.query.topic_id as string || req.body.topicId;

      if (!topicId) {
        return res.status(400).json({ error: 'topic_id is required' });
      }

      const result = await orchestrator!.triggerWeeklyDigest(topicId);

      res.json({
        success: result.success,
        sessionId: result.sessionId,
        totalArticles: result.totalArticles,
        articlesIncluded: result.articlesIncluded,
        emailsSent: result.emailsSent,
        emailsFailed: result.emailsFailed,
        error: result.error,
      });
    } catch (error) {
      console.error('[POST /orchestration/trigger-digest] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * GET /orchestration/health
   * Get orchestrator health status
   */
  router.get('/orchestration/health', async (_req: Request, res: Response) => {
    try {
      const health = orchestrator!.getHealthStatus();
      const wsStatus = wsServer?.getStatus();

      res.json({
        ...health,
        websocket: wsStatus || { running: false },
      });
    } catch (error) {
      console.error('[GET /orchestration/health] Error:', error);
      res.status(500).json({
        orchestratorStatus: 'down',
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // ==================== Database Initialization ====================

  /**
   * POST /intelligence/databases/init
   * Initialize Notion databases
   */
  router.post('/databases/init', async (req: Request, res: Response) => {
    try {
      const parentPageId = req.body.parentPageId || process.env.NOTION_PARENT_PAGE_ID;

      if (!parentPageId) {
        return res.status(400).json({
          success: false,
          error: 'parentPageId is required (or set NOTION_PARENT_PAGE_ID env var)',
        });
      }

      const initializer = createTopicDatabaseInitializer();
      const result = await initializer.initializeAllDatabases(parentPageId);

      if (result.success) {
        res.status(201).json({
          success: true,
          databases: result.databases,
          message: 'Databases initialized successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to initialize databases',
        });
      }
    } catch (error) {
      console.error('[POST /intelligence/databases/init] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // ==================== Source Discovery ====================

  /**
   * POST /intelligence/sources/discover
   * Discover sources for a topic (without saving)
   */
  router.post('/sources/discover', async (req: Request, res: Response) => {
    try {
      const { topicName, keywords } = req.body;

      if (!topicName) {
        return res.status(400).json({ error: 'topicName is required' });
      }

      const { createSourceCuratorAgent } = await import('../agents/source-curator');
      const curator = createSourceCuratorAgent();

      const result = await curator.curateSources({
        topicName,
        keywords,
      });

      res.json({
        success: true,
        topic: result.topic,
        keywords: result.keywords,
        sourcesCount: result.sources.length,
        sources: result.sources,
      });
    } catch (error) {
      console.error('[POST /intelligence/sources/discover] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // ==================== Test Email ====================

  /**
   * POST /intelligence/email/test
   * Send a test digest email
   */
  router.post('/email/test', async (req: Request, res: Response) => {
    try {
      const { email, topicId } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'email is required' });
      }

      const topic = topicId ? orchestrator!.getTopic(topicId) : null;

      const { ResendEmailTool } = await import('../tools/resend-email-tool');
      const { NewsWriterAgent } = await import('../agents/news-writer');

      const emailTool = new ResendEmailTool();
      const newsWriter = new NewsWriterAgent();

      // Generate a test newsletter
      const testHtml = newsWriter.generateFallbackTemplate({
        topicId: topicId || 'test',
        topicName: topic?.name || 'Test Topic',
        articles: [],
        weekDate: new Date().toISOString(),
        totalArticlesThisWeek: 0,
        highImportanceCount: 0,
      });

      const result = await emailTool.sendTestEmail(
        email,
        `${topic?.name || 'Test Topic'} Weekly Brief`,
        testHtml,
        topicId
      );

      res.json({
        success: result.status === 'sent',
        emailId: result.id,
        error: result.error,
      });
    } catch (error) {
      console.error('[POST /intelligence/email/test] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return router;
}

export default getRouter;
