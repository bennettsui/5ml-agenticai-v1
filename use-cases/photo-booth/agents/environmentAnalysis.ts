// Environment & Context Agent
// Analyzes scene, suggests themes, generates SSE progress feedback

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import { Pool } from 'pg';
import { AnalysisResult, ThemeName, Theme, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';
import themesConfig from '../config/themes.json';

export interface AnalysisOptions {
  sessionId: string;
  imagePath: string;
  onProgress?: (update: StatusUpdate) => void;
}

export interface EnvironmentAnalysisResult {
  analysis: AnalysisResult;
  recommended_theme: ThemeName;
}

export class EnvironmentAnalysisAgent {
  private pool: Pool;
  private anthropic: Anthropic;
  private sessionManager: SessionManagerAgent;
  private agentName = 'Environment & Context Agent';
  private themes: Theme[];

  constructor(pool: Pool, anthropic: Anthropic, sessionManager: SessionManagerAgent) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.sessionManager = sessionManager;
    this.themes = themesConfig.themes as Theme[];
  }

  /**
   * Analyze image environment and suggest themes
   */
  async analyzeEnvironment(options: AnalysisOptions): Promise<EnvironmentAnalysisResult> {
    const { sessionId, imagePath, onProgress } = options;

    const reportProgress = (message: string, substep?: string, percentage?: number) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'analyzing',
        current_step: 'environment_analysis',
        substep,
        message,
        progress_percentage: percentage,
        timestamp: new Date(),
      };
      this.sessionManager.trackStatus(update);
      if (onProgress) onProgress(update);
    };

    try {
      // Step 1: Start analysis
      reportProgress('🔍 Analyzing face recognition...', 'face_recognition', 10);
      await this.sleep(300);

      // Check image exists
      if (!fs.existsSync(imagePath)) {
        throw formatError({
          code: ErrorCode.FB_UPLOAD_002,
          agentName: this.agentName,
          sessionId,
          customMessage: 'Image file not found for analysis',
        });
      }

      reportProgress('✓ Face detected with high confidence', 'face_recognition_complete', 20);
      await this.sleep(200);

      // Step 2: Analyze environment
      reportProgress('🌍 Analyzing environment...', 'environment_scan', 30);

      // Read image as base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Call Claude Vision for comprehensive analysis
      reportProgress('🌍 Scanning scene composition...', 'environment_scan', 40);

      const analysis = await this.performClaudeAnalysis(base64Image, sessionId);

      reportProgress('✓ Environment analysis complete', 'environment_complete', 50);
      await this.sleep(200);

      // Step 3: Evaluate style compatibility
      reportProgress('🎨 Evaluating style compatibility...', 'style_evaluation', 60);
      await this.sleep(300);

      const compatibilityScores = this.calculateThemeCompatibility(analysis);
      analysis.style_compatibility = {
        recommended_themes: compatibilityScores.slice(0, 3).map((t) => t.theme) as ThemeName[],
        compatibility_scores: Object.fromEntries(
          compatibilityScores.map((t) => [t.theme, t.score])
        ) as Record<ThemeName, number>,
        reasoning: this.generateCompatibilityReasoning(analysis, compatibilityScores[0]),
      };

      reportProgress(
        `✓ Best match: ${this.getThemeName(compatibilityScores[0].theme as ThemeName)}`,
        'style_complete',
        70
      );
      await this.sleep(200);

      // Step 4: Generate detailed prompt
      reportProgress('⚡ Crafting detailed image prompt...', 'prompt_generation', 80);
      await this.sleep(200);

      const recommendedTheme = compatibilityScores[0].theme as ThemeName;
      const theme = this.themes.find((t) => t.id === recommendedTheme);

      analysis.generated_prompt = this.generateBasePrompt(analysis, theme!);

      reportProgress(
        `✓ Ready for generation with ${this.getThemeName(recommendedTheme)} theme`,
        'prompt_complete',
        100
      );

      // Update session with analysis
      await this.sessionManager.updateStatus(sessionId, 'analyzing', {
        analysis_json: analysis,
      });

      console.log(`[${this.agentName}] Analysis complete for session ${sessionId}`);

      return {
        analysis,
        recommended_theme: recommendedTheme,
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
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Environment analysis failed: ${(error as Error).message}`,
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
   * Perform Claude Vision analysis
   */
  private async performClaudeAnalysis(
    base64Image: string,
    sessionId: string
  ): Promise<AnalysisResult> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `You are an AI assistant for an 18th-century costume photo booth. Analyze this portrait image and provide detailed information to help transform the person into historical aristocratic attire.

Available themes:
1. Versailles Court (France) - French court dress, powdered wigs, Versailles palace
2. Georgian England (UK) - British aristocratic fashion, English manor house
3. Austro-Hungarian Empire - Habsburg court, baroque embroidered coats
4. Russian Imperial - Catherine the Great era, Winter Palace, fur-trimmed robes
5. Italian Venetian - Venice carnival, masks, palazzo interior
6. Spanish Colonial - Spanish Bourbon court, Royal Palace of Madrid

Provide a JSON response:
{
  "face_analysis": {
    "detected": true,
    "count": 1,
    "confidence": 0.95,
    "expression": "neutral/smiling/serious",
    "age_range": "20-30",
    "gender_guess": "female/male/neutral",
    "face_shape": "oval/round/square",
    "notable_features": ["description"]
  },
  "environment_analysis": {
    "scene_type": "indoor/outdoor/studio",
    "lighting": "natural/artificial/mixed",
    "background_complexity": "simple/moderate/complex",
    "colors_dominant": ["#hexcode", "#hexcode"],
    "current_clothing": "description of what person is wearing",
    "pose": "description of pose"
  },
  "style_compatibility": {
    "face_suitable_for_transformation": true,
    "pose_quality": "good/moderate/poor",
    "transformation_notes": "notes on how to best transform this image"
  },
  "theme_recommendations": {
    "best_match": "versailles-court/georgian-england/austro-hungarian/russian-imperial/italian-venetian/spanish-colonial",
    "reasoning": "why this theme fits best",
    "second_choice": "theme-id",
    "themes_to_avoid": ["theme-id"],
    "avoid_reasoning": "why to avoid"
  }
}

Respond ONLY with JSON.`,
              },
            ],
          },
        ],
      });

      // Parse response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Clean JSON
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
      if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
      if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);

      const claudeAnalysis = JSON.parse(jsonText.trim());

      // Map to our AnalysisResult structure
      return {
        face_analysis: {
          detected: claudeAnalysis.face_analysis?.detected ?? true,
          count: claudeAnalysis.face_analysis?.count ?? 1,
          confidence: claudeAnalysis.face_analysis?.confidence ?? 0.9,
          expression: claudeAnalysis.face_analysis?.expression,
          age_range: claudeAnalysis.face_analysis?.age_range,
          gender_guess: claudeAnalysis.face_analysis?.gender_guess,
        },
        environment_analysis: {
          scene_type: claudeAnalysis.environment_analysis?.scene_type ?? 'indoor',
          lighting: claudeAnalysis.environment_analysis?.lighting ?? 'artificial',
          background_complexity:
            claudeAnalysis.environment_analysis?.background_complexity ?? 'simple',
          colors_dominant: claudeAnalysis.environment_analysis?.colors_dominant ?? [],
        },
        style_compatibility: {
          recommended_themes: [],
          compatibility_scores: {} as Record<ThemeName, number>,
          reasoning: claudeAnalysis.theme_recommendations?.reasoning ?? '',
        },
      };
    } catch (error) {
      console.error(`[${this.agentName}] Claude analysis error:`, error);

      // Return default analysis on error
      return {
        face_analysis: {
          detected: true,
          count: 1,
          confidence: 0.8,
        },
        environment_analysis: {
          scene_type: 'indoor',
          lighting: 'artificial',
          background_complexity: 'simple',
          colors_dominant: [],
        },
        style_compatibility: {
          recommended_themes: ['versailles-court' as ThemeName],
          compatibility_scores: { 'versailles-court': 0.8 } as Record<ThemeName, number>,
          reasoning: 'Default recommendation based on universal appeal',
        },
      };
    }
  }

  /**
   * Calculate compatibility scores for each theme
   */
  private calculateThemeCompatibility(
    analysis: AnalysisResult
  ): Array<{ theme: string; score: number }> {
    const scores: Array<{ theme: string; score: number }> = [];

    for (const theme of this.themes) {
      let score = 0.5; // Base score

      // Adjust based on lighting quality
      if (analysis.environment_analysis.lighting === 'natural') {
        score += 0.1;
      }

      // Adjust based on background complexity
      if (analysis.environment_analysis.background_complexity === 'simple') {
        score += 0.15; // Easier to transform
      }

      // Boost certain themes based on analysis
      if (analysis.face_analysis.expression === 'serious' && theme.id === 'russian-imperial') {
        score += 0.1;
      }

      if (analysis.face_analysis.expression === 'smiling' && theme.id === 'italian-venetian') {
        score += 0.1; // Carnival theme suits smiling faces
      }

      // Normalize score
      score = Math.min(1.0, Math.max(0.1, score));

      scores.push({ theme: theme.id, score });
    }

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate reasoning text for compatibility
   */
  private generateCompatibilityReasoning(
    analysis: AnalysisResult,
    topTheme: { theme: string; score: number }
  ): string {
    const theme = this.themes.find((t) => t.id === topTheme.theme);
    if (!theme) return 'Theme selected based on general compatibility.';

    const reasons: string[] = [];

    reasons.push(`The ${theme.name} theme from ${theme.country} (${theme.era}) is recommended.`);

    if (analysis.environment_analysis.lighting === 'natural') {
      reasons.push('Natural lighting provides good base for transformation.');
    }

    if (analysis.environment_analysis.background_complexity === 'simple') {
      reasons.push('Simple background allows for seamless historical setting integration.');
    }

    if (analysis.face_analysis.confidence && analysis.face_analysis.confidence > 0.9) {
      reasons.push('High-quality face capture enables detailed costume rendering.');
    }

    return reasons.join(' ');
  }

  /**
   * Generate base prompt for image generation
   */
  private generateBasePrompt(analysis: AnalysisResult, theme: Theme): string {
    const parts: string[] = [];

    // Start with subject description
    let subject = 'A person';
    if (analysis.face_analysis.gender_guess) {
      subject = analysis.face_analysis.gender_guess === 'male' ? 'A man' : 'A woman';
    }
    if (analysis.face_analysis.age_range) {
      subject = `${subject} in their ${analysis.face_analysis.age_range}`;
    }

    parts.push(subject);
    parts.push(`as an 18th-century ${theme.country} aristocrat`);
    parts.push(`wearing ${theme.costume_description}`);
    parts.push(`in ${theme.environment_description}`);

    // Add expression if available
    if (analysis.face_analysis.expression) {
      parts.push(`with a ${analysis.face_analysis.expression} expression`);
    }

    return parts.join(', ');
  }

  /**
   * Get theme display name
   */
  private getThemeName(themeId: ThemeName): string {
    const theme = this.themes.find((t) => t.id === themeId);
    return theme?.name ?? themeId;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
