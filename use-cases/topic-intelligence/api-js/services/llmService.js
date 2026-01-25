/**
 * LLM Service for Topic Intelligence
 * Handles all LLM API calls with multiple provider support and fallback
 */

const LLM_CONFIGS = {
  'perplexity': {
    baseUrl: 'https://api.perplexity.ai',
    model: 'sonar-pro',
    envKey: 'PERPLEXITY_API_KEY',
  },
  'claude-sonnet': {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    isAnthropic: true,
  },
  'claude-haiku': {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-20241022',
    envKey: 'ANTHROPIC_API_KEY',
    isAnthropic: true,
  },
  'deepseek': {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
};

/**
 * Get LLM configuration with fallback chain
 * @param {string} preferredLLM - Preferred LLM to use
 * @returns {{ llmUsed: string, config: object, apiKey: string }}
 */
function getLLMConfig(preferredLLM) {
  const llmPriority = [preferredLLM, 'perplexity', 'claude-sonnet', 'deepseek'];

  for (const llm of llmPriority) {
    const cfg = LLM_CONFIGS[llm];
    if (cfg && process.env[cfg.envKey]) {
      return {
        llmUsed: llm,
        config: cfg,
        apiKey: process.env[cfg.envKey],
      };
    }
  }

  throw new Error('No LLM API key configured');
}

/**
 * Call LLM API with unified interface
 * @param {string} prompt - The prompt to send
 * @param {object} config - LLM configuration
 * @param {string} apiKey - API key
 * @param {number} maxTokens - Maximum tokens in response
 * @param {string} systemPrompt - System prompt
 * @returns {Promise<{ content: string, usage: object }>}
 */
async function callLLM(prompt, config, apiKey, maxTokens = 1024, systemPrompt = 'You are a senior research analyst. Return only valid JSON.') {
  let response;
  let content;
  let usage = {};

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
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    content = data.content[0].text;
    usage = data.usage || {};
  } else {
    // OpenAI-compatible API (DeepSeek, Perplexity, etc.)
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    content = data.choices[0].message.content;
    usage = data.usage || {};
  }

  return { content, usage };
}

/**
 * Parse JSON from LLM response
 * @param {string} content - Raw LLM response
 * @returns {object} Parsed JSON
 */
function parseJSONResponse(content) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

/**
 * Get available LLMs based on configured API keys
 * @returns {string[]} List of available LLM names
 */
function getAvailableLLMs() {
  return Object.keys(LLM_CONFIGS).filter(llm => {
    const cfg = LLM_CONFIGS[llm];
    return cfg && process.env[cfg.envKey] && process.env[cfg.envKey] !== `your-${llm}-api-key-here`;
  });
}

/**
 * Get LLM status for debugging
 * @returns {object} Status of all LLM configurations
 */
function getLLMStatus() {
  return {
    deepseek: {
      set: !!process.env.DEEPSEEK_API_KEY,
      prefix: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.substring(0, 8) + '...' : null,
      length: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0,
    },
    anthropic: {
      set: !!process.env.ANTHROPIC_API_KEY,
      isPlaceholder: process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here',
    },
    perplexity: {
      set: !!process.env.PERPLEXITY_API_KEY,
      isPlaceholder: process.env.PERPLEXITY_API_KEY === 'your-perplexity-api-key-here',
    },
    openai: {
      set: !!process.env.OPENAI_API_KEY,
    },
  };
}

module.exports = {
  LLM_CONFIGS,
  getLLMConfig,
  callLLM,
  parseJSONResponse,
  getAvailableLLMs,
  getLLMStatus,
};
