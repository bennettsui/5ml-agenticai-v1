/**
 * MiniMax AI Service
 * Provides integration with MiniMax's OpenAI-compatible API for text conversation
 * Default model: MiniMax-Text-01 (MiniMax 2.5)
 */

const axios = require('axios');

class MiniMaxService {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY;
    this.baseURL = 'https://api.minimaxi.chat/v1/chat/completions';
    this.model = 'MiniMax-Text-01';
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async chat(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('MiniMax API key not configured. Please set MINIMAX_API_KEY environment variable.');
    }

    const {
      model = this.model,
      maxTokens = 2000,
      temperature = 0.7,
    } = options;

    try {
      const response = await axios.post(
        this.baseURL,
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
          timeout: 90000, // 90 second timeout
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return {
          content: response.data.choices[0].message.content,
          model: response.data.model || model,
          usage: response.data.usage,
        };
      }

      throw new Error('Invalid response from MiniMax API');
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`MiniMax API error (${status}): ${message}`);
      } else if (error.request) {
        throw new Error(`Network error connecting to MiniMax: ${error.message}`);
      } else {
        throw new Error(`MiniMax service error: ${error.message}`);
      }
    }
  }

  async analyze(systemPrompt, userPrompt, options = {}) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    return await this.chat(messages, options);
  }
}

// Export singleton instance
module.exports = new MiniMaxService();
