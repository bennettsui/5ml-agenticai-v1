const deepseekService = require('../services/deepseekService');

/**
 * Campaign Analytics Agent
 * Layer 3: Analysis & Intelligence
 *
 * Analyses UTM-tagged lead data to:
 *   1. Calculate CPL (Cost Per Lead) by channel if spend data is provided
 *   2. Rank channels by lead quality (avg lead score per source)
 *   3. Identify top-performing campaigns and industries
 *   4. Generate AI-powered optimisation recommendations
 *
 * Input: aggregated leads dataset + optional spend data by channel
 * Output: attribution report + CPL breakdown + AI recommendations
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — analysis
 *
 * Target: <$0.005/analysis run
 */

/**
 * Aggregate raw leads into channel-level metrics
 */
function aggregateByChannel(leads) {
  const channelMap = {};

  for (const lead of leads) {
    const source = lead.utm_source || 'direct';
    const medium = lead.utm_medium || 'none';
    const campaign = lead.utm_campaign || 'none';
    const key = `${source}/${medium}`;

    if (!channelMap[key]) {
      channelMap[key] = {
        source,
        medium,
        lead_count: 0,
        total_score: 0,
        hot_leads: 0,
        warm_leads: 0,
        cold_leads: 0,
        demo_requested: 0,
        demo_completed: 0,
        industries: {},
        campaigns: {},
      };
    }

    const ch = channelMap[key];
    ch.lead_count++;
    ch.total_score += lead.lead_score || 0;
    if (lead.lead_tier === 'hot') ch.hot_leads++;
    else if (lead.lead_tier === 'warm') ch.warm_leads++;
    else ch.cold_leads++;
    if (lead.demo_requested) ch.demo_requested++;
    if (lead.demo_completed) ch.demo_completed++;

    // Industry distribution
    const ind = lead.industry || 'unknown';
    ch.industries[ind] = (ch.industries[ind] || 0) + 1;

    // Campaign breakdown
    ch.campaigns[campaign] = (ch.campaigns[campaign] || 0) + 1;
  }

  // Compute derived metrics
  return Object.values(channelMap).map(ch => ({
    ...ch,
    avg_lead_score: ch.lead_count > 0 ? Math.round(ch.total_score / ch.lead_count) : 0,
    demo_request_rate: ch.lead_count > 0
      ? Math.round((ch.demo_requested / ch.lead_count) * 100)
      : 0,
    top_industry: Object.entries(ch.industries).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
  }));
}

/**
 * Compute funnel conversion rates from leads data
 */
function computeFunnelMetrics(leads) {
  const total = leads.length;
  const demoRequested = leads.filter(l => l.demo_requested).length;
  const demoCompleted = leads.filter(l => l.demo_completed).length;
  const closed = leads.filter(l => l.status === 'closed').length;

  return {
    total_leads: total,
    demo_requested: demoRequested,
    demo_completed: demoCompleted,
    closed_won: closed,
    lead_to_demo_rate: total > 0 ? ((demoRequested / total) * 100).toFixed(1) : 0,
    demo_to_close_rate: demoRequested > 0 ? ((closed / demoRequested) * 100).toFixed(1) : 0,
    demo_show_rate: demoRequested > 0 ? ((demoCompleted / demoRequested) * 100).toFixed(1) : 0,
    overall_conversion_rate: total > 0 ? ((closed / total) * 100).toFixed(1) : 0,
  };
}

/**
 * Main analytics function
 * @param {Array} leads - Array of lead objects from DB
 * @param {Object} spendData - Optional: { 'google/cpc': 5000, 'facebook/social': 3000 } in HKD
 * @param {Object} options - date range and filters
 */
async function runCampaignAnalytics(leads, spendData = {}, options = {}) {
  if (!leads || leads.length === 0) {
    return { error: 'No leads data provided', channels: [], funnel: {}, insights: [] };
  }

  const channelMetrics = aggregateByChannel(leads);
  const funnelMetrics = computeFunnelMetrics(leads);

  // Attach CPL if spend data available
  const channelsWithCPL = channelMetrics.map(ch => {
    const key = `${ch.source}/${ch.medium}`;
    const spend = spendData[key];
    return {
      ...ch,
      spend_hkd: spend || null,
      cpl_hkd: spend && ch.lead_count > 0 ? Math.round(spend / ch.lead_count) : null,
      cost_per_hot_lead: spend && ch.hot_leads > 0 ? Math.round(spend / ch.hot_leads) : null,
    };
  });

  // Sort by avg lead score descending
  channelsWithCPL.sort((a, b) => b.avg_lead_score - a.avg_lead_score);

  // Time period stats
  const dateFrom = options.dateFrom || (leads.length > 0
    ? leads.reduce((min, l) => l.created_at < min ? l.created_at : min, leads[0].created_at)
    : null);
  const dateTo = options.dateTo || new Date().toISOString();

  // AI recommendations
  const summaryForAI = {
    total_leads: leads.length,
    channels: channelsWithCPL.slice(0, 5).map(ch => ({
      channel: `${ch.source}/${ch.medium}`,
      leads: ch.lead_count,
      avg_score: ch.avg_lead_score,
      hot: ch.hot_leads,
      cpl_hkd: ch.cpl_hkd,
    })),
    funnel: funnelMetrics,
    top_industry: leads.reduce((acc, l) => {
      acc[l.industry] = (acc[l.industry] || 0) + 1;
      return acc;
    }, {}),
  };

  let aiInsights = [];
  try {
    const prompt = `You are a growth analytics specialist for RecruitAIStudio, an SME AI automation agency in HK.

Analyse this campaign performance data and provide 4–5 actionable optimisation recommendations.

DATA:
${JSON.stringify(summaryForAI, null, 2)}

TARGET KPIs:
- CPL: <HKD 150
- Lead-to-Demo Rate: >25%
- Demo-to-Close Rate: >30%
- Overall CAC: <HKD 2,000

Provide 4–5 specific, prioritised recommendations. Each must be actionable within 1 week.

Respond with ONLY valid JSON (no markdown):
{
  "insights": [
    {
      "priority": "high|medium|low",
      "category": "budget|targeting|creative|funnel|channel",
      "recommendation": "...",
      "expected_impact": "...",
      "action": "..."
    }
  ],
  "headline_finding": "...",
  "best_performing_channel": "...",
  "quick_win": "..."
}`;

    const response = await deepseekService.chat(
      [{ role: 'user', content: prompt }],
      { maxTokens: 800, temperature: 0.4 }
    );

    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    aiInsights = parsed;
  } catch (err) {
    console.warn('⚠️ CampaignAnalyticsAgent AI insights failed:', err.message);
    aiInsights = {
      insights: [{ priority: 'medium', category: 'funnel', recommendation: 'AI analysis unavailable — review CPL manually by channel.' }],
      headline_finding: 'Manual review recommended.',
      best_performing_channel: channelsWithCPL[0]?.source || 'unknown',
      quick_win: 'Focus budget on highest avg-score channel.',
    };
  }

  return {
    report_period: { from: dateFrom, to: dateTo },
    funnel: funnelMetrics,
    channels: channelsWithCPL,
    total_spend_hkd: Object.values(spendData).reduce((a, b) => a + b, 0) || null,
    blended_cpl_hkd: Object.values(spendData).length > 0 && leads.length > 0
      ? Math.round(Object.values(spendData).reduce((a, b) => a + b, 0) / leads.length)
      : null,
    ai_insights: aiInsights,
    generated_at: new Date().toISOString(),
  };
}

module.exports = { runCampaignAnalytics };
