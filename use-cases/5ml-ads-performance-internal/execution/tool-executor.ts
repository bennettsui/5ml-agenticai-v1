/**
 * Layer 2: Execution Engine - Tool Executor
 * Generic executor for Meta and Google Ads API tools with retry/backoff
 */

import { getCache } from '../infrastructure/cache';

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    retries: number;
    cached: boolean;
  };
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export type ToolName =
  | 'meta.fetchInsights'
  | 'meta.fetchCampaigns'
  | 'meta.fetchAdSets'
  | 'meta.fetchAds'
  | 'meta.fetchAdAccounts'
  | 'google.fetchMetrics'
  | 'google.fetchCampaigns'
  | 'google.fetchAccounts';

export interface ToolParams {
  tenantId: string;
  [key: string]: any;
}

type ToolHandler = (params: ToolParams) => Promise<any>;

export class ToolExecutor {
  private tools: Map<ToolName, ToolHandler> = new Map();
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  registerTool(name: ToolName, handler: ToolHandler): void {
    this.tools.set(name, handler);
  }

  async runTool<T = any>(
    name: ToolName,
    params: ToolParams,
    options?: { cache?: boolean; cacheTtl?: number }
  ): Promise<ToolResult<T>> {
    const startTime = Date.now();
    let retries = 0;

    const handler = this.tools.get(name);
    if (!handler) {
      return {
        success: false,
        error: `Tool not registered: ${name}`,
        metadata: { duration: 0, retries: 0, cached: false },
      };
    }

    // Check cache if enabled
    if (options?.cache) {
      const cache = getCache();
      const cacheKey = `tool:${name}:${JSON.stringify(params)}`;
      const cached = await cache.get<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: { duration: Date.now() - startTime, retries: 0, cached: true },
        };
      }
    }

    // Execute with retry logic
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    while (retries <= this.retryConfig.maxRetries) {
      try {
        // Rate limit check
        const cache = getCache();
        const rateLimitKey = `${name}:${params.tenantId}`;
        const rateLimit = await cache.checkRateLimit(rateLimitKey, 100, 60); // 100 req/min

        if (!rateLimit.allowed) {
          const waitTime = rateLimit.resetAt - Date.now();
          console.warn(`[ToolExecutor] Rate limited for ${name}, waiting ${waitTime}ms`);
          await this.sleep(Math.min(waitTime, 5000));
        }

        const result = await handler(params);

        // Cache result if enabled
        if (options?.cache) {
          const cacheKey = `tool:${name}:${JSON.stringify(params)}`;
          await cache.set(cacheKey, result, options.cacheTtl || 300);
        }

        return {
          success: true,
          data: result,
          metadata: { duration: Date.now() - startTime, retries, cached: false },
        };
      } catch (error: any) {
        lastError = error;
        retries++;

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          break;
        }

        if (retries <= this.retryConfig.maxRetries) {
          console.warn(`[ToolExecutor] ${name} failed, retry ${retries}/${this.retryConfig.maxRetries} in ${delay}ms`);
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    console.error(`[ToolExecutor] ${name} failed after ${retries} retries:`, lastError?.message);

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      metadata: { duration: Date.now() - startTime, retries, cached: false },
    };
  }

  private isRetryable(error: any): boolean {
    // Retry on network errors, rate limits, and server errors
    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'rate limit',
      'Rate limit',
      'too many requests',
      '429',
      '500',
      '502',
      '503',
      '504',
    ];

    const message = error.message || '';
    const status = error.status || error.statusCode;

    if ([429, 500, 502, 503, 504].includes(status)) {
      return true;
    }

    return retryableMessages.some((msg) => message.includes(msg));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let executorInstance: ToolExecutor | null = null;

export function getToolExecutor(): ToolExecutor {
  if (!executorInstance) {
    executorInstance = new ToolExecutor();
  }
  return executorInstance;
}

export default ToolExecutor;
