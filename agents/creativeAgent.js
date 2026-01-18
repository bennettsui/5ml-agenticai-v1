const Anthropic = require('@anthropic-ai/sdk');
const { getClaudeModel, getModelDisplayName } = require('../utils/modelHelper');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeCreative(client_name, brief, options = {}) {
  const { model: modelSelection = 'haiku' } = options;

  // Creative agent doesn't use Perplexity - fall back to Haiku
  const effectiveModel = modelSelection === 'perplexity' ? 'haiku' : modelSelection;
  const claudeModel = getClaudeModel(effectiveModel);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: effectiveModel === 'sonnet' ? 2000 : 1000,
    messages: [
      {
        role: 'user',
        content: `你是一個創意總監。請為以下項目提供創意建議。

**客户**: ${client_name}
**簡報**: ${brief}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "creative_concepts": ["概念1", "概念2"],
  "visual_direction": "視覺方向描述",
  "tone_of_voice": "語氣描述",
  "key_messages": ["信息1", "信息2"],
  "creative_risks": ["風險1", "風險2"]
}`,
      },
    ],
  });

  const text = response.content[0].text;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    return {
      ...analysis,
      _meta: {
        model: getModelDisplayName(effectiveModel),
        note: modelSelection === 'perplexity' ? 'Creative agent uses Claude (Perplexity not applicable)' : undefined
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        model: getModelDisplayName(effectiveModel),
        note: modelSelection === 'perplexity' ? 'Creative agent uses Claude (Perplexity not applicable)' : undefined
      }
    };
  }
}

module.exports = { analyzeCreative };
