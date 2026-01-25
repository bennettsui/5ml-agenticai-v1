// Gemini Image Generation Client
// Uses Google's Gemini API for AI-powered image generation and editing

const fetch = require('node-fetch');

class GeminiImageClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    // Use gemini-2.0-flash-exp for image generation with multimodal input
    this.model = 'gemini-2.0-flash-exp';
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
              responseModalities: ['image', 'text'],
              responseMimeType: 'image/jpeg',
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
          partTypes: data.candidates[0].content?.parts?.map(p =>
            p.inline_data ? `inline_data(${p.inline_data.mime_type})` : p.text ? 'text' : 'unknown'
          )
        } : null,
        promptFeedback: data.promptFeedback,
        error: data.error
      }, null, 2));

      // Check for API errors
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Extract the generated image from the response
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inline_data && part.inline_data.data) {
            reportProgress('✓ Image generated successfully!', 90);
            console.log('[GeminiImageClient] Successfully extracted image from response');
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
    const themePrompts = {
      'versailles-court': `Transform this person into an 18th-century French aristocrat portrait in the style of the Versailles Court.
        - Dress them in elaborate French baroque clothing: silk brocade coat, lace cravat, powdered wig
        - Background: Opulent palace interior with gilded mirrors, chandeliers, and damask walls
        - Style: Formal portrait painting style reminiscent of Hyacinthe Rigaud
        - Keep the person's face and features recognizable
        - Lighting: Soft, warm candlelight ambiance
        - Colors: Rich golds, deep blues, and burgundy`,

      'georgian-england': `Transform this person into an 18th-century English Georgian era aristocrat portrait.
        - Dress them in refined English fashion: tailored wool coat, white cravat, subtle powdered wig
        - Background: English manor library or garden with classical architecture
        - Style: Portrait painting style reminiscent of Thomas Gainsborough or Joshua Reynolds
        - Keep the person's face and features recognizable
        - Lighting: Natural daylight, soft and flattering
        - Colors: Muted greens, browns, cream, and soft blues`,

      'austro-hungarian': `Transform this person into an 18th-century Austro-Hungarian nobility portrait.
        - Dress them in Habsburg court fashion: military-inspired coat with gold braiding, medals, ornate embroidery
        - Background: Imperial palace with baroque architecture, red velvet drapes
        - Style: Formal court portrait style reminiscent of Martin van Meytens
        - Keep the person's face and features recognizable
        - Lighting: Dramatic, regal lighting
        - Colors: Deep reds, imperial gold, black, and white`,

      'russian-imperial': `Transform this person into an 18th-century Russian Imperial Court portrait.
        - Dress them in Russian imperial fashion: heavy brocade coat with fur trim, jeweled decorations, elaborate collar
        - Background: Winter Palace interior with marble columns and crystal chandeliers
        - Style: Formal portrait style reminiscent of Dmitry Levitzky
        - Keep the person's face and features recognizable
        - Lighting: Cool, majestic lighting with warm accents
        - Colors: Rich blues, silver, white, and gold accents`,

      'italian-venetian': `Transform this person into an 18th-century Venetian nobility portrait.
        - Dress them in Venetian carnival fashion: ornate mask nearby, silk doublet, rich velvet cape
        - Background: Venetian palazzo with canal view, ornate mirrors, and carnival decorations
        - Style: Portrait style reminiscent of Pietro Longhi or Rosalba Carriera
        - Keep the person's face and features recognizable
        - Lighting: Warm, golden Mediterranean light
        - Colors: Vibrant reds, golds, deep greens, and rich purples`,

      'spanish-colonial': `Transform this person into an 18th-century Spanish Colonial nobility portrait.
        - Dress them in Spanish colonial fashion: dark velvet coat with silver embroidery, white ruffled shirt, medallion
        - Background: Colonial hacienda with Spanish colonial architecture, courtyard with fountain
        - Style: Portrait style reminiscent of colonial Spanish painters
        - Keep the person's face and features recognizable
        - Lighting: Warm, sun-drenched lighting with dramatic shadows
        - Colors: Deep blacks, rich burgundy, gold, and cream`,
    };

    const basePrompt = themePrompts[theme.id] || themePrompts['versailles-court'];

    return `${basePrompt}

IMPORTANT INSTRUCTIONS:
- This is a portrait transformation. Keep the person's face, expression, and identity clearly recognizable.
- Generate a high-quality, realistic portrait image.
- The output should look like a professional 18th-century oil painting portrait.
- Ensure the costume and background match the specified historical era and region.
- The image should be suitable for printing and sharing.`;
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
