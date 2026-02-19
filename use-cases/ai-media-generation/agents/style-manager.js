// StyleManagerAgent
// Manages brand consistency, LoRA selection, and style tokens across a project.
// Maintains a per-project style registry so all assets stay visually coherent.
// Model: Claude Haiku (fast classification / tagging)

const { getClaudeModel } = require('../../../utils/modelHelper');

class StyleManagerAgent {
  constructor(anthropic, pool) {
    this.anthropic = anthropic;
    this.pool = pool;
    this.name = 'StyleManagerAgent';
  }

  // ── Build a style guide from the brief spec ───────────────────────────────
  async buildStyleGuide(projectId, briefSpec) {
    const { brand, style, technicalConstraints } = briefSpec;

    const systemPrompt = `You are a brand-consistency director for an AI image/video generation agency.
Given brand info and style notes, produce a concise style guide that AI operators can paste into every prompt.
Return ONLY JSON:
{
  "styleTokenBlock": "string — 20-40 words to append to every positive prompt",
  "negativeAdditions": "string — extra negative prompt tokens for brand exclusions",
  "colorGuidance": "string — how to encode the palette in prompts",
  "lightingSetup": "string",
  "moodKeywords": ["string"],
  "loraRecommendations": [
    { "loraName": "string", "weight": number, "purpose": "string" }
  ],
  "channelAdaptations": {
    "instagram_post": "string — what to adjust for 1:1",
    "instagram_story": "string — 9:16 adjustments",
    "tiktok": "string",
    "youtube_shorts": "string",
    "key_visual": "string"
  },
  "consistencyNotes": "string"
}`;

    const userContent = `Brand: ${JSON.stringify(brand)}\nStyle: ${JSON.stringify(style)}\nConstraints: ${JSON.stringify(technicalConstraints)}`;

    try {
      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('haiku'),
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });
      const cleaned = resp.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const guide = JSON.parse(cleaned);

      // Persist to DB
      await this.pool.query(
        `INSERT INTO media_style_guides
           (project_id, guide_json, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (project_id)
         DO UPDATE SET guide_json = $2, updated_at = NOW()`,
        [projectId, JSON.stringify(guide)]
      );

      return guide;
    } catch (err) {
      console.error(`[${this.name}] Style guide generation failed:`, err.message);
      return {
        styleTokenBlock: `${brand.adjectives?.join(', ') || ''}, professional, brand-consistent`,
        negativeAdditions: brand.avoidList?.join(', ') || '',
        colorGuidance: brand.palette?.join(' and ') || 'neutral tones',
        lightingSetup: style.lighting || 'natural light',
        moodKeywords: [style.mood || 'neutral'],
        loraRecommendations: [],
        channelAdaptations: {},
        consistencyNotes: `Auto-fallback. Error: ${err.message}`,
      };
    }
  }

  // ── Get existing style guide for a project ────────────────────────────────
  async getStyleGuide(projectId) {
    const result = await this.pool.query(
      'SELECT guide_json FROM media_style_guides WHERE project_id = $1',
      [projectId]
    );
    return result.rows[0]?.guide_json || null;
  }

  // ── Apply style guide tokens to a prompt ──────────────────────────────────
  applyStyleGuide(prompt, styleGuide, channel) {
    if (!styleGuide) return prompt;
    const channelAdaptation = styleGuide.channelAdaptations?.[channel] || '';
    return [
      prompt.positive,
      styleGuide.styleTokenBlock,
      channelAdaptation,
    ].filter(Boolean).join(', ');
  }
}

module.exports = StyleManagerAgent;
