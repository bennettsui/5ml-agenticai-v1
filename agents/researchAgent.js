const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Research Agent
 * Uses Perplexity AI for web-based research, DeepSeek, or Claude for knowledge-based analysis
 */

async function analyzeResearch(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Try Perplexity first if requested and available
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Using Perplexity for web-based research...');
      return await researchWithPerplexity(client_name, brief, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`Perplexity API error: ${error.message}`);
      }
      console.warn('⚠️ Perplexity unavailable, falling back to DeepSeek:', error.message);
    }
  }

  // Use DeepSeek if selected and available
  if (shouldUseDeepSeek(modelSelection)) {
    try {
      console.log('🤖 Using DeepSeek for knowledge-based research...');
      return await researchWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude-based research
  console.log('🤖 Using Claude for knowledge-based research...');
  return await researchWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function researchWithPerplexity(client_name, brief, modelsUsed = []) {
  const query = `Conduct comprehensive research for the following project:

**Client**: ${client_name}
**Brief**: ${brief}

Provide detailed analysis with:
1. Market insights and current landscape
2. Competitor analysis and positioning
3. Current trends and emerging patterns
4. Opportunities and potential risks
5. Strategic recommendations
6. Relevant sources and references

Return response in JSON format with keys: market_insights, competitor_analysis, trends, opportunities, risks, recommendations, sources`;

  const result = await perplexityService.researchStructured(
    query,
    `{
  "market_insights": ["insight 1", "insight 2", "insight 3"],
  "competitor_analysis": ["competitor 1 analysis", "competitor 2 analysis"],
  "trends": ["trend 1", "trend 2", "trend 3"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "sources": ["source 1", "source 2"]
}`,
    {
      searchRecency: 'week',
      maxTokens: 2000,
    }
  );

  // Track Perplexity usage
  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    ...result.data,
    _meta: {
      models_used: modelsUsed,
      sources: result.sources,
    }
  };
}

async function researchWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: modelSelection === 'sonnet' ? 2000 : 1500,
    messages: [
      {
        role: 'user',
        content: `你是一個市場研究分析師。請為以下項目提供研究分析。

**客户**: ${client_name}
**簡報**: ${brief}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "market_insights": ["洞察1", "洞察2", "洞察3"],
  "competitor_analysis": ["競爭者1分析", "競爭者2分析"],
  "trends": ["趨勢1", "趨勢2", "趨勢3"],
  "opportunities": ["機會1", "機會2"],
  "risks": ["風險1", "風險2"],
  "recommendations": ["建議1", "建議2"]
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
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        models_used: modelsUsed,
      }
    };
  }
}

async function researchWithDeepSeek(client_name, brief, modelSelection, no_fallback = false, modelsUsed = []) {
  const systemPrompt = '你是一個研究分析師。請為以下項目進行全面的研究分析。';
  const userPrompt = `**客户**: ${client_name}
**簡報**: ${brief}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "market_insights": ["洞察1", "洞察2", "洞察3"],
  "competitor_analysis": ["競爭者1分析", "競爭者2分析"],
  "trends": ["趨勢1", "趨勢2", "趨勢3"],
  "opportunities": ["機會1", "機會2"],
  "risks": ["風險1", "風險2"],
  "recommendations": ["建議1", "建議2"]
}`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 2000,
    });

    // Track DeepSeek usage
    modelsUsed.push({
      model: getModelDisplayName(modelSelection),
      model_id: 'deepseek-reasoner',
      usage: result.usage || {}
    });

    const text = result.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      return {
        ...analysis,
        _meta: {
          models_used: modelsUsed
        }
      };
    } catch {
      return {
        raw: text,
        _meta: {
          models_used: modelsUsed
        }
      };
    }
  } catch (error) {
    if (no_fallback) {
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
    console.error('DeepSeek error, falling back to Claude Haiku:', error.message);
    return await researchWithClaude(client_name, brief, 'haiku', modelsUsed);
  }
}

module.exports = { analyzeResearch };

