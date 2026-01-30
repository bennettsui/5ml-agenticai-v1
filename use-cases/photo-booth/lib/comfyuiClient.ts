// ComfyUI Client Wrapper
// Handles communication with ComfyUI server for image generation

import axios, { AxiosInstance } from 'axios';
import { photoBoothConfig } from '../config/photoBooth.config';
import { ComfyUIPromptResponse, ComfyUIHistoryResponse, Theme } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface GenerationOptions {
  theme: Theme;
  basePrompt: string;
  negativePrompt?: string;
  seed?: number;
  steps?: number;
  cfgScale?: number;
  width?: number;
  height?: number;
}

export interface GenerationResult {
  success: boolean;
  imagePath?: string;
  promptId?: string;
  generationTimeMs: number;
  error?: string;
}

export interface GenerationProgress {
  step: number;
  totalSteps: number;
  percentage: number;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

class ComfyUIClient {
  private client: AxiosInstance;
  private mockMode: boolean;

  constructor() {
    this.mockMode = photoBoothConfig.comfyui.mockMode;

    this.client = axios.create({
      baseURL: photoBoothConfig.comfyui.baseUrl,
      timeout: photoBoothConfig.comfyui.generationTimeout + 5000, // Extra time for network
    });

    if (this.mockMode) {
      console.log('[ComfyUI] Running in MOCK mode - no actual image generation');
    }
  }

  /**
   * Check if ComfyUI server is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.mockMode) {
      return true;
    }

    try {
      const response = await this.client.get('/system_stats');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Generate an image using ComfyUI
   */
  async generateImage(
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    if (this.mockMode) {
      return this.mockGenerate(options, onProgress);
    }

    try {
      // Build the workflow with the prompt
      const workflow = this.buildWorkflow(options);

      // Submit the prompt to ComfyUI
      const promptResponse = await this.client.post<ComfyUIPromptResponse>('/prompt', {
        prompt: workflow,
      });

      const promptId = promptResponse.data.prompt_id;

      if (!promptId) {
        throw new Error('No prompt ID returned from ComfyUI');
      }

      // Poll for completion
      const imagePath = await this.pollForCompletion(promptId, options, onProgress);

      return {
        success: true,
        imagePath,
        promptId,
        generationTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ComfyUI] Generation error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        generationTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Build ComfyUI workflow JSON
   */
  private buildWorkflow(options: GenerationOptions): Record<string, unknown> {
    const {
      theme,
      basePrompt,
      negativePrompt,
      seed = Math.floor(Math.random() * 2147483647),
      steps = photoBoothConfig.imageProcessing.generatedSize.width === 512 ? 20 : 25,
      cfgScale = 7.0,
      width = photoBoothConfig.imageProcessing.generatedSize.width,
      height = photoBoothConfig.imageProcessing.generatedSize.height,
    } = options;

    // Compose the full prompt with theme keywords
    const fullPrompt = this.composePrompt(basePrompt, theme);
    const fullNegativePrompt = negativePrompt || this.composeNegativePrompt(theme);

    // SD 1.5 workflow structure
    return {
      '3': {
        inputs: {
          seed,
          steps,
          cfg: cfgScale,
          sampler_name: 'euler_ancestral',
          scheduler: 'normal',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
        class_type: 'KSampler',
      },
      '4': {
        inputs: {
          ckpt_name: 'sd_v1-5-pruned-emaonly.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
      },
      '5': {
        inputs: {
          width,
          height,
          batch_size: 1,
        },
        class_type: 'EmptyLatentImage',
      },
      '6': {
        inputs: {
          text: fullPrompt,
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '7': {
        inputs: {
          text: fullNegativePrompt,
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '8': {
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
        class_type: 'VAEDecode',
      },
      '9': {
        inputs: {
          filename_prefix: 'photobooth',
          images: ['8', 0],
        },
        class_type: 'SaveImage',
      },
    };
  }

  /**
   * Compose full prompt from base prompt and theme
   */
  private composePrompt(basePrompt: string, theme: Theme): string {
    const themeKeywords = theme.prompt_keywords.join(', ');
    const environment = theme.environment_description;
    const costume = theme.costume_description;

    return `${basePrompt}, ${themeKeywords}, wearing ${costume}, set in ${environment}, highly detailed, photorealistic, 8k quality, professional portrait photography`;
  }

  /**
   * Compose negative prompt from theme
   */
  private composeNegativePrompt(theme: Theme): string {
    const themeNegatives = theme.negative_keywords.join(', ');
    const defaultNegatives =
      'blurry, low quality, distorted face, extra limbs, bad anatomy, watermark, text, signature, modern elements, contemporary clothing, jeans, t-shirt, sneakers, smartphone, computer, car, plastic, nsfw';

    return `${themeNegatives}, ${defaultNegatives}`;
  }

  /**
   * Poll ComfyUI for generation completion
   */
  private async pollForCompletion(
    promptId: string,
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    const timeout = photoBoothConfig.comfyui.generationTimeout;
    const pollInterval = photoBoothConfig.comfyui.pollInterval;
    const startTime = Date.now();
    const totalSteps = options.steps || 20;

    while (Date.now() - startTime < timeout) {
      try {
        const historyResponse = await this.client.get<ComfyUIHistoryResponse>(
          `/history/${promptId}`
        );

        const history = historyResponse.data[promptId];

        if (history?.status?.completed) {
          // Find the output image
          const outputs = history.outputs;
          for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images && nodeOutput.images.length > 0) {
              const image = nodeOutput.images[0];
              const imagePath = path.join(
                photoBoothConfig.comfyui.baseUrl,
                'view',
                `?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`
              );

              // Report final progress
              if (onProgress) {
                onProgress({ step: totalSteps, totalSteps, percentage: 100 });
              }

              return imagePath;
            }
          }
          throw new Error('No output image found in completed generation');
        }

        // Check progress (if available)
        if (history?.status?.messages && onProgress) {
          // Estimate progress based on queue position
          const elapsed = Date.now() - startTime;
          const estimatedProgress = Math.min(90, (elapsed / timeout) * 100);
          const estimatedStep = Math.floor((estimatedProgress / 100) * totalSteps);

          onProgress({
            step: estimatedStep,
            totalSteps,
            percentage: estimatedProgress,
          });
        }
      } catch {
        // Ignore polling errors, continue polling
      }

      await this.sleep(pollInterval);
    }

    throw new Error('Generation timed out');
  }

  /**
   * Mock generation for development without GPU
   */
  private async mockGenerate(
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const steps = options.steps || 20;

    console.log('[ComfyUI Mock] Starting mock generation...');
    console.log('[ComfyUI Mock] Theme:', options.theme.name);
    console.log('[ComfyUI Mock] Base Prompt:', options.basePrompt);

    // Simulate progress over ~3 seconds
    for (let step = 1; step <= steps; step++) {
      await this.sleep(150);

      if (onProgress) {
        onProgress({
          step,
          totalSteps: steps,
          percentage: Math.round((step / steps) * 100),
        });
      }
    }

    // Create a placeholder image file
    const outputDir = photoBoothConfig.storage.outputPath;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `mock_${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Create a simple placeholder (in real scenario, would copy a sample image)
    // For now, just return a path that indicates mock mode
    console.log('[ComfyUI Mock] Generation complete');

    return {
      success: true,
      imagePath: outputPath,
      promptId: `mock_${Date.now()}`,
      generationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Download image from ComfyUI server
   */
  async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    if (this.mockMode) {
      // In mock mode, just create a placeholder
      console.log('[ComfyUI Mock] Would download image to:', outputPath);
      return;
    }

    const response = await this.client.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, response.data);
  }

  /**
   * Helper to sleep for a duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get system stats from ComfyUI
   */
  async getSystemStats(): Promise<{ vram_total: number; vram_free: number } | null> {
    if (this.mockMode) {
      return { vram_total: 8192, vram_free: 6144 }; // Mock 8GB VRAM
    }

    try {
      const response = await this.client.get('/system_stats');
      return response.data?.devices?.[0] || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const comfyuiClient = new ComfyUIClient();
export default comfyuiClient;
