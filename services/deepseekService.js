/**
 * DeepSeek AI Service
 * Provides integration with DeepSeek's API for AI analysis
 */

const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com';
    this.model = 'deepseek-chat';
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async chat(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable.');
    }

    const {
      model = this.model,
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 90000, // 90 second timeout for complex queries
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return {
          content: response.data.choices[0].message.content,
          model: response.data.model,
          usage: response.data.usage,
        };
      }

      throw new Error('Invalid response from DeepSeek API');
    } catch (error) {
      if (error.response) {
        // DeepSeek API error
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`DeepSeek API error (${status}): ${message}`);
      } else if (error.request) {
        // Network error
        throw new Error(`Network error connecting to DeepSeek: ${error.message}`);
      } else {
        // Other error
        throw new Error(`DeepSeek service error: ${error.message}`);
      }
    }
  }

  async analyze(systemPrompt, userPrompt, options = {}) {
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    return await this.chat(messages, options);
  }
}

// Export singleton instance
module.exports = new DeepSeekService();
