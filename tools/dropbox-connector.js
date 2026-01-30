/**
 * Dropbox Connector - JavaScript version
 * Downloads receipt images from Dropbox shared folders
 */

const { Dropbox } = require('dropbox');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DropboxConnector {
  constructor(accessToken, options = {}) {
    this.accessToken = accessToken || null;
    this.refreshToken = options.refreshToken || process.env.DROPBOX_REFRESH_TOKEN || null;
    this.clientId = options.clientId || process.env.DROPBOX_APP_KEY || null;
    this.clientSecret = options.clientSecret || process.env.DROPBOX_APP_SECRET || null;
    this.tokenExpiresAt = null;
    this.dbx = null;
    this.activeToken = null;
  }

  async getDropboxClient() {
    const token = await this.getAccessToken();
    if (!this.dbx || token !== this.activeToken) {
      this.activeToken = token;
      this.dbx = new Dropbox({ accessToken: token });
    }
    return this.dbx;
  }

  async getAccessToken() {
    if (!this.accessToken && !this.refreshToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN or DROPBOX_REFRESH_TOKEN is required');
    }

    const shouldRefresh = Boolean(
      this.refreshToken &&
      (!this.accessToken || (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt - 60000))
    );

    if (shouldRefresh) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, and DROPBOX_APP_SECRET are required to refresh tokens');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.refreshToken);

    const response = await axios.post(
      'https://api.dropbox.com/oauth2/token',
      params,
      {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.accessToken = response.data.access_token;
    const expiresIn = Number(response.data.expires_in);
    this.tokenExpiresAt = Number.isFinite(expiresIn) ? Date.now() + (expiresIn * 1000) : null;
    return this.accessToken;
  }

  /**
   * Extract shared link metadata
   */
  parseSharedLink(url) {
    // Extract the shared link ID from various Dropbox URL formats
    const patterns = [
      /dropbox\.com\/scl\/f[o|i]\/([^\/\?]+)/,  // New format (folder/file)
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

  isSharedLink(url) {
    try {
      this.parseSharedLink(url);
      return true;
    } catch {
      return false;
    }
  }

  resolveFolderSource(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) {
      throw new Error('Dropbox folder is required');
    }

    if (this.isSharedLink(trimmed)) {
      return { type: 'shared', url: trimmed };
    }

    if (trimmed.startsWith('http')) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.hostname.includes('dropbox.com') && parsed.pathname.startsWith('/home')) {
          const rawPath = parsed.pathname.replace('/home', '');
          const decoded = decodeURIComponent(rawPath);
          const normalized = decoded.startsWith('/') ? decoded : `/${decoded}`;
          return { type: 'path', path: normalized };
        }
      } catch {
        // fall through
      }

      throw new Error('Please use a Dropbox shared folder link or a Dropbox path like /Receipts');
    }

    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return { type: 'path', path: normalized };
  }

  /**
   * List files in shared folder
   */
  async listFiles(sharedUrl, extensions = ['.jpg', '.jpeg', '.png', '.webp']) {
    try {
      const source = this.resolveFolderSource(sharedUrl);
      console.log(`📋 [Dropbox] Listing files from: ${source.type === 'shared' ? source.url : source.path}`);
      const dbx = await this.getDropboxClient();

      let rootPath = '';
      let sharedRootName = '';
      let response;

      if (source.type === 'shared') {
        const metadataResponse = await dbx.sharingGetSharedLinkMetadata({
          url: source.url
        });
        rootPath = metadataResponse.result.path_display || metadataResponse.result.path_lower || '';
        sharedRootName = metadataResponse.result.name || '';
        if (!rootPath && metadataResponse.result.name) {
          rootPath = `/${metadataResponse.result.name}`;
        }

        response = await dbx.filesListFolder({
          path: '',
          shared_link: { url: source.url }
        });
      } else {
        response = await dbx.filesListFolder({
          path: source.path
        });
      }

      // Filter for image files
      const imageFiles = response.result.entries.filter(entry => {
        if (entry['.tag'] !== 'file') return false;
        const ext = path.extname(entry.name).toLowerCase();
        return extensions.includes(ext);
      });

      console.log(`✅ [Dropbox] Found ${imageFiles.length} image files`);

      if (!rootPath && imageFiles.length > 0) {
        const samplePath = imageFiles[0].path_display || imageFiles[0].path_lower || '';
        if (samplePath.startsWith('/')) {
          const segments = samplePath.split('/').filter(Boolean);
          if (segments.length > 0) {
            rootPath = `/${segments[0]}`;
          }
        }
      }
      if (!sharedRootName && rootPath) {
        const segments = rootPath.split('/').filter(Boolean);
        if (segments.length > 0) {
          sharedRootName = segments[segments.length - 1];
        }
      }

      return {
        files: imageFiles,
        total: imageFiles.length,
        rootPath,
        sharedRootName,
        source
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

      const source = this.resolveFolderSource(sharedUrl);
      const dbx = await this.getDropboxClient();
      let response;

      if (source.type === 'shared') {
        response = await dbx.sharingGetSharedLinkFile({
          url: source.url,
          path: filePath
        });
      } else {
        response = await dbx.filesDownload({
          path: filePath
        });
      }

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
      const errorSummary = error?.error?.error_summary || error?.error?.error_summary || '';
      const errorReason = error?.error?.error?.path?.['.tag'] || '';
      console.error(
        `❌ [Dropbox] Error downloading ${filePath}:`,
        error.message,
        errorSummary ? `(${errorSummary})` : '',
        errorReason ? `(${errorReason})` : ''
      );
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
      const { files, rootPath, sharedRootName, source } = await this.listFiles(sharedUrl);

      if (files.length === 0) {
        throw new Error('No receipt images found in Dropbox folder');
      }

      const results = [];
      let processed = 0;

      // Download each file
      for (const file of files) {
        try {
          let filePath = file.path_display || file.path_lower || file.name;
          if (source.type === 'shared') {
            if (sharedRootName && filePath.startsWith(`/${sharedRootName}`)) {
              filePath = filePath.slice(sharedRootName.length + 1);
            }
            if (rootPath && filePath.startsWith(rootPath)) {
              filePath = filePath.slice(rootPath.length);
            }
            if (!filePath.startsWith('/')) {
              filePath = `/${filePath}`;
            }
            if (filePath === '/' && file.name) {
              filePath = `/${file.name}`;
            }
          } else if (!filePath.startsWith('/')) {
            filePath = `/${filePath}`;
          }

          const result = await this.downloadFile(sharedUrl, filePath, outputDir);
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
