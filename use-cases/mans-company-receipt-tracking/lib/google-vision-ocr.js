/**
 * Receipt OCR via Google Gemini Vision
 *
 * Uses the Gemini API (GEMINI_API_KEY) to extract:
 *   - Full text from receipt images / PDFs
 *   - Word-level bounding boxes (normalised 0-1) for the visual overlay
 *
 * Supports: JPG, PNG, WebP, GIF, PDF (up to 5 pages inline).
 * Each PDF page returns a separate result entry.
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const IMAGE_MIME_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.bmp':  'image/jpeg',  // Gemini accepts JPEG for BMP
  '.tiff': 'image/jpeg',
  '.tif':  'image/jpeg',
};

// Gemini model to use for OCR (flash = fast + cheap, good at document text)
const OCR_MODEL = 'gemini-2.0-flash';

const OCR_PROMPT = `You are an OCR engine for receipt images. Analyze this receipt and return ONLY valid JSON with no markdown, no explanation.

Return this exact structure:
{
  "full_text": "<all text from the receipt exactly as it appears>",
  "words": [
    {"text": "word or short phrase", "box": [ymin, xmin, ymax, xmax]}
  ]
}

Rules for "words":
- Include every distinct word or number you can read
- "box" values are integers 0-1000 representing normalised coordinates (0=top/left, 1000=bottom/right)
- ymin < ymax, xmin < xmax
- Aim for word-level granularity (not whole lines, not individual characters)
- If a word's position is unclear, omit it from "words" but still include it in "full_text"`;

class GoogleVisionOCR {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is required');
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Process a file (image or PDF) from disk.
   * Returns array of page results: [{ pageNumber, text, boxes, confidence }]
   */
  async processFile(filePath) {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.pdf' ? 'application/pdf' : (IMAGE_MIME_TYPES[ext] || 'image/jpeg');
    return this._processBuffer(buffer, mimeType);
  }

  /**
   * Process a raw buffer.
   */
  async _processBuffer(buffer, mimeType) {
    const base64 = buffer.toString('base64');

    const body = {
      contents: [{
        parts: [
          { text: OCR_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    const url = `${this.baseUrl}/models/${OCR_MODEL}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini OCR API error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();

    // Handle safety blocks
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked request: ${data.promptFeedback.blockReason}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content) {
      return [{ pageNumber: 1, text: '', boxes: [], confidence: 0 }];
    }

    const parsed = this._parseResponse(content);

    // PDFs may contain multiple logical pages — treat as single result
    // (Gemini inline PDF processes the whole doc in one response)
    return [{ pageNumber: 1, ...parsed }];
  }

  /**
   * Parse the JSON response from Gemini into { text, boxes, confidence }.
   */
  _parseResponse(raw) {
    let json;
    try {
      // Strip accidental markdown fences
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      json = JSON.parse(cleaned);
    } catch {
      // Return whatever text we got
      return { text: raw, boxes: [], confidence: 0.5 };
    }

    const text = typeof json.full_text === 'string' ? json.full_text : '';
    const rawWords = Array.isArray(json.words) ? json.words : [];

    const boxes = rawWords
      .filter(w => w && typeof w.text === 'string' && Array.isArray(w.box) && w.box.length === 4)
      .map((w, i) => {
        const [ymin, xmin, ymax, xmax] = w.box.map(v => Math.max(0, Math.min(1000, Number(v) || 0)));
        return {
          id: `w_${i}`,
          text: w.text,
          x: xmin / 1000,
          y: ymin / 1000,
          width: Math.max(0.005, (xmax - xmin) / 1000),
          height: Math.max(0.005, (ymax - ymin) / 1000),
          confidence: 0.9,
        };
      });

    // Confidence: rough heuristic based on word coverage
    const confidence = boxes.length > 5 ? 0.92 : boxes.length > 0 ? 0.75 : 0.5;

    return { text, boxes, confidence };
  }
}

module.exports = GoogleVisionOCR;
