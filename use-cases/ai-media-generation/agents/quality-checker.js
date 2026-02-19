// QualityCheckerAgent
// Pre-delivery checklist: brand compliance, artifact detection, legal/safety.
// When an image URL is provided it uses Claude Sonnet Vision.
// Can also run a text-only check against the prompt + brief.
// Model: Claude Sonnet (vision) — only for actual image review

const { getClaudeModel } = require('../../../utils/modelHelper');

class QualityCheckerAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'QualityCheckerAgent';
  }

  // ── Text-based prompt / config QC ─────────────────────────────────────────
  async checkPromptQuality(prompt, briefSpec) {
    const checks = [];

    // 1. Negative prompt present
    if (!prompt.negative || prompt.negative.trim().length < 10) {
      checks.push({ type: 'error', code: 'NO_NEGATIVE_PROMPT', message: 'Negative prompt is missing or too short.' });
    }

    // 2. Brand avoidList honoured
    const avoidList = briefSpec?.brand?.avoidList || [];
    for (const term of avoidList) {
      if (prompt.positive?.toLowerCase().includes(term.toLowerCase())) {
        checks.push({ type: 'error', code: 'BRAND_VIOLATION', message: `Positive prompt contains brand-excluded term: "${term}"` });
      }
    }

    // 3. Prompt length sanity
    if (prompt.positive?.length > 1200) {
      checks.push({ type: 'warn', code: 'PROMPT_TOO_LONG', message: 'Positive prompt is very long (>1200 chars). Consider trimming for SDXL.' });
    }
    if (prompt.positive?.length < 30) {
      checks.push({ type: 'warn', code: 'PROMPT_TOO_SHORT', message: 'Positive prompt is very short. Add style/lighting/mood details.' });
    }

    // 4. Steps vs quality gate
    if (prompt.suggestedSteps && prompt.suggestedSteps < 20) {
      checks.push({ type: 'warn', code: 'LOW_STEPS', message: `Steps (${prompt.suggestedSteps}) are below 20; quality may be poor.` });
    }

    const errors = checks.filter(c => c.type === 'error');
    return {
      passed: errors.length === 0,
      checks,
      summary: errors.length > 0
        ? `${errors.length} error(s) — fix before generation`
        : checks.length > 0
          ? `${checks.length} warning(s) — review recommended`
          : 'All checks passed',
    };
  }

  // ── Vision-based image QC (uses Claude Sonnet Vision) ─────────────────────
  async checkImageOutput(imageBase64OrUrl, briefSpec, styleGuide) {
    const brandAdjectives = briefSpec?.brand?.adjectives?.join(', ') || 'professional';
    const avoidList = briefSpec?.brand?.avoidList?.join(', ') || 'none';
    const palette = briefSpec?.brand?.palette?.join(', ') || 'not specified';

    const systemPrompt = `You are a brand QC director reviewing AI-generated images before client delivery.
Evaluate against these brand criteria:
- Brand adjectives (should reflect these): ${brandAdjectives}
- Palette (approximate match): ${palette}
- Avoid list (must NOT contain): ${avoidList}

Return ONLY JSON:
{
  "overallScore": number (0-10),
  "brandAlignment": number (0-10),
  "technicalQuality": number (0-10),
  "issues": [{"severity": "critical|major|minor", "description": "string"}],
  "approved": boolean,
  "revisionNotes": "string — actionable prompt/node adjustments",
  "clientReadyNotes": "string — notes for account manager"
}`;

    try {
      const imageContent = imageBase64OrUrl.startsWith('http')
        ? { type: 'image', source: { type: 'url', url: imageBase64OrUrl } }
        : { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64OrUrl } };

      const resp = await this.anthropic.messages.create({
        model: getClaudeModel('sonnet'),
        max_tokens: 512,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: 'Review this AI-generated image against the brand criteria.' },
          ],
        }],
      });

      const cleaned = resp.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error(`[${this.name}] Vision check failed:`, err.message);
      return {
        overallScore: null,
        brandAlignment: null,
        technicalQuality: null,
        issues: [{ severity: 'minor', description: `Vision check unavailable: ${err.message}` }],
        approved: true, // fail open — human reviews
        revisionNotes: '',
        clientReadyNotes: 'Manual review required (vision check failed).',
      };
    }
  }

  // ── Pre-delivery checklist ────────────────────────────────────────────────
  buildDeliveryChecklist(assetType) {
    const common = [
      'File naming follows convention: {projectCode}_{type}_{style}_{date}_{variant}',
      'File format is PNG (images) or MP4 H.264 (video)',
      'No watermarks, no Stable Diffusion default signatures',
      'No obvious face distortions or extra limbs',
      'Brand palette present in dominant colours',
      'Brand avoid-list terms not visible in image',
      'Resolution meets deliverable spec',
    ];
    const videoExtra = [
      'No flickering or strobing',
      'Motion is smooth — no sudden jumps or teleportation',
      'First and last frames are clean (no black frames)',
      'Audio track: none (unless specified)',
    ];
    return assetType === 'video' ? [...common, ...videoExtra] : common;
  }
}

module.exports = QualityCheckerAgent;
