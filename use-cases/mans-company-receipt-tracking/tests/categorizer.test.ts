/**
 * Categorizer Agent Tests
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { CategorizerAgent } from '../agents/categorizer-agent';
import path from 'path';

describe('Categorizer Agent', () => {
  let categorizer: CategorizerAgent;

  beforeAll(() => {
    const kbPath = path.join(__dirname, '../kb');
    categorizer = new CategorizerAgent(kbPath);
  });

  describe('Category Matching', () => {
    it('should categorize office supplies correctly', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'Office Depot Hong Kong',
        amount: 245.50,
        currency: 'HKD',
        description: 'Printer paper and ink cartridges',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('5100');
      expect(result.category_name).toBe('Office Supplies');
      expect(result.deductible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should categorize meals with HKD 300 limit', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: '翠華餐廳 Tsui Wah',
        amount: 450.00,
        currency: 'HKD',
        description: 'Client lunch meeting',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('5300');
      expect(result.category_name).toBe('Meals & Entertainment');
      expect(result.deductible_amount).toBe(300);
      expect(result.non_deductible_amount).toBe(150);
      expect(result.compliance_warnings.length).toBeGreaterThan(0);
    });

    it('should categorize MTR travel correctly', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: '港鐵 MTR',
        amount: 50.00,
        currency: 'HKD',
        description: 'Business trip to client office',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('5200');
      expect(result.category_name).toBe('Travel & Transportation');
      expect(result.deductible).toBe(true);
    });

    it('should flag personal expenses as non-deductible', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: '百佳超級市場',
        amount: 200.00,
        currency: 'HKD',
        description: 'Personal groceries shopping',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('9999');
      expect(result.deductible).toBe(false);
      expect(result.deductible_amount).toBe(0);
      expect(result.non_deductible_amount).toBe(200);
    });
  });

  describe('HK Compliance Rules', () => {
    it('should warn about foreign currency', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'US Vendor',
        amount: 100.00,
        currency: 'USD',
        description: 'Software subscription',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.compliance_warnings).toContainEqual(
        expect.stringContaining('Currency is USD')
      );
    });

    it('should flag high amounts for review', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'Office Depot',
        amount: 10000.00,
        currency: 'HKD',
        description: 'Large office equipment purchase',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.compliance_warnings.length).toBeGreaterThan(0);
      expect(result.requires_review).toBe(true);
    });

    it('should error on invalid vendor name', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'N/A',
        amount: 100.00,
        currency: 'HKD',
        description: 'Some purchase',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.compliance_errors.length).toBeGreaterThan(0);
      expect(result.requires_review).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for clear vendor match', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'Office Depot Hong Kong Limited',
        amount: 100.00,
        currency: 'HKD',
        description: 'Office stationery',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should have lower confidence for ambiguous description', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: 'Generic Store',
        amount: 100.00,
        currency: 'HKD',
        description: 'Various items',
      };

      const result = await categorizer.categorize(extractedData);

      // Will default to Professional Services with penalty
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.requires_review).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple receipts and return stats', async () => {
      const receipts = [
        {
          date: '2026-01-18',
          vendor: 'Office Depot',
          amount: 100.00,
          currency: 'HKD',
          description: 'Office supplies',
        },
        {
          date: '2026-01-18',
          vendor: 'Tsui Wah',
          amount: 250.00,
          currency: 'HKD',
          description: 'Client lunch',
        },
        {
          date: '2026-01-18',
          vendor: 'MTR',
          amount: 50.00,
          currency: 'HKD',
          description: 'Business travel',
        },
      ];

      const results = await categorizer.categorizeBatch(receipts);

      expect(results.length).toBe(3);
      expect(results.every(r => r.confidence >= 0)).toBe(true);

      const stats = categorizer.getCategoryStats(results);

      expect(stats.totalAmount).toBe(400.00);
      expect(stats.deductibleAmount).toBeGreaterThan(0);
      expect(Object.keys(stats.categoryBreakdown).length).toBeGreaterThan(0);
    });
  });

  describe('Chinese Language Support', () => {
    it('should handle Traditional Chinese vendor names', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: '翠華餐廳',
        amount: 200.00,
        currency: 'HKD',
        description: '午餐',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('5300');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should match Chinese keywords', async () => {
      const extractedData = {
        date: '2026-01-18',
        vendor: '文具店',
        amount: 50.00,
        currency: 'HKD',
        description: '打印紙及文具',
      };

      const result = await categorizer.categorize(extractedData);

      expect(result.category_id).toBe('5100');
    });
  });
});
