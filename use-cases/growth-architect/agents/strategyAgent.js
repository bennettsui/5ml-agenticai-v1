/**
 * Growth Strategy Agent
 * Refines ICP, value prop, and generates hypotheses for growth experiments
 * Handles Block 1 (PMF & ICP) and Block 2 (Funnel & Growth Loops)
 */

const deepseekService = require('../../../services/deepseekService');
const ragService = require('../../../services/rag-service');
const { getClaudeModel } = require('../../../utils/modelHelper');

async function analyzeGrowthStrategy(brand_name, product_brief, icp_initial = null, channels = [], options = {}) {
  const { model = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  try {
    // Get context from RAG (past strategies for this brand or similar)
    let ragContext = '';
    try {
      const relevantDocs = await ragService.search(
        `Growth strategy for ${brand_name}: ${product_brief}`,
        { useCase: 'growth', topK: 3 }
      );
      if (relevantDocs && relevantDocs.length > 0) {
        ragContext = `\n\nPast Strategy Context:\n${relevantDocs.map(d => d.content).join('\n')}`;
      }
    } catch (e) {
      console.warn('RAG context not available:', e.message);
    }

    const systemPrompt = `You are a Growth Strategy Agent for 5ML. Analyze a product/service and generate:
1. ICP Segments - WHO: Detailed customer personas, pain points, desired outcomes
2. Value Proposition - WHAT: Core message, differentiation, key benefits
3. Growth Hypotheses - Testable assumptions about who will buy and why
4. Funnel Stages - Awareness, Acquisition, Activation, Revenue, Retention, Referral with specific channels
5. Growth Loops - Describe key feedback loops (e.g., Acquisition → Activation → Retention → Referral)

Output as valid JSON with these exact keys:
{
  "icp_segments": [{ "name": "...", "pains": [...], "desires": [...], "size_estimate": "..." }],
  "value_prop": "...",
  "primary_hypothesis": "...",
  "secondary_hypotheses": [...],
  "funnel_stages": {
    "awareness": { "channels": [...], "tactics": [...] },
    "acquisition": { "channels": [...], "tactics": [...] },
    ...
  },
  "growth_loops": [{ "name": "...", "description": "...", "nodes": [...] }],
  "recommended_channels": [...],
  "experiments_to_run": [...]
}`;

    const userPrompt = `Analyze this product/service for growth:

Brand: ${brand_name}
Product Brief: ${product_brief}
${icp_initial ? `Initial ICP: ${icp_initial}` : ''}
${channels.length > 0 ? `Available Channels: ${channels.join(', ')}` : ''}
${ragContext}

Generate detailed, actionable growth strategy.`;

    let strategyResult;

    // Try DeepSeek first
    if (model === 'deepseek') {
      try {
        strategyResult = await deepseekService.analyze(systemPrompt, userPrompt, {
          thinking_budget: 8000,
        });
        modelsUsed.push('deepseek-reasoner');
      } catch (deepseekError) {
        console.warn('DeepSeek error:', deepseekError.message);
        if (!no_fallback) {
          // Fallback to Claude
          const claudeModel = getClaudeModel('claude');
          const response = await (global.claudeLLM || require('../../../lib/llm')).chat(
            getClaudeModel('claude'),
            [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
            { max_tokens: 3000 }
          );
          strategyResult = response.text;
          modelsUsed.push(response.model || 'claude-sonnet-4-5');
        } else {
          throw deepseekError;
        }
      }
    }

    // Parse JSON response
    let parsedStrategy;
    try {
      // Extract JSON if wrapped in markdown
      const jsonMatch = strategyResult.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : strategyResult;
      parsedStrategy = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse strategy JSON, returning raw:', parseError.message);
      parsedStrategy = { raw_response: strategyResult };
    }

    return {
      brand_name,
      icp_segments: parsedStrategy.icp_segments || [],
      value_prop: parsedStrategy.value_prop || '',
      hypotheses: [
        parsedStrategy.primary_hypothesis,
        ...(parsedStrategy.secondary_hypotheses || []),
      ].filter(Boolean),
      funnel_stages: parsedStrategy.funnel_stages || {},
      growth_loops: parsedStrategy.growth_loops || [],
      recommended_channels: parsedStrategy.recommended_channels || [],
      experiments: parsedStrategy.experiments_to_run || [],
      _meta: {
        models_used: modelsUsed,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Strategy Agent error:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeGrowthStrategy,
};
