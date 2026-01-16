const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==========================================
// Health Check Endpoint
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '5ML Agentic AI Platform v1',
    timestamp: new Date().toISOString(),
    region: 'iad'
  });
});

// ==========================================
// Main Analysis Endpoint
// ==========================================
app.post('/analyze', async (req, res) => {
  try {
    console.log('📋 Received analysis request:', req.body);

    const { client_name, brief, industry } = req.body;

    // Validate input
    if (!client_name || !brief) {
      return res.status(400).json({
        error: 'Missing required fields: client_name, brief',
      });
    }

    console.log('🔄 Calling Claude API...');

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `你是一個行銷策略顧問。請分析以下項目簡報並用 JSON 格式回覆。

**客户名称**: ${client_name}
**行业**: ${industry || '未指定'}
**简报内容**:
${brief}

請返回下列 JSON 格式的分析結果（只返回 JSON，不需要其他文本）:
{
  "key_objectives": ["目標1", "目標2", "目標3"],
  "target_audience": "目標受眾描述",
  "recommended_channels": ["社交媒體", "內容行銷", "..."],
  "success_metrics": ["metric1", "metric2"],
  "risks": ["風險1", "風險2"]
}`,
        },
      ],
    });

    console.log('✅ Claude API response successful');

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let analysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch) : { raw: content.text };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      analysis = { raw: content.text };
    }

    // Return result
    res.json({
      success: true,
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// Start Server
// ==========================================
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 5ML Agentic AI Platform v1         ║
║  📍 Port: ${port}                           ║
║  🏥 Health: GET /health               ║
║  📊 Analyze: POST /analyze             ║
║  🌍 Region: IAD (Ashburn, Virginia)   ║
╚════════════════════════════════════════╝
  `);
});
