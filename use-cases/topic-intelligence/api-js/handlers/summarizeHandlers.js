/**
 * Summarize Handlers for Topic Intelligence
 * Handles news summarization with Map-Reduce for large article sets
 */

const { LLM_CONFIGS, callLLM: baseLLMCall } = require('../services/llmService');
const { inMemoryTopics } = require('./topicHandlers');

// Lazy-load dependencies
let db = null;
let notionHelper = null;

function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[SummarizeHandlers] Database module not available');
    }
  }
  return db;
}

// Token cost estimates (per 1M tokens)
const TOKEN_COSTS = {
  'claude-haiku': { input: 0.25, output: 1.25 },
  'claude-sonnet': { input: 3.00, output: 15.00 },
  'perplexity': { input: 1.00, output: 1.00 },
  'deepseek': { input: 0.14, output: 0.28 },
};

// Map-Reduce configuration
const CHUNK_SIZE = 5;
const MAX_DIRECT_ARTICLES = 6;

/**
 * Generic LLM call helper for summarization with timeout and retry
 */
async function callLLM(prompt, config, apiKey, maxTokens = 4096) {
  const timeout = 60000; // 60 seconds timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
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
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
          system: '你是情報分析師。用繁體中文回覆。只回傳 JSON。',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.content[0].text;
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
            { role: 'system', content: '你是情報分析師。用繁體中文回覆。只回傳 JSON。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`LLM API timeout after ${timeout/1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract key points from a chunk of articles (Map phase)
 */
async function extractKeyPointsFromChunk(articles, topicName, chunkIndex, llmConfig, apiKey) {
  const articleText = articles.map(a =>
    `[${a.id}] "${a.title}" (重要性：${a.importance_score}/100)\n   摘要：${a.summary}`
  ).join('\n\n');

  const prompt = `你是情報分析師。從以下關於「${topicName}」的文章中提取關鍵情報。

文章資料：
${articleText}

請提取：
1. 重要事件（最多3個）：發生什麼變化？影響誰？
2. 實用發現（最多3個）：可以採取什麼行動？
3. 趨勢觀察（1-2句）：整體方向是什麼？

回傳 JSON：
{
  "events": ["事件1 [文章編號]", "事件2 [文章編號]"],
  "findings": ["發現1 [文章編號]", "發現2 [文章編號]"],
  "trend": "趨勢觀察"
}

只回傳 JSON。`;

  const response = await callLLM(prompt, llmConfig, apiKey, 2048);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error(`   Chunk ${chunkIndex} parse error:`, e.message);
  }

  return { events: [], findings: [], trend: '' };
}

/**
 * Consolidate extracted key points into final summary (Reduce phase)
 */
async function consolidateKeyPoints(keyPointsList, topicName, totalArticles, llmConfig, apiKey) {
  const allEvents = keyPointsList.flatMap(kp => kp.events || []);
  const allFindings = keyPointsList.flatMap(kp => kp.findings || []);
  const allTrends = keyPointsList.map(kp => kp.trend).filter(t => t);

  const consolidatedInput = `
重要事件：
${allEvents.map((e, i) => `${i + 1}. ${e}`).join('\n')}

實用發現：
${allFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

趨勢觀察：
${allTrends.join('\n')}
`;

  const prompt = `你是資深策略分析師，要把情報整合成行動建議。
語氣要輕鬆但專業，像跟朋友分享業界八卦。

主題：${topicName}
分析文章數：${totalArticles}

已提取的情報：
${consolidatedInput}

請整合成以下格式（繁體中文）：

=== 輸出格式 ===
{
  "overallTrend": "2-3段趨勢分析，說明正在發生什麼變化、對誰有影響、該怎麼調整",
  "breakingNews": [
    {"text": "• 重要快訊：發生什麼、影響誰、該做什麼 [編號]", "sources": [1]}
  ],
  "practicalTips": [
    {"text": "• 建議標題：具體做法。要看的指標。為什麼有效。[編號]", "sources": [1]}
  ],
  "keyPoints": [
    {"text": "• 如果...就...（決策法則）[編號]", "sources": [1]}
  ]
}

規則：
- breakingNews: 3-5條最重要的
- practicalTips: 3-5條可執行的建議
- keyPoints: 4-6條決策法則
- 保留原本的文章編號引用
- 語氣要有梗但有料

只回傳 JSON。`;

  const response = await callLLM(prompt, llmConfig, apiKey, 8192);
  return response;
}

/**
 * Parse summary response and calculate costs
 */
function parseSummaryResponse(content, llmUsed, model, inputTokens, outputTokens) {
  console.log('   Parsing LLM response, length:', content?.length || 0);

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
    throw parseError;
  }

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
 * Direct summarization for small article sets
 */
async function generateDirectSummary(articles, topicName, config, apiKey, llmUsed) {
  const articleText = articles.map(a =>
    `[${a.id}] "${a.title}" (重要性：${a.importance_score}/100)\n    來源：${a.source_name}\n    摘要：${a.summary}`
  ).join('\n\n');

  const prompt = `你是一位資深策略分析師，同時也是個會講幹話的專家（但幹話要有料）。
請用繁體中文撰寫，語氣要像跟老朋友分享業界八卦一樣 — 輕鬆、有梗，但每句話都要有乾貨。

以下是關於「${topicName}」的新聞資料（引用請用 [編號]）：
${articleText}

=== 重要規則 ===
1. 不要講有幾篇文章或資料怎麼來的
2. 不要描述你的分析方法
3. 每個觀點要有：具體的東西、明確的變化、可執行的建議

=== 輸出格式 ===
{
  "overallTrend": "2-3段趨勢分析",
  "breakingNews": [{"text": "• 重要快訊 [編號]", "sources": [1]}],
  "practicalTips": [{"text": "• 實用建議 [編號]", "sources": [1]}],
  "keyPoints": [{"text": "• 決策法則 [編號]", "sources": [1]}]
}

只回傳 JSON。`;

  const response = await callLLM(prompt, config, apiKey, 8192);
  const inputTokensEstimate = Math.ceil(prompt.length / 4);
  const outputTokens = Math.ceil(response.length / 4);

  return parseSummaryResponse(response, llmUsed, config.model, inputTokensEstimate, outputTokens);
}

/**
 * Generate mock AI summary when no LLM is available
 */
function generateMockAISummary(articles, topicName) {
  const articleList = Array.isArray(articles) ? articles : [];

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

  const highPriorityArticles = articleList.filter(a => a.importance_score >= 80);

  const breakingNews = highPriorityArticles.slice(0, 3).map((article) => ({
    text: `• ${article.title.substring(0, 100)}${article.title.length > 100 ? '...' : ''} [${article.id}]`,
    sources: [article.id],
  }));

  return {
    summary: {
      breakingNews,
      practicalTips: [{ text: `• Review latest ${topicName} updates and adjust strategy accordingly`, sources: [] }],
      keyPoints: [{ text: `• ${articleList.length} articles analyzed for ${topicName}`, sources: [] }],
      overallTrend: `Mock summary for ${topicName}. Configure LLM API keys for real analysis.`,
    },
    meta: {
      fetchingModel: 'Database query',
      analysisModel: 'Mock (no API key)',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    },
  };
}

/**
 * Generate news summary using LLM with Map-Reduce for large article sets
 */
async function generateNewsSummary(articles, topicName, selectedLLM) {
  const llmPriority = [selectedLLM, 'deepseek', 'claude-haiku', 'perplexity'];
  let llmUsed = null;
  let config = null;
  let apiKey = null;

  console.log(`   🔍 Checking LLM availability, preferred: ${selectedLLM}`);

  for (const llm of llmPriority) {
    const cfg = LLM_CONFIGS[llm];
    const hasKey = cfg && process.env[cfg.envKey];
    console.log(`      ${llm}: ${hasKey ? '✓ available' : '✗ no key'}`);
    if (hasKey) {
      llmUsed = llm;
      config = cfg;
      apiKey = process.env[cfg.envKey];
      break;
    }
  }

  if (!config || !apiKey) {
    console.log('   ❌ No LLM API available, using mock summary');
    return generateMockAISummary(articles, topicName);
  }

  console.log(`   ✅ Using LLM: ${llmUsed} (${config.model})`);

  if (articles.length <= MAX_DIRECT_ARTICLES) {
    console.log(`   📝 Direct summarization (${articles.length} articles)`);
    return generateDirectSummary(articles, topicName, config, apiKey, llmUsed);
  }

  console.log(`   🔄 Map-Reduce summarization (${articles.length} articles in ${Math.ceil(articles.length / CHUNK_SIZE)} chunks)`);

  try {
    const chunks = [];
    for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
      chunks.push(articles.slice(i, i + CHUNK_SIZE));
    }

    console.log(`   📊 Stage 1: Extracting key points from ${chunks.length} chunks...`);
    const keyPointsList = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`      Processing chunk ${i + 1}/${chunks.length}...`);
      try {
        const keyPoints = await extractKeyPointsFromChunk(chunks[i], topicName, i + 1, config, apiKey);
        keyPointsList.push(keyPoints);
      } catch (chunkError) {
        console.error(`      ❌ Chunk ${i + 1} failed:`, chunkError.message);
        keyPointsList.push({ events: [], findings: [], trend: '' });
      }

      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    console.log(`   📊 Stage 2: Consolidating into final summary...`);
    const consolidatedResponse = await consolidateKeyPoints(keyPointsList, topicName, articles.length, config, apiKey);

    return parseSummaryResponse(consolidatedResponse, llmUsed, config.model, 0, 0);
  } catch (error) {
    console.error('   ❌ Map-Reduce failed:', error.message);
    console.log('   ⚠️ Falling back to direct summarization with top 5 articles');
    try {
      const topArticles = articles.slice(0, 5);
      return generateDirectSummary(topArticles, topicName, config, apiKey, llmUsed);
    } catch (fallbackError) {
      console.error('   ❌ Fallback also failed:', fallbackError.message);
      throw new Error(`Summary generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

/**
 * POST /summarize - Generate AI summary
 */
async function summarize(req, res) {
  const processLogs = [];
  const addLog = (type, message, details = null) => {
    processLogs.push({ type, message, details, time: new Date().toISOString() });
    console.log(`[Summary] ${type.toUpperCase()}: ${message}${details ? ` - ${details}` : ''}`);
  };

  try {
    const { topicId, llm = 'deepseek' } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, error: 'Topic ID is required' });
    }

    let articles = [];
    let topicName = 'Unknown Topic';
    const database = getDb();

    addLog('info', 'Fetching articles from database...');

    if (database && process.env.DATABASE_URL) {
      try {
        const topic = await database.getIntelligenceTopic(topicId);
        topicName = topic?.name || 'Unknown Topic';
        const dbNews = await database.getIntelligenceNews(topicId, 20);
        articles = dbNews.map((item, index) => ({
          id: index + 1,
          title: item.title,
          summary: item.summary || '',
          importance_score: item.importance_score || 50,
          source_name: item.source_name || 'Unknown Source',
          url: item.url,
        }));
        addLog('success', `Found ${articles.length} articles for "${topicName}"`);
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        addLog('error', 'Database fetch failed', dbError.message);
      }
    }

    if (articles.length === 0) {
      addLog('info', 'No articles found - run a scan first');
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
        logs: processLogs,
      });
    }

    const sortedArticles = [...articles].sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
    const articlesToSummarize = sortedArticles.slice(0, 10);

    addLog('info', `Generating AI summary using ${llm}`, `${articlesToSummarize.length} of ${articles.length} articles`);

    const result = await generateNewsSummary(articlesToSummarize, topicName, llm);

    addLog('success', 'AI summary generated', `${result.meta?.totalTokens || 0} tokens used`);

    // Save summary to database
    if (database && process.env.DATABASE_URL) {
      try {
        addLog('info', 'Saving summary to database...');
        await database.saveIntelligenceSummary(topicId, result.summary, {
          ...result.meta,
          articlesAnalyzed: articles.length,
        });
        addLog('success', 'Summary saved to database');
      } catch (dbError) {
        console.error('Failed to save summary:', dbError.message);
        addLog('error', 'Failed to save to database', dbError.message);
      }
    }

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
      logs: processLogs,
    });
  } catch (error) {
    console.error('Summary generation error:', error);

    let errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
    } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      errorMessage = 'API authentication failed. Please check your API key.';
    } else if (errorMessage.includes('context') || errorMessage.includes('token')) {
      errorMessage = 'Content too long for AI processing. Try scanning fewer articles.';
    }

    addLog('error', 'Summary generation failed', errorMessage);

    // Return logs even on error so user can see what happened
    res.status(500).json({
      success: false,
      error: errorMessage,
      logs: processLogs,
    });
  }
}

/**
 * GET /summaries/:topicId - Get saved summaries
 */
async function getSummaries(req, res) {
  try {
    const { topicId } = req.params;
    const { latest } = req.query;
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        if (latest === 'true') {
          const summary = await database.getLatestIntelligenceSummary(topicId);
          return res.json({ success: true, summary });
        } else {
          const summaries = await database.getIntelligenceSummaries(topicId);
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
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.post('/summarize', summarize);
  router.get('/summaries/:topicId', getSummaries);
}

module.exports = {
  summarize,
  getSummaries,
  generateNewsSummary,
  registerRoutes,
};
