// ClientFeedbackAgent
// Reads client revision comments and translates them into:
//  - Concrete prompt / negative prompt changes
//  - ComfyUI / AnimateDiff node graph change suggestions
//  - LoRA weight adjustments
//  - Sampler / CFG / steps recommendations
//
// This makes the revision cycle "agentic" — the art director
// pastes the client comment and gets actionable parameter changes,
// not just vague guidance.
//
// Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class ClientFeedbackAgent {
  constructor(anthropic, pool) {
    this.anthropic = anthropic;
    this.pool = pool;
    this.name = 'ClientFeedbackAgent';
  }

  // ── Parse client feedback → parameter changes ─────────────────────────────
  async parseFeedback({ feedback, currentPrompt, currentWorkflow, styleGuide, briefSpec }) {
    const systemPrompt = `You are a senior AI operator at a creative agency.
A client has provided revision feedback on an AI-generated asset.
Your job is to translate that feedback into PRECISE parameter changes for:
  1. Prompt modifications (what to add/remove/strengthen)
  2. ComfyUI node adjustments (sampler, CFG, steps, resolution)
  3. LoRA adjustments (weights, swap to different LoRA)
  4. AnimateDiff / SVD motion adjustments (if video)

Return ONLY JSON:
{
  "feedbackSummary": "string — one sentence re-stating what client wants",
  "promptChanges": {
    "addToPositive": ["string"],
    "removeFromPositive": ["string"],
    "addToNegative": ["string"],
    "removeFromNegative": ["string"],
    "rewriteSuggestion": "string or null — full rewrite if major change needed"
  },
  "workflowChanges": {
    "cfgScale": "number or null — new CFG value",
    "steps": "number or null",
    "sampler": "string or null",
    "resolutionChange": "string or null — e.g. 'switch to portrait916'",
    "notes": "string"
  },
  "loraChanges": [
    { "loraName": "string", "action": "increase_weight|decrease_weight|remove|add", "newWeight": "number or null", "reason": "string" }
  ],
  "motionChanges": {
    "motionStrength": "number or null",
    "motionKeywordsAdd": ["string"],
    "motionKeywordsRemove": ["string"],
    "frameCount": "number or null"
  },
  "priorityLevel": "critical|major|minor",
  "estimatedReworkTime": "string — e.g. '1 ComfyUI batch run'",
  "approachNotes": "string — how the art director / operator should tackle this revision"
}`;

    const userContent = `CLIENT FEEDBACK:
"${feedback}"

CURRENT POSITIVE PROMPT:
${currentPrompt?.positive || 'N/A'}

CURRENT NEGATIVE PROMPT:
${currentPrompt?.negative || 'N/A'}

CURRENT WORKFLOW SETTINGS:
${JSON.stringify(currentWorkflow || {}, null, 2)}

BRAND STYLE GUIDE TOKENS:
${styleGuide?.styleTokenBlock || 'N/A'}

BRAND AVOID LIST:
${briefSpec?.brand?.avoidList?.join(', ') || 'N/A'}`;

    try {
      let rawJson;
      const messages = [{ role: 'user', content: userContent }];
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned);

      // Persist feedback + suggested changes
      await this.pool.query(
        `INSERT INTO media_feedback
           (project_id, asset_id, feedback_text, changes_json, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          userContent.projectId || null,
          userContent.assetId || null,
          feedback,
          JSON.stringify(result),
        ]
      ).catch(() => {}); // non-fatal if table not ready

      return result;
    } catch (err) {
      console.error(`[${this.name}] Feedback parsing failed:`, err.message);
      return {
        feedbackSummary: 'Unable to parse feedback automatically',
        promptChanges: { addToPositive: [], removeFromPositive: [], addToNegative: [], removeFromNegative: [], rewriteSuggestion: null },
        workflowChanges: { notes: `Error: ${err.message}` },
        loraChanges: [],
        motionChanges: {},
        priorityLevel: 'minor',
        approachNotes: 'Manual review needed.',
      };
    }
  }

  // ── Get revision history for an asset ────────────────────────────────────
  async getRevisionHistory(assetId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM media_feedback WHERE asset_id = $1 ORDER BY created_at ASC`,
        [assetId]
      );
      return result.rows;
    } catch {
      return [];
    }
  }

  // ── Apply parsed changes to a prompt record ───────────────────────────────
  applyChangesToPrompt(currentPrompt, changes) {
    const { addToPositive = [], removeFromPositive = [], addToNegative = [], removeFromNegative = [] } = changes.promptChanges || {};

    if (changes.promptChanges?.rewriteSuggestion) {
      return { ...currentPrompt, positive: changes.promptChanges.rewriteSuggestion };
    }

    let positive = currentPrompt.positive || '';
    let negative = currentPrompt.negative || '';

    // Remove unwanted terms
    for (const term of removeFromPositive) {
      positive = positive.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').replace(/,\s*,/g, ',').trim();
    }
    for (const term of removeFromNegative) {
      negative = negative.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').replace(/,\s*,/g, ',').trim();
    }

    // Add new terms
    if (addToPositive.length) positive = [positive, ...addToPositive].filter(Boolean).join(', ');
    if (addToNegative.length) negative = [negative, ...addToNegative].filter(Boolean).join(', ');

    return { ...currentPrompt, positive, negative };
  }
}

module.exports = ClientFeedbackAgent;
