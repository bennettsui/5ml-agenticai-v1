const deepseekService = require('../services/deepseekService');

/**
 * Email Nurture Agent
 * Layer 4: Content Generation
 *
 * Generates a 5-email personalised nurture sequence for SME leads.
 * Each email is tailored by industry, challenges, company size, and lead tier.
 *
 * Sequence cadence (mirrors the Growth Architect document):
 *   Email 1 (T+0):   Instant welcome + AI report teaser
 *   Email 2 (T+1d):  3 industry-specific AI workflow examples
 *   Email 3 (T+3d):  Relevant customer success story
 *   Email 4 (T+5d):  Pricing transparency + January special
 *   Email 5 (T+7d):  Last-chance offer + unsubscribe option
 *
 * Model routing:
 *   - DeepSeek Reasoner ($0.14/M in, $0.28/M out) — primary
 *
 * Target: <$0.008/sequence, <10s response
 */

const INDUSTRY_PAIN_MAPS = {
  finance: {
    workflows: ['Smart compliance document parser', 'Automated KYC/AML risk flagging', 'Real-time P&L dashboard with AI narrative'],
    stats: ['65% reduction in manual document review', '3× faster client onboarding', 'HKD 25,000+/month saved on ops'],
    case_industry: 'financial advisory firm',
  },
  retail: {
    workflows: ['Inventory reorder prediction agent', 'Customer churn early-warning system', 'Personalised promotion generator'],
    stats: ['40% reduction in overstock costs', '2× faster seasonal planning', 'HKD 18,000+/month saved'],
    case_industry: 'retail chain',
  },
  fnb: {
    workflows: ['Smart invoice & supplier reconciliation', 'Customer reservation & follow-up bot', 'Weekly food-cost intelligence report'],
    stats: ['30 hours/week saved on admin', '25% increase in repeat reservations', 'HKD 15,000+/month saved'],
    case_industry: 'F&B group',
  },
  healthcare: {
    workflows: ['Patient appointment reminder agent', 'Insurance claim pre-check bot', 'Staff scheduling optimiser'],
    stats: ['50% drop in no-shows', '2× faster claim approvals', 'HKD 20,000+/month saved'],
    case_industry: 'clinic group',
  },
  logistics: {
    workflows: ['Shipment delay alert & re-route agent', 'Driver scheduling optimiser', 'Supplier performance tracker'],
    stats: ['35% fewer delivery exceptions', '20% fuel cost reduction', 'HKD 22,000+/month saved'],
    case_industry: 'logistics company',
  },
  professional: {
    workflows: ['Proposal & engagement letter generator', 'Client project status digest', 'Billable hours leakage detector'],
    stats: ['5 hours/week saved per consultant', '15% higher utilisation rate', 'HKD 12,000+/month saved'],
    case_industry: 'professional services firm',
  },
  manufacturing: {
    workflows: ['Predictive maintenance alert agent', 'Quality control image inspection bot', 'Production schedule optimiser'],
    stats: ['40% fewer unplanned shutdowns', '3× faster QC checks', 'HKD 30,000+/month saved'],
    case_industry: 'manufacturer',
  },
};

function getIndustryContext(industry) {
  return INDUSTRY_PAIN_MAPS[industry] || {
    workflows: ['Automated document processing', 'AI-powered customer follow-up', 'Weekly business intelligence report'],
    stats: ['40% reduction in manual tasks', '3× faster customer response', 'HKD 15,000+/month saved'],
    case_industry: 'SME',
  };
}

/**
 * Generate all 5 emails in one DeepSeek call to minimise cost
 */
async function generateNurtureSequence(lead, tier = 'warm') {
  const ctx = getIndustryContext(lead.industry);
  const challengeList = Array.isArray(lead.challenges) && lead.challenges.length > 0
    ? lead.challenges.map(c => c.replace(/_/g, ' ')).join(', ')
    : 'operational efficiency';

  const urgencyNote = tier === 'hot'
    ? 'This is a hot lead. Use stronger urgency language and mention the January setup-fee waiver prominently.'
    : tier === 'cold'
    ? 'This is a cold lead. Keep tone low-pressure and value-first. Focus on education over hard sell.'
    : 'This is a warm lead. Balance value-driven content with clear CTAs.';

  const prompt = `You are a senior growth marketer at RecruitAIStudio, an SME AI automation agency in Hong Kong.
Write a 5-email nurture sequence for the following lead. ${urgencyNote}

LEAD PROFILE:
- First Name: ${lead.contact_name ? lead.contact_name.split(' ')[0] : 'there'}
- Company: ${lead.company_name || 'your company'}
- Industry: ${lead.industry || 'SME'}
- Company Size: ${lead.company_size || 'SME'}
- Pain Points: ${challengeList}
- Lead Tier: ${tier.toUpperCase()}

INDUSTRY CONTEXT:
- Relevant AI Workflows: ${ctx.workflows.join(' | ')}
- Benchmark Results: ${ctx.stats.join(' | ')}
- Reference Case: ${ctx.case_industry}

EMAIL SEQUENCE STRUCTURE:
1. T+0 min: Welcome + AI report teaser. Subject must create curiosity. CTA: Download Report.
2. T+1 day: 3 industry-specific AI workflow examples (use the workflows above). CTA: Book Demo.
3. T+3 days: Customer success story from a similar ${ctx.case_industry} (fictional but realistic). CTA: Read Case Study / Book Strategy Session.
4. T+5 days: Pricing transparency — HKD 8,800/month + HKD 15,000 setup (waived in January). ROI math. CTA: Book 15-min call.
5. T+7 days: Last-chance soft close with bonus (free workflow design HKD 5,000 value). Include unsubscribe option.

REQUIREMENTS:
- Each email: subject line, preview text (1 sentence), full body (150–250 words), CTA button text + URL placeholder
- Tone: professional but conversational, Hong Kong SME context, no jargon
- Sender for emails 1, 3, 5: "RecruitAIStudio Team <hello@recruitaistudio.com>"
- Sender for emails 2, 4: "David Chan <david@recruitaistudio.com>"
- Use {{first_name}}, {{company_name}}, {{industry}} placeholders where personalisation applies
- CTA links use placeholder: [CALENDLY_LINK], [REPORT_LINK], [CASE_STUDY_LINK]

Respond with ONLY valid JSON (no markdown fences):
{
  "sequence": [
    {
      "email_number": 1,
      "send_delay": "T+0",
      "sender": "...",
      "subject": "...",
      "preview_text": "...",
      "body": "...",
      "cta_text": "...",
      "cta_url": "..."
    }
  ]
}`;

  const response = await deepseekService.chat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 3000, temperature: 0.65 }
  );

  let parsed;
  try {
    // Strip markdown code fences if present
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Return a minimal fallback structure
    parsed = {
      sequence: [
        {
          email_number: 1,
          send_delay: 'T+0',
          sender: 'RecruitAIStudio Team <hello@recruitaistudio.com>',
          subject: `Your Free AI Assessment is Ready`,
          preview_text: `See the top 3 automation wins for your ${lead.industry} business.`,
          body: `Hi {{first_name}},\n\nThank you for your interest in AI automation. We've prepared a custom assessment for {{company_name}} based on your industry and challenges.\n\nWe'll be in touch shortly with your personalised report.\n\nBest,\nThe RecruitAIStudio Team`,
          cta_text: 'Download Your Report',
          cta_url: '[REPORT_LINK]',
        },
      ],
      _error: 'Full sequence generation failed — partial fallback returned.',
    };
  }

  return {
    lead_id: lead.lead_id || lead.id,
    industry: lead.industry,
    tier,
    ...parsed,
    generated_at: new Date().toISOString(),
    model: response.model || 'deepseek-reasoner',
  };
}

module.exports = { generateNurtureSequence };
