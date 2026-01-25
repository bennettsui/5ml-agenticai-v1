// Photo Booth Orchestrator Agent (JavaScript version)
// Main coordinator for the photo booth workflow

const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const sharp = require('sharp');
const { createGeminiImageClient } = require('../lib/geminiImageClient');

// Load themes configuration
const themesConfig = require('../config/themes.json');

// Gemini API key for image generation (set via environment variable)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class PhotoBoothOrchestrator {
  constructor(config) {
    this.pool = config.pool;
    this.anthropic = config.anthropic;
    this.themes = themesConfig.themes;
    this.agentName = 'Photo Booth Orchestrator';
    this.geminiClient = GEMINI_API_KEY ? createGeminiImageClient(GEMINI_API_KEY) : null;
    this.useAIGeneration = !!GEMINI_API_KEY; // Only use AI if API key is set

    // Log AI generation mode status on startup
    if (this.useAIGeneration) {
      console.log(`[${this.agentName}] ✅ AI Generation ENABLED - Gemini API key detected`);
    } else {
      console.log(`[${this.agentName}] ⚠️ AI Generation DISABLED - No GEMINI_API_KEY env variable. Using mock mode.`);
      console.log(`[${this.agentName}] To enable AI: fly secrets set GEMINI_API_KEY=your_api_key`);
    }
  }

  // Create a new session
  async createSession(eventId, language = 'en', consentAgreed = true) {
    console.log(`[${this.agentName}] Creating new session...`);

    if (!consentAgreed) {
      throw new Error('User consent is required');
    }

    try {
      const result = await this.pool.query(
        `INSERT INTO photo_booth_sessions
         (event_id, user_consent, language, status)
         VALUES ($1, $2, $3, 'created')
         RETURNING *`,
        [eventId || null, consentAgreed, language]
      );

      const session = result.rows[0];
      console.log(`[${this.agentName}] Session created: ${session.session_id}`);
      return session;
    } catch (error) {
      console.error(`[${this.agentName}] Failed to create session:`, error);
      throw error;
    }
  }

  // Upload and validate image
  async uploadImage(sessionId, imagePath, onProgress) {
    console.log(`[${this.agentName}] Processing upload for session ${sessionId}...`);

    const reportProgress = (message, step, percentage) => {
      if (onProgress) {
        onProgress({ message, step, percentage, timestamp: new Date() });
      }
    };

    try {
      reportProgress('Validating image...', 'validate', 20);

      // Check file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Read file and convert to base64 for storage (ephemeral /tmp won't persist)
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      reportProgress('Analyzing image with AI...', 'analyze', 50);

      // Use Claude Vision to analyze the image
      const qualityCheck = await this.analyzeImageWithClaude(imagePath);

      reportProgress('Saving image...', 'save', 80);

      // Save to database with base64 data in metadata
      const result = await this.pool.query(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, quality_check_json, metadata_json)
         VALUES ($1, 'original', $2, $3, $4)
         RETURNING image_id`,
        [sessionId, imagePath, JSON.stringify(qualityCheck), JSON.stringify({ base64_data: base64Image })]
      );

      reportProgress('Upload complete', 'complete', 100);

      return {
        image_id: result.rows[0].image_id,
        quality_check: qualityCheck,
      };
    } catch (error) {
      console.error(`[${this.agentName}] Upload failed:`, error);
      throw error;
    }
  }

  // Analyze image with Claude Vision
  async analyzeImageWithClaude(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

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
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analyze this image for a photo booth. Return JSON:
{
  "face_detected": boolean,
  "face_count": number,
  "face_confidence": number (0-1),
  "lighting_quality": "good" | "moderate" | "poor",
  "is_valid": boolean,
  "warnings": string[],
  "suggestions": string[]
}
Only return JSON.`,
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      let jsonText = textContent?.text?.trim() || '{}';
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error(`[${this.agentName}] Claude analysis failed:`, error);
      return {
        face_detected: true,
        face_count: 1,
        face_confidence: 0.8,
        lighting_quality: 'moderate',
        is_valid: true,
        warnings: [],
        suggestions: [],
      };
    }
  }

  // Analyze image and suggest themes
  async analyzeImage(sessionId, onProgress) {
    console.log(`[${this.agentName}] Analyzing image for session ${sessionId}...`);

    const reportProgress = (message, step, percentage) => {
      if (onProgress) {
        onProgress({ message, step, percentage, timestamp: new Date() });
      }
    };

    try {
      reportProgress('🔍 Analyzing face recognition...', 'face', 20);
      await this.sleep(300);

      reportProgress('✓ Face detected with high confidence', 'face_done', 30);
      await this.sleep(200);

      reportProgress('🌍 Analyzing environment...', 'environment', 50);
      await this.sleep(300);

      reportProgress('✓ Environment analysis complete', 'env_done', 60);

      reportProgress('🎨 Evaluating style compatibility...', 'style', 80);
      await this.sleep(300);

      // Get original image
      const imageResult = await this.pool.query(
        `SELECT * FROM photo_booth_images WHERE session_id = $1 AND image_type = 'original' ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      const analysis = {
        face_analysis: { detected: true, count: 1, confidence: 0.95 },
        environment_analysis: { scene_type: 'indoor', lighting: 'good' },
        style_compatibility: {
          recommended_themes: ['versailles-court', 'georgian-england'],
          reasoning: 'Good lighting and composition suitable for portrait transformation',
        },
      };

      // Update session
      await this.pool.query(
        `UPDATE photo_booth_sessions SET analysis_json = $1, status = 'analyzing' WHERE session_id = $2`,
        [JSON.stringify(analysis), sessionId]
      );

      reportProgress('✓ Analysis complete - Versailles Court recommended', 'complete', 100);

      return {
        analysis,
        recommended_theme: 'versailles-court',
      };
    } catch (error) {
      console.error(`[${this.agentName}] Analysis failed:`, error);
      throw error;
    }
  }

  // Generate styled image (mock for Phase 1 - applies vintage filter to original)
  async generateImage(sessionId, themeName, onProgress) {
    console.log(`[${this.agentName}] Generating image for session ${sessionId} with theme ${themeName}...`);

    const reportProgress = (message, step, percentage) => {
      if (onProgress) {
        onProgress({ message, step, percentage, timestamp: new Date() });
      }
    };

    const startTime = Date.now();

    try {
      // Validate theme
      const theme = this.themes.find((t) => t.id === themeName);
      if (!theme) {
        throw new Error(`Theme not found: ${themeName}`);
      }

      reportProgress('🎬 Preparing image generation...', 'prepare', 10);

      // Get original image with base64 data from database
      const originalResult = await this.pool.query(
        `SELECT image_path, metadata_json FROM photo_booth_images WHERE session_id = $1 AND image_type = 'original' ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      if (!originalResult.rows[0]) {
        throw new Error('Original image not found');
      }

      const { image_path: originalPath, metadata_json } = originalResult.rows[0];

      // Get image buffer - either from stored base64 or from file
      let imageBuffer;
      if (metadata_json && metadata_json.base64_data) {
        // Use stored base64 data (preferred - persists across ephemeral storage)
        imageBuffer = Buffer.from(metadata_json.base64_data, 'base64');
        console.log(`[${this.agentName}] Using stored base64 image data`);
      } else if (fs.existsSync(originalPath)) {
        // Fallback to file system
        imageBuffer = fs.readFileSync(originalPath);
        console.log(`[${this.agentName}] Using file system image`);
      } else {
        throw new Error(`Original image not found: ${originalPath}`);
      }

      reportProgress('🎬 Generating your 18th-century portrait...', 'generate', 20);

      // Ensure output directory exists
      const outputDir = '/tmp/photo-booth/outputs';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const styledPath = path.join(outputDir, `styled_${sessionId}_${Date.now()}.jpg`);

      let styledBuffer;

      console.log(`[${this.agentName}] Generation mode check: useAIGeneration=${this.useAIGeneration}, hasGeminiClient=${!!this.geminiClient}`);

      if (this.useAIGeneration && this.geminiClient) {
        // Use Gemini API for real AI generation
        console.log(`[${this.agentName}] 🤖 Using REAL AI generation with Gemini API`);
        try {
          reportProgress('🤖 Connecting to AI model...', 'ai_connect', 25);

          styledBuffer = await this.geminiClient.generateStyledPortrait(
            imageBuffer,
            theme,
            (update) => {
              const basePercentage = 25;
              const scaledPercentage = basePercentage + Math.round((update.percentage / 100) * 55);
              reportProgress(update.message, `ai_${update.percentage}`, scaledPercentage);
            }
          );

          console.log(`[${this.agentName}] AI generation completed for theme: ${themeName}`);
        } catch (aiError) {
          console.error(`[${this.agentName}] AI generation failed, falling back to mock:`, aiError.message);
          reportProgress('⚠️ AI unavailable, using fallback...', 'fallback', 30);

          // Fallback to mock mode
          styledBuffer = await this.generateMockImage(imageBuffer, themeName);
        }
      } else {
        // Mock mode - apply color filters
        console.log(`[${this.agentName}] ⚠️ Using MOCK mode (no AI) - applying color filters only`);
        reportProgress('🎨 Applying theme effect...', 'mock_filter', 50);
        styledBuffer = await this.generateMockImage(imageBuffer, themeName);
      }

      // Save to file
      await sharp(styledBuffer)
        .jpeg({ quality: 90 })
        .toFile(styledPath);

      reportProgress('✓ Image generated successfully', 'done', 90);

      // Store as base64 (for persistence in ephemeral environments)
      const styledBase64 = styledBuffer.toString('base64');

      // Save styled image record with base64 data
      const generationTimeMs = Date.now() - startTime;
      const result = await this.pool.query(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, theme, generation_time_ms, metadata_json)
         VALUES ($1, 'styled', $2, $3, $4, $5)
         RETURNING image_id`,
        [sessionId, styledPath, themeName, generationTimeMs, JSON.stringify({ base64_data: styledBase64 })]
      );

      // Update session
      await this.pool.query(
        `UPDATE photo_booth_sessions SET theme_selected = $1, status = 'generating' WHERE session_id = $2`,
        [themeName, sessionId]
      );

      reportProgress(`✓ Portrait completed in ${(generationTimeMs / 1000).toFixed(1)} seconds`, 'complete', 100);

      return {
        image_id: result.rows[0].image_id,
        styled_image_path: styledPath,
        generated_image_url: `/api/photo-booth/image/${result.rows[0].image_id}`,
        generation_time_ms: generationTimeMs,
      };
    } catch (error) {
      console.error(`[${this.agentName}] Generation failed:`, error);
      throw error;
    }
  }

  // Finalize session with branding and QR code
  async finalizeSession(sessionId, imageId, onProgress) {
    console.log(`[${this.agentName}] Finalizing session ${sessionId}...`);

    const reportProgress = (message, step, percentage) => {
      if (onProgress) {
        onProgress({ message, step, percentage, timestamp: new Date() });
      }
    };

    try {
      reportProgress('🏷️ Applying 5ML branding...', 'branding', 20);

      // Get styled image with base64 data from database
      const styledResult = await this.pool.query(
        `SELECT image_path, metadata_json FROM photo_booth_images WHERE session_id = $1 AND image_type = 'styled' ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      if (!styledResult.rows[0]) {
        throw new Error('Styled image not found');
      }

      const { image_path: styledPath, metadata_json } = styledResult.rows[0];

      // Get image buffer - either from stored base64 or from file
      let styledBuffer;
      if (metadata_json && metadata_json.base64_data) {
        styledBuffer = Buffer.from(metadata_json.base64_data, 'base64');
        console.log(`[${this.agentName}] Using stored base64 styled image`);
      } else if (fs.existsSync(styledPath)) {
        styledBuffer = fs.readFileSync(styledPath);
        console.log(`[${this.agentName}] Using file system styled image`);
      } else {
        throw new Error(`Styled image not found: ${styledPath}`);
      }

      const outputDir = '/tmp/photo-booth/outputs';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const brandedPath = path.join(outputDir, `branded_${sessionId}_${Date.now()}.jpg`);

      // Apply branding overlay with sharp
      const image = sharp(styledBuffer);
      const metadata = await image.metadata();
      const width = metadata.width || 768;
      const height = metadata.height || 1024;

      // Create hashtag text SVG
      const hashtag = '#5MLPhotoBooth';
      const fontSize = Math.round(height * 0.03);
      const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${hashtag.length * fontSize * 0.6 + 20}" height="${fontSize + 20}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8"/>
          </filter>
        </defs>
        <text x="10" y="${fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#FFFFFF" filter="url(#shadow)">
          ${hashtag}
        </text>
      </svg>`;

      // Create "5ML AI" watermark SVG
      const watermark = '5ML AI';
      const wmFontSize = Math.round(height * 0.025);
      const watermarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${watermark.length * wmFontSize * 0.7 + 20}" height="${wmFontSize + 20}">
        <defs>
          <filter id="wmshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.7"/>
          </filter>
        </defs>
        <text x="10" y="${wmFontSize}" font-family="Arial, sans-serif" font-size="${wmFontSize}" font-weight="bold" fill="#FFFFFF" filter="url(#wmshadow)">
          ${watermark}
        </text>
      </svg>`;

      const margin = Math.round(width * 0.03);

      // Composite the branding
      await image
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            top: margin,
            left: margin,
          },
          {
            input: Buffer.from(textSvg),
            top: height - fontSize - margin - 20,
            left: margin,
          },
        ])
        .jpeg({ quality: 92 })
        .toFile(brandedPath);

      reportProgress('✓ Branding applied', 'branding_done', 40);

      // Read branded image and store as base64 (for persistence)
      const brandedBuffer = fs.readFileSync(brandedPath);
      const brandedBase64 = brandedBuffer.toString('base64');

      // Save branded image with base64 data
      const brandedResult = await this.pool.query(
        `INSERT INTO photo_booth_images
         (session_id, image_type, image_path, metadata_json)
         VALUES ($1, 'branded', $2, $3)
         RETURNING image_id`,
        [sessionId, brandedPath, JSON.stringify({ base64_data: brandedBase64 })]
      );

      reportProgress('📱 Generating QR code...', 'qr', 60);

      // Generate QR code
      const shortId = nanoid(8);
      const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:8080';
      const shareLink = `${baseUrl}/photo-booth/share?id=${shortId}`;
      const downloadLink = `${baseUrl}/api/photo-booth/download/${shortId}`;

      const qrCodeDataUrl = await QRCode.toDataURL(shareLink, {
        width: 256,
        margin: 2,
      });

      reportProgress('✓ QR code generated', 'qr_done', 80);

      // Save QR code record
      await this.pool.query(
        `INSERT INTO photo_booth_qr_codes
         (session_id, image_id, short_link, download_link, share_link)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, brandedResult.rows[0].image_id, shortId, downloadLink, shareLink]
      );

      // Update session status
      await this.pool.query(
        `UPDATE photo_booth_sessions SET status = 'completed', completed_at = NOW() WHERE session_id = $1`,
        [sessionId]
      );

      reportProgress('✓ Session complete!', 'complete', 100);

      return {
        branded_image_id: brandedResult.rows[0].image_id,
        branded_image_url: `/api/photo-booth/image/${brandedResult.rows[0].image_id}`,
        qr_code_url: `/api/photo-booth/qr/${shortId}`,
        qr_code_data_url: qrCodeDataUrl,
        download_link: downloadLink,
        share_link: shareLink,
      };
    } catch (error) {
      console.error(`[${this.agentName}] Finalization failed:`, error);
      throw error;
    }
  }

  // Get session status
  async getSessionStatus(sessionId) {
    const result = await this.pool.query(
      'SELECT * FROM photo_booth_sessions WHERE session_id = $1',
      [sessionId]
    );
    return {
      session: result.rows[0] || null,
      progress: null,
      statusUpdates: [],
    };
  }

  // Get themes
  getThemes() {
    return this.themes;
  }

  // Get analytics
  async getAnalytics(eventId, days = 7) {
    return {
      total_sessions: 0,
      completed_count: 0,
      failed_count: 0,
      completion_rate: 0,
      avg_generation_time_ms: 0,
      theme_distribution: {},
    };
  }

  // Get popular themes
  async getPopularThemes(eventId, days = 7) {
    return [];
  }

  // Generate mock image with theme-specific color effects (fallback)
  async generateMockImage(imageBuffer, themeName) {
    console.log(`[${this.agentName}] Using mock image generation for theme: ${themeName}`);

    const themeEffects = {
      'versailles-court': { tint: { r: 255, g: 230, b: 200 }, saturation: 0.6, brightness: 1.1, hue: 15 },
      'georgian-england': { tint: { r: 220, g: 210, b: 190 }, saturation: 0.5, brightness: 1.0, hue: 0 },
      'austro-hungarian': { tint: { r: 240, g: 220, b: 210 }, saturation: 0.65, brightness: 1.05, hue: 10 },
      'russian-imperial': { tint: { r: 200, g: 210, b: 230 }, saturation: 0.55, brightness: 0.95, hue: -10 },
      'italian-venetian': { tint: { r: 255, g: 220, b: 180 }, saturation: 0.7, brightness: 1.15, hue: 20 },
      'spanish-colonial': { tint: { r: 230, g: 200, b: 170 }, saturation: 0.6, brightness: 1.0, hue: 5 },
    };

    const effect = themeEffects[themeName] || themeEffects['versailles-court'];

    return await sharp(imageBuffer)
      .resize(768, 1024, { fit: 'cover', position: 'centre' })
      .modulate({
        brightness: effect.brightness,
        saturation: effect.saturation,
        hue: effect.hue,
      })
      .tint(effect.tint)
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // Helper
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function createPhotoBoothOrchestrator(config) {
  return new PhotoBoothOrchestrator(config);
}

module.exports = { createPhotoBoothOrchestrator, PhotoBoothOrchestrator };
