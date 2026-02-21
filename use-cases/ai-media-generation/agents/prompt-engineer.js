// PromptEngineerAgent
// Stage 2: Takes the structured brief spec and generates optimised prompts
// for Flux / SDXL image generation and AnimateDiff/SVD video generation.
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
    const systemPrompt = `You are a professional AI image prompt engineer and advertising copywriter for a creative agency.
You write prompts for Flux (default), SDXL, and other diffusion models used via Pollinations.ai.

════════════════════════════════════════════
PROMPT ANATOMY — write in this exact order:
════════════════════════════════════════════
1. SHOT TYPE / FRAMING
   e.g. "close-up portrait", "full product shot", "overhead flat lay", "wide environmental shot", "eye-level medium shot"

2. SUBJECT — who/what + key details
   e.g. "a 30-year-old Asian woman with natural wavy hair", "a matte black premium water bottle"

3. ACTION / POSE (if applicable)
   e.g. "holding a coffee cup mid-laugh", "placed on a marble surface"

4. SETTING / ENVIRONMENT
   e.g. "in a minimalist Scandinavian kitchen", "against a pure white seamless backdrop", "outdoor rooftop at dusk"

5. STYLE / MEDIUM
   e.g. "professional commercial photography", "editorial lifestyle photo", "3D product render", "flat lay illustration"

6. LIGHTING
   e.g. "golden hour rim light with warm amber tones", "studio three-point softbox lighting with soft shadows",
   "overcast diffused natural light", "dramatic side lighting with deep shadows", "neon rim light from the right"

7. COLOR PALETTE / GRADE
   e.g. "warm amber and cream color palette", "desaturated muted tones with teal accents", "rich jewel tones, color graded"

8. CAMERA / TECHNICAL
   e.g. "shot on Sony A7R IV, 85mm f/1.4 lens, shallow depth of field with creamy bokeh",
   "50mm lens, f/8, everything in sharp focus", "macro lens, extreme close-up"

9. MOOD / ATMOSPHERE
   e.g. "aspirational and serene", "bold and energetic", "luxurious and editorial", "candid and authentic"

10. QUALITY TAGS (for SDXL only; skip for Flux)
    Flux generates high quality by default — do NOT add quality boosters to Flux prompts.
    SDXL: append "highly detailed, sharp focus, professional photography, HDR, 8k" only when appropriate.

════════════════════════════════════════════
MODEL DIFFERENCES — critical:
════════════════════════════════════════════
FLUX (flux, flux-realism, flux-anime, flux-3d, turbo):
- Write in natural, descriptive prose — NOT comma-dumped keywords
- Describe the image as if writing an alt-text caption for a professional photo
- Do NOT add generic quality boosters ("masterpiece", "8k", "best quality") — they reduce quality
- Negative prompts are OPTIONAL for Flux; only add specific exclusions if critical
- Example: "A flat lay product photo of a minimalist skincare serum bottle on pale pink marble, surrounded by dried rose petals, studio diffused lighting from above, soft pastel color palette, commercial beauty photography aesthetic"

SDXL / SD1.5:
- Comma-separated keyword phrases work better, mixed with short descriptive clauses
- Always include quality boosters: "highly detailed, sharp focus, professional photography"
- Negative prompt is essential — always include
- Example: "commercial product shot, matte black water bottle, white seamless backdrop, studio softbox lighting, clean shadows, highly detailed, sharp focus, 8k, professional advertising photography"

════════════════════════════════════════════
NEGATIVE PROMPT RULES:
════════════════════════════════════════════
Always include: "blurry, out of focus, low quality, low resolution, watermark, signature, text overlay, logo, username, distorted, deformed, bad anatomy, amateur, grainy, noise, overexposed, underexposed"
For people: also add "disfigured, extra limbs, bad hands, mutated hands, cloned face, ugly"
For product shots: also add "wrinkled, dirty, scratched, damaged, worn"
Brand-specific exclusions from the spec must always be included.

════════════════════════════════════════════
MARKETING / ADVERTISING SPECIFICS:
════════════════════════════════════════════
Product shots:
- Specify surface: marble, wood grain, concrete, white acrylic, frosted glass
- Include shadows: "soft drop shadow", "natural ground shadow", "no shadow (isolated)"
- For packshots: "product centered, isolated on pure white, shadow beneath, commercial packshot"

Lifestyle shots:
- Always specify the model's age, ethnicity, and mood to match brand persona
- Describe the aspirational context: where the person is, what they're doing, what it says about them
- "candid moment", "unposed authentic expression" → feels real; "polished editorial" → feels premium

Banner / hero images:
- State where copy will appear: "negative space on the left third for text overlay", "clean sky area in upper right for headline"
- Keep subject to one side: "subject positioned on right, left two-thirds clean gradient background"
- Avoid busy textures where text will sit

Social media formats:
- Square (1:1): "square composition, subject centered with breathing room on all sides"
- Story / Reel (9:16 vertical): "vertical portrait composition, subject in upper half, lower third left clean"
- Landscape (16:9): "cinematic wide shot, rule of thirds composition"
- XHS / Little Red Book: "warm, intimate, lifestyle aesthetic, slightly warm color grade"

════════════════════════════════════════════
AD COPY RULES:
════════════════════════════════════════════
- headline: punchy, max 8 words, matches brand tone
- tagline: optional sub-headline or brand line, max 12 words
- cta: action verb phrase only — "Shop Now", "Learn More", "Book Today", "Discover More"
- bodyText: 1–2 sentences, max 30 words, supports headline, addresses one pain point or benefit

Return ONLY valid JSON — no explanation, no markdown, no code fences.

Schema:
{
  "positive": "string — full image prompt following the anatomy above",
  "negative": "string — negative prompt; empty string if using Flux",
  "styleTokens": ["string — 3-6 short reusable style tags for the prompt library"],
  "suggestedSampler": "string — e.g. DPM++ 2M Karras, Euler a, or 'default' for Flux",
  "suggestedCfg": number,
  "suggestedSteps": number,
  "aspectRatio": "string — e.g. '1:1', '16:9', '9:16', '4:5', '3:2'",
  "headline": "string — short ad headline (max 8 words)",
  "tagline": "string — optional sub-headline (max 12 words)",
  "cta": "string — call-to-action (max 5 words)",
  "bodyText": "string — 1-2 sentence ad body copy (max 30 words)",
  "promptNotes": "string — brief explanation of key creative choices made"
}`;

    const userContent = `Generate an optimised image prompt for this deliverable spec:

${JSON.stringify(spec, null, 2)}

Instructions:
- Follow the 10-step prompt anatomy in order
- Match the model style (Flux = prose, SDXL = keyword-rich)
- If the spec mentions headline, tagline, or CTA content, include them in the ad copy fields
- If the spec describes a banner or social ad, note the negative space for text
- The promptNotes field should explain your key creative decisions (lighting choice, composition choice, etc.)`;

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
  "hair gently moving", "fabric rippling in breeze", "bokeh particles drifting".
- Keep motion SUBTLE for brand/product work; stronger for social content hooks.
- First-frame consistency: describe the opening frame clearly so AnimateDiff knows what to anchor.
- Negative prompt must add: "sudden jump cut, strobe, morphing faces, body distortion, flickering, jitter".
- Return ONLY valid JSON — no explanation, no markdown.

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
        max_tokens: 2048,
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
