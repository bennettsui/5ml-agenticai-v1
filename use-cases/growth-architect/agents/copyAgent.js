/**
 * Copy Agent — nanobanana wrapper
 * Generates versioned ad copy, landing pages, email/WhatsApp scripts
 * Block 3 assets: Awareness → Acquisition → Activation funnel
 *
 * nanobanana philosophy:
 * - Hook first: earn attention in ≤3 seconds
 * - Problem → Agitate → Solution (PAS) frame
 * - One CTA per asset
 * - Variant tagging: angle code + approach (e.g. A1-problem, B2-social-proof)
 */

const deepseekService = require('../../../services/deepseekService');
const { getClaudeModel } = require('../../../utils/modelHelper');

const NANOBANANA_SYSTEM_PROMPT = `You are nanobanana, 5ML's internal copywriting agent.

Philosophy:
- Hook first: earn attention in ≤3 seconds
- Problem → Agitate → Solution (PAS) or Desire → Proof → CTA
- Every asset has ONE clear CTA
- Write as if talking to ONE specific person (the ICP)
- Specificity beats generality: numbers, time, names beat vague claims
- Contrast drives clicks: before/after, with/without, old way/new way

Asset Types:
- fb_ad: Facebook/Instagram ad (headline 40 chars, primary text 125 chars, CTA button)
- gdn_banner: Google Display banner (headline 30 chars, desc 90 chars)
- sem_ad: Google Search ad (headline1 30, headline2 30, desc1 90, desc2 90)
- landing_hero: Landing page hero section (H1 60 chars, subheadline 120 chars, CTA 25 chars)
- email_subject: Email subject line + preview text
- email_body: Full email body (plain text structure)
- whatsapp: WhatsApp message (≤300 chars, conversational)
- video_script: 15/30/60-second video script (hook + body + CTA)

Hook angles (use these codes in tags):
- A: Problem-focused ("Still struggling with X?")
- B: Social proof ("How 200 families solved X")
- C: Curiosity gap ("The one thing doctors don't tell you about X")
- D: Transformation ("From X to Y in 30 days")
- E: Urgency/scarcity ("Spots filling fast")
- F: Authority ("Certified by / Trusted by")

Output MUST be valid JSON array of variants:
[{
  "tag": "A1",
  "angle": "problem-focused",
  "headline": "...",
  "body": "...",
  "cta": "...",
  "hook": "...",
  "notes": "..."
}]`;

async function generateCopyAssets(
  brand_name,
  icp,
  product_brief,
  asset_type,
  funnel_stage,
  channel,
  experiment_hypothesis = null,
  options = {}
) {
  const { model = 'claude', no_fallback = false, variants = 3 } = options;
  const modelsUsed = [];

  const userPrompt = `Generate ${variants} copy variants for:

Brand: ${brand_name}
ICP: ${icp}
Product: ${product_brief}
Asset Type: ${asset_type}
Funnel Stage: ${funnel_stage}
Channel: ${channel}
${experiment_hypothesis ? `Hypothesis being tested: ${experiment_hypothesis}` : ''}

Requirements:
- Each variant uses a DIFFERENT hook angle (A through F)
- Tag format: [AngleCode][Number] e.g. A1, B2, C3
- Match tone and length specs for ${asset_type}
- Speak directly to the ICP's pain and desired outcome

Return a JSON array with ${variants} variant objects.`;

  let rawResult;

  // Prefer Claude Sonnet for creative copy
  try {
    const llm = require('../../../lib/llm');
    const response = await llm.chat(
      getClaudeModel('claude'),
      [
        { role: 'user', content: `${NANOBANANA_SYSTEM_PROMPT}\n\n${userPrompt}` },
      ],
      { max_tokens: 3000 }
    );
    rawResult = response.text;
    modelsUsed.push(response.model || 'claude-sonnet-4-5');
  } catch (claudeError) {
    console.warn('[copyAgent] Claude error, falling back to DeepSeek:', claudeError.message);
    if (!no_fallback) {
      rawResult = await deepseekService.analyze(NANOBANANA_SYSTEM_PROMPT, userPrompt);
      modelsUsed.push('deepseek-reasoner');
    } else {
      throw claudeError;
    }
  }

  // Parse variants
  let variants_parsed = [];
  try {
    const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    variants_parsed = JSON.parse(jsonStr);
    if (!Array.isArray(variants_parsed)) variants_parsed = [variants_parsed];
  } catch (e) {
    console.warn('[copyAgent] JSON parse failed, wrapping raw:', e.message);
    variants_parsed = [{ tag: 'A1', angle: 'raw', body: rawResult }];
  }

  // Build asset objects (one per variant)
  const assets = variants_parsed.map((v) => ({
    brand_name,
    asset_type,
    channel,
    funnel_stage,
    tag: v.tag || 'A1',
    content: {
      headline: v.headline || '',
      body: v.body || '',
      cta: v.cta || '',
      hook: v.hook || '',
      angle: v.angle || '',
      notes: v.notes || '',
    },
    status: 'draft',
  }));

  return {
    brand_name,
    asset_type,
    channel,
    funnel_stage,
    variants: assets,
    _meta: {
      models_used: modelsUsed,
      variant_count: assets.length,
      timestamp: new Date().toISOString(),
    },
  };
}

module.exports = { generateCopyAssets };
