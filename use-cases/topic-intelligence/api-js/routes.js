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
// Content Fetching & Analysis Helpers
// ==========================================

/**
 * Fetch and extract text content from a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<{title: string, content: string, success: boolean, error?: string}>}
 */
async function fetchPageContent(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0; +https://5ml.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { title: '', content: '', success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

    // Extract main content - remove scripts, styles, nav, footer, etc.
    let content = html
      // Remove script tags and content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove style tags and content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove nav, header, footer, aside
      .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length for LLM processing (roughly 4000 tokens ≈ 16000 chars)
    if (content.length > 16000) {
      content = content.substring(0, 16000) + '...';
    }

    return { title, content, success: true };
  } catch (error) {
    const errorMessage = error.name === 'AbortError' ? 'Timeout' : error.message;
    return { title: '', content: '', success: false, error: errorMessage };
  }
}

/**
 * Analyze article content for relevancy, impact, and insights using LLM
 * @param {string} title - Article title
 * @param {string} content - Article content
 * @param {string} topicName - The topic being monitored
 * @param {string[]} keywords - Topic keywords
 * @param {string} selectedLLM - LLM to use
 * @returns {Promise<{relevancy_score: number, impact_score: number, importance_score: number, summary: string, key_insights: string[], action_items: string[], tags: string[]}>}
 */
async function analyzeArticleContent(title, content, topicName, keywords, selectedLLM = 'deepseek') {
  // Build analysis prompt
  const keywordsStr = keywords && keywords.length > 0 ? keywords.join(', ') : topicName;

  const prompt = `You are an expert analyst evaluating news content for professionals monitoring "${topicName}".

ARTICLE TITLE: ${title}

ARTICLE CONTENT:
${content.substring(0, 8000)}

TOPIC KEYWORDS: ${keywordsStr}

Analyze this article and provide:
1. RELEVANCY_SCORE (0-100): How relevant is this to "${topicName}"? Consider keyword matches, topic alignment, and industry applicability.
2. IMPACT_SCORE (0-100): How impactful is this for professionals in this field? Consider urgency, business implications, competitive advantage.
3. SUMMARY: 2-3 sentence summary of the key information.
4. KEY_INSIGHTS: 2-4 bullet points of actionable insights.
5. ACTION_ITEMS: If impact is high (70+), list 1-3 specific actions a professional should take.
6. TAGS: 3-5 relevant tags/categories.

Return ONLY valid JSON:
{
  "relevancy_score": 85,
  "impact_score": 72,
  "summary": "Concise summary here...",
  "key_insights": ["Insight 1", "Insight 2"],
  "action_items": ["Action 1 if high impact"],
  "tags": ["tag1", "tag2", "tag3"]
}`;

  // Try to use LLM for analysis
  const llmPriority = [selectedLLM, 'deepseek', 'claude-haiku', 'perplexity'];
  let config = null;
  let apiKey = null;
  let llmUsed = null;

  for (const llm of llmPriority) {
    const cfg = LLM_CONFIGS[llm];
    if (cfg && process.env[cfg.envKey]) {
      llmUsed = llm;
      config = cfg;
      apiKey = process.env[cfg.envKey];
      break;
    }
  }

  // If no LLM available, use keyword-based scoring
  if (!config || !apiKey) {
    return generateKeywordBasedAnalysis(title, content, topicName, keywords);
  }

  try {
    let response;
    let responseContent;

    if (config.isAnthropic) {
      response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a news analyst. Return only valid JSON.',
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      responseContent = data.content[0].text;
    } else {
      // OpenAI-compatible API
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are a news analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 512,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      responseContent = data.choices[0].message.content;
    }

    // Parse JSON from response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate overall importance score
    const importanceScore = Math.round((parsed.relevancy_score * 0.4) + (parsed.impact_score * 0.6));

    return {
      relevancy_score: parsed.relevancy_score || 50,
      impact_score: parsed.impact_score || 50,
      importance_score: importanceScore,
      summary: parsed.summary || '',
      key_insights: parsed.key_insights || [],
      action_items: parsed.action_items || [],
      tags: parsed.tags || [topicName],
      analysis_model: `${llmUsed} (${config.model})`,
    };
  } catch (error) {
    console.error('LLM analysis failed:', error.message);
    return generateKeywordBasedAnalysis(title, content, topicName, keywords);
  }
}

/**
 * Fallback: Generate analysis based on keyword matching when no LLM is available
 */
function generateKeywordBasedAnalysis(title, content, topicName, keywords) {
  const textToAnalyze = `${title} ${content}`.toLowerCase();
  const allKeywords = [...(keywords || []), topicName.toLowerCase()];

  // Count keyword matches
  let matchCount = 0;
  let matchedKeywords = [];
  for (const keyword of allKeywords) {
    const regex = new RegExp(keyword.toLowerCase(), 'gi');
    const matches = textToAnalyze.match(regex);
    if (matches) {
      matchCount += matches.length;
      matchedKeywords.push(keyword);
    }
  }

  // Calculate relevancy based on keyword density
  const wordCount = textToAnalyze.split(/\s+/).length;
  const keywordDensity = (matchCount / Math.max(wordCount, 1)) * 100;
  const relevancyScore = Math.min(95, Math.max(20, Math.round(keywordDensity * 50 + (matchedKeywords.length * 15))));

  // Impact based on urgency words
  const urgencyWords = ['breaking', 'urgent', 'important', 'critical', 'major', 'significant', 'new', 'update', 'change', 'announce'];
  const urgencyMatches = urgencyWords.filter(word => textToAnalyze.includes(word)).length;
  const impactScore = Math.min(90, Math.max(30, 40 + (urgencyMatches * 8) + (matchCount * 3)));

  const importanceScore = Math.round((relevancyScore * 0.4) + (impactScore * 0.6));

  // Generate summary from first sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 2).join('. ').substring(0, 300) + (sentences.length > 2 ? '...' : '.');

  return {
    relevancy_score: relevancyScore,
    impact_score: impactScore,
    importance_score: importanceScore,
    summary: summary || `Article about ${topicName}`,
    key_insights: matchedKeywords.length > 0
      ? [`Covers topics: ${matchedKeywords.slice(0, 3).join(', ')}`, `${matchCount} keyword mentions found`]
      : ['General industry coverage'],
    action_items: importanceScore >= 70 ? ['Review for relevant updates'] : [],
    tags: [...matchedKeywords.slice(0, 3), topicName].filter((v, i, a) => a.indexOf(v) === i),
    analysis_model: 'Keyword Analysis (no API key)',
  };
}

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
 * Supports LLM providers: 'perplexity', 'claude-sonnet', 'claude-haiku', 'deepseek'
 */
router.post('/sources/discover', async (req, res) => {
  try {
    const {
      topicName,
      keywords = [],
      mode = 'comprehensive',
      llm = 'perplexity',
      languages,
      regions,
      timeframe
    } = req.body;

    if (!topicName) {
      return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    console.log(`🔍 Discovering sources for topic: ${topicName}`);
    console.log(`   Mode: ${mode}, LLM: ${llm}`);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    // Check which LLM APIs are available
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
    const hasClaude = !!process.env.ANTHROPIC_API_KEY;
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    let discoveredSources;
    let executiveSummary;
    let searchQueries;
    let actualLLMUsed = llm;

    // Try to use the selected LLM, with fallbacks
    const llmAvailable = hasPerplexity || hasClaude || hasDeepSeek || hasOpenAI;

    if (llmAvailable) {
      try {
        const result = await callLLMForSources(topicName, keywords, mode, llm, languages, regions, timeframe);
        discoveredSources = result.sources;
        executiveSummary = result.executiveSummary;
        searchQueries = result.searchQueries;
        actualLLMUsed = result.llmUsed;
      } catch (llmError) {
        console.error('LLM call failed, using mock data:', llmError.message);
        discoveredSources = generateMockSources(topicName, keywords, mode);
        actualLLMUsed = 'mock';
      }
    } else {
      // Use mock data for demo
      discoveredSources = generateMockSources(topicName, keywords, mode);
      searchQueries = generateMockSearchQueries(topicName, keywords);
      actualLLMUsed = 'mock';
    }

    res.json({
      success: true,
      topicName,
      mode,
      llmUsed: actualLLMUsed,
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
 * LLM Provider configurations
 */
const LLM_CONFIGS = {
  'perplexity': {
    baseUrl: 'https://api.perplexity.ai',
    model: 'sonar-pro',
    envKey: 'PERPLEXITY_API_KEY',
  },
  'claude-sonnet': {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    isAnthropic: true,
  },
  'claude-haiku': {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-20241022',
    envKey: 'ANTHROPIC_API_KEY',
    isAnthropic: true,
  },
  'deepseek': {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
};

/**
 * Call LLM API to discover sources
 * Supports multiple providers with automatic fallback
 */
async function callLLMForSources(topicName, keywords, mode, selectedLLM, languages, regions, timeframe) {
  const prompt = buildPrompt(topicName, keywords, mode, languages, regions, timeframe);

  // Determine which LLM to use with fallback chain
  const llmPriority = [selectedLLM, 'perplexity', 'claude-sonnet', 'deepseek'];
  let llmUsed = null;
  let config = null;
  let apiKey = null;

  for (const llm of llmPriority) {
    const cfg = LLM_CONFIGS[llm];
    if (cfg && process.env[cfg.envKey]) {
      llmUsed = llm;
      config = cfg;
      apiKey = process.env[cfg.envKey];
      break;
    }
  }

  if (!config || !apiKey) {
    throw new Error('No LLM API key configured');
  }

  console.log(`   Using LLM: ${llmUsed} (${config.model})`);

  let response;

  if (config.isAnthropic) {
    // Anthropic API has different format
    response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: mode === 'comprehensive' ? 4096 : 2048,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: 'You are a senior research analyst. Return only valid JSON.',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return parseSourcesResponse(content, llmUsed);
  } else if (llmUsed === 'perplexity') {
    // Perplexity API
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a senior research analyst. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: mode === 'comprehensive' ? 4000 : 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseSourcesResponse(content, llmUsed);
  } else {
    // OpenAI-compatible API (DeepSeek, etc.)
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a senior research analyst. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: mode === 'comprehensive' ? 4000 : 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseSourcesResponse(content, llmUsed);
  }
}

/**
 * Parse LLM response to extract sources
 */
function parseSourcesResponse(content, llmUsed) {
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
    llmUsed,
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
 * Starts a manual scan for a topic with real-time WebSocket updates
 */
router.post('/scan/start', async (req, res) => {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'Topic ID is required' });
    }

    let topic;
    let sources = [];

    if (db && process.env.DATABASE_URL) {
      try {
        topic = await db.getIntelligenceTopic(topicId);
        sources = await db.getIntelligenceSources(topicId);
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

    // Return immediately with scan ID
    res.json({
      success: true,
      message: 'Scan started',
      scanId,
      totalSources: sources.length,
    });

    // Run scan asynchronously with WebSocket updates
    runScanWithUpdates(topicId, topic, sources, scanId);

  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run scan asynchronously and send WebSocket updates
 * Now with real content fetching and LLM-based analysis
 */
async function runScanWithUpdates(topicId, topic, sources, scanId) {
  const wsServer = require('../../../services/websocket-server');

  try {
    // Track if we're using real sources from database or mock sources
    const usingRealSources = sources.length > 0;
    const scanSources = usingRealSources ? sources : generateMockSources(topic.name, topic.keywords || [], 'quick').slice(0, 5);

    console.log(`📡 Broadcasting to ${topicId}: Starting scan with ${scanSources.length} sources`);

    let articlesFound = 0;
    let articlesAnalyzed = 0;
    let highImportanceCount = 0;

    // Send initial progress
    wsServer.broadcast(topicId, {
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

      // Send source status - starting
      wsServer.broadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          url: sourceUrl,
          step: 'connecting',
        },
      });

      // Send status - fetching
      wsServer.broadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          step: 'fetching',
          message: `Fetching content from ${sourceUrl}`,
        },
      });

      // Fetch the source page to find articles
      let sourceArticles = [];
      try {
        const sourceContent = await fetchPageContent(sourceUrl);

        if (sourceContent.success) {
          // Try to extract article links from the source page
          // Look for common article patterns in the content
          sourceArticles = extractArticleLinks(sourceUrl, sourceContent.content);

          // If no articles found, treat the source URL itself as an article
          if (sourceArticles.length === 0) {
            sourceArticles = [{
              url: sourceUrl,
              title: sourceContent.title || sourceName,
              content: sourceContent.content,
            }];
          }
        } else {
          console.log(`   ⚠️ Failed to fetch ${sourceName}: ${sourceContent.error}`);
          // Create a placeholder article for the failed source
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

      // Send status - parsing
      wsServer.broadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          step: 'parsing',
          message: `Found ${foundInSource} articles, parsing content...`,
        },
      });

      // Send status - analyzing
      wsServer.broadcast(topicId, {
        event: 'source_status_update',
        data: {
          sourceId: source.source_id || `src-${i}`,
          sourceName,
          status: 'active',
          step: 'analyzing',
          message: `Analyzing ${foundInSource} articles with AI...`,
        },
      });

      // Process each article found in this source
      for (let j = 0; j < Math.min(foundInSource, 5); j++) { // Limit to 5 articles per source
        const articleInfo = sourceArticles[j];

        // Fetch full content if we don't have it yet
        let articleContent = articleInfo.content || '';
        let articleTitle = articleInfo.title || '';

        if (!articleContent && articleInfo.url && !articleInfo.fetchError) {
          console.log(`      Fetching article: ${articleInfo.url.substring(0, 60)}...`);
          const fullContent = await fetchPageContent(articleInfo.url);
          if (fullContent.success) {
            articleContent = fullContent.content;
            articleTitle = fullContent.title || articleTitle;
          }
        }

        // Analyze the content with LLM
        console.log(`      Analyzing: ${articleTitle.substring(0, 50)}...`);
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

        // Save article to database
        if (db && process.env.DATABASE_URL) {
          try {
            const sourceIdForDb = usingRealSources ? source.source_id : null;
            await db.saveIntelligenceNews(topicId, sourceIdForDb, {
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
            console.log(`📰 Saved article to database: ${articleData.title.substring(0, 40)}...`);
          } catch (dbError) {
            console.error('Failed to save article to database:', dbError.message);
          }
        }

        // Send article analyzed event
        wsServer.broadcast(topicId, {
          event: 'article_analyzed',
          data: articleData,
        });

        // Small delay between articles
        await sleep(200);
      }

      // Send source complete
      wsServer.broadcast(topicId, {
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

      // Send progress update
      wsServer.broadcast(topicId, {
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

      // Small delay between sources
      await sleep(300);
    }

    // Send completion
    wsServer.broadcast(topicId, {
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
    const wsServer = require('../../../services/websocket-server');
    wsServer.broadcast(topicId, {
      event: 'error_occurred',
      data: {
        message: `Scan failed: ${error.message}`,
        scanId,
      },
    });
  }
}

/**
 * Extract article links from a page's content
 * Looks for common patterns in news sites and blogs
 */
function extractArticleLinks(baseUrl, content) {
  const articles = [];

  // Try to parse base URL for domain
  let baseDomain = '';
  try {
    const urlObj = new URL(baseUrl);
    baseDomain = urlObj.origin;
  } catch (e) {
    return articles;
  }

  // Simple regex to find links that look like article URLs
  // This is a basic implementation - could be enhanced with site-specific parsers
  const linkPattern = /href=["']([^"']+)["'][^>]*>([^<]+)</gi;
  let match;

  const seenUrls = new Set();
  while ((match = linkPattern.exec(content)) !== null && articles.length < 10) {
    let url = match[1];
    const title = match[2].trim();

    // Skip empty titles or navigation links
    if (!title || title.length < 10 || title.length > 200) continue;
    if (/^(home|about|contact|menu|nav|login|sign|search)/i.test(title)) continue;

    // Make URL absolute
    if (url.startsWith('/')) {
      url = baseDomain + url;
    } else if (!url.startsWith('http')) {
      continue; // Skip relative URLs that aren't path-based
    }

    // Skip if not same domain or already seen
    if (!url.startsWith(baseDomain) && !url.includes(new URL(baseUrl).hostname)) continue;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Check if URL looks like an article (has date pattern or article-like path)
    const isArticleLike = /\/\d{4}\/|\/article|\/post|\/blog|\/news|\/\d+\/|\.html?$/i.test(url);
    if (!isArticleLike && articles.length > 3) continue; // Be stricter after finding some

    articles.push({ url, title, content: '' });
  }

  return articles;
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Generate mock article title
 */
function generateMockArticleTitle(topicName, sourceType) {
  const templates = [
    `Breaking: New Developments in ${topicName}`,
    `${topicName}: What You Need to Know in 2025`,
    `Industry Report: ${topicName} Trends Analysis`,
    `Expert Analysis: The Future of ${topicName}`,
    `${topicName} Update: Key Changes Announced`,
    `How ${topicName} is Evolving This Quarter`,
    `${topicName}: Best Practices Guide 2025`,
    `The State of ${topicName}: Data Report`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Helper: Generate mock summary
 */
function generateMockSummary(topicName) {
  const templates = [
    `This article covers recent developments in ${topicName}, highlighting key changes that professionals need to be aware of.`,
    `An in-depth analysis of ${topicName} trends, with data-backed insights and actionable recommendations.`,
    `Industry experts weigh in on the future of ${topicName}, providing strategic guidance for the coming months.`,
    `Comprehensive coverage of ${topicName} updates, including practical tips and implementation strategies.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

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
        const dbNews = await db.getIntelligenceNews(topicId, parseInt(limit));
        // Transform database fields to match frontend expectations
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
 * POST /summarize
 * Generates an AI summary of fetched news articles for a topic
 * Returns categorized analysis: breaking news, practical tips, key points
 * Saves to database and includes source citations
 */
router.post('/summarize', async (req, res) => {
  try {
    const { topicId, llm = 'deepseek' } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'Topic ID is required' });
    }

    // Fetch articles from database
    let articles = [];
    let topicName = 'Unknown Topic';

    if (db && process.env.DATABASE_URL) {
      try {
        const topic = await db.getIntelligenceTopic(topicId);
        topicName = topic?.name || 'Unknown Topic';
        const dbNews = await db.getIntelligenceNews(topicId, 20);
        articles = dbNews.map((item, index) => ({
          id: index + 1, // Reference number for citations
          title: item.title,
          summary: item.summary || '',
          importance_score: item.importance_score || 50,
          source_name: item.source_name || 'Unknown Source',
          url: item.url,
        }));
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
      }
    }

    if (articles.length === 0) {
      return res.json({
        success: true,
        summary: {
          breakingNews: [],
          practicalTips: [],
          keyPoints: [{ text: 'No articles found for this topic. Run a scan first to fetch news.', sources: [] }],
          overallTrend: '',
          articles: [],
        },
        meta: {
          fetchingModel: 'N/A',
          analysisModel: 'N/A',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
          articlesAnalyzed: 0,
        },
      });
    }

    console.log(`📝 Generating categorized summary for ${articles.length} articles on topic: ${topicName}`);

    // Generate summary using LLM
    const result = await generateNewsSummary(articles, topicName, llm);

    // Save summary to database
    if (db && process.env.DATABASE_URL) {
      try {
        await db.saveIntelligenceSummary(topicId, result.summary, {
          ...result.meta,
          articlesAnalyzed: articles.length,
        });
        console.log(`💾 Summary saved to database for topic: ${topicName}`);
      } catch (dbError) {
        console.error('Failed to save summary to database:', dbError.message);
      }
    }

    // Include article references for frontend
    result.summary.articles = articles.map(a => ({
      id: a.id,
      title: a.title,
      source_name: a.source_name,
      url: a.url,
    }));

    res.json({
      success: true,
      summary: result.summary,
      meta: { ...result.meta, articlesAnalyzed: articles.length },
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /summaries/:topicId
 * Gets saved summaries for a topic
 */
router.get('/summaries/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { latest } = req.query;

    if (db && process.env.DATABASE_URL) {
      try {
        if (latest === 'true') {
          const summary = await db.getLatestIntelligenceSummary(topicId);
          return res.json({ success: true, summary });
        } else {
          const summaries = await db.getIntelligenceSummaries(topicId);
          return res.json({ success: true, summaries });
        }
      } catch (dbError) {
        console.error('Failed to fetch summaries:', dbError.message);
      }
    }

    res.json({ success: true, summaries: [] });
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Token cost estimates (per 1M tokens)
 */
const TOKEN_COSTS = {
  'claude-haiku': { input: 0.25, output: 1.25 },
  'claude-sonnet': { input: 3.00, output: 15.00 },
  'perplexity': { input: 1.00, output: 1.00 },
  'deepseek': { input: 0.14, output: 0.28 },
};

/**
 * Generate news summary using LLM with categorized analysis
 */
async function generateNewsSummary(articles, topicName, selectedLLM) {
  // Build prompt with article content - include reference IDs for citations
  const articleText = articles.map(a =>
    `[${a.id}] "${a.title}" (Importance: ${a.importance_score}/100)\n    Source: ${a.source_name}\n    Summary: ${a.summary}`
  ).join('\n\n');

  const prompt = `You are a senior research and strategy analyst.
Your job is to read a batch of scraped materials on "${topicName}" and produce a concise summary with concrete, actionable insights.

SCRAPED ARTICLES (use [number] for citations):
${articleText}

=== GLOBAL RULES ===
1. Do NOT talk about how many items there are or how they were scraped
2. Do NOT describe your own analysis steps or methodology
3. Avoid meta phrases like "multiple sources emphasize", "various reports highlight", "there are X articles", "significant evolution"
4. Never mention scraping, crawling, data pipelines, or analysis method
5. Every statement must include:
   - A specific object within the topic (e.g., a feature, behavior, metric, tactic, policy)
   - A clear pattern or change (e.g., increasing, declining, newly introduced, de-prioritized)
   - At least one recommended action someone could apply in the next 2-4 weeks
6. When evidence is weak or mixed, label it as a **hypothesis** and suggest a small, low-risk test

=== SECTION REQUIREMENTS ===

**OVERALL TREND** (2-3 short paragraphs):
- Name which part of "${topicName}" each paragraph refers to
- Explain how behavior, performance, or constraints are changing
- State what adjustment is needed (e.g., "move budget from A to B", "test new approach X")
- Avoid generalities like "things are changing rapidly" unless you specify WHAT is changing

**BREAKING NEWS / IMPORTANT UPDATES** (3-5 numbered items):
Each item MUST include:
1. What changed - one concrete development (new rule, feature, behavior, risk, opportunity)
2. Who is most affected - specific type of person/team/use case impacted
3. Immediate actions (next 0-30 days) - 2-3 actionable steps with clear behavior and timeframes
   Example phrasing: "Run a 2-week test comparing...", "Reduce dependence on... by at least 20%..."

**PRACTICAL TIPS** (3-5 items):
Each tip MUST include:
1. Action-oriented title (e.g., "Test a simpler approach with existing audience for 14 days")
2. Exactly what to do, including recommended ranges (frequency, duration, sample size)
3. Metric to watch - 1-2 primary metrics (e.g., response rate, conversion, engagement)
4. Why it helps - one sentence linking back to observed patterns
Avoid vague advice like "be data-driven" or "follow best practices"

**KEY POINTS** (4-6 single-sentence decision rules):
- Each should stand alone as a practical rule of thumb
- Frame as if/then, when/then, or clear directive
- Examples:
  - "If you are targeting risk-averse stakeholders, prioritize options that reduce complexity"
  - "When a new feature is unclear, start with a minimal version and test with a small subset first"
  - "If a tactic depends heavily on one channel, create at least one viable backup within the next month"

=== OUTPUT FORMAT - MUST RETURN VALID JSON ===
{
  "overallTrend": "2-3 paragraphs as described above, concatenated with paragraph breaks",
  "breakingNews": [
    {"text": "Full item with what changed, who affected, and actions [1][3]", "sources": [1, 3]}
  ],
  "practicalTips": [
    {"text": "Title: Action description. Metric: X. Because Y. [2][4]", "sources": [2, 4]}
  ],
  "keyPoints": [
    {"text": "If/when decision rule statement [1][2]", "sources": [1, 2]}
  ]
}

Rules:
- breakingNews: Only include if genuinely urgent/breaking (can be empty array)
- practicalTips: 3-5 actionable items with specific behaviors
- keyPoints: 4-6 decision rules as if/then statements
- Always include source citations [n] within the text
- sources array must match citation numbers in text
- Sound like a strategic consultant: clear, concrete, focused on decisions
- Prefer action verbs: "increase", "reduce", "test", "validate", "prioritize"

Return ONLY the JSON object, no other text.`;

  // Estimate input tokens (rough: 4 chars = 1 token)
  const inputTokensEstimate = Math.ceil(prompt.length / 4);

  // Determine which LLM to use
  const llmPriority = [selectedLLM, 'claude-haiku', 'perplexity', 'deepseek'];
  let llmUsed = null;
  let config = null;
  let apiKey = null;

  for (const llm of llmPriority) {
    const cfg = LLM_CONFIGS[llm];
    if (cfg && process.env[cfg.envKey]) {
      llmUsed = llm;
      config = cfg;
      apiKey = process.env[cfg.envKey];
      break;
    }
  }

  // If no LLM available, return mock summary
  if (!config || !apiKey) {
    console.log('   No LLM API available, using mock summary');
    return generateMockAISummary(articles, topicName);
  }

  console.log(`   Using LLM: ${llmUsed} (${config.model})`);

  let response;
  let content;
  let outputTokensEstimate;

  try {
    if (config.isAnthropic) {
      // Anthropic API
      response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a news analyst. Return only valid JSON.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      content = data.content[0].text;

      // Get actual token usage from API response
      const inputTokens = data.usage?.input_tokens || inputTokensEstimate;
      const outputTokens = data.usage?.output_tokens || Math.ceil(content.length / 4);

      return parseSummaryResponse(content, llmUsed, config.model, inputTokens, outputTokens);
    } else if (llmUsed === 'perplexity') {
      // Perplexity API
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are a news analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      content = data.choices[0].message.content;
      const inputTokens = data.usage?.prompt_tokens || inputTokensEstimate;
      const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

      return parseSummaryResponse(content, llmUsed, config.model, inputTokens, outputTokens);
    } else {
      // OpenAI-compatible API (DeepSeek, etc.)
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are a news analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      content = data.choices[0].message.content;
      const inputTokens = data.usage?.prompt_tokens || inputTokensEstimate;
      const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

      return parseSummaryResponse(content, llmUsed, config.model, inputTokens, outputTokens);
    }
  } catch (error) {
    console.error('LLM summary generation failed:', error.message);
    return generateMockAISummary(articles, topicName);
  }
}

/**
 * Parse summary response and calculate costs
 */
function parseSummaryResponse(content, llmUsed, model, inputTokens, outputTokens) {
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Calculate cost
  const costs = TOKEN_COSTS[llmUsed] || { input: 1.0, output: 1.0 };
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  const totalCost = inputCost + outputCost;

  return {
    summary: {
      breakingNews: parsed.breakingNews || [],
      practicalTips: parsed.practicalTips || [],
      keyPoints: parsed.keyPoints || [],
      overallTrend: parsed.overallTrend || '',
    },
    meta: {
      fetchingModel: 'Database query',
      analysisModel: `${llmUsed} (${model})`,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: parseFloat(totalCost.toFixed(6)),
    },
  };
}

/**
 * Generate mock AI summary when no LLM is available
 * Extracts actual information from articles to provide meaningful insights
 */
function generateMockAISummary(articles, topicName) {
  // Ensure articles is an array
  const articleList = Array.isArray(articles) ? articles : [];

  // Handle empty articles case
  if (articleList.length === 0) {
    return {
      summary: {
        breakingNews: [],
        practicalTips: [],
        keyPoints: [{ text: 'No articles available for analysis. Run a scan to fetch news first.', sources: [] }],
        overallTrend: `No recent data available for ${topicName}. Start a scan to gather intelligence.`,
      },
      meta: {
        fetchingModel: 'Database query',
        analysisModel: 'Mock (no API key) - Add DEEPSEEK_API_KEY for real analysis',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      },
    };
  }

  // Extract actual data from articles
  const highPriorityArticles = articleList.filter(a => a.importance_score >= 80);
  const mediumPriorityArticles = articleList.filter(a => a.importance_score >= 60 && a.importance_score < 80);

  // Extract keywords from titles for more specific insights
  const allTitles = articleList.map(a => a.title).join(' ').toLowerCase();
  const commonTopics = [];
  const topicKeywords = ['update', 'new', 'change', 'feature', 'algorithm', 'growth', 'strategy', 'tip', 'trend', 'announcement', 'launch'];
  topicKeywords.forEach(keyword => {
    if (allTitles.includes(keyword)) commonTopics.push(keyword);
  });

  // Build breaking news from high priority articles
  const breakingNews = highPriorityArticles.slice(0, 3).map((article, idx) => ({
    text: `${article.title.substring(0, 100)}${article.title.length > 100 ? '...' : ''} - Review within 48 hours and assess impact on your current approach. [${article.id}]`,
    sources: [article.id],
  }));

  // Build practical tips from article summaries
  const practicalTips = [];
  const tipArticles = articleList.slice(0, 5);

  if (tipArticles[0]) {
    practicalTips.push({
      text: `Based on "${tipArticles[0].title.substring(0, 50)}...": Test implementing key insights from this source over 2 weeks. Track engagement metrics before and after. [${tipArticles[0].id}]`,
      sources: [tipArticles[0].id],
    });
  }
  if (tipArticles[1]) {
    practicalTips.push({
      text: `From "${tipArticles[1].title.substring(0, 50)}...": Document 3 actionable takeaways and schedule implementation within 7 days. [${tipArticles[1].id}]`,
      sources: [tipArticles[1].id],
    });
  }
  if (tipArticles[2]) {
    practicalTips.push({
      text: `Consider "${tipArticles[2].title.substring(0, 50)}...": Run a small-scale pilot test before full rollout. Monitor results for 1 week. [${tipArticles[2].id}]`,
      sources: [tipArticles[2].id],
    });
  }

  // Build key points as decision rules
  const keyPoints = [];

  if (highPriorityArticles.length > 0) {
    keyPoints.push({
      text: `If you see ${highPriorityArticles.length} high-priority items like these, prioritize reviewing them within 24-48 hours before competitors adapt. [${highPriorityArticles.slice(0, 2).map(a => a.id).join('][')}]`,
      sources: highPriorityArticles.slice(0, 2).map(a => a.id),
    });
  }

  keyPoints.push({
    text: `When monitoring ${topicName}, focus on sources that consistently provide actionable insights (${articleList.slice(0, 3).map(a => a.source_name).filter((v, i, a) => a.indexOf(v) === i).join(', ')}). [${articleList.slice(0, 2).map(a => a.id).join('][')}]`,
    sources: articleList.slice(0, 2).map(a => a.id),
  });

  if (commonTopics.length > 0) {
    keyPoints.push({
      text: `Current themes include: ${commonTopics.slice(0, 4).join(', ')}. If these align with your strategy, allocate time this week to deep-dive into the top 3 articles. [${articleList.slice(0, 3).map(a => a.id).join('][')}]`,
      sources: articleList.slice(0, 3).map(a => a.id),
    });
  }

  // Build overall trend from article data
  const sourceNames = [...new Set(articleList.map(a => a.source_name))];
  const avgScore = Math.round(articleList.reduce((sum, a) => sum + (a.importance_score || 50), 0) / articleList.length);

  const overallTrend = `Based on ${articleList.length} articles from ${sourceNames.length} sources (avg importance: ${avgScore}/100), ${topicName} shows ${highPriorityArticles.length > 2 ? 'significant activity requiring immediate attention' : mediumPriorityArticles.length > 3 ? 'moderate developments worth monitoring weekly' : 'steady state with routine updates'}. ${highPriorityArticles.length > 0 ? `Top priority: "${highPriorityArticles[0].title.substring(0, 60)}..."` : 'No urgent items detected.'} Recommended action: Set up a 15-minute weekly review to stay current.`;

  return {
    summary: {
      breakingNews,
      practicalTips,
      keyPoints,
      overallTrend,
    },
    meta: {
      fetchingModel: 'Database query',
      analysisModel: 'Mock (no API key) - Add DEEPSEEK_API_KEY for AI-powered analysis',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    },
  };
}

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

/**
 * GET /topics/:id/sources
 * Gets all sources for a specific topic
 */
router.get('/topics/:id/sources', async (req, res) => {
  try {
    const topicId = req.params.id;
    let sources = [];

    if (db && process.env.DATABASE_URL) {
      try {
        sources = await db.getIntelligenceSources(topicId);
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        // Fallback to in-memory
        sources = Array.from(inMemorySources.values()).filter(s => s.topicId === topicId);
      }
    } else {
      sources = Array.from(inMemorySources.values()).filter(s => s.topicId === topicId);
    }

    res.json({
      success: true,
      topicId,
      sources,
      total: sources.length,
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /topics/:id/sources
 * Adds new sources to an existing topic
 */
router.post('/topics/:id/sources', async (req, res) => {
  try {
    const topicId = req.params.id;
    const { sources: newSources = [] } = req.body;

    if (!newSources.length) {
      return res.status(400).json({ success: false, error: 'At least one source is required' });
    }

    let savedSources = [];

    if (db && process.env.DATABASE_URL) {
      try {
        // Verify topic exists
        const topic = await db.getIntelligenceTopic(topicId);
        if (!topic) {
          return res.status(404).json({ success: false, error: 'Topic not found' });
        }

        // Add source_id if not present
        const sourcesWithIds = newSources.map(s => ({
          ...s,
          source_id: s.source_id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        savedSources = await db.saveIntelligenceSources(topicId, sourcesWithIds);
        console.log(`✅ Added ${savedSources.length} sources to topic ${topicId}`);
      } catch (dbError) {
        console.error('Database save failed:', dbError.message);
        // Fallback to in-memory
        newSources.forEach(source => {
          const sourceId = source.source_id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          inMemorySources.set(sourceId, { ...source, source_id: sourceId, topicId });
          savedSources.push({ ...source, source_id: sourceId });
        });
      }
    } else {
      // In-memory storage
      newSources.forEach(source => {
        const sourceId = source.source_id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        inMemorySources.set(sourceId, { ...source, source_id: sourceId, topicId });
        savedSources.push({ ...source, source_id: sourceId });
      });
    }

    res.json({
      success: true,
      message: `Added ${savedSources.length} sources to topic`,
      sources: savedSources,
    });
  } catch (error) {
    console.error('Error adding sources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /topics/:id/sources/:sourceId
 * Removes a source from a topic
 */
router.delete('/topics/:id/sources/:sourceId', async (req, res) => {
  try {
    const { id: topicId, sourceId } = req.params;

    if (db && process.env.DATABASE_URL) {
      try {
        // Note: Would need to add deleteIntelligenceSource to db.js
        // For now, just log and return success
        console.log(`🗑️ Would delete source ${sourceId} from topic ${topicId}`);
      } catch (dbError) {
        console.error('Database delete failed:', dbError.message);
      }
    }

    // In-memory deletion
    inMemorySources.delete(sourceId);

    res.json({
      success: true,
      message: 'Source removed',
    });
  } catch (error) {
    console.error('Error removing source:', error);
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
      source_url: 'https://example.com/ig-algorithm-2024',
      source_name: 'Social Media Examiner',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      content_summary: 'Instagram has rolled out significant changes to its recommendation algorithm, prioritizing original content and reducing the visibility of reposted material.',
      importance_score: 92,
      key_insights: ['Algorithm now prioritizes original content', 'Reposted content visibility reduced'],
      tags: ['instagram', 'algorithm', 'creators'],
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
      source_url: 'https://example.com/reels-features',
      source_name: 'Later Blog',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      content_summary: 'Instagram expands Reels to 3-minute videos with new editing tools including AI-powered captions and background removal.',
      importance_score: 88,
      key_insights: ['Reels now support 3-minute videos', 'AI-powered editing tools added'],
      tags: ['reels', 'video', 'editing'],
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
      source_url: 'https://example.com/engagement-benchmarks',
      source_name: 'Hootsuite Blog',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      content_summary: 'New research reveals average engagement rates across industries, with significant variations between Reels, Stories, and Feed posts.',
      importance_score: 85,
      key_insights: ['Engagement rates vary by content type', 'Reels outperform Feed posts'],
      tags: ['engagement', 'benchmarks', 'research'],
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
