const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const { initDatabase, saveProject, saveAnalysis, getProjectAnalyses, getAllProjects } = require('./db');

// 啟動時初始化數據庫
initDatabase();

// ==========================================
// Static Files & Dashboard
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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
      model: 'claude-3-haiku-20240307',
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

    // 保存到數據庫
    const project_id = await saveProject(client_name, brief, industry);
    await saveAnalysis(project_id, 'general', analysis);

    // Return result
    res.json({
      success: true,
      project_id,
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
// GitHub Webhook Endpoint
// ==========================================
app.post('/webhook/github', async (req, res) => {
  try {
    const { verifyGitHubSignature } = require('./webhook');

    // 暫時跳過驗證，先確保 webhook 能工作
    // if (!verifyGitHubSignature(req, process.env.GITHUB_WEBHOOK_SECRET || 'test')) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    console.log('✅ Webhook received (validation skipped for testing)');

    const event = req.headers['x-github-event'];

    // 只處理 Issue 事件
    if (event !== 'issues') {
      return res.status(200).json({ message: 'Ignored event type' });
    }

    const { action, issue, repository } = req.body;

    // 只處理 opened 或 edited 事件
    if (action !== 'opened' && action !== 'edited') {
      return res.status(200).json({ message: 'Action not processed' });
    }

    console.log(`📌 Webhook: Issue #${issue.number} from ${repository.name}`);

    // 從 issue title 和 body 提取信息
    const client_name = repository.name;
    const brief = issue.body || issue.title;

    // 調用 Claude 分析
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `分析下列 GitHub Issue 並提供建議。

**Repository**: ${client_name}
**Issue Title**: ${issue.title}
**Issue Body**:
${brief}

請用 Markdown 格式返回分析結果。`,
        },
      ],
    });

    const analysis = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Analysis failed';

    console.log('✅ Webhook analysis complete');

    // 返回成功（GitHub 只需要 200 OK）
    res.status(200).json({
      success: true,
      issue_number: issue.number,
      analysis_preview: analysis.substring(0, 100) + '...',
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Agent Endpoints
// ==========================================

// Creative Agent
app.post('/agents/creative', async (req, res) => {
  try {
    const { client_name, brief } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeCreative } = require('./agents/creativeAgent');
    const analysis = await analyzeCreative(client_name, brief);

    res.json({
      success: true,
      agent: 'creative',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Creative agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SEO Agent
app.post('/agents/seo', async (req, res) => {
  try {
    const { client_name, brief } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeSEO } = require('./agents/seoAgent');
    const analysis = await analyzeSEO(client_name, brief);

    res.json({
      success: true,
      agent: 'seo',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SEO agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Social Media Agent
app.post('/agents/social', async (req, res) => {
  try {
    const { client_name, brief } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeSocial } = require('./agents/socialAgent');
    const analysis = await analyzeSocial(client_name, brief);

    res.json({
      success: true,
      agent: 'social',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Social agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all available agents
app.get('/agents', (req, res) => {
  res.json({
    available_agents: [
      {
        name: 'creative',
        endpoint: 'POST /agents/creative',
        description: 'Creative strategy analysis'
      },
      {
        name: 'seo',
        endpoint: 'POST /agents/seo',
        description: 'SEO strategy analysis'
      },
      {
        name: 'social',
        endpoint: 'POST /agents/social',
        description: 'Social media strategy analysis'
      }
    ],
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Database Query Endpoints
// ==========================================

// Get all projects
app.get('/projects', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const projects = await getAllProjects(limit);
    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project details + analyses
app.get('/projects/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;
    const analyses = await getProjectAnalyses(project_id);
    res.json({
      success: true,
      project_id,
      analysis_count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
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
║  🪝 Webhook: POST /webhook/github     ║
║  🤖 Agents: GET /agents               ║
║  💾 Projects: GET /projects           ║
║  🌍 Region: IAD (Ashburn, Virginia)   ║
╚════════════════════════════════════════╝
  `);
});
