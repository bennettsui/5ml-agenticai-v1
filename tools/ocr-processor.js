/**
 * OCR Processor - Vision OCR Integration
 * Extracts receipt data from images using selectable OCR providers
 */

const Anthropic = require('@anthropic-ai/sdk');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class OCRProcessor {
  constructor(options = {}) {
    if (typeof options === 'string') {
      this.provider = 'claude';
      this.model = 'claude-3-haiku-20240307';
      this.client = new Anthropic({ apiKey: options });
      this.providerLabel = 'Claude';
      return;
    }

    const {
      provider = 'claude',
      model,
      apiKey,
      baseUrl,
    } = options;

    this.provider = provider;
    this.providerLabel = provider === 'deepseek' ? 'DeepSeek' : 'Claude';

    if (provider === 'deepseek') {
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is required');
      }
      this.model = model || process.env.DEEPSEEK_OCR_MODEL || 'deepseek-chat';
      this.baseUrl = baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
      this.apiKey = apiKey;
      return;
    }

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.model = model || 'claude-3-haiku-20240307';
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Encode image to base64
   */
  async encodeImage(imagePath) {
    const buffer = await fs.readFile(imagePath);
    const base64 = buffer.toString('base64');

    // Detect media type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mediaTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };

    return {
      data: base64,
      media_type: mediaTypes[ext] || 'image/jpeg'
    };
  }

  /**
   * Process a single receipt image with the configured OCR provider
   */
  async processReceipt(imagePath) {
    try {
      console.log(`🔍 [OCR] Processing (${this.providerLabel}): ${path.basename(imagePath)}`);

      const image = await this.encodeImage(imagePath);

      const { contentText, usage } = await this.requestOCR(image);

      const jsonMatch = contentText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON from ${this.providerLabel} response`);
      }

      const extracted = JSON.parse(jsonMatch[0]);

      console.log(`✅ [OCR] Extracted: ${extracted.vendor} - ${extracted.currency} ${extracted.amount}`);

      return {
        success: true,
        data: extracted,
        raw_text: contentText,
        usage,
      };
    } catch (error) {
      console.error(`❌ [OCR] Error processing ${path.basename(imagePath)}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  async requestOCR(image) {
    const prompt = `Extract all information from this receipt image. Return ONLY a JSON object with this exact structure (no other text):

{
  "date": "YYYY-MM-DD",
  "vendor": "Store/Restaurant name",
  "description": "Brief description of items/service",
  "amount": 123.45,
  "currency": "HKD",
  "tax_amount": 0,
  "receipt_number": "Receipt/Invoice number if visible",
  "payment_method": "Cash/Card/etc if visible",
  "line_items": [
    {"description": "Item name", "quantity": 1, "unit_price": 123.45, "amount": 123.45}
  ],
  "confidence": 0.95,
  "warnings": []
}

Instructions:
- Support both Chinese (繁體/簡體) and English text
- If date is unclear, use today's date
- If currency not stated, assume HKD
- Extract individual line items if visible
- Set confidence 0-1 based on image clarity
- Add warnings array for any unclear fields
`;

    if (this.provider === 'deepseek') {
      return this.requestDeepseekOCR(image, prompt);
    }
    return this.requestClaudeOCR(image, prompt);
  }

  async requestClaudeOCR(image, prompt) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.media_type,
              data: image.data,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      }],
    });

    const contentText = response?.content?.[0]?.text || '';
    return {
      contentText,
      usage: response?.usage ? {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      } : undefined,
    };
  }

  async requestDeepseekOCR(image, prompt) {
    const imageUrl = `data:${image.media_type};base64,${image.data}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const messageContent = data?.choices?.[0]?.message?.content;
    const contentText = Array.isArray(messageContent)
      ? messageContent.map(part => part?.text || '').join('')
      : (messageContent || '');

    return {
      contentText,
      usage: data?.usage ? {
        input_tokens: data.usage.prompt_tokens,
        output_tokens: data.usage.completion_tokens,
      } : undefined,
    };
  }

  /**
   * Process multiple receipts
   */
  async processBatch(imagePaths, onProgress = null) {
    console.log(`🚀 [OCR] Starting batch OCR: ${imagePaths.length} images`);

    const results = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const imagePath of imagePaths) {
      const result = await this.processReceipt(imagePath);
      results.push({
        image_path: imagePath,
        ...result
      });

      processed++;
      if (result.success) successful++;
      else failed++;

      if (onProgress) {
        onProgress({
          current: processed,
          total: imagePaths.length,
          successful,
          failed,
          progress: Math.round((processed / imagePaths.length) * 100)
        });
      }

      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ [OCR] Batch complete: ${successful} successful, ${failed} failed`);

    return {
      results,
      total: imagePaths.length,
      successful,
      failed
    };
  }
}

module.exports = OCRProcessor;
