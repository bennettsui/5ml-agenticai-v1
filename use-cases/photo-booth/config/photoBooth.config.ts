// Photo Booth Configuration

export const photoBoothConfig = {
  // ComfyUI settings
  comfyui: {
    // Base URL - use environment variable or default to local
    baseUrl: process.env.COMFYUI_URL || 'http://localhost:8188',
    // Timeout for generation (5 seconds max)
    generationTimeout: 5000,
    // Polling interval for checking generation status
    pollInterval: 200,
    // Max retries for API calls
    maxRetries: 3,
    // Enable mock mode when no GPU available
    mockMode: process.env.COMFYUI_MOCK_MODE === 'true' || !process.env.COMFYUI_URL,
  },

  // Image processing settings
  imageProcessing: {
    // Max file size (10MB)
    maxFileSize: 10 * 1024 * 1024,
    // Allowed formats
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    // Output format
    outputFormat: 'jpeg' as const,
    // Output quality (0-100)
    outputQuality: 90,
    // Thumbnail size
    thumbnailSize: { width: 256, height: 256 },
    // Generated image size
    generatedSize: { width: 512, height: 768 },
  },

  // Face detection settings
  faceDetection: {
    // Minimum confidence threshold
    minConfidence: 0.8,
    // Maximum faces allowed (Phase 1)
    maxFaces: 1,
    // Minimum face size (percentage of image)
    minFaceSize: 0.1,
    // Use Claude Vision for face detection
    useClaudeVision: true,
  },

  // Branding settings
  branding: {
    // Logo path (relative to assets folder)
    logoPath: '/assets/5ml-logo.png',
    // Logo position
    logoPosition: 'top-left' as const,
    // Logo size (percentage of image width)
    logoSizePercent: 12,
    // Hashtag text
    defaultHashtag: '#5ML',
    // Hashtag position
    hashtagPosition: 'bottom-right' as const,
    // Text color
    textColor: '#FFFFFF',
    // Text shadow for readability
    textShadow: true,
    // Safe zone margin (percentage)
    safeZoneMargin: 5,
  },

  // QR code settings
  qrCode: {
    // Size in pixels
    size: 256,
    // Error correction level
    errorCorrectionLevel: 'M' as const,
    // Dark color
    darkColor: '#000000',
    // Light color
    lightColor: '#FFFFFF',
    // Margin (modules)
    margin: 2,
  },

  // Session settings
  session: {
    // Session timeout (30 minutes)
    timeout: 30 * 60 * 1000,
    // Max sessions per event per day
    maxSessionsPerDay: 1000,
  },

  // Storage settings
  storage: {
    // Base path for uploaded images
    uploadPath: process.env.UPLOAD_PATH || '/tmp/photo-booth/uploads',
    // Base path for generated images
    outputPath: process.env.OUTPUT_PATH || '/tmp/photo-booth/outputs',
    // Base path for QR codes
    qrCodePath: process.env.QR_CODE_PATH || '/tmp/photo-booth/qrcodes',
    // Public base URL for serving images
    publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:8080',
  },

  // Analytics settings
  analytics: {
    // Enable analytics logging
    enabled: true,
    // Batch size for aggregation
    batchSize: 100,
  },

  // SSE settings
  sse: {
    // Heartbeat interval (15 seconds)
    heartbeatInterval: 15000,
    // Retry timeout for client reconnection
    retryTimeout: 3000,
  },
};

// Validate configuration on load
export function validateConfig(): void {
  const { storage } = photoBoothConfig;

  // Create directories if they don't exist
  const fs = require('fs');
  const paths = [storage.uploadPath, storage.outputPath, storage.qrCodePath];

  for (const path of paths) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }
}

export default photoBoothConfig;
