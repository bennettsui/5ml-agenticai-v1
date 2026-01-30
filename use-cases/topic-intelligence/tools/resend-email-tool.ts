/**
 * Layer 2: Tools - Resend Email Tool
 * Provides email sending functionality using Resend API
 */

import axios, { AxiosError } from 'axios';

export interface ResendConfig {
  apiKey: string;
  defaultFrom?: string;
  defaultReplyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  topicId?: string; // For tracking purposes
}

export interface EmailResult {
  id: string;
  to: string[];
  status: 'sent' | 'failed';
  error?: string;
}

export interface BatchEmailResult {
  totalSent: number;
  totalFailed: number;
  results: EmailResult[];
}

export class ResendEmailTool {
  private config: ResendConfig;
  private baseUrl = 'https://api.resend.com';
  private retryCount = 3;
  private retryDelay = 1000;
  private batchSize = 100; // Resend's max batch size

  constructor(config?: Partial<ResendConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.RESEND_API_KEY || '',
      defaultFrom: config?.defaultFrom || 'news@5ml.io',
      defaultReplyTo: config?.defaultReplyTo || 'support@5ml.io',
    };
  }

  /**
   * Check if the tool is properly configured
   */
  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Send a single email
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.isAvailable()) {
      throw new Error(
        'Resend Email Tool not configured. Please set RESEND_API_KEY environment variable.'
      );
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/emails`,
          {
            from: options.from || this.config.defaultFrom,
            to: recipients,
            subject: options.subject,
            html: options.html,
            text: options.text,
            reply_to: options.replyTo || this.config.defaultReplyTo,
            cc: options.cc,
            bcc: options.bcc,
            attachments: options.attachments,
            tags: options.tags,
            headers: options.headers,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        return {
          id: response.data.id,
          to: recipients,
          status: 'sent',
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.shouldRetry(error, attempt)) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `[ResendEmailTool] Attempt ${attempt}/${this.retryCount} failed, retrying in ${delay}ms...`
          );
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    return {
      id: '',
      to: recipients,
      status: 'failed',
      error: this.formatError(lastError),
    };
  }

  /**
   * Send an EDM (Electronic Direct Mail) to multiple recipients
   */
  async sendEDM(
    to: string[],
    subject: string,
    html: string,
    topicId?: string
  ): Promise<BatchEmailResult> {
    if (!this.isAvailable()) {
      throw new Error(
        'Resend Email Tool not configured. Please set RESEND_API_KEY environment variable.'
      );
    }

    const results: EmailResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process in batches
    for (let i = 0; i < to.length; i += this.batchSize) {
      const batch = to.slice(i, i + this.batchSize);

      // Send to each recipient individually for better tracking
      // Resend batch API doesn't support individual tracking well
      const batchPromises = batch.map(recipient =>
        this.sendEmail({
          to: recipient,
          subject,
          html,
          topicId,
          tags: topicId ? [{ name: 'topic_id', value: topicId }] : undefined,
        })
      );

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        results.push(result);
        if (result.status === 'sent') {
          totalSent++;
        } else {
          totalFailed++;
        }
      }

      // Add delay between batches to avoid rate limiting
      if (i + this.batchSize < to.length) {
        await this.sleep(1000);
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
    };
  }

  /**
   * Send batch emails with different content
   */
  async sendBatch(
    emails: SendEmailOptions[]
  ): Promise<BatchEmailResult> {
    if (!this.isAvailable()) {
      throw new Error(
        'Resend Email Tool not configured. Please set RESEND_API_KEY environment variable.'
      );
    }

    const results: EmailResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process in batches
    for (let i = 0; i < emails.length; i += this.batchSize) {
      const batch = emails.slice(i, i + this.batchSize);

      const batchPromises = batch.map(email => this.sendEmail(email));
      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        results.push(result);
        if (result.status === 'sent') {
          totalSent++;
        } else {
          totalFailed++;
        }
      }

      // Add delay between batches
      if (i + this.batchSize < emails.length) {
        await this.sleep(1000);
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
    };
  }

  /**
   * Get email delivery status (if available)
   */
  async getEmailStatus(emailId: string): Promise<{ id: string; status: string }> {
    if (!this.isAvailable()) {
      throw new Error('Resend Email Tool not configured.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/emails/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: 10000,
      });

      return {
        id: response.data.id,
        status: response.data.last_event || 'unknown',
      };
    } catch (error) {
      throw new Error(
        `Failed to get email status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate email addresses
   */
  validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      if (emailRegex.test(email.trim())) {
        valid.push(email.trim().toLowerCase());
      } else {
        invalid.push(email);
      }
    }

    return { valid, invalid };
  }

  /**
   * Generate a test email for preview
   */
  async sendTestEmail(
    testEmail: string,
    subject: string,
    html: string,
    topicId?: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html,
      topicId,
      tags: [
        { name: 'type', value: 'test' },
        ...(topicId ? [{ name: 'topic_id', value: topicId }] : []),
      ],
    });
  }

  /**
   * Check if we should retry
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.retryCount) return false;

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on rate limits or server errors
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

  /**
   * Format error message
   */
  private formatError(error: Error | null): string {
    if (!error) return 'Unknown error';

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message;
      return `Resend API error (${status}): ${message}`;
    }

    return error.message;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const resendEmailTool = new ResendEmailTool();

export default ResendEmailTool;
