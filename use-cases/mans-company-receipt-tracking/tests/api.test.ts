/**
 * API Integration Tests for Receipt Processing
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Note: These are integration tests that require the server to be running
// Run with: npm test -- --testPathPattern=api.test.ts

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';

describe('Receipt Processing API', () => {
  describe('POST /api/receipts/process', () => {
    it('should reject request without required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should accept valid processing request', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: 'Test Client',
          dropbox_url: 'https://www.dropbox.com/sh/test123',
          period_start: '2026-01-01',
          period_end: '2026-01-31',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.batch_id).toBeDefined();
      expect(data.status).toBe('pending');

      // Store batch ID for cleanup
      if (data.batch_id) {
        testBatchIds.push(data.batch_id);
      }
    });
  });

  describe('GET /api/receipts/batches', () => {
    it('should return list of batches', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/batches`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.batches)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/batches?limit=5&offset=0`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.batches.length).toBeLessThanOrEqual(5);
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
    });

    it('should support filtering by status', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/batches?status=completed`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.batches.every((b: any) => b.status === 'completed')).toBe(true);
    });
  });

  describe('GET /api/receipts/batches/:batchId/status', () => {
    it('should return 404 for non-existent batch', async () => {
      const fakeBatchId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${BASE_URL}/api/receipts/batches/${fakeBatchId}/status`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/receipts/analytics/categories', () => {
    it('should return category analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/analytics/categories`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
    });
  });

  describe('GET /api/receipts/analytics/compliance', () => {
    it('should return compliance issues', async () => {
      const response = await fetch(`${BASE_URL}/api/receipts/analytics/compliance`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.compliance_issues)).toBe(true);
      expect(data.total_issues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket endpoint', (done) => {
      const wsUrl = BASE_URL.replace('http', 'ws') + '/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        expect(message.type).toBeDefined();
      };

      ws.onclose = () => {
        done();
      };

      ws.onerror = (error) => {
        done(error);
      };
    }, 10000);
  });
});

// Test data cleanup
const testBatchIds: string[] = [];

afterAll(async () => {
  // Clean up test batches if needed
  console.log(`Created ${testBatchIds.length} test batches during tests`);
});
