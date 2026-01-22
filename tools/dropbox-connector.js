/**
 * Dropbox Connector - JavaScript version
 * Downloads receipt images from Dropbox shared folders
 */

const { Dropbox } = require('dropbox');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DropboxConnector {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN is required');
    }
    this.dbx = new Dropbox({ accessToken });
  }

  normalizeSharedUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (error) {
      return url;
    }
  }

  /**
   * Extract shared link metadata
   */
  parseSharedLink(url) {
    // Extract the shared link ID from various Dropbox URL formats
    const patterns = [
      /dropbox\.com\/scl\/fo\/([^\/\?]+)/,  // New format
      /dropbox\.com\/sh\/([^\/\?]+)/,        // Old format
      /dropbox\.com\/s\/([^\/\?]+)/          // Short format
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { id: match[1], url };
      }
    }

    throw new Error('Invalid Dropbox shared link format');
  }

  /**
   * List files in shared folder
   */
  async listFiles(sharedUrl, extensions = ['.jpg', '.jpeg', '.png', '.webp']) {
    try {
      console.log(`📋 [Dropbox] Listing files from: ${sharedUrl}`);

      const normalizedUrl = this.normalizeSharedUrl(sharedUrl);
      let metadata = null;
      try {
        metadata = await this.dbx.sharingGetSharedLinkMetadata({
          url: normalizedUrl
        });
      } catch (error) {
        console.warn('⚠️  [Dropbox] shared link metadata failed, continuing:', error.message);
      }

      if (metadata && metadata.result['.tag'] === 'file') {
        const name = metadata.result.name;
        const ext = path.extname(name).toLowerCase();
        if (!extensions.includes(ext)) {
          return { files: [], total: 0 };
        }
        return {
          files: [{
            name,
            path_display: null,
            is_shared_file: true
          }],
          total: 1
        };
      }

      let response;
      try {
        // List folder contents via shared link
        response = await this.dbx.filesListFolder({
          path: '',
          shared_link: { url: normalizedUrl }
        });
      } catch (error) {
        console.warn('⚠️  [Dropbox] filesListFolder failed, retrying with original URL:', error.message);
        response = await this.dbx.filesListFolder({
          path: '',
          shared_link: { url: sharedUrl }
        });
      }

      // Filter for image files
      const imageFiles = response.result.entries.filter(entry => {
        if (entry['.tag'] !== 'file') return false;
        const ext = path.extname(entry.name).toLowerCase();
        return extensions.includes(ext);
      });

      console.log(`✅ [Dropbox] Found ${imageFiles.length} image files`);

      return {
        files: imageFiles,
        total: imageFiles.length
      };
    } catch (error) {
      const errorSummary = error?.error?.error_summary || error?.error?.error;
      const status = error?.status || error?.response?.status;
      const details = [
        errorSummary ? `summary=${errorSummary}` : null,
        status ? `status=${status}` : null
      ].filter(Boolean).join(' ');
      const message = details ? `${error.message} (${details})` : error.message;
      console.error('❌ [Dropbox] Error listing files:', message);
      throw new Error(`Failed to list Dropbox files: ${message}`);
    }
  }

  /**
   * Download a single file
   */
  async downloadFile(sharedUrl, filePath, outputDir, filenameOverride = null) {
    try {
      console.log(`⬇️  [Dropbox] Downloading: ${filePath || filenameOverride || sharedUrl}`);

      const normalizedUrl = this.normalizeSharedUrl(sharedUrl);
      const requestFile = async (urlValue, pathValue) => {
        if (pathValue) {
          return await this.dbx.sharingGetSharedLinkFile({ url: urlValue, path: pathValue });
        }
        return await this.dbx.sharingGetSharedLinkFile({ url: urlValue });
      };

      const candidates = [];
      if (filePath) {
        candidates.push(filePath);
        if (!filePath.startsWith('/')) {
          candidates.push(`/${filePath}`);
        }
        const base = path.basename(filePath);
        candidates.push(base);
        candidates.push(`/${base}`);
      }

      let response;
      let lastError = null;
      for (const candidate of candidates) {
        try {
          response = await requestFile(normalizedUrl, candidate);
          break;
        } catch (error) {
          lastError = error;
          const status = error?.status || error?.response?.status;
          if (status !== 400 && status !== 409) {
            throw error;
          }
        }
      }

      if (!response) {
        try {
          response = await requestFile(normalizedUrl, null);
        } catch (error) {
          lastError = error;
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate output filename
      const filename = filenameOverride || path.basename(filePath || 'receipt');
      const outputPath = path.join(outputDir, filename);

      // Write file
      await fs.writeFile(outputPath, response.result.fileBinary);

      // Calculate SHA-256 hash for duplicate detection
      const fileBuffer = await fs.readFile(outputPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      console.log(`✅ [Dropbox] Downloaded: ${filename}`);

      return {
        filename,
        path: outputPath,
        hash,
        size: fileBuffer.length
      };
    } catch (error) {
      const errorSummary = error?.error?.error_summary || error?.error?.error;
      const status = error?.status || error?.response?.status;
      const details = [
        errorSummary ? `summary=${errorSummary}` : null,
        status ? `status=${status}` : null
      ].filter(Boolean).join(' ');
      const message = details ? `${error.message} (${details})` : error.message;
      console.error(`❌ [Dropbox] Error downloading ${filePath}:`, message);
      throw new Error(`Failed to download file: ${message}`);
    }
  }

  /**
   * Download all receipts from shared folder
   */
  async downloadReceipts(sharedUrl, outputDir = '/tmp/receipts', onProgress = null) {
    try {
      console.log(`🚀 [Dropbox] Starting batch download`);

      // List files
      const { files } = await this.listFiles(sharedUrl);

      if (files.length === 0) {
        throw new Error('No receipt images found in Dropbox folder');
      }

      const results = [];
      let processed = 0;

      // Download each file
      for (const file of files) {
        try {
          const result = await this.downloadFile(
            sharedUrl,
            file.name || file.path_lower || file.path_display,
            outputDir,
            file.name || null
          );
          results.push({
            success: true,
            ...result
          });

          processed++;
          if (onProgress) {
            onProgress({
              current: processed,
              total: files.length,
              filename: result.filename,
              progress: Math.round((processed / files.length) * 100)
            });
          }
        } catch (error) {
          results.push({
            success: false,
            filename: file.name,
            error: error.message
          });
          processed++;
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ [Dropbox] Download complete: ${successful} successful, ${failed} failed`);

      return {
        results,
        total: files.length,
        successful,
        failed
      };
    } catch (error) {
      console.error('❌ [Dropbox] Batch download failed:', error.message);
      throw error;
    }
  }
}

module.exports = DropboxConnector;
