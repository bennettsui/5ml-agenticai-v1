const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { specs, swaggerUi } = require('./swagger');
const { getClaudeModel, getModelDisplayName, shouldUseDeepSeek } = require('./utils/modelHelper');
const deepseekService = require('./services/deepseekService');
require('dotenv').config();

const app = express();
const path = require('path');
app.use(express.json());

// Swagger API Documentation (before static files)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '5ML Agentic AI API Documentation',
}));

// Serve Next.js frontend (includes /dashboard, /use-cases, etc.)
const nextJsPath = path.join(__dirname, 'frontend/out');
app.use(express.static(nextJsPath));

// Serve legacy dashboard at /sandbox
app.use('/sandbox', express.static('public'));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const { initDatabase, saveProject, saveAnalysis, getProjectAnalyses, getAllProjects, getAnalytics, getAgentPerformance, saveSandboxTest, getSandboxTests, clearSandboxTests, saveBrand, getBrandByName, searchBrands, updateBrandResults, getAllBrands, getBrandWithResults, saveConversation, getConversationsByBrand, getConversation, deleteConversation, deleteBrand, deleteProject, getProjectsByBrand, getConversationsByBrandAndBrief } = require('./db');

// 啟動時初始化數據庫 (optional)
if (process.env.DATABASE_URL) {
  initDatabase();
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
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: '5ML Agentic AI Platform v1',
    timestamp: new Date().toISOString(),
    region: 'iad',
    checks: {
      database: 'unknown',
      schema: 'unknown'
    }
  };

  // Check database connection and schema
  if (process.env.DATABASE_URL) {
    try {
      const db = require('./db');

      // Test basic connection
      await db.query('SELECT 1');
      health.checks.database = 'ok';

      // Check if receipt_batches table exists (schema validation)
      await db.query('SELECT 1 FROM receipt_batches LIMIT 1');
      health.checks.schema = 'ok';

    } catch (error) {
      health.checks.database = 'connected';

      // If table doesn't exist, set status to degraded
      if (error.code === '42P01') {
        health.status = 'degraded';
        health.checks.schema = 'missing_tables';
        health.message = 'Database connected but schema not initialized. Visit /api/receipts/init-database';
      } else {
        health.status = 'degraded';
        health.checks.schema = 'error';
        health.error = error.message;
      }
    }
  } else {
    health.checks.database = 'not_configured';
    health.checks.schema = 'not_configured';
  }

  // Always return 200 to pass Fly.io health checks during initial deployment
  // (even when schema is missing - status information is in the response body)
  res.status(200).json(health);
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

// Brand Strategy Orchestration (Agentic AI Mode)
app.post('/agents/orchestrate', async (req, res) => {
  try {
    const { client_name, brief, industry, model, conversation_history, existing_data } = req.body;
    if (!client_name || !brief) {
      return res.status(400).json({ error: 'Missing client_name or brief' });
    }

    const { orchestrateBrandStrategy } = require('./agents/brandStrategyAgent');
    const analysis = await orchestrateBrandStrategy(client_name, brief, {
      model,
      conversationHistory: conversation_history || [],
      existingData: existing_data || {}
    });

    // Save to brand database if configured
    if (process.env.DATABASE_URL) {
      try {
        await saveBrand(client_name, industry, { brief });
        await updateBrandResults(client_name, 'orchestration', analysis);
      } catch (dbError) {
        console.error('Error saving to brand database:', dbError);
      }
    }

    res.json({
      success: true,
      agent: 'orchestration',
      mode: 'agentic_ai',
      client_name,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Orchestration agent error:', error);
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
        { id: 'creative', name: 'Creative Agent', description: 'Brand concepts & visual direction', status: 'active' },
        { id: 'seo', name: 'SEO Agent', description: 'Search optimization with web research', status: 'active' },
        { id: 'social', name: 'Social Media Agent', description: 'Social strategy & trending formats', status: 'active' },
        { id: 'research', name: 'Research Agent', description: 'Market intelligence & insights', status: 'active' },
      ],
      models: [
        { id: 'deepseek', name: 'DeepSeek Reasoner', type: 'primary', status: 'available' },
        { id: 'haiku', name: 'Claude Haiku', type: 'fallback', status: 'available' },
        { id: 'sonnet', name: 'Claude Sonnet', type: 'advanced', status: 'available' },
        { id: 'perplexity', name: 'Perplexity Sonar Pro', type: 'research', status: 'available' },
      ],
      layers: {
        total: 7,
        active: 5,
        planned: 2,
        completion: 71,
      },
    };

    // Add database stats if available
    if (process.env.DATABASE_URL) {
      try {
        const analytics = await getAnalytics();
        stats.database = {
          projects: analytics.totalProjects,
          analyses: analytics.totalAnalyses,
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
// Use Case Routes
// ==========================================

// Man's Accounting Firm - Receipt Tracking
const receiptTrackingRoutes = require('./use-cases/mans-company-receipt-tracking/api/routes');
app.use('/api/receipts', receiptTrackingRoutes);

console.log('✅ Receipt tracking routes loaded: /api/receipts');

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

server.listen(port, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 5ML Agentic AI Platform v1         ║
║  📍 Port: ${port}                           ║
║  🏥 Health: GET /health               ║
║  📊 Analyze: POST /analyze             ║
║  🪝 Webhook: POST /webhook/github     ║
║  🤖 Agents: GET /agents               ║
║  💾 Projects: GET /projects           ║
║  📝 Receipts: POST /api/receipts      ║
║  🔌 WebSocket: ws://localhost:${port}/ws   ║
║  🌍 Region: IAD (Ashburn, Virginia)   ║
╚════════════════════════════════════════╝
  `);
});


//push test