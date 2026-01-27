/**
 * Content Service for Topic Intelligence
 * Handles content fetching, article extraction, and analysis
 */

const { LLM_CONFIGS, getLLMConfig } = require('./llmService');

/**
 * Fetch page content from URL with timeout
 * @param {string} url - URL to fetch
 * @returns {Promise<{title: string, content: string, success: boolean, error?: string}>}
 */
async function fetchPageContent(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length for LLM processing
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
 * Extract article links from page content
 * @param {string} baseUrl - Base URL of the page
 * @param {string} content - Page content (HTML or text)
 * @returns {Array<{url: string, title: string}>}
 */
function extractArticleLinks(baseUrl, content) {
  const articles = [];
  const baseUrlObj = new URL(baseUrl);

  // Look for common article URL patterns
  const linkPatterns = [
    /href=["']([^"']*(?:article|news|post|blog|story)[^"']*)["']/gi,
    /href=["']([^"']*\/\d{4}\/\d{2}\/[^"']*)["']/gi, // Date-based URLs
    /href=["']([^"']*\.html?)["']/gi,
  ];

  const seen = new Set();

  for (const pattern of linkPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];

      // Skip common non-article links
      if (url.includes('#') || url.includes('javascript:') ||
          url.includes('mailto:') || url.includes('tel:') ||
          url.match(/\.(css|js|png|jpg|gif|svg|ico|pdf)$/i)) {
        continue;
      }

      // Make relative URLs absolute
      if (url.startsWith('/')) {
        url = `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`;
      } else if (!url.startsWith('http')) {
        url = `${baseUrlObj.protocol}//${baseUrlObj.host}/${url}`;
      }

      // Skip if already seen or external domain
      if (seen.has(url)) continue;
      seen.add(url);

      // Try to extract title from nearby text
      const titleMatch = content.match(new RegExp(`>([^<]{10,100})<[^>]*href=["']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
      const title = titleMatch ? titleMatch[1].trim() : '';

      articles.push({ url, title });

      if (articles.length >= 20) break;
    }
    if (articles.length >= 20) break;
  }

  return articles;
}

/**
 * Analyze article content for relevancy, impact, and insights using LLM
 * @param {string} title - Article title
 * @param {string} content - Article content
 * @param {string} topicName - The topic being monitored
 * @param {string[]} keywords - Topic keywords
 * @param {string} selectedLLM - LLM to use
 * @returns {Promise<object>}
 */
async function analyzeArticleContent(title, content, topicName, keywords, selectedLLM = 'deepseek') {
  const keywordsStr = keywords && keywords.length > 0 ? keywords.join(', ') : topicName;

  const prompt = `你是一位資深分析師，負責為關注「${topicName}」的專業人士評估新聞內容。
請用繁體中文回覆，語氣要輕鬆幽默但專業有料，像是跟朋友分享有趣發現一樣。

文章標題：${title}

文章內容：
${content.substring(0, 8000)}

主題關鍵字：${keywordsStr}

請分析這篇文章：
1. RELEVANCY_SCORE (0-100)：跟「${topicName}」有多相關？
2. IMPACT_SCORE (0-100)：對從業者有多重要？會不會影響飯碗？
3. SUMMARY：用 2-3 句話講重點，要有梗但不失專業
4. KEY_INSIGHTS：2-4 個重點洞察（bullet points），每個要有具體行動建議
5. ACTION_ITEMS：如果很重要 (70分以上)，列 1-3 個該馬上做的事
6. TAGS：3-5 個標籤

請回傳 JSON 格式：
{
  "relevancy_score": 85,
  "impact_score": 72,
  "summary": "這裡是摘要...",
  "key_insights": ["• 洞察一", "• 洞察二"],
  "action_items": ["• 行動一"],
  "tags": ["標籤1", "標籤2"]
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
          system: '你是一位資深新聞分析師。用繁體中文回覆，語氣輕鬆幽默但專業。只回傳 JSON 格式。',
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      responseContent = data.content[0].text;
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
            { role: 'system', content: '你是一位資深新聞分析師。用繁體中文回覆，語氣輕鬆幽默但專業。只回傳 JSON 格式。' },
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

    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
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

  const wordCount = textToAnalyze.split(/\s+/).length;
  const keywordDensity = (matchCount / Math.max(wordCount, 1)) * 100;
  const relevancyScore = Math.min(95, Math.max(20, Math.round(keywordDensity * 50 + (matchedKeywords.length * 15))));

  const urgencyWords = ['breaking', 'urgent', 'important', 'critical', 'major', 'significant', 'new', 'update', 'change', 'announce'];
  const urgencyMatches = urgencyWords.filter(word => textToAnalyze.includes(word)).length;
  const impactScore = Math.min(90, Math.max(30, 40 + (urgencyMatches * 8) + (matchCount * 3)));

  const importanceScore = Math.round((relevancyScore * 0.4) + (impactScore * 0.6));

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 2).join('. ').substring(0, 300) + (sentences.length > 2 ? '...' : '.');

  return {
    relevancy_score: relevancyScore,
    impact_score: impactScore,
    importance_score: importanceScore,
    summary: summary || `關於 ${topicName} 的文章`,
    key_insights: matchedKeywords.length > 0
      ? [`• 涵蓋主題：${matchedKeywords.slice(0, 3).join('、')}`, `• 找到 ${matchCount} 次關鍵字提及`]
      : ['• 一般產業報導'],
    action_items: importanceScore >= 70 ? ['• 建議檢閱相關更新'] : [],
    tags: [...matchedKeywords.slice(0, 3), topicName].filter((v, i, a) => a.indexOf(v) === i),
    analysis_model: '關鍵字分析（無 API 金鑰）',
  };
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  fetchPageContent,
  extractArticleLinks,
  analyzeArticleContent,
  generateKeywordBasedAnalysis,
  sleep,
};
