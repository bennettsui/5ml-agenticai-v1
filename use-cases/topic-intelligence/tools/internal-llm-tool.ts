/**
 * Layer 2: Tools - Internal LLM Tool
 * Provides integration with 5ML's internal LLM API for topic intelligence
 *
 * Supported Models:
 * - 5ml-source-curator-v1 (for source discovery)
 * - 5ml-news-analyst-v1 (for news analysis)
 * - 5ml-news-writer-v1 (for newsletter writing)
 */

import axios, { AxiosError } from 'axios';

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
}

export interface LLMCallOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export type InternalLLMModel =
  | '5ml-source-curator-v1'
  | '5ml-news-analyst-v1'
  | '5ml-news-writer-v1';

// Default configurations for each model
const MODEL_DEFAULTS: Record<InternalLLMModel, LLMCallOptions> = {
  '5ml-source-curator-v1': {
    temperature: 0.3,
    maxTokens: 2000,
  },
  '5ml-news-analyst-v1': {
    temperature: 0.4,
    maxTokens: 1500,
  },
  '5ml-news-writer-v1': {
    temperature: 0.7,
    maxTokens: 3000,
  },
};

export class InternalLLMTool {
  private config: LLMConfig;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      endpoint: config?.endpoint || process.env.INTERNAL_LLM_ENDPOINT || '',
      apiKey: config?.apiKey || process.env.INTERNAL_LLM_API_KEY || '',
      timeout: config?.timeout || 120000, // 2 minutes default
    };
  }

  /**
   * Check if the tool is properly configured
   */
  isAvailable(): boolean {
    return !!(this.config.endpoint && this.config.apiKey);
  }

  /**
   * Call the internal LLM API
   */
  async callLLM(
    model: InternalLLMModel,
    prompt: string,
    context?: Record<string, unknown>,
    options?: LLMCallOptions
  ): Promise<LLMResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Internal LLM Tool not configured. Please set INTERNAL_LLM_ENDPOINT and INTERNAL_LLM_API_KEY environment variables.'
      );
    }

    // Merge default model options with provided options
    const modelDefaults = MODEL_DEFAULTS[model] || {};
    const finalOptions: LLMCallOptions = {
      ...modelDefaults,
      ...options,
    };

    // Build the system prompt based on model
    const systemPrompt = this.getSystemPrompt(model);

    // Build the user prompt with context
    const userPrompt = context
      ? `${prompt}\n\n### Context:\n${JSON.stringify(context, null, 2)}`
      : prompt;

    // Make the API call with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await axios.post(
          `${this.config.endpoint}/chat/completions`,
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: finalOptions.temperature,
            max_tokens: finalOptions.maxTokens,
            top_p: finalOptions.topP,
            frequency_penalty: finalOptions.frequencyPenalty,
            presence_penalty: finalOptions.presencePenalty,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.config.timeout,
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          return {
            content: response.data.choices[0].message.content,
            model: response.data.model || model,
            usage: response.data.usage
              ? {
                  promptTokens: response.data.usage.prompt_tokens,
                  completionTokens: response.data.usage.completion_tokens,
                  totalTokens: response.data.usage.total_tokens,
                }
              : undefined,
            finishReason: response.data.choices[0].finish_reason,
          };
        }

        throw new Error('Invalid response from Internal LLM API');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (this.shouldRetry(error, attempt)) {
          console.warn(
            `[InternalLLMTool] Attempt ${attempt}/${this.retryCount} failed, retrying in ${this.retryDelay * attempt}ms...`
          );
          await this.sleep(this.retryDelay * attempt);
          continue;
        }

        break;
      }
    }

    // All retries failed
    throw this.formatError(lastError);
  }

  /**
   * Get the system prompt for a specific model
   */
  private getSystemPrompt(model: InternalLLMModel): string {
    switch (model) {
      case '5ml-source-curator-v1':
        return `你係 5ML 既源頭策展官。你既職責係從互聯網上發掘最權威既信息源。
你既回應必須係有效既 JSON 格式。`;

      case '5ml-news-analyst-v1':
        return `你係 5ML 既新聞分析官。你既工作係從爬蟲回來既新聞中，快速判斷「呢條新聞既實際影響力」，並評分。
你既回應必須係有效既 JSON 格式。`;

      case '5ml-news-writer-v1':
        return `你係 5ML 既新聞編寫官。你既職責係將精選新聞轉化成專業、引人入勝、高轉化率既 HTML 週訊。
你既回應必須係完整既 HTML 格式。`;

      default:
        return 'You are a helpful AI assistant.';
    }
  }

  /**
   * Determine if we should retry the request
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.retryCount) return false;

    if (error instanceof AxiosError) {
      // Retry on rate limits, server errors, or network errors
      const status = error.response?.status;
      return (
        status === 429 ||
        status === 503 ||
        status === 502 ||
        status === 500 ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND'
      );
    }

    return false;
  }

  /**
   * Format error for better readability
   */
  private formatError(error: Error | null): Error {
    if (!error) {
      return new Error('Unknown error occurred');
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      return new Error(`Internal LLM API error (${status}): ${message}`);
    }

    return error;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse JSON response from LLM
   */
  parseJSONResponse<T>(response: LLMResponse): T {
    try {
      // Try to extract JSON from the response
      const content = response.content;

      // Check if content is wrapped in code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try direct JSON parse
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response from LLM: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Export singleton instance
export const internalLLMTool = new InternalLLMTool();

export default InternalLLMTool;
