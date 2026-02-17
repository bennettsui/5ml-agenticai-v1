const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { specs, swaggerUi } = require('./swagger');
const { getClaudeModel, getModelDisplayName, shouldUseDeepSeek } = require('./utils/modelHelper');
const deepseekService = require('./services/deepseekService');
require('dotenv').config();

const app = express();
const path = require('path');
app.use(express.json({ limit: '25mb' }));
const APP_NAME = process.env.APP_NAME || '5ML Agentic AI Platform v1';
// const cors = require('cors');

// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:5173', 'https://5ml-agenticai-v1.fly.dev'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// Swagger API Documentation (before static files)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '5ML Agentic AI API Documentation',
}));

// Serve Next.js frontend (includes /dashboard, /use-cases, etc.)
const nextJsPath = path.join(__dirname, 'frontend/out');
app.use(express.static(nextJsPath));
// Ensure root serves the Next.js export index
app.get('/', (req, res) => {
  res.sendFile(path.join(nextJsPath, 'index.html'));
});

// Serve legacy dashboard at /sandbox
app.use('/sandbox', express.static('public'));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const { initDatabase, saveProject, saveAnalysis, getProjectAnalyses, getAllProjects, getAnalytics, getAgentPerformance, saveSandboxTest, getSandboxTests, clearSandboxTests, saveBrand, getBrandByName, searchBrands, updateBrandResults, getAllBrands, getBrandWithResults, saveConversation, getConversationsByBrand, getConversation, deleteConversation, deleteBrand, deleteProject, getProjectsByBrand, getConversationsByBrandAndBrief } = require('./db');

// 啟動時初始化數據庫 (optional)
if (process.env.DATABASE_URL) {
  initDatabase().catch(err => {
    console.error('⚠️ Database initialization failed:', err.message);
    console.log('⚠️ App will continue running without database');
  });
  console.log('📊 Database initialization started');
} else {
  console.log('⚠️ DATABASE_URL not set - running without database');
}

// ==========================================
// Static Files & Dashboard
// ==========================================
// Serve sandbox (legacy dashboard)
app.get('/sandbox.html', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ==========================================
// Health Check Endpoint
// ==========================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the system health status and basic information
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: 5ML Agentic AI Platform v1
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 region:
 *                   type: string
 *                   example: iad
 */
app.get('/health', (req, res) => {
  // Simple health check - no external calls
  // For integration health, use /api/ads/google/health or /debug/meta-tls
  res.status(200).json({
    status: 'ok',
    service: APP_NAME,
    timestamp: new Date().toISOString(),
    region: process.env.FLY_REGION || 'iad',
  });
});

// Debug endpoint to test Meta TLS connection from within Fly container
app.get('/debug/meta-tls', (req, res) => {
  const https = require('https');
  const startTime = Date.now();

  https
    .get('https://graph.facebook.com', (r) => {
      res.json({
        ok: true,
        status: r.statusCode,
        latencyMs: Date.now() - startTime,
        nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set'
      });
    })
    .on('error', (err) => {
      res.status(500).json({
        ok: false,
        error: err.message,
        latencyMs: Date.now() - startTime,
        nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS || 'not set'
      });
    });
});

app.get('/api/app-name', (req, res) => {
  res.status(200).json({ app: APP_NAME });
});

// ==========================================
// API Health & Connection Test
// ==========================================
// Service test definitions (shared between full and individual tests)
const SERVICE_TESTS = {
  anthropic: { name: 'Anthropic (Claude)', type: 'probe', test: async () => {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) { const t = await resp.text(); throw new Error(`HTTP ${resp.status}: ${t.substring(0, 100)}`); }
    return 'API key valid';
  }},
  deepseek: { name: 'DeepSeek', type: 'probe', test: async () => {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not set');
    const resp = await fetch('https://api.deepseek.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return 'API key valid';
  }},
  perplexity: { name: 'Perplexity (Sonar Pro)', type: 'probe', test: async () => {
    if (!process.env.PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not set');
    const resp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) { const t = await resp.text(); throw new Error(`HTTP ${resp.status}: ${t.substring(0, 100)}`); }
    return 'API key valid';
  }},
  openai: { name: 'OpenAI', type: 'env', envVar: 'OPENAI_API_KEY' },
  database: { name: 'PostgreSQL', type: 'probe', test: async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
    const db = require('./db');
    await db.query('SELECT 1');
    return 'Connected';
  }},
  notion: { name: 'Notion API', type: 'probe', test: async () => {
    if (!process.env.NOTION_API_KEY) throw new Error('NOTION_API_KEY not set');
    const resp = await fetch('https://api.notion.com/v1/users/me', {
      headers: { 'Authorization': `Bearer ${process.env.NOTION_API_KEY}`, 'Notion-Version': '2022-06-28' },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return `Connected as ${data.name || data.type || 'bot'}`;
  }},
  resend: { name: 'Resend (Email)', type: 'env', envVar: 'RESEND_API_KEY' },
  dropbox: { name: 'Dropbox', type: 'env', envVar: 'DROPBOX_ACCESS_TOKEN' },
  comfyui: { name: 'ComfyUI (Image Gen)', type: 'env', envVar: 'COMFYUI_URL' },
  'meta-ads': { name: 'Meta Ads API', type: 'probe', test: async () => {
    if (!process.env.META_ACCESS_TOKEN) throw new Error('META_ACCESS_TOKEN not set');
    const resp = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${process.env.META_ACCESS_TOKEN}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) { const t = await resp.text(); throw new Error(`HTTP ${resp.status}: ${t.substring(0, 100)}`); }
    return 'Token valid';
  }},
  'google-ads': { name: 'Google Ads API', type: 'env', envVar: 'GOOGLE_ADS_DEVELOPER_TOKEN' },
  gmail: { name: 'Gmail OAuth', type: 'env', envVar: 'GOOGLE_CLIENT_ID' },
};

async function testService(id) {
  const svc = SERVICE_TESTS[id];
  if (!svc) return null;
  if (svc.type === 'env') {
    const set = !!process.env[svc.envVar];
    return { id, name: svc.name, status: set ? 'configured' : 'not_configured', detail: set ? `${svc.envVar} is set` : `${svc.envVar} not set` };
  }
  const start = Date.now();
  try {
    const detail = await svc.test();
    return { id, name: svc.name, status: 'connected', latencyMs: Date.now() - start, detail };
  } catch (err) {
    return { id, name: svc.name, status: 'error', latencyMs: Date.now() - start, error: err.message };
  }
}

app.get('/api/health/services', async (req, res) => {
  const results = [];
  for (const id of Object.keys(SERVICE_TESTS)) {
    results.push(await testService(id));
  }

  const connected = results.filter(r => r.status === 'connected').length;
  const configured = results.filter(r => r.status === 'configured').length;
  const errors = results.filter(r => r.status === 'error').length;
  const notConfigured = results.filter(r => r.status === 'not_configured').length;

  res.json({
    timestamp: new Date().toISOString(),
    summary: { total: results.length, connected, configured, errors, notConfigured },
    services: results,
  });
});

// Individual service retest
app.get('/api/health/services/:id', async (req, res) => {
  const result = await testService(req.params.id);
  if (!result) return res.status(404).json({ error: 'Unknown service' });
  res.json({ timestamp: new Date().toISOString(), service: result });
});

// ==========================================
// Main Analysis Endpoint
// ==========================================

/**
 * @swagger
 * /analyze:
 *   post:
 *     summary: General AI analysis
 *     tags: [Analysis]
 *     description: Performs comprehensive AI analysis using Claude for marketing projects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalysisRequest'
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/analyze', async (req, res) => {
  try {
    console.log('📋 Received analysis request:', req.body);

    const { client_name, brief, industry, model: modelSelection = 'deepseek' } = req.body;

    // Validate input
    if (!client_name || !brief) {
      return res.status(400).json({
        error: 'Missing required fields: client_name, brief',
      });
    }

    let analysis;

    // Use DeepSeek if selected and available
    if (shouldUseDeepSeek(modelSelection)) {
      console.log('🔄 Calling DeepSeek API...');

      const systemPrompt = '你是一個行銷策略顧問。請分析以下項目簡報並用 JSON 格式回覆。';
      const userPrompt = `**客户名称**: ${client_name}
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
}`;

      try {
        const result = await deepseekService.analyze(systemPrompt, userPrompt, {
          maxTokens: 1500,
        });

        const text = result.content;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
          analysis._meta = {
            model: getModelDisplayName(modelSelection),
            usage: result.usage
          };
        } catch {
          analysis = {
            raw: text,
            _meta: {
              model: getModelDisplayName(modelSelection),
              usage: result.usage
            }
          };
        }
        console.log('✅ DeepSeek API response successful');
      } catch (error) {
        console.error('DeepSeek error, falling back to Claude Haiku:', error.message);
        // Fallback will be handled below
        analysis = null;
      }
    }

    // Use Claude if DeepSeek wasn't used or failed
    if (!analysis) {
      console.log('🔄 Calling Claude API...');
      const effectiveModel = modelSelection === 'perplexity' ? 'deepseek' : modelSelection;
      const claudeModel = getClaudeModel(effectiveModel);

      const response = await client.messages.create({
        model: claudeModel,
        max_tokens: effectiveModel === 'sonnet' ? 2000 : 1000,
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

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch) : { raw: content.text };
        analysis._meta = {
          model: getModelDisplayName(effectiveModel),
          note: modelSelection === 'perplexity' ? 'General analysis uses Claude (Perplexity not applicable)' : undefined
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        analysis = {
          raw: content.text,
          _meta: {
            model: getModelDisplayName(effectiveModel)
          }
        };
      }
    }

    // 保存到數據庫 (optional - won't fail if DB not configured)
    let project_id = null;
    try {
      if (process.env.DATABASE_URL) {
        project_id = await saveProject(client_name, brief, industry);
        await saveAnalysis(project_id, 'general', analysis);
        console.log('✅ Saved to database');
      } else {
        console.log('⚠️ Database not configured - skipping save');
      }
    } catch (dbError) {
      console.error('⚠️ Database save failed (continuing anyway):', dbError.message);
    }

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

/**
 * @swagger
 * /agents/creative:
 *   post:
 *     summary: Creative strategy analysis
 *     tags: [Agents]
 *     description: Analyzes creative strategy using Claude AI - provides creative concepts, visual direction, tone of voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentRequest'
 *     responses:
 *       200:
 *         description: Creative analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
app.post('/agents/creative', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeCreative } = require('./agents/creativeAgent');
    const analysis = await analyzeCreative(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'creative', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

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

/**
 * @swagger
 * /agents/seo:
 *   post:
 *     summary: SEO strategy analysis
 *     tags: [Agents]
 *     description: Analyzes SEO strategy using Claude AI + Perplexity (when available) - provides keyword targets, content strategy, technical SEO recommendations with current trends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentRequest'
 *     responses:
 *       200:
 *         description: SEO analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
app.post('/agents/seo', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeSEO } = require('./agents/seoAgent');
    const analysis = await analyzeSEO(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'seo', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

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

/**
 * @swagger
 * /agents/social:
 *   post:
 *     summary: Social media strategy analysis
 *     tags: [Agents]
 *     description: Analyzes social media strategy using Claude AI + Perplexity (when available) - provides platform recommendations, content pillars, engagement strategies with trending formats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentRequest'
 *     responses:
 *       200:
 *         description: Social media analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
app.post('/agents/social', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeSocial } = require('./agents/socialAgent');
    const analysis = await analyzeSocial(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'social', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

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

/**
 * @swagger
 * /agents/research:
 *   post:
 *     summary: Brand Research Agent - Real-time brand status scan and asset audit
 *     tags: [Agents]
 *     description: Combines real-time intelligence with brand asset auditing. Provides data sufficiency check, dynamic scanning (3-month news, campaigns), product/pricing analysis, positioning verification, VOC analysis, 3Cs framework, SWOT analysis, and strategic diagnosis with reasoning tracking.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentRequest'
 *     responses:
 *       200:
 *         description: Brand research analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
app.post('/agents/research', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeResearch } = require('./agents/researchAgent');
    const analysis = await analyzeResearch(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        // Save/update brand
        await saveBrand(client_name, industry, { brief });
        // Update brand with analysis results
        await updateBrandResults(client_name, 'research', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    res.json({
      success: true,
      agent: 'research',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Research agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer Insight Agent
app.post('/agents/customer', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeCustomerInsight } = require('./agents/customerInsightAgent');
    const analysis = await analyzeCustomerInsight(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'customer', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'customer',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Customer insight agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Competitor Analysis Agent
app.post('/agents/competitor', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeCompetitor } = require('./agents/competitorAgent');
    const analysis = await analyzeCompetitor(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'competitor', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'competitor',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Competitor analysis agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Brand Strategy Agent
app.post('/agents/strategy', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { analyzeBrandStrategy } = require('./agents/brandStrategyAgent');
    const analysis = await analyzeBrandStrategy(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'strategy', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'strategy',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Brand strategy agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CSO Orchestrator (高階品牌策略戰略長) - Layer 6
app.post('/agents/cso', async (req, res) => {
  try {
    const { client_name, brief, industry, model, conversation_history, existing_data } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { orchestrateBrandDiagnosis } = require('./agents/csoOrchestrator');
    const analysis = await orchestrateBrandDiagnosis(client_name, brief, {
      model: model || 'deepseek', // CSO requires DeepSeek R1
      conversationHistory: conversation_history || [],
      existingData: existing_data || {}
    });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'cso_orchestration', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'cso',
      mode: 'orchestration',
      role: '高階品牌策略戰略長 (CSO)',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CSO Orchestrator error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Market Sentinel Agent (市場哨兵) - Layer 3
app.post('/agents/sentinel', async (req, res) => {
  try {
    const { client_name, brief, industry, model, no_fallback } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { monitorMarketTrends } = require('./agents/marketSentinelAgent');
    const analysis = await monitorMarketTrends(client_name, brief, { model, no_fallback });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'market_sentinel', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'sentinel',
      role: '市場哨兵 (Market Sentinel)',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market Sentinel agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: List all available AI agents
 *     tags: [Agents]
 *     description: Returns a list of all specialized AI agents and their endpoints
 *     responses:
 *       200:
 *         description: List of available agents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentList'
 */
app.get('/agents', (req, res) => {
  res.json({
    available_agents: [
      {
        name: 'creative',
        endpoint: '/agents/creative',
        description: 'Creative strategy analysis'
      },
      {
        name: 'seo',
        endpoint: '/agents/seo',
        description: 'SEO strategy analysis'
      },
      {
        name: 'social',
        endpoint: '/agents/social',
        description: 'Social media strategy analysis'
      },
      {
        name: 'research',
        endpoint: '/agents/research',
        description: 'Brand Research Agent - Real-time brand status scan and asset audit'
      }
    ],
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Sandbox Test History Endpoints
// ==========================================

// Save sandbox test
app.post('/api/sandbox/tests', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { agent_type, client_name, brief, results } = req.body;

    if (!agent_type || !client_name || !brief || !results) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const test = await saveSandboxTest(agent_type, client_name, brief, results);
    res.json({ success: true, test_id: test.test_id, created_at: test.created_at });
  } catch (error) {
    console.error('Error saving sandbox test:', error);
    res.status(500).json({ error: 'Failed to save sandbox test' });
  }
});

// Get sandbox test history
app.get('/api/sandbox/tests', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const tests = await getSandboxTests(limit);
    res.json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching sandbox tests:', error);
    res.status(500).json({ error: 'Failed to fetch sandbox tests' });
  }
});

// Clear all sandbox tests
app.delete('/api/sandbox/tests', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    await clearSandboxTests();
    res.json({ success: true, message: 'All sandbox tests cleared' });
  } catch (error) {
    console.error('Error clearing sandbox tests:', error);
    res.status(500).json({ error: 'Failed to clear sandbox tests' });
  }
});

// ==========================================
// Brand Database Endpoints
// ==========================================

// Search brands for autocomplete
app.get('/api/brands/search', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;

    if (!query || query.trim().length < 2) {
      return res.json({ success: true, brands: [] });
    }

    const brands = await searchBrands(query, limit);
    res.json({ success: true, brands });
  } catch (error) {
    console.error('Error searching brands:', error);
    res.status(500).json({ error: 'Failed to search brands' });
  }
});

// Get all brands
app.get('/api/brands', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const brands = await getAllBrands(limit);
    res.json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get specific brand by name
app.get('/api/brands/:name', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const brand = await getBrandWithResults(req.params.name);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({ success: true, brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

// Save or update brand
app.post('/api/brands', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { brand_name, industry, brand_info } = req.body;

    if (!brand_name) {
      return res.status(400).json({ error: 'brand_name is required' });
    }

    const brand = await saveBrand(brand_name, industry, brand_info);
    res.json({ success: true, brand });
  } catch (error) {
    console.error('Error saving brand:', error);
    res.status(500).json({ error: 'Failed to save brand' });
  }
});

// ==========================================
// Conversation History Endpoints
// ==========================================

// Get conversation history for a brand
app.get('/api/conversations/:brand_name', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const conversations = await getConversationsByBrand(req.params.brand_name, limit);
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Save a new conversation
app.post('/api/conversations', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { brand_name, agent_type, initial_brief, messages } = req.body;

    if (!brand_name || !agent_type || !messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversation = await saveConversation(brand_name, agent_type, initial_brief, messages);
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Get specific conversation
app.get('/api/conversation/:id', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const conversation = await getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Delete a conversation
app.delete('/api/conversation/:id', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    await deleteConversation(req.params.id);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Delete a brand (and all its conversations)
app.delete('/api/brands/:brand_name', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    await deleteBrand(req.params.brand_name);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// Delete a project (all conversations for a brand + brief)
app.delete('/api/brands/:brand_name/projects', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const brief = req.query.brief;
    if (!brief) {
      return res.status(400).json({ error: 'Brief parameter required' });
    }

    await deleteProject(req.params.brand_name, brief);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get projects for a brand (grouped by brief)
app.get('/api/brands/:brand_name/projects', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const projects = await getProjectsByBrand(req.params.brand_name);
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get conversations for a specific project (brand + brief)
app.get('/api/brands/:brand_name/projects/:brief_index/conversations', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const brief = req.query.brief;
    if (!brief) {
      return res.status(400).json({ error: 'Brief parameter required' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const conversations = await getConversationsByBrandAndBrief(req.params.brand_name, brief, limit);
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching project conversations:', error);
    res.status(500).json({ error: 'Failed to fetch project conversations' });
  }
});

// ==========================================
// Database Query Endpoints
// ==========================================

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     description: Returns a list of all projects stored in the database with their analyses
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectList'
 *       503:
 *         description: Database not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/projects', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        message: 'Set DATABASE_URL to enable project history'
      });
    }
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
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        message: 'Set DATABASE_URL to enable project history'
      });
    }
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
// Analytics Endpoints
// ==========================================

/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Analytics]
 *     description: Returns analytics data including agent usage, model distribution, and token statistics
 *     responses:
 *       200:
 *         description: Analytics data
 *       503:
 *         description: Database not configured
 */
app.get('/analytics', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        message: 'Set DATABASE_URL to enable analytics'
      });
    }

    const analytics = await getAnalytics();
    res.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /analytics/agents:
 *   get:
 *     summary: Get agent performance metrics
 *     tags: [Analytics]
 *     description: Returns performance statistics for each agent
 *     responses:
 *       200:
 *         description: Agent performance data
 *       503:
 *         description: Database not configured
 */
app.get('/analytics/agents', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        message: 'Set DATABASE_URL to enable analytics'
      });
    }

    const performance = await getAgentPerformance();
    res.json({
      success: true,
      agents: performance,
    });
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get platform statistics
 *     tags: [Analytics]
 *     description: Returns basic platform statistics for the overview page
 *     responses:
 *       200:
 *         description: Platform stats
 */
app.get('/stats', async (req, res) => {
  try {
    const stats = {
      agents: [
        // ========================================
        // Root Marketing Agents (9)
        // ========================================
        { id: 'creative', name: 'Creative Agent', description: 'Brand concepts & visual direction', status: 'active', category: 'marketing' },
        { id: 'seo', name: 'SEO Agent', description: 'Search optimization with web research', status: 'active', category: 'marketing' },
        { id: 'social', name: 'Social Media Agent', description: 'Social strategy & trending formats', status: 'active', category: 'marketing' },
        { id: 'research', name: 'Research Agent', description: 'Market intelligence & insights', status: 'active', category: 'marketing' },
        { id: 'competitor', name: 'Competitor Agent', description: 'Competitive landscape analysis', status: 'active', category: 'marketing' },
        { id: 'brand-strategy', name: 'Brand Strategy Agent', description: 'Brand positioning & strategy', status: 'active', category: 'marketing' },
        { id: 'customer-insight', name: 'Customer Insight Agent', description: 'Customer behavior & insights', status: 'active', category: 'marketing' },
        { id: 'market-sentinel', name: 'Market Sentinel Agent', description: 'Market monitoring & trends', status: 'active', category: 'marketing' },
        { id: 'cso-orchestrator', name: 'CSO Orchestrator', description: 'Chief Strategy Officer role - orchestrates agents', status: 'active', category: 'marketing' },

        // ========================================
        // Ads Performance Agents (8)
        // ========================================
        { id: 'meta-data-fetcher', name: 'Meta Data Fetcher', description: 'Fetches ad-level metrics from Meta Marketing API', status: 'active', category: 'ads' },
        { id: 'google-data-fetcher', name: 'Google Ads Data Fetcher', description: 'Fetches metrics from Google Ads API using GAQL', status: 'active', category: 'ads' },
        { id: 'normalizer', name: 'Normalizer Agent', description: 'Unifies Meta/Google data into common schema', status: 'active', category: 'ads' },
        { id: 'anomaly-detector', name: 'Anomaly Detector', description: 'Identifies significant metric changes', status: 'active', category: 'ads' },
        { id: 'funnel-analyzer', name: 'Funnel Analyzer', description: 'Analyzes conversion funnel bottlenecks', status: 'active', category: 'ads' },
        { id: 'budget-planner', name: 'Budget Planner', description: 'Analyzes spend pacing & budget allocation', status: 'active', category: 'ads' },
        { id: 'recommendation-writer', name: 'Recommendation Writer', description: 'Generates polished performance reports', status: 'active', category: 'ads' },
        { id: 'internal-strategy', name: 'Internal Strategy Agent', description: 'Cross-tenant insights for agency leadership', status: 'active', category: 'ads' },

        // ========================================
        // Photo Booth Agents (9)
        // ========================================
        { id: 'pb-orchestrator', name: 'Photo Booth Orchestrator', description: 'Main coordinator for portrait pipeline', status: 'active', category: 'photobooth' },
        { id: 'session-manager', name: 'Session Manager', description: 'Create/read/update session state', status: 'active', category: 'photobooth' },
        { id: 'face-quality', name: 'Face Quality Check', description: 'Validate faces, lighting, composition', status: 'active', category: 'photobooth' },
        { id: 'environment-analysis', name: 'Environment Analysis', description: 'Analyze scene and suggest theme', status: 'active', category: 'photobooth' },
        { id: 'style-generator', name: 'Style Generator', description: 'Compose detailed prompts for ComfyUI', status: 'active', category: 'photobooth' },
        { id: 'image-generation', name: 'Image Generation', description: 'Call ComfyUI API with streaming progress', status: 'active', category: 'photobooth' },
        { id: 'branding', name: 'Branding Agent', description: 'Overlay 5ML logo and hashtag', status: 'active', category: 'photobooth' },
        { id: 'qr-delivery', name: 'QR & Delivery', description: 'Generate QR codes and short links', status: 'active', category: 'photobooth' },
        { id: 'analytics-logger', name: 'Analytics Logger', description: 'Log sessions, errors, theme usage', status: 'active', category: 'photobooth' },

        // ========================================
        // Topic Intelligence Agents (3)
        // ========================================
        { id: 'source-curator', name: 'Source Curator', description: 'Discovers & qualifies news sources using Perplexity', status: 'active', category: 'intelligence' },
        { id: 'news-analyst', name: 'News Analyst', description: 'Analyzes articles with Claude for relevance', status: 'active', category: 'intelligence' },
        { id: 'news-writer', name: 'News Writer', description: 'Generates digests & newsletters with DeepSeek', status: 'active', category: 'intelligence' },

        // ========================================
        // Infrastructure Agents (1)
        // ========================================
        { id: 'receipt-ocr', name: 'Receipt OCR Agent', description: 'Receipt processing with Claude Vision (92-98% accuracy)', status: 'active', category: 'accounting' },
      ],
      models: [
        { id: 'deepseek', name: 'DeepSeek Reasoner', type: 'primary', status: 'available' },
        { id: 'haiku', name: 'Claude 3.5 Haiku', type: 'fallback', status: 'available' },
        { id: 'sonnet', name: 'Claude Sonnet 4.5', type: 'advanced', status: 'available' },
        { id: 'opus', name: 'Claude Opus 4.6', type: 'flagship', status: 'available' },
        { id: 'perplexity', name: 'Perplexity Sonar Pro', type: 'research', status: 'available' },
        { id: 'comfyui', name: 'ComfyUI (Stable Diffusion)', type: 'image-gen', status: 'available' },
        { id: 'tesseract', name: 'Tesseract.js OCR', type: 'ocr', status: 'available' },
      ],
      layers: {
        total: 7,
        active: 7,
        planned: 0,
        completion: 100,
        details: [
          { id: 'L1', name: 'Infrastructure & Storage', status: 'active', description: 'PostgreSQL, Express API, Docker, Fly.io, Redis' },
          { id: 'L2', name: 'Execution Engine', status: 'active', description: 'DeepSeek, Perplexity, Claude, Model fallback chains' },
          { id: 'L3', name: 'Roles & Agents', status: 'active', description: '30+ specialized agents across 6 use-cases' },
          { id: 'L4', name: 'Knowledge Management', status: 'active', description: 'Vector embeddings, Notion connector, pgvector' },
          { id: 'L5', name: 'Task Definitions', status: 'active', description: 'Reusable templates, workflow schemas (JSON-based)' },
          { id: 'L6', name: 'Orchestration & Workflow', status: 'active', description: 'Task scheduling, retry logic, workflow automation' },
          { id: 'L7', name: 'Governance & Compliance', status: 'active', description: 'Access control, audit logging, compliance rules' },
        ],
      },
      useCases: [
        {
          id: 'marketing',
          name: 'Marketing Strategy',
          description: 'Multi-agent strategy generation',
          agentCount: 9,
          status: 'production',
          costEstimate: {
            perRun: {
              description: '1 project analysis with all 9 agents',
              modelCalls: [
                { model: 'DeepSeek', calls: 9, avgTokensIn: 3000, avgTokensOut: 2000, costPerMillion: { input: 0.14, output: 0.28 } },
                { model: 'Claude Haiku (fallback)', calls: 2, avgTokensIn: 2000, avgTokensOut: 1500, costPerMillion: { input: 0.25, output: 1.25 } },
                { model: 'Perplexity Sonar (research)', calls: 2, avgTokensIn: 1000, avgTokensOut: 3000, costPerMillion: { input: 3.00, output: 15.00 } },
              ],
              totalTokens: { input: 35000, output: 27000 },
              estimatedCost: 0.12, // USD per run
            },
            daily: { runsPerDay: 1, estimatedCost: 0.12 },
            monthly: { runsPerMonth: 30, estimatedCost: 3.60 },
          },
        },
        {
          id: 'ads',
          name: 'Ads Performance',
          description: 'Multi-tenant Meta/Google ads analytics',
          agentCount: 8,
          status: 'production',
          costEstimate: {
            perRun: {
              description: '1 weekly analysis report per tenant',
              modelCalls: [
                { model: 'Claude Sonnet', calls: 3, avgTokensIn: 4000, avgTokensOut: 2500, costPerMillion: { input: 3.00, output: 15.00 } },
                { model: 'DeepSeek', calls: 2, avgTokensIn: 2000, avgTokensOut: 1500, costPerMillion: { input: 0.14, output: 0.28 } },
              ],
              totalTokens: { input: 16000, output: 10500 },
              estimatedCost: 0.21, // USD per run
              notes: 'Daily sync is API-only (no LLM cost). Weekly analysis triggers AI agents.',
            },
            daily: { runsPerDay: 1, estimatedCost: 0.03 }, // Minimal daily (API sync only)
            monthly: { runsPerMonth: 4, estimatedCost: 0.84, tenantsMultiplier: 'Cost × number of tenants' },
          },
        },
        {
          id: 'photobooth',
          name: 'Photo Booth',
          description: '18th-century portrait generation',
          agentCount: 9,
          status: 'production',
          costEstimate: {
            perRun: {
              description: '1 portrait generation session',
              modelCalls: [
                { model: 'Claude Sonnet Vision', calls: 2, avgTokensIn: 2500, avgTokensOut: 800, costPerMillion: { input: 3.00, output: 15.00 } },
                { model: 'ComfyUI (Flux)', calls: 1, avgTokensIn: 0, avgTokensOut: 0, costPerMillion: { input: 0, output: 0 }, fixedCost: 0.03 },
              ],
              totalTokens: { input: 5000, output: 1600 },
              estimatedCost: 0.07, // USD per portrait
              notes: 'ComfyUI runs on self-hosted GPU. Cost is electricity + maintenance.',
            },
            daily: { runsPerDay: 50, estimatedCost: 3.50, notes: 'Event day estimate' },
            monthly: { runsPerMonth: 200, estimatedCost: 14.00, notes: '~4 events/month' },
          },
        },
        {
          id: 'intelligence',
          name: 'Topic Intelligence',
          description: 'News monitoring & newsletter generation',
          agentCount: 3,
          status: 'production',
          costEstimate: {
            perRun: {
              description: '1 daily news scan (20 sources, ~50 articles)',
              modelCalls: [
                { model: 'Perplexity Sonar Pro', calls: 1, avgTokensIn: 500, avgTokensOut: 2000, costPerMillion: { input: 3.00, output: 15.00 } },
                { model: 'Claude Haiku', calls: 50, avgTokensIn: 800, avgTokensOut: 400, costPerMillion: { input: 0.25, output: 1.25 } },
                { model: 'DeepSeek', calls: 1, avgTokensIn: 5000, avgTokensOut: 3000, costPerMillion: { input: 0.14, output: 0.28 } },
              ],
              totalTokens: { input: 45500, output: 25000 },
              estimatedCost: 0.07, // USD per daily scan
              notes: 'Source curator runs weekly. News analyst per article. News writer for digest.',
            },
            daily: { runsPerDay: 1, estimatedCost: 0.07 },
            monthly: { runsPerMonth: 30, estimatedCost: 2.10, weeklyDigestCost: 0.15, totalMonthly: 2.70 },
          },
        },
        {
          id: 'accounting',
          name: 'Receipt Tracking',
          description: 'OCR-based P&L automation',
          agentCount: 1,
          status: 'production',
          costEstimate: {
            perRun: {
              description: '1 receipt OCR extraction',
              modelCalls: [
                { model: 'Claude Sonnet Vision', calls: 1, avgTokensIn: 1500, avgTokensOut: 500, costPerMillion: { input: 3.00, output: 15.00 } },
              ],
              totalTokens: { input: 1500, output: 500 },
              estimatedCost: 0.012, // USD per receipt
            },
            daily: { runsPerDay: 10, estimatedCost: 0.12 },
            monthly: { runsPerMonth: 300, estimatedCost: 3.60 },
          },
        },
        {
          id: 'crm',
          name: 'Client CRM + KB',
          description: 'AI-powered client CRM with knowledge base',
          agentCount: 0,
          status: 'production',
          costEstimate: {
            perRun: {
              description: 'Feedback analysis or knowledge extraction',
              modelCalls: [
                { model: 'Claude Haiku', calls: 1, avgTokensIn: 2000, avgTokensOut: 1000, costPerMillion: { input: 0.25, output: 1.25 } },
              ],
              totalTokens: { input: 2000, output: 1000 },
              estimatedCost: 0.002,
            },
            daily: { runsPerDay: 5, estimatedCost: 0.01 },
            monthly: { runsPerMonth: 150, estimatedCost: 0.30 },
          },
        },
      ],
      // Token pricing reference (per million tokens)
      tokenPricing: {
        'claude-3-haiku': { input: 0.25, output: 1.25 },
        'claude-3.5-haiku': { input: 0.80, output: 4.00 },
        'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
        'claude-opus-4.5': { input: 15.00, output: 75.00 },
        'deepseek-reasoner': { input: 0.14, output: 0.28 },
        'perplexity-sonar-pro': { input: 3.00, output: 15.00 },
        'comfyui-flux': { note: 'Self-hosted GPU, ~$0.03/image electricity' },
      },
      // Monthly cost summary
      monthlyCostSummary: {
        marketing: 3.60,
        ads: 0.84, // Per tenant
        photobooth: 14.00,
        intelligence: 2.70,
        accounting: 3.60,
        crm: 0.30,
        totalBase: 25.04,
        notes: 'Ads cost scales with tenants. Photo booth scales with events. All estimates assume typical usage patterns.',
      },
      databaseTables: [
        // Social/Marketing tables
        { name: 'projects', description: 'Social media projects', category: 'marketing' },
        { name: 'analyses', description: 'Agent analysis results', category: 'marketing' },
        // Ads Performance tables
        { name: 'ads_daily_performance', description: 'Daily ad metrics (Meta & Google)', category: 'ads' },
        { name: 'ads_campaigns', description: 'Campaign details & budgets', category: 'ads' },
        { name: 'ads_adsets', description: 'Ad set targeting & bidding', category: 'ads' },
        { name: 'ads_creatives', description: 'Ad creative assets', category: 'ads' },
        { name: 'client_credentials', description: 'Multi-tenant OAuth tokens', category: 'ads' },
        // Topic Intelligence tables
        { name: 'intelligence_topics', description: 'Monitored news topics', category: 'intelligence' },
        { name: 'intelligence_sources', description: 'Curated news sources', category: 'intelligence' },
        { name: 'intelligence_news', description: 'Collected news articles', category: 'intelligence' },
        // Accounting tables
        { name: 'receipts', description: 'Receipt records from OCR', category: 'accounting' },
      ],
    };

    // Add database stats if available
    if (process.env.DATABASE_URL) {
      try {
        const analytics = await getAnalytics();

        // Get Topic Intelligence counts
        let topicsCount = 0;
        let sourcesCount = 0;
        let newsCount = 0;
        try {
          const { getIntelligenceTopics, getIntelligenceSources, getIntelligenceNews } = require('./db');
          const topics = await getIntelligenceTopics();
          topicsCount = topics.length;
          // Sum sources across all topics
          for (const topic of topics) {
            const sources = await getIntelligenceSources(topic.topic_id);
            sourcesCount += sources.length;
          }
        } catch (e) {
          // Ignore if Topic Intelligence tables not yet created
        }

        stats.database = {
          projects: analytics.totalProjects,
          analyses: analytics.totalAnalyses,
          topics: topicsCount,
          sources: sourcesCount,
          status: 'connected',
        };
      } catch (error) {
        stats.database = { status: 'error' };
      }
    } else {
      stats.database = { status: 'not_configured' };
    }

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CRM CRUD Routes (clients, projects, feedback, gmail, orchestration)
// ==========================================
const db = require('./db');
const createCrmRoutes = require('./routes/crm');
app.use('/api', createCrmRoutes(db));
console.log('✅ CRM routes loaded: /api/clients, /api/projects, /api/feedback, /api/gmail');

// ==========================================
// Debug / Health-Check Routes
// ==========================================
const createDebugRoutes = require('./routes/debug');
app.use('/api', createDebugRoutes());
console.log('✅ Debug routes loaded: /api/debug/sessions, /api/debug/modules, /api/debug/issues, /api/debug/stats');

// ==========================================
// LLM Library & CRM Chat Endpoint
// ==========================================
const llm = require('./lib/llm');

// List available LLM models
app.get('/api/llm/models', (req, res) => {
  res.json({ success: true, models: llm.listModels(), default: llm.DEFAULT_MODEL });
});

// CRM AI Assistant chat endpoint
app.post('/api/crm/chat', async (req, res) => {
  try {
    const { messages, model: modelKey, page_context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const system = `You are an AI assistant embedded in a Brand CRM + Knowledge Base system.
You help users manage brands, projects, feedback, and brand knowledge.

When the user asks you to research a company, provide structured information including:
- industry (as an array of strings)
- region (as an array of strings)
- website_url
- company_size (e.g. "1000-5000", "50000+")
- client_value_tier ("A" for enterprise, "B" for mid-market, "C" for SMB, "D" for startup)
- legal_name (official registered name)

Always wrap structured data in \`\`\`json code blocks so it can be parsed and auto-applied to the form.

## Actions
You can trigger actions in the UI by including action blocks in your response. Use \`\`\`action blocks:

Navigate to a page:
\`\`\`action
{"type": "navigate", "path": "/use-cases/crm/brands/new", "label": "Create New Brand"}
\`\`\`

Update form fields on the current page:
\`\`\`action
{"type": "update_form", "data": {"name": "Acme Corp", "industry": ["Technology"]}, "label": "Fill form"}
\`\`\`

Create a brand directly:
\`\`\`action
{"type": "create_brand", "data": {"name": "Acme Corp", "industry": ["Technology"], "status": "prospect"}, "label": "Create Acme Corp"}
\`\`\`

Create a project directly:
\`\`\`action
{"type": "create_project", "data": {"name": "Website Redesign", "type": "website", "client_id": "uuid-here"}, "label": "Create Project"}
\`\`\`

Available pages: /use-cases/crm (Dashboard), /use-cases/crm/brands (Brands list), /use-cases/crm/brands/new (New Brand form), /use-cases/crm/brands/detail?id=BRAND_ID (Brand detail with projects and feedback), /use-cases/crm/projects (Projects list), /use-cases/crm/projects/new (New Project form), /use-cases/crm/projects/detail?id=PROJECT_ID (Project detail), /use-cases/crm/feedback (Feedback), /use-cases/crm/integrations (Integrations)

When the user asks you to do something actionable (create, navigate, fill in, etc.), include the appropriate action block so it can be executed in the UI.

${page_context ? `Current page context: ${JSON.stringify(page_context)}` : ''}

Respond concisely. Use English or the language the user writes in.`;

    const result = await llm.chat(modelKey || 'sonnet', messages, {
      system,
      maxTokens: 4096,
    });

    res.json({
      message: result.text,
      model: result.modelName,
      model_id: result.model,
      session_id: req.body.session_id || `crm-${Date.now()}`,
      tool_calls: null,
      usage: result.usage,
    });
  } catch (error) {
    console.error('CRM chat error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// Use Case Routes
// ==========================================

// Man's Accounting Firm - Receipt Tracking
const receiptTrackingRoutes = require('./use-cases/mans-company-receipt-tracking/api/routes');
app.use('/api/receipts', receiptTrackingRoutes);

console.log('✅ Receipt tracking routes loaded: /api/receipts');

// Topic Intelligence Routes
const topicIntelligenceRoutes = require('./use-cases/topic-intelligence/api-js/routes');
const { runScheduledScan } = require('./use-cases/topic-intelligence/api-js/routes');
app.use('/api/intelligence', topicIntelligenceRoutes);

console.log('✅ Topic Intelligence routes loaded: /api/intelligence');

// Photo Booth Routes (optional dependency on multer)
try {
  const photoBoothRoutes = require('./use-cases/photo-booth/api/routes');
  app.use('/api/photo-booth', photoBoothRoutes);
  console.log('✅ Photo Booth routes loaded: /api/photo-booth');
} catch (error) {
  console.warn('⚠️ Photo Booth routes not loaded:', error.message);
  console.warn('   Install missing dependencies (e.g. `multer`) to enable /api/photo-booth');
}

// Ads Performance Dashboard Routes
try {
  const adsPerformanceRoutes = require('./use-cases/5ml-ads-performance-internal/api/routes');
  app.use('/api/ads', adsPerformanceRoutes);
  console.log('✅ Ads Performance routes loaded: /api/ads');
} catch (error) {
  console.warn('⚠️ Ads Performance routes not loaded:', error.message);
}

// Scheduler Service
const scheduler = require('./services/scheduler');
const scheduleRegistry = require('./services/schedule-registry');

// Register Ads Performance schedules with the central registry.
// These are defined in the orchestrator but not auto-started — register
// them as informational entries so the frontend can list them.
const adsSchedules = [
  { id: 'ads:daily-sync', name: 'Daily Ads Sync', description: 'Fetch daily ad metrics from Meta & Google for all tenants', schedule: '0 7 * * *', nextRunAt: 'Daily at 07:00' },
  { id: 'ads:weekly-reports', name: 'Weekly Ads Reports', description: 'AI-powered weekly analysis for all tenants', schedule: '0 9 * * 1', nextRunAt: 'Monday at 09:00' },
  { id: 'ads:monthly-reports', name: 'Monthly Executive Summary', description: 'Monthly executive summary for all tenants', schedule: '0 10 1 * *', nextRunAt: '1st of month at 10:00' },
  { id: 'ads:cross-tenant-overview', name: 'Cross-Tenant Overview', description: '7-day rolling multi-tenant aggregated insights', schedule: '30 9 * * 1', nextRunAt: 'Monday at 09:30' },
];
for (const s of adsSchedules) {
  scheduleRegistry.register({ ...s, group: 'Ads Performance', timezone: 'Asia/Hong_Kong', status: 'scheduled' });
}

// ==========================================
// Scheduled Jobs API  (used by frontend /scheduled-jobs page)
// ==========================================
app.get('/api/scheduled-jobs', (req, res) => {
  const { group } = req.query;
  res.json({
    timestamp: new Date().toISOString(),
    summary: scheduleRegistry.summary(),
    jobs: scheduleRegistry.list(group || undefined),
  });
});

// ==========================================
// Workflow Chat API  (DeepSeek + RAG powered)
// ==========================================
const ragService = require('./services/rag-service');

const WORKFLOW_SYSTEM_PROMPTS = {
  assistant: `You are an AI Workflow Architect assistant helping the user understand and modify agent orchestration workflows.

Your capabilities:
1. Explain how agents work together in the current workflow
2. Suggest improvements to agent roles, connections, and orchestration patterns
3. Modify the workflow when the user requests changes (update agent names/roles, add/remove edges)
4. Discuss trade-offs between different orchestration approaches

When the user asks to MODIFY the workflow, include a JSON block at the end of your response in this exact format:
[WORKFLOW_UPDATE]
[{"action":"update_node","node_id":"agent-id","name":"New Name","role":"New Role"}]
[/WORKFLOW_UPDATE]

Available actions:
- update_node: Update a node's name and/or role. Fields: node_id, name (optional), role (optional)
- remove_node: Remove a node and its edges. Fields: node_id
- add_edge: Add a connection. Fields: from, to, label (optional), edge_type (solid|conditional|feedback)
- remove_edge: Remove a connection. Fields: from, to
- update_meta: Update workflow metadata. Fields: pattern (optional), patternDesc (optional), trigger (optional)

Always reference nodes by their id. Only include the JSON block when making actual changes, not when just explaining.
Be concise but thorough. Focus on practical, actionable advice.`,

  business_analyst: `You are a critical Business Analyst reviewing AI agent orchestration workflows. Your role is to challenge, question, and improve.

Your approach:
1. QUESTION assumptions — why does this agent exist? Is it justified?
2. IDENTIFY bottlenecks — where are single points of failure?
3. CHALLENGE the user — if they propose something, play devil's advocate
4. ASSESS ROI — what is the cost vs value of each agent?
5. FIND edge cases — what happens when things go wrong?
6. CRITIQUE both the workflow design AND the user's understanding

Be direct and analytical. Don't just agree — push back constructively. Use specific metrics and frameworks when possible.

When you believe modifications would improve the workflow, include a JSON block:
[WORKFLOW_UPDATE]
[{"action":"update_node","node_id":"agent-id","role":"Improved role description"}]
[/WORKFLOW_UPDATE]

Your goal is to make both the human and the AI agents better through rigorous analysis.`
};

function parseWorkflowUpdates(text) {
  const updateRegex = /\[WORKFLOW_UPDATE\]\s*([\s\S]*?)\s*\[\/WORKFLOW_UPDATE\]/;
  const match = text.match(updateRegex);
  let updates = [];
  let message = text;

  if (match) {
    try {
      updates = JSON.parse(match[1]);
      message = text.replace(updateRegex, '').trim();
    } catch (e) {
      console.error('[workflow-chat] Failed to parse workflow updates:', e.message);
    }
  }

  return { message, updates };
}

app.post('/api/workflow-chat', async (req, res) => {
  try {
    const { messages, workflow, mode = 'assistant' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Build workflow context
    const workflowContext = JSON.stringify({
      id: workflow?.id,
      title: workflow?.title,
      pattern: workflow?.pattern,
      trigger: workflow?.trigger,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
    }, null, 2);

    // RAG: retrieve relevant context for the latest user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const ragContext = lastUserMsg ? ragService.getContext(lastUserMsg.content, 'workflows', 3) : '';

    const systemPrompt = [
      WORKFLOW_SYSTEM_PROMPTS[mode] || WORKFLOW_SYSTEM_PROMPTS.assistant,
      `\nCurrent Workflow:\n${workflowContext}`,
      ragContext ? `\n${ragContext}` : '',
    ].join('\n');

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    let result;

    if (deepseek.isAvailable()) {
      result = await deepseek.chat(
        [{ role: 'system', content: systemPrompt }, ...messages],
        { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
      );
      const parsed = parseWorkflowUpdates(result.content);
      return res.json({
        message: parsed.message,
        workflow_updates: parsed.updates,
        model: result.model || 'deepseek-chat',
        rag_used: !!ragContext,
      });
    }

    // Fallback to Claude
    const llm = require('./lib/llm');
    result = await llm.chat('haiku', messages, { system: systemPrompt, maxTokens: 2000 });
    const parsed = parseWorkflowUpdates(result.text);
    return res.json({
      message: parsed.message,
      workflow_updates: parsed.updates,
      model: result.modelName || 'claude-haiku',
      rag_used: !!ragContext,
    });

  } catch (err) {
    console.error('[workflow-chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Agent team chat endpoint
app.post('/api/agent-chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const systemPrompt = `You are the 5ML Platform Agent Assistant — an expert on the 5ML Agentic AI Platform.
You have deep knowledge of every agent, use case, solution line, C-Suite role, and the 7-layer architecture.

${context || ''}

Your capabilities:
1. Answer questions about any agent, use case, or architectural layer
2. Suggest new agents, improvements, or restructuring
3. Explain how different agents and layers interact
4. Recommend priority changes and roadmap adjustments
5. Help plan new use cases and estimate agent requirements

Be concise, specific, and reference actual platform data. Use bullet points for lists.`;

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    if (deepseek.isAvailable()) {
      const result = await deepseek.chat(
        [{ role: 'system', content: systemPrompt }, ...messages],
        { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
      );
      return res.json({ message: result.content, model: result.model || 'deepseek-chat' });
    }

    // Fallback to Claude
    const llm = require('./lib/llm');
    const result = await llm.chat('haiku', messages, { system: systemPrompt, maxTokens: 2000 });
    return res.json({ message: result.text, model: result.modelName || 'claude-haiku' });

  } catch (err) {
    console.error('[agent-chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// RAG stats endpoint
app.get('/api/rag/stats', (req, res) => {
  res.json(ragService.getStats());
});

// ==========================================
// Knowledge Base Stats API
// ==========================================
app.get('/api/knowledge-base/stats', async (req, res) => {
  try {
    const db = require('./db');
    const { pool } = db;

    // RAG service stats
    const ragStats = ragService.getStats();

    // Query CRM KB tables (safe — returns 0 if table doesn't exist)
    const safeCount = async (table) => {
      try {
        const r = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        return parseInt(r.rows[0].count, 10);
      } catch { return 0; }
    };

    const safeRecent = async (table, dateCol = 'created_at', limit = 5) => {
      try {
        const r = await pool.query(`SELECT * FROM ${table} ORDER BY ${dateCol} DESC LIMIT $1`, [limit]);
        return r.rows;
      } catch { return []; }
    };

    // CRM KB counts
    const [clients, projects, feedback, intelligenceTopics, intelligenceNews, intelligenceSources] = await Promise.all([
      safeCount('crm_clients'),
      safeCount('crm_projects'),
      safeCount('crm_feedback'),
      safeCount('intelligence_topics'),
      safeCount('intelligence_news'),
      safeCount('intelligence_sources'),
    ]);

    // Check if knowledge_documents table exists (pgvector)
    let vectorDocuments = 0;
    let vectorStoreAvailable = false;
    try {
      const r = await pool.query('SELECT COUNT(*) as count FROM knowledge_documents');
      vectorDocuments = parseInt(r.rows[0].count, 10);
      vectorStoreAvailable = true;
    } catch { /* table may not exist */ }

    // Recent entries
    const [recentClients, recentFeedback, recentNews] = await Promise.all([
      safeRecent('crm_clients', 'created_at', 5),
      safeRecent('crm_feedback', 'created_at', 5),
      safeRecent('intelligence_news', 'created_at', 5),
    ]);

    // Intelligence topics detail
    let topics = [];
    try {
      const r = await pool.query('SELECT id, name, status, schedule, last_run_at, created_at FROM intelligence_topics ORDER BY created_at DESC');
      topics = r.rows;
    } catch { /* table may not exist */ }

    // Connectors status
    const connectors = [
      { id: 'notion', name: 'Notion', status: process.env.NOTION_API_KEY ? 'configured' : 'not_configured', type: 'document' },
      { id: 'web', name: 'Web Crawler', status: 'available', type: 'web' },
      { id: 'pdf', name: 'PDF Parser', status: 'available', type: 'document' },
      { id: 'email', name: 'Email (Gmail)', status: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured', type: 'email' },
      { id: 'dropbox', name: 'Dropbox', status: process.env.DROPBOX_ACCESS_TOKEN ? 'configured' : 'not_configured', type: 'storage' },
    ];

    // Embedding provider
    const embeddingProvider = process.env.OPENAI_API_KEY ? 'OpenAI (text-embedding-3-small)' : 'Local (TF-IDF)';

    res.json({
      timestamp: new Date().toISOString(),
      overview: {
        totalKnowledgeItems: clients + projects + feedback + intelligenceTopics + intelligenceNews + ragStats.totalDocuments + vectorDocuments,
        ragDocuments: ragStats.totalDocuments,
        ragTerms: ragStats.uniqueTerms,
        vectorDocuments,
        vectorStoreAvailable,
        embeddingProvider,
      },
      crm: {
        clients,
        projects,
        feedback,
        recentClients: recentClients.map(c => ({ id: c.id, name: c.name, status: c.status, created_at: c.created_at })),
        recentFeedback: recentFeedback.map(f => ({ id: f.id, sentiment: f.sentiment, topics: f.topics, source: f.source, created_at: f.created_at })),
      },
      intelligence: {
        topics: topics.length,
        news: intelligenceNews,
        sources: intelligenceSources,
        topicDetails: topics,
        recentNews: recentNews.map(n => ({ id: n.id, title: n.title, source: n.source_name, created_at: n.created_at })),
      },
      rag: ragStats,
      connectors,
    });
  } catch (err) {
    console.error('[knowledge-base] Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Next.js Client-Side Routing Fallback
// ==========================================
// Handle client-side routing - serve index.html for Next.js routes
app.get('*', (req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api') ||
      req.path.startsWith('/ws') ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  // For Next.js routes, try to serve the corresponding HTML file
  const fs = require('fs');
  const nextJsPath = path.join(__dirname, 'frontend/out');

  // Remove trailing slash for path lookups
  const cleanPath = req.path.endsWith('/') && req.path !== '/'
    ? req.path.slice(0, -1)
    : req.path;

  const htmlPath = path.join(nextJsPath, cleanPath, 'index.html');
  const directHtmlPath = path.join(nextJsPath, cleanPath + '.html');

  // Check if path/index.html exists
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  // Check if path.html exists
  if (fs.existsSync(directHtmlPath)) {
    return res.sendFile(directHtmlPath);
  }

  // Dynamic route fallback — serve the [param] placeholder page
  // e.g. /healthcheck/abc123 → frontend/out/healthcheck/placeholder.html
  //      /use-cases/crm/debug/abc123 → frontend/out/use-cases/crm/debug/placeholder.html
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const parentPath = '/' + segments.slice(0, -1).join('/');
    const placeholderDir = path.join(nextJsPath, parentPath, 'placeholder');
    const placeholderHtml = path.join(placeholderDir, 'index.html');
    const placeholderDirect = path.join(nextJsPath, parentPath, 'placeholder.html');
    if (fs.existsSync(placeholderHtml)) {
      return res.sendFile(placeholderHtml);
    }
    if (fs.existsSync(placeholderDirect)) {
      return res.sendFile(placeholderDirect);
    }
  }

  // If original path had trailing slash and we didn't find anything, redirect to without trailing slash
  if (req.path.endsWith('/') && req.path !== '/') {
    return res.redirect(301, cleanPath);
  }

  // Otherwise continue to next middleware
  next();
});

// ==========================================
// WebSocket Server
// ==========================================
const http = require('http');
const wsServer = require('./services/websocket-server');

// ==========================================
// Start Server
// ==========================================
const port = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize WebSocket server
wsServer.initialize(server);

server.listen(port, '0.0.0.0', async () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 5ML Agentic AI Platform v1         ║
║  📍 Port: ${port}                           ║
║  📍 Host: 0.0.0.0 (Fly.io compatible)  ║
║  🏥 Health: GET /health               ║
║  📊 Analyze: POST /analyze             ║
║  🪝 Webhook: POST /webhook/github     ║
║  🤖 Agents: GET /agents               ║
║  💾 Projects: GET /projects           ║
║  📝 Receipts: POST /api/receipts      ║
║  📰 Intelligence: /api/intelligence    ║
║  🔌 WebSocket: /ws                     ║
║  🌍 Region: IAD (Ashburn, Virginia)   ║
╚════════════════════════════════════════╝
  `);

  // Initialize scheduler for Topic Intelligence
  if (process.env.DATABASE_URL) {
    try {
      const db = require('./db');
      scheduler.initialize(db, runScheduledScan);
      await scheduler.loadAllSchedules();
      console.log('✅ Scheduler service initialized');
    } catch (error) {
      console.error('⚠️ Scheduler initialization failed:', error.message);
    }
  } else {
    console.log('⚠️ Scheduler not initialized - DATABASE_URL not set');
  }
});


//push test
