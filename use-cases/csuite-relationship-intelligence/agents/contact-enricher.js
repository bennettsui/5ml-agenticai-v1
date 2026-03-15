/**
 * Contact Enricher Agent
 *
 * Given a contact record (name, company, title, LinkedIn URL, etc.),
 * performs public-web OSINT research and returns a structured enrichment
 * payload for storage in Postgres.
 *
 * Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)
 * Data policy: public web only — no login, no TOS violation.
 */

'use strict';

const ENRICHER_SYSTEM_PROMPT = `You are a professional contact intelligence analyst.
Your job is to analyse the publicly available information provided about a person and produce a structured enrichment report.

Guidelines:
- Only work with information explicitly provided to you (search snippets, page content, LinkedIn public profile).
- Do NOT fabricate facts. If something is unknown, say so.
- Phrase all assessments professionally and neutrally.
- Avoid labels that could be defamatory or discriminatory.
- Return ONLY valid JSON matching the schema below.

Output schema (JSON):
{
  "summary": "2-3 sentence professional overview",
  "current_role": { "title": "", "company": "", "since": "" },
  "past_roles": [{ "title": "", "company": "", "period": "" }],
  "sectors": ["list of industries / sectors"],
  "expertise_tags": ["list of skill / expertise tags"],
  "geographies": ["regions / countries this person is active in"],
  "notable_projects": ["publicly known projects, publications, talks"],
  "online_presence": [{ "platform": "", "url": "" }],
  "recent_news": ["key recent public news or appearances"],
  "data_confidence": "high | medium | low",
  "data_sources": ["list of sources used"],
  "enriched_at": "ISO date string"
}`;

/**
 * Enrich a contact using publicly available research content.
 *
 * @param {object} contact  - { name, title, company, linkedinUrl, extra }
 * @param {string} researchContent - Raw text from public web / search results
 * @param {object} deps     - { anthropic }
 * @returns {Promise<object>} Parsed enrichment payload
 */
async function enrichContact(contact, researchContent, deps = {}) {
  const { anthropic } = deps;
  if (!anthropic) throw new Error('[ContactEnricher] Anthropic client required');

  const userContent = `Enrich the following contact using the research content provided.

CONTACT:
Name: ${contact.name || 'Unknown'}
Title: ${contact.title || 'Unknown'}
Company: ${contact.company || 'Unknown'}
LinkedIn: ${contact.linkedinUrl || 'Not provided'}
Additional context: ${contact.extra || 'None'}

RESEARCH CONTENT (public web):
${researchContent || 'No research content provided.'}

Produce the JSON enrichment report now.`;

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: ENRICHER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = resp.content[0]?.text || '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    parsed.enriched_at = new Date().toISOString();
    return parsed;
  } catch {
    return { summary: text, data_confidence: 'low', enriched_at: new Date().toISOString() };
  }
}

module.exports = { enrichContact, ENRICHER_SYSTEM_PROMPT };
