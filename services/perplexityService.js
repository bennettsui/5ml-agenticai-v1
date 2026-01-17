const axios = require('axios');

/**
 * Perplexity AI Service
 * Reusable service for web research and online information gathering
 * Supports reasoning mode for deeper analysis
 */

class PerplexityService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai/chat/completions';
  }

  /**
   * Check if Perplexity API is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Perform web research with reasoning mode
   * @param {string} query - The research query
   * @param {object} options - Additional options
   * @returns {Promise<object>} Research results
   */
  async research(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured. Set the API key to enable web research.');
    }

    const {
      model = 'sonar-pro', // Updated to current Perplexity API model (2026)
      maxTokens = 2000,
      temperature = 0.2,
      systemPrompt = 'You are a research analyst. Provide comprehensive, factual analysis based on current web information.',
      searchRecency = 'month', // day, week, month, year
      returnSources = true,
    } = options;

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
          search_domain_filter: [],
          return_images: false,
          return_related_questions: false,
          search_recency_filter: searchRecency,
          top_k: 0,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90 seconds for complex queries
        }
      );

      const result = {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        citations: response.data.citations || [],
      };

      // Add sources if available
      if (returnSources && response.data.citations) {
        result.sources = response.data.citations;
      }

      return result;

    } catch (error) {
      console.error('Perplexity API error:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new Error('Invalid Perplexity API key');
      }
      if (error.response?.status === 429) {
        throw new Error('Perplexity API rate limit exceeded. Please try again later.');
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Research request timed out. Query may be too complex.');
      }

      throw new Error(`Research failed: ${error.message}`);
    }
  }

  /**
   * Perform structured research with JSON output
   * @param {string} query - The research query
   * @param {string} jsonSchema - Expected JSON structure description
   * @returns {Promise<object>} Structured research results
   */
  async researchStructured(query, jsonSchema, options = {}) {
    const systemPrompt = `You are a research analyst. Provide comprehensive analysis based on current web information.
Return ONLY valid JSON in the following format (no other text):
${jsonSchema}`;

    const result = await this.research(query, {
      ...options,
      systemPrompt,
    });

    // Try to extract JSON from response
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return {
          data: parsedData,
          sources: result.sources || [],
          usage: result.usage,
        };
      }
      return {
        data: { raw: result.content },
        sources: result.sources || [],
        usage: result.usage,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        data: { raw: result.content },
        sources: result.sources || [],
        usage: result.usage,
      };
    }
  }

  /**
   * Quick market research
   */
  async marketResearch(topic, industry = '') {
    const query = `Conduct market research on: ${topic}${industry ? ` in the ${industry} industry` : ''}.

Provide:
1. Current market size and growth trends
2. Key players and competitors
3. Recent developments and innovations
4. Opportunities and challenges
5. Future outlook

Return as JSON with keys: market_size, trends, competitors, developments, opportunities, challenges, outlook, sources`;

    return this.researchStructured(query, `{
  "market_size": "current market size and growth rate",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "competitors": ["competitor 1", "competitor 2"],
  "developments": ["recent development 1", "recent development 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "challenges": ["challenge 1", "challenge 2"],
  "outlook": "future outlook summary",
  "sources": ["source 1", "source 2"]
}`, { searchRecency: 'week' });
  }

  /**
   * Competitor analysis
   */
  async competitorAnalysis(company, competitors = []) {
    const competitorList = competitors.length > 0
      ? ` Focus on: ${competitors.join(', ')}`
      : '';

    const query = `Analyze ${company}'s competitive landscape.${competitorList}

Provide:
1. Main competitors and their market positions
2. Competitive advantages and disadvantages
3. Recent strategies and moves
4. Market share comparisons
5. Recommendations

Return as JSON`;

    return this.researchStructured(query, `{
  "competitors": [{"name": "competitor name", "position": "market position", "strengths": ["strength 1"]}],
  "advantages": ["advantage 1", "advantage 2"],
  "disadvantages": ["disadvantage 1"],
  "recent_moves": ["move 1", "move 2"],
  "recommendations": ["recommendation 1"],
  "sources": ["source 1"]
}`);
  }

  /**
   * Trend analysis
   */
  async trendAnalysis(topic, timeframe = 'month') {
    const query = `Analyze current trends related to: ${topic}

Provide:
1. Emerging trends
2. Declining trends
3. Consumer sentiment
4. Industry predictions
5. Actionable insights

Return as JSON`;

    return this.researchStructured(query, `{
  "emerging_trends": ["trend 1", "trend 2"],
  "declining_trends": ["trend 1"],
  "sentiment": "overall sentiment analysis",
  "predictions": ["prediction 1", "prediction 2"],
  "insights": ["insight 1", "insight 2"],
  "sources": ["source 1"]
}`, { searchRecency: timeframe });
  }
}

// Export singleton instance
module.exports = new PerplexityService();
