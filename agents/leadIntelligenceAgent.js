const deepseekService = require('../services/deepseekService');

/**
 * Lead Intelligence Agent
 * Layer 3: Analysis & Intelligence
 *
 * Enriches a raw inbound lead with:
 *   1. Industry-specific AI opportunity assessment
 *   2. Estimated workflow ROI for their company size + industry
 *   3. Competitor awareness — what solutions they might already know
 *   4. Personalised outreach angle for the first sales touch
 *   5. Predicted deal size and timeline
 *
 * Does NOT call external APIs — enrichment is AI-inference based on
 * firmographic signals + our knowledge base of HK SME patterns.
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — primary
 *
 * Target: <$0.004/enrichment
 */

// HK SME market context embedded as static knowledge
const HK_SME_CONTEXT = {
  finance: {
    avg_headcount: 25,
    typical_pain: 'Manual reporting, compliance documentation, client onboarding paperwork',
    ai_maturity: 'low-medium',
    decision_maker: 'MD / COO / CFO',
    avg_deal_hkd: 106000,  // HKD 8,800 × 12
    sales_cycle_days: 21,
    competitor_tools: ['Microsoft Copilot (generic)', 'Notion AI', 'ChatGPT ad-hoc usage'],
  },
  retail: {
    avg_headcount: 30,
    typical_pain: 'Inventory management, multichannel order processing, staff rostering',
    ai_maturity: 'low',
    decision_maker: 'Owner / Operations Manager',
    avg_deal_hkd: 105600,
    sales_cycle_days: 14,
    competitor_tools: ['Shopify native automation', 'Zapier workflows', 'Manual Excel'],
  },
  fnb: {
    avg_headcount: 20,
    typical_pain: 'Supplier invoice processing, reservation management, food cost tracking',
    ai_maturity: 'very_low',
    decision_maker: 'Owner / Restaurant Manager',
    avg_deal_hkd: 105600,
    sales_cycle_days: 10,
    competitor_tools: ['Revel POS automation', 'Manual processes', 'WhatsApp ordering'],
  },
  healthcare: {
    avg_headcount: 15,
    typical_pain: 'Appointment scheduling, insurance claim processing, patient follow-up',
    ai_maturity: 'low',
    decision_maker: 'Clinic Owner / Practice Manager',
    avg_deal_hkd: 105600,
    sales_cycle_days: 28,
    competitor_tools: ['Clinic management software', 'Manual staff', 'Generic chatbots'],
  },
  logistics: {
    avg_headcount: 40,
    typical_pain: 'Shipment tracking, driver management, customs documentation',
    ai_maturity: 'medium',
    decision_maker: 'Operations Director / COO',
    avg_deal_hkd: 158400,  // Likely upsell to more workflows
    sales_cycle_days: 30,
    competitor_tools: ['SAP (enterprise)', 'Manual tracking sheets', 'Basic GPS tools'],
  },
  professional: {
    avg_headcount: 12,
    typical_pain: 'Proposal generation, timesheet reconciliation, client communication',
    ai_maturity: 'medium',
    decision_maker: 'Managing Partner / Director',
    avg_deal_hkd: 105600,
    sales_cycle_days: 21,
    competitor_tools: ['Microsoft 365 Copilot', 'Harvey AI (legal)', 'Manual work'],
  },
  manufacturing: {
    avg_headcount: 60,
    typical_pain: 'Quality inspection, maintenance scheduling, supply chain visibility',
    ai_maturity: 'low-medium',
    decision_maker: 'Plant Manager / Operations Director',
    avg_deal_hkd: 211200,  // Higher complexity, more workflows
    sales_cycle_days: 45,
    competitor_tools: ['SAP', 'Oracle', 'Legacy ERPs', 'Excel-based tracking'],
  },
};

function getIndustryContext(industry) {
  return HK_SME_CONTEXT[industry] || {
    avg_headcount: 20,
    typical_pain: 'Manual processes, data management, reporting',
    ai_maturity: 'low',
    decision_maker: 'Business Owner / Operations Lead',
    avg_deal_hkd: 105600,
    sales_cycle_days: 21,
    competitor_tools: ['Generic AI tools', 'Manual processes'],
  };
}

/**
 * Estimate ROI for a lead based on company size + industry
 */
function estimateROI(lead, industryCtx) {
  const headcount = parseInt(lead.company_size?.split('-')[0]) || industryCtx.avg_headcount;
  const hourlyRate = 80; // HKD/hour estimate for SME staff
  const hoursPerWeek = Math.min(5 + Math.floor(headcount / 10) * 2, 30);
  const monthlySavings = hoursPerWeek * 4 * hourlyRate;
  const monthlyFee = 8800;
  const setupFee = 15000;
  const breakEvenMonths = Math.ceil(setupFee / Math.max(monthlySavings - monthlyFee, 1));

  return {
    estimated_hours_saved_per_week: hoursPerWeek,
    estimated_monthly_savings_hkd: monthlySavings,
    monthly_fee_hkd: monthlyFee,
    net_monthly_benefit_hkd: monthlySavings - monthlyFee,
    break_even_months: breakEvenMonths > 0 ? breakEvenMonths : 1,
    six_month_roi_hkd: (monthlySavings - monthlyFee) * 6 - setupFee,
    annual_roi_hkd: (monthlySavings - monthlyFee) * 12 - setupFee,
  };
}

/**
 * Main enrichment function
 */
async function enrichLead(lead) {
  const industryCtx = getIndustryContext(lead.industry);
  const roi = estimateROI(lead, industryCtx);

  const prompt = `You are a B2B sales intelligence specialist for RecruitAIStudio, an SME AI automation agency in HK.

Generate a lead intelligence brief for this inbound SME lead.

LEAD DATA:
- Company: ${lead.company_name || 'Unknown'}
- Industry: ${lead.industry}
- Company Size: ${lead.company_size || industryCtx.avg_headcount + ' est.'}
- Pain Points Selected: ${Array.isArray(lead.challenges) ? lead.challenges.join(', ') : 'None'}
- Message: ${lead.message || 'None'}
- Source Campaign: ${lead.utm_campaign || 'unknown'}
- Lead Score: ${lead.lead_score || 'N/A'}/100

INDUSTRY CONTEXT:
- Typical AI maturity: ${industryCtx.ai_maturity}
- Decision maker: ${industryCtx.decision_maker}
- Known pain: ${industryCtx.typical_pain}
- Competitors they likely use: ${industryCtx.competitor_tools.join(', ')}
- Avg sales cycle: ${industryCtx.sales_cycle_days} days

ROI ESTIMATE:
${JSON.stringify(roi, null, 2)}

Generate:
1. First-touch outreach angle (what to open the first call with — specific to their situation)
2. Top 3 AI workflows most likely to resonate for this specific company
3. Predicted deal complexity (simple/moderate/complex) with rationale
4. 2 risk factors that could stall this deal
5. Recommended first gift/value-add to send before the demo

Respond with ONLY valid JSON (no markdown):
{
  "first_touch_angle": "...",
  "recommended_workflows": ["...", "...", "..."],
  "deal_complexity": "simple|moderate|complex",
  "complexity_rationale": "...",
  "deal_stall_risks": ["...", "..."],
  "pre_demo_value_add": "...",
  "estimated_close_date": "...",
  "confidence": "low|medium|high"
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 700, temperature: 0.4 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let aiInsight;
  try {
    aiInsight = JSON.parse(cleaned);
  } catch {
    aiInsight = {
      first_touch_angle: `Open with a question about their ${lead.challenges?.[0] || 'biggest operational pain'}.`,
      recommended_workflows: ['Invoice automation', 'Customer follow-up agent', 'Weekly intelligence report'],
      deal_complexity: 'moderate',
      complexity_rationale: 'Standard SME profile.',
      deal_stall_risks: ['Budget approval', 'Decision timing'],
      pre_demo_value_add: 'Send a 1-page custom AI opportunity map for their industry.',
      estimated_close_date: 'Within 30 days',
      confidence: 'medium',
    };
  }

  return {
    lead_id: lead.lead_id || lead.id,
    industry_context: {
      decision_maker: industryCtx.decision_maker,
      ai_maturity: industryCtx.ai_maturity,
      typical_sales_cycle_days: industryCtx.sales_cycle_days,
      competitor_awareness: industryCtx.competitor_tools,
    },
    roi_estimate: roi,
    predicted_deal_value_hkd: industryCtx.avg_deal_hkd,
    ...aiInsight,
    enriched_at: new Date().toISOString(),
  };
}

module.exports = { enrichLead };
