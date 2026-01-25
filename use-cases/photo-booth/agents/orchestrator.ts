// Photo Booth Orchestrator Agent
// Main coordinator for the photo booth workflow

import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import {
  PhotoBoothSession,
  ThemeName,
  AnalysisResult,
  QualityCheckResult,
  ErrorCode,
  SessionStatus,
} from '../types';
import { formatError } from '../lib/errorFormatter';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';
import { FaceQualityCheckAgent } from './faceQualityCheck';
import { EnvironmentAnalysisAgent } from './environmentAnalysis';
import { StyleGeneratorAgent } from './styleGenerator';
import { ImageGenerationAgent } from './imageGeneration';
import { BrandingAgent } from './brandingAgent';
import { QRDeliveryAgent } from './qrDelivery';
import { AnalyticsLoggerAgent } from './analyticsLogger';

export interface OrchestratorConfig {
  pool: Pool;
  anthropic: Anthropic;
}

export interface WorkflowResult {
  success: boolean;
  session_id: string;
  status: SessionStatus;
  branded_image_url?: string;
  qr_code_url?: string;
  download_link?: string;
  share_link?: string;
  generation_time_ms?: number;
  error?: {
    code: string;
    message: string;
    recovery_action?: string;
  };
}

export interface UploadResult {
  image_id: string;
  quality_check: QualityCheckResult;
}

export interface AnalyzeResult {
  analysis: AnalysisResult;
  recommended_theme: ThemeName;
}

export interface GenerateResult {
  image_id: string;
  generated_image_url: string;
  generation_time_ms: number;
}

export interface FinalizeResult {
  branded_image_url: string;
  qr_code_url: string;
  qr_code_data_url: string;
  download_link: string;
  share_link: string;
}

export class PhotoBoothOrchestrator {
  private pool: Pool;
  private anthropic: Anthropic;

  // Agents
  private sessionManager: SessionManagerAgent;
  private faceQualityCheck: FaceQualityCheckAgent;
  private environmentAnalysis: EnvironmentAnalysisAgent;
  private styleGenerator: StyleGeneratorAgent;
  private imageGeneration: ImageGenerationAgent;
  private brandingAgent: BrandingAgent;
  private qrDelivery: QRDeliveryAgent;
  private analyticsLogger: AnalyticsLoggerAgent;

  private agentName = 'Photo Booth Orchestrator';

  constructor(config: OrchestratorConfig) {
    this.pool = config.pool;
    this.anthropic = config.anthropic;

    // Initialize agents
    this.sessionManager = new SessionManagerAgent(this.pool);
    this.faceQualityCheck = new FaceQualityCheckAgent(
      this.pool,
      this.anthropic,
      this.sessionManager
    );
    this.environmentAnalysis = new EnvironmentAnalysisAgent(
      this.pool,
      this.anthropic,
      this.sessionManager
    );
    this.styleGenerator = new StyleGeneratorAgent(this.sessionManager);
    this.imageGeneration = new ImageGenerationAgent(this.pool, this.sessionManager);
    this.brandingAgent = new BrandingAgent(this.pool, this.sessionManager);
    this.qrDelivery = new QRDeliveryAgent(this.pool, this.sessionManager);
    this.analyticsLogger = new AnalyticsLoggerAgent(this.pool);
  }

  /**
   * Create a new session
   */
  async createSession(
    eventId?: string,
    language: string = 'en',
    consentAgreed: boolean = true
  ): Promise<PhotoBoothSession> {
    console.log(`[${this.agentName}] Creating new session...`);

    const session = await this.sessionManager.createSession({
      event_id: eventId,
      language,
      consent_agreed: consentAgreed,
    });

    console.log(`[${this.agentName}] Session created: ${session.session_id}`);

    return session;
  }

  /**
   * Upload and validate image
   */
  async uploadImage(
    sessionId: string,
    imagePath: string,
    onProgress?: (update: StatusUpdate) => void
  ): Promise<UploadResult> {
    console.log(`[${this.agentName}] Processing upload for session ${sessionId}...`);

    // Validate session state
    await this.sessionManager.validateSessionState(sessionId, ['created']);

    // Run face quality check
    const result = await this.faceQualityCheck.checkImage({
      sessionId,
      imagePath,
      onProgress,
    });

    console.log(`[${this.agentName}] Upload processed: image_id=${result.image_id}`);

    return {
      image_id: result.image_id,
      quality_check: result.quality_check,
    };
  }

  /**
   * Analyze image and suggest themes
   */
  async analyzeImage(
    sessionId: string,
    onProgress?: (update: StatusUpdate) => void
  ): Promise<AnalyzeResult> {
    console.log(`[${this.agentName}] Analyzing image for session ${sessionId}...`);

    // Validate session state
    await this.sessionManager.validateSessionState(sessionId, ['created', 'analyzing']);

    // Get original image
    const originalImage = await this.faceQualityCheck.getOriginalImage(sessionId);
    if (!originalImage) {
      throw formatError({
        code: ErrorCode.FB_DB_002,
        agentName: this.agentName,
        sessionId,
        customMessage: 'No image found for session. Please upload an image first.',
      });
    }

    // Run environment analysis
    const result = await this.environmentAnalysis.analyzeEnvironment({
      sessionId,
      imagePath: originalImage.image_path,
      onProgress,
    });

    console.log(
      `[${this.agentName}] Analysis complete: recommended theme=${result.recommended_theme}`
    );

    return {
      analysis: result.analysis,
      recommended_theme: result.recommended_theme,
    };
  }

  /**
   * Generate styled image
   */
  async generateImage(
    sessionId: string,
    themeName: ThemeName,
    onProgress?: (update: StatusUpdate) => void
  ): Promise<GenerateResult> {
    console.log(`[${this.agentName}] Generating image for session ${sessionId} with theme ${themeName}...`);

    // Validate session state
    const session = await this.sessionManager.validateSessionState(sessionId, [
      'created',
      'analyzing',
    ]);

    // Validate theme
    if (!this.styleGenerator.isValidTheme(themeName)) {
      throw formatError({
        code: ErrorCode.FB_THEME_001,
        agentName: this.agentName,
        sessionId,
        inputParams: { themeName },
      });
    }

    // Get analysis (use existing or create default)
    let analysis: AnalysisResult = session.analysis_json || {
      face_analysis: {
        detected: true,
        count: 1,
        confidence: 0.9,
      },
      environment_analysis: {
        scene_type: 'studio',
        lighting: 'artificial',
        background_complexity: 'simple',
        colors_dominant: [],
      },
      style_compatibility: {
        recommended_themes: [themeName],
        compatibility_scores: { [themeName]: 1.0 } as Record<ThemeName, number>,
        reasoning: 'User selected theme',
      },
    };

    // Generate prompt
    const prompt = this.styleGenerator.generatePrompt({
      sessionId,
      themeName,
      analysis,
      onProgress,
    });

    // Generate image
    const result = await this.imageGeneration.generateImage({
      sessionId,
      prompt,
      onProgress,
    });

    console.log(`[${this.agentName}] Image generated in ${result.generation_time_ms}ms`);

    return {
      image_id: result.image_id,
      generated_image_url: `/api/photo-booth/image/${result.image_id}`,
      generation_time_ms: result.generation_time_ms,
    };
  }

  /**
   * Finalize session with branding and QR code
   */
  async finalizeSession(
    sessionId: string,
    imageId: string,
    onProgress?: (update: StatusUpdate) => void
  ): Promise<FinalizeResult> {
    console.log(`[${this.agentName}] Finalizing session ${sessionId}...`);

    // Validate session state
    const session = await this.sessionManager.validateSessionState(sessionId, ['generating']);

    // Get event details if available
    let eventHashtag: string | undefined;
    let eventName: string | undefined;

    if (session.event_id) {
      const event = await this.sessionManager.getEvent(session.event_id);
      if (event) {
        eventHashtag = event.hashtag || undefined;
        eventName = event.name;
      }
    }

    // Get styled image
    const styledImage = await this.imageGeneration.getStyledImage(sessionId);
    if (!styledImage) {
      throw formatError({
        code: ErrorCode.FB_DB_002,
        agentName: this.agentName,
        sessionId,
        customMessage: 'Styled image not found. Please generate an image first.',
      });
    }

    // Apply branding
    const brandingResult = await this.brandingAgent.applyBrandingOverlay({
      sessionId,
      styledImagePath: styledImage.image_path,
      eventHashtag,
      eventName,
      onProgress,
    });

    // Generate QR code and links
    const deliveryResult = await this.qrDelivery.generateDelivery({
      sessionId,
      imageId: brandingResult.image_id,
      brandedImagePath: brandingResult.branded_image_path,
      onProgress,
    });

    // Mark session as completed
    await this.sessionManager.updateStatus(sessionId, 'completed');

    // Log analytics
    await this.analyticsLogger.logSessionComplete(
      sessionId,
      session.event_id,
      session.theme_selected as ThemeName,
      styledImage.generation_time_ms || undefined
    );

    console.log(`[${this.agentName}] Session ${sessionId} completed successfully`);

    return {
      branded_image_url: `/api/photo-booth/image/${brandingResult.image_id}`,
      qr_code_url: `/api/photo-booth/qr/${deliveryResult.qr_id}`,
      qr_code_data_url: deliveryResult.qr_code_data_url,
      download_link: deliveryResult.download_link,
      share_link: deliveryResult.share_link,
    };
  }

  /**
   * Run complete workflow (for testing)
   */
  async runCompleteWorkflow(
    imagePath: string,
    themeName: ThemeName,
    eventId?: string,
    onProgress?: (update: StatusUpdate) => void
  ): Promise<WorkflowResult> {
    let sessionId: string | undefined;

    try {
      // Step 1: Create session
      const session = await this.createSession(eventId);
      sessionId = session.session_id;

      // Step 2: Upload image
      const uploadResult = await this.uploadImage(sessionId, imagePath, onProgress);

      // Step 3: Analyze image
      await this.analyzeImage(sessionId, onProgress);

      // Step 4: Generate styled image
      const generateResult = await this.generateImage(sessionId, themeName, onProgress);

      // Step 5: Finalize with branding and QR
      const finalizeResult = await this.finalizeSession(
        sessionId,
        generateResult.image_id,
        onProgress
      );

      return {
        success: true,
        session_id: sessionId,
        status: 'completed',
        branded_image_url: finalizeResult.branded_image_url,
        qr_code_url: finalizeResult.qr_code_url,
        download_link: finalizeResult.download_link,
        share_link: finalizeResult.share_link,
        generation_time_ms: generateResult.generation_time_ms,
      };
    } catch (error) {
      // Log failure
      if (sessionId) {
        const errorCode = (error as { code?: string }).code || ErrorCode.FB_DB_001;
        const errorMessage = (error as { message?: string }).message || 'Unknown error';

        await this.sessionManager.updateStatus(sessionId, 'failed', {
          error_code: errorCode,
          error_message: errorMessage,
        });

        await this.analyticsLogger.logSessionFailed(sessionId, eventId, errorCode);
      }

      return {
        success: false,
        session_id: sessionId || 'unknown',
        status: 'failed',
        error: {
          code: (error as { code?: string }).code || 'UNKNOWN',
          message: (error as { message?: string }).message || 'An unexpected error occurred',
          recovery_action: (error as { recovery_action?: string }).recovery_action,
        },
      };
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId: string): Promise<{
    session: PhotoBoothSession | null;
    progress: ReturnType<SessionManagerAgent['getSessionProgress']>;
    statusUpdates: StatusUpdate[];
  }> {
    const session = await this.sessionManager.getSession(sessionId);
    const progress = this.sessionManager.getSessionProgress(sessionId);
    const statusUpdates = this.sessionManager.getStatusUpdates(sessionId);

    return {
      session,
      progress,
      statusUpdates,
    };
  }

  /**
   * Get available themes
   */
  getThemes() {
    return this.styleGenerator.getAvailableThemes();
  }

  /**
   * Get analytics
   */
  async getAnalytics(eventId?: string, days: number = 7) {
    return this.analyticsLogger.getAggregatedAnalytics(eventId, days);
  }

  /**
   * Get popular themes
   */
  async getPopularThemes(eventId?: string, days: number = 7) {
    return this.analyticsLogger.getPopularThemes(eventId, days);
  }

  // Expose individual agents for direct access if needed
  get agents() {
    return {
      sessionManager: this.sessionManager,
      faceQualityCheck: this.faceQualityCheck,
      environmentAnalysis: this.environmentAnalysis,
      styleGenerator: this.styleGenerator,
      imageGeneration: this.imageGeneration,
      brandingAgent: this.brandingAgent,
      qrDelivery: this.qrDelivery,
      analyticsLogger: this.analyticsLogger,
    };
  }
}

// Factory function for creating orchestrator
export function createPhotoBoothOrchestrator(config: OrchestratorConfig): PhotoBoothOrchestrator {
  return new PhotoBoothOrchestrator(config);
}
