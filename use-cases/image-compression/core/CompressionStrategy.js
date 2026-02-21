// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Compression Strategy
// Resolves a request (profile + constraints + tags) into concrete sharp params.
// ─────────────────────────────────────────────────────────────────────────────

const { PROFILES, TAG_OVERRIDES } = require('../config/profiles');

/**
 * Resolve the full compression parameters for a request.
 *
 * @param {object} request
 * @param {string}        request.profile         - 'auto'|'web'|'lossless'|'thumbnail'|'aggressive'
 * @param {string|null}   request.target_format   - 'original'|'jpeg'|'webp'|'avif'|null
 * @param {number|null}   request.max_width
 * @param {number|null}   request.max_height
 * @param {number|null}   request.max_size_kb
 * @param {string}        request.priority        - 'quality'|'size'|'balanced'
 * @param {string[]}      request.tags
 * @param {object}        imageMeta               - from SharpAdapter.probe()
 * @param {number}        imageMeta.width
 * @param {number}        imageMeta.height
 * @param {string}        imageMeta.format
 * @param {number}        imageMeta.size          - bytes (original)
 *
 * @returns {{ params: object, logs: string[] }}
 */
function resolve(request, imageMeta) {
  const logs = [];
  const profile = (request.profile || 'auto').toLowerCase();

  // ── 1. Select base profile ────────────────────────────────────────────────
  if (!PROFILES[profile]) {
    throw new Error(`Unknown profile: "${profile}". Valid profiles: ${Object.keys(PROFILES).join(', ')}`);
  }

  let params = { ...PROFILES[profile] };
  logs.push(`Profile selected: ${profile} — ${params.description}`);

  // ── 2. Auto-profile resolution ────────────────────────────────────────────
  if (profile === 'auto') {
    params = resolveAutoProfile(request, imageMeta, params, logs);
  }

  // ── 3. Apply tag-based overrides ──────────────────────────────────────────
  const tags = Array.isArray(request.tags) ? request.tags : [];
  for (const tag of tags) {
    const override = TAG_OVERRIDES[tag];
    if (override) {
      Object.assign(params, override);
      logs.push(`Tag override applied: "${tag}" → ${JSON.stringify(override)}`);
    }
  }

  // ── 4. Apply explicit request overrides ───────────────────────────────────
  if (request.target_format && request.target_format !== 'original') {
    params.preferredFormat = request.target_format;
    logs.push(`target_format override: ${request.target_format}`);
  }

  if (request.max_width != null) {
    params.maxWidth = Math.min(params.maxWidth || Infinity, request.max_width);
    logs.push(`max_width capped at: ${params.maxWidth}`);
  }

  if (request.max_height != null) {
    params.maxHeight = Math.min(params.maxHeight || Infinity, request.max_height);
    logs.push(`max_height capped at: ${params.maxHeight}`);
  }

  // ── 5. Apply priority adjustments ────────────────────────────────────────
  if (request.priority === 'quality') {
    params.quality = Math.min(100, (params.quality || 78) + 8);
    params.effort = Math.max(0, (params.effort || 4) - 1);
    logs.push(`Priority: quality → quality bumped to ${params.quality}`);
  } else if (request.priority === 'size') {
    params.quality = Math.max(30, (params.quality || 78) - 12);
    params.effort = Math.min(9, (params.effort || 4) + 2);
    params.stripMetadata = true;
    logs.push(`Priority: size → quality reduced to ${params.quality}`);
  }

  // ── 6. Safety caps ────────────────────────────────────────────────────────
  if (params.maxWidth  > 4096) params.maxWidth  = 4096;
  if (params.maxHeight > 4096) params.maxHeight = 4096;
  params.quality = Math.min(100, Math.max(1, params.quality || 78));

  logs.push(`Final params: format=${params.preferredFormat || 'original'}, quality=${params.quality}, max=${params.maxWidth}×${params.maxHeight}, lossless=${params.lossless}, stripMeta=${params.stripMetadata}`);

  return {
    params: {
      targetFormat:     params.preferredFormat,
      maxWidth:         params.maxWidth || null,
      maxHeight:        params.maxHeight || null,
      quality:          params.quality,
      compressionLevel: params.compressionLevel || 8,
      lossless:         params.lossless || false,
      effort:           params.effort || 4,
      stripMetadata:    params.stripMetadata !== false,
      mozjpeg:          params.mozjpeg !== false,
      maxSizeKb:        request.max_size_kb || null,
    },
    profileUsed: profile,
    logs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-profile heuristics
// ─────────────────────────────────────────────────────────────────────────────

function resolveAutoProfile(request, meta, baseParams, logs) {
  const { width = 0, height = 0, size = 0, format = '' } = meta;
  const sizeKb = size / 1024;
  const tags = Array.isArray(request.tags) ? request.tags : [];

  // Already-tiny image — use lossless to avoid further degradation
  if (sizeKb < 50) {
    const p = { ...PROFILES.lossless };
    logs.push(`Auto: small image (${Math.round(sizeKb)}KB) → lossless`);
    return p;
  }

  // Large image with social tag → web profile
  if (tags.includes('social')) {
    const p = { ...PROFILES.web };
    logs.push('Auto: social tag → web profile');
    return p;
  }

  // Tender/proposal — prefer jpeg for PDF compatibility
  if (tags.includes('tender') || tags.includes('proposal')) {
    const p = { ...PROFILES.web, preferredFormat: 'jpeg', quality: 75, maxWidth: 1600, maxHeight: 900 };
    logs.push('Auto: tender/proposal tag → web-jpeg profile');
    return p;
  }

  // Large images → aggressive
  if (sizeKb > 2000 || (width > 3000 && height > 2000)) {
    const p = { ...PROFILES.aggressive };
    logs.push(`Auto: large image (${Math.round(sizeKb)}KB, ${width}×${height}) → aggressive`);
    return p;
  }

  // Default → web
  const p = { ...PROFILES.web };
  logs.push(`Auto: default → web profile (${Math.round(sizeKb)}KB, ${width}×${height})`);
  return p;
}

module.exports = { resolve };
