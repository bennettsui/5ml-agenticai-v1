// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Express API Routes
// Base path: /api/compress
// ─────────────────────────────────────────────────────────────────────────────

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const { resolveSource }     = require('../utils/imageSource');
const { probe }             = require('../core/SharpAdapter');
const { resolve: resolveStrategy } = require('../core/CompressionStrategy');
const { enforce }           = require('../core/SizeEnforcer');

const router = express.Router();

// ── Output directory ───────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'compressed');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Multer — direct file upload (multipart/form-data) ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|webp|avif|gif|svg\+xml|tiff)/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported MIME type: ${file.mimetype}`));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/compress
// Accepts either:
//   a) JSON body with a "source" field (URL or local path)
//   b) multipart/form-data with a "file" field (direct upload)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const logs = [];

  try {
    // ── Parse request ──────────────────────────────────────────────────────
    let body;
    if (req.is('multipart/form-data')) {
      // Merge form fields; file is in req.file
      body = req.body || {};
      if (req.file) {
        body._uploadedBuffer = req.file.buffer;
        body._uploadedName   = req.file.originalname;
      }
    } else {
      body = req.body || {};
    }

    const {
      source,
      profile       = 'auto',
      target_format = 'original',
      max_width     = null,
      max_height    = null,
      max_size_kb   = null,
      priority      = 'balanced',
      tags          = [],
    } = body;

    // Parse numeric / array fields that may come as strings (multipart)
    const parsedRequest = {
      profile,
      target_format,
      max_width:   max_width   ? parseInt(max_width, 10)   : null,
      max_height:  max_height  ? parseInt(max_height, 10)  : null,
      max_size_kb: max_size_kb ? parseFloat(max_size_kb)   : null,
      priority,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    };

    logs.push(`Request: profile=${parsedRequest.profile}, format=${parsedRequest.target_format}, priority=${parsedRequest.priority}, tags=[${parsedRequest.tags.join(',')}]`);

    // ── Resolve input image to buffer ──────────────────────────────────────
    let inputBuffer, originalName;

    if (body._uploadedBuffer) {
      inputBuffer  = body._uploadedBuffer;
      originalName = body._uploadedName || 'upload';
      logs.push(`Source: direct upload (${formatBytes(inputBuffer.length)})`);
    } else if (source) {
      logs.push(`Source: ${source}`);
      const resolved = await resolveSource(source);
      inputBuffer  = resolved.buffer;
      originalName = resolved.originalName;
      logs.push(`Fetched: ${formatBytes(inputBuffer.length)}`);
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Either "source" (URL or local path) or a "file" upload is required.',
      });
    }

    const originalSizeBytes = inputBuffer.length;

    // ── Probe image metadata ───────────────────────────────────────────────
    const meta = await probe(inputBuffer);
    const originalFormat = meta.format || 'unknown';
    logs.push(`Image probed: ${meta.width}×${meta.height} ${originalFormat}, ${formatBytes(originalSizeBytes)}`);

    // ── Skip check: too small to meaningfully compress ────────────────────
    const SKIP_THRESHOLD_BYTES = 5 * 1024; // 5 KB
    if (originalSizeBytes < SKIP_THRESHOLD_BYTES && parsedRequest.profile !== 'lossless') {
      logs.push(`Skipping compression: image is already tiny (${formatBytes(originalSizeBytes)} < 5 KB threshold)`);
      const outputPath = saveOutput(inputBuffer, originalName, originalFormat);
      return res.json(buildResponse({
        ok: true,
        original_size_bytes: originalSizeBytes,
        compressed_size_bytes: originalSizeBytes,
        ratio: 1.0,
        original_format: originalFormat,
        output_format: originalFormat,
        width: meta.width,
        height: meta.height,
        profile_used: parsedRequest.profile,
        output_path: outputPath,
        duration_ms: Date.now() - startTime,
        logs: [...logs, 'No compression applied (image already tiny).'],
      }));
    }

    // ── Resolve compression strategy ──────────────────────────────────────
    const { params, profileUsed, logs: strategyLogs } = resolveStrategy(parsedRequest, {
      width: meta.width,
      height: meta.height,
      format: originalFormat,
      size: originalSizeBytes,
    });
    logs.push(...strategyLogs);

    // ── Compress (with iterative size enforcement if max_size_kb set) ──────
    const { buffer, info, qualityUsed, iterations, logs: enforcerLogs } =
      await enforce(inputBuffer, params, originalFormat);
    logs.push(...enforcerLogs);

    const compressedSizeBytes = info.size || buffer.length;
    const ratio = compressedSizeBytes / originalSizeBytes;

    // ── Skip if improvement is below threshold (< 5%) ─────────────────────
    const MIN_IMPROVEMENT_RATIO = 0.95; // must achieve at least 5% reduction
    if (ratio >= MIN_IMPROVEMENT_RATIO && parsedRequest.profile !== 'lossless') {
      logs.push(`Improvement below threshold (${((1 - ratio) * 100).toFixed(1)}% < 5%); returning original.`);
      const outputPath = saveOutput(inputBuffer, originalName, originalFormat);
      return res.json(buildResponse({
        ok: true,
        original_size_bytes: originalSizeBytes,
        compressed_size_bytes: originalSizeBytes,
        ratio: 1.0,
        original_format: originalFormat,
        output_format: originalFormat,
        width: meta.width,
        height: meta.height,
        profile_used: profileUsed,
        quality_used: qualityUsed,
        output_path: outputPath,
        duration_ms: Date.now() - startTime,
        logs,
      }));
    }

    // ── Save output ────────────────────────────────────────────────────────
    const outputFormat = info.format || params.targetFormat || originalFormat;
    const outputPath   = saveOutput(buffer, originalName, outputFormat);

    logs.push(`Done: ${formatBytes(originalSizeBytes)} → ${formatBytes(compressedSizeBytes)} (${((1 - ratio) * 100).toFixed(1)}% reduction) in ${Date.now() - startTime}ms`);

    return res.json(buildResponse({
      ok: true,
      original_size_bytes: originalSizeBytes,
      compressed_size_bytes: compressedSizeBytes,
      ratio: parseFloat(ratio.toFixed(4)),
      original_format: originalFormat,
      output_format: outputFormat,
      width: info.width,
      height: info.height,
      profile_used: profileUsed,
      quality_used: qualityUsed,
      iterations,
      output_path: outputPath,
      duration_ms: Date.now() - startTime,
      logs,
    }));

  } catch (err) {
    console.error('[image-compression] Error:', err.message);
    return res.status(500).json({
      ok: false,
      error: err.message,
      logs,
      duration_ms: Date.now() - startTime,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/compress/health
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  try {
    // Quick sharp sanity-check: create a 1×1 white pixel
    const sharp = require('sharp');
    const buf = await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .jpeg({ quality: 50 })
      .toBuffer();

    res.json({
      ok: true,
      service: 'image-compression',
      sharp_version: sharp.versions?.sharp ?? require('sharp').versions?.sharp ?? 'ok',
      output_dir: OUTPUT_DIR,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/compress/profiles
// Returns all available profiles and their defaults.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profiles', (_req, res) => {
  const { PROFILES, TAG_OVERRIDES } = require('../config/profiles');
  res.json({ ok: true, profiles: PROFILES, tag_overrides: TAG_OVERRIDES });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function saveOutput(buffer, originalName, format) {
  const ext    = format === 'jpeg' ? 'jpg' : (format || 'bin');
  const stem   = path.basename(originalName, path.extname(originalName));
  const hash   = crypto.randomBytes(4).toString('hex');
  const filename = `${stem}-compressed-${hash}.${ext}`;
  const fullPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

function buildResponse(data) {
  // Normalise output_path to a relative URL for the client
  const relativePath = data.output_path
    ? '/uploads/compressed/' + path.basename(data.output_path)
    : null;
  return { ...data, output_url: relativePath };
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

module.exports = router;
