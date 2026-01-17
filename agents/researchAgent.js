const perplexityService = require('../services/perplexityService');

/**
 * Research Agent
 * Uses Perplexity AI for comprehensive web-based research and analysis
 */

async function analyzeResearch(client_name, brief) {
  // Check if Perplexity service is available
  if (!perplexityService.isAvailable()) {
    throw new Error('PERPLEXITY_API_KEY not configured. Please set up Perplexity API to enable research capabilities.');
  }

  // Construct research query
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

  try {
    // Use structured research with reasoning
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
        searchRecency: 'week', // Get recent information
        maxTokens: 2000,
      }
    );

    return {
      ...result.data,
      _meta: {
        sources: result.sources,
        usage: result.usage,
      }
    };

  } catch (error) {
    console.error('Research agent error:', error);
    throw error;
  }
}

module.exports = { analyzeResearch };

