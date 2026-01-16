const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// simple analyze endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { client_name, brief } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'client_name and brief are required' });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `你是一個行銷策略顧問，請分析以下簡報並用 JSON 回覆：
客戶: ${client_name}
簡報: ${brief}

輸出格式:
{
  "key_objectives": [...],
  "target_audience": "...",
  "recommended_channels": [...],
  "success_metrics": [...],
  "risks": [...]
}`
        }
      ]
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    res.json({ success: true, raw: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
