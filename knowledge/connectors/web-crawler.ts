/**
 * Layer 4: Knowledge Management - Web Crawler
 * Crawls and indexes web content
 */

import axios from 'axios';
import { KnowledgeDocument, KnowledgeSource, SyncResult } from '../schema/knowledge-types';
import { v4 as uuidv4 } from 'uuid';

export interface WebCrawlerConfig {
  urls: string[];
  maxDepth?: number;
  followLinks?: boolean;
  allowedDomains?: string[];
  excludePatterns?: string[];
}

export class WebCrawler {
  private config: WebCrawlerConfig;
  private visitedUrls: Set<string> = new Set();

  constructor(config: WebCrawlerConfig) {
    this.config = {
      maxDepth: 1,
      followLinks: false,
      ...config,
    };
  }

  /**
   * Crawl configured URLs and extract content
   */
  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      documentsAdded: 0,
      documentsUpdated: 0,
      documentsFailed: 0,
      errors: [],
    };

    try {
      for (const url of this.config.urls) {
        try {
          await this.crawlUrl(url, 0, result);
        } catch (error: any) {
          result.documentsFailed++;
          result.errors?.push(`Failed to crawl ${url}: ${error.message}`);
        }
      }

      result.success = result.documentsFailed < this.config.urls.length;
      return result;
    } catch (error: any) {
      result.success = false;
      result.errors?.push(error.message);
      return result;
    }
  }

  /**
   * Crawl a single URL
   */
  private async crawlUrl(url: string, depth: number, result: SyncResult): Promise<void> {
    if (this.visitedUrls.has(url) || depth > (this.config.maxDepth || 1)) {
      return;
    }

    this.visitedUrls.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': '5ML-Knowledge-Crawler/1.0',
        },
      });

      const html = response.data;
      const document = await this.htmlToDocument(url, html);

      if (document) {
        result.documentsAdded++;
      }

      // Extract and follow links if configured
      if (this.config.followLinks && depth < (this.config.maxDepth || 1)) {
        const links = this.extractLinks(html, url);
        for (const link of links) {
          if (this.shouldCrawlUrl(link)) {
            await this.crawlUrl(link, depth + 1, result);
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  /**
   * Convert HTML to KnowledgeDocument
   */
  private async htmlToDocument(url: string, html: string): Promise<KnowledgeDocument | null> {
    try {
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

      // Extract main content (simple approach - remove scripts, styles, etc.)
      let content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Limit content size
      if (content.length > 10000) {
        content = content.substring(0, 10000) + '...';
      }

      if (!content || content.length < 100) {
        return null;
      }

      // Extract metadata
      const metaDescription = this.extractMetaTag(html, 'description');
      const metaKeywords = this.extractMetaTag(html, 'keywords');

      return {
        id: `web-${Buffer.from(url).toString('base64').substring(0, 40)}`,
        title,
        content,
        metadata: {
          source: KnowledgeSource.WEB,
          sourceId: url,
          sourceUrl: url,
          tags: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : [],
          customFields: {
            description: metaDescription,
            crawledAt: new Date().toISOString(),
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error(`Failed to parse HTML from ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract meta tag content
   */
  private extractMetaTag(html: string, name: string): string | null {
    const pattern = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const match = html.match(pattern);
    return match ? match[1] : null;
  }

  /**
   * Extract links from HTML
   */
  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkPattern = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      try {
        const link = new URL(match[1], baseUrl).href;
        links.push(link);
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return links;
  }

  /**
   * Check if URL should be crawled
   */
  private shouldCrawlUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check allowed domains
      if (this.config.allowedDomains && this.config.allowedDomains.length > 0) {
        const allowed = this.config.allowedDomains.some(domain =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
        if (!allowed) return false;
      }

      // Check exclude patterns
      if (this.config.excludePatterns && this.config.excludePatterns.length > 0) {
        const excluded = this.config.excludePatterns.some(pattern =>
          url.includes(pattern)
        );
        if (excluded) return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset crawler state
   */
  reset(): void {
    this.visitedUrls.clear();
  }
}

export default WebCrawler;
