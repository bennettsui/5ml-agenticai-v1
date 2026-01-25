/**
 * Scan Handlers for Topic Intelligence
 * Handles news scanning with real-time WebSocket updates
 */

const { fetchPageContent, extractArticleLinks, analyzeArticleContent, sleep } = require('../services/contentService');
const { generateMockSources } = require('./sourceHandlers');
const { inMemoryTopics, inMemorySources } = require('./topicHandlers');

// Lazy-load dependencies
let db = null;
let wsServer = null;
let notionHelper = null;

function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[ScanHandlers] Database module not available');
    }
  }
  return db;
}

function getWsServer() {
  if (!wsServer) {
    try {
      wsServer = require('../../../../services/websocket-server');
    } catch (e) {
      console.warn('[ScanHandlers] WebSocket server not available');
    }
  }
  return wsServer;
}

function getNotionHelper() {
  if (!notionHelper) {
    try {
      // Notion helper is defined in routes.js - we'll check if it exists
      notionHelper = { isAvailable: () => false };
    } catch (e) {
      notionHelper = { isAvailable: () => false };
    }
  }
  return notionHelper;
}

/**
 * Reliable broadcast with subscriber check
 * Returns true if broadcast was sent to at least one client
 */
function reliableBroadcast(topicId, message) {
  const ws = getWsServer();
  if (!ws) {
    console.warn(`[Broadcast] WebSocket server not available`);
    return false;
  }

  const clients = ws.clients?.get(topicId);
  const clientCount = clients?.size || 0;

  if (clientCount === 0) {
    // Log but don't fail - client may reconnect
    console.warn(`[Broadcast] No subscribers for topic ${topicId}, message: ${message.event}`);
    return false;
  }

  ws.broadcast(topicId, message);
  return true;
}

/**
 * POST /scan/start - Start a manual scan
 */
async function startScan(req, res) {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'Topic ID is required' });
    }

    let topic;
    let sources = [];
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        topic = await database.getIntelligenceTopic(topicId);
        sources = await database.getIntelligenceSources(topicId);
      } catch (dbError) {
        topic = inMemoryTopics.get(topicId);
        sources = Array.from(inMemorySources.values()).filter(s => s.topicId === topicId);
      }
    } else {
      topic = inMemoryTopics.get(topicId);
      sources = Array.from(inMemorySources.values()).filter(s => s.topicId === topicId);
    }

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const scanId = `scan-${Date.now()}`;
    console.log(`🔄 Starting scan for topic: ${topic.name} (${sources.length} sources)`);

    // Check WebSocket subscribers
    const ws = getWsServer();
    const subscriberCount = ws ? (ws.clients?.get(topicId)?.size || 0) : 0;
    console.log(`   WebSocket subscribers for ${topicId}: ${subscriberCount}`);

    res.json({
      success: true,
      message: 'Scan started',
      scanId,
      totalSources: sources.length,
      subscriberCount,
    });

    // Small delay to ensure client receives response before broadcasts start
    await sleep(100);

    // Run scan asynchronously
    runScanWithUpdates(topicId, topic, sources, scanId);

  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Run scan asynchronously with WebSocket updates
 */
async function runScanWithUpdates(topicId, topic, sources, scanId) {
  const database = getDb();

  try {
    const usingRealSources = sources.length > 0;
    const scanSources = usingRealSources ? sources : generateMockSources(topic.name, topic.keywords || [], 'quick').slice(0, 5);

    console.log(`📡 Broadcasting to ${topicId}: Starting scan with ${scanSources.length} sources`);

    let articlesFound = 0;
    let articlesAnalyzed = 0;
    let highImportanceCount = 0;

    // Send initial progress
    reliableBroadcast(topicId, {
      event: 'progress_update',
      data: {
        sourcesScanned: 0,
        totalSources: scanSources.length,
        articlesFound: 0,
        articlesAnalyzed: 0,
        highImportanceCount: 0,
        status: 'scanning',
        currentSource: null,
      },
    });

    for (let i = 0; i < scanSources.length; i++) {
      const source = scanSources[i];
      const sourceName = source.name || `Source ${i + 1}`;
      const sourceUrl = source.primary_url || source.url;

      console.log(`   Scanning source ${i + 1}/${scanSources.length}: ${sourceName} (${sourceUrl})`);

      // Send source status updates
      reliableBroadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          url: sourceUrl,
          step: 'fetching',
          message: `Fetching content from ${sourceUrl}`,
        },
      });

      // Fetch and extract articles with timeout protection
      let sourceArticles = [];
      try {
        const fetchPromise = fetchPageContent(sourceUrl);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout after 30s')), 30000)
        );

        const sourceContent = await Promise.race([fetchPromise, timeoutPromise]);

        if (sourceContent.success) {
          sourceArticles = extractArticleLinks(sourceUrl, sourceContent.content);
          if (sourceArticles.length === 0) {
            sourceArticles = [{
              url: sourceUrl,
              title: sourceContent.title || sourceName,
              content: sourceContent.content,
            }];
          }
        } else {
          console.warn(`   ⚠️ Failed to fetch ${sourceName}: ${sourceContent.error}`);
          sourceArticles = [{
            url: sourceUrl,
            title: `${sourceName} - Unable to fetch`,
            content: '',
            fetchError: sourceContent.error,
          }];
        }
      } catch (fetchError) {
        console.error(`   ❌ Error fetching ${sourceName}:`, fetchError.message);
        sourceArticles = [{
          url: sourceUrl,
          title: `${sourceName} - Fetch error`,
          content: '',
          fetchError: fetchError.message,
        }];
      }

      const foundInSource = sourceArticles.length;
      articlesFound += foundInSource;

      // Send analyzing status
      reliableBroadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          step: 'analyzing',
          message: `Analyzing ${foundInSource} articles with AI...`,
        },
      });

      // Process articles (limit to 5 per source)
      for (let j = 0; j < Math.min(foundInSource, 5); j++) {
        const articleInfo = sourceArticles[j];
        let articleContent = articleInfo.content || '';
        let articleTitle = articleInfo.title || '';

        if (!articleContent && articleInfo.url && !articleInfo.fetchError) {
          const fullContent = await fetchPageContent(articleInfo.url);
          if (fullContent.success) {
            articleContent = fullContent.content;
            articleTitle = fullContent.title || articleTitle;
          }
        }

        const analysis = await analyzeArticleContent(
          articleTitle,
          articleContent,
          topic.name,
          topic.keywords || [],
          'deepseek'
        );

        if (analysis.importance_score >= 80) highImportanceCount++;
        articlesAnalyzed++;

        const articleData = {
          article_id: `article-${Date.now()}-${i}-${j}`,
          title: articleTitle || `Article from ${sourceName}`,
          source_name: sourceName,
          source_url: articleInfo.url || sourceUrl,
          importance_score: analysis.importance_score,
          relevancy_score: analysis.relevancy_score,
          impact_score: analysis.impact_score,
          content_summary: analysis.summary,
          key_insights: analysis.key_insights,
          action_items: analysis.action_items,
          tags: analysis.tags,
          analysis_model: analysis.analysis_model,
        };

        // Save to database
        if (database && process.env.DATABASE_URL) {
          try {
            const sourceIdForDb = usingRealSources ? source.source_id : null;
            await database.saveIntelligenceNews(topicId, sourceIdForDb, {
              title: articleData.title,
              url: articleData.source_url,
              summary: articleData.content_summary,
              importance_score: articleData.importance_score,
              dimensions: {
                relevance: analysis.relevancy_score,
                impact: analysis.impact_score,
                key_insights: articleData.key_insights,
                action_items: articleData.action_items,
                tags: articleData.tags,
                analysis_model: analysis.analysis_model,
              },
              published_at: new Date().toISOString(),
            });
          } catch (dbError) {
            console.error('Failed to save article:', dbError.message);
          }
        }

        // Send article analyzed event
        reliableBroadcast(topicId, {
          event: 'article_analyzed',
          data: articleData,
        });

        await sleep(200);
      }

      // Send source complete
      reliableBroadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'complete',
          articlesFound: Math.min(foundInSource, 5),
          step: 'complete',
          message: `Completed: ${Math.min(foundInSource, 5)} articles analyzed`,
        },
      });

      reliableBroadcast(topicId, {
        event: 'progress_update',
        data: {
          sourcesScanned: i + 1,
          totalSources: scanSources.length,
          articlesFound,
          articlesAnalyzed,
          highImportanceCount,
          status: i === scanSources.length - 1 ? 'complete' : 'scanning',
          currentSource: i < scanSources.length - 1 ? scanSources[i + 1]?.name : null,
        },
      });

      await sleep(300);
    }

    // Send completion
    reliableBroadcast(topicId, {
      event: 'scan_complete',
      data: {
        scanId,
        totalSources: scanSources.length,
        articlesFound,
        articlesAnalyzed,
        highImportanceCount,
        completedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Scan complete for topic: ${topic.name} - ${articlesAnalyzed} articles analyzed`);

  } catch (error) {
    console.error(`❌ Scan error for topic ${topicId}:`, error);
    reliableBroadcast(topicId, {
      event: 'error_occurred',
      data: {
        message: `Scan failed: ${error.message}`,
        scanId,
      },
    });
  }
}

/**
 * Standalone scan function for scheduled scans
 */
async function runScheduledScan(topicId, topicName) {
  console.log(`[ScheduledScan] 🔄 Starting scheduled scan for: ${topicName}`);

  try {
    let topic;
    let sources = [];
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      topic = await database.getIntelligenceTopic(topicId);
      sources = await database.getIntelligenceSources(topicId);
    } else {
      topic = inMemoryTopics.get(topicId);
      sources = Array.from(inMemorySources.values()).filter(s => s.topicId === topicId);
    }

    if (!topic) {
      console.error(`[ScheduledScan] ❌ Topic not found: ${topicId}`);
      return { success: false, error: 'Topic not found' };
    }

    const scanId = `scheduled-scan-${Date.now()}`;
    console.log(`[ScheduledScan] 📡 Scanning ${sources.length} sources for topic: ${topicName}`);

    await runScanWithUpdates(topicId, topic, sources, scanId);

    console.log(`[ScheduledScan] ✅ Completed scheduled scan for: ${topicName}`);
    return { success: true, scanId, sourcesScanned: sources.length };
  } catch (error) {
    console.error(`[ScheduledScan] ❌ Error scanning ${topicName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.post('/scan/start', startScan);
}

module.exports = {
  startScan,
  runScanWithUpdates,
  runScheduledScan,
  registerRoutes,
};
