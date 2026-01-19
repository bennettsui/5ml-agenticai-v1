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

      const { id } = this.parseSharedLink(sharedUrl);

      // List folder contents
      const response = await this.dbx.filesListFolder({
        path: '',
        shared_link: { url: sharedUrl }
      });

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
      console.error('❌ [Dropbox] Error listing files:', error.message);
      throw new Error(`Failed to list Dropbox files: ${error.message}`);
    }
  }

  /**
   * Download a single file
   */
  async downloadFile(sharedUrl, filePath, outputDir) {
    try {
      console.log(`⬇️  [Dropbox] Downloading: ${filePath}`);

      const response = await this.dbx.sharingGetSharedLinkFile({
        url: sharedUrl,
        path: filePath
      });

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate output filename
      const filename = path.basename(filePath);
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
      console.error(`❌ [Dropbox] Error downloading ${filePath}:`, error.message);
      throw new Error(`Failed to download file: ${error.message}`);
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
          const result = await this.downloadFile(sharedUrl, file.path_display, outputDir);
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
