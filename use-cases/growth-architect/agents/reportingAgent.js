/**
 * Growth Reporting Agent
 * Generates weekly reviews and optimization recommendations
 * Handles Block 6 (Weekly Review & Optimization Loop)
 */

const deepseekService = require('../../../services/deepseekService');
const { getClaudeModel } = require('../../../utils/modelHelper');

async function generateWeeklyReview(db, brand_name, week_start, week_end, options = {}) {
  const { model = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  try {
    // Fetch data for the week
    let metrics = {};
    let experimentsRunning = [];
    let pastPlan = {};

    if (db && db.pool) {
      // Get metrics for the week
      try {
        const metricsResult = await db.pool.query(
          `SELECT * FROM growth_metrics_snapshots
           WHERE brand_name = $1 AND snapshot_date >= $2 AND snapshot_date <= $3
           ORDER BY snapshot_date DESC`,
          [brand_name, week_start, week_end]
        );
        metrics = metricsResult.rows || [];
      } catch (e) {
        console.warn('Could not fetch metrics:', e.message);
      }

      // Get running experiments
      try {
        const expResult = await db.pool.query(
          `SELECT * FROM growth_experiments
           WHERE brand_name = $1 AND status IN ('running', 'completed')
           ORDER BY updated_at DESC LIMIT 10`,
          [brand_name]
        );
        experimentsRunning = expResult.rows || [];
      } catch (e) {
        console.warn('Could not fetch experiments:', e.message);
      }

      // Get latest growth plan
      try {
        const planResult = await db.pool.query(
          `SELECT plan_data FROM growth_plans
           WHERE brand_name = $1 AND status = 'active'
           ORDER BY created_at DESC LIMIT 1`,
          [brand_name]
        );
        pastPlan = planResult.rows?.[0]?.plan_data || {};
      } catch (e) {
        console.warn('Could not fetch plan:', e.message);
      }
    }

    // Build summary from data
    const systemPrompt = `You are a Growth Reporting Agent for 5ML. Generate a weekly growth review with:
1. Key Metrics Summary - CTR, CPC, ROAS, spend, revenue trends
2. Experiment Results - what ran, what worked, what failed
3. Anomalies - unusual spikes/dips in performance
4. Recommendations - 3-5 actionable next steps
5. Strategic Priorities - what to scale/pause/pivot

Output as valid JSON with these exact keys:
{
  "week_summary": "...",
  "key_metrics": { "ctr": ..., "cpc": ..., "roas": ..., "spend": ..., "revenue": ... },
  "experiment_results": [{ "hypothesis": "...", "status": "...", "learning": "..." }],
  "anomalies": [...],
  "recommendations": [...],
  "scale_experiments": [...],
  "pause_experiments": [...],
  "pivot_hypotheses": [...]
}`;

    const userPrompt = `Generate weekly review for ${brand_name}:

Week: ${week_start} to ${week_end}

Metrics (last 7 days):
${JSON.stringify(metrics, null, 2)}

Active Experiments:
${JSON.stringify(experimentsRunning, null, 2)}

Current Growth Plan Phase: ${pastPlan.phase || 'unknown'}
Channels: ${pastPlan.recommended_channels ? pastPlan.recommended_channels.join(', ') : 'unknown'}

Provide actionable review and recommendations for next week.`;

    let reviewResult;

    // Try DeepSeek
    if (model === 'deepseek') {
      try {
        reviewResult = await deepseekService.analyze(systemPrompt, userPrompt, {
          thinking_budget: 5000,
        });
        modelsUsed.push('deepseek-reasoner');
      } catch (deepseekError) {
        console.warn('DeepSeek error:', deepseekError.message);
        if (!no_fallback) {
          const response = await (global.claudeLLM || require('../../../lib/llm')).chat(
            getClaudeModel('claude'),
            [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
            { max_tokens: 2000 }
          );
          reviewResult = response.text;
          modelsUsed.push(response.model || 'claude-sonnet-4-5');
        } else {
          throw deepseekError;
        }
      }
    }

    // Parse JSON response
    let parsedReview;
    try {
      const jsonMatch = reviewResult.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : reviewResult;
      parsedReview = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse review JSON:', parseError.message);
      parsedReview = { raw_response: reviewResult };
    }

    return {
      brand_name,
      week_start,
      week_end,
      summary: {
        week_summary: parsedReview.week_summary || '',
        key_metrics: parsedReview.key_metrics || {},
        experiment_results: parsedReview.experiment_results || [],
        anomalies: parsedReview.anomalies || [],
        recommendations: parsedReview.recommendations || [],
      },
      actions: {
        scale: parsedReview.scale_experiments || [],
        pause: parsedReview.pause_experiments || [],
        pivot: parsedReview.pivot_hypotheses || [],
      },
      _meta: {
        models_used: modelsUsed,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Reporting Agent error:', error.message);
    throw error;
  }
}

module.exports = {
  generateWeeklyReview,
};
