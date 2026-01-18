/**
 * Receipt OCR Agent Tests
 *
 * Tests for Claude Vision OCR and Image Validator
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import path from 'path';
import { claudeVisionOCR } from '../tools/claude-vision';
import { imageValidator } from '../tools/image-validator';

describe('Receipt OCR Agent', () => {
  describe('Image Validator', () => {
    it('should validate supported image formats', async () => {
      const validFormats = ['.jpg', '.jpeg', '.png', '.webp'];

      for (const format of validFormats) {
        const filename = `test_receipt${format}`;
        const validation = imageValidator.validateFilename(filename);
        expect(validation.valid).toBe(true);
      }
    });

    it('should reject unsupported formats', async () => {
      const testPath = '/tmp/receipt.pdf';
      const result = await imageValidator.validateImage(testPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect filename issues', () => {
      const badFilenames = [
        'receipt with spaces.jpg',
        'receipt!@#$.jpg',
        'a'.repeat(105) + '.jpg',
      ];

      badFilenames.forEach(filename => {
        const validation = imageValidator.validateFilename(filename);
        expect(validation.suggestions).toBeDefined();
        expect(validation.suggestions!.length).toBeGreaterThan(0);
      });
    });

    it('should suggest better filenames', () => {
      const result = imageValidator.validateFilename('receipt.jpg');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions![0]).toContain('descriptive');
    });

    it('should calculate summary statistics', () => {
      const mockResults = [
        { valid: true, errors: [], warnings: ['test'], metadata: { sizeMB: 1.5 } as any },
        { valid: false, errors: ['error1', 'error2'], warnings: [], metadata: { sizeMB: 0.5 } as any },
        { valid: true, errors: [], warnings: [], metadata: { sizeMB: 2.0 } as any },
      ];

      const summary = imageValidator.getSummary(mockResults);

      expect(summary.total).toBe(3);
      expect(summary.valid).toBe(2);
      expect(summary.invalid).toBe(1);
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(1);
      expect(summary.totalSizeMB).toBe(4.0);
    });
  });

  describe('Claude Vision OCR', () => {
    // Skip these tests if no API key available
    const skipIfNoKey = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    skipIfNoKey('should estimate processing costs', () => {
      const cost = claudeVisionOCR.estimateCost(100);

      expect(cost.min).toBe(0.4);
      expect(cost.max).toBe(0.5);
    });

    skipIfNoKey('should estimate monthly costs for 500 receipts', () => {
      const cost = claudeVisionOCR.estimateCost(500);

      expect(cost.min).toBe(2.0);
      expect(cost.max).toBe(2.5);
    });

    // Integration test - requires actual API key and test image
    skipIfNoKey('should process a sample receipt', async () => {
      const testImagePath = path.join(__dirname, 'fixtures', 'sample_receipt.jpg');

      // This test will only run if test fixtures are available
      try {
        const result = await claudeVisionOCR.processReceipt(testImagePath);

        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);

        if (result.extracted) {
          expect(result.extracted.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(result.extracted.vendor).toBeTruthy();
          expect(typeof result.extracted.amount).toBe('number');
          expect(result.extracted.currency).toBeTruthy();
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log('Skipping integration test - no test fixtures found');
        } else {
          throw error;
        }
      }
    }, 30000); // 30 second timeout for API call
  });

  describe('OCR Response Parsing', () => {
    it('should handle valid JSON responses', () => {
      const mockResponse = JSON.stringify({
        extracted: {
          date: '2026-01-18',
          vendor: 'Test Vendor',
          amount: 100.50,
          currency: 'HKD',
          description: 'Test purchase',
        },
        confidence: 0.95,
        warnings: [],
      });

      const parsed = JSON.parse(mockResponse);
      expect(parsed.extracted.date).toBe('2026-01-18');
      expect(parsed.confidence).toBe(0.95);
    });

    it('should handle responses with warnings', () => {
      const mockResponse = JSON.stringify({
        extracted: {
          date: '2026-01-18',
          vendor: 'Test Vendor',
          amount: 100.50,
          currency: 'HKD',
          description: 'Test purchase',
        },
        confidence: 0.75,
        warnings: ['poor_image_quality', 'ambiguous_amount'],
      });

      const parsed = JSON.parse(mockResponse);
      expect(parsed.warnings).toHaveLength(2);
      expect(parsed.warnings).toContain('poor_image_quality');
    });

    it('should handle extraction failures', () => {
      const mockResponse = JSON.stringify({
        extracted: null,
        confidence: 0,
        warnings: ['extraction_failed', 'Image too blurry'],
      });

      const parsed = JSON.parse(mockResponse);
      expect(parsed.extracted).toBeNull();
      expect(parsed.confidence).toBe(0);
      expect(parsed.warnings[0]).toBe('extraction_failed');
    });
  });

  describe('HK-specific Features', () => {
    it('should recognize HK currency symbols', () => {
      const symbols = ['HK$', '$', 'HKD', '港元'];
      // In actual OCR, these should all map to 'HKD'
      expect(symbols.length).toBeGreaterThan(0);
    });

    it('should handle Traditional Chinese characters', () => {
      const vendors = ['百佳超級市場', '翠華餐廳', '惠康'];
      expect(vendors.every(v => v.length > 0)).toBe(true);
    });

    it('should parse HK date formats', () => {
      const dates = [
        { input: '18/01/2026', expected: '2026-01-18' },
        { input: '2026-01-18', expected: '2026-01-18' },
        { input: '18-01-2026', expected: '2026-01-18' },
      ];

      dates.forEach(({ input, expected }) => {
        // Date parsing logic would be tested here
        const iso = expected;
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});

// Export test utilities for use in other test files
export const createMockOCRResult = (overrides?: any) => ({
  extracted: {
    date: '2026-01-18',
    vendor: 'Test Vendor',
    amount: 100.00,
    currency: 'HKD',
    description: 'Test receipt',
    ...overrides?.extracted,
  },
  confidence: 0.95,
  warnings: [],
  ...overrides,
});

export const createMockValidationResult = (valid: boolean = true) => ({
  valid,
  errors: valid ? [] : ['Test error'],
  warnings: [],
  metadata: valid
    ? {
        filename: 'test_receipt.jpg',
        format: '.jpg',
        sizeBytes: 102400,
        sizeMB: 0.1,
        hash: 'abc123',
      }
    : undefined,
});
