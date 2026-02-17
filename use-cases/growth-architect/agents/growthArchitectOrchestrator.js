/**
 * Growth Architect Orchestrator
 * Main orchestrating agent that generates full 6-block growth plans
 * Coordinates Strategy Agent and generates comprehensive growth strategies
 */

const deepseekService = require('../../../services/deepseekService');
const { analyzeGrowthStrategy } = require('./strategyAgent');
const { getClaudeModel } = require('../../../utils/modelHelper');

const GROWTH_ARCHITECT_SYSTEM_PROMPT = `You are 5ML Growth Architect, an AI growth strategist and orchestrating agent working for 5 Miles Lab.

Mission:
- Turn any product or service into a concrete, testable, data-driven agentic growth system.
- Your plans must be directly usable by marketing operators, engineers, and founders.

About 5 Miles Lab:
- 5ML is a creative + technical growth studio based in Hong Kong.
- We are strong in: Paid media (Facebook/Instagram/Google Search/GDN), Copy & creative (nanobanana), Social content, Ad performance analytics, Agentic automation.
- We are building this as a productized growth solution.

Your process for EACH product/service generates 6 BLOCKS:

**Block 1: Product–Market Fit & ICP Clarification**
- WHO: Target customer segments, pains, desired outcomes
- Define hypotheses: WHO, WHAT value, WHICH channels
- Specify what to store in knowledge base

**Block 2: Funnel & Growth Loop Architecture**
- Design AARRR funnel: Awareness, Acquisition, Activation, Revenue, Retention, Referral
- Design growth loops: Node → Node → Node (with feedback)
- Mark where FB/GDN/SEM act as main engine, where KOL/social/CRM plug in

**Block 3: Assets & Content Plan (agentic)**
- Copy Agent (nanobanana): ad copy, landing copy, email, video scripts
- Social Agent: social posts, KOL briefs, educational content
- Specify funnel stage, core message, example hooks/angles
- Tag assets for experiment tracking

**Block 4: Tracking, Metrics & Financial ROAS Model**
- List tracking events and conversions
- Define funnel KPIs: CTR, CPC, CVR, CPA, LTV/CAC, ROAS
- ROAS structure: Revenue/Spend, break-even ROAS, scaling impact

**Block 5: Execution Infrastructure & Integrations (agentic workflow)**
- Data / Knowledge base layer
- Orchestration layer (you + other agents)
- Channel & tool layer (ad platforms, website, CRM)
- For each integration: what events to capture, how agents use data

**Block 6: Weekly Review & Optimization Loop**
- What system auto-prepares: summary, metrics, anomalies, experiment results
- What humans decide: scale/pause/pivot experiments
- Build–Measure–Learn loop with agents doing measure/compute/prepare work

Output MUST be valid JSON with all 6 blocks.`;

async function generateGrowthPlan(brand_name, product_brief, icp_initial = null, options = {}) {
  const { model = 'deepseek', no_fallback = false, db = null } = options;
  const modelsUsed = [];

  try {
    console.log(`\n🎯 Growth Architect: Generating plan for ${brand_name}`);

    // Step 1: Strategy Agent analyzes product and generates ICP, hypotheses, funnel
    console.log('📊 Strategy Agent: Analyzing growth strategy...');
    const strategyAnalysis = await analyzeGrowthStrategy(
      brand_name,
      product_brief,
      icp_initial,
      ['facebook', 'google', 'linkedin', 'email', 'kol', 'social'],
      { model }
    );
    modelsUsed.push(...(strategyAnalysis._meta?.models_used || []));

    // Step 2: Orchestrator synthesizes into 6-block plan
    console.log('🏗️ Orchestrator: Synthesizing 6-block growth plan...');

    const sixBlockPrompt = `Based on this growth analysis, generate a comprehensive 6-block growth plan:

Brand: ${brand_name}
Product: ${product_brief}

Analysis Results:
${JSON.stringify(strategyAnalysis, null, 2)}

Generate a complete 6-BLOCK GROWTH PLAN (valid JSON):
{
  "block_1": {
    "icp_segments": [...],
    "value_prop": "...",
    "hypotheses": [...]
  },
  "block_2": {
    "funnel_stages": { "awareness": {...}, "acquisition": {...}, ... },
    "growth_loops": [{"name": "...", "description": "...", "nodes": [...]}],
    "primary_engine": "facebook/google ads",
    "supporting_channels": [...]
  },
  "block_3": {
    "copy_assets": [{"stage": "...", "type": "...", "examples": [...]}],
    "social_assets": [{"platform": "...", "type": "...", "examples": [...]}],
    "asset_tags": ["A1-problem-focused", ...]
  },
  "block_4": {
    "tracking_events": [...],
    "key_kpis": ["ctr", "cpc", "cvr", "cpa", "roas", "ltv_cac"],
    "roas_model": {"formula": "Revenue/Spend", "break_even": "1/margin%", "scaling_formula": "..."}
  },
  "block_5": {
    "agents": ["orchestrator", "strategy", "copy", "social", "crm", "analytics"],
    "integrations": ["facebook ads api", "google ads api", "crm", "stripe/ecom"],
    "workflow_loop": "Perceive → Plan → Act → Learn"
  },
  "block_6": {
    "weekly_schedule": "Monday 09:00 HKT",
    "metrics_to_review": [...],
    "experiment_review_process": "...",
    "escalation_thresholds": {...}
  }
}`;

    let planResult;

    try {
      planResult = await deepseekService.analyze(GROWTH_ARCHITECT_SYSTEM_PROMPT, sixBlockPrompt, {
        thinking_budget: 12000,
      });
      modelsUsed.push('deepseek-reasoner');
    } catch (deepseekError) {
      console.warn('DeepSeek error:', deepseekError.message);
      if (!no_fallback) {
        const response = await (global.claudeLLM || require('../../../lib/llm')).chat(
          getClaudeModel('claude'),
          [
            {
              role: 'user',
              content: `${GROWTH_ARCHITECT_SYSTEM_PROMPT}\n\n${sixBlockPrompt}`,
            },
          ],
          { max_tokens: 4000 }
        );
        planResult = response.text;
        modelsUsed.push(response.model || 'claude-sonnet-4-5');
      } else {
        throw deepseekError;
      }
    }

    // Parse and structure plan
    let parsedPlan;
    try {
      const jsonMatch = planResult.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : planResult;
      parsedPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse plan JSON:', parseError.message);
      parsedPlan = { raw_response: planResult };
    }

    // Save to database if pool provided
    let planId = null;
    if (db && db.pool) {
      try {
        const result = await db.pool.query(
          `INSERT INTO growth_plans (brand_name, plan_data, status, phase)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [brand_name, JSON.stringify(parsedPlan), 'active', 'pmf']
        );
        planId = result.rows[0]?.id;
        console.log(`✅ Plan saved with ID: ${planId}`);

        // Save key experiments as hypotheses
        if (
          parsedPlan.block_1 &&
          parsedPlan.block_1.hypotheses &&
          Array.isArray(parsedPlan.block_1.hypotheses)
        ) {
          for (const hypothesis of parsedPlan.block_1.hypotheses) {
            await db.pool.query(
              `INSERT INTO growth_experiments (plan_id, brand_name, hypothesis, status, tags)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                planId,
                brand_name,
                hypothesis,
                'pending',
                JSON.stringify(['primary-hypothesis']),
              ]
            );
          }
          console.log(`✅ Saved ${parsedPlan.block_1.hypotheses.length} hypotheses`);
        }
      } catch (dbError) {
        console.error('Error saving plan to DB:', dbError.message);
      }
    }

    return {
      plan_id: planId,
      brand_name,
      plan: parsedPlan,
      _meta: {
        models_used: [...new Set(modelsUsed)],
        timestamp: new Date().toISOString(),
        strategy_analysis: strategyAnalysis,
      },
    };
  } catch (error) {
    console.error('Growth Architect Orchestrator error:', error.message);
    throw error;
  }
}

module.exports = {
  generateGrowthPlan,
};
