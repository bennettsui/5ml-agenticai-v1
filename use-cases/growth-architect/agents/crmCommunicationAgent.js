/**
 * CRM Communication Agent
 * Designs communication flows (email/WhatsApp drip sequences) and generates EDM HTML
 * Block 3 (CRM assets) + Block 5 (CRM integration)
 *
 * Reads from: crm_clients, growth_experiments, growth_assets
 * Writes to: growth_crm_flows, growth_edm_campaigns
 *
 * Flow types: lead_nurture, post_purchase, re_engagement, upsell, weekly_digest
 * Channels: email, whatsapp, sms
 */

const deepseekService = require('../../../services/deepseekService');
const { getClaudeModel } = require('../../../utils/modelHelper');
const { generateGrowthEdmHtml } = require('../services/growthEdmService');

const CRM_AGENT_PROMPT = `You are a CRM Communication Agent for 5ML. Design customer communication flows and email campaigns.

Flow design principles:
- Each step has: delay (e.g. "1 day", "3 days"), channel (email/whatsapp), purpose, message_brief
- Flows start from a trigger event (lead_captured, purchase_confirmed, 7day_inactive, etc.)
- Include at least one segmentation decision point
- Keep WhatsApp messages ≤300 chars, warm/personal
- Email subjects: curiosity or urgency, ≤50 chars
- Always include an unsubscribe/opt-out in email flows

Trigger events:
- lead_captured: new lead from FB/Google/form
- purchase_confirmed: paid customer
- trial_started: SaaS trial
- 7day_inactive: no login/engagement
- assessment_completed: service delivery milestone
- referral_shared: user shared referral link
- cart_abandoned: ecom cart abandoned

For flow design, output valid JSON:
{
  "flow_name": "...",
  "trigger_event": "...",
  "audience_segment": "...",
  "objective": "...",
  "steps": [
    {
      "step": 1,
      "delay": "immediately",
      "channel": "email",
      "subject": "...",
      "purpose": "...",
      "message_brief": "...",
      "cta": "..."
    }
  ]
}

For EDM campaigns, output valid JSON with content for HTML generation:
{
  "campaign_name": "...",
  "campaign_type": "...",
  "subject": "...",
  "preview_text": "...",
  "hero_headline": "...",
  "hero_subheadline": "...",
  "sections": [{"title": "...", "body": "...", "cta_text": "...", "cta_url": "..."}],
  "footer_note": "..."
}`;

async function designCrmFlow(
  brand_name,
  product_brief,
  icp,
  trigger_event,
  audience_segment,
  flow_type = 'lead_nurture',
  options = {}
) {
  const { model = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  const userPrompt = `Design a CRM communication flow:

Brand: ${brand_name}
Product: ${product_brief}
ICP: ${icp}
Trigger Event: ${trigger_event}
Audience Segment: ${audience_segment}
Flow Type: ${flow_type}

Design a 5–7 step flow. Include mix of email and WhatsApp touchpoints.
Focus on: educating → building trust → driving conversion/retention.`;

  let rawResult;

  try {
    rawResult = await deepseekService.analyze(CRM_AGENT_PROMPT, userPrompt, {
      thinking_budget: 6000,
    });
    modelsUsed.push('deepseek-reasoner');
  } catch (err) {
    console.warn('[crmAgent] DeepSeek error:', err.message);
    if (!no_fallback) {
      const llm = require('../../../lib/llm');
      const r = await llm.chat(
        getClaudeModel('claude'),
        [{ role: 'user', content: `${CRM_AGENT_PROMPT}\n\n${userPrompt}` }],
        { max_tokens: 2500 }
      );
      rawResult = r.text;
      modelsUsed.push(r.model || 'claude-sonnet-4-5');
    } else {
      throw err;
    }
  }

  let flowData;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    flowData = JSON.parse(jsonMatch ? jsonMatch[0] : rawResult);
  } catch (e) {
    console.warn('[crmAgent] JSON parse failed:', e.message);
    flowData = { flow_name: `${brand_name} ${flow_type}`, steps: [], raw: rawResult };
  }

  return {
    brand_name,
    trigger_event,
    audience_segment,
    flow_type,
    flow: flowData,
    _meta: { models_used: modelsUsed, timestamp: new Date().toISOString() },
  };
}

async function generateEdmCampaign(
  brand_name,
  product_brief,
  icp,
  campaign_type,
  campaign_theme,
  options = {}
) {
  const { model = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  const userPrompt = `Generate an EDM (email marketing) campaign:

Brand: ${brand_name}
Product: ${product_brief}
ICP: ${icp}
Campaign Type: ${campaign_type}
Theme/Angle: ${campaign_theme}

Generate compelling email content with hero section, 2-3 content sections, and clear CTA.
Campaign types: lead_nurture | re_engagement | upsell | weekly_update | announcement`;

  let rawResult;

  // Use Claude for HTML-quality EDM writing
  try {
    const llm = require('../../../lib/llm');
    const r = await llm.chat(
      getClaudeModel('claude'),
      [{ role: 'user', content: `${CRM_AGENT_PROMPT}\n\n${userPrompt}` }],
      { max_tokens: 3000 }
    );
    rawResult = r.text;
    modelsUsed.push(r.model || 'claude-sonnet-4-5');
  } catch (claudeErr) {
    console.warn('[crmAgent] Claude error:', claudeErr.message);
    if (!no_fallback) {
      rawResult = await deepseekService.analyze(CRM_AGENT_PROMPT, userPrompt);
      modelsUsed.push('deepseek-reasoner');
    } else {
      throw claudeErr;
    }
  }

  let edmData;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    edmData = JSON.parse(jsonMatch ? jsonMatch[0] : rawResult);
  } catch (e) {
    edmData = {
      campaign_name: `${brand_name} ${campaign_type}`,
      campaign_type,
      subject: `${brand_name} — ${campaign_theme}`,
      preview_text: campaign_theme,
      hero_headline: campaign_theme,
      sections: [],
    };
  }

  // Generate HTML using the growth EDM service
  const html = generateGrowthEdmHtml({
    brand_name,
    campaign_name: edmData.campaign_name || `${brand_name} ${campaign_type}`,
    subject: edmData.subject || '',
    hero_headline: edmData.hero_headline || '',
    hero_subheadline: edmData.hero_subheadline || '',
    sections: edmData.sections || [],
    footer_note: edmData.footer_note || '',
  });

  return {
    brand_name,
    campaign_type,
    campaign_name: edmData.campaign_name || `${brand_name} ${campaign_type}`,
    subject: edmData.subject || '',
    preview_text: edmData.preview_text || '',
    html_content: html,
    raw_data: edmData,
    _meta: { models_used: modelsUsed, timestamp: new Date().toISOString() },
  };
}

module.exports = { designCrmFlow, generateEdmCampaign };
