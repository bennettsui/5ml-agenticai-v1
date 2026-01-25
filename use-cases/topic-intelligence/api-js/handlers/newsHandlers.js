/**
 * News Handlers for Topic Intelligence
 * Handles fetching and managing news articles
 */

// Lazy-load dependencies
let db = null;

function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[NewsHandlers] Database module not available');
    }
  }
  return db;
}

/**
 * Generate mock news for demo
 */
function generateMockNews(limit = 20) {
  const mockTitles = [
    'Platform announces major algorithm update',
    'New feature rollout affects content strategy',
    'Industry trends show shift in user behavior',
    'Expert analysis reveals emerging opportunities',
    'Market report highlights key growth areas',
  ];

  return Array.from({ length: Math.min(limit, mockTitles.length) }, (_, i) => ({
    id: `mock-news-${i + 1}`,
    title: mockTitles[i],
    source_name: 'Demo Source',
    source_url: 'https://example.com',
    importance_score: 75 - (i * 5),
    content_summary: `This is a mock article summary for demonstration purposes.`,
    published_at: new Date(Date.now() - i * 86400000).toISOString(),
    key_insights: ['Mock insight 1', 'Mock insight 2'],
    tags: ['demo', 'mock'],
    dimensions: {
      relevance: 80,
      impact: 70,
      timeliness: 82,
      originality: 80,
    },
  }));
}

/**
 * GET /news - Get news articles
 */
async function getNews(req, res) {
  try {
    const { topicId, limit = 20 } = req.query;
    let news = [];
    const database = getDb();

    if (topicId && database && process.env.DATABASE_URL) {
      try {
        const dbNews = await database.getIntelligenceNews(topicId, parseInt(limit));
        news = dbNews.map(item => ({
          id: item.id || item.news_id,
          title: item.title,
          source_name: item.source_name || 'Unknown Source',
          source_url: item.url,
          importance_score: item.importance_score || 50,
          content_summary: item.summary || '',
          published_at: item.published_at || item.scraped_at,
          key_insights: item.dimensions?.key_insights || [],
          tags: item.dimensions?.tags || [],
          dimensions: item.dimensions || {},
        }));
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        news = generateMockNews(parseInt(limit));
      }
    } else {
      news = generateMockNews(parseInt(limit));
    }

    res.json({
      success: true,
      news,
      total: news.length,
      hasMore: false,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.get('/news', getNews);
}

module.exports = {
  getNews,
  generateMockNews,
  registerRoutes,
};
