/**
 * Dropbox Connector for 5ML Platform
 *
 * Provides functionality to:
 * - Access shared Dropbox folder links
 * - List files in folders
 * - Download files to local storage
 * - Filter by file types
 */

import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  is_downloadable: boolean;
  client_modified?: string;
  server_modified?: string;
}

interface DownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
  file: DropboxFile;
}

interface ListFilesResult {
  files: DropboxFile[];
  hasMore: boolean;
  cursor?: string;
}

export class DropboxConnector {
  private client: Dropbox;
  private downloadDir: string;

  constructor(accessToken?: string, downloadDir: string = '/tmp/dropbox-downloads') {
    const token = accessToken || process.env.DROPBOX_ACCESS_TOKEN;

    if (!token) {
      throw new Error(
        'Dropbox access token required. Set DROPBOX_ACCESS_TOKEN environment variable.'
      );
    }

    this.client = new Dropbox({
      accessToken: token,
      fetch: fetch as any,
    });

    this.downloadDir = downloadDir;
  }

  /**
   * Extract shared folder ID from Dropbox URL
   *
   * Supports formats:
   * - https://www.dropbox.com/sh/abc123/xyz
   * - https://www.dropbox.com/scl/fo/abc123/xyz
   */
  private extractSharedLinkId(url: string): string {
    const patterns = [
      /dropbox\.com\/sh\/([^\/\?]+)/,
      /dropbox\.com\/scl\/fo\/([^\/\?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new Error(`Invalid Dropbox shared link: ${url}`);
  }

  /**
   * List files in a shared folder
   *
   * @param sharedUrl - Dropbox shared folder URL
   * @param fileExtensions - Optional filter by extensions (e.g., ['.jpg', '.png'])
   * @returns List of files
   */
  async listFiles(
    sharedUrl: string,
    fileExtensions?: string[]
  ): Promise<ListFilesResult> {
    try {
      // Get shared link metadata
      const linkMetadata = await this.client.sharingGetSharedLinkMetadata({
        url: sharedUrl,
      });

      if (linkMetadata.result['.tag'] !== 'folder') {
        throw new Error('Shared link must be a folder');
      }

      // List folder contents
      const response = await this.client.filesListFolder({
        path: (linkMetadata.result as any).path_lower || '',
      });

      let files: DropboxFile[] = response.result.entries
        .filter((entry: any) => entry['.tag'] === 'file')
        .map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          path_lower: entry.path_lower,
          size: entry.size,
          is_downloadable: entry.is_downloadable !== false,
          client_modified: entry.client_modified,
          server_modified: entry.server_modified,
        }));

      // Filter by extensions if provided
      if (fileExtensions && fileExtensions.length > 0) {
        files = files.filter(file => {
          const ext = path.extname(file.name).toLowerCase();
          return fileExtensions.includes(ext);
        });
      }

      return {
        files,
        hasMore: response.result.has_more,
        cursor: response.result.cursor,
      };
    } catch (error) {
      console.error('Error listing Dropbox files:', error);
      throw error;
    }
  }

  /**
   * Download a single file from Dropbox
   *
   * @param file - Dropbox file metadata
   * @param customPath - Optional custom local path
   * @returns Download result with local file path
   */
  async downloadFile(
    file: DropboxFile,
    customPath?: string
  ): Promise<DownloadResult> {
    try {
      if (!file.is_downloadable) {
        return {
          success: false,
          error: 'File is not downloadable',
          file,
        };
      }

      // Ensure download directory exists
      await fs.mkdir(this.downloadDir, { recursive: true });

      // Determine local file path
      const localPath =
        customPath ||
        path.join(this.downloadDir, this.sanitizeFilename(file.name));

      // Download file
      const response = await this.client.filesDownload({
        path: file.path_lower,
      });

      // Write file to disk
      const fileBlob = (response.result as any).fileBlob;
      const buffer = await fileBlob.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(buffer));

      return {
        success: true,
        localPath,
        file,
      };
    } catch (error) {
      console.error(`Error downloading file ${file.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        file,
      };
    }
  }

  /**
   * Download multiple files from Dropbox
   *
   * @param files - Array of Dropbox file metadata
   * @param onProgress - Optional progress callback
   * @returns Array of download results
   */
  async downloadBatch(
    files: DropboxFile[],
    onProgress?: (current: number, total: number, file: DropboxFile) => void
  ): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (onProgress) {
        onProgress(i + 1, files.length, file);
      }

      const result = await this.downloadFile(file);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Download all receipts from a shared folder
   *
   * @param sharedUrl - Dropbox shared folder URL
   * @param onProgress - Optional progress callback
   * @returns Array of download results
   */
  async downloadReceipts(
    sharedUrl: string,
    onProgress?: (current: number, total: number, fileName: string) => void
  ): Promise<DownloadResult[]> {
    // Receipt image extensions
    const receiptExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    // List receipt images
    const listResult = await this.listFiles(sharedUrl, receiptExtensions);

    console.log(`Found ${listResult.files.length} receipt images`);

    // Download all receipts
    const results = await this.downloadBatch(listResult.files, (current, total, file) => {
      console.log(`Downloading ${current}/${total}: ${file.name}`);
      if (onProgress) {
        onProgress(current, total, file.name);
      }
    });

    return results;
  }

  /**
   * Find P&L files in folder
   *
   * Detects files matching patterns:
   * - P&L*.xlsx
   * - *pnl*.xlsx
   * - *profit*loss*.xlsx
   * - *income*statement*.xlsx
   */
  async findPnLFiles(sharedUrl: string): Promise<DropboxFile[]> {
    const excelExtensions = ['.xlsx', '.xls'];
    const listResult = await this.listFiles(sharedUrl, excelExtensions);

    const pnlPatterns = [
      /p[&-]?l/i,
      /pnl/i,
      /profit.*loss/i,
      /income.*statement/i,
    ];

    return listResult.files.filter(file =>
      pnlPatterns.some(pattern => pattern.test(file.name))
    );
  }

  /**
   * Get download statistics
   *
   * @param results - Array of download results
   * @returns Statistics summary
   */
  getDownloadStats(results: DownloadResult[]): {
    total: number;
    successful: number;
    failed: number;
    totalSizeMB: number;
  } {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalBytes = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.file.size, 0);

    return {
      total: results.length,
      successful,
      failed,
      totalSizeMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    };
  }

  /**
   * Sanitize filename for local filesystem
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
  }

  /**
   * Clear download directory
   */
  async clearDownloads(): Promise<void> {
    try {
      const files = await fs.readdir(this.downloadDir);
      await Promise.all(
        files.map(file =>
          fs.unlink(path.join(this.downloadDir, file))
        )
      );
      console.log(`Cleared ${files.length} files from ${this.downloadDir}`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Error clearing downloads:', error);
      }
    }
  }

  /**
   * Get Dropbox account info
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.client.usersGetCurrentAccount();
      return {
        name: response.result.name.display_name,
        email: response.result.email,
        account_id: response.result.account_id,
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }
}

// Export singleton instance (uses env var)
export const dropboxConnector = new DropboxConnector();

// Export class for custom instances
export default DropboxConnector;
