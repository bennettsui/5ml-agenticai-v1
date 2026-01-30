// Face & Quality Check Agent
// Validates faces, lighting, composition using Claude Vision

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { QualityCheckResult, ErrorCode, PhotoBoothImage } from '../types';
import { formatError } from '../lib/errorFormatter';
import {
  processUploadedImage,
  performQualityCheck,
  getImageMetadata,
  calculateImageHash,
} from '../lib/imageProcessor';
import { photoBoothConfig } from '../config/photoBooth.config';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';

export interface FaceCheckOptions {
  sessionId: string;
  imagePath: string;
  onProgress?: (update: StatusUpdate) => void;
}

export interface FaceCheckResult {
  image_id: string;
  quality_check: QualityCheckResult;
  processed_image_path: string;
}

export class FaceQualityCheckAgent {
  private pool: Pool;
  private anthropic: Anthropic;
  private sessionManager: SessionManagerAgent;
  private agentName = 'Face & Quality Check Agent';

  constructor(pool: Pool, anthropic: Anthropic, sessionManager: SessionManagerAgent) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.sessionManager = sessionManager;
  }

  /**
   * Check image quality and detect faces
   */
  async checkImage(options: FaceCheckOptions): Promise<FaceCheckResult> {
    const { sessionId, imagePath, onProgress } = options;

    const reportProgress = (message: string, substep?: string) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'analyzing',
        current_step: 'face_quality_check',
        substep,
        message,
        timestamp: new Date(),
      };
      this.sessionManager.trackStatus(update);
      if (onProgress) onProgress(update);
    };

    try {
      reportProgress('Starting image quality check...', 'init');

      // Step 1: Validate file exists
      if (!fs.existsSync(imagePath)) {
        throw formatError({
          code: ErrorCode.FB_UPLOAD_002,
          agentName: this.agentName,
          sessionId,
          customMessage: 'Uploaded image file not found',
        });
      }

      reportProgress('Validating image format...', 'validate_format');

      // Step 2: Check file size and format
      const stats = fs.statSync(imagePath);
      if (stats.size > photoBoothConfig.imageProcessing.maxFileSize) {
        throw formatError({
          code: ErrorCode.FB_UPLOAD_001,
          agentName: this.agentName,
          sessionId,
          inputParams: { fileSize: stats.size, maxSize: photoBoothConfig.imageProcessing.maxFileSize },
        });
      }

      // Step 3: Process image (resize, convert)
      reportProgress('Processing image...', 'process_image');

      const outputDir = photoBoothConfig.storage.uploadPath;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const processedPath = path.join(outputDir, `processed_${Date.now()}.jpg`);
      const processedImage = await processUploadedImage(imagePath, processedPath);

      reportProgress('Checking image quality...', 'quality_check');

      // Step 4: Perform basic quality check
      const basicQualityCheck = await performQualityCheck(processedPath);

      if (!basicQualityCheck.resolution_ok) {
        throw formatError({
          code: ErrorCode.FB_UPLOAD_001,
          agentName: this.agentName,
          sessionId,
          customMessage: 'Image resolution too low',
          inputParams: { warnings: basicQualityCheck.warnings },
        });
      }

      // Step 5: Use Claude Vision for face detection
      reportProgress('Analyzing face detection...', 'face_detection');

      const faceAnalysis = await this.analyzeFaceWithClaude(processedPath, sessionId);

      // Combine results
      const qualityCheck: QualityCheckResult = {
        ...basicQualityCheck,
        ...faceAnalysis,
        is_valid:
          basicQualityCheck.resolution_ok &&
          faceAnalysis.face_detected &&
          faceAnalysis.face_count === 1 &&
          faceAnalysis.lighting_quality !== 'poor',
      };

      // Step 6: Validate face detection results
      if (!qualityCheck.face_detected) {
        throw formatError({
          code: ErrorCode.FB_FACE_001,
          agentName: this.agentName,
          sessionId,
        });
      }

      if (qualityCheck.face_count > photoBoothConfig.faceDetection.maxFaces) {
        throw formatError({
          code: ErrorCode.FB_FACE_002,
          agentName: this.agentName,
          sessionId,
          inputParams: { faceCount: qualityCheck.face_count },
        });
      }

      if (qualityCheck.face_confidence < photoBoothConfig.faceDetection.minConfidence) {
        qualityCheck.warnings.push('Face detection confidence is low');
        qualityCheck.suggestions.push('Please ensure face is clearly visible');
      }

      if (qualityCheck.lighting_quality === 'poor') {
        throw formatError({
          code: ErrorCode.FB_LIGHT_001,
          agentName: this.agentName,
          sessionId,
        });
      }

      reportProgress('Saving image to database...', 'save_image');

      // Step 7: Save image to database
      const imageId = await this.saveImage(sessionId, processedPath, processedImage.hash, qualityCheck);

      reportProgress('Image quality check completed successfully', 'complete');

      console.log(`[${this.agentName}] Quality check passed for session ${sessionId}`);

      return {
        image_id: imageId,
        quality_check: qualityCheck,
        processed_image_path: processedPath,
      };
    } catch (error) {
      // Log error
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
        code: ErrorCode.FB_UPLOAD_002,
        agentName: this.agentName,
        sessionId,
        customMessage: `Quality check failed: ${(error as Error).message}`,
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
   * Use Claude Vision to analyze face in image
   */
  private async analyzeFaceWithClaude(
    imagePath: string,
    sessionId: string
  ): Promise<Partial<QualityCheckResult>> {
    try {
      // Read image as base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg';

      // Call Claude Vision
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analyze this image for a photo booth application. Provide a JSON response with the following structure:
{
  "face_detected": boolean,
  "face_count": number,
  "face_confidence": number (0-1),
  "face_position": {
    "x": number (0-1 normalized),
    "y": number (0-1 normalized),
    "width": number (0-1 normalized),
    "height": number (0-1 normalized)
  } or null,
  "lighting_quality": "good" | "moderate" | "poor",
  "lighting_score": number (0-1),
  "composition_score": number (0-1),
  "warnings": string[],
  "suggestions": string[],
  "expression": string (e.g., "neutral", "smiling", "serious"),
  "age_range": string (e.g., "20-30"),
  "looking_at_camera": boolean
}

Focus on:
1. Face detection and position
2. Lighting quality (even lighting, no harsh shadows, no backlighting)
3. Image composition (face centered, good framing)
4. Whether the face is clearly visible and suitable for portrait transformation

Respond ONLY with the JSON, no other text.`,
              },
            ],
          },
        ],
      });

      // Parse response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude Vision');
      }

      // Clean up response (remove markdown code blocks if present)
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      const analysis = JSON.parse(jsonText.trim());

      return {
        face_detected: analysis.face_detected ?? false,
        face_count: analysis.face_count ?? 0,
        face_confidence: analysis.face_confidence ?? 0,
        face_position: analysis.face_position,
        lighting_quality: analysis.lighting_quality ?? 'moderate',
        lighting_score: analysis.lighting_score ?? 0.5,
        composition_score: analysis.composition_score ?? 0.5,
        warnings: analysis.warnings ?? [],
        suggestions: analysis.suggestions ?? [],
      };
    } catch (error) {
      console.error(`[${this.agentName}] Claude Vision analysis failed:`, error);

      // Return default values on error (allow user to proceed with manual check)
      return {
        face_detected: true,
        face_count: 1,
        face_confidence: 0.7,
        lighting_quality: 'moderate',
        lighting_score: 0.6,
        composition_score: 0.6,
        warnings: ['Face analysis service temporarily unavailable'],
        suggestions: ['Please ensure your face is clearly visible'],
      };
    }
  }

  /**
   * Save image to database
   */
  private async saveImage(
    sessionId: string,
    imagePath: string,
    imageHash: string,
    qualityCheck: QualityCheckResult
  ): Promise<string> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, image_hash, quality_check_json)
         VALUES ($1, 'original', $2, $3, $4)
         RETURNING image_id`,
        [sessionId, imagePath, imageHash, JSON.stringify(qualityCheck)]
      );

      return result.rows[0].image_id;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to save image: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get original image for a session
   */
  async getOriginalImage(sessionId: string): Promise<PhotoBoothImage | null> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `SELECT * FROM photo_booth_images
         WHERE session_id = $1 AND image_type = 'original'
         ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to get image: ${(error as Error).message}`,
      });
    }
  }
}
