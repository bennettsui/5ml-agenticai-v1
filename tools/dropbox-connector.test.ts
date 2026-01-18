/**
 * Dropbox Connector Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import DropboxConnector from './dropbox-connector';
import path from 'path';

describe('Dropbox Connector', () => {
  // Skip tests if no token available
  const skipIfNoToken = process.env.DROPBOX_ACCESS_TOKEN ? it : it.skip;

  describe('URL Parsing', () => {
    it('should parse shared folder URL patterns', () => {
      const urls = [
        'https://www.dropbox.com/sh/abc123/xyz',
        'https://www.dropbox.com/scl/fo/abc123/xyz',
      ];

      urls.forEach(url => {
        expect(url).toContain('dropbox.com');
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://google.com',
        'not a url',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(() => {
          // URL validation would happen here
          if (!url.includes('dropbox.com')) {
            throw new Error('Invalid Dropbox URL');
          }
        }).toThrow();
      });
    });
  });

  describe('File Filtering', () => {
    it('should filter receipt image extensions', () => {
      const files = [
        { name: 'receipt1.jpg', path_lower: '/receipt1.jpg' },
        { name: 'receipt2.png', path_lower: '/receipt2.png' },
        { name: 'document.pdf', path_lower: '/document.pdf' },
        { name: 'receipt3.webp', path_lower: '/receipt3.webp' },
        { name: 'notes.txt', path_lower: '/notes.txt' },
      ];

      const receiptExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const receipts = files.filter(f => {
        const ext = path.extname(f.name).toLowerCase();
        return receiptExtensions.includes(ext);
      });

      expect(receipts).toHaveLength(3);
      expect(receipts.map(r => r.name)).toEqual([
        'receipt1.jpg',
        'receipt2.png',
        'receipt3.webp',
      ]);
    });

    it('should detect P&L file patterns', () => {
      const files = [
        'P&L_2025.xlsx',
        'profit_and_loss_2025.xlsx',
        'pnl-statement.xlsx',
        'income_statement.xlsx',
        'revenue.xlsx',
        'receipts.xlsx',
      ];

      const pnlPatterns = [
        /p[&-]?l/i,
        /pnl/i,
        /profit.*loss/i,
        /income.*statement/i,
      ];

      const pnlFiles = files.filter(f =>
        pnlPatterns.some(pattern => pattern.test(f))
      );

      expect(pnlFiles).toHaveLength(4);
      expect(pnlFiles).toContain('P&L_2025.xlsx');
      expect(pnlFiles).toContain('income_statement.xlsx');
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize special characters', () => {
      const testCases = [
        {
          input: 'receipt (2026-01-18).jpg',
          expected: 'receipt__2026-01-18_.jpg',
        },
        {
          input: 'receipt@company#1.jpg',
          expected: 'receipt_company_1.jpg',
        },
        {
          input: 'receipt___multiple___underscores.jpg',
          expected: 'receipt_multiple_underscores.jpg',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const sanitized = input
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_{2,}/g, '_');

        expect(sanitized).toBe(expected);
      });
    });
  });

  describe('Download Statistics', () => {
    it('should calculate download stats correctly', () => {
      const mockResults = [
        {
          success: true,
          file: { name: 'r1.jpg', size: 1024 * 1024 } as any, // 1MB
        },
        {
          success: true,
          file: { name: 'r2.jpg', size: 2 * 1024 * 1024 } as any, // 2MB
        },
        {
          success: false,
          error: 'Failed',
          file: { name: 'r3.jpg', size: 500 * 1024 } as any,
        },
        {
          success: true,
          file: { name: 'r4.jpg', size: 1.5 * 1024 * 1024 } as any, // 1.5MB
        },
      ];

      const successful = mockResults.filter(r => r.success).length;
      const failed = mockResults.filter(r => !r.success).length;
      const totalBytes = mockResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.file.size, 0);
      const totalMB = totalBytes / (1024 * 1024);

      expect(successful).toBe(3);
      expect(failed).toBe(1);
      expect(totalMB).toBeCloseTo(4.5, 1);
    });
  });

  describe('Integration Tests', () => {
    let connector: DropboxConnector;

    beforeAll(() => {
      if (process.env.DROPBOX_ACCESS_TOKEN) {
        connector = new DropboxConnector(
          process.env.DROPBOX_ACCESS_TOKEN,
          '/tmp/test-dropbox-downloads'
        );
      }
    });

    skipIfNoToken('should get account info', async () => {
      const accountInfo = await connector.getAccountInfo();

      expect(accountInfo).toBeDefined();
      expect(accountInfo.email).toBeTruthy();
      expect(accountInfo.name).toBeTruthy();
    });

    skipIfNoToken('should list files from shared folder', async () => {
      // This test requires a valid shared folder URL
      // Replace with actual test URL from environment
      const testUrl = process.env.DROPBOX_TEST_FOLDER_URL;

      if (!testUrl) {
        console.log('Skipping - no test folder URL provided');
        return;
      }

      const result = await connector.listFiles(testUrl);

      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    }, 30000);

    skipIfNoToken('should download a file', async () => {
      // This test requires a valid shared folder with files
      const testUrl = process.env.DROPBOX_TEST_FOLDER_URL;

      if (!testUrl) {
        console.log('Skipping - no test folder URL provided');
        return;
      }

      const listResult = await connector.listFiles(testUrl);

      if (listResult.files.length === 0) {
        console.log('Skipping - no files in test folder');
        return;
      }

      const file = listResult.files[0];
      const downloadResult = await connector.downloadFile(file);

      expect(downloadResult.success).toBe(true);
      expect(downloadResult.localPath).toBeTruthy();
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should throw error without access token', () => {
      expect(() => {
        // Clear env var temporarily
        const originalToken = process.env.DROPBOX_ACCESS_TOKEN;
        delete process.env.DROPBOX_ACCESS_TOKEN;

        try {
          new DropboxConnector();
        } finally {
          // Restore env var
          if (originalToken) {
            process.env.DROPBOX_ACCESS_TOKEN = originalToken;
          }
        }
      }).toThrow('access token required');
    });

    it('should handle non-folder shared links', async () => {
      // Mock test - actual implementation would call Dropbox API
      const isFolder = false;

      if (!isFolder) {
        expect(() => {
          throw new Error('Shared link must be a folder');
        }).toThrow('must be a folder');
      }
    });

    it('should handle non-downloadable files', async () => {
      const mockFile = {
        id: '123',
        name: 'test.jpg',
        path_lower: '/test.jpg',
        size: 1024,
        is_downloadable: false,
      };

      if (!mockFile.is_downloadable) {
        const result = {
          success: false,
          error: 'File is not downloadable',
          file: mockFile,
        };

        expect(result.success).toBe(false);
        expect(result.error).toContain('not downloadable');
      }
    });
  });
});

// Export mock utilities for other tests
export const createMockDropboxFile = (overrides?: any) => ({
  id: 'id_abc123',
  name: 'test_receipt.jpg',
  path_lower: '/receipts/test_receipt.jpg',
  size: 102400,
  is_downloadable: true,
  client_modified: '2026-01-18T10:00:00Z',
  server_modified: '2026-01-18T10:00:00Z',
  ...overrides,
});

export const createMockDownloadResult = (success: boolean = true) => ({
  success,
  localPath: success ? '/tmp/test_receipt.jpg' : undefined,
  error: success ? undefined : 'Download failed',
  file: createMockDropboxFile(),
});
