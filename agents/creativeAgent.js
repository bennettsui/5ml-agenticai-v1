const Anthropic = require('@anthropic-ai/sdk');
const { getClaudeModel, getModelDisplayName } = require('../utils/modelHelper');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeCreative(client_name, brief, options = {}) {
  const { model: modelSelection = 'haiku' } = options;
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: modelSelection === 'sonnet' ? 2000 : 1000,
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
        model: getModelDisplayName(modelSelection)
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        model: getModelDisplayName(modelSelection)
      }
    };
  }
}

module.exports = { analyzeCreative };
