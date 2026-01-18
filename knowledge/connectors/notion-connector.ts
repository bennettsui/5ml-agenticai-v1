/**
 * Layer 4: Knowledge Management - Notion Connector
 * Syncs knowledge from Notion workspace
 */

import axios from 'axios';
import { KnowledgeDocument, KnowledgeSource, SyncResult } from '../schema/knowledge-types';
import { v4 as uuidv4 } from 'uuid';

export interface NotionConfig {
  apiKey: string;
  databaseId?: string;
  pageIds?: string[];
}

export class NotionConnector {
  private config: NotionConfig;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(config: NotionConfig) {
    this.config = config;
  }

  /**
   * Sync all accessible Notion pages to knowledge documents
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
      let documents: KnowledgeDocument[] = [];

      // Sync from database if specified
      if (this.config.databaseId) {
        const dbDocs = await this.syncDatabase(this.config.databaseId);
        documents.push(...dbDocs);
      }

      // Sync individual pages if specified
      if (this.config.pageIds && this.config.pageIds.length > 0) {
        for (const pageId of this.config.pageIds) {
          try {
            const doc = await this.syncPage(pageId);
            documents.push(doc);
          } catch (error: any) {
            result.documentsFailed++;
            result.errors?.push(`Failed to sync page ${pageId}: ${error.message}`);
          }
        }
      }

      result.documentsAdded = documents.length;
      return result;
    } catch (error: any) {
      result.success = false;
      result.errors?.push(error.message);
      return result;
    }
  }

  /**
   * Sync all pages from a Notion database
   */
  private async syncDatabase(databaseId: string): Promise<KnowledgeDocument[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/databases/${databaseId}/query`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      const pages = response.data.results;
      const documents: KnowledgeDocument[] = [];

      for (const page of pages) {
        try {
          const doc = await this.convertPageToDocument(page);
          documents.push(doc);
        } catch (error: any) {
          console.error(`Failed to convert page ${page.id}:`, error.message);
        }
      }

      return documents;
    } catch (error: any) {
      throw new Error(`Failed to sync Notion database: ${error.message}`);
    }
  }

  /**
   * Sync a single Notion page
   */
  private async syncPage(pageId: string): Promise<KnowledgeDocument> {
    try {
      // Get page metadata
      const pageResponse = await axios.get(
        `${this.baseUrl}/pages/${pageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return this.convertPageToDocument(pageResponse.data);
    } catch (error: any) {
      throw new Error(`Failed to sync Notion page: ${error.message}`);
    }
  }

  /**
   * Convert Notion page to KnowledgeDocument
   */
  private async convertPageToDocument(page: any): Promise<KnowledgeDocument> {
    const pageId = page.id;

    // Get page content (blocks)
    const blocksResponse = await axios.get(
      `${this.baseUrl}/blocks/${pageId}/children`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      }
    );

    // Extract text content from blocks
    const content = this.extractTextFromBlocks(blocksResponse.data.results);

    // Extract title
    const title = this.extractTitle(page);

    return {
      id: `notion-${pageId}`,
      title,
      content,
      metadata: {
        source: KnowledgeSource.NOTION,
        sourceId: pageId,
        sourceUrl: page.url,
        author: page.created_by?.name,
        tags: this.extractTags(page),
        customFields: {
          lastEditedTime: page.last_edited_time,
          createdTime: page.created_time,
        },
      },
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
    };
  }

  /**
   * Extract text from Notion blocks
   */
  private extractTextFromBlocks(blocks: any[]): string {
    const textParts: string[] = [];

    for (const block of blocks) {
      const type = block.type;
      if (block[type]?.rich_text) {
        const text = block[type].rich_text
          .map((rt: any) => rt.plain_text)
          .join('');
        if (text) textParts.push(text);
      }
    }

    return textParts.join('\n\n');
  }

  /**
   * Extract title from Notion page
   */
  private extractTitle(page: any): string {
    const properties = page.properties;

    // Try to find title property
    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title[0].plain_text;
      }
    }

    return 'Untitled';
  }

  /**
   * Extract tags from Notion page
   */
  private extractTags(page: any): string[] {
    const properties = page.properties;
    const tags: string[] = [];

    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'multi_select') {
        tags.push(...prop.multi_select.map((s: any) => s.name));
      }
    }

    return tags;
  }
}

export default NotionConnector;
