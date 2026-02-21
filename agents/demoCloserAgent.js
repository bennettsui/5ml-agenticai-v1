const deepseekService = require('../services/deepseekService');

/**
 * Demo Closer Agent
 * Layer 4: Content Generation
 *
 * Generates personalised, stage-aware assets for the demo booking → close pipeline:
 *
 *   Stage: prep         → Pre-demo briefing doc for sales rep + prospect welcome email
 *   Stage: follow_up    → Post-demo follow-up email with custom proposal hooks
 *   Stage: no_show      → No-show recovery sequence (2 touch-points)
 *   Stage: objection    → Objection handler for common SME pushbacks
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — primary
 *
 * Target: <$0.004/asset generation
 */

const COMMON_OBJECTIONS = [
  { objection: 'Too expensive', counter: 'ROI framing + profit-share option' },
  { objection: 'Not the right time', counter: 'January urgency + quick-win framing' },
  { objection: 'We tried AI before and it didn\'t work', counter: 'Custom vs. generic tools distinction' },
  { objection: 'Need to consult my partner/board', counter: 'Decision-making framework + case study' },
  { objection: 'We don\'t have the technical capacity', counter: 'White-glove delivery + no IT needed promise' },
];

/**
 * Generate pre-demo sales briefing + prospect welcome email
 */
async function generateDemoPrep(lead) {
  const firstName = lead.contact_name ? lead.contact_name.split(' ')[0] : 'there';
  const challengeList = Array.isArray(lead.challenges)
    ? lead.challenges.map(c => c.replace(/_/g, ' ')).join(', ')
    : 'operational efficiency';

  const prompt = `You are a senior sales strategist at RecruitAIStudio, an SME AI automation agency in HK.

Generate two assets for an upcoming demo with this prospect:

LEAD PROFILE:
- Name: ${lead.contact_name || 'Unknown'}
- Company: ${lead.company_name || 'Unknown'}
- Industry: ${lead.industry || 'SME'}
- Company Size: ${lead.company_size || 'Unknown'}
- Lead Score: ${lead.lead_score || 'N/A'}/100 (${lead.lead_tier || 'warm'} tier)
- Pain Points: ${challengeList}
- Source: ${lead.utm_source || 'direct'} campaign
- Demo Scheduled: ${lead.demo_scheduled_at ? new Date(lead.demo_scheduled_at).toLocaleDateString('en-HK') : 'TBC'}

ASSET 1 — Sales Rep Briefing (internal):
- Key talking points tailored to their industry + pain points
- 3 qualifying questions to ask early in the call
- Likely objections and how to handle them
- Recommended workflow demos to show (choose 2–3 most relevant)
- Suggested close: standard package vs. profit-share option

ASSET 2 — Prospect Welcome Email (sent 24h before demo):
- Subject line (creates anticipation)
- Short email (80–120 words): reminds them what to expect, builds excitement, attaches agenda
- 3-point agenda: introductions, demo of [relevant workflows], next steps
- PS with a curiosity hook about their specific industry

Respond with ONLY valid JSON (no markdown):
{
  "sales_briefing": {
    "key_talking_points": ["...", "..."],
    "qualifying_questions": ["...", "..."],
    "objection_prep": [{"objection": "...", "response": "..."}],
    "recommended_demos": ["...", "..."],
    "suggested_close": "..."
  },
  "prospect_email": {
    "subject": "...",
    "body": "...",
    "agenda": ["...", "..."],
    "ps_hook": "..."
  }
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 900, temperature: 0.55 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return { stage: 'prep', lead_id: lead.lead_id || lead.id, ...JSON.parse(cleaned), generated_at: new Date().toISOString() };
  } catch {
    return {
      stage: 'prep',
      lead_id: lead.lead_id || lead.id,
      _error: 'Generation failed — use template.',
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * Generate post-demo follow-up email
 */
async function generateDemoFollowUp(lead, demoOutcome = {}) {
  const {
    interest_level = 'medium',
    main_interest = 'AI workflow automation',
    objections_raised = [],
    next_step_agreed = 'proposal review',
  } = demoOutcome;

  const prompt = `You are a B2B sales closer at RecruitAIStudio.

Write a post-demo follow-up email for this prospect. The goal is to maintain momentum and accelerate the decision.

PROSPECT:
- Name: ${lead.contact_name || 'there'}
- Company: ${lead.company_name || 'your company'}
- Industry: ${lead.industry || 'SME'}

DEMO OUTCOME:
- Interest Level: ${interest_level} (low/medium/high)
- Main Interest Shown: ${main_interest}
- Objections Raised: ${objections_raised.join(', ') || 'None'}
- Next Step Agreed: ${next_step_agreed}

EMAIL REQUIREMENTS:
- Subject: personal, references something specific from the demo
- Length: 120–180 words
- Open: reference a specific moment or insight from the demo
- Body: recap the 3 most relevant benefits for their situation, address top objection if any
- Close: clear next step with specific deadline (48 hours)
- Include: link to proposal/pricing [PROPOSAL_LINK], calendar link [CALENDLY_LINK]
- Tone: warm, direct, no corporate fluff

Respond with ONLY valid JSON (no markdown):
{
  "subject": "...",
  "body": "...",
  "next_step": "...",
  "deadline": "...",
  "ps_line": "..."
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 500, temperature: 0.6 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return { stage: 'follow_up', lead_id: lead.lead_id || lead.id, ...JSON.parse(cleaned), generated_at: new Date().toISOString() };
  } catch {
    return {
      stage: 'follow_up',
      lead_id: lead.lead_id || lead.id,
      subject: `Following up on our demo — next steps for ${lead.company_name}`,
      body: 'Thank you for the demo. We'd love to move forward. Please find the proposal attached. Happy to answer any questions.',
      next_step: 'Review proposal and confirm by Friday',
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * Generate no-show recovery sequence (2 emails)
 */
async function generateNoShowRecovery(lead) {
  const prompt = `You are a growth marketer at RecruitAIStudio.

${lead.contact_name ? lead.contact_name.split(' ')[0] : 'A prospect'} from ${lead.company_name || 'an SME'} (${lead.industry || 'SME'} industry) booked a demo but did not attend.

Write 2 recovery touch-points:
1. Reschedule email (send same day, 2h after missed demo) — empathetic, easy one-click reschedule
2. Last-chance offer email (send 2 days later) — add the bonus (free workflow design worth HKD 5,000) to incentivise rescheduling

Each email:
- Subject line
- Body (80–120 words)
- CTA text + placeholder URL

Respond with ONLY valid JSON (no markdown):
{
  "recovery_emails": [
    {
      "send_timing": "...",
      "subject": "...",
      "body": "...",
      "cta_text": "...",
      "cta_url": "..."
    }
  ]
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 600, temperature: 0.6 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return { stage: 'no_show', lead_id: lead.lead_id || lead.id, ...JSON.parse(cleaned), generated_at: new Date().toISOString() };
  } catch {
    return {
      stage: 'no_show',
      lead_id: lead.lead_id || lead.id,
      recovery_emails: [
        {
          send_timing: 'Same day +2h',
          subject: 'We missed you — reschedule your demo in 30 seconds',
          body: 'Hi there, we noticed you weren\'t able to make the demo today. No worries! Click below to pick a new time that works for you.',
          cta_text: 'Reschedule Now',
          cta_url: '[CALENDLY_LINK]',
        },
      ],
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * Handle objection on-demand
 */
async function handleObjection(objectionText, lead = {}) {
  const prompt = `You are a seasoned B2B sales closer at RecruitAIStudio.

A prospect (${lead.company_name || 'HK SME'}, ${lead.industry || 'SME'} industry) raised this objection:
"${objectionText}"

Provide:
1. Immediate verbal response (conversational, 2–3 sentences)
2. Supporting evidence or proof point
3. Reframe to value
4. Closing question after the objection is handled

Respond with ONLY valid JSON (no markdown):
{
  "immediate_response": "...",
  "proof_point": "...",
  "value_reframe": "...",
  "closing_question": "..."
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 400, temperature: 0.5 }
  );

  const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return { stage: 'objection', objection: objectionText, ...JSON.parse(cleaned), generated_at: new Date().toISOString() };
  } catch {
    return {
      stage: 'objection',
      objection: objectionText,
      immediate_response: 'I understand that concern — let me address it directly.',
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * Main entry point — routes to appropriate stage handler
 */
async function generateDemoAsset(lead, stage, stageData = {}) {
  switch (stage) {
    case 'prep': return generateDemoPrep(lead);
    case 'follow_up': return generateDemoFollowUp(lead, stageData);
    case 'no_show': return generateNoShowRecovery(lead);
    case 'objection': return handleObjection(stageData.objection_text || '', lead);
    default: throw new Error(`Unknown demo stage: ${stage}. Use: prep, follow_up, no_show, objection`);
  }
}

module.exports = { generateDemoAsset, COMMON_OBJECTIONS };
