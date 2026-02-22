// ─────────────────────────────────────────────────────────────────────────────
// Image Compression — Profile Definitions
// Maps named profiles to concrete sharp parameters.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each profile defines:
 *   preferredFormat   – target format (null = keep original)
 *   quality           – lossy quality (1–100, used for jpeg/webp/avif)
 *   compressionLevel  – PNG compression level (0–9)
 *   maxWidth          – resize constraint (null = unlimited)
 *   maxHeight         – resize constraint (null = unlimited)
 *   lossless          – whether to use lossless encoding (webp/avif)
 *   effort            – encoder effort/speed trade-off (avif/webp: 0–9/0–6)
 *   stripMetadata     – remove EXIF/ICC/XMP (true = smaller, false = keep)
 *   mozjpeg           – use mozjpeg encoder for jpeg (smaller but slower)
 */
const PROFILES = {
  lossless: {
    preferredFormat: null,   // keep original
    quality: 100,
    compressionLevel: 6,     // moderate PNG compression (lossless)
    maxWidth: null,
    maxHeight: null,
    lossless: true,
    effort: 6,
    stripMetadata: false,    // keep metadata for archival
    mozjpeg: true,
    description: 'Lossless — preserve quality, strip only redundant data. No visible change.',
  },

  web: {
    preferredFormat: 'webp',
    quality: 80,
    compressionLevel: 8,
    maxWidth: 1920,
    maxHeight: 1080,
    lossless: false,
    effort: 4,
    stripMetadata: true,
    mozjpeg: true,
    description: 'Web — WebP at 80% quality, max 1920×1080. Best for blogs and galleries.',
  },

  thumbnail: {
    preferredFormat: 'webp',
    quality: 72,
    compressionLevel: 9,
    maxWidth: 512,
    maxHeight: 512,
    lossless: false,
    effort: 4,
    stripMetadata: true,
    mozjpeg: true,
    description: 'Thumbnail — small dimensions, moderate quality for card/preview images.',
  },

  aggressive: {
    preferredFormat: 'avif',
    quality: 55,
    compressionLevel: 9,
    maxWidth: 1920,
    maxHeight: 1080,
    lossless: false,
    effort: 6,
    stripMetadata: true,
    mozjpeg: true,
    description: 'Aggressive — AVIF at 55% quality. Smallest file size, may have visible artefacts.',
  },

  auto: {
    // auto is resolved at runtime by CompressionStrategy based on input
    preferredFormat: null,
    quality: 78,
    compressionLevel: 8,
    maxWidth: 1920,
    maxHeight: 1080,
    lossless: false,
    effort: 4,
    stripMetadata: true,
    mozjpeg: true,
    description: 'Auto — chooses format and quality based on input size, dimensions, and tags.',
  },
};

/**
 * Tag-based overrides applied on top of the resolved profile.
 * An image tagged "social" gets extra size constraints, for example.
 */
const TAG_OVERRIDES = {
  social: { maxWidth: 1200, maxHeight: 1200, quality: 80, preferredFormat: 'webp' },
  tender: { maxWidth: 1600, maxHeight: 900, quality: 75, preferredFormat: 'jpeg' },
  client_review: { maxWidth: 2560, maxHeight: 1440, quality: 85, preferredFormat: 'webp' },
  thumbnail: { maxWidth: 512, maxHeight: 512, quality: 72, preferredFormat: 'webp' },
};

module.exports = { PROFILES, TAG_OVERRIDES };
