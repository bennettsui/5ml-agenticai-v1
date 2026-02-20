// BriefTranslatorAgent
// Stage 1: Takes a raw creative brief (text) and extracts a structured
// prompt specification the downstream agents can act on.
// Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class BriefTranslatorAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'BriefTranslatorAgent';
  }

  async translate(brief) {
    const systemPrompt = `You are a creative brief analyst for an AI media generation agency.
Your task is to parse a client creative brief and extract a STRICT JSON structure.
The agency produces: social content (IG/TikTok/Shorts), brand visuals, product videos, and campaign assets.

Return ONLY valid JSON — no markdown, no explanation — matching this schema exactly:
{
  "projectName": "string",
  "client": "string",
  "deliverables": [
    {
      "type": "image|video",
      "format": "instagram_post|instagram_story|tiktok|youtube_shorts|key_visual|moodboard|product_video|explainer|storyboard_frame",
      "quantity": number,
      "aspectRatio": "1:1|9:16|16:9|4:3",
      "purpose": "string — one sentence"
    }
  ],
  "brand": {
    "name": "string",
    "palette": ["hex or color name"],
    "adjectives": ["string"],
    "avoidList": ["string — things to exclude"]
  },
  "subject": {
    "type": "product|person|scene|abstract",
    "description": "string"
  },
  "style": {
    "aesthetic": "string — e.g. 'cinematic', 'flat design', 'editorial'",
    "references": ["string — describe a reference look"],
    "lighting": "string",
    "mood": "string"
  },
  "technicalConstraints": {
    "resolution": "preview|sd15|sdxl|sdxlWide|portrait916|landscape43",
    "loraHints": ["string — style / character LoRA keywords if known"],
    "modelPreference": "sd15|sdxl|auto"
  },
  "approvalSteps": ["string — who approves at which stage"],
  "notes": "string — anything else"
}`;

    const userMessage = `Translate this creative brief into the JSON schema:\n\n${brief}`;
    const messages = [{ role: 'user', content: userMessage }];

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
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });
      rawJson = resp.content[0].text;
    }

    // Strip any accidental markdown fences
    const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.deliverables || parsed.deliverables.length === 0) {
      throw new Error('Brief translation produced no deliverables. Please include specific formats (e.g. "2 Instagram posts 1:1, 1 TikTok video 9:16").');
    }

    return parsed;
  }
}

module.exports = BriefTranslatorAgent;
