/**
 * Layer 1: Infrastructure - Redis Cache
 * Caching for KPIs, aggregated results, and rate limiting
 */

import Redis from 'ioredis';

export interface CacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export class AdsCache {
  private client: Redis | null = null;
  private keyPrefix: string;

  constructor(private config?: CacheConfig) {
    this.keyPrefix = config?.keyPrefix || 'ads:';
  }

  async connect(): Promise<void> {
    if (this.client) return;

    const redisUrl = this.config?.url || process.env.REDIS_URL;

    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });
    } else {
      this.client = new Redis({
        host: this.config?.host || process.env.REDIS_HOST || 'localhost',
        port: this.config?.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: this.config?.password || process.env.REDIS_PASSWORD,
        db: this.config?.db || 0,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    }

    this.client.on('error', (err) => {
      console.error('[AdsCache] Redis error:', err.message);
    });

    this.client.on('connect', () => {
      console.log('[AdsCache] Connected to Redis');
    });

    try {
      await this.client.connect();
    } catch (error) {
      console.warn('[AdsCache] Redis not available, using memory fallback');
      this.client = null;
    }
  }

  private fullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  // Basic operations
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(this.fullKey(key));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(this.fullKey(key), ttlSeconds, serialized);
      } else {
        await this.client.set(this.fullKey(key), serialized);
      }
    } catch (error) {
      console.warn('[AdsCache] Set failed:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(this.fullKey(key));
    } catch (error) {
      console.warn('[AdsCache] Delete failed:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(this.fullKey(pattern));
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.warn('[AdsCache] Delete pattern failed:', error);
    }
  }

  // KPI caching
  async cacheKpis(tenantId: string, platform: string, dateRange: string, kpis: any): Promise<void> {
    const key = `kpis:${tenantId}:${platform}:${dateRange}`;
    await this.set(key, kpis, 300); // 5 minutes
  }

  async getKpis(tenantId: string, platform: string, dateRange: string): Promise<any | null> {
    const key = `kpis:${tenantId}:${platform}:${dateRange}`;
    return this.get(key);
  }

  // Aggregated results caching
  async cacheAggregation(tenantId: string, queryHash: string, data: any, ttl = 600): Promise<void> {
    const key = `agg:${tenantId}:${queryHash}`;
    await this.set(key, data, ttl);
  }

  async getAggregation(tenantId: string, queryHash: string): Promise<any | null> {
    const key = `agg:${tenantId}:${queryHash}`;
    return this.get(key);
  }

  // Rate limiting for API calls
  async checkRateLimit(resource: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (!this.client) {
      return { allowed: true, remaining: limit, resetAt: 0 };
    }

    const key = this.fullKey(`ratelimit:${resource}`);
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      // Remove old entries
      await this.client.zremrangebyscore(key, 0, windowStart);

      // Count current entries
      const count = await this.client.zcard(key);

      if (count >= limit) {
        const resetAt = await this.client.zrange(key, 0, 0, 'WITHSCORES');
        return {
          allowed: false,
          remaining: 0,
          resetAt: resetAt.length > 1 ? parseInt(resetAt[1]) + (windowSeconds * 1000) : now + (windowSeconds * 1000),
        };
      }

      // Add new entry
      await this.client.zadd(key, now, `${now}`);
      await this.client.expire(key, windowSeconds);

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetAt: now + (windowSeconds * 1000),
      };
    } catch (error) {
      console.warn('[AdsCache] Rate limit check failed:', error);
      return { allowed: true, remaining: limit, resetAt: 0 };
    }
  }

  // Job locking for distributed execution
  async acquireLock(lockKey: string, ttlSeconds = 300): Promise<boolean> {
    if (!this.client) return true;
    try {
      const result = await this.client.set(
        this.fullKey(`lock:${lockKey}`),
        Date.now().toString(),
        'EX',
        ttlSeconds,
        'NX'
      );
      return result === 'OK';
    } catch {
      return true;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.del(`lock:${lockKey}`);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
}

// Singleton instance
let cacheInstance: AdsCache | null = null;

export function getCache(config?: CacheConfig): AdsCache {
  if (!cacheInstance) {
    cacheInstance = new AdsCache(config);
  }
  return cacheInstance;
}

export default AdsCache;
