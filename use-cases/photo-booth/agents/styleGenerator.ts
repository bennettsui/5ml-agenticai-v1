// Style Generator Agent
// Composes detailed image prompts for ComfyUI based on theme and analysis

import { AnalysisResult, ThemeName, Theme, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';
import themesConfig from '../config/themes.json';

export interface StylePromptOptions {
  sessionId: string;
  themeName: ThemeName;
  analysis: AnalysisResult;
  onProgress?: (update: StatusUpdate) => void;
}

export interface GeneratedPrompt {
  positive_prompt: string;
  negative_prompt: string;
  theme: Theme;
  generation_params: {
    steps: number;
    cfg_scale: number;
    width: number;
    height: number;
    seed: number;
  };
}

export class StyleGeneratorAgent {
  private sessionManager: SessionManagerAgent;
  private agentName = 'Style Generator Agent';
  private themes: Theme[];

  constructor(sessionManager: SessionManagerAgent) {
    this.sessionManager = sessionManager;
    this.themes = themesConfig.themes as Theme[];
  }

  /**
   * Generate styled prompts for image generation
   */
  generatePrompt(options: StylePromptOptions): GeneratedPrompt {
    const { sessionId, themeName, analysis, onProgress } = options;

    const reportProgress = (message: string, substep?: string) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'generating',
        current_step: 'style_generation',
        substep,
        message,
        timestamp: new Date(),
      };
      this.sessionManager.trackStatus(update);
      if (onProgress) onProgress(update);
    };

    // Find theme
    const theme = this.themes.find((t) => t.id === themeName);
    if (!theme) {
      throw formatError({
        code: ErrorCode.FB_THEME_001,
        agentName: this.agentName,
        sessionId,
        inputParams: { themeName },
      });
    }

    reportProgress(`Generating prompt for ${theme.name} theme...`, 'theme_selection');

    // Build positive prompt
    const positivePrompt = this.buildPositivePrompt(theme, analysis);

    reportProgress('Crafting negative constraints...', 'negative_prompt');

    // Build negative prompt
    const negativePrompt = this.buildNegativePrompt(theme);

    reportProgress('Calculating optimal generation parameters...', 'params_calculation');

    // Calculate generation parameters
    const generationParams = this.calculateGenerationParams(theme, analysis);

    reportProgress(`Ready: "${positivePrompt.substring(0, 60)}..."`, 'prompt_complete');

    console.log(`[${this.agentName}] Generated prompt for theme: ${themeName}`);

    return {
      positive_prompt: positivePrompt,
      negative_prompt: negativePrompt,
      theme,
      generation_params: generationParams,
    };
  }

  /**
   * Build positive prompt from theme and analysis
   */
  private buildPositivePrompt(theme: Theme, analysis: AnalysisResult): string {
    const parts: string[] = [];

    // Subject description based on analysis
    parts.push(this.getSubjectDescription(analysis));

    // Era and country context
    parts.push(`${theme.era} ${theme.country} aristocratic portrait`);

    // Costume description
    parts.push(theme.costume_description);

    // Environment description
    parts.push(`set in ${theme.environment_description}`);

    // Theme-specific keywords
    parts.push(theme.prompt_keywords.slice(0, 8).join(', '));

    // Quality boosters
    parts.push('highly detailed');
    parts.push('photorealistic');
    parts.push('masterpiece');
    parts.push('professional portrait photography');
    parts.push('8k quality');
    parts.push('sharp focus');
    parts.push('cinematic lighting');

    // Expression preservation
    if (analysis.face_analysis.expression) {
      parts.push(`${analysis.face_analysis.expression} expression`);
    }

    return parts.join(', ');
  }

  /**
   * Build negative prompt from theme
   */
  private buildNegativePrompt(theme: Theme): string {
    const parts: string[] = [];

    // Theme-specific negatives
    parts.push(...theme.negative_keywords);

    // Default quality negatives
    parts.push(themesConfig.default_negative_prompt);

    // Additional quality negatives
    const additionalNegatives = [
      'ugly',
      'tiling',
      'poorly drawn hands',
      'poorly drawn feet',
      'poorly drawn face',
      'out of frame',
      'mutation',
      'mutated',
      'extra limbs',
      'extra legs',
      'extra arms',
      'disfigured',
      'deformed',
      'cross-eye',
      'body out of frame',
      'bad art',
      'bad anatomy',
      'blurred',
      'text',
      'watermark',
      'grainy',
      'duplicate',
      'error',
      'jpeg artifacts',
    ];

    parts.push(additionalNegatives.join(', '));

    return parts.join(', ');
  }

  /**
   * Get subject description from analysis
   */
  private getSubjectDescription(analysis: AnalysisResult): string {
    const parts: string[] = [];

    // Gender (if detected)
    if (analysis.face_analysis.gender_guess) {
      parts.push(
        analysis.face_analysis.gender_guess === 'male'
          ? 'A distinguished gentleman'
          : 'An elegant lady'
      );
    } else {
      parts.push('A noble person');
    }

    // Age range (if available)
    if (analysis.face_analysis.age_range) {
      parts.push(`(${analysis.face_analysis.age_range} years old)`);
    }

    return parts.join(' ');
  }

  /**
   * Calculate optimal generation parameters
   */
  private calculateGenerationParams(
    theme: Theme,
    analysis: AnalysisResult
  ): GeneratedPrompt['generation_params'] {
    const defaultSettings = themesConfig.generation_settings;

    // Base parameters
    const params = {
      steps: defaultSettings.steps,
      cfg_scale: defaultSettings.cfg_scale,
      width: defaultSettings.width,
      height: defaultSettings.height,
      seed: defaultSettings.seed === -1 ? Math.floor(Math.random() * 2147483647) : defaultSettings.seed,
    };

    // Adjust steps based on complexity
    if (analysis.environment_analysis.background_complexity === 'complex') {
      params.steps = Math.min(30, params.steps + 5);
    }

    // Adjust CFG scale based on desired adherence to prompt
    // Higher CFG = more literal interpretation of prompt
    if (analysis.face_analysis.confidence && analysis.face_analysis.confidence > 0.9) {
      // High confidence face - can use higher CFG
      params.cfg_scale = 7.5;
    } else {
      // Lower confidence - use slightly lower CFG for more flexibility
      params.cfg_scale = 6.5;
    }

    return params;
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): Theme[] {
    return this.themes;
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId: ThemeName): Theme | undefined {
    return this.themes.find((t) => t.id === themeId);
  }

  /**
   * Validate theme name
   */
  isValidTheme(themeName: string): themeName is ThemeName {
    return this.themes.some((t) => t.id === themeName);
  }

  /**
   * Get prompt preview without triggering generation
   */
  previewPrompt(themeName: ThemeName, analysis?: Partial<AnalysisResult>): string {
    const theme = this.themes.find((t) => t.id === themeName);
    if (!theme) return '';

    const defaultAnalysis: AnalysisResult = {
      face_analysis: {
        detected: true,
        count: 1,
        confidence: 0.9,
        ...analysis?.face_analysis,
      },
      environment_analysis: {
        scene_type: 'studio',
        lighting: 'artificial',
        background_complexity: 'simple',
        colors_dominant: [],
        ...analysis?.environment_analysis,
      },
      style_compatibility: {
        recommended_themes: [themeName],
        compatibility_scores: { [themeName]: 1.0 } as Record<ThemeName, number>,
        reasoning: '',
        ...analysis?.style_compatibility,
      },
    };

    return this.buildPositivePrompt(theme, defaultAnalysis);
  }
}
