const axios = require('axios');

/**
 * Perplexity Research Agent
 * Uses Perplexity API for web-based research and analysis
 */

async function analyzeResearch(client_name, brief) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a research analyst. Provide comprehensive research and analysis based on current web information. Return your response in JSON format.'
          },
          {
            role: 'user',
            content: `Conduct research for the following project:

**Client**: ${client_name}
**Brief**: ${brief}

Please return JSON format (only JSON, no other text):
{
  "market_insights": ["insight 1", "insight 2", "insight 3"],
  "competitor_analysis": ["competitor 1 info", "competitor 2 info"],
  "trends": ["trend 1", "trend 2", "trend 3"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "sources": ["source 1", "source 2"]
}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: [],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    const text = response.data.choices[0].message.content;

    // Try to extract JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: text };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return { raw: text };
    }

  } catch (error) {
    console.error('Perplexity API error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Invalid Perplexity API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Perplexity API rate limit exceeded');
    }

    throw new Error(`Research analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeResearch };
