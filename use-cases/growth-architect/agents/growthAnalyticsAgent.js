/**
 * Growth Analytics Agent — Financial Modeling & ROAS Projections
 * Analyzes ads performance, models scaling scenarios, calculates ROI
 * Integrates with ads_daily_performance and growth metrics for projections
 */

const deepseekService = require('../../../services/deepseekService');
const { getClaudeModel } = require('../../../utils/modelHelper');

const ANALYTICS_SYSTEM_PROMPT = `You are a Growth Analytics Agent for 5ML. Analyze performance data and build financial models.

Your job:
1. Analyze historical ads performance (CTR, CPC, CVR, CPA, ROAS, CAC, LTV)
2. Identify channel strengths and weaknesses
3. Build ROAS scaling models with realistic assumptions
4. Project revenue at different spend levels (50%, 100%, 150%, 200%, 300%)
5. Calculate break-even spend thresholds
6. Recommend budget allocation based on ROAS ranking

ROAS Calculation: Revenue / Spend
LTV/CAC Ratio: Lifetime Value / Customer Acquisition Cost
CAC Payback Period: CAC / (Monthly Recurring Revenue per customer)

Scaling considerations:
- Diminishing returns apply: ROAS typically decreases 2-8% per doubling of spend
- New channel penetration: first 20% of audience at 20-30% higher ROAS
- Saturation risk: organic reach plateaus around 10% of addressable market
- Channel-specific saturation: social ads saturate faster than search

Output MUST be valid JSON with projected_revenue, projected_cpa, projected_roas, saturation_risk, budget_allocation, break_even_analysis.`;

/**
 * Analyze historical ads performance and build scaling model
 */
async function analyzePerformanceAndBuildModel(
  db,
  brand_name,
  product_brief,
  options = {}
) {
  const { model = 'deepseek', days = 90 } = options;
  const modelsUsed = [];

  // 1. Fetch historical ads performance
  let historicalData = { channels: {}, summary: {} };
  if (db && db.pool) {
    try {
      const result = await db.pool.query(
        `SELECT
          channel,
          COUNT(*) as impressions_sum,
          COALESCE(SUM(CAST(clicks AS NUMERIC)), 0) as clicks_sum,
          COALESCE(SUM(CAST(conversions AS NUMERIC)), 0) as conversions_sum,
          COALESCE(SUM(CAST(spend AS NUMERIC)), 0) as spend_sum,
          COALESCE(SUM(CAST(revenue AS NUMERIC)), 0) as revenue_sum,
          AVG(CAST(ctr AS NUMERIC)) as avg_ctr,
          AVG(CAST(cpc AS NUMERIC)) as avg_cpc,
          AVG(CAST(cvr AS NUMERIC)) as avg_cvr,
          AVG(CAST(cpa AS NUMERIC)) as avg_cpa,
          AVG(CAST(roas AS NUMERIC)) as avg_roas
        FROM ads_daily_performance
        WHERE brand_name = $1
        AND date >= NOW() - INTERVAL '${days} days'
        GROUP BY channel
        ORDER BY spend_sum DESC`,
        [brand_name]
      );

      result.rows.forEach((row) => {
        historicalData.channels[row.channel || 'direct'] = {
          impressions: row.impressions_sum,
          clicks: row.clicks_sum,
          conversions: row.conversions_sum,
          spend: parseFloat(row.spend_sum),
          revenue: parseFloat(row.revenue_sum),
          ctr: parseFloat(row.avg_ctr),
          cpc: parseFloat(row.avg_cpc),
          cvr: parseFloat(row.avg_cvr),
          cpa: parseFloat(row.avg_cpa),
          roas: parseFloat(row.avg_roas),
        };
      });

      // Calculate totals
      const totals = Object.values(historicalData.channels).reduce(
        (acc, ch) => ({
          spend: acc.spend + ch.spend,
          revenue: acc.revenue + ch.revenue,
          conversions: acc.conversions + ch.conversions,
        }),
        { spend: 0, revenue: 0, conversions: 0 }
      );

      historicalData.summary = {
        total_spend: totals.spend,
        total_revenue: totals.revenue,
        total_conversions: totals.conversions,
        overall_roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        avg_cac: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        period_days: days,
      };
    } catch (dbError) {
      console.warn('[analyticsAgent] Could not fetch historical data:', dbError.message);
    }
  }

  // 2. Build analysis prompt
  const userPrompt = `Analyze performance and build scaling model for:

Brand: ${brand_name}
Product: ${product_brief}
Historical Data (last ${days} days):
${JSON.stringify(historicalData, null, 2)}

Build a ROAS scaling model with:
1. Channel ranking by ROAS efficiency
2. Scaling projections at 50%, 100%, 150%, 200%, 300% of current spend
3. Realistic CAC escalation assumptions (typically 5-15% per scaling level)
4. Break-even analysis (minimum spend for profitability)
5. Recommended budget allocation to top performers
6. Saturation risk assessment per channel

Return valid JSON with: channels_ranked, base_roas, scaling_projections, cac_escalation, break_even_analysis, budget_allocation, saturation_alerts.`;

  let rawResult;
  try {
    const llm = require('../../../lib/llm');
    const response = await llm.chat(
      getClaudeModel('claude'),
      [{ role: 'user', content: `${ANALYTICS_SYSTEM_PROMPT}\n\n${userPrompt}` }],
      { max_tokens: 2500 }
    );
    rawResult = response.text;
    modelsUsed.push(response.model || 'claude-sonnet-4-5');
  } catch (claudeError) {
    console.warn('[analyticsAgent] Claude error, falling back to DeepSeek:', claudeError.message);
    rawResult = await deepseekService.analyze(ANALYTICS_SYSTEM_PROMPT, userPrompt);
    modelsUsed.push('deepseek-reasoner');
  }

  // 3. Parse model
  let model_parsed = {};
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    model_parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[analyticsAgent] JSON parse failed:', e.message);
    model_parsed = {
      raw_analysis: rawResult,
      error: 'Could not parse JSON response',
    };
  }

  return {
    brand_name,
    historical_data: historicalData,
    model: model_parsed,
    _meta: {
      models_used: modelsUsed,
      analysis_date: new Date().toISOString(),
      days_analyzed: days,
    },
  };
}

/**
 * Create ROAS model for a growth plan
 */
async function createRoasModel(db, brand_name, plan_id, analysis) {
  if (!db || !db.pool || !analysis) return null;

  try {
    const baseSpend = analysis.historical_data?.summary?.total_spend || 0;
    const baseRevenue = analysis.historical_data?.summary?.total_revenue || 0;
    const baseRoas = analysis.historical_data?.summary?.overall_roas || 0;

    const channelMix = {};
    Object.entries(analysis.historical_data?.channels || {}).forEach(([ch, data]) => {
      if (analysis.historical_data.summary.total_spend > 0) {
        channelMix[ch] = {
          spend_pct: (data.spend / analysis.historical_data.summary.total_spend) * 100,
          roas: data.roas,
        };
      }
    });

    const result = await db.pool.query(
      `INSERT INTO growth_roas_models
       (brand_name, plan_id, base_spend, base_revenue, base_roas, channel_mix,
        scaling_assumptions, projections, ltv_assumptions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       RETURNING id, brand_name, base_spend, base_revenue, base_roas, created_at`,
      [
        brand_name,
        plan_id,
        baseSpend,
        baseRevenue,
        baseRoas,
        JSON.stringify(channelMix),
        JSON.stringify({
          roi_target: 3.0,
          cac_escalation_pct: 10,
          saturation_threshold: 0.1,
        }),
        JSON.stringify(analysis.model?.scaling_projections || {}),
        JSON.stringify({
          customer_ltv_multiplier: 3.0,
          annual_retention_rate: 0.8,
        }),
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[analyticsAgent] Error creating ROAS model:', error.message);
    return null;
  }
}

/**
 * Project revenue at different spend levels
 */
async function projectRevenueScenarios(analysis, spendMultipliers = [0.5, 1, 1.5, 2, 3]) {
  if (!analysis?.historical_data?.summary) return [];

  const { base_spend, base_revenue, overall_roas } = analysis.historical_data.summary;
  if (base_spend === 0 || overall_roas === 0) return [];

  // Apply diminishing returns: ROAS decreases ~5% per doubling of spend
  const diminishingReturnsFactor = 0.05;

  return spendMultipliers.map((multiplier) => {
    const newSpend = base_spend * multiplier;
    const spendIncreaseFactor = Math.log(multiplier + 1) / Math.log(2);
    const roasAtLevel = overall_roas * Math.pow(1 - diminishingReturnsFactor, spendIncreaseFactor);
    const projectedRevenue = newSpend * roasAtLevel;
    const profitMargin = projectedRevenue - newSpend;

    return {
      spend_multiplier: multiplier,
      projected_spend: newSpend,
      projected_roas: Math.max(roasAtLevel, 0.5),
      projected_revenue: projectedRevenue,
      net_profit: profitMargin,
      profit_margin_pct: (profitMargin / projectedRevenue) * 100,
    };
  });
}

module.exports = {
  analyzePerformanceAndBuildModel,
  createRoasModel,
  projectRevenueScenarios,
};
