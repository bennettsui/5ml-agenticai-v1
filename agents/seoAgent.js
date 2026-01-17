const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSEO(client_name, brief) {
  let webResearch = null;

  // Optionally use Perplexity for current SEO trends and competitor analysis
  if (perplexityService.isAvailable()) {
    try {
      console.log('🔍 Gathering current SEO trends via Perplexity...');
      const researchResult = await perplexityService.research(
        `Current SEO trends and best practices for: ${brief}. Focus on: latest algorithm updates, effective strategies, and keyword trends.`,
        {
          searchRecency: 'week',
          maxTokens: 800,
          systemPrompt: 'You are an SEO expert. Provide current, actionable SEO insights based on latest search engine updates and trends.'
        }
      );
      webResearch = researchResult.content;
      console.log('✅ Web research completed');
    } catch (error) {
      console.warn('⚠️ Web research unavailable, using Claude-only analysis:', error.message);
    }
  }

  // Build prompt with optional web research context
  const contextNote = webResearch
    ? `\n\n**最新 SEO 資訊 (來自網絡研究)**:\n${webResearch}\n\n請結合以上最新資訊和你的專業知識來提供建議。`
    : '';

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `你是一個 SEO 專家。請為以下項目提供 SEO 策略。

**客户**: ${client_name}
**簡報**: ${brief}${contextNote}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "target_keywords": ["關鍵詞1", "關鍵詞2"],
  "content_strategy": "內容策略描述",
  "technical_seo": ["技術1", "技術2"],
  "backlink_opportunities": ["機會1", "機會2"],
  "timeline_months": 6,
  "current_trends": ["趨勢1", "趨勢2"]
}`,
      },
    ],
  });

  const text = response.content[0].text;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    // Add metadata about web research
    if (webResearch) {
      analysis._enhanced_with_web_research = true;
    }

    return analysis;
  } catch {
    return { raw: text };
  }
}

module.exports = { analyzeSEO };
