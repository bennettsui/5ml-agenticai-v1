// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Size Enforcer
// Iteratively reduces quality until the output is within max_size_kb.
// ─────────────────────────────────────────────────────────────────────────────

const { compress } = require('./SharpAdapter');

const MIN_QUALITY = 20;     // never go below this to avoid unusable output
const MAX_ITERATIONS = 8;   // safety cap on iteration count
const STEP = 8;             // quality reduction per iteration

/**
 * Compress an image and, if max_size_kb is set, iteratively reduce quality
 * until the target size is met.
 *
 * @param {Buffer} inputBuffer
 * @param {object} params         - from CompressionStrategy.resolve()
 * @param {string} originalFormat - original image format (e.g. 'jpeg')
 * @returns {Promise<{ buffer: Buffer, info: object, qualityUsed: number, iterations: number, logs: string[] }>}
 */
async function enforce(inputBuffer, params, originalFormat) {
  const logs = [];
  let quality = params.quality;
  let iteration = 0;

  const sharpOpts = {
    ...params,
    originalFormat,
  };

  // ── Initial compression pass ───────────────────────────────────────────────
  let { buffer, info } = await compress(inputBuffer, { ...sharpOpts, quality });
  logs.push(`Pass 1: quality=${quality}, output=${formatBytes(info.size)}`);

  // ── If no size cap, or already within budget, return early ────────────────
  if (!params.maxSizeKb || info.size <= params.maxSizeKb * 1024) {
    return { buffer, info, qualityUsed: quality, iterations: 1, logs };
  }

  logs.push(`Target: ≤${params.maxSizeKb} KB. Starting iterative reduction...`);

  // ── Iterative quality reduction ────────────────────────────────────────────
  while (info.size > params.maxSizeKb * 1024 && quality > MIN_QUALITY && iteration < MAX_ITERATIONS) {
    quality = Math.max(MIN_QUALITY, quality - STEP);
    iteration += 1;

    const result = await compress(inputBuffer, { ...sharpOpts, quality });
    buffer = result.buffer;
    info   = result.info;

    logs.push(`Pass ${iteration + 1}: quality=${quality}, output=${formatBytes(info.size)}`);

    if (info.size <= params.maxSizeKb * 1024) break;
  }

  if (info.size > params.maxSizeKb * 1024) {
    logs.push(
      `Warning: could not reach ${params.maxSizeKb} KB target after ${iteration + 1} passes. ` +
      `Final: ${formatBytes(info.size)} at quality=${quality}. ` +
      `Consider using a lower profile or reducing max_width/max_height.`
    );
  } else {
    logs.push(`Target met: ${formatBytes(info.size)} ≤ ${params.maxSizeKb} KB at quality=${quality}`);
  }

  return { buffer, info, qualityUsed: quality, iterations: iteration + 1, logs };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

module.exports = { enforce };
