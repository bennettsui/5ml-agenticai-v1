const { scoreLead } = require('./leadScoringAgent');
const { generateNurtureSequence } = require('./emailNurtureAgent');
const { enrichLead } = require('./leadIntelligenceAgent');
const { generateDemoAsset } = require('./demoCloserAgent');
const { runCampaignAnalytics } = require('./campaignAnalyticsAgent');
const { generateRetargetingStrategy } = require('./retargetingAgent');
const { optimizeConversions } = require('./conversionOptimizerAgent');

/**
 * SME Growth Orchestrator
 * Layer 6: Orchestration & Workflow
 *
 * Event-driven pipeline for the full SME lead generation lifecycle:
 *
 *   Trigger: NEW_LEAD
 *     → [PARALLEL] Lead Scoring + Lead Intelligence
 *     → Email Nurture Sequence Generation
 *     → Slack/CRM notification with enriched brief
 *
 *   Trigger: DEMO_SCHEDULED
 *     → Demo Prep Asset generation
 *
 *   Trigger: DEMO_COMPLETED
 *     → Post-demo follow-up asset generation
 *
 *   Trigger: NO_SHOW
 *     → No-show recovery sequence
 *
 *   Trigger: CAMPAIGN_REVIEW (weekly cron)
 *     → [PARALLEL] Campaign Analytics + CRO Analysis
 *     → Retargeting strategy refresh
 *
 * 7 agents total:
 *   1. Lead Scoring Agent         — firmographic + AI intent score
 *   2. Lead Intelligence Agent    — ROI estimate + first-touch angle
 *   3. Email Nurture Agent        — 5-email personalised sequence
 *   4. Demo Closer Agent          — prep/follow-up/no-show/objection assets
 *   5. Campaign Analytics Agent   — UTM attribution + CPL analysis
 *   6. Retargeting Agent          — audience segmentation + ad copy
 *   7. Conversion Optimizer Agent — funnel CRO recommendations
 *
 * Model routing:
 *   All agents use DeepSeek Reasoner ($0.14/M in, $0.28/M out)
 *
 * Cost estimates:
 *   - NEW_LEAD pipeline:     ~$0.015/lead
 *   - DEMO pipeline:         ~$0.004/demo stage
 *   - CAMPAIGN_REVIEW:       ~$0.025/weekly run
 *   - Monthly (50 leads/mo): ~$1.50 + $0.025 × 4 weeks = ~$1.60/month
 */

/**
 * NEW_LEAD pipeline — runs immediately on form submission
 * Parallel: score + enrich → serial: nurture sequence
 */
async function handleNewLead(lead) {
  const orchestrationLog = [];
  const startTime = Date.now();

  orchestrationLog.push({
    step: 'init',
    timestamp: new Date().toISOString(),
    message: `🎯 SME Growth Orchestrator: Processing new lead — ${lead.company_name || lead.email}`,
  });

  // PARALLEL: Score + Enrich
  let scoreResult, enrichResult;
  try {
    [scoreResult, enrichResult] = await Promise.all([
      scoreLead(lead).catch(err => ({ error: err.message, total_score: 0, tier: 'cold' })),
      enrichLead(lead).catch(err => ({ error: err.message })),
    ]);

    orchestrationLog.push({
      step: 'scoring_enrichment',
      timestamp: new Date().toISOString(),
      message: `✅ Score: ${scoreResult.total_score}/100 (${scoreResult.tier}) | Intelligence: ${enrichResult.error ? 'failed' : 'enriched'}`,
    });
  } catch (err) {
    orchestrationLog.push({ step: 'scoring_enrichment', error: err.message });
    scoreResult = { total_score: 0, tier: 'cold', label: '❄️ Cold Lead' };
    enrichResult = {};
  }

  // Merge score tier back into lead for nurture personalisation
  const enrichedLead = {
    ...lead,
    lead_score: scoreResult.total_score,
    lead_tier: scoreResult.tier,
  };

  // SERIAL: Generate nurture sequence based on tier
  let nurtureResult;
  try {
    nurtureResult = await generateNurtureSequence(enrichedLead, scoreResult.tier);
    orchestrationLog.push({
      step: 'nurture_sequence',
      timestamp: new Date().toISOString(),
      message: `✅ Generated ${nurtureResult.sequence?.length || 0}-email nurture sequence`,
    });
  } catch (err) {
    orchestrationLog.push({ step: 'nurture_sequence', error: err.message });
    nurtureResult = { error: err.message };
  }

  const totalMs = Date.now() - startTime;

  return {
    trigger: 'NEW_LEAD',
    lead_id: lead.lead_id || lead.id,
    processing_ms: totalMs,
    orchestration_log: orchestrationLog,
    results: {
      scoring: scoreResult,
      intelligence: enrichResult,
      nurture_sequence: nurtureResult,
    },
    summary: {
      tier: scoreResult.tier,
      label: scoreResult.label,
      recommended_action: scoreResult.recommended_action,
      sla_hours: scoreResult.sla_hours,
      first_touch_angle: enrichResult.first_touch_angle,
      predicted_deal_value_hkd: enrichResult.predicted_deal_value_hkd,
      roi_break_even_months: enrichResult.roi_estimate?.break_even_months,
    },
    processed_at: new Date().toISOString(),
  };
}

/**
 * DEMO pipeline — triggered by demo lifecycle events
 */
async function handleDemoEvent(lead, stage, stageData = {}) {
  const orchestrationLog = [];
  const startTime = Date.now();

  orchestrationLog.push({
    step: 'init',
    timestamp: new Date().toISOString(),
    message: `📅 Demo Closer Agent: Stage = ${stage} | Lead = ${lead.company_name || lead.email}`,
  });

  let demoAsset;
  try {
    demoAsset = await generateDemoAsset(lead, stage, stageData);
    orchestrationLog.push({
      step: 'demo_asset',
      timestamp: new Date().toISOString(),
      message: `✅ Demo asset generated for stage: ${stage}`,
    });
  } catch (err) {
    orchestrationLog.push({ step: 'demo_asset', error: err.message });
    demoAsset = { error: err.message };
  }

  return {
    trigger: `DEMO_${stage.toUpperCase()}`,
    lead_id: lead.lead_id || lead.id,
    processing_ms: Date.now() - startTime,
    orchestration_log: orchestrationLog,
    result: demoAsset,
    processed_at: new Date().toISOString(),
  };
}

/**
 * CAMPAIGN_REVIEW pipeline — weekly cron
 * Parallel: Campaign Analytics + CRO Analysis → Serial: Retargeting refresh
 */
async function handleCampaignReview(leads, funnelMetrics, spendData = {}, options = {}) {
  const orchestrationLog = [];
  const startTime = Date.now();

  orchestrationLog.push({
    step: 'init',
    timestamp: new Date().toISOString(),
    message: `📊 Campaign Review: Analysing ${leads.length} leads across ${Object.keys(spendData).length} paid channels`,
  });

  // PARALLEL: Analytics + CRO
  let analyticsResult, croResult;
  try {
    [analyticsResult, croResult] = await Promise.all([
      runCampaignAnalytics(leads, spendData, options)
        .catch(err => ({ error: err.message })),
      optimizeConversions(funnelMetrics, options.currentSetup || {})
        .catch(err => ({ error: err.message })),
    ]);

    orchestrationLog.push({
      step: 'analytics_cro',
      timestamp: new Date().toISOString(),
      message: `✅ Analytics: ${analyticsResult.error ? 'failed' : 'complete'} | CRO: ${croResult.error ? 'failed' : 'complete'}`,
    });
  } catch (err) {
    orchestrationLog.push({ step: 'analytics_cro', error: err.message });
    analyticsResult = {};
    croResult = {};
  }

  // Determine top industry from leads for retargeting
  const topIndustry = leads.length > 0
    ? Object.entries(
        leads.reduce((acc, l) => { acc[l.industry] = (acc[l.industry] || 0) + 1; return acc; }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : 'SME';

  // SERIAL: Retargeting strategy
  let retargetingResult;
  try {
    retargetingResult = await generateRetargetingStrategy({ industry: topIndustry });
    orchestrationLog.push({
      step: 'retargeting',
      timestamp: new Date().toISOString(),
      message: `✅ Generated retargeting strategy for ${retargetingResult.segments?.length || 0} audience segments`,
    });
  } catch (err) {
    orchestrationLog.push({ step: 'retargeting', error: err.message });
    retargetingResult = { error: err.message };
  }

  return {
    trigger: 'CAMPAIGN_REVIEW',
    period: options.period || 'weekly',
    processing_ms: Date.now() - startTime,
    orchestration_log: orchestrationLog,
    results: {
      campaign_analytics: analyticsResult,
      cro_analysis: croResult,
      retargeting: retargetingResult,
    },
    executive_summary: {
      total_leads: leads.length,
      blended_cpl_hkd: analyticsResult.blended_cpl_hkd,
      best_channel: analyticsResult.ai_insights?.best_performing_channel,
      biggest_cro_opportunity: croResult.recommendations?.biggest_opportunity,
      total_retargeting_budget_hkd: retargetingResult.strategy_summary?.total_daily_budget_hkd
        ? retargetingResult.strategy_summary.total_daily_budget_hkd * 7
        : null,
    },
    reviewed_at: new Date().toISOString(),
  };
}

module.exports = {
  handleNewLead,
  handleDemoEvent,
  handleCampaignReview,
};
