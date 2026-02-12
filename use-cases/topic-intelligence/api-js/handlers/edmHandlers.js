/**
 * EDM Handlers for Topic Intelligence
 * Handles EDM preview, send, save, and history
 */

const { getEdmFromCache, setEdmInCache, getEdmCacheKey, generateEdmHtml } = require('../services/edmService');

// Lazy-load dependencies
let db = null;

function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[EdmHandlers] Database module not available');
    }
  }
  return db;
}

function getResendSenderConfig() {
  const fromRaw = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || '';
  const from = fromRaw.trim() || 'onboarding@resend.dev';
  const replyToRaw = process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO || '';
  const replyTo = replyToRaw.trim();
  return {
    from,
    replyTo: replyTo || undefined,
  };
}

/**
 * GET /edm/preview/:topicId - Generate EDM preview
 */
async function getEdmPreview(req, res) {
  try {
    const { topicId } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const database = getDb();

    if (!database || !process.env.DATABASE_URL) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Check cache first
    const cacheKey = getEdmCacheKey(topicId);
    if (!forceRefresh) {
      const cachedEdm = getEdmFromCache(cacheKey);
      if (cachedEdm) {
        return res.json({
          success: true,
          preview: cachedEdm,
          cached: true,
          cacheKey,
        });
      }
    }

    const topic = await database.getIntelligenceTopic(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const articles = await database.getIntelligenceNews(topicId);
    const latestSummary = await database.getLatestIntelligenceSummary(topicId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formattedArticles = articles.slice(0, 15).map(a => ({
      title: a.title,
      source_name: a.source_name,
      source_url: a.url,
      published_at: a.scraped_at,
      importance_score: a.importance_score || 75,
      content_summary: a.summary || 'No summary available',
      key_insights: a.key_insights || [],
      action_items: [],
      tags: a.tags || [],
    }));

    const highImportanceCount = formattedArticles.filter(a => a.importance_score >= 80).length;

    const edmHtml = generateEdmHtml({
      topicId,
      topicName: topic.name,
      articles: formattedArticles,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalArticlesThisWeek: formattedArticles.length,
      highImportanceCount,
      summary: latestSummary ? {
        breakingNews: latestSummary.breaking_news || [],
        practicalTips: latestSummary.practical_tips || [],
        keyPoints: latestSummary.key_points || [],
        overallTrend: latestSummary.overall_trend || null,
      } : null,
    });

    const previewData = {
      subject: `${topic.name} 每週情報 - ${formattedArticles.length} 篇必讀分析`,
      previewText: `本週 ${topic.name} 共發現 ${formattedArticles.length} 條新聞，其中 ${highImportanceCount} 條高重要性`,
      htmlContent: edmHtml,
      articlesIncluded: formattedArticles.length,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    setEdmInCache(cacheKey, previewData);

    res.json({
      success: true,
      preview: previewData,
      cached: false,
      cacheKey,
    });
  } catch (error) {
    console.error('Error generating EDM preview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /edm/send/:topicId - Send EDM to recipients
 */
async function sendEdm(req, res) {
  try {
    const { topicId } = req.params;
    const { recipients } = req.body;
    const database = getDb();

    if (!database || !process.env.DATABASE_URL) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
    }

    const topic = await database.getIntelligenceTopic(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const weeklyConfig = topic.weekly_digest_config || {};
    const recipientList = recipients || weeklyConfig.recipientList || [];

    if (!recipientList.length) {
      return res.status(400).json({ success: false, error: 'No recipients configured' });
    }

    const articles = await database.getIntelligenceNews(topicId);
    const latestSummary = await database.getLatestIntelligenceSummary(topicId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formattedArticles = articles.slice(0, 15).map(a => ({
      title: a.title,
      source_name: a.source_name,
      source_url: a.url,
      importance_score: a.importance_score || 75,
      content_summary: a.summary || 'No summary available',
      tags: a.tags || [],
    }));

    const highImportanceCount = formattedArticles.filter(a => a.importance_score >= 80).length;

    const edmHtml = generateEdmHtml({
      topicId,
      topicName: topic.name,
      articles: formattedArticles,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalArticlesThisWeek: formattedArticles.length,
      highImportanceCount,
      summary: latestSummary ? {
        breakingNews: latestSummary.breaking_news || [],
        practicalTips: latestSummary.practical_tips || [],
        keyPoints: latestSummary.key_points || [],
        overallTrend: latestSummary.overall_trend || null,
      } : null,
    });

    const subject = `${topic.name} Weekly Brief - ${formattedArticles.length} must-read insights`;

    console.log(`📧 Sending EDM to ${recipientList.length} recipients for topic: ${topic.name}`);
    const { from, replyTo } = getResendSenderConfig();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipientList,
        subject: subject,
        html: edmHtml,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ EDM sent successfully. ID: ${result.id}`);

    // Save to database
    try {
      await database.saveEdmHistory(topicId, {
        subject,
        htmlContent: edmHtml,
        recipientCount: recipientList.length,
        articlesIncluded: formattedArticles.length,
        resendId: result.id,
        status: 'sent',
      });
    } catch (dbError) {
      console.error('Failed to save EDM history:', dbError.message);
    }

    res.json({
      success: true,
      message: `EDM sent to ${recipientList.length} recipients`,
      resendId: result.id,
    });
  } catch (error) {
    console.error('Error sending EDM:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /edm/history/:topicId - Get EDM history
 */
async function getEdmHistory(req, res) {
  try {
    const { topicId } = req.params;
    const database = getDb();

    if (!database || !process.env.DATABASE_URL) {
      return res.json({ success: true, history: [] });
    }

    const history = await database.getEdmHistory(topicId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching EDM history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.get('/edm/preview/:topicId', getEdmPreview);
  router.post('/edm/send/:topicId', sendEdm);
  router.get('/edm/history/:topicId', getEdmHistory);
}

module.exports = {
  getEdmPreview,
  sendEdm,
  getEdmHistory,
  registerRoutes,
};
