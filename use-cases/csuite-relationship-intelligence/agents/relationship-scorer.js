/**
 * Relationship Scorer Agent
 *
 * Scores a contact across three dimensions:
 *  1. warmth_score       — How strong and recent is the relationship?
 *  2. leverage_score     — Can this person open doors to others?
 *  3. business_potential — Fit with current strategic initiatives?
 *
 * Returns normalised 0–100 scores + rationale for each.
 *
 * Model: Claude Haiku (fast, structured output)
 */

'use strict';

const SCORER_SYSTEM_PROMPT = `You are a relationship intelligence scoring engine for a C-suite executive.
Given contact data and interaction history, score the contact on three dimensions (0-100 each) and explain your reasoning.

Scoring rubric:
- warmth_score: recency of last interaction (50%), frequency (30%), depth/quality of past conversations (20%)
- leverage_score: seniority/influence (40%), network breadth (30%), cross-sector reach (30%)
- business_potential: alignment with stated initiatives (50%), decision-making power (30%), willingness to collaborate (20%)

Return ONLY valid JSON:
{
  "warmth_score": 0-100,
  "warmth_rationale": "...",
  "leverage_score": 0-100,
  "leverage_rationale": "...",
  "business_potential": 0-100,
  "business_rationale": "...",
  "overall_priority": "high | medium | low",
  "recommended_action": "one-sentence recommended next step",
  "scored_at": "ISO date string"
}`;

/**
 * Score a contact relationship.
 *
 * @param {object} contact       - Contact record from DB
 * @param {Array}  interactions  - Recent interactions [{date, type, summary}]
 * @param {string} initiatives   - Current strategic initiatives context
 * @param {object} deps          - { anthropic }
 * @returns {Promise<object>} Scores + rationale
 */
async function scoreRelationship(contact, interactions = [], initiatives = '', deps = {}) {
  const { anthropic } = deps;
  if (!anthropic) throw new Error('[RelationshipScorer] Anthropic client required');

  const userContent = `Score this contact relationship.

CONTACT:
Name: ${contact.name}
Role: ${contact.title || 'Unknown'} at ${contact.company || 'Unknown'}
Sectors: ${(contact.sectors || []).join(', ') || 'Unknown'}
Relationship type: ${contact.relationship_type || 'contact'}

INTERACTION HISTORY (most recent first):
${interactions.length > 0
    ? interactions.slice(0, 10).map(i => `- [${i.date}] ${i.type}: ${i.summary}`).join('\n')
    : 'No interactions recorded.'}

CURRENT STRATEGIC INITIATIVES:
${initiatives || 'Not specified.'}

Score now.`;

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SCORER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = resp.content[0]?.text || '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    parsed.scored_at = new Date().toISOString();
    return parsed;
  } catch {
    return {
      warmth_score: null,
      leverage_score: null,
      business_potential: null,
      overall_priority: 'unknown',
      recommended_action: text,
      scored_at: new Date().toISOString(),
    };
  }
}

module.exports = { scoreRelationship, SCORER_SYSTEM_PROMPT };
