// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Image Source Resolver
// Normalises source strings to a Buffer or local file path for sharp.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

/**
 * Resolve a source string to a { buffer, originalName } object.
 *
 * Supported sources:
 *   - "local:/path/to/file.jpg"    → reads from disk
 *   - "/absolute/path.jpg"         → reads from disk
 *   - "https://..."                → fetches via HTTP(S)
 *   - "http://..."                 → fetches via HTTP
 *   - "s3://bucket/key"            → stub (returns descriptive error; add AWS SDK later)
 *
 * @param {string} source
 * @returns {Promise<{ buffer: Buffer, originalName: string }>}
 */
async function resolveSource(source) {
  if (!source || typeof source !== 'string') {
    throw new Error('source is required and must be a string');
  }

  // ── Local file (absolute path or explicit local:// scheme) ────────────────
  if (source.startsWith('local://') || source.startsWith('/') || source.match(/^[A-Za-z]:\\/)) {
    const filePath = source.startsWith('local://') ? source.slice(8) : source;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    return { buffer, originalName: path.basename(filePath) };
  }

  // ── HTTP / HTTPS URL ───────────────────────────────────────────────────────
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const buffer = await fetchUrl(source);
    const parts = source.split('/');
    const originalName = parts[parts.length - 1].split('?')[0] || 'image';
    return { buffer, originalName };
  }

  // ── S3 stub ────────────────────────────────────────────────────────────────
  if (source.startsWith('s3://')) {
    throw new Error(
      's3:// sources are not yet implemented. ' +
      'Add AWS SDK integration to utils/imageSource.js to enable S3 support.'
    );
  }

  throw new Error(`Unsupported source format: "${source}". Use a local path, http(s):// URL, or s3:// URI.`);
}

/**
 * Fetch a URL and return the body as a Buffer.
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB hard cap

    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect
        return fetchUrl(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }

      const chunks = [];
      let totalBytes = 0;

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_SIZE) {
          res.destroy();
          return reject(new Error(`Remote image exceeds maximum size of ${MAX_SIZE / 1024 / 1024} MB`));
        }
        chunks.push(chunk);
      });

      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = { resolveSource };
