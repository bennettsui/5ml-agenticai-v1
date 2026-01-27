// Image Processor Utility
// Handles image manipulation, branding overlay, and quality checks using sharp

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { photoBoothConfig } from '../config/photoBooth.config';
import { BrandingOptions, QualityCheckResult } from '../types';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

export interface ProcessedImage {
  path: string;
  metadata: ImageMetadata;
  hash: string;
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  const stats = fs.statSync(imagePath);
  const metadata = await sharp(imagePath).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: stats.size,
    hasAlpha: metadata.hasAlpha || false,
  };
}

/**
 * Calculate image hash for deduplication
 */
export async function calculateImageHash(imagePath: string): Promise<string> {
  const crypto = require('crypto');
  const buffer = await sharp(imagePath).resize(32, 32).greyscale().raw().toBuffer();

  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Process and validate uploaded image
 */
export async function processUploadedImage(
  inputPath: string,
  outputPath: string
): Promise<ProcessedImage> {
  const config = photoBoothConfig.imageProcessing;

  // Get original metadata
  const originalMetadata = await getImageMetadata(inputPath);

  // Validate file size
  if (originalMetadata.size > config.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed (${config.maxFileSize / 1024 / 1024}MB)`);
  }

  // Process image: resize if needed, convert to standard format
  const image = sharp(inputPath);

  // Auto-orient based on EXIF
  image.rotate();

  // Resize if larger than max dimensions while maintaining aspect ratio
  const maxWidth = 2048;
  const maxHeight = 2048;

  if (originalMetadata.width > maxWidth || originalMetadata.height > maxHeight) {
    image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to JPEG with good quality
  await image
    .jpeg({
      quality: config.outputQuality,
      mozjpeg: true,
    })
    .toFile(outputPath);

  // Get processed metadata
  const processedMetadata = await getImageMetadata(outputPath);
  const hash = await calculateImageHash(outputPath);

  return {
    path: outputPath,
    metadata: processedMetadata,
    hash,
  };
}

/**
 * Create thumbnail
 */
export async function createThumbnail(inputPath: string, outputPath: string): Promise<string> {
  const { thumbnailSize } = photoBoothConfig.imageProcessing;

  await sharp(inputPath)
    .resize(thumbnailSize.width, thumbnailSize.height, {
      fit: 'cover',
      position: 'centre',
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Apply branding overlay to image
 */
export async function applyBranding(
  inputPath: string,
  outputPath: string,
  options: BrandingOptions
): Promise<string> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const { width, height } = metadata;
  const composites: sharp.OverlayOptions[] = [];

  // Calculate safe zone margins
  const margin = Math.round((photoBoothConfig.branding.safeZoneMargin / 100) * Math.min(width, height));

  // Add logo overlay
  if (options.logo_path && fs.existsSync(options.logo_path)) {
    const logoSize = Math.round((options.logo_size_percent / 100) * width);
    const logoBuffer = await sharp(options.logo_path)
      .resize(logoSize, null, { fit: 'inside' })
      .toBuffer();

    const logoMeta = await sharp(logoBuffer).metadata();
    const logoWidth = logoMeta.width || logoSize;
    const logoHeight = logoMeta.height || logoSize;

    // Calculate logo position
    let logoX = margin;
    let logoY = margin;

    switch (options.logo_position) {
      case 'top-left':
        logoX = margin;
        logoY = margin;
        break;
      case 'top-right':
        logoX = width - logoWidth - margin;
        logoY = margin;
        break;
      case 'bottom-left':
        logoX = margin;
        logoY = height - logoHeight - margin;
        break;
      case 'bottom-right':
        logoX = width - logoWidth - margin;
        logoY = height - logoHeight - margin;
        break;
    }

    composites.push({
      input: logoBuffer,
      top: logoY,
      left: logoX,
    });
  }

  // Add hashtag text overlay
  if (options.hashtag) {
    const fontSize = Math.round(height * 0.03); // 3% of image height
    const textSvg = createTextSvg(options.hashtag, fontSize, options.textColor || '#FFFFFF', options.textShadow !== false);

    const textBuffer = Buffer.from(textSvg);
    const textMeta = await sharp(textBuffer).metadata();
    const textWidth = textMeta.width || 200;
    const textHeight = textMeta.height || 50;

    // Calculate text position
    let textX = margin;
    let textY = height - textHeight - margin;

    switch (options.hashtag_position) {
      case 'top-left':
        textX = margin;
        textY = margin;
        break;
      case 'top-right':
        textX = width - textWidth - margin;
        textY = margin;
        break;
      case 'bottom-left':
        textX = margin;
        textY = height - textHeight - margin;
        break;
      case 'bottom-right':
        textX = width - textWidth - margin;
        textY = height - textHeight - margin;
        break;
    }

    composites.push({
      input: textBuffer,
      top: textY,
      left: textX,
    });
  }

  // Add event name if provided
  if (options.event_name && options.event_name_position) {
    const fontSize = Math.round(height * 0.025); // 2.5% of image height
    const eventSvg = createTextSvg(options.event_name, fontSize, options.textColor || '#FFFFFF', options.textShadow !== false);

    const eventBuffer = Buffer.from(eventSvg);
    const eventMeta = await sharp(eventBuffer).metadata();
    const eventWidth = eventMeta.width || 300;
    const eventHeight = eventMeta.height || 40;

    let eventX = margin;
    let eventY = margin;

    if (options.event_name_position === 'top-right') {
      eventX = width - eventWidth - margin;
    }

    // Adjust Y position if logo is in same corner
    if (options.logo_position === options.event_name_position) {
      const logoSize = Math.round((options.logo_size_percent / 100) * width);
      eventY = margin + logoSize + Math.round(margin * 0.5);
    }

    composites.push({
      input: eventBuffer,
      top: eventY,
      left: eventX,
    });
  }

  // Apply composites and save
  if (composites.length > 0) {
    await image.composite(composites).jpeg({ quality: 95 }).toFile(outputPath);
  } else {
    // No overlays, just copy
    await image.jpeg({ quality: 95 }).toFile(outputPath);
  }

  return outputPath;
}

/**
 * Create SVG text element for overlay
 */
function createTextSvg(
  text: string,
  fontSize: number,
  color: string,
  withShadow: boolean
): string {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Estimate width based on character count
  const estimatedWidth = text.length * fontSize * 0.6 + 20;
  const height = fontSize + 20;

  const shadow = withShadow
    ? `<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
         <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8"/>
       </filter>`
    : '';

  const filterAttr = withShadow ? 'filter="url(#shadow)"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${height}">
    <defs>${shadow}</defs>
    <text x="10" y="${fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" ${filterAttr}>
      ${escapedText}
    </text>
  </svg>`;
}

/**
 * Perform basic quality check on image
 */
export async function performQualityCheck(imagePath: string): Promise<QualityCheckResult> {
  const metadata = await getImageMetadata(imagePath);

  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check resolution
  const minWidth = 400;
  const minHeight = 400;
  const resolutionOk = metadata.width >= minWidth && metadata.height >= minHeight;

  if (!resolutionOk) {
    warnings.push(`Image resolution too low (${metadata.width}x${metadata.height})`);
    suggestions.push(`Minimum resolution required: ${minWidth}x${minHeight}`);
  }

  // Analyze image for basic quality metrics using sharp
  const stats = await sharp(imagePath).stats();

  // Calculate overall brightness (using mean of RGB channels)
  const meanBrightness =
    (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;

  // Determine lighting quality based on brightness
  let lightingQuality: 'good' | 'moderate' | 'poor' = 'good';
  let lightingScore = 1.0;

  if (meanBrightness < 50) {
    lightingQuality = 'poor';
    lightingScore = 0.3;
    warnings.push('Image appears too dark');
    suggestions.push('Please ensure better lighting');
  } else if (meanBrightness < 80) {
    lightingQuality = 'moderate';
    lightingScore = 0.6;
  } else if (meanBrightness > 220) {
    lightingQuality = 'poor';
    lightingScore = 0.4;
    warnings.push('Image appears overexposed');
    suggestions.push('Please reduce lighting or avoid direct flash');
  }

  // Calculate composition score based on entropy (variety of pixel values)
  const entropy = stats.entropy || 0;
  const compositionScore = Math.min(1.0, entropy / 7.0);

  // Note: Face detection will be done by the Face Quality Check Agent using Claude Vision
  // This function only does basic image quality checks

  return {
    is_valid: resolutionOk && lightingQuality !== 'poor',
    face_detected: false, // Will be set by Face Quality Check Agent
    face_count: 0,
    face_confidence: 0,
    lighting_quality: lightingQuality,
    lighting_score: lightingScore,
    composition_score: compositionScore,
    resolution_ok: resolutionOk,
    warnings,
    suggestions,
  };
}

/**
 * Resize image for generation
 */
export async function resizeForGeneration(
  inputPath: string,
  outputPath: string
): Promise<string> {
  const { generatedSize } = photoBoothConfig.imageProcessing;

  await sharp(inputPath)
    .resize(generatedSize.width, generatedSize.height, {
      fit: 'cover',
      position: 'centre',
    })
    .jpeg({ quality: 95 })
    .toFile(outputPath);

  return outputPath;
}
