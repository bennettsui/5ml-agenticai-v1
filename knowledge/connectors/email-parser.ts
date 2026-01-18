/**
 * Layer 4: Knowledge Management - Email Parser
 * Extracts knowledge from email messages
 * Note: Supports Gmail API and IMAP protocols
 */

import axios from 'axios';
import { KnowledgeDocument, KnowledgeSource, SyncResult } from '../schema/knowledge-types';
import { v4 as uuidv4 } from 'uuid';

export interface EmailParserConfig {
  provider: 'gmail' | 'imap';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    // IMAP
    host?: string;
    port?: number;
    user?: string;
    password?: string;
  };
  filters?: {
    from?: string[];
    subject?: string;
    labels?: string[];
    after?: Date;
    before?: Date;
  };
}

export class EmailParser {
  private config: EmailParserConfig;

  constructor(config: EmailParserConfig) {
    this.config = config;
  }

  /**
   * Sync emails to knowledge documents
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
      if (this.config.provider === 'gmail') {
        return await this.syncGmail(result);
      } else if (this.config.provider === 'imap') {
        return await this.syncIMAP(result);
      } else {
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error: any) {
      result.success = false;
      result.errors?.push(error.message);
      return result;
    }
  }

  /**
   * Sync emails from Gmail using Gmail API
   */
  private async syncGmail(result: SyncResult): Promise<SyncResult> {
    try {
      const accessToken = this.config.credentials.accessToken;
      if (!accessToken) {
        throw new Error('Gmail access token required');
      }

      // Build query
      let query = '';
      if (this.config.filters?.from) {
        query += this.config.filters.from.map(f => `from:${f}`).join(' OR ');
      }
      if (this.config.filters?.subject) {
        query += ` subject:"${this.config.filters.subject}"`;
      }
      if (this.config.filters?.after) {
        const date = this.formatGmailDate(this.config.filters.after);
        query += ` after:${date}`;
      }

      // List messages
      const listResponse = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            maxResults: 100,
          },
        }
      );

      const messages = listResponse.data.messages || [];

      // Fetch and parse each message
      for (const message of messages) {
        try {
          const document = await this.fetchGmailMessage(message.id, accessToken);
          if (document) {
            result.documentsAdded++;
          }
        } catch (error: any) {
          result.documentsFailed++;
          result.errors?.push(`Failed to parse message ${message.id}: ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      throw new Error(`Gmail sync failed: ${error.message}`);
    }
  }

  /**
   * Fetch a single Gmail message
   */
  private async fetchGmailMessage(messageId: string, accessToken: string): Promise<KnowledgeDocument | null> {
    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            format: 'full',
          },
        }
      );

      const message = response.data;

      // Extract headers
      const headers = message.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
      const date = headers.find((h: any) => h.name === 'Date')?.value;

      // Extract body
      const body = this.extractEmailBody(message.payload);

      return {
        id: `email-${messageId}`,
        title: subject,
        content: body,
        metadata: {
          source: KnowledgeSource.EMAIL,
          sourceId: messageId,
          author: from,
          tags: message.labelIds || [],
          customFields: {
            date,
            threadId: message.threadId,
            snippet: message.snippet,
          },
        },
        createdAt: new Date(parseInt(message.internalDate)),
        updatedAt: new Date(parseInt(message.internalDate)),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch Gmail message: ${error.message}`);
    }
  }

  /**
   * Extract email body from Gmail payload
   */
  private extractEmailBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body?.data) {
            let content = Buffer.from(part.body.data, 'base64').toString('utf-8');

            // Strip HTML tags if HTML content
            if (part.mimeType === 'text/html') {
              content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }

            return content;
          }
        }
      }
    }

    return '';
  }

  /**
   * Sync emails from IMAP server
   */
  private async syncIMAP(result: SyncResult): Promise<SyncResult> {
    // NOTE: This is a placeholder
    // In production, use an IMAP library like node-imap or emailjs-imap-client
    throw new Error('IMAP sync not yet implemented. Use Gmail API instead.');
  }

  /**
   * Format date for Gmail search
   */
  private formatGmailDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}

export default EmailParser;
