// Gemini Image Generation Client
// Uses Google's Gemini API for AI-powered image generation and editing

const fetch = require('node-fetch');

class GeminiImageClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    // Use gemini-2.0-flash-preview-image-generation for image generation with multimodal input
    // Alternative: 'gemini-2.0-flash-exp' also works
    this.model = 'gemini-2.0-flash-preview-image-generation';
    console.log('[GeminiImageClient] Initialized with model:', this.model);
  }

  /**
   * Generate a styled portrait from an input image
   * @param {Buffer} imageBuffer - The original image as a buffer
   * @param {Object} theme - The theme configuration
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Buffer>} - The generated image as a buffer
   */
  async generateStyledPortrait(imageBuffer, theme, onProgress) {
    const reportProgress = (message, percentage) => {
      if (onProgress) onProgress({ message, percentage });
    };

    reportProgress('🎨 Preparing AI generation...', 10);

    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');

    // Build the prompt based on theme
    const prompt = this.buildThemePrompt(theme);

    reportProgress('🎬 Sending to AI model...', 20);

    try {
      // Use Gemini's generateContent with image input for transformation
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Image,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              // Must include TEXT - image-only output is not supported
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      reportProgress('🖼️ Processing response...', 70);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      // Log response structure for debugging
      console.log('[GeminiImageClient] Response structure:', JSON.stringify({
        hasCandidates: !!data.candidates,
        candidateCount: data.candidates?.length,
        firstCandidate: data.candidates?.[0] ? {
          hasContent: !!data.candidates[0].content,
          partsCount: data.candidates[0].content?.parts?.length,
          partTypes: data.candidates[0].content?.parts?.map(p => {
            if (p.inlineData) return `inlineData(${p.inlineData.mimeType || p.inlineData.mime_type})`;
            if (p.inline_data) return `inline_data(${p.inline_data.mime_type})`;
            if (p.text) return 'text';
            return 'unknown';
          })
        } : null,
        promptFeedback: data.promptFeedback,
        error: data.error
      }, null, 2));

      // Check for API errors
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Extract the generated image from the response
      // Handle both snake_case (REST API) and camelCase (SDK) formats
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          // Check for inlineData (camelCase - SDK format)
          if (part.inlineData && part.inlineData.data) {
            reportProgress('✓ Image generated successfully!', 90);
            console.log('[GeminiImageClient] Successfully extracted image from response (inlineData format)');
            return Buffer.from(part.inlineData.data, 'base64');
          }
          // Check for inline_data (snake_case - REST API format)
          if (part.inline_data && part.inline_data.data) {
            reportProgress('✓ Image generated successfully!', 90);
            console.log('[GeminiImageClient] Successfully extracted image from response (inline_data format)');
            return Buffer.from(part.inline_data.data, 'base64');
          }
        }
      }

      // Log what we got if no image found
      console.error('[GeminiImageClient] No image in response. Full response:', JSON.stringify(data, null, 2).slice(0, 2000));
      throw new Error('No image generated in response - check API response format');
    } catch (error) {
      console.error('Gemini image generation failed:', error);
      throw error;
    }
  }

  /**
   * Build a detailed prompt for the theme
   */
  buildThemePrompt(theme) {
    // Base Renaissance portrait style prompt - works for all themes
    const baseStyle = `Use this photo as the base.
Portrait in the style of Leonardo da Vinci's "Mona Lisa", Renaissance oil painting, half-length figure seated in front of a soft atmospheric landscape, subtle sfumato shading, warm earthy color palette, soft diffused lighting, calm enigmatic smile, slightly turned body and front-facing gaze, detailed realistic skin texture, gentle folds in clothing, classic Renaissance composition, no modern objects, no text, high resolution, masterpiece, ultra detailed.`;

    // Theme-specific costume and background additions
    const themeAdditions = {
      'versailles-court': `
Dress the subject in elaborate French baroque clothing: silk brocade coat with gold embroidery, lace cravat, powdered wig if appropriate.
Background should hint at opulent palace interior with gilded elements visible in the atmospheric distance.`,

      'georgian-england': `
Dress the subject in refined English Georgian fashion: tailored wool coat, white cravat, subtle styling.
Background should show soft English countryside or manor garden in the atmospheric distance.`,

      'austro-hungarian': `
Dress the subject in Habsburg court fashion: military-inspired coat with gold braiding and medals.
Background should hint at imperial palace architecture in the atmospheric distance.`,

      'russian-imperial': `
Dress the subject in Russian imperial fashion: heavy brocade with fur trim, jeweled decorations.
Background should show palatial marble columns in the atmospheric distance.`,

      'italian-venetian': `
Dress the subject in Venetian Renaissance fashion: rich velvet and silk, ornate patterns.
Background should show Venetian canal and palazzo in the soft atmospheric distance.`,

      'spanish-colonial': `
Dress the subject in Spanish colonial fashion: dark velvet coat with silver embroidery, white ruffled shirt.
Background should show colonial architecture and courtyard in the atmospheric distance.`,
    };

    const themeAddition = themeAdditions[theme.id] || themeAdditions['versailles-court'];

    return `${baseStyle}
${themeAddition}

CRITICAL: Keep the person's face, expression, and identity clearly recognizable. The face must look like the original person.`;
  }

  /**
   * Generate image using Imagen model (alternative method)
   */
  async generateWithImagen(prompt, options = {}) {
    const { aspectRatio = '3:4', numberOfImages = 1 } = options;

    try {
      const response = await fetch(
        `${this.baseUrl}/models/imagen-3.0-generate-002:predict?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: numberOfImages,
              aspectRatio,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Imagen API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
        return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
      }

      throw new Error('No image in Imagen response');
    } catch (error) {
      console.error('Imagen generation failed:', error);
      throw error;
    }
  }
}

function createGeminiImageClient(apiKey) {
  return new GeminiImageClient(apiKey);
}

module.exports = { createGeminiImageClient, GeminiImageClient };
