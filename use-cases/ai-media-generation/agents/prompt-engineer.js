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
    const systemPrompt = `You are a Stable Diffusion / SDXL prompt engineer AND an advertising copywriter for an AI creative agency.
Build high-quality image generation prompts AND ad copy for each deliverable.

Image prompt rules:
  POSITIVE: [subject], [style/medium], [camera/framing], [lighting], [mood], [post-processing tags]
  NEGATIVE: [artifacts to avoid], [brand-excluded elements], [quality failures]
- SDXL responds best to natural descriptive language, not comma-separated keyword dumps.
- Include quality boosters: "highly detailed, sharp focus, 8k, professional photography" only when appropriate.
- Lighting vocabulary: "golden hour", "studio softbox", "neon rim light", "overcast diffused".
- Camera vocabulary: "shot on Sony A7R IV", "35mm lens", "shallow depth of field", "bird's eye view".
- Negative prompt must always include: "worst quality, low quality, blurry, deformed, watermark, text, signature".

Ad copy rules:
- headline: short punchy headline (max 8 words) matching the brand tone from the spec.
- tagline: optional brand tagline or sub-headline (max 12 words).
- cta: call-to-action text (e.g. "Shop Now", "Learn More", "Book Today").
- bodyText: 1–2 sentence ad body copy (max 30 words) that supports the headline.

Return ONLY JSON — no explanation, no markdown.

Schema:
{
  "positive": "string",
  "negative": "string",
  "styleTokens": ["string — short reusable tags for this style"],
  "suggestedSampler": "string",
  "suggestedCfg": number,
  "suggestedSteps": number,
  "headline": "string",
  "tagline": "string",
  "cta": "string",
  "bodyText": "string",
  "notes": "string"
}`;

    const userContent = `Generate an image prompt for this deliverable spec:\n${JSON.stringify(spec, null, 2)}`;
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
