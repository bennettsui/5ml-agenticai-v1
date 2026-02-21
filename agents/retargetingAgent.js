const deepseekService = require('../services/deepseekService');

/**
 * Retargeting Strategist Agent
 * Layer 4: Content Generation + Layer 3: Analysis
 *
 * Segments lost/unconverted leads into 4 retargeting audiences and generates:
 *   - Audience definition (who to target + exclusions)
 *   - 3 ad copy variations per audience (headline, body, CTA)
 *   - Recommended creative format (carousel, video, single image)
 *   - Budget suggestion per audience segment
 *
 * Audience Segments (per Growth Architect doc):
 *   A1 — Visited landing page, did NOT submit form
 *   A2 — Started form, did NOT complete (partial abandonment)
 *   A3 — Submitted form, did NOT book demo
 *   A4 — Booked demo, did NOT attend (no-show)
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — creative generation
 *
 * Target: <$0.006/audience set generation
 */

const SEGMENT_DEFINITIONS = {
  A1_page_visitor: {
    label: 'Landing Page Visitors — No Form',
    description: 'Users who visited the SME landing page but did not start the lead form',
    pixel_audience: 'PageView → exclude Lead event (last 30 days)',
    funnel_stage: 'Awareness → Interest',
    urgency: 'low',
    offer_angle: 'Value education + social proof',
    budget_hkd_daily: 150,
  },
  A2_form_abandoner: {
    label: 'Form Abandoners',
    description: 'Users who started the form (triggered InitiateCheckout pixel) but did not submit',
    pixel_audience: 'InitiateCheckout → exclude Lead event (last 14 days)',
    funnel_stage: 'Consideration',
    urgency: 'medium',
    offer_angle: 'Reduce friction, quick win promise',
    budget_hkd_daily: 200,
  },
  A3_lead_no_demo: {
    label: 'Leads — No Demo Booked',
    description: 'Users who submitted the lead form but have not booked a demo',
    pixel_audience: 'Lead event → exclude Demo_Requested event (last 7 days)',
    funnel_stage: 'Intent',
    urgency: 'high',
    offer_angle: 'Testimonial + limited-time bonus',
    budget_hkd_daily: 300,
  },
  A4_demo_noshow: {
    label: 'Demo No-Shows',
    description: 'Prospects who booked a demo but did not attend (reschedule recovery)',
    pixel_audience: 'Custom event Demo_Requested → exclude Demo_Attended (last 14 days)',
    funnel_stage: 'Decision',
    urgency: 'very_high',
    offer_angle: 'Reschedule friction removal + bonus',
    budget_hkd_daily: 250,
  },
};

/**
 * Generate ad copy for a single segment
 */
async function generateSegmentCreatives(segmentKey, industry = 'SME', brandContext = {}) {
  const segment = SEGMENT_DEFINITIONS[segmentKey];
  if (!segment) throw new Error(`Unknown segment: ${segmentKey}`);

  const industryNote = industry && industry !== 'unknown'
    ? `Target audience works in the ${industry} industry in Hong Kong.`
    : 'Target audience is Hong Kong SME owners.';

  const prompt = `You are a paid social creative strategist at RecruitAIStudio, an SME AI automation agency in Hong Kong.

Write 3 ad copy variations for this retargeting audience segment.

SEGMENT: ${segment.label}
FUNNEL STAGE: ${segment.funnel_stage}
OFFER ANGLE: ${segment.offer_angle}
URGENCY: ${segment.urgency}
INDUSTRY CONTEXT: ${industryNote}

PRODUCT: RecruitAIStudio SME Package — HKD 8,800/month, 3 custom AI workflows, 2-week delivery, setup fee waived in Jan.

AD COPY REQUIREMENTS:
- 3 variations with different hooks/angles
- Each variation: headline (≤30 chars), primary text (≤90 chars), description (≤25 chars), CTA button
- Recommended creative format for this segment
- One variation must use social proof / a specific stat
- One variation must use urgency / scarcity
- One variation must be curiosity/question-driven
- CTA options: "Learn More", "Book Free Demo", "Claim Offer", "Reschedule Now", "See How It Works"

Respond with ONLY valid JSON (no markdown):
{
  "segment": "${segmentKey}",
  "recommended_format": "carousel|single_image|video|story",
  "format_rationale": "...",
  "variations": [
    {
      "angle": "social_proof|urgency|curiosity",
      "headline": "...",
      "primary_text": "...",
      "description": "...",
      "cta": "..."
    }
  ],
  "audience_note": "...",
  "creative_tip": "..."
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 700, temperature: 0.7 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      ...segment,
      ...parsed,
      pixel_audience: segment.pixel_audience,
      budget_hkd_daily: segment.budget_hkd_daily,
      generated_at: new Date().toISOString(),
    };
  } catch {
    return {
      ...segment,
      segment: segmentKey,
      recommended_format: 'single_image',
      variations: [
        {
          angle: 'urgency',
          headline: 'AI for Your Business',
          primary_text: 'Save 30 hours/week with custom AI agents. January setup fee waived.',
          description: 'Book your free demo.',
          cta: 'Book Free Demo',
        },
      ],
      _error: 'AI generation failed — fallback copy used.',
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * Generate full retargeting strategy for all 4 segments
 * @param {Object} options - { industry, segments (array, defaults to all), brandContext }
 */
async function generateRetargetingStrategy(options = {}) {
  const {
    industry = 'SME',
    segments = Object.keys(SEGMENT_DEFINITIONS),
    brandContext = {},
  } = options;

  const results = await Promise.all(
    segments.map(seg => generateSegmentCreatives(seg, industry, brandContext).catch(err => ({
      segment: seg,
      error: err.message,
    })))
  );

  const totalDailyBudget = results.reduce((acc, r) => acc + (r.budget_hkd_daily || 0), 0);

  return {
    strategy_summary: {
      total_segments: results.length,
      total_daily_budget_hkd: totalDailyBudget,
      total_monthly_budget_hkd: totalDailyBudget * 30,
      recommended_platform: 'Facebook + Instagram (primary), LinkedIn (A3 & A4)',
      priority_order: ['A3_lead_no_demo', 'A4_demo_noshow', 'A2_form_abandoner', 'A1_page_visitor'],
    },
    segments: results,
    generated_at: new Date().toISOString(),
  };
}

module.exports = { generateRetargetingStrategy, generateSegmentCreatives, SEGMENT_DEFINITIONS };
