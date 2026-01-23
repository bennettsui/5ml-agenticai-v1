/**
 * Topic Intelligence API Routes (JavaScript version)
 * Provides endpoints for topic-based news intelligence features
 */

const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes (replace with Notion integration later)
const topics = new Map();
const sources = new Map();

/**
 * POST /sources/discover
 * Discovers authoritative sources for a given topic using the Source Curator agent
 */
router.post('/sources/discover', async (req, res) => {
  try {
    const { topicName, keywords = [] } = req.body;

    if (!topicName) {
      return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    console.log(`🔍 Discovering sources for topic: ${topicName}`);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    // For demo: Generate realistic mock sources
    // In production, this would call the Source Curator agent with LLM
    const discoveredSources = generateMockSources(topicName, keywords);

    res.json({
      success: true,
      topicName,
      sources: discoveredSources,
      totalFound: discoveredSources.length,
    });
  } catch (error) {
    console.error('Source discovery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /topics
 * Creates a new topic with associated sources
 */
router.post('/topics', async (req, res) => {
  try {
    const { topicName, keywords = [], sources: topicSources = [] } = req.body;

    if (!topicName) {
      return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    const topicId = `topic-${Date.now()}`;
    const topic = {
      id: topicId,
      name: topicName,
      keywords,
      sources: topicSources,
      status: 'active',
      createdAt: new Date().toISOString(),
      dailyScanConfig: {
        enabled: true,
        time: '06:00',
        timezone: 'Asia/Hong_Kong',
      },
      weeklyDigestConfig: {
        enabled: true,
        day: 'monday',
        time: '08:00',
        timezone: 'Asia/Hong_Kong',
        recipientList: [],
      },
    };

    topics.set(topicId, topic);

    // Save sources
    topicSources.forEach(source => {
      sources.set(source.source_id, { ...source, topicId });
    });

    console.log(`✅ Created topic: ${topicName} (${topicId}) with ${topicSources.length} sources`);

    res.json({
      success: true,
      topicId,
      message: `Topic "${topicName}" created successfully`,
    });
  } catch (error) {
    console.error('Topic creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /topics
 * Lists all topics
 */
router.get('/topics', async (req, res) => {
  try {
    const topicList = Array.from(topics.values());
    res.json({ success: true, topics: topicList });
  } catch (error) {
    console.error('Error listing topics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /topics/:id
 * Gets a specific topic by ID
 */
router.get('/topics/:id', async (req, res) => {
  try {
    const topic = topics.get(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    res.json({ success: true, topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /topics/:id/pause
 * Pauses a topic's monitoring
 */
router.put('/topics/:id/pause', async (req, res) => {
  try {
    const topic = topics.get(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    topic.status = 'paused';
    topics.set(req.params.id, topic);

    res.json({ success: true, message: 'Topic paused' });
  } catch (error) {
    console.error('Error pausing topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /topics/:id/resume
 * Resumes a topic's monitoring
 */
router.put('/topics/:id/resume', async (req, res) => {
  try {
    const topic = topics.get(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    topic.status = 'active';
    topics.set(req.params.id, topic);

    res.json({ success: true, message: 'Topic resumed' });
  } catch (error) {
    console.error('Error resuming topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /scan/start
 * Starts a manual scan for a topic
 */
router.post('/scan/start', async (req, res) => {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'Topic ID is required' });
    }

    const topic = topics.get(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    // In production, this would trigger the DailyNewsWorkflow
    console.log(`🔄 Starting scan for topic: ${topic.name}`);

    res.json({
      success: true,
      message: 'Scan started',
      scanId: `scan-${Date.now()}`,
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /news
 * Gets news articles for a topic
 */
router.get('/news', async (req, res) => {
  try {
    const { topicId, limit = 20, offset = 0 } = req.query;

    // In production, this would fetch from Notion
    const mockNews = generateMockNews(parseInt(limit));

    res.json({
      success: true,
      news: mockNews,
      total: mockNews.length,
      hasMore: false,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /email/test
 * Sends a test email
 */
router.post('/email/test', async (req, res) => {
  try {
    const { email, topicId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // In production, this would use ResendEmailTool
    console.log(`📧 Test email would be sent to: ${email}`);

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// Helper Functions
// ==========================================

/**
 * Generates mock sources for demo purposes
 */
function generateMockSources(topicName, keywords) {
  const keywordStr = keywords.length > 0 ? keywords[0].toLowerCase() : topicName.toLowerCase();

  const sourceTemplates = [
    {
      name: 'Social Media Examiner',
      title: 'Leading Social Media Marketing Resource',
      primary_url: 'https://www.socialmediaexaminer.com/',
      content_types: ['articles', 'podcasts', 'guides'],
      posting_frequency: 'daily',
      authority_score: 92,
      why_selected: 'Industry-leading publication covering all major social platforms with actionable marketing strategies',
    },
    {
      name: 'Later Blog',
      title: 'Instagram & Social Media Marketing Tips',
      primary_url: 'https://later.com/blog/',
      content_types: ['articles', 'case-studies', 'tutorials'],
      posting_frequency: 'daily',
      authority_score: 88,
      why_selected: 'Specializes in Instagram marketing with data-driven insights and platform updates',
    },
    {
      name: 'Hootsuite Blog',
      title: 'Social Media Marketing & Management',
      primary_url: 'https://blog.hootsuite.com/',
      content_types: ['articles', 'research', 'guides'],
      posting_frequency: 'daily',
      authority_score: 90,
      why_selected: 'Comprehensive social media resource with original research and platform-specific strategies',
    },
    {
      name: 'Buffer Resources',
      title: 'Social Media Marketing Library',
      primary_url: 'https://buffer.com/resources/',
      content_types: ['articles', 'data-studies', 'tools'],
      posting_frequency: 'weekly',
      authority_score: 87,
      why_selected: 'Data-backed content with focus on organic growth and engagement strategies',
    },
    {
      name: 'Sprout Social Insights',
      title: 'Social Media Strategy & Data',
      primary_url: 'https://sproutsocial.com/insights/',
      content_types: ['articles', 'reports', 'webinars'],
      posting_frequency: 'daily',
      authority_score: 89,
      why_selected: 'Enterprise-grade insights with comprehensive platform analytics and trends',
    },
    {
      name: 'Neil Patel Blog',
      title: 'Digital Marketing & SEO Expert',
      primary_url: 'https://neilpatel.com/blog/',
      content_types: ['articles', 'videos', 'tools'],
      posting_frequency: 'daily',
      authority_score: 91,
      why_selected: 'One of the most influential digital marketers with proven growth strategies',
    },
    {
      name: 'HubSpot Marketing Blog',
      title: 'Inbound Marketing & Sales',
      primary_url: 'https://blog.hubspot.com/marketing',
      content_types: ['articles', 'templates', 'research'],
      posting_frequency: 'daily',
      authority_score: 93,
      why_selected: 'Industry standard for inbound marketing with comprehensive guides and templates',
    },
    {
      name: 'Instagram Business Blog',
      title: 'Official Instagram for Business',
      primary_url: 'https://business.instagram.com/blog/',
      content_types: ['announcements', 'case-studies', 'tips'],
      posting_frequency: 'weekly',
      authority_score: 95,
      why_selected: 'Official source for Instagram feature updates and best practices',
    },
    {
      name: 'Creator Economy Newsletter',
      title: 'Newsletter for Content Creators',
      primary_url: 'https://creatoreconomy.so/',
      content_types: ['newsletter', 'analysis'],
      posting_frequency: 'weekly',
      authority_score: 82,
      why_selected: 'Focused analysis of creator economy trends and monetization strategies',
    },
    {
      name: 'The Verge - Social',
      title: 'Tech News on Social Platforms',
      primary_url: 'https://www.theverge.com/social-media',
      content_types: ['news', 'analysis'],
      posting_frequency: 'daily',
      authority_score: 88,
      why_selected: 'Breaking news and analysis on social platform changes and tech industry impact',
    },
    {
      name: 'TechCrunch Social',
      title: 'Startup & Tech Social News',
      primary_url: 'https://techcrunch.com/tag/social/',
      content_types: ['news', 'analysis', 'interviews'],
      posting_frequency: 'daily',
      authority_score: 90,
      why_selected: 'Breaking news on social media startups, acquisitions, and platform changes',
    },
    {
      name: 'Marketing Brew',
      title: 'Daily Marketing Newsletter',
      primary_url: 'https://www.marketingbrew.com/',
      content_types: ['newsletter', 'analysis'],
      posting_frequency: 'daily',
      authority_score: 85,
      why_selected: 'Concise daily updates on marketing industry news and trends',
    },
    {
      name: 'Digiday',
      title: 'Digital Media & Marketing',
      primary_url: 'https://digiday.com/',
      content_types: ['articles', 'podcasts', 'research'],
      posting_frequency: 'daily',
      authority_score: 86,
      why_selected: 'Deep coverage of digital advertising, media, and marketing technology',
    },
    {
      name: 'Search Engine Journal',
      title: 'SEO & Digital Marketing',
      primary_url: 'https://www.searchenginejournal.com/',
      content_types: ['articles', 'guides', 'news'],
      posting_frequency: 'daily',
      authority_score: 88,
      why_selected: 'Comprehensive SEO and digital marketing coverage including social signals',
    },
    {
      name: 'Social Media Today',
      title: 'Social Media News & Trends',
      primary_url: 'https://www.socialmediatoday.com/',
      content_types: ['articles', 'infographics', 'tips'],
      posting_frequency: 'daily',
      authority_score: 84,
      why_selected: 'Aggregated insights and tips from social media industry experts',
    },
    {
      name: 'Influencer Marketing Hub',
      title: 'Influencer Marketing Resources',
      primary_url: 'https://influencermarketinghub.com/',
      content_types: ['articles', 'tools', 'benchmarks'],
      posting_frequency: 'daily',
      authority_score: 83,
      why_selected: 'Specialized in influencer marketing with calculators and benchmarks',
    },
    {
      name: 'Content Marketing Institute',
      title: 'Content Marketing Education',
      primary_url: 'https://contentmarketinginstitute.com/',
      content_types: ['articles', 'research', 'events'],
      posting_frequency: 'daily',
      authority_score: 89,
      why_selected: 'Leading authority on content marketing strategy and best practices',
    },
    {
      name: 'Moz Blog',
      title: 'SEO Software & Resources',
      primary_url: 'https://moz.com/blog',
      content_types: ['articles', 'videos', 'tools'],
      posting_frequency: 'weekly',
      authority_score: 91,
      why_selected: 'Industry-standard SEO resource with connections to social marketing',
    },
    {
      name: 'Agorapulse Blog',
      title: 'Social Media Management Tips',
      primary_url: 'https://www.agorapulse.com/blog/',
      content_types: ['articles', 'webinars', 'podcasts'],
      posting_frequency: 'weekly',
      authority_score: 81,
      why_selected: 'Practical social media management advice with ROI focus',
    },
    {
      name: 'Reels Trends Newsletter',
      title: 'Instagram Reels Strategy',
      primary_url: 'https://reelstrends.substack.com/',
      content_types: ['newsletter', 'trends'],
      posting_frequency: 'weekly',
      authority_score: 78,
      why_selected: 'Specialized focus on short-form video trends and Reels strategies',
    },
  ];

  // Add unique IDs and focus areas based on keywords
  return sourceTemplates.map((template, index) => ({
    ...template,
    source_id: `src-${Date.now()}-${index}`,
    secondary_urls: [],
    focus_areas: keywords.length > 0 ? keywords.slice(0, 3) : [topicName],
  }));
}

/**
 * Generates mock news articles for demo purposes
 */
function generateMockNews(limit = 20) {
  const articles = [
    {
      title: 'Instagram Algorithm Update: What Creators Need to Know in 2024',
      url: 'https://example.com/ig-algorithm-2024',
      source: 'Social Media Examiner',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      summary: 'Instagram has rolled out significant changes to its recommendation algorithm, prioritizing original content and reducing the visibility of reposted material.',
      importanceScore: 92,
      dimensions: {
        relevance: 95,
        actionability: 88,
        authority: 94,
        timeliness: 98,
        originality: 85,
      },
    },
    {
      title: 'New Reels Features: Longer Duration and Enhanced Editing',
      url: 'https://example.com/reels-features',
      source: 'Later Blog',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      summary: 'Instagram expands Reels to 3-minute videos with new editing tools including AI-powered captions and background removal.',
      importanceScore: 88,
      dimensions: {
        relevance: 90,
        actionability: 92,
        authority: 85,
        timeliness: 95,
        originality: 78,
      },
    },
    {
      title: 'Engagement Rate Benchmarks: Q4 2024 Report',
      url: 'https://example.com/engagement-benchmarks',
      source: 'Hootsuite Blog',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      summary: 'New research reveals average engagement rates across industries, with significant variations between Reels, Stories, and Feed posts.',
      importanceScore: 85,
      dimensions: {
        relevance: 88,
        actionability: 85,
        authority: 90,
        timeliness: 82,
        originality: 80,
      },
    },
  ];

  return articles.slice(0, limit).map((article, index) => ({
    ...article,
    id: `news-${Date.now()}-${index}`,
  }));
}

module.exports = router;
