const deepseekService = require('../services/deepseekService');

/**
 * Lead Scoring Agent
 * Layer 3: Analysis & Intelligence
 *
 * Evaluates inbound SME leads using a two-pass scoring system:
 *   Pass 1 — Rule-based firmographic scoring (instant, zero LLM cost)
 *   Pass 2 — AI reasoning over behavioral signals & intent quality (DeepSeek)
 *
 * Output: score (0–100), tier (hot/warm/cold), recommended_action, reasoning
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — intent analysis
 *
 * Target: <$0.003/lead, <3s response
 */

const INDUSTRY_SCORES = {
  finance: 15,
  retail: 15,
  fnb: 15,
  healthcare: 12,
  logistics: 10,
  manufacturing: 10,
  professional: 8,
  other: 5,
};

const CHALLENGE_SCORES = {
  manual_processes: 8,
  data_management: 7,
  customer_follow_up: 8,
  reporting: 6,
  staff_efficiency: 7,
};

const UTM_SOURCE_SCORES = {
  google: 10,
  linkedin: 12,
  facebook: 8,
  instagram: 6,
  direct: 5,
  referral: 15,
  email: 10,
};

/**
 * Pass 1: Rule-based firmographic score (0–60 points)
 */
function computeRuleScore(lead) {
  let score = 0;
  const breakdown = [];

  // Company size
  const sizeMap = { '1-10': 5, '11-50': 15, '51-200': 20, '201+': 25 };
  const sizeScore = sizeMap[lead.company_size] || 0;
  score += sizeScore;
  if (sizeScore > 0) breakdown.push(`Company size (${lead.company_size}): +${sizeScore}`);

  // Industry fit
  const industryScore = INDUSTRY_SCORES[lead.industry] || 5;
  score += industryScore;
  breakdown.push(`Industry (${lead.industry}): +${industryScore}`);

  // Challenges selected (pain point clarity)
  const challenges = Array.isArray(lead.challenges) ? lead.challenges : [];
  const challengeScore = challenges.reduce((acc, c) => acc + (CHALLENGE_SCORES[c] || 5), 0);
  const cappedChallenge = Math.min(challengeScore, 20);
  score += cappedChallenge;
  if (cappedChallenge > 0) breakdown.push(`Pain points (${challenges.length} selected): +${cappedChallenge}`);

  // UTM source quality
  const utmScore = UTM_SOURCE_SCORES[lead.utm_source] || 3;
  score += utmScore;
  breakdown.push(`Traffic source (${lead.utm_source || 'unknown'}): +${utmScore}`);

  // Phone provided = higher intent
  if (lead.phone) {
    score += 8;
    breakdown.push('Phone provided: +8');
  }

  return { score: Math.min(score, 60), breakdown };
}

/**
 * Pass 2: AI reasoning over intent quality (0–40 points)
 */
async function computeAIScore(lead, ruleScore) {
  const prompt = `You are a B2B lead quality analyst for RecruitAIStudio, an SME AI automation agency in Hong Kong.

Evaluate this inbound SME lead and assign an AI score from 0–40 based on intent quality, fit, and conversion likelihood.

LEAD DATA:
- Company: ${lead.company_name || 'Unknown'}
- Industry: ${lead.industry}
- Company Size: ${lead.company_size || 'Not provided'}
- Pain Points: ${Array.isArray(lead.challenges) ? lead.challenges.join(', ') : 'None selected'}
- Message/Context: ${lead.message || 'None'}
- Traffic Source: ${lead.utm_source || 'direct'} / ${lead.utm_medium || 'none'} / ${lead.utm_campaign || 'none'}
- Demo Requested: ${lead.demo_requested ? 'Yes' : 'No'}
- Rule-Based Score: ${ruleScore}/60

SCORING RUBRIC (0–40 points):
- Intent clarity (0–15): Is the pain clearly articulated? Do challenges align with AI automation value?
- Conversion readiness (0–10): Signals of urgency, budget awareness, or explicit demo request?
- Campaign quality (0–8): Was this lead from a high-intent campaign or keyword?
- Message quality (0–7): Is any free-text message substantive and specific?

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "ai_score": <number 0-40>,
  "intent_clarity": <number 0-15>,
  "conversion_readiness": <number 0-10>,
  "campaign_quality": <number 0-8>,
  "message_quality": <number 0-7>,
  "reasoning": "<2-3 sentence explanation of the score>",
  "top_trigger": "<single most compelling signal for sales to mention on first call>"
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 400, temperature: 0.3 }
  );

  try {
    return JSON.parse(response.content.trim());
  } catch {
    // Fallback if JSON parse fails
    return {
      ai_score: 15,
      intent_clarity: 7,
      conversion_readiness: 4,
      campaign_quality: 3,
      message_quality: 1,
      reasoning: 'AI scoring unavailable — defaulting to mid-range assessment.',
      top_trigger: 'Pain points indicate automation readiness.',
    };
  }
}

/**
 * Map total score to tier + recommended action
 */
function deriveTier(totalScore) {
  if (totalScore >= 75) {
    return {
      tier: 'hot',
      label: '🔥 Hot Lead',
      recommended_action: 'Call within 2 hours. Prioritize demo booking. Offer to waive setup fee.',
      sla_hours: 2,
    };
  }
  if (totalScore >= 50) {
    return {
      tier: 'warm',
      label: '♨️ Warm Lead',
      recommended_action: 'Send personalised use-case email within 4 hours. Follow up by phone next business day.',
      sla_hours: 4,
    };
  }
  return {
    tier: 'cold',
    label: '❄️ Cold Lead',
    recommended_action: 'Enter into automated nurture sequence. Revisit if they open 3+ emails or click CTA.',
    sla_hours: 48,
  };
}

/**
 * Main entry point
 * @param {Object} lead - Lead data object
 * @returns {Object} Scoring result
 */
async function scoreLead(lead) {
  const startTime = Date.now();

  // Pass 1: rule-based
  const { score: ruleScore, breakdown } = computeRuleScore(lead);

  // Pass 2: AI reasoning
  let aiResult;
  try {
    aiResult = await computeAIScore(lead, ruleScore);
  } catch (err) {
    console.warn('⚠️ LeadScoringAgent AI pass failed, using rule-only score:', err.message);
    aiResult = {
      ai_score: 10,
      reasoning: 'AI pass unavailable — rule-based score only.',
      top_trigger: 'Review pain points manually.',
    };
  }

  const totalScore = Math.min(ruleScore + (aiResult.ai_score || 10), 100);
  const tierData = deriveTier(totalScore);

  return {
    lead_id: lead.lead_id || lead.id,
    total_score: totalScore,
    rule_score: ruleScore,
    ai_score: aiResult.ai_score || 10,
    ...tierData,
    score_breakdown: breakdown,
    ai_reasoning: aiResult.reasoning,
    top_trigger: aiResult.top_trigger,
    sub_scores: {
      intent_clarity: aiResult.intent_clarity,
      conversion_readiness: aiResult.conversion_readiness,
      campaign_quality: aiResult.campaign_quality,
      message_quality: aiResult.message_quality,
    },
    scored_at: new Date().toISOString(),
    processing_ms: Date.now() - startTime,
  };
}

module.exports = { scoreLead };
