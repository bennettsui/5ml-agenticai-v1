/**
 * Source Handlers for Topic Intelligence
 * Handles source discovery and management
 */

const { LLM_CONFIGS } = require('../services/llmService');
const { inMemoryTopics, inMemorySources } = require('./topicHandlers');

// Lazy-load database
let db = null;
function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[SourceHandlers] Database module not available');
    }
  }
  return db;
}

/**
 * Build prompt for source discovery
 */
function buildPrompt(topicName, keywords, mode, languages, regions, timeframe, objectives = '') {
  const keywordsStr = keywords.length > 0 ? keywords.join(', ') : topicName;
  const languagesStr = languages ? (Array.isArray(languages) ? languages.join(', ') : languages) : 'English, Traditional Chinese';
  const regionsStr = regions ? (Array.isArray(regions) ? regions.join(', ') : regions) : 'Global, Asia-Pacific';
  const timeframeStr = timeframe || 'last 3 months';

  const objectivesSection = objectives
    ? `\n\n**Research Objectives:**\n${objectives}\n\nPlease prioritize sources that directly address these objectives.`
    : '';

  const QUALITY_FILTER_SUFFIX = `When choosing sources:
- Prioritise credibility (official, peer-reviewed, established firms, recognised experts).
- Avoid low-quality SEO farm content and generic listicles unless they add unique value.
- Prefer sources with:
  • clear authorship,
  • methodological transparency,
  • and regular updates.
- If there are major disagreements between sources, briefly note them.`;

  if (mode === 'comprehensive') {
    return `You are a senior research analyst identifying authoritative sources for "${topicName}".
${objectivesSection}

Find 12-15 high-quality sources covering:
1. Official sources (company blogs, documentation)
2. Industry analysts and research firms
3. Reputable news outlets
4. Expert blogs and thought leaders
5. Academic/research papers
6. Community forums and discussions

Keywords to focus on: ${keywordsStr}
Languages: ${languagesStr}
Regions: ${regionsStr}
Timeframe: ${timeframeStr}

${QUALITY_FILTER_SUFFIX}

Return JSON format:
{
  "executive_summary": "Brief overview of the source landscape",
  "sources": [
    {
      "name": "Source Name",
      "title": "Full title",
      "type": "official|analyst|news|expert|academic|community",
      "primary_url": "https://...",
      "content_types": ["articles", "reports"],
      "posting_frequency": "daily|weekly|monthly",
      "authority_score": 85,
      "why_selected": "Reason for selection",
      "freshness": "Last updated info",
      "priority": "high|medium|low"
    }
  ],
  "search_queries": ["query1", "query2"]
}`;
  }

  return `You are a research analyst identifying key sources for "${topicName}".
${objectivesSection}

Find 5-8 high-quality sources quickly.
Keywords: ${keywordsStr}
Languages: ${languagesStr}

${QUALITY_FILTER_SUFFIX}

Return JSON format:
{
  "sources": [
    {
      "name": "Source Name",
      "title": "Full title",
      "type": "official|analyst|news|expert",
      "primary_url": "https://...",
      "authority_score": 85,
      "why_selected": "Reason"
    }
  ]
}`;
}

/**
 * Call LLM API to discover sources
 */
async function callLLMForSources(topicName, keywords, mode, selectedLLM, languages, regions, timeframe, objectives = '') {
  const prompt = buildPrompt(topicName, keywords, mode, languages, regions, timeframe, objectives);

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
        messages: [{ role: 'user', content: prompt }],
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
  } else {
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
 * Generate mock sources for demo
 */
function generateMockSources(topicName, keywords, mode = 'comprehensive') {
  const baseTemplates = [
    {
      name: 'Industry News Daily',
      title: `${topicName} Industry News`,
      type: 'news',
      primary_url: 'https://example.com/news',
      content_types: ['articles', 'analysis'],
      posting_frequency: 'daily',
      authority_score: 85,
      why_selected: 'Leading industry news source',
      freshness: 'updated daily',
      priority: 'high',
    },
    {
      name: 'Expert Blog',
      title: `${topicName} Expert Insights`,
      type: 'expert',
      primary_url: 'https://example.com/blog',
      content_types: ['analysis', 'opinion'],
      posting_frequency: 'weekly',
      authority_score: 80,
      why_selected: 'Thought leader in the space',
      freshness: 'updated weekly',
      priority: 'medium',
    },
  ];

  return baseTemplates.map((template, idx) => ({
    ...template,
    source_id: `mock-source-${Date.now()}-${idx}`,
    name: template.name.replace('Industry', topicName),
  }));
}

/**
 * Generate mock search queries
 */
function generateMockSearchQueries(topicName, keywords) {
  const queries = [
    `${topicName} latest news`,
    `${topicName} trends 2026`,
    `${topicName} analysis`,
  ];

  keywords.forEach(kw => {
    queries.push(`${kw} ${topicName}`);
  });

  return queries.slice(0, 5);
}

/**
 * POST /sources/discover - Discover sources for a topic
 */
async function discoverSources(req, res) {
  try {
    const {
      topicName,
      objectives = '',
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
    console.log(`   Objectives: ${objectives || '(none specified)'}`);
    console.log(`   Mode: ${mode}, LLM: ${llm}`);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
    const hasClaude = !!process.env.ANTHROPIC_API_KEY;
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    let discoveredSources;
    let executiveSummary;
    let searchQueries;
    let actualLLMUsed = llm;

    const llmAvailable = hasPerplexity || hasClaude || hasDeepSeek || hasOpenAI;

    if (llmAvailable) {
      try {
        const result = await callLLMForSources(topicName, keywords, mode, llm, languages, regions, timeframe, objectives);
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
}

/**
 * GET /topics/:id/sources - Get sources for a topic
 */
async function getTopicSources(req, res) {
  try {
    const topicId = req.params.id;
    let sources = [];
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        sources = await database.getIntelligenceSources(topicId);
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
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
}

/**
 * POST /topics/:id/sources - Add sources to a topic
 */
async function addTopicSources(req, res) {
  try {
    const topicId = req.params.id;
    const { sources: newSources = [] } = req.body;

    if (!newSources.length) {
      return res.status(400).json({ success: false, error: 'At least one source is required' });
    }

    let savedSources = [];
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        const topic = await database.getIntelligenceTopic(topicId);
        if (!topic) {
          return res.status(404).json({ success: false, error: 'Topic not found' });
        }

        const sourcesWithIds = newSources.map(s => ({
          ...s,
          source_id: s.source_id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        savedSources = await database.saveIntelligenceSources(topicId, sourcesWithIds);
        console.log(`✅ Added ${savedSources.length} sources to topic ${topicId}`);
      } catch (dbError) {
        console.error('Database save failed:', dbError.message);
        newSources.forEach(source => {
          const sourceId = source.source_id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          inMemorySources.set(sourceId, { ...source, source_id: sourceId, topicId });
          savedSources.push({ ...source, source_id: sourceId });
        });
      }
    } else {
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
}

/**
 * DELETE /sources/:id - Delete a source
 */
async function deleteSource(req, res) {
  try {
    const { id } = req.params;
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        const source = await database.deleteIntelligenceSource(id);
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
}

/**
 * DELETE /topics/:id/sources/:sourceId - Remove source from topic
 */
async function removeTopicSource(req, res) {
  try {
    const { id: topicId, sourceId } = req.params;
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        console.log(`🗑️ Would delete source ${sourceId} from topic ${topicId}`);
      } catch (dbError) {
        console.error('Database delete failed:', dbError.message);
      }
    }

    inMemorySources.delete(sourceId);

    res.json({
      success: true,
      message: 'Source removed',
    });
  } catch (error) {
    console.error('Error removing source:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.post('/sources/discover', discoverSources);
  router.get('/topics/:id/sources', getTopicSources);
  router.post('/topics/:id/sources', addTopicSources);
  router.delete('/sources/:id', deleteSource);
  router.delete('/topics/:id/sources/:sourceId', removeTopicSource);
}

module.exports = {
  discoverSources,
  getTopicSources,
  addTopicSources,
  deleteSource,
  removeTopicSource,
  registerRoutes,
  // Export utilities for other handlers
  generateMockSources,
  generateMockSearchQueries,
};
