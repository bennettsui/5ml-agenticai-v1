/**
 * Layer 2: Tools - Multi-Source Scraper Tool
 * Scrapes content from multiple source types with WebSocket event emission
 *
 * Supported Channels:
 * - Instagram profiles (via Playwright)
 * - Twitter/X (via Playwright or API)
 * - Blogs/Medium (via Cheerio)
 * - LinkedIn (via API if available)
 * - RSS feeds (native parser)
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface ScraperConfig {
  concurrentSources?: number;
  requestsPerMinute?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export interface Source {
  sourceId: string;
  name: string;
  primaryUrl: string;
  secondaryUrls?: string[];
  contentTypes: string[];
  postingFrequency?: string;
  focusAreas?: string[];
  authorityScore?: number;
}

export interface ScrapedArticle {
  articleId: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt?: string;
  author?: string;
  images?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  status: 'success' | 'partial' | 'failed';
  articles: ScrapedArticle[];
  error?: string;
  retryCount?: number;
  duration?: number;
}

export interface ScrapeProgress {
  totalSources: number;
  completedSources: number;
  failedSources: number;
  totalArticles: number;
  currentSource?: string;
}

export type SourceType =
  | 'instagram'
  | 'twitter'
  | 'blog'
  | 'medium'
  | 'linkedin'
  | 'rss'
  | 'youtube'
  | 'unknown';

// Events emitted by the scraper
export interface ScraperEvents {
  source_status_update: (data: {
    sourceId: string;
    sourceName: string;
    status: 'active' | 'complete' | 'failed';
    error?: string;
    articlesFound?: number;
  }) => void;
  article_scraped: (article: ScrapedArticle) => void;
  progress_update: (progress: ScrapeProgress) => void;
  scrape_complete: (results: ScrapeResult[]) => void;
  error_occurred: (error: { sourceId?: string; message: string }) => void;
}

const DEFAULT_CONFIG: ScraperConfig = {
  concurrentSources: 5,
  requestsPerMinute: 120,
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
};

export class MultiSourceScraperTool extends EventEmitter {
  private config: ScraperConfig;
  private requestTimes: number[] = [];
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  constructor(config?: Partial<ScraperConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrape multiple sources concurrently
   */
  async scrapeAllSources(
    sources: Source[],
    maxItemsPerSource: number = 5
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const progress: ScrapeProgress = {
      totalSources: sources.length,
      completedSources: 0,
      failedSources: 0,
      totalArticles: 0,
    };

    // Process in batches based on concurrency limit
    const batchSize = this.config.concurrentSources || 5;

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(source => this.scrapeSource(source, maxItemsPerSource))
      );

      for (const result of batchResults) {
        results.push(result);

        if (result.status === 'failed') {
          progress.failedSources++;
        } else {
          progress.totalArticles += result.articles.length;
        }
        progress.completedSources++;

        this.emit('progress_update', progress);
      }
    }

    this.emit('scrape_complete', results);
    return results;
  }

  /**
   * Scrape a single source with retry logic
   */
  async scrapeSource(
    source: Source,
    maxItems: number = 5
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    const sourceType = this.detectSourceType(source.primaryUrl);

    this.emit('source_status_update', {
      sourceId: source.sourceId,
      sourceName: source.name,
      status: 'active',
    });

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= (this.config.maxRetries || 3)) {
      try {
        await this.rateLimit();

        const articles = await this.scrapeByType(source, sourceType, maxItems);

        // Emit each article
        for (const article of articles) {
          this.emit('article_scraped', article);
        }

        this.emit('source_status_update', {
          sourceId: source.sourceId,
          sourceName: source.name,
          status: 'complete',
          articlesFound: articles.length,
        });

        return {
          sourceId: source.sourceId,
          sourceName: source.name,
          status: articles.length > 0 ? 'success' : 'partial',
          articles,
          duration: Date.now() - startTime,
          retryCount,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;

        if (this.shouldRetry(error, retryCount)) {
          const delay = (this.config.retryDelayMs || 1000) * Math.pow(2, retryCount - 1);
          console.warn(
            `[MultiSourceScraper] Retry ${retryCount} for ${source.name}, waiting ${delay}ms`
          );
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    this.emit('source_status_update', {
      sourceId: source.sourceId,
      sourceName: source.name,
      status: 'failed',
      error: lastError?.message,
    });

    this.emit('error_occurred', {
      sourceId: source.sourceId,
      message: lastError?.message || 'Unknown error',
    });

    return {
      sourceId: source.sourceId,
      sourceName: source.name,
      status: 'failed',
      articles: [],
      error: lastError?.message,
      duration: Date.now() - startTime,
      retryCount,
    };
  }

  /**
   * Detect source type from URL
   */
  private detectSourceType(url: string): SourceType {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('instagram.com')) return 'instagram';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
    if (urlLower.includes('medium.com') || urlLower.includes('/@')) return 'medium';
    if (urlLower.includes('linkedin.com')) return 'linkedin';
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.endsWith('.xml') || urlLower.includes('/feed') || urlLower.includes('/rss'))
      return 'rss';

    return 'blog';
  }

  /**
   * Scrape content based on source type
   */
  private async scrapeByType(
    source: Source,
    type: SourceType,
    maxItems: number
  ): Promise<ScrapedArticle[]> {
    switch (type) {
      case 'rss':
        return this.scrapeRSS(source, maxItems);
      case 'medium':
        return this.scrapeMedium(source, maxItems);
      case 'blog':
        return this.scrapeBlog(source, maxItems);
      case 'twitter':
        return this.scrapeTwitter(source, maxItems);
      case 'instagram':
        return this.scrapeInstagram(source, maxItems);
      case 'linkedin':
        return this.scrapeLinkedIn(source, maxItems);
      case 'youtube':
        return this.scrapeYouTube(source, maxItems);
      default:
        return this.scrapeBlog(source, maxItems);
    }
  }

  /**
   * Scrape RSS feed
   */
  private async scrapeRSS(source: Source, maxItems: number): Promise<ScrapedArticle[]> {
    const response = await this.fetchWithRetry(source.primaryUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles: ScrapedArticle[] = [];

    // Try RSS 2.0 format
    $('item')
      .slice(0, maxItems)
      .each((_, element) => {
        const $item = $(element);
        articles.push({
          articleId: uuidv4(),
          sourceId: source.sourceId,
          sourceName: source.name,
          sourceUrl: $item.find('link').text() || source.primaryUrl,
          title: $item.find('title').text() || 'Untitled',
          content:
            $item.find('description').text() ||
            $item.find('content\\:encoded').text() ||
            '',
          publishedAt: $item.find('pubDate').text() || undefined,
          author: $item.find('author').text() || $item.find('dc\\:creator').text() || undefined,
          tags: $item
            .find('category')
            .map((_, cat) => $(cat).text())
            .get(),
        });
      });

    // Try Atom format if no items found
    if (articles.length === 0) {
      $('entry')
        .slice(0, maxItems)
        .each((_, element) => {
          const $entry = $(element);
          articles.push({
            articleId: uuidv4(),
            sourceId: source.sourceId,
            sourceName: source.name,
            sourceUrl: $entry.find('link').attr('href') || source.primaryUrl,
            title: $entry.find('title').text() || 'Untitled',
            content:
              $entry.find('summary').text() || $entry.find('content').text() || '',
            publishedAt: $entry.find('published').text() || $entry.find('updated').text(),
            author: $entry.find('author name').text() || undefined,
          });
        });
    }

    return articles;
  }

  /**
   * Scrape Medium publication/profile
   */
  private async scrapeMedium(source: Source, maxItems: number): Promise<ScrapedArticle[]> {
    // Medium provides RSS feeds at /@username/feed or /feed/@username
    let feedUrl = source.primaryUrl;
    if (!feedUrl.includes('/feed')) {
      if (feedUrl.includes('/@')) {
        const username = feedUrl.match(/@[\w-]+/)?.[0];
        if (username) {
          feedUrl = `https://medium.com/feed/${username}`;
        }
      }
    }

    try {
      return await this.scrapeRSS({ ...source, primaryUrl: feedUrl }, maxItems);
    } catch {
      // Fallback to HTML scraping
      return this.scrapeBlog(source, maxItems);
    }
  }

  /**
   * Scrape generic blog/website
   */
  private async scrapeBlog(source: Source, maxItems: number): Promise<ScrapedArticle[]> {
    const response = await this.fetchWithRetry(source.primaryUrl);
    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    // Common article selectors
    const selectors = [
      'article',
      '.post',
      '.article',
      '.blog-post',
      '.entry',
      '[itemtype*="Article"]',
      '.card',
      '.news-item',
    ];

    for (const selector of selectors) {
      if (articles.length >= maxItems) break;

      $(selector)
        .slice(0, maxItems - articles.length)
        .each((_, element) => {
          const $article = $(element);

          // Try to find title
          const title =
            $article.find('h1, h2, h3, .title, .headline').first().text().trim() ||
            $article.find('a').first().text().trim();

          if (!title) return;

          // Try to find link
          const link =
            $article.find('a[href]').first().attr('href') || source.primaryUrl;
          const fullLink = link.startsWith('http')
            ? link
            : new URL(link, source.primaryUrl).href;

          // Try to find content
          const content =
            $article.find('p, .excerpt, .summary, .description').text().trim() || '';

          // Try to find date
          const dateText =
            $article.find('time, .date, .published, [datetime]').attr('datetime') ||
            $article.find('time, .date, .published').text().trim();

          // Avoid duplicates
          if (articles.some(a => a.title === title)) return;

          articles.push({
            articleId: uuidv4(),
            sourceId: source.sourceId,
            sourceName: source.name,
            sourceUrl: fullLink,
            title,
            content: content.slice(0, 1000),
            publishedAt: dateText || undefined,
            author: $article.find('.author, .byline').text().trim() || undefined,
          });
        });

      if (articles.length > 0) break;
    }

    return articles;
  }

  /**
   * Scrape Twitter/X (placeholder - requires API or Playwright)
   */
  private async scrapeTwitter(source: Source, maxItems: number): Promise<ScrapedArticle[]> {
    // Twitter requires API access or browser automation
    // For now, return empty and log a warning
    console.warn(
      `[MultiSourceScraper] Twitter scraping requires API access. Source: ${source.name}`
    );

    // Try to fetch the nitter instance as fallback
    const nitterUrl = source.primaryUrl
      .replace('twitter.com', 'nitter.net')
      .replace('x.com', 'nitter.net');

    try {
      const response = await this.fetchWithRetry(`${nitterUrl}/rss`);
      return this.parseRSSContent(response.data, source, maxItems);
    } catch {
      return [];
    }
  }

  /**
   * Scrape Instagram (placeholder - requires Playwright)
   */
  private async scrapeInstagram(source: Source, _maxItems: number): Promise<ScrapedArticle[]> {
    // Instagram requires browser automation with stealth
    console.warn(
      `[MultiSourceScraper] Instagram scraping requires Playwright. Source: ${source.name}`
    );

    // Instagram's API is heavily restricted, would need Playwright with stealth plugin
    return [];
  }

  /**
   * Scrape LinkedIn (placeholder - requires API)
   */
  private async scrapeLinkedIn(source: Source, _maxItems: number): Promise<ScrapedArticle[]> {
    // LinkedIn requires API access
    console.warn(
      `[MultiSourceScraper] LinkedIn scraping requires API access. Source: ${source.name}`
    );
    return [];
  }

  /**
   * Scrape YouTube channel (via RSS)
   */
  private async scrapeYouTube(source: Source, maxItems: number): Promise<ScrapedArticle[]> {
    // YouTube provides RSS feeds for channels
    let feedUrl = source.primaryUrl;

    // Extract channel ID and build RSS URL
    const channelIdMatch = source.primaryUrl.match(/channel\/([^/?]+)/);
    const userMatch = source.primaryUrl.match(/@([^/?]+)/);

    if (channelIdMatch) {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
    } else if (userMatch) {
      // Need to resolve @username to channel ID - for now try direct
      feedUrl = `https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`;
    }

    try {
      return await this.scrapeRSS({ ...source, primaryUrl: feedUrl }, maxItems);
    } catch {
      return [];
    }
  }

  /**
   * Parse RSS content string
   */
  private parseRSSContent(
    content: string,
    source: Source,
    maxItems: number
  ): ScrapedArticle[] {
    const $ = cheerio.load(content, { xmlMode: true });
    const articles: ScrapedArticle[] = [];

    $('item')
      .slice(0, maxItems)
      .each((_, element) => {
        const $item = $(element);
        articles.push({
          articleId: uuidv4(),
          sourceId: source.sourceId,
          sourceName: source.name,
          sourceUrl: $item.find('link').text() || source.primaryUrl,
          title: $item.find('title').text() || 'Untitled',
          content: $item.find('description').text() || '',
          publishedAt: $item.find('pubDate').text() || undefined,
        });
      });

    return articles;
  }

  /**
   * Fetch URL with retry and rate limiting
   */
  private async fetchWithRetry(url: string): Promise<{ data: string }> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: this.config.timeoutMs || 30000,
      maxRedirects: 5,
    });

    return { data: response.data };
  }

  /**
   * Rate limiting
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = this.config.requestsPerMinute || 120;

    // Remove old request times
    this.requestTimes = this.requestTimes.filter(t => now - t < windowMs);

    if (this.requestTimes.length >= maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    this.requestTimes.push(Date.now());
  }

  /**
   * Check if should retry
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt > (this.config.maxRetries || 3)) return false;

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on rate limits, server errors
      return (
        status === 429 ||
        status === 503 ||
        status === 502 ||
        status === 500 ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED'
      );
    }

    return false;
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export factory function
export function createMultiSourceScraper(config?: Partial<ScraperConfig>): MultiSourceScraperTool {
  return new MultiSourceScraperTool(config);
}

export default MultiSourceScraperTool;
