// Gemini Image Generation Client
// Uses Google's Gemini API for AI-powered image generation and editing

const fetch = require('node-fetch');

class GeminiImageClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    // Use gemini-2.0-flash-exp for native image generation (aka "nanobanana")
    // This model supports both image input and image output
    this.model = 'gemini-2.0-flash-exp';
    console.log('[GeminiImageClient] Initialized with model:', this.model, '(nanobanana)');
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
    // Theme-specific prompts - each is self-contained
    const themePrompts = {
      'mona-lisa': `Edit this photo to transform the person into a Renaissance portrait in the style of Leonardo da Vinci's "Mona Lisa".

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features, expression, and likeness.

Style requirements:
- Renaissance oil painting with subtle sfumato shading
- Warm earthy color palette with soft diffused lighting
- Half-length figure with slightly turned body and front-facing gaze
- Simple dark Renaissance dress with gentle folds
- Soft atmospheric landscape background with winding paths and distant mountains
- Calm, enigmatic expression
- No modern objects, no text
- High resolution, masterpiece quality`,

      'ghibli-style': `Edit this photo to transform the person into a Studio Ghibli anime character.

IMPORTANT: You MUST use the person's face from the input photo. Keep their facial features recognizable but stylized in anime form.

Style requirements:
- High-quality anime-style portrait as a character in a Studio Ghibli film
- Kind, peaceful expression with clean hand-drawn line art
- Soft watercolor-style shading
- Lush, vibrant Ghibli-inspired landscape background featuring:
  - A massive, ancient glowing tree with hanging lanterns
  - Rolling green hills
  - A small European-style village with windmills
  - Airships floating in a bright blue sky with fluffy white clouds
- Warm, nostalgic lighting
- Magical whimsical atmosphere like 'My Neighbor Totoro' or 'Howl's Moving Castle'`,

      'versailles-court': `Edit this photo to transform the person into an 18th-century French aristocrat portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Renaissance/Baroque oil painting style
- Elaborate French baroque clothing: silk brocade coat with gold embroidery, lace cravat
- Powdered wig if appropriate for the subject
- Opulent palace interior background with gilded mirrors and chandeliers
- Warm candlelight ambiance
- Rich golds, deep blues, and burgundy colors
- Formal portrait composition`,

      'georgian-england': `Edit this photo to transform the person into an 18th-century English Georgian aristocrat portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Portrait painting style reminiscent of Thomas Gainsborough
- Refined English fashion: tailored wool coat, white cravat
- Subtle powdered styling
- English manor library or garden background
- Natural daylight, soft and flattering
- Muted greens, browns, cream, and soft blues`,

      'austro-hungarian': `Edit this photo to transform the person into an 18th-century Austro-Hungarian nobility portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Formal court portrait style
- Habsburg court fashion: military-inspired coat with gold braiding and medals
- Imperial palace background with baroque architecture
- Dramatic, regal lighting
- Deep reds, imperial gold, black, and white`,

      'russian-imperial': `Edit this photo to transform the person into an 18th-century Russian Imperial Court portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Formal portrait style
- Russian imperial fashion: heavy brocade coat with fur trim, jeweled decorations
- Winter Palace interior background with marble columns
- Cool, majestic lighting with warm accents
- Rich blues, silver, white, and gold accents`,

      'italian-venetian': `Edit this photo to transform the person into an 18th-century Venetian nobility portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Portrait style reminiscent of Pietro Longhi
- Venetian Renaissance fashion: rich velvet and silk, ornate patterns
- Venetian palazzo background with canal view
- Warm, golden Mediterranean light
- Vibrant reds, golds, deep greens, and rich purples`,

      'spanish-colonial': `Edit this photo to transform the person into an 18th-century Spanish Colonial nobility portrait.

IMPORTANT: You MUST use the person's face from the input photo. Keep their exact facial features and likeness.

Style requirements:
- Colonial Spanish portrait style
- Spanish colonial fashion: dark velvet coat with silver embroidery, white ruffled shirt
- Colonial hacienda background with courtyard
- Warm, sun-drenched lighting with dramatic shadows
- Deep blacks, rich burgundy, gold, and cream`,
    };

    return themePrompts[theme.id] || themePrompts['mona-lisa'];
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
