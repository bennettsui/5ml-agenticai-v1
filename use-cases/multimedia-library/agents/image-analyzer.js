// ImageAnalyzerAgent
// Reverse-engineers a Stable Diffusion / SDXL prompt from any uploaded image.
// Accepts: base64 data URI, remote URL, or path to a local file.
// Uses Claude Sonnet Vision to produce:
//  - A detailed visual description
//  - A structured SD/SDXL prompt (positive + negative)
//  - Style tokens for the prompt library
//  - Technical settings (resolution profile, sampler hints, LoRA hints)
//
// Model: Claude Sonnet (vision)

const { getClaudeModel } = require('../../../utils/modelHelper');
const fs = require('fs');
const path = require('path');

class ImageAnalyzerAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'ImageAnalyzerAgent';
  }

  // ── Main analysis entry point ─────────────────────────────────────────────
  async analyzeImage(imageInput, options = {}) {
    // imageInput: { type: 'url'|'base64'|'path', value: string }
    const { brandContext = null, targetChannel = null } = options;

    const systemPrompt = `You are a reverse-prompt engineering expert for Stable Diffusion / SDXL.
Given an image, your task is to:
1. Describe what you see in extreme detail (subject, style, composition, lighting, mood, colours, textures)
2. Reverse-engineer a high-quality SD/SDXL prompt that would reproduce this image
3. Extract reusable style tokens for the agency prompt library

Return ONLY JSON:
{
  "visualDescription": "string — comprehensive visual description (5-8 sentences)",
  "styleClassification": {
    "aesthetic": "string — e.g. 'cinematic photography', 'digital illustration', 'oil painting'",
    "medium": "string",
    "era": "string or null",
    "artisticMovement": "string or null"
  },
  "composition": {
    "framing": "string — e.g. 'close-up portrait', 'wide establishing shot'",
    "cameraAngle": "string",
    "depthOfField": "string",
    "ruleOfThirds": boolean
  },
  "lighting": {
    "type": "string — e.g. 'golden hour', 'studio softbox', 'neon rim'",
    "direction": "string",
    "quality": "string — hard/soft/diffused"
  },
  "colourPalette": {
    "dominant": ["string — colour names"],
    "accent": ["string"],
    "temperature": "warm|cool|neutral"
  },
  "mood": "string",
  "reversedPrompt": {
    "positive": "string — full SDXL positive prompt",
    "negative": "string — standard SDXL negative prompt",
    "styleTokens": ["string — short reusable tags"],
    "loraHints": ["string — LoRA keywords that match this style"],
    "modelRecommendation": "sd15|sdxl|sdxl_turbo",
    "samplerHint": "string",
    "cfgHint": number,
    "stepsHint": number,
    "resolutionProfile": "preview|sd15|sdxl|sdxlWide|portrait916|landscape43"
  },
  "channelAdaptations": {
    "instagram_post": "string — how to adapt this prompt for 1:1",
    "instagram_story": "string — 9:16 adaptations",
    "tiktok": "string",
    "key_visual": "string"
  },
  "brandCompatibility": "string — notes on how this style could be adapted for brand work",
  "reproductionNotes": "string — caveats or tricky elements to watch out for when reproducing"
}`;

    const imageContent = this._buildImageContent(imageInput);
    if (!imageContent) throw new Error('Invalid image input');

    const channelNote = targetChannel ? `\nTarget channel: ${targetChannel}` : '';
    const brandNote = brandContext ? `\nBrand context: ${JSON.stringify(brandContext)}` : '';

    try {
      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('sonnet'),
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: `Reverse-engineer this image into a prompt template.${channelNote}${brandNote}` },
          ],
        }],
      });

      const cleaned = resp.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error(`[${this.name}] Analysis failed:`, err.message);
      throw err;
    }
  }

  // ── Build Anthropic image content block ───────────────────────────────────
  _buildImageContent(imageInput) {
    if (!imageInput) return null;

    if (imageInput.type === 'url') {
      return { type: 'image', source: { type: 'url', url: imageInput.value } };
    }

    if (imageInput.type === 'base64') {
      // Strip data URI prefix if present
      let data = imageInput.value;
      let mediaType = 'image/png';
      if (data.startsWith('data:')) {
        const match = data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          mediaType = match[1];
          data = match[2];
        }
      }
      return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
    }

    if (imageInput.type === 'path') {
      const buf = fs.readFileSync(imageInput.value);
      const data = buf.toString('base64');
      const ext = path.extname(imageInput.value).toLowerCase();
      const mediaType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : 'image/png';
      return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
    }

    return null;
  }

  // ── Style comparison: how similar is image A to image B? ─────────────────
  async compareStyles(analysisA, analysisB) {
    const systemPrompt = `Compare these two image style analyses and rate their visual similarity.
Return JSON: { "overallSimilarity": number (0-10), "matchingAspects": ["string"], "differingAspects": ["string"], "promptMergeStrategy": "string" }`;

    try {
      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('haiku'),
        max_tokens: 512,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Analysis A:\n${JSON.stringify(analysisA, null, 2)}\n\nAnalysis B:\n${JSON.stringify(analysisB, null, 2)}`,
        }],
      });
      const cleaned = resp.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      return { overallSimilarity: null, matchingAspects: [], differingAspects: [], promptMergeStrategy: `Error: ${err.message}` };
    }
  }
}

module.exports = ImageAnalyzerAgent;
