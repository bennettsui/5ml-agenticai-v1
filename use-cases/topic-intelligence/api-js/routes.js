/**
 * Topic Intelligence API Routes (JavaScript version)
 * Provides endpoints for topic-based news intelligence features
 *
 * Supports multiple prompt modes for Source Curator:
 * - 'comprehensive': Full research sources + trends mapping (default)
 * - 'quick': Fast scan for quick overview
 * - 'trends': Focus on trend tracking and emerging signals
 */

const express = require('express');
const router = express.Router();

// Database functions (with fallback to in-memory for development)
let db;
try {
  db = require('../../../db');
} catch (e) {
  console.warn('Database module not available, using in-memory storage');
}

// In-memory fallback storage
const inMemoryTopics = new Map();
const inMemorySources = new Map();

// ==========================================
// Prompt Templates
// ==========================================

const QUALITY_FILTER_SUFFIX = `When choosing sources:
- Prioritise credibility (official, peer-reviewed, established firms, recognised experts).
- Avoid low-quality SEO farm content and generic listicles unless they add unique value.
- Prefer sources with:
  • clear authorship,
  • methodological transparency,
  • and regular updates.
- If there are major disagreements between sources, briefly note them.`;

const PROMPTS = {
  comprehensive: `You are a senior research analyst.

Your task: Map out the BEST sources to research the topic: "{topic}".

Please:
1) Focus on:
   - Language(s): {languages}
   - Region(s): {regions}
   - Timeframe: especially sources updated since {timeframe}

2) Identify and list sources in these buckets:
   A. Official / Primary Sources
      - Official websites, documentation, standards bodies
      - Company / product blogs, transparency centers, APIs
   B. Academic & Data Sources
      - Key papers, journals, datasets, university labs
      - Where to search (e.g. Google Scholar keywords)
   C. Industry Reports & Market Research
      - Consulting firms, research houses, annual / benchmark reports
   D. High-Quality Blogs, Newsletters & Media
      - Practitioners' blogs, expert newsletters, niche publications
   E. Tools, Dashboards & Databases
      - Analytics tools, trackers, public dashboards, APIs
   F. Communities & Social Sources
      - Reddit, forums, Discord/Slack groups, Twitter/X, YouTube channels, key influencers
   G. Events & Organisations
      - Conferences, associations, meetups relevant to this topic

3) For EACH source, provide:
   - Name
   - URL
   - Type (official / academic / report / blog / tool / community / event etc.)
   - Why it's useful for this topic (1–2 lines)
   - Freshness (e.g. "updated 2025", "ongoing newsletter")
   - Priority: High / Medium / Nice-to-have

4) Trend-tracking focus:
   - Show where to monitor ongoing CHANGES and TRENDS for {topic}:
     • specific newsletters
     • recurring reports (annual / quarterly)
     • dashboards / trackers
     • social accounts (X/Twitter, LinkedIn, YouTube, Substack, etc.)
   - Suggest 5–10 concrete search queries I can reuse on Google or other search engines to keep tracking new developments about {topic}.

User-provided keywords (if any): {keywords}

{quality_filter}

Output format - MUST return valid JSON:
{
  "executive_summary": ["bullet point 1", "bullet point 2", ...5-7 key points],
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Description/Title",
      "type": "official|academic|report|blog|tool|community|event|newsletter|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["articles", "reports", "videos"],
      "posting_frequency": "daily|weekly|monthly|quarterly|annually",
      "focus_areas": ["keyword1", "keyword2"],
      "authority_score": 85,
      "why_selected": "Why this source is valuable",
      "freshness": "updated 2025",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["query 1", "query 2", ...5-10 queries]
}

Return ONLY the JSON object, no other text.`,

  quick: `Map out key research sources for the topic: "{topic}".

Constraints:
- Language: {languages}
- Region focus: {regions}
- Prioritise recent sources (since {timeframe}).

User-provided keywords (if any): {keywords}

Deliver:
1) Top 15-20 must-follow sources with:
   - Name, URL, type
   - One line: why this is valuable for understanding {topic}.

2) Group them into:
   - Official / primary
   - Academic / data
   - Industry reports
   - Blogs / newsletters / media
   - Tools / dashboards
   - Communities / key people

3) Add:
   - 5 search queries I should regularly use to track new updates on {topic}.

{quality_filter}

Output format - MUST return valid JSON:
{
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Brief description",
      "type": "official|academic|report|blog|tool|community|newsletter|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["articles"],
      "posting_frequency": "weekly",
      "focus_areas": ["keyword1"],
      "authority_score": 85,
      "why_selected": "One line reason",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["query 1", "query 2", ...5 queries]
}

Return ONLY the JSON object, no other text.`,

  trends: `You are analysing current and emerging trends for the topic: "{topic}".

Tasks:
1) Identify where trends are visible:
   - Recurring reports (annual/quarterly) and who publishes them
   - Dashboards / trackers / datasets
   - Expert newsletters / Substacks / blogs
   - Active X/Twitter, LinkedIn, YouTube accounts shaping the discourse

2) For each source, give:
   - Name, URL, type
   - What kind of trend signal it gives (quantitative data, expert commentary, early-stage signals, etc.)
   - Update frequency (daily / weekly / monthly / annually)

3) Summarise:
   - 3–5 "best single places" to watch if I only have limited time
   - 5–10 search queries or RSS keywords I can use to continuously monitor trends in {topic}.

Focus:
- Language: {languages}
- Region/Market: {regions}
- Most recent 2–3 years of information.

User-provided keywords (if any): {keywords}

{quality_filter}

Output format - MUST return valid JSON:
{
  "executive_summary": ["best place 1", "best place 2", ...3-5 must-watch sources],
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Description",
      "type": "report|newsletter|blog|tool|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["reports", "data"],
      "posting_frequency": "quarterly",
      "focus_areas": ["trend1"],
      "authority_score": 90,
      "why_selected": "What trend signal it gives",
      "trend_signal_type": "quantitative|expert_commentary|early_signals|mixed",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["trend query 1", "trend query 2", ...5-10 queries]
}

Return ONLY the JSON object, no other text.`
};

/**
 * Build prompt with parameters
 */
function buildPrompt(topicName, keywords, mode, languages, regions, timeframe) {
  const template = PROMPTS[mode] || PROMPTS.comprehensive;

  return template
    .replace(/{topic}/g, topicName)
    .replace(/{languages}/g, languages || 'English, Traditional Chinese')
    .replace(/{regions}/g, regions || 'Global, Hong Kong, Asia')
    .replace(/{timeframe}/g, timeframe || '2024')
    .replace(/{keywords}/g, keywords?.length ? keywords.join(', ') : '(No specific keywords provided)')
    .replace(/{quality_filter}/g, QUALITY_FILTER_SUFFIX);
}

/**
 * POST /sources/discover
 * Discovers authoritative sources for a given topic using the Source Curator agent
 *
 * Supports modes: 'comprehensive' (default), 'quick', 'trends'
 */
router.post('/sources/discover', async (req, res) => {
  try {
    const {
      topicName,
      keywords = [],
      mode = 'comprehensive',
      languages,
      regions,
      timeframe
    } = req.body;

    if (!topicName) {
      return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    console.log(`🔍 Discovering sources for topic: ${topicName} (mode: ${mode})`);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    // Check if we have LLM API configured
    const hasLLM = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;

    let discoveredSources;
    let executiveSummary;
    let searchQueries;

    if (hasLLM) {
      // Use real LLM to discover sources
      try {
        const result = await callLLMForSources(topicName, keywords, mode, languages, regions, timeframe);
        discoveredSources = result.sources;
        executiveSummary = result.executiveSummary;
        searchQueries = result.searchQueries;
      } catch (llmError) {
        console.error('LLM call failed, using mock data:', llmError.message);
        discoveredSources = generateMockSources(topicName, keywords, mode);
      }
    } else {
      // Use mock data for demo
      discoveredSources = generateMockSources(topicName, keywords, mode);
      searchQueries = generateMockSearchQueries(topicName, keywords);
    }

    res.json({
      success: true,
      topicName,
      mode,
      executiveSummary,
      sources: discoveredSources,
      searchQueries,
      totalFound: discoveredSources.length,
    });
  } catch (error) {
    console.error('Source discovery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Call LLM API to discover sources
 */
async function callLLMForSources(topicName, keywords, mode, languages, regions, timeframe) {
  const prompt = buildPrompt(topicName, keywords, mode, languages, regions, timeframe);

  // Try DeepSeek first, then OpenAI
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_KEY
    ? 'https://api.deepseek.com/v1'
    : 'https://api.openai.com/v1';
  const model = process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a senior research analyst. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: mode === 'comprehensive' ? 4000 : 2500,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    sources: parsed.sources || [],
    executiveSummary: parsed.executive_summary,
    searchQueries: parsed.search_queries,
  };
}

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

    let topicId;
    let savedSources = [];

    // Try database first, fallback to in-memory
    if (db && process.env.DATABASE_URL) {
      try {
        // Save topic to database
        const savedTopic = await db.saveIntelligenceTopic(topicName, keywords);
        topicId = savedTopic.topic_id;

        // Save sources to database
        if (topicSources.length > 0) {
          savedSources = await db.saveIntelligenceSources(topicId, topicSources);
        }

        console.log(`✅ Created topic in DB: ${topicName} (${topicId}) with ${savedSources.length} sources`);
      } catch (dbError) {
        console.error('Database save failed, using in-memory:', dbError.message);
        // Fallback to in-memory
        topicId = `topic-${Date.now()}`;
        inMemoryTopics.set(topicId, {
          id: topicId,
          name: topicName,
          keywords,
          sources: topicSources,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // In-memory storage
      topicId = `topic-${Date.now()}`;
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

      inMemoryTopics.set(topicId, topic);

      // Save sources in-memory
      topicSources.forEach(source => {
        inMemorySources.set(source.source_id, { ...source, topicId });
      });

      console.log(`✅ Created topic in-memory: ${topicName} (${topicId}) with ${topicSources.length} sources`);
    }

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
    let topicList;

    if (db && process.env.DATABASE_URL) {
      try {
        topicList = await db.getIntelligenceTopics();
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        topicList = Array.from(inMemoryTopics.values());
      }
    } else {
      topicList = Array.from(inMemoryTopics.values());
    }

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
    let topic;

    if (db && process.env.DATABASE_URL) {
      try {
        topic = await db.getIntelligenceTopic(req.params.id);
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        topic = inMemoryTopics.get(req.params.id);
      }
    } else {
      topic = inMemoryTopics.get(req.params.id);
    }

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
    if (db && process.env.DATABASE_URL) {
      try {
        await db.updateIntelligenceTopicStatus(req.params.id, 'paused');
        return res.json({ success: true, message: 'Topic paused' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
      }
    }

    // Fallback to in-memory
    const topic = inMemoryTopics.get(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    topic.status = 'paused';
    inMemoryTopics.set(req.params.id, topic);

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
    if (db && process.env.DATABASE_URL) {
      try {
        await db.updateIntelligenceTopicStatus(req.params.id, 'active');
        return res.json({ success: true, message: 'Topic resumed' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
      }
    }

    // Fallback to in-memory
    const topic = inMemoryTopics.get(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    topic.status = 'active';
    inMemoryTopics.set(req.params.id, topic);

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

    let topic;
    if (db && process.env.DATABASE_URL) {
      try {
        topic = await db.getIntelligenceTopic(topicId);
      } catch (dbError) {
        topic = inMemoryTopics.get(topicId);
      }
    } else {
      topic = inMemoryTopics.get(topicId);
    }

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
    const { topicId, limit = 20 } = req.query;

    let news = [];

    if (topicId && db && process.env.DATABASE_URL) {
      try {
        news = await db.getIntelligenceNews(topicId, parseInt(limit));
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        news = generateMockNews(parseInt(limit));
      }
    } else {
      // Return mock data when no topicId or no database
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
function generateMockSources(topicName, keywords, mode = 'comprehensive') {
  const sourceTemplates = [
    // Official / Primary Sources
    {
      name: 'Instagram Business Blog',
      title: 'Official Instagram for Business',
      type: 'official',
      primary_url: 'https://business.instagram.com/blog/',
      content_types: ['announcements', 'case-studies', 'tips'],
      posting_frequency: 'weekly',
      authority_score: 95,
      why_selected: 'Official source for Instagram feature updates and best practices',
      freshness: 'updated 2025',
      priority: 'high',
    },
    {
      name: 'Meta for Developers',
      title: 'Official Meta Platform Documentation',
      type: 'official',
      primary_url: 'https://developers.facebook.com/docs/',
      content_types: ['documentation', 'APIs'],
      posting_frequency: 'weekly',
      authority_score: 96,
      why_selected: 'Official API documentation and platform changelog',
      freshness: 'updated 2025',
      priority: 'high',
    },
    // Industry Reports
    {
      name: 'Social Media Examiner',
      title: 'Leading Social Media Marketing Resource',
      type: 'blog',
      primary_url: 'https://www.socialmediaexaminer.com/',
      content_types: ['articles', 'podcasts', 'reports'],
      posting_frequency: 'daily',
      authority_score: 92,
      why_selected: 'Industry-leading publication covering all major social platforms with actionable marketing strategies',
      freshness: 'updated daily',
      priority: 'high',
    },
    {
      name: 'HubSpot State of Marketing Report',
      title: 'Annual Marketing Industry Report',
      type: 'report',
      primary_url: 'https://www.hubspot.com/state-of-marketing',
      content_types: ['reports', 'datasets'],
      posting_frequency: 'annually',
      authority_score: 91,
      why_selected: 'Comprehensive annual benchmarks on social media marketing performance',
      freshness: '2024 edition',
      priority: 'high',
      trend_signal_type: 'quantitative',
    },
    // High-Quality Blogs
    {
      name: 'Later Blog',
      title: 'Instagram & Social Media Marketing Tips',
      type: 'blog',
      primary_url: 'https://later.com/blog/',
      content_types: ['articles', 'case-studies', 'tutorials'],
      posting_frequency: 'daily',
      authority_score: 88,
      why_selected: 'Specializes in Instagram marketing with data-driven insights and platform updates',
      freshness: 'updated daily',
      priority: 'high',
    },
    {
      name: 'Hootsuite Blog',
      title: 'Social Media Marketing & Management',
      type: 'blog',
      primary_url: 'https://blog.hootsuite.com/',
      content_types: ['articles', 'reports', 'guides'],
      posting_frequency: 'daily',
      authority_score: 90,
      why_selected: 'Comprehensive social media resource with original research and platform-specific strategies',
      freshness: 'updated daily',
      priority: 'high',
    },
    {
      name: 'Buffer Resources',
      title: 'Social Media Marketing Library',
      type: 'blog',
      primary_url: 'https://buffer.com/resources/',
      content_types: ['articles', 'data-studies', 'tools'],
      posting_frequency: 'weekly',
      authority_score: 87,
      why_selected: 'Data-backed content with focus on organic growth and engagement strategies',
      freshness: 'updated weekly',
      priority: 'high',
    },
    {
      name: 'Neil Patel Blog',
      title: 'Digital Marketing & SEO Expert',
      type: 'blog',
      primary_url: 'https://neilpatel.com/blog/',
      content_types: ['articles', 'videos', 'tools'],
      posting_frequency: 'daily',
      authority_score: 91,
      why_selected: 'One of the most influential digital marketers with proven growth strategies',
      freshness: 'updated daily',
      priority: 'medium',
    },
    // Tools & Dashboards
    {
      name: 'Sprout Social Index',
      title: 'Social Media Benchmarks Dashboard',
      type: 'tool',
      primary_url: 'https://sproutsocial.com/insights/data/',
      content_types: ['datasets', 'reports'],
      posting_frequency: 'quarterly',
      authority_score: 89,
      why_selected: 'Real-time benchmark data and industry trends for social media performance',
      freshness: 'Q4 2024',
      priority: 'high',
      trend_signal_type: 'quantitative',
    },
    {
      name: 'Socialinsider Analytics',
      title: 'Competitive Analysis Tool',
      type: 'tool',
      primary_url: 'https://www.socialinsider.io/',
      content_types: ['tools', 'reports'],
      posting_frequency: 'weekly',
      authority_score: 84,
      why_selected: 'Competitive benchmarking and industry analytics for Instagram',
      freshness: 'live data',
      priority: 'medium',
    },
    // Communities & Social
    {
      name: 'Adam Mosseri (Instagram Head)',
      title: 'Official Instagram Updates',
      type: 'social',
      primary_url: 'https://www.threads.net/@mosseri',
      secondary_urls: ['https://www.instagram.com/mosseri/'],
      content_types: ['posts', 'videos'],
      posting_frequency: 'weekly',
      authority_score: 98,
      why_selected: 'Primary source for Instagram algorithm changes and feature announcements',
      freshness: 'updated weekly',
      priority: 'high',
      trend_signal_type: 'expert_commentary',
    },
    {
      name: 'r/Instagram',
      title: 'Reddit Instagram Community',
      type: 'community',
      primary_url: 'https://www.reddit.com/r/Instagram/',
      content_types: ['discussions', 'tips'],
      posting_frequency: 'daily',
      authority_score: 72,
      why_selected: 'Community discussions on algorithm changes, bugs, and growth tactics',
      freshness: 'live',
      priority: 'medium',
      trend_signal_type: 'early_signals',
    },
    {
      name: 'r/InstagramMarketing',
      title: 'Instagram Marketing Subreddit',
      type: 'community',
      primary_url: 'https://www.reddit.com/r/InstagramMarketing/',
      content_types: ['discussions', 'case-studies'],
      posting_frequency: 'daily',
      authority_score: 70,
      why_selected: 'Marketing-focused community with strategy discussions',
      freshness: 'live',
      priority: 'medium',
    },
    // Newsletters
    {
      name: 'Marketing Brew',
      title: 'Daily Marketing Newsletter',
      type: 'newsletter',
      primary_url: 'https://www.marketingbrew.com/',
      content_types: ['newsletters', 'analysis'],
      posting_frequency: 'daily',
      authority_score: 85,
      why_selected: 'Concise daily updates on marketing industry news and social media trends',
      freshness: 'daily',
      priority: 'high',
      trend_signal_type: 'mixed',
    },
    {
      name: 'Creator Economy Newsletter',
      title: 'Newsletter for Content Creators',
      type: 'newsletter',
      primary_url: 'https://creatoreconomy.so/',
      content_types: ['newsletters', 'analysis'],
      posting_frequency: 'weekly',
      authority_score: 82,
      why_selected: 'Focused analysis of creator economy trends and monetization strategies',
      freshness: 'weekly',
      priority: 'medium',
    },
    // News & Media
    {
      name: 'The Verge - Social Media',
      title: 'Tech News on Social Platforms',
      type: 'blog',
      primary_url: 'https://www.theverge.com/social-media',
      content_types: ['news', 'analysis'],
      posting_frequency: 'daily',
      authority_score: 88,
      why_selected: 'Breaking news and analysis on social platform changes and tech industry impact',
      freshness: 'daily',
      priority: 'high',
    },
    {
      name: 'TechCrunch Social',
      title: 'Startup & Tech Social News',
      type: 'blog',
      primary_url: 'https://techcrunch.com/tag/social/',
      content_types: ['news', 'analysis', 'interviews'],
      posting_frequency: 'daily',
      authority_score: 90,
      why_selected: 'Breaking news on social media startups, acquisitions, and platform changes',
      freshness: 'daily',
      priority: 'high',
    },
    {
      name: 'Digiday',
      title: 'Digital Media & Marketing',
      type: 'blog',
      primary_url: 'https://digiday.com/',
      content_types: ['articles', 'podcasts', 'reports'],
      posting_frequency: 'daily',
      authority_score: 86,
      why_selected: 'Deep coverage of digital advertising, media, and marketing technology',
      freshness: 'daily',
      priority: 'medium',
    },
    // Academic / Research
    {
      name: 'Pew Research - Social Media',
      title: 'Social Media Research & Statistics',
      type: 'academic',
      primary_url: 'https://www.pewresearch.org/topic/internet-technology/social-media/',
      content_types: ['reports', 'datasets'],
      posting_frequency: 'quarterly',
      authority_score: 94,
      why_selected: 'Authoritative research on social media demographics and usage patterns',
      freshness: '2024 reports',
      priority: 'high',
      trend_signal_type: 'quantitative',
    },
    {
      name: 'DataReportal',
      title: 'Global Digital Statistics',
      type: 'report',
      primary_url: 'https://datareportal.com/',
      content_types: ['reports', 'datasets'],
      posting_frequency: 'quarterly',
      authority_score: 90,
      why_selected: 'Comprehensive global statistics on social media usage and trends',
      freshness: 'Q1 2025',
      priority: 'high',
      trend_signal_type: 'quantitative',
    },
  ];

  // Filter based on mode
  let filteredSources = sourceTemplates;
  if (mode === 'quick') {
    filteredSources = sourceTemplates.filter(s => s.priority === 'high').slice(0, 15);
  } else if (mode === 'trends') {
    filteredSources = sourceTemplates.filter(s =>
      s.trend_signal_type || s.posting_frequency === 'daily' || s.type === 'newsletter'
    );
  }

  // Add unique IDs and focus areas based on keywords
  return filteredSources.map((template, index) => ({
    ...template,
    source_id: `src-${Date.now()}-${index}`,
    secondary_urls: template.secondary_urls || [],
    focus_areas: keywords.length > 0 ? keywords.slice(0, 3) : [topicName],
  }));
}

/**
 * Generates mock search queries
 */
function generateMockSearchQueries(topicName, keywords) {
  const baseQueries = [
    `"${topicName}" latest updates ${new Date().getFullYear()}`,
    `"${topicName}" algorithm changes`,
    `"${topicName}" best practices guide`,
    `"${topicName}" benchmark report`,
    `"${topicName}" case study results`,
  ];

  if (keywords.length > 0) {
    keywords.slice(0, 3).forEach(keyword => {
      baseQueries.push(`"${keyword}" trends ${new Date().getFullYear()}`);
    });
  }

  return baseQueries;
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
