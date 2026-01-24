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
// EDM Cache (Key-Value Store)
// ==========================================
// Simple in-memory KV cache with TTL for EDM content
// Keys are formatted as: edm:{topicId}:{dateKey}
// This provides fast retrieval without regenerating HTML each time

const edmCache = new Map();
const EDM_CACHE_TTL = 60 * 60 * 1000; // 1 hour TTL

/**
 * Get EDM from cache
 * @param {string} key - Cache key (e.g., 'edm:topic123:2026-01-24')
 * @returns {object|null} Cached EDM data or null if not found/expired
 */
function getEdmFromCache(key) {
  const cached = edmCache.get(key);
  if (!cached) return null;

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    edmCache.delete(key);
    return null;
  }

  console.log(`[EDM Cache] HIT: ${key}`);
  return cached.data;
}

/**
 * Set EDM in cache
 * @param {string} key - Cache key
 * @param {object} data - EDM data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
function setEdmInCache(key, data, ttl = EDM_CACHE_TTL) {
  edmCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now(),
  });
  console.log(`[EDM Cache] SET: ${key} (TTL: ${ttl / 1000}s)`);

  // Clean up old entries (keep cache size manageable)
  if (edmCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of edmCache.entries()) {
      if (now > v.expiresAt) {
        edmCache.delete(k);
      }
    }
  }
}

/**
 * Generate cache key for EDM
 * @param {string} topicId - Topic ID
 * @param {Date} date - Date for the EDM (defaults to today)
 * @returns {string} Cache key
 */
function getEdmCacheKey(topicId, date = new Date()) {
  const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `edm:${topicId}:${dateKey}`;
}

/**
 * Get cache statistics
 */
function getEdmCacheStats() {
  const now = Date.now();
  let validCount = 0;
  let expiredCount = 0;

  for (const [, v] of edmCache.entries()) {
    if (now > v.expiresAt) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    totalEntries: edmCache.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
  };
}

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
 * PUT /topics/:id
 * Updates topic settings (name, keywords, daily/weekly config, recipients)
 */
router.put('/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, keywords, dailyScanConfig, weeklyDigestConfig } = req.body;

    // Parse keywords if string
    let parsedKeywords = keywords;
    if (typeof keywords === 'string') {
      parsedKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    // Parse recipients if string
    let recipientList = weeklyDigestConfig?.recipientList;
    if (typeof recipientList === 'string') {
      recipientList = recipientList.split(/[,\n]/).map(e => e.trim()).filter(e => e && e.includes('@'));
    }

    const updates = {
      name,
      keywords: parsedKeywords,
      daily_scan_config: dailyScanConfig ? {
        enabled: dailyScanConfig.enabled ?? true,
        time: dailyScanConfig.time || '06:00',
        timezone: dailyScanConfig.timezone || 'Asia/Hong_Kong',
      } : null,
      weekly_digest_config: weeklyDigestConfig ? {
        enabled: weeklyDigestConfig.enabled ?? true,
        day: weeklyDigestConfig.day || 'monday',
        time: weeklyDigestConfig.time || '08:00',
        timezone: weeklyDigestConfig.timezone || 'Asia/Hong_Kong',
        recipientList: recipientList || [],
      } : null,
    };

    if (db && process.env.DATABASE_URL) {
      try {
        const topic = await db.updateIntelligenceTopic(id, updates);
        if (topic) {
          return res.json({ success: true, topic, message: 'Topic updated successfully' });
        }
        return res.status(404).json({ success: false, error: 'Topic not found' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
        return res.status(500).json({ success: false, error: dbError.message });
      }
    }

    // Fallback to in-memory
    const topic = inMemoryTopics.get(id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    Object.assign(topic, updates);
    inMemoryTopics.set(id, topic);
    res.json({ success: true, topic, message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /topics/:id
 * Deletes a topic and all its related data
 */
router.delete('/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (db && process.env.DATABASE_URL) {
      try {
        const topic = await db.deleteIntelligenceTopic(id);
        if (topic) {
          return res.json({ success: true, message: 'Topic deleted successfully' });
        }
        return res.status(404).json({ success: false, error: 'Topic not found' });
      } catch (dbError) {
        console.error('Database delete failed:', dbError.message);
        return res.status(500).json({ success: false, error: dbError.message });
      }
    }

    // Fallback to in-memory
    if (inMemoryTopics.has(id)) {
      inMemoryTopics.delete(id);
      return res.json({ success: true, message: 'Topic deleted successfully' });
    }
    res.status(404).json({ success: false, error: 'Topic not found' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /sources/:id
 * Deletes a single source
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (db && process.env.DATABASE_URL) {
      try {
        const source = await db.deleteIntelligenceSource(id);
        if (source) {
          return res.json({ success: true, message: 'Source deleted successfully' });
        }
        return res.status(404).json({ success: false, error: 'Source not found' });
      } catch (dbError) {
        console.error('Database delete failed:', dbError.message);
        return res.status(500).json({ success: false, error: dbError.message });
      }
    }

    res.status(404).json({ success: false, error: 'Source not found' });
  } catch (error) {
    console.error('Error deleting source:', error);
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
    console.log('   ❌ No LLM API available, using mock summary');
    console.log('   Available keys check:');
    console.log(`     - DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? 'SET (' + process.env.DEEPSEEK_API_KEY.substring(0, 8) + '...)' : 'NOT SET'}`);
    console.log(`     - ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`     - PERPLEXITY_API_KEY: ${process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET'}`);
    return generateMockAISummary(articles, topicName);
  }

  console.log(`   ✅ Using LLM: ${llmUsed} (${config.model})`);

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
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('   DeepSeek API error response:', errorText);
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('   DeepSeek response received, finish_reason:', data.choices?.[0]?.finish_reason);

      content = data.choices[0].message.content;

      // Log if response seems truncated
      if (data.choices?.[0]?.finish_reason === 'length') {
        console.warn('   ⚠️ Response was truncated due to max_tokens limit');
      }

      const inputTokens = data.usage?.prompt_tokens || inputTokensEstimate;
      const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

      return parseSummaryResponse(content, llmUsed, config.model, inputTokens, outputTokens);
    }
  } catch (error) {
    console.error('   ❌ LLM summary generation failed:', error.message);
    console.error('   Full error:', error);
    return generateMockAISummary(articles, topicName);
  }
}

/**
 * Parse summary response and calculate costs
 */
function parseSummaryResponse(content, llmUsed, model, inputTokens, outputTokens) {
  console.log('   Parsing LLM response, length:', content?.length || 0);

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('   Raw content (first 500 chars):', content?.substring(0, 500));
    throw new Error('No JSON found in response');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('   JSON parse error:', parseError.message);
    console.error('   Raw JSON (first 500 chars):', jsonMatch[0].substring(0, 500));
    console.error('   Raw JSON (last 200 chars):', jsonMatch[0].slice(-200));
    throw parseError;
  }

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
 * POST /orchestration/trigger-digest
 * Manually trigger digest email for a topic
 */
router.post('/orchestration/trigger-digest', async (req, res) => {
  try {
    const topicId = req.query.topic_id || req.body.topicId;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'topic_id is required' });
    }

    console.log(`📧 Triggering digest for topic: ${topicId}`);

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(400).json({
        success: false,
        error: 'RESEND_API_KEY not configured. Please set up email service.',
      });
    }

    // Get topic details
    let topic = null;
    let articles = [];
    let summary = null;

    if (db && process.env.DATABASE_URL) {
      try {
        topic = await db.getIntelligenceTopic(topicId);
        if (!topic) {
          return res.status(404).json({ success: false, error: 'Topic not found' });
        }

        // Get recent articles
        articles = await db.getIntelligenceNews(topicId, 10);

        // Get latest summary
        const summaries = await db.getIntelligenceSummaries(topicId, 1);
        summary = summaries?.[0] || null;
      } catch (dbError) {
        console.error('Database error:', dbError.message);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
    }

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    // Get subscribers from weekly_digest_config.recipientList
    const digestConfig = topic.weekly_digest_config || {};
    const subscribers = digestConfig.recipientList || [];

    console.log(`   Topic: ${topic.name}, Subscribers: ${subscribers.length}`);

    if (subscribers.length === 0) {
      // If no subscribers, return with message
      console.log('   No subscribers for this topic, skipping email');
      return res.json({
        success: true,
        emailsSent: 0,
        message: 'No subscribers configured for this topic. Add recipients in Settings.',
      });
    }

    // Generate email HTML
    const emailHtml = generateDigestEmailHtml(topic, articles, summary);

    // Send emails via Resend
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors = [];

    for (const subscriberEmail of subscribers) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Topic Intelligence <news@5ml.io>',
            to: subscriberEmail,
            subject: `📰 ${topic.name} - Intelligence Digest`,
            html: emailHtml,
            tags: [
              { name: 'topic_id', value: topicId },
              { name: 'type', value: 'digest' },
            ],
          }),
        });

        if (response.ok) {
          emailsSent++;
          console.log(`   ✅ Email sent to: ${subscriberEmail}`);
        } else {
          const errorData = await response.json();
          emailsFailed++;
          errors.push({ email: subscriberEmail, error: errorData.message || response.statusText });
          console.error(`   ❌ Failed to send to ${subscriberEmail}:`, errorData);
        }
      } catch (emailError) {
        emailsFailed++;
        errors.push({ email: subscriberEmail, error: emailError.message });
        console.error(`   ❌ Failed to send to ${subscriberEmail}:`, emailError.message);
      }
    }

    res.json({
      success: true,
      topicId,
      topicName: topic.name,
      emailsSent,
      emailsFailed,
      totalSubscribers: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error triggering digest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate HTML email for digest
 */
function generateDigestEmailHtml(topic, articles, summary) {
  const articlesHtml = articles.slice(0, 5).map((article, index) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <a href="${article.url}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
          ${article.title}
        </a>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
          ${article.summary || 'No summary available'}
        </p>
        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px;">
          Source: ${article.source_name || 'Unknown'} | Importance: ${article.importance_score || 50}/100
        </p>
      </td>
    </tr>
  `).join('');

  const summarySection = summary ? `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px; color: #0369a1; font-size: 18px;">📊 AI Analysis</h2>
      <p style="margin: 0; color: #334155; line-height: 1.6;">
        ${summary.overall_trend || summary.overallTrend || 'Analysis pending...'}
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="margin: 0 0 8px; color: #1f2937; font-size: 24px;">
          📰 ${topic.name}
        </h1>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          Intelligence Digest • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        ${summarySection}

        <h2 style="margin: 0 0 16px; color: #374151; font-size: 18px;">📰 Top Stories</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${articlesHtml || '<tr><td style="color: #9ca3af; padding: 16px 0;">No articles found. Run a scan to gather news.</td></tr>'}
        </table>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Powered by 5ML Topic Intelligence<br>
            <a href="https://5ml-agenticai-v1.fly.dev/intelligence/dashboard" style="color: #6b7280;">View Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * POST /email/test
 * Sends a test email using Resend API
 */
router.post('/email/test', async (req, res) => {
  try {
    const { email, topicId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      });
    }

    // Get topic name if topicId provided
    let topicName = 'Test Topic';
    if (topicId && db && process.env.DATABASE_URL) {
      try {
        const topic = await db.getIntelligenceTopic(topicId);
        if (topic) {
          topicName = topic.name;
        }
      } catch (dbError) {
        console.warn('Could not fetch topic name:', dbError.message);
      }
    }

    // Generate a simple test email HTML
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { color: #0d9488; margin-bottom: 16px; }
          p { color: #475569; line-height: 1.6; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Test Email Successful!</h1>
          <p>This is a test email from your <strong>${topicName}</strong> intelligence digest.</p>
          <p>If you received this email, your email configuration is working correctly. You'll receive weekly intelligence digests at this address.</p>
          <div class="footer">
            <p>Sent via 5ML Topic Intelligence</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`📧 Sending test email to: ${email}`);

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'news@5ml.io',
        to: email,
        subject: `[TEST] ${topicName} Weekly Brief`,
        html: testHtml,
        reply_to: 'support@5ml.io',
        tags: [
          { name: 'type', value: 'test' },
          ...(topicId ? [{ name: 'topic_id', value: topicId }] : []),
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to send email'
      });
    }

    console.log(`✅ Test email sent successfully: ${data.id}`);

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
      emailId: data.id,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== EDM Preview & History ====================

/**
 * GET /edm/preview/:topicId
 * Generate an EDM preview with real data from the topic
 * Uses in-memory KV cache for performance
 */
router.get('/edm/preview/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!db || !process.env.DATABASE_URL) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Check cache first (unless force refresh requested)
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

    // Get topic info
    const topic = await db.getIntelligenceTopic(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    // Get recent news articles (last 7 days)
    const articles = await db.getIntelligenceNews(topicId);

    // Get the latest analysis summary
    const latestSummary = await db.getLatestIntelligenceSummary(topicId);

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Format articles for the preview
    const formattedArticles = articles.slice(0, 15).map(a => ({
      title: a.title,
      source_name: a.source_name,
      source_url: a.url,
      published_at: a.scraped_at,
      importance_score: a.importance_score || 75,
      content_summary: a.summary || a.content?.substring(0, 200) + '...' || 'No summary available',
      key_insights: a.key_insights || [],
      action_items: [],
      tags: a.tags || [],
    }));

    // Calculate stats
    const highImportanceCount = formattedArticles.filter(a => a.importance_score >= 80).length;

    // Generate the EDM HTML using a template
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

    // Prepare preview data
    const previewData = {
      subject: `${topic.name} Weekly Brief - ${formattedArticles.length} must-read insights`,
      previewText: `本週 ${topic.name} 共發現 ${formattedArticles.length} 條新聞，其中 ${highImportanceCount} 條高重要性`,
      htmlContent: edmHtml,
      articlesIncluded: formattedArticles.length,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    // Cache the result
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
});

/**
 * GET /edm/history/:topicId
 * Get EDM sending history for a topic
 */
router.get('/edm/history/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!db || !process.env.DATABASE_URL) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const history = await db.getEdmHistory(topicId, limit);

    res.json({
      success: true,
      history: history.map(edm => ({
        id: edm.edm_id,
        subject: edm.subject,
        previewText: edm.preview_text,
        recipients: edm.recipients || [],
        articlesIncluded: edm.articles_included,
        status: edm.status,
        sentAt: edm.sent_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching EDM history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /edm/:edmId
 * Get a specific EDM by ID (including full HTML content)
 */
router.get('/edm/:edmId', async (req, res) => {
  try {
    const { edmId } = req.params;

    if (!db || !process.env.DATABASE_URL) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const edm = await db.getEdmById(edmId);
    if (!edm) {
      return res.status(404).json({ success: false, error: 'EDM not found' });
    }

    res.json({
      success: true,
      edm: {
        id: edm.edm_id,
        topicId: edm.topic_id,
        subject: edm.subject,
        previewText: edm.preview_text,
        htmlContent: edm.html_content,
        recipients: edm.recipients || [],
        articlesIncluded: edm.articles_included,
        status: edm.status,
        resendId: edm.resend_id,
        sentAt: edm.sent_at,
      },
    });
  } catch (error) {
    console.error('Error fetching EDM:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to generate EDM HTML with Key Visual
 */
function generateEdmHtml(input) {
  const { topicId, topicName, articles, startDate, endDate, totalArticlesThisWeek, highImportanceCount, summary, keyVisualUrl } = input;

  // Format date range
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatYear = (dateStr) => new Date(dateStr).getFullYear();
  const dateRangeStr = `${formatDate(startDate)} - ${formatDate(endDate)}, ${formatYear(endDate)}`;

  const dashboardUrl = `https://dashboard.5ml.io/intelligence/dashboard?topic=${topicId}`;

  // Generate Key Visual HTML
  // Creates a visually striking banner with topic info
  const generateKeyVisual = () => {
    // If custom key visual image is provided
    if (keyVisualUrl) {
      return `
          <!-- Key Visual Banner with Image -->
          <tr>
            <td style="padding:0;">
              <img src="${keyVisualUrl}" alt="${topicName} Weekly Brief" style="width:100%;height:auto;display:block;" />
            </td>
          </tr>`;
    }

    // Default: CSS-based Key Visual
    return `
          <!-- Key Visual Banner -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" style="width:100%;border:none;border-spacing:0;background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%);">
                <tr>
                  <td style="padding:40px 30px;text-align:center;">
                    <!-- Decorative circles -->
                    <div style="position:relative;">
                      <!-- Brand logo area -->
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                        <tr>
                          <td style="text-align:center;padding-bottom:15px;">
                            <span style="display:inline-block;padding:8px 16px;background:rgba(255,255,255,0.15);border-radius:20px;color:rgba(255,255,255,0.9);font-size:12px;letter-spacing:1px;">5ML INTELLIGENCE</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Main Title -->
                      <h1 style="margin:0 0 10px;color:#ffffff;font-size:32px;font-weight:bold;text-shadow:0 2px 10px rgba(0,0,0,0.3);">${topicName}</h1>
                      <p style="margin:0 0 5px;color:#5eead4;font-size:18px;font-weight:600;">Weekly Intelligence Brief</p>

                      <!-- Date Range Badge -->
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;margin-top:15px;">
                        <tr>
                          <td style="text-align:center;">
                            <span style="display:inline-block;padding:10px 20px;background:rgba(94,234,212,0.2);border:1px solid rgba(94,234,212,0.4);border-radius:25px;color:#5eead4;font-size:14px;font-weight:500;">
                              📅 ${dateRangeStr}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <!-- Stats Row -->
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;margin-top:25px;">
                        <tr>
                          <td style="text-align:center;">
                            <table role="presentation" style="margin:0 auto;border:none;border-spacing:0;">
                              <tr>
                                <td style="padding:0 15px;text-align:center;">
                                  <div style="color:#ffffff;font-size:28px;font-weight:bold;">${totalArticlesThisWeek}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Articles</div>
                                </td>
                                <td style="padding:0 15px;border-left:1px solid rgba(255,255,255,0.2);text-align:center;">
                                  <div style="color:#f97316;font-size:28px;font-weight:bold;">${highImportanceCount}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">High Priority</div>
                                </td>
                                <td style="padding:0 15px;border-left:1px solid rgba(255,255,255,0.2);text-align:center;">
                                  <div style="color:#a78bfa;font-size:28px;font-weight:bold;">${articles.slice(0, 3).length}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Top Stories</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
  };

  // Generate summary sections HTML
  const generateSummaryHtml = () => {
    if (!summary) return '';

    let html = '';

    // Overall Trend
    if (summary.overallTrend) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 10px;color:#ffffff;font-size:16px;font-weight:bold;">📈 Overall Trend</h3>
                <p style="margin:0;color:rgba(255,255,255,0.95);font-size:14px;line-height:1.6;">${summary.overallTrend}</p>
              </div>
            </td>
          </tr>`;
    }

    // Breaking News
    if (summary.breakingNews && summary.breakingNews.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#dc2626;font-size:16px;font-weight:bold;">⚡ Breaking News</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#7f1d1d;font-size:14px;line-height:1.8;">
                  ${summary.breakingNews.slice(0, 3).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    // Practical Tips
    if (summary.practicalTips && summary.practicalTips.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#d97706;font-size:16px;font-weight:bold;">💡 Practical Tips</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#78350f;font-size:14px;line-height:1.8;">
                  ${summary.practicalTips.slice(0, 3).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    // Key Points
    if (summary.keyPoints && summary.keyPoints.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#1d4ed8;font-size:16px;font-weight:bold;">📋 Key Points</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#1e3a8a;font-size:14px;line-height:1.8;">
                  ${summary.keyPoints.slice(0, 4).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    return html;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topicName} Weekly Brief</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" style="width:600px;border:none;border-spacing:0;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          ${generateKeyVisual()}

          <!-- Intro Message -->
          <tr>
            <td style="padding:25px 30px 15px;">
              <p style="margin:0;color:#64748b;font-size:15px;line-height:1.6;">
                👋 Hi there! Here's your weekly intelligence digest covering the latest developments in <strong style="color:#0d9488;">${topicName}</strong>.
                We've analyzed the news and summarized the key insights for you.
              </p>
            </td>
          </tr>

          <!-- AI Summary Section -->
          ${generateSummaryHtml()}

          <!-- Section Divider -->
          ${summary ? `
          <tr>
            <td style="padding:10px 30px 20px;">
              <div style="border-bottom:2px solid #e2e8f0;"></div>
              <p style="margin:15px 0 0;color:#94a3b8;font-size:13px;text-align:center;">📰 Top Stories This Week</p>
            </td>
          </tr>
          ` : ''}

          <!-- Top Stories -->
          ${articles.slice(0, 3).map((article, i) => `
          <tr>
            <td style="padding:0 30px 20px;">
              <table style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px;">
                    <div style="display:flex;align-items:center;margin-bottom:10px;">
                      <span style="display:inline-block;padding:4px 10px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#fff;font-size:11px;font-weight:bold;border-radius:4px;">#${i + 1} TOP STORY</span>
                    </div>
                    <h3 style="margin:10px 0;color:#1e293b;font-size:16px;line-height:1.4;">${article.title}</h3>
                    <p style="margin:0 0 15px;color:#64748b;font-size:14px;line-height:1.5;">${article.content_summary}</p>
                    <table style="width:100%;margin-bottom:15px;">
                      <tr>
                        <td style="color:#94a3b8;font-size:12px;">
                          📊 Score: <span style="color:#0d9488;font-weight:bold;">${article.importance_score}/100</span>
                        </td>
                        <td style="color:#94a3b8;font-size:12px;text-align:right;">
                          👤 ${article.source_name}
                        </td>
                      </tr>
                    </table>
                    <a href="${article.source_url}" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read Article →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}

          <!-- More Stories -->
          ${articles.length > 3 ? `
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px;color:#1e293b;font-size:18px;">📚 More This Week</h3>
              ${articles.slice(3).map(article => `
              <div style="padding:15px 0;border-bottom:1px solid #e2e8f0;">
                <a href="${article.source_url}" style="color:#1e293b;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4;display:block;">${article.title}</a>
                <p style="margin:5px 0 0;color:#94a3b8;font-size:12px;">
                  ${article.source_name} • Score: ${article.importance_score}/100
                  ${article.tags.length > 0 ? ` • ${article.tags.slice(0, 2).join(', ')}` : ''}
                </p>
              </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding:30px;background-color:#f8fafc;text-align:center;">
              <p style="margin:0 0 15px;color:#64748b;font-size:14px;">想了解更多？</p>
              <a href="${dashboardUrl}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(13,148,136,0.3);">Explore All News →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;color:#94a3b8;font-size:12px;">
                You received this email because you subscribed to ${topicName} updates.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                <a href="#" style="color:#64748b;">Unsubscribe</a> | <a href="#" style="color:#64748b;">Manage Preferences</a>
              </p>
              <p style="margin:15px 0 0;color:#cbd5e1;font-size:11px;">© 2026 5ML. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

/**
 * GET /debug/llm-status
 * Diagnostic endpoint to check LLM API key status
 */
router.get('/debug/llm-status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    llmKeys: {
      deepseek: {
        set: !!process.env.DEEPSEEK_API_KEY,
        prefix: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.substring(0, 8) + '...' : null,
        length: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0,
      },
      anthropic: {
        set: !!process.env.ANTHROPIC_API_KEY,
        isPlaceholder: process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here',
      },
      perplexity: {
        set: !!process.env.PERPLEXITY_API_KEY,
        isPlaceholder: process.env.PERPLEXITY_API_KEY === 'your-perplexity-api-key-here',
      },
      openai: {
        set: !!process.env.OPENAI_API_KEY,
      },
    },
    llmConfigsLoaded: !!LLM_CONFIGS,
    availableLLMs: Object.keys(LLM_CONFIGS).filter(llm => {
      const cfg = LLM_CONFIGS[llm];
      return cfg && process.env[cfg.envKey] && process.env[cfg.envKey] !== `your-${llm}-api-key-here`;
    }),
  };

  console.log('🔍 LLM Status Check:', JSON.stringify(status, null, 2));
  res.json(status);
});

module.exports = router;
