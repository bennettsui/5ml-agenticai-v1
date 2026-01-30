// Image Generation Agent
// Calls ComfyUI API for Stable Diffusion image generation

import { Pool } from 'pg';
import * as path from 'path';
import { PhotoBoothImage, ThemeName, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';
import { photoBoothConfig } from '../config/photoBooth.config';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';
import { StyleGeneratorAgent, GeneratedPrompt } from './styleGenerator';
import { comfyuiClient, GenerationProgress } from '../lib/comfyuiClient';

export interface GenerationOptions {
  sessionId: string;
  prompt: GeneratedPrompt;
  onProgress?: (update: StatusUpdate) => void;
}

export interface GenerationResult {
  image_id: string;
  image_path: string;
  generation_time_ms: number;
  prompt_used: string;
}

export class ImageGenerationAgent {
  private pool: Pool;
  private sessionManager: SessionManagerAgent;
  private agentName = 'Image Generation Agent';

  constructor(pool: Pool, sessionManager: SessionManagerAgent) {
    this.pool = pool;
    this.sessionManager = sessionManager;
  }

  /**
   * Generate styled image using ComfyUI
   */
  async generateImage(options: GenerationOptions): Promise<GenerationResult> {
    const { sessionId, prompt, onProgress } = options;
    const startTime = Date.now();

    const reportProgress = (message: string, substep?: string, percentage?: number) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'generating',
        current_step: 'image_generation',
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
      await this.sessionManager.updateStatus(sessionId, 'generating', {
        theme_selected: prompt.theme.id,
      });

      // Step 1: Check ComfyUI availability
      reportProgress('🎬 Checking image generation service...', 'service_check', 5);

      const isAvailable = await comfyuiClient.isAvailable();
      if (!isAvailable && !photoBoothConfig.comfyui.mockMode) {
        throw formatError({
          code: ErrorCode.FB_GENAI_002,
          agentName: this.agentName,
          sessionId,
        });
      }

      reportProgress('✓ Generation service ready', 'service_ready', 10);

      // Step 2: Start generation
      reportProgress('🎬 Generating your 18th-century portrait...', 'generation_start', 15);

      // Progress callback for ComfyUI
      const handleGenerationProgress = (progress: GenerationProgress) => {
        const percentage = 15 + Math.round(progress.percentage * 0.7); // Scale to 15-85%
        reportProgress(
          `🎬 Generating image... Step ${progress.step}/${progress.totalSteps}`,
          `step_${progress.step}`,
          percentage
        );
      };

      // Call ComfyUI
      const result = await comfyuiClient.generateImage(
        {
          theme: prompt.theme,
          basePrompt: prompt.positive_prompt,
          negativePrompt: prompt.negative_prompt,
          seed: prompt.generation_params.seed,
          steps: prompt.generation_params.steps,
          cfgScale: prompt.generation_params.cfg_scale,
          width: prompt.generation_params.width,
          height: prompt.generation_params.height,
        },
        handleGenerationProgress
      );

      // Check for timeout
      const generationTime = Date.now() - startTime;
      if (generationTime > photoBoothConfig.comfyui.generationTimeout) {
        console.warn(
          `[${this.agentName}] Generation took ${generationTime}ms (over ${photoBoothConfig.comfyui.generationTimeout}ms limit)`
        );
      }

      if (!result.success) {
        throw formatError({
          code: ErrorCode.FB_GENAI_001,
          agentName: this.agentName,
          sessionId,
          customMessage: result.error || 'Generation failed',
        });
      }

      reportProgress('✓ Image generated successfully', 'generation_complete', 90);

      // Step 3: Save generated image
      reportProgress('💾 Saving generated image...', 'saving', 95);

      const imagePath = result.imagePath || this.generateMockImagePath(sessionId);
      const imageId = await this.saveGeneratedImage(sessionId, imagePath, prompt, result.generationTimeMs);

      reportProgress(
        `✓ Portrait completed in ${(result.generationTimeMs / 1000).toFixed(1)} seconds`,
        'complete',
        100
      );

      console.log(
        `[${this.agentName}] Generated image for session ${sessionId} in ${result.generationTimeMs}ms`
      );

      return {
        image_id: imageId,
        image_path: imagePath,
        generation_time_ms: result.generationTimeMs,
        prompt_used: prompt.positive_prompt,
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

      // Check for specific error types
      let errorCode = ErrorCode.FB_GENAI_001;
      const errorMessage = (error as Error).message.toLowerCase();

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        errorCode = ErrorCode.FB_GENAI_001;
      } else if (
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused')
      ) {
        errorCode = ErrorCode.FB_GENAI_002;
      } else if (errorMessage.includes('memory') || errorMessage.includes('oom')) {
        errorCode = ErrorCode.FB_GENAI_003;
      } else if (errorMessage.includes('safety') || errorMessage.includes('nsfw')) {
        errorCode = ErrorCode.FB_GENAI_004;
      }

      const formattedError = formatError({
        code: errorCode,
        agentName: this.agentName,
        sessionId,
        customMessage: `Image generation failed: ${(error as Error).message}`,
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
   * Save generated image to database
   */
  private async saveGeneratedImage(
    sessionId: string,
    imagePath: string,
    prompt: GeneratedPrompt,
    generationTimeMs: number
  ): Promise<string> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, theme, comfyui_prompt, generation_time_ms, metadata_json)
         VALUES ($1, 'styled', $2, $3, $4, $5, $6)
         RETURNING image_id`,
        [
          sessionId,
          imagePath,
          prompt.theme.id,
          prompt.positive_prompt,
          generationTimeMs,
          JSON.stringify({
            negative_prompt: prompt.negative_prompt,
            generation_params: prompt.generation_params,
          }),
        ]
      );

      return result.rows[0].image_id;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to save generated image: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Generate mock image path for development
   */
  private generateMockImagePath(sessionId: string): string {
    const outputDir = photoBoothConfig.storage.outputPath;
    return path.join(outputDir, `styled_${sessionId}_${Date.now()}.jpg`);
  }

  /**
   * Get generated image for a session
   */
  async getStyledImage(sessionId: string): Promise<PhotoBoothImage | null> {
    try {
      const result = await this.pool.query<PhotoBoothImage>(
        `SELECT * FROM photo_booth_images
         WHERE session_id = $1 AND image_type = 'styled'
         ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to get styled image: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Check system resources
   */
  async checkSystemResources(): Promise<{ available: boolean; vramFree?: number }> {
    try {
      const stats = await comfyuiClient.getSystemStats();
      if (!stats) {
        return { available: false };
      }

      // Require at least 2GB VRAM free
      const minVramRequired = 2048; // MB
      const available = stats.vram_free >= minVramRequired;

      return {
        available,
        vramFree: stats.vram_free,
      };
    } catch {
      return { available: false };
    }
  }
}
