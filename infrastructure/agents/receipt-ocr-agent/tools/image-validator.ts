/**
 * Image Validator for Receipt OCR
 *
 * Validates receipt images before OCR processing to ensure:
 * - Supported file formats
 * - Appropriate file sizes
 * - Basic quality checks
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImageMetadata;
}

interface ImageMetadata {
  filename: string;
  format: string;
  sizeBytes: number;
  sizeMB: number;
  hash: string;
}

export class ImageValidator {
  // Supported image formats for Claude Vision
  private static readonly SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

  // Maximum file size (5MB as per Claude Vision limits)
  private static readonly MAX_SIZE_MB = 5;
  private static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;

  // Minimum file size (to catch empty/corrupt files)
  private static readonly MIN_SIZE_BYTES = 1024; // 1KB

  /**
   * Validate a single receipt image file
   *
   * @param filePath - Path to image file
   * @returns Validation result with errors/warnings
   */
  async validateImage(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let metadata: ImageMetadata | undefined;

    try {
      // Check if file exists
      const fileExists = await this.fileExists(filePath);
      if (!fileExists) {
        errors.push(`File not found: ${filePath}`);
        return { valid: false, errors, warnings };
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      const sizeBytes = stats.size;
      const sizeMB = sizeBytes / (1024 * 1024);

      // Extract file info
      const filename = path.basename(filePath);
      const format = path.extname(filePath).toLowerCase();

      // Validate format
      if (!ImageValidator.SUPPORTED_FORMATS.includes(format)) {
        errors.push(
          `Unsupported format: ${format}. Supported: ${ImageValidator.SUPPORTED_FORMATS.join(', ')}`
        );
      }

      // Validate size
      if (sizeBytes < ImageValidator.MIN_SIZE_BYTES) {
        errors.push(
          `File too small (${sizeBytes} bytes). May be corrupt or empty.`
        );
      }

      if (sizeBytes > ImageValidator.MAX_SIZE_BYTES) {
        errors.push(
          `File too large (${sizeMB.toFixed(2)} MB). Maximum: ${ImageValidator.MAX_SIZE_MB} MB`
        );
      }

      // Size warnings
      if (sizeBytes > ImageValidator.MAX_SIZE_BYTES * 0.8) {
        warnings.push(
          `File size close to limit (${sizeMB.toFixed(2)} MB). Consider compressing.`
        );
      }

      if (sizeBytes < 50 * 1024) {
        // Less than 50KB
        warnings.push(
          `File size very small (${(sizeBytes / 1024).toFixed(2)} KB). Image may be low quality.`
        );
      }

      // Calculate file hash for deduplication
      const hash = await this.calculateHash(filePath);

      metadata = {
        filename,
        format,
        sizeBytes,
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        hash,
      };

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate multiple image files
   *
   * @param filePaths - Array of image file paths
   * @returns Array of validation results
   */
  async validateBatch(filePaths: string[]): Promise<ValidationResult[]> {
    const results = await Promise.all(
      filePaths.map(filePath => this.validateImage(filePath))
    );

    // Check for duplicates across batch
    const hashes = new Map<string, string[]>();
    results.forEach((result, index) => {
      if (result.metadata?.hash) {
        const hash = result.metadata.hash;
        if (!hashes.has(hash)) {
          hashes.set(hash, []);
        }
        hashes.get(hash)!.push(filePaths[index]);
      }
    });

    // Add duplicate warnings
    hashes.forEach((files, hash) => {
      if (files.length > 1) {
        files.forEach(file => {
          const result = results.find(
            r => r.metadata?.filename === path.basename(file)
          );
          if (result) {
            result.warnings.push(
              `Duplicate image detected. Same as: ${files.filter(f => f !== file).map(f => path.basename(f)).join(', ')}`
            );
          }
        });
      }
    });

    return results;
  }

  /**
   * Get summary of validation results
   *
   * @param results - Array of validation results
   * @returns Summary statistics
   */
  getSummary(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    totalErrors: number;
    totalWarnings: number;
    totalSizeMB: number;
  } {
    const valid = results.filter(r => r.valid).length;
    const invalid = results.filter(r => !r.valid).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.warnings.length,
      0
    );
    const totalSizeMB = results.reduce(
      (sum, r) => sum + (r.metadata?.sizeMB || 0),
      0
    );

    return {
      total: results.length,
      valid,
      invalid,
      totalErrors,
      totalWarnings,
      totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
    };
  }

  /**
   * Filter out invalid images from a list
   *
   * @param filePaths - Array of image file paths
   * @returns Array of valid file paths only
   */
  async filterValidImages(filePaths: string[]): Promise<string[]> {
    const results = await this.validateBatch(filePaths);
    return filePaths.filter((_, index) => results[index].valid);
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of file for deduplication
   */
  private async calculateHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Validate image filename follows naming conventions
   *
   * @param filename - Image filename
   * @returns true if filename is valid
   */
  validateFilename(filename: string): {
    valid: boolean;
    suggestions?: string[];
  } {
    const suggestions: string[] = [];

    // Check for common issues
    if (filename.includes(' ')) {
      suggestions.push('Remove spaces from filename (use underscores or hyphens)');
    }

    if (filename.length > 100) {
      suggestions.push('Filename too long (max 100 characters recommended)');
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
      suggestions.push('Use only alphanumeric characters, underscores, hyphens, and periods');
    }

    const basename = path.basename(filename, path.extname(filename));
    if (basename.toLowerCase() === 'receipt') {
      suggestions.push('Use more descriptive filename (e.g., receipt_2026-01-18_office_depot)');
    }

    return {
      valid: suggestions.length === 0,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }
}

// Export singleton instance
export const imageValidator = new ImageValidator();

// Export class for testing and custom instances
export default ImageValidator;
