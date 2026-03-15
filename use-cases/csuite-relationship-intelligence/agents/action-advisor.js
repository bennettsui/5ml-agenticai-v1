/**
 * Action Advisor Agent
 *
 * Analyses a set of contacts + scores and produces a prioritised weekly
 * action plan for the C-suite user.  Each action includes:
 *  - WHO  — the contact
 *  - WHY  — strategic reason right now
 *  - WHAT — action type (message / intro / meeting / content share)
 *  - HOW  — a short draft message or meeting angle
 *
 * Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)
 */

'use strict';

const ADVISOR_SYSTEM_PROMPT = `You are a strategic chief-of-staff helping a C-suite executive prioritise their relationship actions for the week.

Given a list of contacts with scores, recent news, and the executive's current focus areas, produce a prioritised action plan.

Rules:
- Maximum 7 actions per plan (focus is key).
- Each action must have: who, why_now, action_type, message_draft.
- action_type options: outreach_message | meeting_request | intro_request | content_share | follow_up | congratulate | check_in
- message_draft must be ≤4 sentences, professional, personalised, never generic.
- Always explain WHY this week (news hook, milestone, strategic timing).
- Do NOT mention scores or internal data to the user in the message draft.

Return ONLY valid JSON:
{
  "week_of": "ISO date",
  "focus_summary": "one sentence describing this week's relationship theme",
  "actions": [
    {
      "rank": 1,
      "contact_name": "",
      "contact_company": "",
      "why_now": "",
      "action_type": "",
      "message_draft": "",
      "estimated_impact": "high | medium | low"
    }
  ]
}`;

/**
 * Generate a weekly action plan.
 *
 * @param {Array}  contacts     - Scored contacts [{name, company, scores, recentNews}]
 * @param {string} focusAreas   - Current week's strategic focus
 * @param {object} deps         - { deepseekService, anthropic }
 * @returns {Promise<object>} Action plan
 */
async function generateActionPlan(contacts, focusAreas = '', deps = {}) {
  const { deepseekService, anthropic } = deps;

  const contactsSummary = contacts.slice(0, 20).map((c, i) =>
    `${i + 1}. ${c.name} (${c.title || ''} @ ${c.company || ''})
   Warmth: ${c.warmth_score ?? 'N/A'} | Leverage: ${c.leverage_score ?? 'N/A'} | Biz Potential: ${c.business_potential ?? 'N/A'}
   Priority: ${c.overall_priority || 'unknown'}
   Recent news: ${c.recent_news || 'None'}
   Last interaction: ${c.last_interaction_date || 'Unknown'}`
  ).join('\n\n');

  const userContent = `Generate this week's relationship action plan.

FOCUS AREAS THIS WEEK:
${focusAreas || 'General relationship maintenance and opportunity development.'}

CONTACTS TO CONSIDER (ranked by DB priority):
${contactsSummary || 'No contacts provided.'}

Produce the action plan now.`;

  // Primary: DeepSeek Reasoner
  if (deepseekService) {
    try {
      const result = await deepseekService.chat({
        systemPrompt: ADVISOR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
        model: 'deepseek-reasoner',
      });
      const text = result.content || result.answer || '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('[ActionAdvisor] DeepSeek failed, falling back to Claude Haiku:', err.message);
    }
  }

  // Fallback: Claude Haiku
  if (anthropic) {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: ADVISOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });
    const text = resp.content[0]?.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return { focus_summary: text, actions: [] };
    }
  }

  throw new Error('[ActionAdvisor] No LLM service available');
}

module.exports = { generateActionPlan, ADVISOR_SYSTEM_PROMPT };
