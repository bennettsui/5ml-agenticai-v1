// PromptEngineerAgent
// Stage 2: Takes the structured brief spec and generates optimised prompts
// for SD/SDXL image generation and AnimateDiff/SVD video generation.
// Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class PromptEngineerAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'PromptEngineerAgent';
  }

  // ── Image prompt ──────────────────────────────────────────────────────────
  async buildImagePrompt(spec) {
    const systemPrompt = `You are a Stable Diffusion / SDXL prompt engineer for an AI creative agency.
Build high-quality prompts following this structure:
  POSITIVE: [subject], [style/medium], [camera/framing], [lighting], [mood], [post-processing tags]
  NEGATIVE: [artifacts to avoid], [brand-excluded elements], [quality failures]

Rules:
- SDXL responds best to natural descriptive language, not comma-separated keyword dumps.
- Include quality boosters: "highly detailed, sharp focus, 8k, professional photography" only when appropriate to the style.
- Lighting vocabulary: "golden hour", "studio softbox", "neon rim light", "overcast diffused".
- Camera vocabulary: "shot on Sony A7R IV", "35mm lens", "shallow depth of field", "bird's eye view".
- Negative prompt must always include: "worst quality, low quality, blurry, deformed, watermark, text, signature".
- Return ONLY JSON — no explanation, no markdown.

Schema:
{
  "positive": "string — detailed visual description for image generation",
  "negative": "string — artifacts and elements to avoid",
  "headline": "string (optional) — short headline/title to overlay on image (max 10 words)",
  "ctaCopy": "string (optional) — call-to-action text for image (max 5 words, e.g. 'Learn More', 'Shop Now', 'Discover')",
  "styleTokens": ["string — short reusable tags for this style"],
  "suggestedSampler": "string",
  "suggestedCfg": number,
  "suggestedSteps": number,
  "notes": "string"
}`;

    const userContent = `Generate an image prompt for this deliverable spec:\n${JSON.stringify(spec, null, 2)}

IMPORTANT: If the spec includes headline, tagline, or call-to-action copy, generate appropriate "headline" and "ctaCopy" values (optional fields).
Headline should be short enough to fit on the generated image.
CTA copy should be a brief action phrase.`;
    return await this._callLLM(systemPrompt, userContent);
  }

  // ── Video prompt ──────────────────────────────────────────────────────────
  async buildVideoPrompt(spec, imagePrompt) {
    const systemPrompt = `You are an AnimateDiff / Stable Video Diffusion prompt engineer.
Build prompts that drive coherent AI video generation from still-image seeds.

Video prompt rules:
- Start from the accepted image prompt; add MOTION keywords at the end.
- Motion vocabulary: "slow dolly in", "gentle pan left", "handheld slight shake",
  "subtle breathing motion", "camera pull back", "parallax depth", "particles floating",
  "hair gently moving", "fabric rippling in breeze".
- Keep motion SUBTLE for brand/product work; stronger for social content hooks.
- First-frame consistency: describe the opening frame clearly so AnimateDiff knows what to anchor.
- Negative prompt must add: "sudden jump cut, strobe, morphing faces, body distortion, flickering".
- Return ONLY JSON — no explanation, no markdown.

Schema:
{
  "positive": "string",
  "negative": "string",
  "motionKeywords": ["string"],
  "recommendedMotionStrength": number,
  "recommendedFrames": number,
  "recommendedFps": number,
  "firstFrameDescription": "string",
  "notes": "string"
}`;

    const userContent = `Generate a video prompt for this deliverable spec.\nBase image prompt: ${imagePrompt?.positive || 'N/A'}\nSpec:\n${JSON.stringify(spec, null, 2)}`;
    return await this._callLLM(systemPrompt, userContent);
  }

  // ── Prompt library entry ──────────────────────────────────────────────────
  async buildPromptLibraryEntry(projectCode, deliverable, imagePrompt, videoPrompt) {
    return {
      id: `${projectCode}_${deliverable.type}_${Date.now()}`,
      projectCode,
      deliverableType: deliverable.type,
      format: deliverable.format,
      version: 'v1.0',
      image: imagePrompt,
      video: videoPrompt,
      createdAt: new Date().toISOString(),
      status: 'draft', // draft → approved → archived
    };
  }

  // ─── Internal LLM call ────────────────────────────────────────────────────
  async _callLLM(systemPrompt, userContent) {
    const messages = [{ role: 'user', content: userContent }];
    let rawJson;
    if (shouldUseDeepSeek('deepseek')) {
      const resp = await deepseekService.chat([
        { role: 'system', content: systemPrompt },
        ...messages,
      ]);
      rawJson = resp.content;
    } else {
      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('haiku'),
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });
      rawJson = resp.content[0].text;
    }
    const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }
}

module.exports = PromptEngineerAgent;
