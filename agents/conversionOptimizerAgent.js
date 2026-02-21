const deepseekService = require('../services/deepseekService');

/**
 * Conversion Optimizer Agent (CRO)
 * Layer 3: Analysis & Intelligence
 *
 * Analyses the SME lead generation funnel stage-by-stage and outputs:
 *   1. Drop-off analysis with bottleneck identification
 *   2. A/B test recommendations (form, CTA, page copy, lead magnet)
 *   3. Specific CRO actions ranked by estimated lift × effort
 *   4. Benchmark comparison vs. target KPIs
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — analysis + recommendations
 *
 * Target: <$0.006/analysis run
 */

const TARGET_KPIS = {
  form_completion_rate: 15,    // % of page visitors who complete form
  lead_to_demo_rate: 25,       // % of leads who book demo
  demo_to_close_rate: 30,      // % of demos that close
  cpl_hkd: 150,                // Cost per lead in HKD
  cac_hkd: 2000,               // Customer acquisition cost in HKD
};

/**
 * Compute stage-by-stage funnel metrics from raw numbers
 */
function analyzeFunnel(metrics) {
  const {
    page_visitors = 0,
    form_starts = 0,
    form_completions = 0,
    leads = 0,            // same as form_completions if not separately tracked
    demos_booked = 0,
    demos_attended = 0,
    closed_won = 0,
    total_spend_hkd = 0,
  } = metrics;

  const actualLeads = leads || form_completions;

  const stages = [
    {
      stage: 'Visitor → Form Start',
      top: page_visitors,
      bottom: form_starts,
      rate: page_visitors > 0 ? ((form_starts / page_visitors) * 100).toFixed(1) : null,
      target_rate: 40, // ~40% should at least engage with form
      status: null,
    },
    {
      stage: 'Form Start → Form Submit',
      top: form_starts,
      bottom: form_completions,
      rate: form_starts > 0 ? ((form_completions / form_starts) * 100).toFixed(1) : null,
      target_rate: 60, // 60% who start should complete
      status: null,
    },
    {
      stage: 'Lead → Demo Booked',
      top: actualLeads,
      bottom: demos_booked,
      rate: actualLeads > 0 ? ((demos_booked / actualLeads) * 100).toFixed(1) : null,
      target_rate: TARGET_KPIS.lead_to_demo_rate,
      status: null,
    },
    {
      stage: 'Demo Booked → Demo Attended',
      top: demos_booked,
      bottom: demos_attended,
      rate: demos_booked > 0 ? ((demos_attended / demos_booked) * 100).toFixed(1) : null,
      target_rate: 80, // 80% show rate target
      status: null,
    },
    {
      stage: 'Demo Attended → Closed Won',
      top: demos_attended,
      bottom: closed_won,
      rate: demos_attended > 0 ? ((closed_won / demos_attended) * 100).toFixed(1) : null,
      target_rate: TARGET_KPIS.demo_to_close_rate,
      status: null,
    },
  ];

  // Tag each stage as on_target / below_target / critical
  for (const s of stages) {
    if (s.rate === null) { s.status = 'no_data'; continue; }
    const rate = parseFloat(s.rate);
    if (rate >= s.target_rate) s.status = 'on_target';
    else if (rate >= s.target_rate * 0.7) s.status = 'below_target';
    else s.status = 'critical';
  }

  const criticalStages = stages.filter(s => s.status === 'critical').map(s => s.stage);
  const overallFormConvRate = page_visitors > 0
    ? ((form_completions / page_visitors) * 100).toFixed(1)
    : null;

  return {
    stages,
    critical_bottlenecks: criticalStages,
    overall_form_completion_rate: overallFormConvRate,
    actual_cpl_hkd: total_spend_hkd > 0 && actualLeads > 0
      ? Math.round(total_spend_hkd / actualLeads)
      : null,
    actual_cac_hkd: total_spend_hkd > 0 && closed_won > 0
      ? Math.round(total_spend_hkd / closed_won)
      : null,
    vs_target: {
      form_completion: overallFormConvRate
        ? (parseFloat(overallFormConvRate) >= TARGET_KPIS.form_completion_rate ? '✅' : '❌')
        : '—',
      cpl: total_spend_hkd && actualLeads
        ? (Math.round(total_spend_hkd / actualLeads) <= TARGET_KPIS.cpl_hkd ? '✅' : '❌')
        : '—',
    },
  };
}

/**
 * Generate AI CRO recommendations
 */
async function generateCRORecommendations(funnelAnalysis, currentSetup = {}) {
  const prompt = `You are a conversion rate optimisation (CRO) expert for RecruitAIStudio, an SME AI automation agency in Hong Kong.

Analyse this funnel data and generate prioritised CRO recommendations.

FUNNEL ANALYSIS:
${JSON.stringify(funnelAnalysis, null, 2)}

CURRENT SETUP:
- Form fields: ${currentSetup.form_fields || '6 required fields'}
- CTA text: ${currentSetup.cta_text || 'Get Your Free AI Assessment'}
- Lead magnet: ${currentSetup.lead_magnet || 'Free AI Assessment Report'}
- Page load time: ${currentSetup.page_load_ms || 'unknown'}ms
- Mobile traffic %: ${currentSetup.mobile_pct || 'unknown'}%

TARGET KPIs:
- Form completion rate: >15% of visitors
- Lead-to-demo rate: >25%
- CPL: <HKD 150
- Demo show rate: >80%

Provide:
1. 3 A/B tests to run immediately (ordered by expected lift)
2. 3 quick wins implementable in <1 day
3. 1 form optimisation recommendation
4. 1 landing page copy recommendation

Respond with ONLY valid JSON (no markdown):
{
  "ab_tests": [
    {
      "test_name": "...",
      "hypothesis": "...",
      "variant_a": "...",
      "variant_b": "...",
      "target_metric": "...",
      "expected_lift_pct": <number>,
      "effort": "low|medium|high",
      "addresses_stage": "..."
    }
  ],
  "quick_wins": [
    {
      "action": "...",
      "rationale": "...",
      "estimated_lift": "...",
      "implementation": "..."
    }
  ],
  "form_recommendation": "...",
  "copy_recommendation": "...",
  "biggest_opportunity": "..."
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 900, temperature: 0.4 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      ab_tests: [
        {
          test_name: 'Form Length Test',
          hypothesis: 'Removing optional fields increases form completions',
          variant_a: '6 fields (current)',
          variant_b: '3 required fields only',
          target_metric: 'Form completion rate',
          expected_lift_pct: 15,
          effort: 'low',
          addresses_stage: 'Form Start → Submit',
        },
      ],
      quick_wins: [
        { action: 'Add exit-intent popup', rationale: 'Capture abandoners', estimated_lift: '+5% leads', implementation: 'JavaScript scroll/mouse listener' },
      ],
      form_recommendation: 'Reduce to 3 required fields for initial capture, collect additional data in follow-up sequence.',
      copy_recommendation: 'Change hero headline to include a specific metric: "Save 30 Hours/Week — Built for HK SMEs"',
      biggest_opportunity: funnelAnalysis.critical_bottlenecks?.[0] || 'Form completion rate improvement',
    };
  }
}

/**
 * Main entry point
 * @param {Object} metrics - Raw funnel numbers
 * @param {Object} currentSetup - Current form/page configuration
 */
async function optimizeConversions(metrics, currentSetup = {}) {
  const funnelAnalysis = analyzeFunnel(metrics);
  const recommendations = await generateCRORecommendations(funnelAnalysis, currentSetup);

  return {
    funnel_analysis: funnelAnalysis,
    target_kpis: TARGET_KPIS,
    recommendations,
    analyzed_at: new Date().toISOString(),
  };
}

module.exports = { optimizeConversions, analyzeFunnel };
