const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { specs, swaggerUi } = require('./swagger');
const { getClaudeModel, getModelDisplayName, shouldUseDeepSeek } = require('./utils/modelHelper');
const deepseekService = require('./services/deepseekService');
const zwEngine = require('./services/ziwei-chart-engine');
const { asyncHandler, errorHandler, AppError } = require('./middleware/errorHandler');
const ziweiValidation = require('./validation/ziweiValidation');
const ziweiV1Router = require('./routes/v1/ziwei');
require('dotenv').config();

// ─── Radiance Email Alert Setup ───────────────────────────────────────────────
function createMailTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendRadianceEnquiryAlert(enquiry) {
  const transporter = createMailTransporter();
  if (!transporter) {
    console.log('📧 [Radiance] SMTP not configured — enquiry logged to DB only.');
    return;
  }
  const alertRecipients = 'mandy@radiancehk.com, bennet.tsui@5mileslab.com';
  const subject = `[Radiance Enquiry] ${enquiry.name} (${enquiry.company || 'Individual'}) — ${enquiry.serviceInterest || 'General'}`;
  const html = `<h2 style="font-family:sans-serif;">New Radiance Enquiry</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><b>Name</b></td><td>${enquiry.name}</td></tr>
  <tr><td><b>Email</b></td><td><a href="mailto:${enquiry.email}">${enquiry.email}</a></td></tr>
  <tr><td><b>Phone</b></td><td>${enquiry.phone || '—'}</td></tr>
  <tr><td><b>Company</b></td><td>${enquiry.company || '—'}</td></tr>
  <tr><td><b>Industry</b></td><td>${enquiry.industry || '—'}</td></tr>
  <tr><td><b>Service Interest</b></td><td>${enquiry.serviceInterest || '—'}</td></tr>
  <tr><td><b>Language</b></td><td>${enquiry.sourceLang === 'zh' ? '繁體中文' : 'English'}</td></tr>
  <tr><td><b>Submitted</b></td><td>${new Date().toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })} HKT</td></tr>
</table>
<h3 style="font-family:sans-serif;">Message</h3>
<p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;font-family:sans-serif;">${enquiry.message}</p>
<hr/><p style="color:#999;font-size:12px;font-family:sans-serif;">Radiance PR &amp; Martech — Enquiry System</p>`;
  try {
    await transporter.sendMail({
      from: `"Radiance Enquiries" <${process.env.SMTP_USER}>`,
      to: alertRecipients,
      subject,
      html,
    });
    console.log(`📧 [Radiance] Alert sent to ${alertRecipients}`);
  } catch (mailErr) {
    console.error('📧 [Radiance] Email send failed:', mailErr.message);
  }
}
// ──────────────────────────────────────────────────────────────────────────────

const app = express();
const path = require('path');
const compression = require('compression');

app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '25mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'none'");
  next();
});

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

// Serve TEDx generated visuals (runtime-generated via nanobanana API)
app.use('/tedx', express.static(path.join(__dirname, 'frontend', 'public', 'tedx')));
app.use('/tedx-xinyi', express.static(path.join(__dirname, 'frontend', 'public', 'tedx-xinyi')));

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

const { pool, initDatabase, saveProject, saveAnalysis, getProjectAnalyses, getAllProjects, getAnalytics, getAgentPerformance, saveSandboxTest, getSandboxTests, clearSandboxTests, saveBrand, getBrandByName, searchBrands, updateBrandResults, getAllBrands, getBrandWithResults, saveConversation, getConversationsByBrand, getConversation, deleteConversation, deleteBrand, deleteProject, getProjectsByBrand, getConversationsByBrandAndBrief, getSocialState, upsertSocialState, deleteSocialState, saveSocialCampaign, saveArtefact, getArtefact, getAllArtefacts, saveSocialContentPosts, getSocialContentPosts, saveSocialAdCampaigns, getSocialAdCampaigns, saveSocialKPIs, getSocialKPIs, createContentDraft, getContentDrafts, updateContentDraft, deleteContentDraft, promoteContentDraftToCalendar, syncContentCalendarAndDevelopment, createProductService, getProductsServices, updateProductServiceStatus, getProductServicePortfolio, saveResearchBusiness, getResearchBusiness, saveResearchCompetitors, getResearchCompetitors, deleteResearchCompetitor, saveResearchAudience, getResearchAudience, saveResearchSegments, getResearchSegments, deleteResearchSegment, saveResearchProducts, getResearchProducts, deleteResearchProduct, saveSocialCalendar, getSocialCalendar, createContact, getContactsByClient, getContact, updateContact, deleteContact, linkContactToProject, getProjectContacts, unlinkContactFromProject } = require('./db');

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
  minimax: { name: 'MiniMax 2.5', type: 'probe', test: async () => {
    if (!process.env.MINIMAX_API_KEY) throw new Error('MINIMAX_API_KEY not set');
    const resp = await fetch('https://api.minimaxi.chat/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'MiniMax-Text-01', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) { const t = await resp.text(); throw new Error(`HTTP ${resp.status}: ${t.substring(0, 100)}`); }
    return 'API key valid';
  }},
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

// ==========================================
// API V1 ROUTES (Versioned with validation)
// ==========================================
app.use('/api/v1/ziwei', ziweiV1Router);

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
// Ziwei Doushu Star Meanings API
// ==========================================

// Get entire star meanings database
app.get('/api/ziwei/database', (req, res) => {
  try {
    const db = zwEngine.getStarDatabase();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metadata: db.metadata,
      stats: {
        main_stars: Object.keys(db.main_stars || {}).length,
        auxiliary_stars: Object.keys(db.auxiliary_stars || {}).length,
        malevolent_stars: Object.keys(db.malevolent_stars || {}).length,
        longevity_stars: Object.keys(db.longevity_stars || {}).length,
        romance_stars: Object.keys(db.romance_stars || {}).length,
        auspicious_auxiliary: Object.keys(db.auspicious_auxiliary_stars || {}).length,
        secondary_stars: Object.keys(db.secondary_stars || {}).length,
        total: Object.keys(db.main_stars || {}).length +
               Object.keys(db.auxiliary_stars || {}).length +
               Object.keys(db.malevolent_stars || {}).length +
               Object.keys(db.longevity_stars || {}).length +
               Object.keys(db.romance_stars || {}).length +
               Object.keys(db.auspicious_auxiliary_stars || {}).length +
               Object.keys(db.secondary_stars || {}).length
      },
      data: db
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single star by name
app.get('/api/ziwei/star/:name', (req, res) => {
  try {
    const star = zwEngine.getStarMeaning(req.params.name);
    if (!star) {
      return res.status(404).json({ success: false, error: `Star '${req.params.name}' not found` });
    }
    res.json({ success: true, star });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get stars by category
app.get('/api/ziwei/category/:category', (req, res) => {
  try {
    const stars = zwEngine.getStarsByCategory(req.params.category);
    const count = Object.keys(stars).length;
    res.json({
      success: true,
      category: req.params.category,
      count,
      stars
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get stars by five element
app.get('/api/ziwei/element/:element', (req, res) => {
  try {
    const stars = zwEngine.getStarsByElement(req.params.element);
    const count = Object.keys(stars).length;
    res.json({
      success: true,
      element: req.params.element,
      count,
      stars
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get stars by type
app.get('/api/ziwei/type/:type', (req, res) => {
  try {
    const stars = zwEngine.getStarsByType(req.params.type);
    const count = Object.keys(stars).length;
    res.json({
      success: true,
      type: req.params.type,
      count,
      stars
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search stars by keyword
app.get('/api/ziwei/search', (req, res) => {
  try {
    const keyword = req.query.q;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" required' });
    }
    const results = zwEngine.getStarsByKeyword(keyword);
    const count = Object.keys(results).length;
    res.json({
      success: true,
      keyword,
      count,
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// KNOWLEDGE BASE API ENDPOINTS
// ==========================================

/**
 * Get knowledge base statistics from JSON files
 */
app.get('/api/ziwei/knowledge/stats', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // Load all knowledge base files
    const kbPath = path.join(__dirname, 'data');
    const files = {
      curriculum: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-curriculum-enhanced.json'), 'utf8')),
      combinations: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-star-combinations.json'), 'utf8')),
      palaces: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-12-palaces.json'), 'utf8')),
      sources: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-combinations-sources.json'), 'utf8'))
    };

    // Calculate stats
    const stats = {
      totalConcepts: Object.keys(files.curriculum.level_1_foundations?.core_topics || {}).length,
      totalCombinations: Object.keys(files.combinations?.combinations || {}).length,
      totalPalaces: Object.keys(files.palaces?.palaces || {}).length,
      totalSources: Object.keys(files.sources?.sources || {}).length,
      curriculumLevels: 6,
      lastUpdated: new Date().toISOString(),
      knowledgeFiles: {
        curriculum: files.curriculum.title,
        combinations: files.combinations.title || 'Ziwei Star Combinations',
        palaces: files.palaces.title || 'Ziwei 12 Palaces',
        sources: files.sources.title || 'Knowledge Sources'
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get all knowledge base content
 */
app.get('/api/ziwei/knowledge/all', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const kbPath = path.join(__dirname, 'data');
    const knowledge = {
      curriculum: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-curriculum-enhanced.json'), 'utf8')),
      combinations: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-star-combinations.json'), 'utf8')),
      palaces: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-12-palaces.json'), 'utf8')),
      learning: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-learning-guide.json'), 'utf8')),
      sources: JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-combinations-sources.json'), 'utf8'))
    };

    res.json({
      success: true,
      data: knowledge
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get curriculum by level
 */
app.get('/api/ziwei/knowledge/curriculum/:level', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const level = `level_${req.params.level}`;

    const kbPath = path.join(__dirname, 'data');
    const curriculum = JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-curriculum-enhanced.json'), 'utf8'));

    if (!curriculum[level]) {
      return res.status(404).json({ success: false, error: `Level ${req.params.level} not found` });
    }

    res.json({
      success: true,
      level: req.params.level,
      data: curriculum[level]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get combinations by category
 */
app.get('/api/ziwei/knowledge/combinations/:category', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const kbPath = path.join(__dirname, 'data');
    const combinations = JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-star-combinations.json'), 'utf8'));

    const category = req.params.category;
    const results = combinations.combinations.filter(c => c.category === category);

    res.json({
      success: true,
      category,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Search knowledge base
 */
app.get('/api/ziwei/knowledge/search', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const query = (req.query.q || '').toLowerCase();

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" required' });
    }

    const kbPath = path.join(__dirname, 'data');
    const curriculum = JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-curriculum-enhanced.json'), 'utf8'));
    const combinations = JSON.parse(fs.readFileSync(path.join(kbPath, 'ziwei-star-combinations.json'), 'utf8'));

    const results = {
      curriculum_matches: [],
      combination_matches: []
    };

    // Search curriculum
    Object.entries(curriculum).forEach(([level, content]) => {
      if (typeof content === 'object' && content !== null) {
        const str = JSON.stringify(content).toLowerCase();
        if (str.includes(query)) {
          results.curriculum_matches.push({
            level,
            title: content.name || level
          });
        }
      }
    });

    // Search combinations
    if (combinations.combinations) {
      results.combination_matches = combinations.combinations.filter(c =>
        JSON.stringify(c).toLowerCase().includes(query)
      );
    }

    res.json({
      success: true,
      query,
      total_results: results.curriculum_matches.length + results.combination_matches.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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
// Search brands in crm_clients
app.get('/api/brands/search', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const q = (req.query.q || '').trim();
    const limit = parseInt(req.query.limit) || 10;
    if (q.length < 2) return res.json({ items: [], total: 0, page: 1, size: limit, pages: 0 });
    const result = await pool.query(
      `SELECT * FROM crm_clients WHERE name ILIKE $1 ORDER BY name LIMIT $2`,
      [`%${q}%`, limit]
    );
    res.json({ items: result.rows, total: result.rows.length, page: 1, size: limit, pages: 1 });
  } catch (err) {
    console.error('Error searching brands:', err);
    res.status(500).json({ error: 'Failed to search brands' });
  }
});

// List brands from crm_clients with pagination
app.get('/api/brands', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, parseInt(req.query.size) || 20);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * size;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM crm_clients${search ? ' WHERE name ILIKE $1' : ''}`,
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM crm_clients${search ? ' WHERE name ILIKE $1' : ''} ORDER BY updated_at DESC LIMIT ${search ? '$2' : '$1'} OFFSET ${search ? '$3' : '$2'}`,
      search ? [`%${search}%`, size, offset] : [size, offset]
    );

    res.json({ items: dataResult.rows, total, page, size, pages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get brand by UUID or name from crm_clients
app.get('/api/brands/:id', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const { id } = req.params;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const result = uuidRe.test(id)
      ? await pool.query('SELECT * FROM crm_clients WHERE id = $1', [id])
      : await pool.query('SELECT * FROM crm_clients WHERE LOWER(name) = LOWER($1)', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Brand not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching brand:', err);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

// Create brand in crm_clients
app.post('/api/brands', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const { name, legal_name, industry, region, status, website_url, company_size, client_value_tier } = req.body;
    const resolvedName = name || req.body.brand_name;
    if (!resolvedName) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await pool.query(
      `INSERT INTO crm_clients (name, legal_name, industry, region, status, website_url, company_size, client_value_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        resolvedName,
        legal_name || null,
        JSON.stringify(Array.isArray(industry) ? industry : (industry ? [industry] : [])),
        JSON.stringify(Array.isArray(region) ? region : (region ? [region] : [])),
        status || 'prospect',
        website_url || null,
        company_size || null,
        client_value_tier || null,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating brand:', err);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// POST /api/brands/setup-complete — Brand Setup → CRM sync
// Auto-creates brand in CRM from setup wizard
app.post('/api/brands/setup-complete', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const { brandName, industry, markets, voiceTone, brandPersonality, colorPalette, visualStyle, strategy } = req.body;

    if (!brandName) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    // 1. Check if brand already exists
    const existing = await pool.query('SELECT id FROM crm_clients WHERE name = $1', [brandName]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Brand already exists' });
    }

    // 2. Create brand in CRM
    const brandResult = await pool.query(
      `INSERT INTO crm_clients (name, industry, region, status, health_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name`,
      [
        brandName,
        JSON.stringify(Array.isArray(industry) ? [industry] : (industry ? [industry] : [])),
        JSON.stringify(markets || []),
        'active', // Default to active when created from setup
        75, // Default health score
      ]
    );

    const crmBrandId = brandResult.rows[0].id;

    // 3. Also save to social-content-ops brands table with full profile
    await saveBrand(brandName, {
      industry: industry,
      brand_info: {
        profile: {
          brandName,
          industry,
          markets: markets || [],
          voiceTone,
          brandPersonality,
          colorPalette,
          visualStyle,
        },
        strategy: strategy,
      },
    });

    res.json({
      success: true,
      brand_id: crmBrandId,
      redirect: `/use-cases/crm/brands/detail?id=${crmBrandId}`,
    });
  } catch (err) {
    console.error('Error in setup-complete:', err);
    res.status(500).json({ error: 'Failed to create brand in CRM' });
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

// Delete a brand from crm_clients (cascades to crm_projects + crm_feedback)
app.delete('/api/brands/:id', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const result = await pool.query('DELETE FROM crm_clients WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Brand not found' });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting brand:', err);
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

// Get projects for a brand from crm_projects
app.get('/api/brands/:brand_name/projects', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, parseInt(req.query.size) || 20);
    const offset = (page - 1) * size;
    const clientId = req.params.brand_name;
    const countResult = await pool.query('SELECT COUNT(*) FROM crm_projects WHERE client_id = $1', [clientId]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM crm_projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [clientId, size, offset]
    );
    res.json({ items: result.rows, total, page, size, pages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// List all CRM projects with pagination
app.get('/api/projects', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Database not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, parseInt(req.query.size) || 20);
    const status = req.query.status || '';
    const offset = (page - 1) * size;
    const where = status ? 'WHERE status = $1' : '';
    const countResult = await pool.query(`SELECT COUNT(*) FROM crm_projects ${where}`, status ? [status] : []);
    const total = parseInt(countResult.rows[0].count);
    const params = status ? [status, size, offset] : [size, offset];
    const dataResult = await pool.query(
      `SELECT * FROM crm_projects ${where} ORDER BY created_at DESC LIMIT ${status ? '$2' : '$1'} OFFSET ${status ? '$3' : '$2'}`,
      params
    );
    res.json({ items: dataResult.rows, total, page, size, pages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Create CRM project
app.post('/api/projects', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { client_id, name, type, brief, start_date, end_date, status } = req.body;
    if (!client_id || !name) return res.status(400).json({ error: 'client_id and name are required' });
    const result = await pool.query(
      `INSERT INTO crm_projects (client_id, name, type, brief, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [client_id, name, type || 'other', brief || null, start_date || null, end_date || null, status || 'planning']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Delete CRM project
app.delete('/api/projects/:id', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await pool.query('DELETE FROM crm_projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
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
          id: 'ai-image-generation',
          name: 'AI Image Generation',
          description: 'Agency brief → SDXL/ComfyUI prompts + workflow configs',
          agentCount: 6,
          status: 'in_progress',
          costEstimate: {
            perRun: {
              description: '1 brief → full prompt set for all deliverables (avg 4)',
              modelCalls: [
                { model: 'DeepSeek', calls: 5, avgTokensIn: 2500, avgTokensOut: 1500, costPerMillion: { input: 0.14, output: 0.28 } },
                { model: 'Claude Haiku', calls: 3, avgTokensIn: 1500, avgTokensOut: 800, costPerMillion: { input: 0.25, output: 1.25 } },
                { model: 'Claude Sonnet Vision (QC)', calls: 1, avgTokensIn: 2000, avgTokensOut: 500, costPerMillion: { input: 3.00, output: 15.00 } },
              ],
              totalTokens: { input: 18500, output: 10100 },
              estimatedCost: 0.011,
              notes: 'GPU compute (ComfyUI/SDXL) is self-hosted — electricity only, ~$0.03/image.',
            },
            daily: { runsPerDay: 3, estimatedCost: 0.033 },
            monthly: { runsPerMonth: 60, estimatedCost: 0.66, notes: '~2 briefs/day avg' },
          },
        },
        {
          id: 'ai-video-generation',
          name: 'AI Video Generation',
          description: 'AnimateDiff / SVD video pipeline with motion prompts + QC',
          agentCount: 8,
          status: 'in_progress',
          costEstimate: {
            perRun: {
              description: '1 brief → video prompt set + AnimateDiff workflow config',
              modelCalls: [
                { model: 'DeepSeek', calls: 6, avgTokensIn: 3000, avgTokensOut: 2000, costPerMillion: { input: 0.14, output: 0.28 } },
                { model: 'Claude Haiku', calls: 4, avgTokensIn: 2000, avgTokensOut: 1000, costPerMillion: { input: 0.25, output: 1.25 } },
                { model: 'Claude Sonnet Vision (QC)', calls: 2, avgTokensIn: 2500, avgTokensOut: 600, costPerMillion: { input: 3.00, output: 15.00 } },
              ],
              totalTokens: { input: 28000, output: 14200 },
              estimatedCost: 0.022,
              notes: 'AnimateDiff/SVD on self-hosted GPU — ~$0.08/clip (16 frames) electricity.',
            },
            daily: { runsPerDay: 2, estimatedCost: 0.044 },
            monthly: { runsPerMonth: 40, estimatedCost: 0.88, notes: '~1-2 video projects/day' },
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
        aiImageGeneration: 0.66,
        aiVideoGeneration: 0.88,
        totalBase: 26.58,
        notes: 'Ads cost scales with tenants. Photo booth scales with events. Image/video GPU cost is electricity (self-hosted). All estimates assume typical usage patterns.',
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
        // AI Media Generation tables
        { name: 'media_projects', description: 'Media generation projects', category: 'media' },
        { name: 'media_style_guides', description: 'Per-project brand style guides', category: 'media' },
        { name: 'media_prompts', description: 'Prompt library with workflow configs', category: 'media' },
        { name: 'media_assets', description: 'Generated image/video asset registry', category: 'media' },
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

// Helper: read use case source code for chatbot context
function readUseCaseCode(useCaseId, maxChars = 8000) {
  const baseDir = path.join(__dirname, 'frontend', 'app', 'use-cases', useCaseId);
  if (!fs.existsSync(baseDir)) return '';
  const files = [];
  function walkDir(dir, prefix) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push({ path: relPath, fullPath });
      }
    }
  }
  walkDir(baseDir, '');
  let result = `\n## Use Case Source Code (${useCaseId})\nFiles:\n`;
  result += files.map(f => `- ${f.path}`).join('\n') + '\n\n';
  let totalChars = result.length;
  for (const file of files) {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const header = `### ${file.path}\n\`\`\`tsx\n`;
    const footer = '\n```\n\n';
    const available = maxChars - totalChars - header.length - footer.length;
    if (available <= 200) break;
    const truncated = content.length > available ? content.slice(0, available) + '\n// ... (truncated)' : content;
    result += header + truncated + footer;
    totalChars = result.length;
    if (totalChars >= maxChars) break;
  }
  return result;
}

// List available LLM models
app.get('/api/llm/models', (req, res) => {
  res.json({ success: true, models: llm.listModels(), default: llm.DEFAULT_MODEL });
});

// CRM AI Assistant chat endpoint
app.post('/api/crm/chat', async (req, res) => {
  try {
    const { messages, model: modelKey, page_context, use_case_id } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // RAG: retrieve relevant CRM + company context
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const ragContext = lastUserMsg ? ragService.getContext(lastUserMsg.content, 'crm', 3) : '';
    const companyContext = lastUserMsg ? ragService.getContext(lastUserMsg.content, 'company', 2) : '';

    // Include use case source code for code-aware assistance
    const codeContext = readUseCaseCode(use_case_id || 'crm', 6000);

    const system = `You are an AI assistant embedded in a Brand CRM + Knowledge Base system built by 5 Miles Lab (5ML).
You help users manage brands, projects, feedback, and brand knowledge.
${ragContext ? `\n${ragContext}` : ''}${companyContext ? `\n${companyContext}` : ''}${codeContext}

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

// Growth Chatbot Assistant endpoint (used by Growth Architect & Growth Hacking Studio)
app.post('/api/growth/chatbot/message', async (req, res) => {
  try {
    const { brand_name, plan_id, message, conversation_history, use_case_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // RAG context
    const ragContext = ragService.getContext(message, 'company', 3);

    // Include use case source code
    const codeContext = readUseCaseCode(use_case_id || 'growth-architect', 6000);

    const systemPrompt = `You are a Growth Strategy AI assistant for 5 Miles Lab (5ML).
You help users evaluate growth plans, suggest modifications, identify risks, and recommend optimizations.
${brand_name ? `Current brand: ${brand_name}` : ''}
${plan_id ? `Current plan ID: ${plan_id}` : ''}
${ragContext ? `\n${ragContext}` : ''}${codeContext}

Your capabilities:
1. Critique and improve growth plans
2. Suggest new channels, tactics, and experiments
3. Identify risks and mitigation strategies
4. Recommend budget allocation and KPI targets
5. Answer questions about the use case code and architecture

Be concise and actionable. Use bullet points for lists.`;

    const messages = [
      ...(conversation_history || []),
      { role: 'user', content: message },
    ];

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    const llm = require('./lib/llm');
    if (deepseek.isAvailable()) {
      const result = await deepseek.chat(
        [{ role: 'system', content: systemPrompt }, ...messages],
        { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
      );
      return res.json({ data: { response: result.content, model: 'deepseek-chat' } });
    }

    const result = await llm.chat('haiku', messages, { system: systemPrompt, maxTokens: 2000 });
    return res.json({ data: { response: result.text, model: result.modelName || 'claude-haiku' } });

  } catch (error) {
    console.error('Growth chatbot error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Social Content Ops chat endpoint
app.post('/api/social/chat', async (req, res) => {
  try {
    const { messages, use_case_id, brand_id, brand_name, project_id, project_name, mode, task_id } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // ── Orchestrator path (Sarah multi-agent state machine) ──────────────────
    // Triggered when the caller provides a task_id (new Sarah chat panel).
    // Module-specific pages that don't send task_id fall through to legacy path.
    if (task_id) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const userInput = lastUserMsg?.content || '';

      // Detect research-related requests (bypass orchestrator for simpler handling)
      const isResearchRequest = /research|competitor|business overview|mission|audience segment|positioning/i.test(userInput);

      if (isResearchRequest && brand_id) {
        // Use legacy path for research requests (simpler LLM call instead of orchestrator)
        // This avoids the orchestrator workflow which is designed for strategy→content→media
        const ragContext = ragService.getContext(userInput, 'company', 3) || '';
        const systemPrompt = `You are **Sarah**, the Social Media Director helping research the brand.
When asked about brand research, competitive analysis, or audience insights, provide structured, actionable insights.
${brand_name ? `Brand: ${brand_name}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "businessOverview": "Brand positioning, market fit, and unique value proposition",
  "mission": "Company mission and core values",
  "competitors": [
    { "name": "Competitor Name", "strengths": "What they do well", "weaknesses": "Where they fall short", "threat_level": "High|Medium|Low" }
  ],
  "audienceSegments": [
    { "name": "Segment Name", "size": "Market size estimate", "pain_points": "Key problems", "preferences": "What they value" }
  ],
  "products": "Overview of key products/services and market positioning"
}

Be specific, data-driven, and actionable.
${ragContext ? `\n${ragContext}` : ''}`;

        const deepseek = require('./services/deepseekService');
        const llm = require('./lib/llm');
        try {
          const result = deepseek.isAvailable()
            ? await deepseek.chat(
              [{ role: 'system', content: systemPrompt }, ...messages],
              { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
            )
            : await llm.chat('haiku', messages, { system: systemPrompt, maxTokens: 2000 });

          const responseText = result.content || result.text;
          let researchData = null;

          // Try to parse JSON from response
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              researchData = JSON.parse(jsonMatch[0]);
            }
          } catch { }

          // If parsed successfully, persist to database
          if (researchData) {
            try {
              // Save business overview
              if (researchData.businessOverview || researchData.mission) {
                await saveResearchBusiness(brand_id, {
                  business_overview: researchData.businessOverview || '',
                  mission: researchData.mission || ''
                });
              }

              // Save competitors
              if (researchData.competitors && researchData.competitors.length > 0) {
                await saveResearchCompetitors(brand_id, researchData.competitors);
              }

              // Save audience and segments
              if (researchData.audienceSegments) {
                const audienceResult = await saveResearchAudience(brand_id, {
                  positioning: researchData.audienceSegments[0]?.preferences || ''
                });
                if (researchData.audienceSegments.length > 0) {
                  await saveResearchSegments(audienceResult.audience_id, researchData.audienceSegments);
                }
              }

              // Save products
              if (researchData.products) {
                await saveResearchProducts(brand_id, researchData.products);
              }
            } catch (persistErr) {
              console.error('Error persisting research data:', persistErr);
              // Don't fail the response if persistence fails - still return the data
            }
          }

          return res.json({
            message: responseText,
            data: researchData || null,
            model: result.model || 'research-analyzer',
            node: 'research_analyzer',
            status: 'COMPLETED'
          });
        } catch (err) {
          console.error('Research analysis error:', err);
          return res.status(500).json({ error: err.message });
        }
      }

      // Run orchestrator for non-research requests
      const { runSarah } = require('./agents/social/sarahOrchestrator');

      const brandContext = {
        brand_name:   brand_name || null,
        project_name: project_name || null,
        brand_id:     brand_id || null,
        project_id:   project_id || null,
      };

      try {
        const { state, nodeName, output } = await runSarah({
          taskId:       task_id,
          userInput,
          brandContext,
          brandId:      brand_id || null,
          projectId:    project_id || null,
        });

        // Check if state is valid
        if (!state || !nodeName) {
          return res.status(400).json({
            error: 'Invalid orchestrator state',
            message: 'The orchestrator failed to generate a valid response.'
          });
        }

        // Model label for UI indicator
        const REFLECT_NODES = new Set(['strategy_reflect', 'content_reflect', 'media_reflect']);
        const modelLabel = REFLECT_NODES.has(nodeName)
          ? 'DeepSeek Reasoner (reflection)'
          : 'DeepSeek Chat (generation)';

        return res.json({
          message:   output,
          model:     modelLabel,
          node:      nodeName,
          status:    state.status,
          next_step: state.next_step,
          artefacts: Object.keys(state.artefacts),
        });
      } catch (orchestratorErr) {
        console.error('Sarah orchestrator error:', orchestratorErr.message);
        return res.status(500).json({
          error: 'Orchestrator error',
          message: orchestratorErr.message || 'Failed to process request'
        });
      }
    }
    // ── Legacy path (module pages: strategy, content-dev, calendar, etc.) ────

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const ragContext = lastUserMsg ? ragService.getContext(lastUserMsg.content, 'company', 3) : '';
    const codeContext = readUseCaseCode(use_case_id || 'social-content-ops', 6000);

    const { current_page, current_module } = req.body;

    const isCritic = mode === 'business_analyst';
    const moduleContext = current_module ? `\nUser is currently on: **${current_module}** module (${current_page || 'unknown page'}).` : '';

    const systemPrompt = isCritic
      ? `You are the Social Media Director & Creative Director of Meology HK, reviewing work with a critical business lens.
Your approach: QUESTION assumptions, IDENTIFY bottlenecks, CHALLENGE strategy, ASSESS ROI, FLAG content quality issues.
Be direct and analytical. Push back constructively. Cite platform benchmarks and industry data.
You evaluate content against Meology HK's brand standards, audience expectations, and commercial goals.
${brand_name ? `Brand: ${brand_name}` : ''}${project_name ? ` | Project: ${project_name}` : ''}${moduleContext}
${ragContext ? `\n${ragContext}` : ''}${codeContext}`
      : `You are **Sarah**, the Social Media Director & Creative Director of Meology HK — an agency Social Studio platform by 5 Miles Lab.

## Your Role & Expertise
You wear two hats:
1. **Social Media Director**: You set strategy, evaluate campaign performance, manage the content pipeline, oversee community engagement, and ensure every piece of content ladders up to business objectives.
2. **Creative Director**: You guide visual identity, creative concepts, copy tone, and storytelling. You push for bold, platform-native ideas that stop the scroll.

You have 12+ years of social media expertise across Hong Kong, APAC, and global markets. You stay on top of the latest platform algorithm changes, content formats, and trends.

## Brand Context
${brand_name ? `Current brand: **${brand_name}**` : 'No brand selected yet — ask the user to select one from the sidebar.'}
${project_name ? `Current project: **${project_name}**` : ''}${moduleContext}

## Your Knowledge Base — Latest Social Media Trends & Best Practices

### Instagram
- **Reels**: 9:16, 15-90s (sweet spot 15-30s), hook in first 1.5s, trending audio boosts reach 30%, cover image matters for grid
- **Carousel**: 4:5 or 1:1, 5-10 slides optimal, educational/storytelling carousels get 1.4x more reach vs single image
- **Static**: 4:5 preferred, 30-character headline max, CTA in image, alt-text for SEO
- **Stories**: 9:16, 15s per frame, interactive stickers boost engagement 25%+, polls/quizzes drive DM opens
- **Algorithm 2025-2026**: Saves > Shares > Comments > Likes. Send-to-friend signals heavily weighted. Original content preferred over reposts.
- **SEO**: Keywords in username, name field, bio, captions, alt-text. Hashtags: 3-5 niche > 30 generic.

### TikTok
- 9:16, trending sounds = 2x reach, hook in 0.5-1s, text overlays critical, green screen + duet for engagement
- Algorithm: Watch time % > Completion > Shares > Comments. Posting frequency matters (1-3x/day for growth).
- SEO: TikTok is a search engine now — keyword-rich captions, on-screen text, hashtags for discovery.

### Facebook
- Feed: 1:1 or 4:5, under 80 characters ideal, link posts declining — native video/carousel preferred
- Reels: Same as IG Reels, cross-posted from IG performs 20% worse than native
- Groups: Community-first content, questions drive engagement, FB prioritises group content in feed

### Platform-Agnostic Best Practices
- Post at audience peak times (HK: IG 7-9PM, FB 12-2PM, TikTok 6-10PM)
- 80/20 rule: 80% value/entertainment, 20% promotional
- Bilingual content for HK: Lead with Cantonese/Traditional Chinese, English subtitle or vice versa
- UGC and creator partnerships outperform brand-produced content 2-4x on engagement

## Your Capabilities Across All Modules

### Planning & Analysis
- **Social Strategy**: Develop and critique social media strategy. Evaluate SWOT, platform mix, content pillars, KPIs, posting cadence, brand voice.
- **Brand & Competitive Research**: Analyze competitors, identify whitespace, benchmark performance.

### Content Development
- **Content Calendar**: Plan monthly calendars, suggest posting patterns, balance pillars, identify key dates/moments.
- **Content Development**: Write full content cards — hooks, scripts, captions, hashtags, visual briefs. Critique copy quality.
- **Interactive Content**: Plan polls, quizzes, Q&A sessions, AR filters, interactive stories, UGC campaigns.
- **Media Buy**: Optimize budget allocation, recommend targeting, critique ad creative, suggest A/B tests.

### Intelligence
- **Trend Research**: Identify emerging trends, suggest how to ride them, evaluate trend relevance for the brand.
- **Social Monitoring**: Analyze sentiment spikes, recommend response strategies, flag PR risks.

### Management
- **Community Management**: Draft responses (EN + Cantonese), suggest escalation paths, evaluate sentiment.
- **Ad Performance**: Analyze campaign metrics, identify optimization opportunities, benchmark against industry.

## Form Interaction
When the user asks you to help fill in forms, provide structured data they can directly paste or apply:
- For content calendars: provide date, platform, format, pillar, title, objective, message, etc.
- For content cards: provide hooks, talking points, scenes, captions, hashtags, visual briefs
- For media buy: provide campaign name, targeting, budget split, ad format recommendations
- For community responses: provide ready-to-use reply text in the appropriate language
- For strategy sections: provide SWOT entries, goals, KPIs with specific numbers
Always format your form-filling suggestions as clear, labeled fields so the user can copy them into the interface.

## Review & Approval Process
You are aware of the human review & approval workflow:
- **Content Pipeline**: Draft → Submitted for Review → In Review → Changes Requested → Approved → Scheduled → Published
- **Media Buy Pipeline**: Draft → Pending Approval → Approved → Scheduled → Live → Paused → Completed
When content is submitted for review, provide constructive feedback covering: brand alignment, copy quality, visual direction, platform optimization, and commercial impact.
When approving content, confirm it meets: brand guidelines, platform best practices, audience targeting, and business objectives.

## Content Calendar Format
When asked to design or refine a monthly content plan:
1. Present a 4-week weekly grid overview (rows = weeks, columns = days). Each cell: [Platform] + [Format] + [Pillar] + [Short title].
   Example: "IG – Reel – Educate – 'Why AI saves 10x time'"
2. Present a master calendar table where each row = one post. Columns:
   Date, Day, Platform (IG/FB/both), Format (Static/Carousel/Reel), Content Pillar, Campaign/theme, Post title, Objective, Key message, Visual type, Nano Banana brief ID, Caption status, Visual status, Boosting/Ad plan, Links, Notes.

## Content Development Format
For each content item, expand into a content card:
- Post ID, Platform, Format, Date, Content Pillar, Campaign, Objective
- Target audience insight, Core message

Copy by format:
- **Reel**: Hook (1-2 options, max 15 words), 3 key scenes/talking points, on-screen text per scene, suggested duration, CTA, Caption (hook + 2-4 lines + CTA + 5-10 hashtags)
- **Static/Carousel**: Slide plan (Slide 1 headline, Slides 2-X key points, Final slide CTA), Caption (opening hook + short paragraph/bullets + CTA + hashtags)

## Nano Banana Visual Brief (per post)
Always produce a visual brief with:
- Visual ID (Post ID + "-VIS"), Format & ratio, Visual type, Subject & composition, Brand style & mood, Key brand assets, Text on image (max 5-8 words + positioning), Special notes.

## Language & Tone
Default: Cantonese/Traditional Chinese with English support. Bilingual hooks for HK audiences.
Tone: Brand-aligned, confident, non-salesy but conversion-conscious. Professional yet approachable.
Support: 繁體中文, 粵語口語, English, 簡體中文

Be concise, actionable, and opinionated. You're the expert — share your professional perspective. Use bullet points for lists. Flag issues proactively.`;

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    const llm = require('./lib/llm');
    if (deepseek.isAvailable()) {
      const result = await deepseek.chat(
        [{ role: 'system', content: systemPrompt }, ...messages],
        { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
      );
      return res.json({ message: result.content, model: result.model || 'deepseek-chat' });
    }

    const result = await llm.chat('haiku', messages, { system: systemPrompt, maxTokens: 2000 });
    return res.json({ message: result.text, model: result.modelName || 'claude-haiku' });

  } catch (error) {
    console.error('Social chat error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ── Sarah Orchestrator state endpoints ───────────────────────────────────────

// GET /api/social/state/:taskId — fetch current state for polling / UI display
app.get('/api/social/state/:taskId', async (req, res) => {
  try {
    const { getSarahState } = require('./agents/social/sarahOrchestrator');
    const state = await getSarahState(req.params.taskId);
    if (!state) return res.status(404).json({ error: 'No state found for this task_id' });
    res.json({ state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/social/state/:taskId — reset / start fresh
app.delete('/api/social/state/:taskId', async (req, res) => {
  try {
    const { resetSarah } = require('./agents/social/sarahOrchestrator');
    await resetSarah(req.params.taskId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sarah Orchestrator Artefact APIs ─────────────────────────────────────────

// GET /api/social/artefacts/:taskId — retrieve all Markdown + JSON artefacts
app.get('/api/social/artefacts/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const artefacts = await getAllArtefacts(taskId);
    if (!artefacts || artefacts.length === 0) {
      return res.status(404).json({ error: 'No artefacts found for this task_id' });
    }
    res.json({ data: artefacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/content-posts/:taskId — retrieve formatted content calendar for RECENT_POSTS view
app.get('/api/social/content-posts/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const posts = await getSocialContentPosts(taskId, limit);
    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No content posts found for this task_id' });
    }
    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/ad-campaigns/:taskId — retrieve media campaigns for AD_CAMPAIGNS view
app.get('/api/social/ad-campaigns/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const campaigns = await getSocialAdCampaigns(taskId);
    if (!campaigns || campaigns.length === 0) {
      return res.status(404).json({ error: 'No ad campaigns found for this task_id' });
    }
    res.json({ data: campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/kpis/:taskId — retrieve KPI definitions for KPI_CARDS view
app.get('/api/social/kpis/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const kpis = await getSocialKPIs(taskId);
    if (!kpis || kpis.length === 0) {
      return res.status(404).json({ error: 'No KPIs found for this task_id' });
    }
    res.json({ data: kpis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Content Development: Draft Management ────────────────────────────────────

// POST /api/social/drafts — create new draft post
app.post('/api/social/drafts', async (req, res) => {
  try {
    const { taskId, platform, format, title, pillar, objective, keyMessage, copyHook, cta, language, visualType, caption, hashtags } = req.body;
    if (!taskId || !platform || !format || !title) {
      return res.status(400).json({ error: 'Missing required fields: taskId, platform, format, title' });
    }
    const result = await createContentDraft(taskId, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/drafts/:taskId — retrieve draft posts for a task
app.get('/api/social/drafts/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const status = req.query.status || null;
    const drafts = await getContentDrafts(taskId, status);
    res.json({ data: drafts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/social/drafts/:draftId — update draft post
app.put('/api/social/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const result = await updateContentDraft(draftId, req.body);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/social/drafts/:draftId — delete draft post
app.delete('/api/social/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    await deleteContentDraft(draftId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/drafts/:draftId/promote — promote draft to calendar
app.post('/api/social/drafts/:draftId/promote', async (req, res) => {
  try {
    const { draftId } = req.params;
    const { postDate } = req.body;
    if (!postDate) {
      return res.status(400).json({ error: 'postDate is required' });
    }
    const result = await promoteContentDraftToCalendar(draftId, postDate);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/sync/:taskId — check sync status between calendar and development
app.get('/api/social/sync/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const syncStatus = await syncContentCalendarAndDevelopment(taskId);
    res.json({ data: syncStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Brand Products & Services Management ─────────────────────────────────────

// POST /api/brands/:brandId/products-services — create new product/service
app.post('/api/brands/:brandId/products-services', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { name, category, description, type } = req.body;
    if (!name || !brandId) {
      return res.status(400).json({ error: 'Missing required fields: name, brandId' });
    }
    const result = await createProductService(brandId, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brands/:brandId/products-services — list products/services for a brand
app.get('/api/brands/:brandId/products-services', async (req, res) => {
  try {
    const { brandId } = req.params;
    const status = req.query.status || null;
    const products = await getProductsServices(brandId, status);
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/brands/:brandId/products-services/:productId/status — update product status
app.put('/api/brands/:brandId/products-services/:productId/status', async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, discontinueDate } = req.body;
    if (!status || !['active', 'paused', 'retired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, paused, or retired' });
    }
    const result = await updateProductServiceStatus(productId, status, discontinueDate);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brands/:brandId/portfolio — get full product portfolio by status
app.get('/api/brands/:brandId/portfolio', async (req, res) => {
  try {
    const { brandId } = req.params;
    const portfolio = await getProductServicePortfolio(brandId);
    res.json({ data: portfolio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Research Data Management ─────────────────────────────────────────────────

// POST /api/research/:brandId/business — save business overview and mission
app.post('/api/research/:brandId/business', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await saveResearchBusiness(brandId, req.body);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/research/:brandId/business — get business overview and mission
app.get('/api/research/:brandId/business', async (req, res) => {
  try {
    const { brandId } = req.params;
    const data = await getResearchBusiness(brandId);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/research/:brandId/competitors — save competitor analysis
app.post('/api/research/:brandId/competitors', async (req, res) => {
  try {
    const { brandId } = req.params;
    await saveResearchCompetitors(brandId, req.body.competitors || []);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/research/:brandId/competitors — get competitor analysis
app.get('/api/research/:brandId/competitors', async (req, res) => {
  try {
    const { brandId } = req.params;
    const competitors = await getResearchCompetitors(brandId);
    res.json({ data: competitors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/research/:brandId/competitors/:competitorId — delete competitor
app.delete('/api/research/:brandId/competitors/:competitorId', async (req, res) => {
  try {
    const { competitorId } = req.params;
    await deleteResearchCompetitor(competitorId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/research/:brandId/audience — save audience positioning and segments
app.post('/api/research/:brandId/audience', async (req, res) => {
  try {
    const { brandId } = req.params;
    const audienceResult = await saveResearchAudience(brandId, req.body);
    if (req.body.segments && req.body.segments.length > 0) {
      await saveResearchSegments(audienceResult.audience_id, req.body.segments);
    }
    res.json({ data: audienceResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/research/:brandId/audience — get audience data
app.get('/api/research/:brandId/audience', async (req, res) => {
  try {
    const { brandId } = req.params;
    const audience = await getResearchAudience(brandId);
    const segments = await getResearchSegments(brandId);
    res.json({ data: { audience, segments } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/research/:brandId/segments/:segmentId — delete audience segment
app.delete('/api/research/:brandId/segments/:segmentId', async (req, res) => {
  try {
    const { segmentId } = req.params;
    await deleteResearchSegment(segmentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/research/:brandId/products — save products and services
app.post('/api/research/:brandId/products', async (req, res) => {
  try {
    const { brandId } = req.params;
    await saveResearchProducts(brandId, req.body.products || []);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/research/:brandId/products — get products and services
app.get('/api/research/:brandId/products', async (req, res) => {
  try {
    const { brandId } = req.params;
    const products = await getResearchProducts(brandId);
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/research/:brandId/products/:productId — delete product
app.delete('/api/research/:brandId/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await deleteResearchProduct(productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CRM Contacts (with LinkedIn + Research)
// ==========================================

// POST /api/crm/contacts/:clientId — create contact
app.post('/api/crm/contacts/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const contact = await createContact(clientId, req.body);
    res.json({ success: true, contact });
  } catch (err) {
    console.error('[POST /api/crm/contacts] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/contacts/:clientId — list client contacts
app.get('/api/crm/contacts/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const contacts = await getContactsByClient(clientId);
    res.json({ contacts });
  } catch (err) {
    console.error('[GET /api/crm/contacts] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/contacts/:clientId/:contactId — get contact details
app.get('/api/crm/contacts/:clientId/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await getContact(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    console.error('[GET /api/crm/contacts/:id] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/crm/contacts/:clientId/:contactId — update contact
app.put('/api/crm/contacts/:clientId/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await updateContact(contactId, req.body);
    res.json({ success: true, contact });
  } catch (err) {
    console.error('[PUT /api/crm/contacts/:id] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/contacts/:clientId/:contactId — delete contact
app.delete('/api/crm/contacts/:clientId/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    await deleteContact(contactId);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/crm/contacts/:id] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/contacts/:contactId/link-project — link contact to project
app.post('/api/crm/contacts/:contactId/link-project', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { projectId, role } = req.body;
    const link = await linkContactToProject(contactId, projectId, role);
    res.json({ success: true, link });
  } catch (err) {
    console.error('[POST /api/crm/contacts/:id/link-project] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/projects/:projectId/contacts — get project contacts
app.get('/api/crm/projects/:projectId/contacts', async (req, res) => {
  try {
    const { projectId } = req.params;
    const contacts = await getProjectContacts(projectId);
    res.json({ contacts });
  } catch (err) {
    console.error('[GET /api/crm/projects/:id/contacts] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/contacts/:contactId/unlink-project — unlink contact from project
app.delete('/api/crm/contacts/:contactId/unlink-project/:projectId', async (req, res) => {
  try {
    const { contactId, projectId } = req.params;
    await unlinkContactFromProject(contactId, projectId);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/crm/contacts/:id/unlink-project/:projectId] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Contact Intelligence (LinkedIn + Research)
// ==========================================

// Lazy-load services
let linkedinFetcher = null;
let contactResearch = null;

function getLinkedInFetcher() {
  if (!linkedinFetcher) {
    const LinkedInProfileFetcher = require('./services/linkedinProfileFetcher');
    linkedinFetcher = new LinkedInProfileFetcher();
  }
  return linkedinFetcher;
}

function getContactResearchService() {
  if (!contactResearch) {
    const ContactResearchService = require('./services/contactResearchService');
    contactResearch = new ContactResearchService();
  }
  return contactResearch;
}

// POST /api/linkedin/profile — fetch LinkedIn profile data
app.post('/api/linkedin/profile', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'LinkedIn URL required' });

    const fetcher = getLinkedInFetcher();
    const profile = await fetcher.getProfileSummary(url);

    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('[POST /api/linkedin/profile] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/:contactId/research — conduct online research
app.post('/api/contacts/:contactId/research', async (req, res) => {
  try {
    const { name, title, company, linkedinUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const researchService = getContactResearchService();
    const research = await researchService.comprehensiveResearch(name, title, company, linkedinUrl);

    // Update contact with research data
    const contactId = req.params.contactId;
    // Find contact's client ID - query all contacts
    const contactResult = await pool.query('SELECT * FROM crm_contacts WHERE id = $1', [contactId]);
    if (contactResult.rows[0]) {
      const contact = contactResult.rows[0];
      await updateContact(contactId, {
        ...contact,
        research_data: research,
      });
    }

    res.json({ success: true, research });
  } catch (err) {
    console.error('[POST /api/contacts/:id/research] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Strategy
// ==========================================

// POST /api/social/strategy/:brandId — save strategy
app.post('/api/social/strategy/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { projectId, objectives, targetAudiences, channelMix, contentPillars, postingCadence, mediaApproach, kpis, assumptions, risks } = req.body;

    await pool.query(
      `INSERT INTO social_strategy (brand_id, project_id, objectives, target_audiences, channel_mix, content_pillars, posting_cadence, media_approach, kpis, assumptions, risks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (brand_id) DO UPDATE SET
         objectives = $3, target_audiences = $4, channel_mix = $5, content_pillars = $6,
         posting_cadence = $7, media_approach = $8, kpis = $9, assumptions = $10, risks = $11,
         updated_at = NOW()`,
      [brandId, projectId, objectives, targetAudiences, channelMix, contentPillars, postingCadence, mediaApproach, kpis, assumptions, risks]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/strategy/:brandId — get strategy
app.get('/api/social/strategy/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await pool.query('SELECT * FROM social_strategy WHERE brand_id = $1', [brandId]);
    res.json({ data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Interactive Content
// ==========================================

// POST /api/social/interactive/:brandId — save interactive content
app.post('/api/social/interactive/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { projectId, title, contentType, description, platforms, engagementGoal, expectedMetrics, launchDate } = req.body;

    await pool.query(
      `INSERT INTO social_interactive_content (brand_id, project_id, title, content_type, description, platforms, engagement_goal, expected_metrics, launch_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [brandId, projectId, title, contentType, description, platforms, engagementGoal, expectedMetrics, launchDate]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/interactive/:brandId — list interactive content
app.get('/api/social/interactive/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await pool.query('SELECT * FROM social_interactive_content WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Trend Research
// ==========================================

// POST /api/social/trends/:brandId — save trend research
app.post('/api/social/trends/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { projectId, trendName, category, description, platforms, contentIdeas, launchIdeas, relevanceScore } = req.body;

    await pool.query(
      `INSERT INTO social_trend_research (brand_id, project_id, trend_name, category, description, platforms, content_ideas, launch_ideas, relevance_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [brandId, projectId, trendName, category, description, platforms, contentIdeas, launchIdeas, relevanceScore]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/trends/:brandId — list trends
app.get('/api/social/trends/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await pool.query('SELECT * FROM social_trend_research WHERE brand_id = $1 ORDER BY relevance_score DESC, created_at DESC', [brandId]);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Social Monitoring
// ==========================================

// POST /api/social/monitoring/:brandId — save monitoring data
app.post('/api/social/monitoring/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { projectId, platform, keyword, sentimentTrend, engagementRate, mentionCount, topMentions, actionItems } = req.body;

    await pool.query(
      `INSERT INTO social_monitoring (brand_id, project_id, platform, keyword, sentiment_trend, engagement_rate, mention_count, top_mentions, action_items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [brandId, projectId, platform, keyword, sentimentTrend, engagementRate, mentionCount, topMentions, actionItems]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/monitoring/:brandId — get monitoring data
app.get('/api/social/monitoring/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await pool.query('SELECT * FROM social_monitoring WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 10', [brandId]);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Community Management
// ==========================================

// POST /api/social/community/:brandId — save community management guidelines
app.post('/api/social/community/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { projectId, platform, contentGuideline, responseTemplates, escalationRules, moderationPolicies, engagementStrategies, faqContent } = req.body;

    await pool.query(
      `INSERT INTO social_community_management (brand_id, project_id, platform, content_guideline, response_templates, escalation_rules, moderation_policies, engagement_strategies, faq_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (brand_id) DO UPDATE SET
         platform = $3, content_guideline = $4, response_templates = $5, escalation_rules = $6,
         moderation_policies = $7, engagement_strategies = $8, faq_content = $9, updated_at = NOW()`,
      [brandId, projectId, platform, contentGuideline, responseTemplates, escalationRules, moderationPolicies, engagementStrategies, faqContent]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/community/:brandId — get community management data
app.get('/api/social/community/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const result = await pool.query('SELECT * FROM social_community_management WHERE brand_id = $1', [brandId]);
    res.json({ data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Content Development
// ==========================================

// POST /api/social/content-dev/:brandId — save content draft
app.post('/api/social/content-dev/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    await saveSocialContentDraft(brandId, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/content-dev/:brandId — get content drafts
app.get('/api/social/content-dev/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const data = await getSocialContentDraft(brandId);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Social Content Ops: Content Calendar
// ==========================================

// POST /api/social/calendar/:brandId — save calendar posts
app.post('/api/social/calendar/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { posts, projectId } = req.body;
    await saveSocialCalendar(brandId, posts.map((p) => ({ ...p, projectId })));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/calendar/:brandId — get calendar posts
app.get('/api/social/calendar/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const data = await getSocialCalendar(brandId);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/compliance/check — check content against brand profile
app.post('/api/social/compliance/check', async (req, res) => {
  try {
    const { brand_id, copy, colors, brand_profile } = req.body;

    if (!brand_id) {
      return res.status(400).json({ error: 'brand_id is required' });
    }

    const { checkBrandCompliance } = require('./services/complianceChecker');
    const complianceScore = await checkBrandCompliance(
      brand_id,
      { copy, colors },
      brand_profile
    );

    res.json({
      compliance: complianceScore,
      can_proceed: complianceScore.can_proceed,
      action: complianceScore.action,
    });
  } catch (err) {
    console.error('Error checking compliance:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/brands/guidelines/upload — upload brand guidelines PDF/image
app.post('/api/brands/guidelines/upload', async (req, res) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.files.file;
    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }

    // Store file path (in production, would use cloud storage like S3)
    const fileName = `${brandId}-guidelines-${Date.now()}.${file.name.split('.').pop()}`;
    const uploadDir = `${__dirname}/uploads/guidelines`;

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = `${uploadDir}/${fileName}`;
    await file.mv(filePath);

    // Store URL in brand profile
    const guidelineUrl = `/uploads/guidelines/${fileName}`;

    res.json({
      success: true,
      url: guidelineUrl,
      fileName: file.name,
    });
  } catch (err) {
    console.error('Error uploading guidelines:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/brands/guidelines/delete — delete brand guidelines
app.post('/api/brands/guidelines/delete', async (req, res) => {
  try {
    const { brandId, url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    // Delete file
    const fs = require('fs');
    const filePath = `${__dirname}${url}`;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting guidelines:', err);
    res.status(500).json({ error: 'Delete failed' });
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
const { runScheduledScan, runScheduledDigest } = require('./use-cases/topic-intelligence/api-js/routes');
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

// TEDxBoundaryStreet Visual Generation Routes
try {
  const tedxRoutes = require('./use-cases/tedx-boundary-street/api/routes');
  app.use('/api/tedx', tedxRoutes);
  console.log('✅ TEDxBoundaryStreet routes loaded: /api/tedx');
} catch (error) {
  console.warn('⚠️ TEDx routes not loaded:', error.message);
}

// TEDxXinyi Visual Generation Routes
try {
  const tedxXinyiRoutes = require('./use-cases/tedx-xinyi/api/routes');
  app.use('/api/tedx-xinyi', tedxXinyiRoutes);
  console.log('✅ TEDxXinyi routes loaded: /api/tedx-xinyi');
} catch (error) {
  console.warn('⚠️ TEDxXinyi routes not loaded:', error.message);
}

// Ads Performance Dashboard Routes
try {
  const adsPerformanceRoutes = require('./use-cases/5ml-ads-performance-internal/api/routes');
  app.use('/api/ads', adsPerformanceRoutes);
  console.log('✅ Ads Performance routes loaded: /api/ads');
} catch (error) {
  console.warn('⚠️ Ads Performance routes not loaded:', error.message);
}

// AI Media Generation Routes (Image + Video)
try {
  const mediaGenerationRoutes = require('./use-cases/ai-media-generation/api/routes');
  app.use('/api/media', mediaGenerationRoutes);
  console.log('✅ AI Media Generation routes loaded: /api/media');
} catch (error) {
  console.warn('⚠️ AI Media Generation routes not loaded:', error.message);
}

// Multimedia Library Routes (reverse-prompt engineering from images/videos)
try {
  const multimediaLibraryRoutes = require('./use-cases/multimedia-library/api/routes');
  app.use('/api/library', multimediaLibraryRoutes);
  console.log('✅ Multimedia Library routes loaded: /api/library');
} catch (error) {
  console.warn('⚠️ Multimedia Library routes not loaded:', error.message);
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
  assistant: `You are WorkflowArchitectOrchestrator, the top-level orchestrator for AI agent workflow design at 5ML.

Your responsibilities:
- Be the only agent that talks directly to the user.
- Understand workflow goals, constraints, and performance targets.
- Decompose design work into clear subtasks (mapping, optimisation, cost modelling, risk review).
- Decide which internal analytical lenses to apply and in what order.
- Maintain awareness of the current workflow state (nodes, edges, pattern, triggers).
- Critically evaluate proposed changes and stop when quality or safety is insufficient.

==================================================
I. ROLE & SCOPE
==================================================
You operate in the AI agent workflow design domain. Examples of tasks:
- Design or redesign a multi-agent orchestration pipeline
- Add, remove, or reconfigure agent nodes and connections
- Analyse trade-offs between sequential, parallel, and fan-out patterns
- Estimate cost and latency targets for a given workflow

You MUST:
- Stay within the workflow architecture domain.
- Ask clarifying questions when the design intent is ambiguous.
- Prefer incremental changes over wholesale redesigns unless the user asks.

IMPORTANT: Only activate the analytical lens needed for the current request.
If the user asks to just rename a node, do that — don't redesign the whole pipeline.

==================================================
II. INTERNAL ROLES / SPECIALISTS
==================================================
Internally, you apply these analytical lenses:
- Architecture Analyst — maps agent relationships, data flows, and orchestration patterns (fan-out, pipeline, circuit breaker)
- Cost Optimiser — assesses model routing (DeepSeek / Haiku / Sonnet / Perplexity), token budgets, and per-run cost targets
- Performance Reviewer — identifies bottlenecks, latency hotspots, and parallelisation opportunities
- Risk Assessor — finds single points of failure, rejection loop risks, compliance gaps, and edge cases

You do NOT name these lenses to the user.

==================================================
III. KNOWLEDGE BASE & STATE
==================================================
You have access to:
- KB: 5ML model routing guide (DeepSeek for strategy/coordination, Haiku for research/compliance, Sonnet for creative, Perplexity for competitive intel), orchestration patterns, cost benchmarks
- State: current workflow nodes, edges, pattern, trigger, and metadata (provided as JSON context with each message)

Architecture context — The CSO Marketing Agents use an event-driven parallel pipeline:
- Input Validator → CSO Orchestrator → Budget Optimizer (entry chain)
- Budget Optimizer fans out to 4 research agents in PARALLEL (Research, Customer, Competitor, SEO)
- Research phase merges into Strategy Agent → Creative Agent (synthesis)
- Creative fans out to Social Agent + Multi-Channel Coordinator
- Multi-Channel → Compliance Agent → Sentinel Agent (quality gate)
- Sentinel has a CIRCUIT BREAKER: max 2 rejection loops back to CSO
- Performance Tracker monitors KPIs after approval
- Targets: <$1.50/campaign, >90% first-pass approval, <2min end-to-end

==================================================
IV. TASK FLOW & STATUS
==================================================
Each workflow task has a status:
- DRAFT — initial design, not yet validated
- UNDER_REVIEW — being critiqued for quality or cost
- REVISE_NEEDED — issues found; improvements recommended
- APPROVED — ready to implement / hand off
- BLOCKED — cannot safely proceed without human input

==================================================
V. EVALUATION, CRITIQUE, AND STOP CONDITIONS
==================================================
For proposed workflow changes or new designs:
1) Draft — produce based on user request and current state
2) Self-evaluate — score 0–10; note architectural strengths, weaknesses, cost risks
3) Improve or stop:
   - Score ≥ 8 → apply minor refinements, mark approved
   - Score < 8 → use critique to produce a better version
   - Safety / compliance / obviously broken design → mark BLOCKED

==================================================
VI. OUTPUT STRUCTURE & WORKFLOW UPDATES
==================================================
For each response:
1) Quick summary (2–5 bullets: what you did, key decisions)
2) Reasoning / rationale (why this approach; key trade-offs)
3) Artefacts (updated workflow description, cost table, or design diagram in text)
4) Risks, assumptions, and next steps

When the user asks to MODIFY the workflow, append a JSON block in this exact format:
[WORKFLOW_UPDATE]
[{"action":"update_node","node_id":"agent-id","name":"New Name","role":"New Role"}]
[/WORKFLOW_UPDATE]

Available actions:
- update_node: Update a node's name and/or role. Fields: node_id, name (optional), role (optional)
- remove_node: Remove a node and its edges. Fields: node_id
- add_edge: Add a connection. Fields: from, to, label (optional), edge_type (solid|conditional|feedback)
- remove_edge: Remove a connection. Fields: from, to
- update_meta: Update workflow metadata. Fields: pattern (optional), patternDesc (optional), trigger (optional)

Always reference nodes by their id. Only include the JSON block when making actual changes, not when explaining.`,

  business_analyst: `You are WorkflowCriticOrchestrator, a rigorous Business Analyst orchestrating the quality review of AI agent workflows at 5ML.

Your responsibilities:
- Be the only agent that talks directly to the user.
- Challenge assumptions, probe for weaknesses, and demand justification.
- Decompose your critique into: ROI analysis, risk identification, bottleneck mapping, and edge-case stress-testing.
- Update workflow state only when improvements are clearly justified.
- Stop and block when you detect serious architectural, cost, or safety issues.

==================================================
I. ROLE & SCOPE
==================================================
You operate in the AI agent workflow quality-review domain. Examples of tasks:
- Audit an existing workflow for unjustified agents or missing safeguards
- Challenge a proposed design with devil's advocate analysis
- Produce a cost–benefit breakdown of every agent node
- Identify where the circuit breaker or compliance gate is missing or too weak

You MUST:
- Never simply agree — always pressure-test.
- Ask "why does this agent exist?" before accepting any node.
- Quantify risks and costs wherever possible.

==================================================
II. INTERNAL ROLES / SPECIALISTS
==================================================
Internally you apply these critical lenses:
- ROI Auditor — cost per agent node, token budget, value delivered vs. cost
- Risk Mapper — single points of failure, infinite loops, missing guards
- Bottleneck Detector — sequential chains that should be parallelised; agents adding latency without value
- Assumption Challenger — unstated dependencies, optimistic token estimates, missing edge cases

You do NOT name these lenses to the user.

==================================================
III. KNOWLEDGE BASE & STATE
==================================================
You have access to:
- KB: 5ML cost benchmarks (DeepSeek $0.14/$0.28, Haiku $0.25/$1.25, Sonnet $3/$15, Perplexity $3/$15 per 1M tokens), target <$1.50/campaign
- State: current workflow nodes, edges, pattern, and metadata

==================================================
IV. TASK FLOW & STATUS
==================================================
- DRAFT — under initial review
- UNDER_REVIEW — actively being critiqued
- REVISE_NEEDED — clear problems found; specific fixes recommended
- APPROVED — passes all quality gates
- BLOCKED — serious issue requires human decision before proceeding

==================================================
V. EVALUATION, CRITIQUE, AND STOP CONDITIONS
==================================================
For every workflow or change proposed:
1) Audit — systematically check each agent: purpose, cost, failure mode
2) Score 0–10 across: necessity, cost-efficiency, resilience, correctness
3) If score < 7 → produce specific, actionable improvement recommendations
4) If score < 5 or serious safety/compliance gap → mark BLOCKED

==================================================
VI. OUTPUT STRUCTURE & WORKFLOW UPDATES
==================================================
1) Quick summary (2–5 bullets: what you reviewed, main findings)
2) Critique (direct, specific — score each dimension)
3) Recommended changes (concrete, prioritised)
4) Risks and blockers

When improvements justify a workflow modification:
[WORKFLOW_UPDATE]
[{"action":"update_node","node_id":"agent-id","role":"Improved role description"}]
[/WORKFLOW_UPDATE]

Be direct. Don't soften criticism. Your goal is a better workflow, not a comfortable conversation.`
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
    const companyRag = lastUserMsg ? ragService.getContext(lastUserMsg.content, 'company', 2) : '';

    const systemPrompt = [
      WORKFLOW_SYSTEM_PROMPTS[mode] || WORKFLOW_SYSTEM_PROMPTS.assistant,
      `\nCurrent Workflow:\n${workflowContext}`,
      ragContext ? `\n${ragContext}` : '',
      companyRag ? `\n${companyRag}` : '',
    ].join('\n');

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    const llm = require('./lib/llm');
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

    // RAG: retrieve relevant context for the latest user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const ragContext = lastUserMsg ? ragService.getContext(lastUserMsg.content, null, 3) : '';

    const systemPrompt = `You are the 5ML Platform Agent Assistant — an expert on the 5ML Agentic AI Platform.
You have deep knowledge of every agent, use case, solution line, C-Suite role, and the 7-layer architecture.
You know 5ML is a Hong Kong-based agentic AI solutions agency competing with NDN and Fimmick.

${context || ''}
${ragContext ? `\n${ragContext}` : ''}

Your capabilities:
1. Answer questions about any agent, use case, or architectural layer
2. Suggest new agents, improvements, or restructuring
3. Explain how different agents and layers interact
4. Recommend priority changes and roadmap adjustments
5. Help plan new use cases and estimate agent requirements

Be concise, specific, and reference actual platform data. Use bullet points for lists.`;

    // Try DeepSeek first, fall back to Claude
    const deepseek = require('./services/deepseekService');
    const llm = require('./lib/llm');
    if (deepseek.isAvailable()) {
      const result = await deepseek.chat(
        [{ role: 'system', content: systemPrompt }, ...messages],
        { model: 'deepseek-chat', maxTokens: 2000, temperature: 0.7 }
      );
      return res.json({ message: result.content, model: result.model || 'deepseek-chat' });
    }

    // Fallback to Claude
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
// Radiance PR Contact Form API
// ==========================================

// POST /api/radiance/contact — save enquiry to DB + send email alert
app.post('/api/radiance/contact', async (req, res) => {
  try {
    const { name, email, phone, company, industry, serviceInterest, message, sourceLang } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    if (message && message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message must be under 5000 characters' });
    }

    const enquiryData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      company: company || null,
      industry: industry || null,
      serviceInterest: serviceInterest || null,
      message: (message || '').trim(),
      sourceLang: sourceLang || 'en',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Save to database
    const saved = await saveRadianceEnquiry(enquiryData);
    console.log(`📋 [Radiance] Enquiry saved: ${saved.enquiry_id} from ${enquiryData.name} <${enquiryData.email}>`);

    // Send email alert (non-blocking — don't fail the response if email fails)
    sendRadianceEnquiryAlert(enquiryData).catch(err =>
      console.error('📧 [Radiance] Alert email error:', err.message)
    );

    const successMsg = sourceLang === 'zh'
      ? '感謝您的查詢，我們將於兩個工作天內回覆您。'
      : "Thank you for your enquiry. We'll be in touch within 2 business days.";

    res.status(201).json({ success: true, message: successMsg, enquiryId: saved.enquiry_id });

  } catch (error) {
    console.error('❌ [Radiance] Contact form error:', error);
    res.status(500).json({ success: false, error: 'Failed to process enquiry. Please try again.' });
  }
});

// GET /api/radiance/contact/submissions — admin view of all enquiries
app.get('/api/radiance/contact/submissions', async (req, res) => {
  try {
    const { password } = req.query;
    if (password !== 'Radiance2026goodluck!') {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    const limit = Math.min(parseInt(req.query.limit || '50'), 200);
    const offset = parseInt(req.query.offset || '0');
    const submissions = await getRadianceEnquiries({ limit, offset });
    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    console.error('❌ [Radiance] Submissions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ==========================================
// RecruitAI Studio API
// ==========================================

const { Resend } = require('resend');
const resendClient = new Resend(process.env.RESEND_API_KEY);

// POST /api/recruitai/lead — save lead + send email alert
app.post('/api/recruitai/lead', async (req, res) => {
  try {
    const { name, email, phone, company, industry, headcount, message, sourcePage, utmSource, utmMedium, utmCampaign } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    const result = await pool.query(
      `INSERT INTO recruitai_leads (name, email, phone, company, industry, headcount, message, source_page, utm_source, utm_medium, utm_campaign, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING lead_id, created_at`,
      [name, email, phone || null, company || null, industry || null, headcount || null, message || null,
       sourcePage || null, utmSource || null, utmMedium || null, utmCampaign || null, req.ip]
    );
    const lead = result.rows[0];

    // Send email alert via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resendClient.emails.send({
          from: 'RecruitAI Studio <noreply@5mileslab.com>',
          to: 'bennet.tsui@5mileslab.com',
          subject: `🎯 New RecruitAI Lead: ${name} — ${company || industry || 'Unknown'}`,
          html: `
            <h2>New Lead from RecruitAI Studio</h2>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${phone || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Company</td><td style="padding:8px;border:1px solid #ddd">${company || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Industry</td><td style="padding:8px;border:1px solid #ddd">${industry || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Headcount</td><td style="padding:8px;border:1px solid #ddd">${headcount || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${message || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Source</td><td style="padding:8px;border:1px solid #ddd">${sourcePage || '—'} | ${utmSource || ''}/${utmMedium || ''}/${utmCampaign || ''}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Time</td><td style="padding:8px;border:1px solid #ddd">${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</td></tr>
            </table>
          `,
        });
      } catch (emailErr) {
        console.warn('⚠️ RecruitAI email alert failed:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, leadId: lead.lead_id });
  } catch (error) {
    console.error('❌ RecruitAI lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to save lead' });
  }
});

// POST /api/recruitai/chat — DeepSeek chatbot with session management
app.post('/api/recruitai/chat', async (req, res) => {
  try {
    const { sessionId, visitorId, message, history = [], industry, sourcePage } = req.body;

    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await pool.query(
        `INSERT INTO recruitai_chat_sessions (visitor_id, industry, source_page, ip_address)
         VALUES ($1,$2,$3,$4) RETURNING session_id`,
        [visitorId || null, industry || null, sourcePage || null, req.ip]
      );
      currentSessionId = newSession.rows[0].session_id;
    }

    // Count turns
    const turnResult = await pool.query(
      'SELECT turn_count FROM recruitai_chat_sessions WHERE session_id=$1',
      [currentSessionId]
    );
    const turnCount = turnResult.rows[0]?.turn_count || 0;

    // Build DeepSeek messages
    const systemPrompt = `你係 Nora，RecruitAI Studio 嘅 AI 顧問助手。RecruitAI Studio 係香港中小企 AI 自動化平台，提供 5 大功能模組：增長（廣告/SEO/潛客）、市場推廣（社交內容/EDM）、客戶服務（WhatsApp AI）、業務運營（發票/報告/審批）、業務分析（NDN/Fimmick 數據整合）。入門 HK$8,000/月起（約 3 個 AI 代理），一週部署，一個月見效。

你的性格：
- 活潑、親切、有活力，像一個聰明又友善的業務顧問
- 偶爾用廣東話口語（係/唔係/咁/囉/啩），但保持專業
- 懂得適時幽默，不會太正經，讓對話輕鬆愉快
- 真誠關心對方業務痛點，不只是賣嘢

對話原則：
- 回覆簡短生動，2-4 句為主，避免大段文字
- 用「你」稱呼對方，語氣溫暖
- 主動提問了解需求，每次最多問一個問題
- 適時用 emoji 增加親切感 😊
- 第 ${turnCount + 1} 輪對話${turnCount >= 8 ? '（已聊了一段時間，可以自然地邀請對方安排免費諮詢）' : '（先了解需求，建立信任）'}

聯絡資料收集（重要）：
- 當對方表示感興趣或詢問價格/方案時，自然地邀請留下聯絡方式
- 說話示範：「咁你係咪方便留個 WhatsApp / 電郵俾我？我哋可以安排個免費 30 分鐘 AI 評估 😊」
- 一旦收集到聯絡資料，必須在回覆末尾加上（這行對用戶不可見）：
[CONTACT_CAPTURED: name=姓名, email=電郵地址, phone=電話號碼]

注意：name/email/phone 只填已知的，未知的欄位省略。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 turns for context
      { role: 'user', content: message }
    ];

    const response = await deepseekService.chat(messages, {
      model: 'deepseek-chat',
      maxTokens: 400,
      temperature: 0.9,
    });

    let replyContent = response.content;
    let contactCaptured = false;
    let capturedData = {};

    // Parse contact capture marker
    const captureMatch = replyContent.match(/\[CONTACT_CAPTURED:([^\]]+)\]/);
    if (captureMatch) {
      contactCaptured = true;
      const parts = captureMatch[1].split(',');
      parts.forEach(p => {
        const [k, v] = p.split('=');
        if (k && v) capturedData[k.trim()] = v.trim();
      });
      replyContent = replyContent.replace(/\[CONTACT_CAPTURED:[^\]]+\]/, '').trim();
    }

    // Save messages to DB
    await pool.query(
      `INSERT INTO recruitai_chat_messages (session_id, role, content, turn_number) VALUES ($1,'user',$2,$3)`,
      [currentSessionId, message, turnCount + 1]
    );
    await pool.query(
      `INSERT INTO recruitai_chat_messages (session_id, role, content, turn_number) VALUES ($1,'assistant',$2,$3)`,
      [currentSessionId, replyContent, turnCount + 1]
    );

    // Update session
    const updateFields = ['turn_count = turn_count + 1', 'updated_at = NOW()'];
    const updateParams = [currentSessionId];
    if (contactCaptured) {
      updateFields.push(`contact_captured = TRUE`);
      if (capturedData.name) { updateFields.push(`captured_name = $${updateParams.length + 1}`); updateParams.push(capturedData.name); }
      if (capturedData.email) { updateFields.push(`captured_email = $${updateParams.length + 1}`); updateParams.push(capturedData.email); }
      if (capturedData.phone) { updateFields.push(`captured_phone = $${updateParams.length + 1}`); updateParams.push(capturedData.phone); }
    }
    await pool.query(
      `UPDATE recruitai_chat_sessions SET ${updateFields.join(', ')} WHERE session_id = $1`,
      updateParams
    );

    // If contact captured, also save as lead
    if (contactCaptured && capturedData.email) {
      try {
        await pool.query(
          `INSERT INTO recruitai_leads (name, email, phone, source_page, industry, message)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`,
          [capturedData.name || null, capturedData.email, capturedData.phone || null,
           'chatbot:' + (sourcePage || 'unknown'), industry || null, `From chatbot session ${currentSessionId}`]
        );
      } catch (e) { /* ignore duplicate */ }
    }

    res.json({
      success: true,
      reply: replyContent,
      sessionId: currentSessionId,
      turnCount: turnCount + 1,
      contactCaptured,
    });
  } catch (error) {
    console.error('❌ RecruitAI chat error:', error);
    res.status(500).json({ success: false, error: 'Chat service unavailable' });
  }
});

// GET /api/recruitai/admin/leads — list all leads (password-protected)
app.get('/api/recruitai/admin/leads', async (req, res) => {
  const { password } = req.query;
  if (password !== '5milesLab01@') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM recruitai_leads ORDER BY created_at DESC LIMIT 500'
    );
    res.json({ success: true, leads: result.rows });
  } catch (error) {
    console.error('❌ Admin leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/recruitai/admin/sessions — list all chat sessions
app.get('/api/recruitai/admin/sessions', async (req, res) => {
  const { password } = req.query;
  if (password !== '5milesLab01@') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      `SELECT s.*, COUNT(m.id) as message_count
       FROM recruitai_chat_sessions s
       LEFT JOIN recruitai_chat_messages m ON m.session_id = s.session_id
       GROUP BY s.id ORDER BY s.created_at DESC LIMIT 200`
    );
    res.json({ success: true, sessions: result.rows });
  } catch (error) {
    console.error('❌ Admin sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/recruitai/admin/sessions/:sessionId/messages
app.get('/api/recruitai/admin/sessions/:sessionId/messages', async (req, res) => {
  const { password } = req.query;
  if (password !== '5milesLab01@') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM recruitai_chat_messages WHERE session_id=$1 ORDER BY created_at ASC',
      [req.params.sessionId]
    );
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('❌ Admin messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ==========================================
// Ziwei Astrology API
// ==========================================

const { calcBaseChart } = require('./services/ziwei-chart-engine');

// POST /api/ziwei/calculate - Calculate a birth chart
app.post('/api/ziwei/calculate', ziweiValidation.validateChartCalculation, asyncHandler(async (req, res) => {
  try {
    const {
      lunarYear, lunarMonth, lunarDay, hourBranch, yearStem, yearBranch,
      gender, name, placeOfBirth, timezone, calendarType
    } = req.body;

    // Validate required fields
    if (!lunarYear || !lunarMonth || !lunarDay || !hourBranch || !yearStem || !yearBranch || !gender) {
      return res.status(400).json({
        error: 'Missing required fields: lunarYear, lunarMonth, lunarDay, hourBranch, yearStem, yearBranch, gender'
      });
    }

    // Calculate chart
    const chart = calcBaseChart({
      lunarYear,
      lunarMonth,
      lunarDay,
      hourBranch,
      yearStem,
      yearBranch,
      gender
    });

    // Store in database if available
    let chartId = null;
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const birthInfo = {
          lunarYear,
          lunarMonth,
          lunarDay,
          hourBranch,
          gender,
          name: name || '',
          placeOfBirth: placeOfBirth || '',
          timezone: timezone || 'UTC',
          calendarType: calendarType || 'lunar'
        };

        const result = await db.query(
          `INSERT INTO ziwei_birth_charts (name, birth_info, gan_zhi, base_chart)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            name || `${yearStem}${yearBranch} ${lunarMonth}/${lunarDay}`,
            JSON.stringify(birthInfo),
            JSON.stringify({ yearStem, yearBranch }),
            JSON.stringify(chart)
          ]
        );
        chartId = result.rows[0].id;
      } catch (dbErr) {
        console.warn('⚠️ Ziwei chart not stored:', dbErr.message);
      }
    }

    res.json({
      success: true,
      chartId,
      chart
    });
  } catch (error) {
    console.error('❌ Ziwei calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate chart',
      details: error.message
    });
  }
}));

// GET /api/ziwei/charts - List saved charts
app.get('/api/ziwei/charts', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const result = await db.query(
      `SELECT id, name, birth_info, gan_zhi, created_at
       FROM ziwei_birth_charts
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      charts: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching charts:', error);
    res.status(500).json({
      error: 'Failed to fetch charts',
      details: error.message
    });
  }
});

// GET /api/ziwei/charts/:id - Get specific chart
app.get('/api/ziwei/charts/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const result = await db.query(
      `SELECT * FROM ziwei_birth_charts WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    res.json({
      success: true,
      chart: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fetching chart:', error);
    res.status(500).json({
      error: 'Failed to fetch chart',
      details: error.message
    });
  }
});

// POST /api/ziwei/interpret - Generate interpretations for a chart
app.post('/api/ziwei/interpret', ziweiValidation.validateChartInterpretation, asyncHandler(async (req, res) => {
  try {
    const { chart, chartId, consensusLevel = 'consensus' } = req.body;

    if (!chart) {
      return res.status(400).json({ error: 'Missing required field: chart' });
    }

    // Load interpretation engine with database rules
    let InterpretationEngine;
    try {
      const module = require('./services/ziwei-interpretation-engine');
      InterpretationEngine = module.InterpretationEngine;
    } catch (e) {
      return res.status(501).json({
        error: 'Interpretation engine not available'
      });
    }

    // Use database rules if available
    const engine = await InterpretationEngine.fromDatabase();

    // Generate interpretations
    const allInterpretations = engine.generateInterpretations(chart);
    const filtered = engine.filterByConsensus(allInterpretations, consensusLevel);
    const ranked = engine.rankByAccuracy(filtered);
    const grouped = engine.groupByDimension(ranked);

    // Store interpretations with chart if DB is available
    if (chartId && process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        await db.query(
          `UPDATE ziwei_birth_charts SET interpretations = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(grouped), chartId]
        );
      } catch (dbErr) {
        console.warn('⚠️ Could not store interpretations:', dbErr.message);
      }
    }

    res.json({
      success: true,
      summary: {
        totalInterpretations: allInterpretations.length,
        filteredCount: filtered.length,
        dimensionCount: grouped.length,
        avgConfidence: grouped.length > 0
          ? grouped.reduce((sum, g) => sum + g.avgConfidence, 0) / grouped.length
          : 0
      },
      interpretations: ranked,
      grouped
    });
  } catch (error) {
    console.error('❌ Interpretation error:', error);
    res.status(500).json({
      error: 'Failed to generate interpretations',
      details: error.message
    });
  }
}));

// ==========================================
// Step 4: Enhanced Interpretation with DeepSeek LLM
// ==========================================

app.post('/api/ziwei/enhance-interpretation', async (req, res) => {
  try {
    const { chart, interpretations, chartId } = req.body;

    if (!chart || !interpretations) {
      return res.status(400).json({ error: 'Missing chart or interpretations' });
    }

    // Initialize LLM enhancer
    const { ZiweiLLMEnhancer } = require('./services/ziwei-llm-enhancer');
    const enhancer = new ZiweiLLMEnhancer();

    if (!enhancer.isAvailable()) {
      return res.status(503).json({
        error: 'LLM enhancement not available',
        fallback: interpretations
      });
    }

    // Generate enhanced interpretations
    const enhancement = await enhancer.enhanceInterpretations(chart, interpretations);

    if (!enhancement) {
      return res.status(500).json({
        error: 'Failed to enhance interpretations',
        fallback: interpretations
      });
    }

    // Save to database if available
    if (chartId && process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        await db.saveEnhancedInterpretation(chartId, {
          llmEnhancement: enhancement.enhancement,
          confidenceBoost: 0.4,
          model: enhancement.model,
          tokensInput: enhancement.tokensInput,
          tokensOutput: enhancement.tokensOutput
        });
      } catch (dbErr) {
        console.warn('⚠️ Could not save enhancement to DB:', dbErr.message);
      }
    }

    res.json({
      success: true,
      enhancement: enhancement.enhancement,
      tokens: {
        input: enhancement.tokensInput,
        output: enhancement.tokensOutput
      },
      model: enhancement.model
    });
  } catch (error) {
    console.error('❌ Enhancement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Step 5: Conversational Chat Interface
// ==========================================

app.post('/api/ziwei/conversations', async (req, res) => {
  try {
    const { chartId, userId, title } = req.body;

    if (!chartId) {
      return res.status(400).json({ error: 'Missing chartId' });
    }

    // Get chart data
    let chart = null;
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const result = await db.query(
          'SELECT * FROM ziwei_birth_charts WHERE id = $1',
          [chartId]
        );
        chart = result.rows[0]?.base_chart;
      } catch (dbErr) {
        console.warn('⚠️ Could not fetch chart:', dbErr.message);
      }
    }

    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    // Initialize conversation manager
    const { ZiweiConversationManager } = require('./services/ziwei-conversation-manager');
    const manager = new ZiweiConversationManager();

    if (!manager.isAvailable()) {
      return res.status(503).json({ error: 'Chat service not available' });
    }

    // Create conversation
    const conversation = manager.createConversation(chart, userId);

    // Save to database if available
    let conversationId = null;
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const result = await db.createConversation(chartId, userId, title);
        conversationId = result.id;
      } catch (dbErr) {
        console.warn('⚠️ Could not create conversation in DB:', dbErr.message);
      }
    }

    res.json({
      success: true,
      conversationId,
      systemPrompt: conversation.systemPrompt,
      chartContext: conversation.chartContext
    });
  } catch (error) {
    console.error('❌ Conversation creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ziwei/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, messages: messageHistory } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Missing message content' });
    }

    // Get conversation and chart data
    let chart = null;
    if (process.env.DATABASE_URL && id) {
      try {
        const db = require('./db');
        const conv = await db.getZiweiConversation(id);
        if (conv) {
          const chartResult = await db.query(
            'SELECT base_chart FROM ziwei_birth_charts WHERE id = $1',
            [conv.chart_id]
          );
          chart = chartResult.rows[0]?.base_chart;
        }
      } catch (dbErr) {
        console.warn('⚠️ Could not fetch conversation/chart:', dbErr.message);
      }
    }

    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    // Generate response
    const { ZiweiConversationManager } = require('./services/ziwei-conversation-manager');
    const manager = new ZiweiConversationManager();

    if (!manager.isAvailable()) {
      return res.status(503).json({ error: 'Chat service not available' });
    }

    const responseData = await manager.generateResponse(chart, messageHistory || [], content);

    if (!responseData) {
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    // Save message to database if available
    if (id && process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        await db.addConversationMessage(id, 'user', content, responseData.tokensInput);
        await db.addConversationMessage(id, 'assistant', responseData.response, responseData.tokensOutput);
      } catch (dbErr) {
        console.warn('⚠️ Could not save messages:', dbErr.message);
      }
    }

    res.json({
      success: true,
      response: responseData.response,
      tokens: {
        input: responseData.tokensInput,
        output: responseData.tokensOutput
      },
      timestamp: responseData.timestamp
    });
  } catch (error) {
    console.error('❌ Message generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ziwei/conversations/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const db = require('./db');
    const messages = await db.getConversationMessages(id);

    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Step 6: Compatibility Analysis
// ==========================================

app.post('/api/ziwei/compatibility', async (req, res) => {
  try {
    const { chart1Id, chart2Id, relationshipType } = req.body;

    if (!chart1Id || !chart2Id) {
      return res.status(400).json({ error: 'Missing chart IDs' });
    }

    // Fetch both charts from database
    let chart1 = null, chart2 = null;
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const [result1, result2] = await Promise.all([
          db.query('SELECT base_chart FROM ziwei_birth_charts WHERE id = $1', [chart1Id]),
          db.query('SELECT base_chart FROM ziwei_birth_charts WHERE id = $1', [chart2Id])
        ]);
        chart1 = result1.rows[0]?.base_chart;
        chart2 = result2.rows[0]?.base_chart;
      } catch (dbErr) {
        console.warn('⚠️ Could not fetch charts:', dbErr.message);
      }
    }

    if (!chart1 || !chart2) {
      return res.status(404).json({ error: 'One or both charts not found' });
    }

    // Analyze compatibility
    const { ZiweiCompatibilityAnalyzer } = require('./services/ziwei-compatibility-analyzer');
    const analyzer = new ZiweiCompatibilityAnalyzer();

    if (!analyzer.isAvailable()) {
      return res.status(503).json({ error: 'Compatibility analysis not available' });
    }

    const analysis = await analyzer.analyzeCompatibility(chart1, chart2, relationshipType || 'romantic');

    if (!analysis) {
      return res.status(500).json({ error: 'Failed to analyze compatibility' });
    }

    // Save to database if available
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        await db.saveCompatibilityAnalysis(chart1Id, chart2Id, relationshipType, analysis);
      } catch (dbErr) {
        console.warn('⚠️ Could not save compatibility analysis:', dbErr.message);
      }
    }

    res.json({
      success: true,
      compatibilityScore: analysis.compatibilityScore,
      harmoniousElements: analysis.harmoniousElements,
      conflictingElements: analysis.conflictingElements,
      report: analysis.report,
      tokens: {
        input: analysis.tokensInput,
        output: analysis.tokensOutput
      }
    });
  } catch (error) {
    console.error('❌ Compatibility analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Step 6: Personalized Insights
// ==========================================

app.post('/api/ziwei/insights', async (req, res) => {
  try {
    const { chartId, lifeStage, analysisDepth } = req.body;

    if (!chartId) {
      return res.status(400).json({ error: 'Missing chartId' });
    }

    // Fetch chart data
    let chart = null;
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const result = await db.query(
          'SELECT base_chart FROM ziwei_birth_charts WHERE id = $1',
          [chartId]
        );
        chart = result.rows[0]?.base_chart;
      } catch (dbErr) {
        console.warn('⚠️ Could not fetch chart:', dbErr.message);
      }
    }

    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    // Use LLM enhancer to generate insights
    const { ZiweiLLMEnhancer } = require('./services/ziwei-llm-enhancer');
    const enhancer = new ZiweiLLMEnhancer();

    if (!enhancer.isAvailable()) {
      return res.status(503).json({ error: 'Insights generation not available' });
    }

    const insights = await enhancer.generateLifeGuidance(chart, lifeStage || 'current', {});

    if (!insights) {
      return res.status(500).json({ error: 'Failed to generate insights' });
    }

    // Save to database if available
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        await db.saveInsights(chartId, {
          lifeStage: lifeStage || 'current',
          analysisDepth: analysisDepth || 'detailed',
          lifeGuidance: insights.guidance,
          model: insights.model,
          tokensUsed: insights.tokensInput + insights.tokensOutput
        });
      } catch (dbErr) {
        console.warn('⚠️ Could not save insights:', dbErr.message);
      }
    }

    res.json({
      success: true,
      guidance: insights.guidance,
      lifeStage: lifeStage || 'current',
      tokens: {
        input: insights.tokensInput,
        output: insights.tokensOutput
      }
    });
  } catch (error) {
    console.error('❌ Insights generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Step 7: Rule Evaluation & Pattern Recognition
// ==========================================

app.post('/api/ziwei/evaluate-rules', async (req, res) => {
  try {
    const { chart, minConsensus = 'consensus', dimensions = null } = req.body;

    if (!chart || !chart.houses) {
      return res.status(400).json({ error: 'Invalid chart data - must include houses' });
    }

    // Load rules from database or seed file
    let rules = [];
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./db');
        const result = await db.query(
          'SELECT * FROM ziwei_rules WHERE status = $1 ORDER BY consensus_label, statistics->\'confidence\' DESC',
          ['active']
        );
        rules = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          ruleType: row.rule_type,
          scope: row.scope,
          condition: row.condition,
          interpretation: row.interpretation,
          dimensionTags: row.dimension_tags || [],
          school: row.school,
          consensusLabel: row.consensus_label,
          sources: row.sources || [],
          statistics: row.statistics,
          notes: row.notes,
          relatedRuleIds: row.related_rule_ids
        }));
      } catch (dbErr) {
        console.warn('⚠️ Could not fetch rules from DB:', dbErr.message);
      }
    }

    // Fallback to seed file if no DB rules
    if (rules.length === 0) {
      try {
        const fs = require('fs');
        const rulesData = JSON.parse(fs.readFileSync('./data/ziwei-rules-seed.json', 'utf8'));
        rules = rulesData.rules.map(r => ({
          id: r.id,
          name: r.id,
          ruleType: r.scope === 'base' ? 'basic_pattern' : r.scope === 'star_group' ? 'star_group' : r.scope === 'major_pattern' ? 'major_pattern' : 'miscellaneous_combo',
          scope: 'base',
          condition: {
            involvedPalaces: r.condition.palaces,
            requiredStars: r.condition.stars,
            notes: r.condition.condition_description
          },
          interpretation: r.interpretation,
          dimensionTags: r.dimension_tags || [],
          school: r.school,
          consensusLabel: r.consensus_label,
          sources: r.source_refs.map(ref => typeof ref === 'string' ? { type: 'note', title: ref } : ref) || [],
          statistics: r.statistics || { sampleSize: null, matchRate: null, confidence: null },
          notes: r.notes,
          relatedRuleIds: []
        }));
      } catch (err) {
        console.warn('⚠️ Could not load rules from seed file:', err.message);
      }
    }

    // Initialize evaluator with rules
    const ZiweiRuleEvaluator = require('./services/ziwei-rule-evaluator').default || require('./services/ziwei-rule-evaluator').ZiweiRuleEvaluator;
    const evaluator = new ZiweiRuleEvaluator(rules);

    // Evaluate chart
    let results = evaluator.evaluateChart(chart);

    // Filter by consensus if specified
    if (minConsensus !== 'minority_view') {
      results = evaluator.filterByConsensus(results, minConsensus);
    }

    // Filter by dimensions if specified
    if (dimensions && Array.isArray(dimensions) && dimensions.length > 0) {
      results = evaluator.filterByDimension(results, dimensions);
    }

    // Save results to database if available
    if (process.env.DATABASE_URL && chart.id) {
      try {
        const db = require('./db');
        await db.query(
          'INSERT INTO ziwei_rule_evaluations (chart_id, total_rules, matched_rules, results, created_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (chart_id) DO UPDATE SET matched_rules = $3, results = $4, updated_at = NOW()',
          [
            chart.id,
            results.totalRules,
            results.matchedRules,
            JSON.stringify(results.results)
          ]
        );
      } catch (dbErr) {
        console.warn('⚠️ Could not save evaluation results:', dbErr.message);
      }
    }

    // Return results
    res.json({
      success: true,
      evaluation: results,
      stats: {
        totalRules: results.totalRules,
        matchedRules: results.matchedRules,
        matchPercentage: ((results.matchedRules / results.totalRules) * 100).toFixed(1),
        avgConfidence: results.results.length > 0
          ? (results.results.reduce((sum, r) => sum + r.confidence, 0) / results.results.length).toFixed(3)
          : 0
      }
    });
  } catch (error) {
    console.error('❌ Rule evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Ziwei Palace & Star Knowledge Endpoints
// ==========================================

// GET /api/ziwei/palaces - Get all palaces
app.get('/api/ziwei/palaces', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const palaces = await db.getAllZiweiPalaces();

    res.json({
      success: true,
      count: palaces.length,
      palaces: palaces.map(p => ({
        id: p.id,
        number: p.number,
        chinese: p.chinese,
        english: p.english,
        meaning: p.meaning,
        governs: p.governs,
        positive_indicators: p.positive_indicators,
        negative_indicators: p.negative_indicators
      }))
    });
  } catch (error) {
    console.error('❌ Ziwei palaces error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ziwei/palaces/:id - Get specific palace
app.get('/api/ziwei/palaces/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const palace = await db.getZiweiPalace(req.params.id);

    if (!palace) {
      return res.status(404).json({ error: 'Palace not found' });
    }

    res.json({
      success: true,
      palace: {
        id: palace.id,
        number: palace.number,
        chinese: palace.chinese,
        english: palace.english,
        meaning: palace.meaning,
        governs: palace.governs,
        positive_indicators: palace.positive_indicators,
        negative_indicators: palace.negative_indicators
      }
    });
  } catch (error) {
    console.error('❌ Ziwei palace error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ziwei/stars - Get all stars
app.get('/api/ziwei/stars', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const stars = await db.getAllZiweiStars();

    res.json({
      success: true,
      count: stars.length,
      stars: stars.map(s => ({
        id: s.id,
        number: s.number,
        chinese: s.chinese,
        english: s.english,
        meaning: s.meaning,
        element: s.element,
        archetype: s.archetype,
        general_nature: s.general_nature,
        key_traits: s.key_traits
      }))
    });
  } catch (error) {
    console.error('❌ Ziwei stars error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ziwei/stars/:id - Get specific star
app.get('/api/ziwei/stars/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const star = await db.getZiweiStar(req.params.id);

    if (!star) {
      return res.status(404).json({ error: 'Star not found' });
    }

    res.json({
      success: true,
      star: {
        id: star.id,
        number: star.number,
        chinese: star.chinese,
        english: star.english,
        meaning: star.meaning,
        element: star.element,
        archetype: star.archetype,
        general_nature: star.general_nature,
        key_traits: star.key_traits,
        palace_meanings: star.palace_meanings
      }
    });
  } catch (error) {
    console.error('❌ Ziwei star error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ziwei/palace-star-meanings/:palaceId/:starId - Get star meaning in specific palace
app.get('/api/ziwei/palace-star-meanings/:palaceId/:starId', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(501).json({ error: 'Database not configured' });
    }

    const db = require('./db');
    const palace = await db.getZiweiPalace(req.params.palaceId);
    const star = await db.getZiweiStar(req.params.starId);

    if (!palace || !star) {
      return res.status(404).json({ error: 'Palace or star not found' });
    }

    const meaning = star.palace_meanings?.[req.params.palaceId];

    res.json({
      success: true,
      palace: {
        id: palace.id,
        chinese: palace.chinese,
        english: palace.english
      },
      star: {
        id: star.id,
        chinese: star.chinese,
        english: star.english
      },
      meaning: meaning || {
        positive: 'Information not available',
        negative: 'Information not available'
      }
    });
  } catch (error) {
    console.error('❌ Ziwei palace-star meanings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Start Server
// ==========================================
const port = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize WebSocket server
wsServer.initialize(server);

// Global error handler middleware (must be last)
app.use(errorHandler);

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

  // Manifest-based TEDx nanobanana visual generation
  // Only triggers when VISUALS definitions change (new entries or updated prompts),
  // not on every deploy or when files happen to be missing.
  if (process.env.GEMINI_API_KEY) {
    const tedxFs = require('fs');
    const tedxPath = require('path');
    const crypto = require('crypto');
    try {
      const tedxOutputDir = tedxPath.join(__dirname, 'frontend', 'public', 'tedx');
      const manifestPath = tedxPath.join(tedxOutputDir, '.manifest.json');
      const tedxModule = require('./use-cases/tedx-boundary-street/api/routes');
      const VISUALS = tedxModule.VISUALS || [];

      // Ensure output dir exists
      if (!tedxFs.existsSync(tedxOutputDir)) {
        tedxFs.mkdirSync(tedxOutputDir, { recursive: true });
      }

      // Build current definition fingerprint: hash each visual's id + prompt
      const currentDefs = {};
      for (const v of VISUALS) {
        currentDefs[v.id] = crypto.createHash('md5').update(v.prompt).digest('hex');
      }

      // Load previous manifest (if any)
      let previousDefs = {};
      try {
        if (tedxFs.existsSync(manifestPath)) {
          previousDefs = JSON.parse(tedxFs.readFileSync(manifestPath, 'utf8'));
        }
      } catch { /* no manifest yet */ }

      // Find visuals with new or changed definitions
      const changed = VISUALS.filter(v => currentDefs[v.id] !== previousDefs[v.id]);

      if (changed.length > 0) {
        const newIds = changed.filter(v => !previousDefs[v.id]).map(v => v.id);
        const updatedIds = changed.filter(v => previousDefs[v.id]).map(v => v.id);
        console.log(`🎨 TEDx: Visual definitions changed — ${newIds.length} new, ${updatedIds.length} updated`);
        if (newIds.length > 0) console.log(`   New: ${newIds.join(', ')}`);
        if (updatedIds.length > 0) console.log(`   Updated: ${updatedIds.join(', ')}`);

        // Fire-and-forget: generate only changed visuals after a short delay
        setTimeout(async () => {
          try {
            const http = require('http');
            let generated = 0;
            let failed = 0;

            for (const visual of changed) {
              try {
                const postData = JSON.stringify({ id: visual.id });
                await new Promise((resolve, reject) => {
                  const req = http.request({
                    hostname: '127.0.0.1',
                    port: port,
                    path: '/api/tedx/generate',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
                    timeout: 60000,
                  }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => { body += chunk; });
                    res.on('end', () => {
                      if (res.statusCode === 200) {
                        generated++;
                        // Update manifest entry on success
                        previousDefs[visual.id] = currentDefs[visual.id];
                        tedxFs.writeFileSync(manifestPath, JSON.stringify(previousDefs, null, 2));
                      } else {
                        failed++;
                        console.error(`🎨 TEDx: Failed ${visual.id}: ${body.slice(0, 100)}`);
                      }
                      resolve();
                    });
                  });
                  req.on('error', (err) => { failed++; console.error(`🎨 TEDx: ${visual.id} error: ${err.message}`); resolve(); });
                  req.write(postData);
                  req.end();
                });
                // Rate limit between generations
                await new Promise(r => setTimeout(r, 2000));
              } catch (err) {
                failed++;
                console.error(`🎨 TEDx: ${visual.id} error: ${err.message}`);
              }
            }

            console.log(`🎨 TEDx auto-generation done: ${generated} generated, ${failed} failed`);
          } catch (err) {
            console.error('🎨 TEDx auto-generation error:', err.message);
          }
        }, 3000);
      } else {
        console.log(`🎨 TEDx: All ${VISUALS.length} visual definitions unchanged — skipping generation`);
      }
    } catch (err) {
      console.warn('⚠️ TEDx auto-generation check failed:', err.message);
    }

    // TEDxXinyi visual generation (same manifest pattern)
    try {
      const xinyiOutputDir = tedxPath.join(__dirname, 'frontend', 'public', 'tedx-xinyi');
      const xinyiManifestPath = tedxPath.join(xinyiOutputDir, '.manifest.json');
      const xinyiModule = require('./use-cases/tedx-xinyi/api/routes');
      const XINYI_VISUALS = xinyiModule.VISUALS || [];

      if (!tedxFs.existsSync(xinyiOutputDir)) {
        tedxFs.mkdirSync(xinyiOutputDir, { recursive: true });
      }

      const xinyiDefs = {};
      for (const v of XINYI_VISUALS) {
        xinyiDefs[v.id] = crypto.createHash('md5').update(v.prompt).digest('hex');
      }

      let xinyiPrevDefs = {};
      try {
        if (tedxFs.existsSync(xinyiManifestPath)) {
          xinyiPrevDefs = JSON.parse(tedxFs.readFileSync(xinyiManifestPath, 'utf8'));
        }
      } catch { /* no manifest yet */ }

      const xinyiChanged = XINYI_VISUALS.filter(v => xinyiDefs[v.id] !== xinyiPrevDefs[v.id]);

      if (xinyiChanged.length > 0) {
        const xinyiNewIds = xinyiChanged.filter(v => !xinyiPrevDefs[v.id]).map(v => v.id);
        const xinyiUpdatedIds = xinyiChanged.filter(v => xinyiPrevDefs[v.id]).map(v => v.id);
        console.log(`🎨 TEDxXinyi: Visual definitions changed — ${xinyiNewIds.length} new, ${xinyiUpdatedIds.length} updated`);

        setTimeout(async () => {
          try {
            const http = require('http');
            let generated = 0;
            let failed = 0;

            for (const visual of xinyiChanged) {
              try {
                const postData = JSON.stringify({ id: visual.id });
                await new Promise((resolve, reject) => {
                  const req = http.request({
                    hostname: '127.0.0.1',
                    port: port,
                    path: '/api/tedx-xinyi/generate',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
                    timeout: 60000,
                  }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => { body += chunk; });
                    res.on('end', () => {
                      if (res.statusCode === 200) {
                        generated++;
                        xinyiPrevDefs[visual.id] = xinyiDefs[visual.id];
                        tedxFs.writeFileSync(xinyiManifestPath, JSON.stringify(xinyiPrevDefs, null, 2));
                      } else {
                        failed++;
                        console.error(`🎨 TEDxXinyi: Failed ${visual.id}: ${body.slice(0, 100)}`);
                      }
                      resolve();
                    });
                  });
                  req.on('error', (err) => { failed++; console.error(`🎨 TEDxXinyi: ${visual.id} error: ${err.message}`); resolve(); });
                  req.write(postData);
                  req.end();
                });
                await new Promise(r => setTimeout(r, 2000));
              } catch (err) {
                failed++;
                console.error(`🎨 TEDxXinyi: ${visual.id} error: ${err.message}`);
              }
            }

            console.log(`🎨 TEDxXinyi auto-generation done: ${generated} generated, ${failed} failed`);
          } catch (err) {
            console.error('🎨 TEDxXinyi auto-generation error:', err.message);
          }
        }, 15000); // Delay after Boundary Street generation
      } else {
        console.log(`🎨 TEDxXinyi: All ${XINYI_VISUALS.length} visual definitions unchanged — skipping generation`);
      }
    } catch (err) {
      console.warn('⚠️ TEDxXinyi auto-generation check failed:', err.message);
    }
  } else {
    console.log('⚠️ TEDx visuals: GEMINI_API_KEY not set — skipping auto-generation');
  }

  // Initialize scheduler for Topic Intelligence
  if (process.env.DATABASE_URL) {
    try {
      const db = require('./db');
      scheduler.initialize(db, runScheduledScan, runScheduledDigest);
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
