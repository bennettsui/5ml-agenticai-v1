const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSocial(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek' } = options;
  let webResearch = null;

  // Optionally use Perplexity for current social media trends
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Gathering current social media trends via Perplexity...');
      const researchResult = await perplexityService.research(
        `Current social media trends, viral content strategies, and platform algorithm updates for: ${brief}. Focus on what's working now in 2026.`,
        {
          searchRecency: 'week',
          maxTokens: 800,
          systemPrompt: 'You are a social media strategist. Provide current, actionable insights about social media trends, viral content, and platform updates.'
        }
      );
      webResearch = researchResult.content;
      console.log('✅ Web research completed');
    } catch (error) {
      console.warn('⚠️ Web research unavailable, using Claude-only analysis:', error.message);
    }
  }

  // Use DeepSeek if selected and available
  if (shouldUseDeepSeek(modelSelection)) {
    return await analyzeWithDeepSeek(client_name, brief, webResearch, modelSelection);
  }

  // Build prompt with optional web research context
  const contextNote = webResearch
    ? `\n\n**最新社交媒體趨勢 (來自網絡研究)**:\n${webResearch}\n\n請結合以上最新趨勢和你的專業知識來提供建議。`
    : '';

  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: modelSelection === 'sonnet' ? 2000 : 1000,
    messages: [
      {
        role: 'user',
        content: `你是一個社交媒體策略師。請為以下項目提供社交媒體策略。

**客户**: ${client_name}
**簡報**: ${brief}${contextNote}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "primary_platforms": ["平台1", "平台2"],
  "content_pillars": ["支柱1", "支柱2"],
  "posting_frequency": "每周次數",
  "engagement_strategy": "互動策略描述",
  "hashtag_strategy": ["hashtag1", "hashtag2"],
  "trending_formats": ["格式1", "格式2"]
}`,
      },
    ],
  });

  const text = response.content[0].text;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    return {
      ...analysis,
      _meta: {
        model: getModelDisplayName(modelSelection),
        enhanced_with_web_research: !!webResearch
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        model: getModelDisplayName(modelSelection),
        enhanced_with_web_research: !!webResearch
      }
    };
  }
}

async function analyzeWithDeepSeek(client_name, brief, webResearch, modelSelection) {
  const contextNote = webResearch
    ? `\n\n**最新社交媒體趨勢 (來自網絡研究)**:\n${webResearch}\n\n請結合以上最新趨勢和你的專業知識來提供建議。`
    : '';

  const systemPrompt = '你是一個社交媒體策略師。請為以下項目提供社交媒體策略。';
  const userPrompt = `**客户**: ${client_name}
**簡報**: ${brief}${contextNote}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "primary_platforms": ["平台1", "平台2"],
  "content_pillars": ["支柱1", "支柱2"],
  "posting_frequency": "每周次數",
  "engagement_strategy": "互動策略描述",
  "hashtag_strategy": ["hashtag1", "hashtag2"],
  "trending_formats": ["格式1", "格式2"]
}`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 1500,
    });

    const text = result.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      return {
        ...analysis,
        _meta: {
          model: getModelDisplayName(modelSelection),
          enhanced_with_web_research: !!webResearch,
          usage: result.usage
        }
      };
    } catch {
      return {
        raw: text,
        _meta: {
          model: getModelDisplayName(modelSelection),
          enhanced_with_web_research: !!webResearch,
          usage: result.usage
        }
      };
    }
  } catch (error) {
    console.error('DeepSeek error, falling back to Claude Haiku:', error.message);
    return await analyzeSocial(client_name, brief, { model: 'haiku' });
  }
}

module.exports = { analyzeSocial };
