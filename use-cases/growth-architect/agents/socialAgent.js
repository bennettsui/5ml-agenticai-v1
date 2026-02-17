/**
 * Social Agent — social content tool wrapper
 * Generates social posts, reels scripts, KOL briefs, content calendars
 * Block 3 assets: brand awareness + community growth channels
 *
 * Platforms: Instagram, Facebook, LinkedIn, Xiaohongshu (小紅書), WhatsApp Broadcast
 * Formats: feed post, carousel, reel script, story, KOL brief, community post
 */

const deepseekService = require('../../../services/deepseekService');
const { getClaudeModel } = require('../../../utils/modelHelper');

const SOCIAL_SYSTEM_PROMPT = `You are a Social Content Agent for 5ML. Generate platform-native social content.

Platform conventions:
- Instagram Feed: visual-first, hook in first line, 3-5 hashtags, lifestyle tone
- Instagram Reel Script: 15/30/60s, hook (0-3s) → value (3-25s) → CTA (last 5s)
- Facebook Post: longer form OK, community angle, shareable insight or question
- LinkedIn Post: professional credibility, data + story, problem/insight/CTA structure
- 小紅書 (Xiaohongshu): aesthetic lifestyle, personal diary tone, detailed steps/tips, dense hashtags
- WhatsApp Broadcast: warm/personal, ≤300 chars per message, clear action

KOL Brief structure:
- Brand background (2-3 lines)
- Campaign objective (1 line)
- Deliverables (format, platform, quantity)
- Key messages (3 bullets)
- Dos and Don'ts
- Timeline + deliverable dates
- Compensation structure (placeholder)

Content pillars (assign each piece to one):
1. Education — teach something useful
2. Inspiration — aspirational story or outcome
3. Social Proof — real results, testimonials, case studies
4. Entertainment — relatable humor or trend-jacking
5. Conversion — offer, promotion, direct CTA

Output MUST be valid JSON:
{
  "platform": "...",
  "format": "...",
  "pillar": "...",
  "caption": "...",
  "hashtags": [...],
  "visual_direction": "...",
  "hook_line": "...",
  "cta": "...",
  "notes": "..."
}
For KOL briefs, output a "kol_brief" object with all sections.`;

async function generateSocialContent(
  brand_name,
  icp,
  product_brief,
  platform,
  format,
  campaign_theme,
  pillar = 'education',
  options = {}
) {
  const { model = 'claude', no_fallback = false, count = 2 } = options;
  const modelsUsed = [];

  const isKolBrief = format === 'kol_brief';

  const userPrompt = isKolBrief
    ? `Create a KOL collaboration brief for:
Brand: ${brand_name}
Product: ${product_brief}
Target ICP: ${icp}
Campaign Theme: ${campaign_theme}
Platform: ${platform}

Output a detailed KOL brief JSON with sections: brand_background, campaign_objective, deliverables, key_messages, dos_and_donts, timeline, compensation_placeholder.`
    : `Generate ${count} ${format} posts for ${platform}:

Brand: ${brand_name}
ICP: ${icp}
Product: ${product_brief}
Campaign Theme: ${campaign_theme}
Content Pillar: ${pillar}

Return a JSON array of ${count} content objects. Each must have: platform, format, pillar, caption, hashtags, visual_direction, hook_line, cta, notes.`;

  let rawResult;

  try {
    const llm = require('../../../lib/llm');
    const response = await llm.chat(
      getClaudeModel('claude'),
      [{ role: 'user', content: `${SOCIAL_SYSTEM_PROMPT}\n\n${userPrompt}` }],
      { max_tokens: 2500 }
    );
    rawResult = response.text;
    modelsUsed.push(response.model || 'claude-sonnet-4-5');
  } catch (claudeError) {
    console.warn('[socialAgent] Claude error, falling back to DeepSeek:', claudeError.message);
    if (!no_fallback) {
      rawResult = await deepseekService.analyze(SOCIAL_SYSTEM_PROMPT, userPrompt);
      modelsUsed.push('deepseek-reasoner');
    } else {
      throw claudeError;
    }
  }

  // Parse response
  let parsed;
  try {
    const jsonMatch = rawResult.match(/[\[{][\s\S]*[\]}]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[socialAgent] JSON parse failed:', e.message);
    parsed = isKolBrief
      ? { kol_brief: { raw: rawResult } }
      : [{ platform, format, caption: rawResult }];
  }

  const contents = isKolBrief ? [parsed] : Array.isArray(parsed) ? parsed : [parsed];

  const assets = contents.map((c, i) => ({
    brand_name,
    asset_type: isKolBrief ? 'kol_brief' : 'social_post',
    channel: platform,
    funnel_stage: pillar === 'conversion' ? 'acquisition' : 'awareness',
    tag: `S${i + 1}-${pillar.substring(0, 3)}`,
    content: c,
    status: 'draft',
  }));

  return {
    brand_name,
    platform,
    format,
    pillar,
    assets,
    _meta: {
      models_used: modelsUsed,
      count: assets.length,
      timestamp: new Date().toISOString(),
    },
  };
}

module.exports = { generateSocialContent };
