const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSEO(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];
  let webResearch = null;

  // If Perplexity is selected, use it for the full analysis
  if (modelSelection === 'perplexity' && perplexityService.isAvailable()) {
    return await analyzeWithPerplexity(client_name, brief, modelsUsed);
  }

  // Optionally use Perplexity for current SEO trends and competitor analysis (when using other models)
  if (shouldUsePerplexity(modelSelection)) {
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

  // Use DeepSeek if selected and available
  if (shouldUseDeepSeek(modelSelection)) {
    return await analyzeWithDeepSeek(client_name, brief, webResearch, modelSelection, no_fallback, modelsUsed);
  }

  // Build prompt with optional web research context
  const contextNote = webResearch
    ? `\n\n**最新 SEO 資訊 (來自網絡研究)**:\n${webResearch}\n\n請結合以上最新資訊和你的專業知識來提供建議。`
    : '';

  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: modelSelection === 'sonnet' ? 2000 : 1000,
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

  // Track Claude usage
  modelsUsed.push({
    model: getModelDisplayName(modelSelection),
    model_id: claudeModel,
    usage: {
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    }
  });

  const text = response.content[0].text;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    return {
      ...analysis,
      _meta: {
        models_used: modelsUsed,
        enhanced_with_web_research: !!webResearch
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        models_used: modelsUsed,
        enhanced_with_web_research: !!webResearch
      }
    };
  }
}

async function analyzeWithDeepSeek(client_name, brief, webResearch, modelSelection, no_fallback = false, modelsUsed = []) {
  const contextNote = webResearch
    ? `\n\n**最新 SEO 資訊 (來自網絡研究)**:\n${webResearch}\n\n請結合以上最新資訊和你的專業知識來提供建議。`
    : '';

  const systemPrompt = '你是一個 SEO 專家。請為以下項目提供 SEO 策略。';
  const userPrompt = `**客户**: ${client_name}
**簡報**: ${brief}${contextNote}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "target_keywords": ["關鍵詞1", "關鍵詞2"],
  "content_strategy": "內容策略描述",
  "technical_seo": ["技術1", "技術2"],
  "backlink_opportunities": ["機會1", "機會2"],
  "timeline_months": 6,
  "current_trends": ["趨勢1", "趨勢2"]
}`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 1500,
    });

    // Track DeepSeek usage
    modelsUsed.push({
      model: getModelDisplayName(modelSelection),
      model_id: 'deepseek-chat',
      usage: result.usage || {}
    });

    const text = result.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      return {
        ...analysis,
        _meta: {
          models_used: modelsUsed,
          enhanced_with_web_research: !!webResearch
        }
      };
    } catch {
      return {
        raw: text,
        _meta: {
          models_used: modelsUsed,
          enhanced_with_web_research: !!webResearch
        }
      };
    }
  } catch (error) {
    if (no_fallback) {
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
    console.error('DeepSeek error, falling back to Claude Haiku:', error.message);
    return await analyzeSEO(client_name, brief, { model: 'haiku', no_fallback: false });
  }
}

async function analyzeWithPerplexity(client_name, brief, modelsUsed = []) {
  const jsonSchema = `{
  "target_keywords": ["關鍵詞1", "關鍵詞2"],
  "content_strategy": "內容策略描述",
  "technical_seo": ["技術建議1", "技術建議2"],
  "backlink_opportunities": ["機會1", "機會2"],
  "timeline_months": 數字
}`;

  const systemPrompt = `你是一個 SEO 專家。請為以下項目提供 SEO 策略，結合2026年最新的搜索引擎算法更新和趨勢。
請返回 JSON 格式（只返回 JSON，不需要其他文本）。`;

  const userPrompt = `**客户**: ${client_name}
**簡報**: ${brief}

請提供完整的 SEO 策略，包括目標關鍵詞、內容策略、技術 SEO 建議、外鏈機會和實施時間表。

請返回以下 JSON 格式:
${jsonSchema}`;

  try {
    const result = await perplexityService.research(
      userPrompt,
      {
        systemPrompt,
        maxTokens: 2000,
        searchRecency: 'week',
        temperature: 0.3
      }
    );

    // Track Perplexity usage
    modelsUsed.push({
      model: getModelDisplayName('perplexity'),
      model_id: 'sonar-pro',
      usage: result.usage || {}
    });

    const text = result.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      return {
        ...analysis,
        _meta: {
          models_used: modelsUsed,
          enhanced_with_web_research: true,
          sources: result.citations || []
        }
      };
    } catch {
      return {
        raw: text,
        _meta: {
          models_used: modelsUsed,
          enhanced_with_web_research: true,
          sources: result.citations || []
        }
      };
    }
  } catch (error) {
    throw new Error(`Perplexity API error: ${error.message}`);
  }
}

module.exports = { analyzeSEO };
