const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSEO(client_name, brief) {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `你是一個 SEO 專家。請為以下項目提供 SEO 策略。

**客户**: ${client_name}
**簡報**: ${brief}

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "target_keywords": ["關鍵詞1", "關鍵詞2"],
  "content_strategy": "內容策略描述",
  "technical_seo": ["技術1", "技術2"],
  "backlink_opportunities": ["機會1", "機會2"],
  "timeline_months": 6
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

module.exports = { analyzeSEO };
