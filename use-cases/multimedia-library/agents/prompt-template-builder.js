// PromptTemplateBuilderAgent
// Takes image/video analysis results and builds reusable prompt templates
// that the team can apply to other brands, projects, and topics.
//
// A prompt template is a parameterised base prompt with:
//  - Fixed style tokens (aesthetic, lighting, camera)
//  - Slot variables: {subject}, {brand_colour}, {mood}, {product}
//  - Channel variants (1:1, 9:16, 16:9)
//  - Example filled-in prompts for reference
//  - Generation settings (sampler, CFG, steps, resolution)
//
// Model: DeepSeek Reasoner

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class PromptTemplateBuilderAgent {
  constructor(anthropic, pool) {
    this.anthropic = anthropic;
    this.pool = pool;
    this.name = 'PromptTemplateBuilderAgent';
  }

  // ── Build template from image analysis ────────────────────────────────────
  async buildFromImageAnalysis(imageAnalysis, options = {}) {
    const { templateName, tags = [], applicableBrands = [] } = options;

    const systemPrompt = `You are a prompt template architect for an AI creative agency.
Given an image analysis (style, composition, lighting, reversed prompt), create a REUSABLE prompt template.
A template has fixed style tokens + placeholder variables in {curly_braces}.

Standard variables available:
  {subject} — main subject of the image
  {brand_colour} — primary brand colour description
  {product} — product name or type
  {setting} — location or background
  {mood} — emotional tone
  {season} — time of year
  {ethnicity_appearance} — character appearance description

Return ONLY JSON:
{
  "templateId": "string — auto-generated slug",
  "name": "string",
  "description": "string — one sentence",
  "category": "portrait|product|landscape|abstract|lifestyle|editorial",
  "sourceType": "image",
  "basePositive": "string — template with {variables} for the style parts",
  "subjectSlot": "string — how to fill in the {subject} placeholder",
  "negativeBase": "string — negative prompt (usually fixed)",
  "styleTokens": ["string"],
  "channelVariants": {
    "instagram_post": "string — 1:1 compositional note",
    "instagram_story": "string — 9:16 compositional note",
    "tiktok": "string",
    "key_visual": "string",
    "youtube_shorts": "string"
  },
  "generationSettings": {
    "modelRecommendation": "sd15|sdxl",
    "sampler": "string",
    "cfgScale": number,
    "steps": number,
    "resolutionProfile": "string"
  },
  "loraRecommendations": ["string — LoRA names that match this style"],
  "exampleFilledPrompts": [
    { "scenario": "string", "filled": "string" }
  ],
  "usageNotes": "string — when to use this template, what it works well for",
  "limitations": "string — what this template struggles with"
}`;

    const userContent = `Image analysis:\n${JSON.stringify(imageAnalysis, null, 2)}\n\nTemplate name hint: ${templateName || 'Auto-generate'}`;

    try {
      const template = await this._callLLM(systemPrompt, userContent);
      if (templateName) template.name = templateName;
      template.tags = tags;
      template.applicableBrands = applicableBrands;
      template.createdAt = new Date().toISOString();
      template.version = 'v1.0';

      // Persist
      await this._saveTemplate(template);
      return template;
    } catch (err) {
      console.error(`[${this.name}] Template build from image failed:`, err.message);
      throw err;
    }
  }

  // ── Build template from video analysis ────────────────────────────────────
  async buildFromVideoAnalysis(videoAnalysis, options = {}) {
    const { templateName, tags = [] } = options;

    const systemPrompt = `You are a video prompt template architect.
Given a video style analysis, create a reusable AnimateDiff / SVD prompt template.

Return ONLY JSON:
{
  "templateId": "string",
  "name": "string",
  "description": "string",
  "category": "brand_video|social_hook|product_showcase|lifestyle|explainer|abstract",
  "sourceType": "video",
  "baseImagePrompt": "string — the image generation prompt for the first frame (with {variables})",
  "motionPromptTemplate": "string — motion/animation additions (with {variables})",
  "motionTokens": ["string — fixed motion keywords"],
  "subjectSlot": "string",
  "negativeBase": "string",
  "styleTokens": ["string"],
  "generationSettings": {
    "pipeline": "animatediff|svd|both",
    "motionStrength": number,
    "frames": number,
    "fps": number,
    "motionBucketId": "number (SVD only)"
  },
  "channelVariants": {
    "instagram_story": "string",
    "tiktok": "string",
    "youtube_shorts": "string",
    "instagram_post_loop": "string"
  },
  "exampleFilledPrompts": [
    { "scenario": "string", "imagePrompt": "string", "motionPrompt": "string" }
  ],
  "usageNotes": "string",
  "limitations": "string"
}`;

    const userContent = `Video analysis:\n${JSON.stringify(videoAnalysis, null, 2)}\n\nTemplate name hint: ${templateName || 'Auto-generate'}`;

    try {
      const template = await this._callLLM(systemPrompt, userContent);
      if (templateName) template.name = templateName;
      template.tags = tags;
      template.createdAt = new Date().toISOString();
      template.version = 'v1.0';

      await this._saveTemplate(template);
      return template;
    } catch (err) {
      console.error(`[${this.name}] Template build from video failed:`, err.message);
      throw err;
    }
  }

  // ── List/search templates ─────────────────────────────────────────────────
  async listTemplates({ category, sourceType, search, limit = 50 } = {}) {
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push(`template_json->>'category' = $${params.length + 1}`);
      params.push(category);
    }
    if (sourceType) {
      conditions.push(`template_json->>'sourceType' = $${params.length + 1}`);
      params.push(sourceType);
    }
    if (search) {
      conditions.push(`(template_json->>'name' ILIKE $${params.length + 1} OR template_json->>'description' ILIKE $${params.length + 1})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT * FROM media_prompt_templates ${where} ORDER BY created_at DESC LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    return result.rows;
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────
  async _callLLM(systemPrompt, userContent) {
    const messages = [{ role: 'user', content: userContent }];
    let rawJson;
    if (shouldUseDeepSeek('deepseek')) {
      const resp = await deepseekService.chat([{ role: 'system', content: systemPrompt }, ...messages]);
      rawJson = resp.content;
    } else {
      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('haiku'),
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });
      rawJson = resp.content[0].text;
    }
    const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  async _saveTemplate(template) {
    try {
      await this.pool.query(
        `INSERT INTO media_prompt_templates
           (template_id, name, category, source_type, template_json, tags, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (template_id)
         DO UPDATE SET template_json = $5, updated_at = NOW()`,
        [
          template.templateId || `tpl_${Date.now()}`,
          template.name,
          template.category,
          template.sourceType,
          JSON.stringify(template),
          JSON.stringify(template.tags || []),
        ]
      );
    } catch (err) {
      console.warn(`[${this.name}] Template save failed (table may not exist yet):`, err.message);
    }
  }
}

module.exports = PromptTemplateBuilderAgent;
