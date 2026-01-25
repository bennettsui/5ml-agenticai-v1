// Branding Agent
// Applies 5ML logo and hashtag overlay to generated images

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { PhotoBoothImage, BrandingOptions, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';
import { photoBoothConfig } from '../config/photoBooth.config';
import { applyBranding } from '../lib/imageProcessor';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';

export interface BrandingResult {
  image_id: string;
  branded_image_path: string;
}

export interface BrandingJobOptions {
  sessionId: string;
  styledImagePath: string;
  eventHashtag?: string;
  eventName?: string;
  customLogoPath?: string;
  onProgress?: (update: StatusUpdate) => void;
}

export class BrandingAgent {
  private pool: Pool;
  private sessionManager: SessionManagerAgent;
  private agentName = 'Branding Agent';
  private defaultLogoPath: string;

  constructor(pool: Pool, sessionManager: SessionManagerAgent) {
    this.pool = pool;
    this.sessionManager = sessionManager;
    this.defaultLogoPath = path.join(
      __dirname,
      '..',
      'assets',
      '5ml-logo.png'
    );
  }

  /**
   * Apply branding overlay to styled image
   */
  async applyBrandingOverlay(options: BrandingJobOptions): Promise<BrandingResult> {
    const {
      sessionId,
      styledImagePath,
      eventHashtag,
      eventName,
      customLogoPath,
      onProgress,
    } = options;

    const reportProgress = (message: string, substep?: string, percentage?: number) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'branding',
        current_step: 'branding_overlay',
        substep,
        message,
        progress_percentage: percentage,
        timestamp: new Date(),
      };
      this.sessionManager.trackStatus(update);
      if (onProgress) onProgress(update);
    };

    try {
      // Update session status
      await this.sessionManager.updateStatus(sessionId, 'branding');

      reportProgress('🏷️ Applying 5ML branding...', 'init', 10);

      // Step 1: Validate input image
      if (!fs.existsSync(styledImagePath)) {
        // In mock mode, the styled image might not exist
        if (photoBoothConfig.comfyui.mockMode) {
          console.log(`[${this.agentName}] Mock mode: Skipping branding for non-existent image`);

          // Create a mock branded path
          const outputDir = photoBoothConfig.storage.outputPath;
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const brandedPath = path.join(outputDir, `branded_${sessionId}_${Date.now()}.jpg`);
          const imageId = await this.saveBrandedImage(sessionId, brandedPath);

          reportProgress('✓ Branding complete (mock mode)', 'complete', 100);

          return {
            image_id: imageId,
            branded_image_path: brandedPath,
          };
        }

        throw formatError({
          code: ErrorCode.FB_BRAND_002,
          agentName: this.agentName,
          sessionId,
          customMessage: 'Styled image not found for branding',
        });
      }

      reportProgress('✓ Styled image verified', 'verify_image', 20);

      // Step 2: Resolve logo path
      reportProgress('🏷️ Loading 5ML logo...', 'load_logo', 30);

      const logoPath = customLogoPath || this.defaultLogoPath;

      // Check if logo exists, if not create a placeholder message
      let logoExists = fs.existsSync(logoPath);
      if (!logoExists) {
        console.warn(`[${this.agentName}] Logo not found at ${logoPath}, will skip logo overlay`);
      }

      reportProgress('✓ Logo loaded', 'logo_loaded', 40);

      // Step 3: Prepare branding options
      reportProgress('🏷️ Configuring overlay settings...', 'configure', 50);

      const brandingOptions: BrandingOptions = {
        logo_path: logoExists ? logoPath : '',
        logo_position: photoBoothConfig.branding.logoPosition,
        logo_size_percent: photoBoothConfig.branding.logoSizePercent,
        hashtag: eventHashtag || photoBoothConfig.branding.defaultHashtag,
        hashtag_position: photoBoothConfig.branding.hashtagPosition,
        event_name: eventName,
        event_name_position: eventName ? 'top-right' : undefined,
      };

      // Step 4: Generate output path
      const outputDir = photoBoothConfig.storage.outputPath;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const brandedFilename = `branded_${sessionId}_${Date.now()}.jpg`;
      const brandedPath = path.join(outputDir, brandedFilename);

      // Step 5: Apply branding overlay
      reportProgress('🏷️ Compositing overlay...', 'composite', 70);

      await applyBranding(styledImagePath, brandedPath, brandingOptions);

      reportProgress('✓ Overlay applied', 'overlay_complete', 85);

      // Step 6: Save to database
      reportProgress('💾 Saving branded image...', 'save', 90);

      const imageId = await this.saveBrandedImage(sessionId, brandedPath);

      reportProgress('✓ Branding complete', 'complete', 100);

      console.log(`[${this.agentName}] Branded image created for session ${sessionId}`);

      return {
        image_id: imageId,
        branded_image_path: brandedPath,
      };
    } catch (error) {
      if ((error as { code?: string }).code?.startsWith('FB_')) {
        await this.sessionManager.logError(
          sessionId,
          (error as { code: string }).code,
          (error as { message: string }).message,
          this.agentName
        );
        throw error;
      }

      const formattedError = formatError({
        code: ErrorCode.FB_BRAND_002,
        agentName: this.agentName,
        sessionId,
        customMessage: `Branding failed: ${(error as Error).message}`,
        stackTrace: (error as Error).stack,
      });

      await this.sessionManager.logError(
        sessionId,
        formattedError.code,
        formattedError.message,
        this.agentName
      );

      throw formattedError;
    }
  }

  /**
   * Save branded image to database
   */
  private async saveBrandedImage(sessionId: string, imagePath: string): Promise<string> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, metadata_json)
         VALUES ($1, 'branded', $2, $3)
         RETURNING image_id`,
        [
          sessionId,
          imagePath,
          JSON.stringify({
            branding_applied: true,
            branding_config: {
              logo_position: photoBoothConfig.branding.logoPosition,
              hashtag_position: photoBoothConfig.branding.hashtagPosition,
            },
          }),
        ]
      );

      return result.rows[0].image_id;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to save branded image: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get branded image for a session
   */
  async getBrandedImage(sessionId: string): Promise<PhotoBoothImage | null> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `SELECT * FROM photo_booth_images
         WHERE session_id = $1 AND image_type = 'branded'
         ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to get branded image: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Validate logo file exists
   */
  validateLogoFile(logoPath?: string): boolean {
    const pathToCheck = logoPath || this.defaultLogoPath;
    return fs.existsSync(pathToCheck);
  }

  /**
   * Get default branding configuration
   */
  getDefaultBrandingConfig(): BrandingOptions {
    return {
      logo_path: this.defaultLogoPath,
      logo_position: photoBoothConfig.branding.logoPosition,
      logo_size_percent: photoBoothConfig.branding.logoSizePercent,
      hashtag: photoBoothConfig.branding.defaultHashtag,
      hashtag_position: photoBoothConfig.branding.hashtagPosition,
    };
  }
}
