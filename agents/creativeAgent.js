const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeCreative(client_name, brief) {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
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
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
  } catch {
    return { raw: text };
  }
}

module.exports = { analyzeCreative };
