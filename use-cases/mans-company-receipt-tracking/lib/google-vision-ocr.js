/**
 * Google Cloud Vision OCR
 *
 * Uses the Vision REST API (DOCUMENT_TEXT_DETECTION) to extract:
 *   - Full text
 *   - Word-level bounding boxes (normalised 0-1 relative to image dimensions)
 *
 * Supports both image files and PDFs.
 * PDFs are processed via the files:annotate endpoint (inline, up to 5 pages).
 * Each PDF page becomes a separate result entry.
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

class GoogleVisionOCR {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GOOGLE_VISION_API_KEY;
    if (!this.apiKey) throw new Error('GOOGLE_VISION_API_KEY is required');
  }

  /**
   * Process a file (image or PDF) from disk.
   * Returns an array of page results: [{ pageNumber, text, boxes, confidence, width, height }]
   * Images always return a single-element array (pageNumber = 1).
   */
  async processFile(filePath) {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this.processPdfBuffer(buffer);
    }

    const mimeType = IMAGE_MIME_TYPES[ext] || 'image/jpeg';
    const result = await this.processImageBuffer(buffer, mimeType);
    return [{ pageNumber: 1, ...result }];
  }

  /**
   * Process an image buffer directly.
   */
  async processImageBuffer(buffer, mimeType = 'image/jpeg') {
    const base64 = buffer.toString('base64');

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;
    const body = {
      requests: [{
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
      }],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Vision API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const annotation = data.responses?.[0];

    if (annotation?.error) {
      throw new Error(`Google Vision: ${annotation.error.message}`);
    }

    return this._parseFullTextAnnotation(annotation?.fullTextAnnotation);
  }

  /**
   * Process a PDF buffer. Returns one result per page (up to 5).
   */
  async processPdfBuffer(buffer) {
    const base64 = buffer.toString('base64');

    const url = `https://vision.googleapis.com/v1/files:annotate?key=${this.apiKey}`;
    const body = {
      requests: [{
        inputConfig: {
          content: base64,
          mimeType: 'application/pdf',
        },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        pages: [1, 2, 3, 4, 5],
      }],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Vision PDF API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const pageResponses = data.responses?.[0]?.responses || [];

    return pageResponses.map((pageResp, idx) => ({
      pageNumber: idx + 1,
      ...this._parseFullTextAnnotation(pageResp?.fullTextAnnotation),
    }));
  }

  /**
   * Parse a fullTextAnnotation into { text, boxes, confidence, width, height }.
   */
  _parseFullTextAnnotation(fta) {
    if (!fta) {
      return { text: '', boxes: [], confidence: 0, width: 0, height: 0 };
    }

    const text = fta.text || '';
    const pages = fta.pages || [];

    let totalConfidence = 0;
    let blockCount = 0;
    let pageWidth = 0;
    let pageHeight = 0;
    const boxes = [];

    for (const page of pages) {
      pageWidth = page.width || pageWidth;
      pageHeight = page.height || pageHeight;

      for (const block of (page.blocks || [])) {
        if (typeof block.confidence === 'number') {
          totalConfidence += block.confidence;
          blockCount++;
        }

        for (const paragraph of (block.paragraphs || [])) {
          for (const word of (paragraph.words || [])) {
            const wordText = (word.symbols || []).map(s => s.text || '').join('');
            if (!wordText.trim()) continue;

            const vertices = word.boundingBox?.vertices || [];
            if (vertices.length < 4) continue;

            const xs = vertices.map(v => typeof v.x === 'number' ? v.x : 0);
            const ys = vertices.map(v => typeof v.y === 'number' ? v.y : 0);

            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);

            const w = pageWidth || 1;
            const h = pageHeight || 1;

            boxes.push({
              id: `w_${boxes.length}`,
              text: wordText,
              x: minX / w,
              y: minY / h,
              width: (maxX - minX) / w,
              height: (maxY - minY) / h,
              confidence: typeof word.confidence === 'number' ? word.confidence : 0.9,
            });
          }
        }
      }
    }

    const confidence = blockCount > 0 ? totalConfidence / blockCount : 0.85;

    return { text, boxes, confidence, width: pageWidth, height: pageHeight };
  }
}

module.exports = GoogleVisionOCR;
