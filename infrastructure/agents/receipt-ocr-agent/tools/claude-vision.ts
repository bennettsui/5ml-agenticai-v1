/**
 * Claude Vision Tool for Receipt OCR
 *
 * Uses Claude's vision capabilities to extract structured data from receipt images.
 * Optimized for Hong Kong receipts with Chinese and English text.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

interface OCROptions {
  locale?: string;
  extractLineItems?: boolean;
  maxTokens?: number;
}

interface ExtractedData {
  date: string;
  vendor: string;
  amount: number;
  currency: string;
  description: string;
  tax_amount?: number;
  receipt_number?: string;
  payment_method?: string;
  line_items?: LineItem[];
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface OCRResult {
  extracted: ExtractedData | null;
  confidence: number;
  raw_text?: string;
  warnings: string[];
}

export class ClaudeVisionOCR {
  private client: Anthropic;
  private promptTemplate: string | null = null;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Load the HK-specific extraction prompt
   */
  private async loadPrompt(): Promise<string> {
    if (this.promptTemplate) {
      return this.promptTemplate;
    }

    try {
      const promptPath = path.join(
        __dirname,
        '../prompts/claude-vision-hk.md'
      );
      this.promptTemplate = await fs.readFile(promptPath, 'utf-8');
      return this.promptTemplate;
    } catch (error) {
      console.error('Failed to load prompt template:', error);
      // Fallback to basic prompt
      return this.getDefaultPrompt();
    }
  }

  /**
   * Default prompt if file loading fails
   */
  private getDefaultPrompt(): string {
    return `Extract structured data from this receipt image. Return a JSON object with:
{
  "extracted": {
    "date": "YYYY-MM-DD",
    "vendor": "Business name",
    "amount": number,
    "currency": "ISO 4217 code",
    "description": "Brief summary"
  },
  "confidence": number (0-1),
  "warnings": []
}

Focus on Hong Kong receipts. Handle Chinese and English text.`;
  }

  /**
   * Process receipt image and extract structured data
   *
   * @param imagePath - Path to receipt image file
   * @param options - OCR processing options
   * @returns Structured receipt data
   */
  async processReceipt(
    imagePath: string,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    try {
      // Read and encode image
      const imageData = await this.encodeImage(imagePath);

      // Load system prompt
      const systemPrompt = await this.loadPrompt();

      // Build user message
      const userMessage = this.buildUserMessage(options);

      // Call Claude Vision API
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageData.mediaType,
                  data: imageData.base64,
                },
              },
              {
                type: 'text',
                text: userMessage,
              },
            ],
          },
        ],
        system: systemPrompt,
      });

      // Extract text from response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      const result = this.parseResponse(content.text);

      return result;
    } catch (error) {
      console.error('Receipt processing error:', error);
      return {
        extracted: null,
        confidence: 0,
        warnings: [
          'extraction_failed',
          error instanceof Error ? error.message : 'Unknown error',
        ],
      };
    }
  }

  /**
   * Encode image file to base64
   */
  private async encodeImage(imagePath: string): Promise<{
    base64: string;
    mediaType: string;
  }> {
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');

    // Determine media type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mediaTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    const mediaType = mediaTypeMap[ext] || 'image/jpeg';

    return { base64, mediaType };
  }

  /**
   * Build user message with options
   */
  private buildUserMessage(options: OCROptions): string {
    let message = 'Extract all data from this receipt image.';

    if (options.locale) {
      message += ` Expected locale: ${options.locale}.`;
    }

    if (options.extractLineItems) {
      message += ' Include individual line items in the extraction.';
    }

    message += ' Return only valid JSON, no additional text.';

    return message;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseResponse(text: string): OCRResult {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      // Parse JSON
      const result = JSON.parse(cleanText) as OCRResult;

      // Validate structure
      if (!result.extracted && result.confidence === 0) {
        return result; // Valid failure case
      }

      if (!result.extracted || typeof result.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }

      // Validate required fields
      const required = ['date', 'vendor', 'amount', 'currency', 'description'];
      for (const field of required) {
        if (!(field in result.extracted)) {
          result.warnings = result.warnings || [];
          result.warnings.push(`missing_field_${field}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Response parsing error:', error);
      return {
        extracted: null,
        confidence: 0,
        raw_text: text,
        warnings: [
          'json_parse_error',
          error instanceof Error ? error.message : 'Invalid JSON',
        ],
      };
    }
  }

  /**
   * Process multiple receipts in batch
   *
   * @param imagePaths - Array of image file paths
   * @param options - OCR processing options
   * @returns Array of results
   */
  async processBatch(
    imagePaths: string[],
    options: OCROptions = {}
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      const result = await this.processReceipt(imagePath, options);
      results.push(result);

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Get cost estimation for processing
   *
   * @param imageCount - Number of images to process
   * @returns Estimated cost in USD
   */
  estimateCost(imageCount: number): { min: number; max: number } {
    const minCostPerImage = 0.004;
    const maxCostPerImage = 0.005;

    return {
      min: imageCount * minCostPerImage,
      max: imageCount * maxCostPerImage,
    };
  }
}

// Export singleton instance
export const claudeVisionOCR = new ClaudeVisionOCR();

// Export for testing and custom instances
export default ClaudeVisionOCR;
