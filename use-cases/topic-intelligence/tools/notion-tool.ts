/**
 * Layer 2: Tools - Notion Tool
 * Provides CRUD operations for Notion databases with retry logic
 */

import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface NotionConfig {
  apiKey: string;
  parentPageId?: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
  url: string;
}

export interface NotionProperty {
  type: string;
  name?: string;
  [key: string]: unknown;
}

export interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface QueryFilter {
  property?: string;
  [key: string]: unknown;
}

export interface QueryOptions {
  filter?: QueryFilter;
  sorts?: Array<{
    property?: string;
    timestamp?: 'created_time' | 'last_edited_time';
    direction: 'ascending' | 'descending';
  }>;
  pageSize?: number;
  startCursor?: string;
}

export class NotionTool {
  private config: NotionConfig;
  private baseUrl = 'https://api.notion.com/v1';
  private notionVersion = '2022-06-28';
  private retryCount = 3;
  private retryDelay = 1000;
  private rateLimitDelay = 334; // ~3 requests per second

  private lastRequestTime = 0;

  constructor(config?: Partial<NotionConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.NOTION_API_KEY || '',
      parentPageId: config?.parentPageId || process.env.NOTION_PARENT_PAGE_ID,
    };
  }

  /**
   * Check if the tool is properly configured
   */
  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Rate limit helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitDelay) {
      await this.sleep(this.rateLimitDelay - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Make an API request with retry logic
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    await this.rateLimit();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await axios({
          method,
          url: `${this.baseUrl}${endpoint}`,
          data,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Notion-Version': this.notionVersion,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        return response.data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.shouldRetry(error, attempt)) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `[NotionTool] Attempt ${attempt}/${this.retryCount} failed, retrying in ${delay}ms...`
          );
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    throw this.formatError(lastError);
  }

  // ==================== Database Operations ====================

  /**
   * Create a new database
   */
  async createDatabase(
    title: string,
    properties: Record<string, NotionProperty>,
    parentPageId?: string
  ): Promise<NotionDatabase> {
    const parent = parentPageId || this.config.parentPageId;
    if (!parent) {
      throw new Error('Parent page ID is required to create a database');
    }

    const response = await this.request<any>('POST', '/databases', {
      parent: { type: 'page_id', page_id: parent },
      title: [{ type: 'text', text: { content: title } }],
      properties,
    });

    return {
      id: response.id,
      title: title,
      properties: response.properties,
      url: response.url,
    };
  }

  /**
   * Query a database
   */
  async queryDatabase(
    databaseId: string,
    options?: QueryOptions
  ): Promise<{ pages: NotionPage[]; hasMore: boolean; nextCursor?: string }> {
    const body: Record<string, unknown> = {};

    if (options?.filter) {
      body.filter = options.filter;
    }
    if (options?.sorts) {
      body.sorts = options.sorts;
    }
    if (options?.pageSize) {
      body.page_size = Math.min(options.pageSize, 100);
    }
    if (options?.startCursor) {
      body.start_cursor = options.startCursor;
    }

    const response = await this.request<any>(
      'POST',
      `/databases/${databaseId}/query`,
      body
    );

    return {
      pages: response.results.map((page: any) => this.formatPage(page)),
      hasMore: response.has_more,
      nextCursor: response.next_cursor,
    };
  }

  /**
   * Query all pages from a database (handles pagination)
   */
  async queryAllPages(
    databaseId: string,
    options?: Omit<QueryOptions, 'startCursor' | 'pageSize'>
  ): Promise<NotionPage[]> {
    const allPages: NotionPage[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.queryDatabase(databaseId, {
        ...options,
        pageSize: 100,
        startCursor: cursor,
      });

      allPages.push(...result.pages);
      hasMore = result.hasMore;
      cursor = result.nextCursor;
    }

    return allPages;
  }

  // ==================== Page Operations ====================

  /**
   * Create a new page in a database
   */
  async createPage(
    databaseId: string,
    properties: Record<string, unknown>
  ): Promise<NotionPage> {
    const response = await this.request<any>('POST', '/pages', {
      parent: { type: 'database_id', database_id: databaseId },
      properties,
    });

    return this.formatPage(response);
  }

  /**
   * Update a page
   */
  async updatePage(
    pageId: string,
    properties: Record<string, unknown>
  ): Promise<NotionPage> {
    const response = await this.request<any>('PATCH', `/pages/${pageId}`, {
      properties,
    });

    return this.formatPage(response);
  }

  /**
   * Get a page by ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    const response = await this.request<any>('GET', `/pages/${pageId}`);
    return this.formatPage(response);
  }

  /**
   * Archive (soft delete) a page
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    const response = await this.request<any>('PATCH', `/pages/${pageId}`, {
      archived: true,
    });

    return this.formatPage(response);
  }

  /**
   * Create multiple pages in batch
   */
  async batchCreatePages(
    databaseId: string,
    pagesData: Array<Record<string, unknown>>
  ): Promise<{ success: NotionPage[]; failed: Array<{ data: Record<string, unknown>; error: string }> }> {
    const success: NotionPage[] = [];
    const failed: Array<{ data: Record<string, unknown>; error: string }> = [];

    for (const data of pagesData) {
      try {
        const page = await this.createPage(databaseId, data);
        success.push(page);
      } catch (error) {
        failed.push({
          data,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { success, failed };
  }

  // ==================== Block Operations ====================

  /**
   * Get page content (blocks)
   */
  async getPageContent(pageId: string): Promise<any[]> {
    const response = await this.request<any>(
      'GET',
      `/blocks/${pageId}/children`
    );
    return response.results;
  }

  /**
   * Append content to a page
   */
  async appendContent(pageId: string, blocks: any[]): Promise<any[]> {
    const response = await this.request<any>(
      'PATCH',
      `/blocks/${pageId}/children`,
      { children: blocks }
    );
    return response.results;
  }

  // ==================== Helper Methods ====================

  /**
   * Format a Notion page response
   */
  private formatPage(page: any): NotionPage {
    return {
      id: page.id,
      properties: page.properties,
      url: page.url,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
    };
  }

  /**
   * Build property value for different types
   */
  buildPropertyValue(type: string, value: unknown): Record<string, unknown> {
    switch (type) {
      case 'title':
        return {
          title: [{ type: 'text', text: { content: String(value) } }],
        };

      case 'rich_text':
        return {
          rich_text: [{ type: 'text', text: { content: String(value) } }],
        };

      case 'number':
        return { number: Number(value) };

      case 'select':
        return { select: { name: String(value) } };

      case 'multi_select':
        return {
          multi_select: Array.isArray(value)
            ? value.map(v => ({ name: String(v) }))
            : [{ name: String(value) }],
        };

      case 'date':
        return {
          date: {
            start: value instanceof Date ? value.toISOString() : String(value),
          },
        };

      case 'url':
        return { url: String(value) };

      case 'email':
        return { email: String(value) };

      case 'phone_number':
        return { phone_number: String(value) };

      case 'checkbox':
        return { checkbox: Boolean(value) };

      case 'relation':
        return {
          relation: Array.isArray(value)
            ? value.map(id => ({ id: String(id) }))
            : [{ id: String(value) }],
        };

      default:
        throw new Error(`Unsupported property type: ${type}`);
    }
  }

  /**
   * Extract value from a Notion property
   */
  extractPropertyValue(property: any): unknown {
    const type = property.type;

    switch (type) {
      case 'title':
        return property.title?.[0]?.plain_text || '';

      case 'rich_text':
        return property.rich_text?.map((rt: any) => rt.plain_text).join('') || '';

      case 'number':
        return property.number;

      case 'select':
        return property.select?.name;

      case 'multi_select':
        return property.multi_select?.map((s: any) => s.name) || [];

      case 'date':
        return property.date?.start;

      case 'url':
        return property.url;

      case 'email':
        return property.email;

      case 'phone_number':
        return property.phone_number;

      case 'checkbox':
        return property.checkbox;

      case 'relation':
        return property.relation?.map((r: any) => r.id) || [];

      case 'formula':
        return property.formula?.[property.formula.type];

      case 'rollup':
        return property.rollup?.[property.rollup.type];

      case 'created_time':
        return property.created_time;

      case 'last_edited_time':
        return property.last_edited_time;

      default:
        return null;
    }
  }

  /**
   * Build database property schema
   */
  buildPropertySchema(
    type: string,
    options?: Record<string, unknown>
  ): NotionProperty {
    switch (type) {
      case 'title':
        return { title: {} } as NotionProperty;

      case 'rich_text':
        return { rich_text: {} } as NotionProperty;

      case 'number':
        return { number: { format: options?.format || 'number' } } as NotionProperty;

      case 'select':
        return {
          select: {
            options: options?.options || [],
          },
        } as NotionProperty;

      case 'multi_select':
        return {
          multi_select: {
            options: options?.options || [],
          },
        } as NotionProperty;

      case 'date':
        return { date: {} } as NotionProperty;

      case 'url':
        return { url: {} } as NotionProperty;

      case 'email':
        return { email: {} } as NotionProperty;

      case 'phone_number':
        return { phone_number: {} } as NotionProperty;

      case 'checkbox':
        return { checkbox: {} } as NotionProperty;

      case 'relation':
        return {
          relation: {
            database_id: options?.databaseId,
            type: options?.type || 'single_property',
          },
        } as NotionProperty;

      default:
        throw new Error(`Unsupported property type: ${type}`);
    }
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.retryCount) return false;

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      return (
        status === 429 ||
        status === 503 ||
        status === 502 ||
        status === 500 ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT'
      );
    }

    return false;
  }

  private formatError(error: Error | null): Error {
    if (!error) {
      return new Error('Unknown error occurred');
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      return new Error(`Notion API error (${status}): ${message}`);
    }

    return error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notionTool = new NotionTool();

export default NotionTool;
