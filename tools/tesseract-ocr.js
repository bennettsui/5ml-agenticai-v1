/**
 * Tesseract OCR Processor
 * Extracts text with bounding boxes for visual overlay
 * Used alongside Claude Vision for comprehensive receipt processing
 */

const Tesseract = require('tesseract.js');
const path = require('path');

class TesseractOCR {
  constructor() {
    this.worker = null;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    if (!this.worker) {
      console.log('🔧 [Tesseract] Initializing OCR worker...');
      this.worker = await Tesseract.createWorker('eng+chi_tra', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`   Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('✅ [Tesseract] Worker initialized');
    }
    return this.worker;
  }

  /**
   * Terminate worker to free resources
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🛑 [Tesseract] Worker terminated');
    }
  }

  /**
   * Process image and extract bounding boxes
   * @param {string} imagePath - Path to receipt image
   * @returns {Promise<Object>} OCR results with bounding boxes
   */
  async extractBoundingBoxes(imagePath) {
    console.log(`🔍 [Tesseract] Processing: ${path.basename(imagePath)}`);

    await this.initialize();

    const { data } = await this.worker.recognize(imagePath);

    // Extract words with bounding boxes
    const boxes = data.words.map((word, index) => {
      const { bbox, text, confidence } = word;

      return {
        id: `word-${index}`,
        text: text,
        x: bbox.x0,
        y: bbox.y0,
        width: bbox.x1 - bbox.x0,
        height: bbox.y1 - bbox.y0,
        confidence: confidence / 100, // Normalize to 0-1
      };
    });

    // Get image dimensions
    const imageWidth = data.imageWidth || 1;
    const imageHeight = data.imageHeight || 1;

    // Convert to relative coordinates (0-1)
    const normalizedBoxes = boxes.map(box => ({
      ...box,
      x: box.x / imageWidth,
      y: box.y / imageHeight,
      width: box.width / imageWidth,
      height: box.height / imageHeight,
    }));

    // Group boxes by lines for better visualization
    const lines = this.groupByLines(normalizedBoxes);

    console.log(`✅ [Tesseract] Extracted ${boxes.length} words, ${lines.length} lines`);

    return {
      boxes: normalizedBoxes,
      lines: lines,
      fullText: data.text,
      confidence: data.confidence / 100,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    };
  }

  /**
   * Group bounding boxes into lines
   * @param {Array} boxes - Array of bounding boxes
   * @returns {Array} Lines with their boxes
   */
  groupByLines(boxes) {
    if (boxes.length === 0) return [];

    // Sort boxes by y position
    const sorted = [...boxes].sort((a, b) => a.y - b.y);

    const lines = [];
    let currentLine = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const box = sorted[i];
      const prevBox = sorted[i - 1];

      // If y position is similar, it's the same line
      const yDiff = Math.abs(box.y - prevBox.y);
      if (yDiff < 0.02) { // 2% threshold
        currentLine.push(box);
      } else {
        // New line
        lines.push({
          boxes: currentLine,
          text: currentLine.map(b => b.text).join(' '),
          y: currentLine[0].y,
          height: Math.max(...currentLine.map(b => b.height)),
        });
        currentLine = [box];
      }
    }

    // Add last line
    if (currentLine.length > 0) {
      lines.push({
        boxes: currentLine,
        text: currentLine.map(b => b.text).join(' '),
        y: currentLine[0].y,
        height: Math.max(...currentLine.map(b => b.height)),
      });
    }

    return lines;
  }

  /**
   * Batch process multiple images
   * @param {Array<string>} imagePaths - Array of image paths
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of OCR results
   */
  async processBatch(imagePaths, onProgress = null) {
    console.log(`\n🚀 [Tesseract] Starting batch OCR: ${imagePaths.length} images`);

    const results = [];
    let processed = 0;

    for (const imagePath of imagePaths) {
      try {
        const result = await this.extractBoundingBoxes(imagePath);
        results.push({
          success: true,
          imagePath: imagePath,
          ...result,
        });
        processed++;

        if (onProgress) {
          onProgress({
            current: processed,
            total: imagePaths.length,
            filename: path.basename(imagePath),
            progress: Math.round((processed / imagePaths.length) * 100),
          });
        }
      } catch (error) {
        console.error(`❌ [Tesseract] Error processing ${imagePath}:`, error.message);
        results.push({
          success: false,
          imagePath: imagePath,
          error: error.message,
        });
        processed++;
      }
    }

    console.log(`✅ [Tesseract] Batch complete: ${results.filter(r => r.success).length}/${imagePaths.length} successful\n`);

    return results;
  }
}

module.exports = TesseractOCR;
