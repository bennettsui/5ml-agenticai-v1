const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSocial(client_name, brief) {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `你是一個社交媒體策略師。請為以下項目提供社交媒體策略。

**客户**: ${client_name}
**簡報**: ${brief}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "primary_platforms": ["平台1", "平台2"],
  "content_pillars": ["支柱1", "支柱2"],
  "posting_frequency": "每周次數",
  "engagement_strategy": "互動策略描述",
  "hashtag_strategy": ["hashtag1", "hashtag2"]
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

module.exports = { analyzeSocial };
