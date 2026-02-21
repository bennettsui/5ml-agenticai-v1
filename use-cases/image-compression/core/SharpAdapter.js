// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Sharp Adapter
// Wraps the sharp library with a clean, typed interface.
// ─────────────────────────────────────────────────────────────────────────────

const sharp = require('sharp');

/**
 * Supported input formats that sharp can read.
 */
const SUPPORTED_INPUT_FORMATS = new Set([
  'jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'svg', 'tiff', 'tif', 'heic', 'heif',
]);

/**
 * Supported output formats.
 */
const SUPPORTED_OUTPUT_FORMATS = new Set(['jpeg', 'webp', 'avif', 'png', 'gif']);

/**
 * Probe an image buffer and return its metadata.
 * @param {Buffer} buffer
 * @returns {Promise<sharp.Metadata>}
 */
async function probe(buffer) {
  try {
    return await sharp(buffer).metadata();
  } catch (err) {
    throw new Error(`Failed to read image metadata: ${err.message}`);
  }
}

/**
 * Compress an image buffer according to the provided options.
 *
 * @param {Buffer} inputBuffer - Raw image data
 * @param {object} opts
 * @param {string|null}  opts.targetFormat     - 'jpeg'|'webp'|'avif'|'png'|null (null = keep original)
 * @param {number|null}  opts.maxWidth
 * @param {number|null}  opts.maxHeight
 * @param {number}       opts.quality          - 1–100 for lossy formats
 * @param {number}       opts.compressionLevel - 0–9 for PNG
 * @param {boolean}      opts.lossless         - true = lossless webp/avif
 * @param {number}       opts.effort           - encoder effort (webp: 0–6, avif: 0–9)
 * @param {boolean}      opts.stripMetadata
 * @param {boolean}      opts.mozjpeg          - use mozjpeg encoder for jpeg
 * @param {string}       opts.originalFormat   - format of the input image
 * @returns {Promise<{ buffer: Buffer, info: object }>}
 */
async function compress(inputBuffer, opts) {
  const {
    targetFormat,
    maxWidth,
    maxHeight,
    quality,
    compressionLevel,
    lossless,
    effort,
    stripMetadata,
    mozjpeg,
    originalFormat,
  } = opts;

  const outputFormat = resolveOutputFormat(targetFormat, originalFormat);

  let pipeline = sharp(inputBuffer, { failOn: 'error' });

  // ── Strip metadata ─────────────────────────────────────────────────────────
  if (stripMetadata) {
    pipeline = pipeline.rotate(); // auto-orient using EXIF, then strip
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth || undefined,
      height: maxHeight || undefined,
      fit: 'inside',           // preserve aspect ratio, never upscale
      withoutEnlargement: true,
    });
  }

  // ── Format + quality ───────────────────────────────────────────────────────
  pipeline = applyOutputFormat(pipeline, outputFormat, {
    quality,
    compressionLevel,
    lossless,
    effort,
    mozjpeg,
  });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    info: {
      format: info.format,
      width: info.width,
      height: info.height,
      size: info.size,
      channels: info.channels,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine the actual output format.
 * Falls back to jpeg if the original format is not a supported output format.
 */
function resolveOutputFormat(targetFormat, originalFormat) {
  if (targetFormat && targetFormat !== 'original') {
    const fmt = targetFormat.toLowerCase();
    if (!SUPPORTED_OUTPUT_FORMATS.has(fmt)) {
      throw new Error(`Unsupported target_format: "${targetFormat}". Valid options: ${[...SUPPORTED_OUTPUT_FORMATS].join(', ')}`);
    }
    return fmt;
  }

  // Keep original format if it's a supported output format
  const orig = (originalFormat || '').toLowerCase().replace('jpg', 'jpeg');
  if (SUPPORTED_OUTPUT_FORMATS.has(orig)) return orig;

  // Safe fallback
  return 'jpeg';
}

/**
 * Apply format-specific encoding options to the pipeline.
 */
function applyOutputFormat(pipeline, format, opts) {
  const { quality, compressionLevel, lossless, effort, mozjpeg } = opts;

  switch (format) {
    case 'jpeg':
    case 'jpg':
      return pipeline.jpeg({
        quality: clamp(quality, 1, 100),
        mozjpeg: mozjpeg !== false,
        progressive: true,
      });

    case 'webp':
      return pipeline.webp({
        quality: clamp(quality, 1, 100),
        lossless: lossless === true,
        effort: clamp(effort ?? 4, 0, 6),
        smartSubsample: true,
      });

    case 'avif':
      return pipeline.avif({
        quality: clamp(quality, 1, 100),
        lossless: lossless === true,
        effort: clamp(effort ?? 4, 0, 9),
        chromaSubsampling: '4:2:0',
      });

    case 'png':
      return pipeline.png({
        compressionLevel: clamp(compressionLevel ?? 8, 0, 9),
        progressive: false,
        adaptiveFiltering: true,
      });

    case 'gif':
      // sharp gif output (requires libvips with giflib)
      return pipeline.gif();

    default:
      throw new Error(`Unknown output format: "${format}"`);
  }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

module.exports = { probe, compress, SUPPORTED_INPUT_FORMATS, SUPPORTED_OUTPUT_FORMATS };
