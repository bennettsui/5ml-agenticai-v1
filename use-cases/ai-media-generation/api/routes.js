// AI Media Generation — Express API Routes
// Base path: /api/media

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const { pool } = require('../../../db');
const MediaGenerationOrchestrator = require('../agents/orchestrator');

const router = express.Router();

// ─── Lazy-init ────────────────────────────────────────────────────────────────
let orchestrator = null;
let schemaInitialized = false;

function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = new MediaGenerationOrchestrator({
      pool,
      anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    });
  }
  return orchestrator;
}

// ─── DB schema ────────────────────────────────────────────────────────────────
async function initializeSchema() {
  if (schemaInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_projects (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        client       VARCHAR(255),
        notes        TEXT,
        brief_text   TEXT,
        brief_spec_json  JSONB,
        status       VARCHAR(100) DEFAULT 'brief_pending',
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_style_guides (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER UNIQUE REFERENCES media_projects(id) ON DELETE CASCADE,
        guide_json  JSONB NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_prompts (
        id                  SERIAL PRIMARY KEY,
        project_id          INTEGER REFERENCES media_projects(id) ON DELETE CASCADE,
        deliverable_type    VARCHAR(50),
        format              VARCHAR(100),
        prompt_json         JSONB,
        image_workflow_json JSONB,
        video_workflow_json JSONB,
        qc_json             JSONB,
        status              VARCHAR(50) DEFAULT 'draft',
        version             VARCHAR(20) DEFAULT 'v1.0',
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER REFERENCES media_projects(id) ON DELETE CASCADE,
        prompt_id   INTEGER REFERENCES media_prompts(id) ON DELETE SET NULL,
        type        VARCHAR(50) NOT NULL,
        url         TEXT,
        metadata_json JSONB DEFAULT '{}',
        qc_json     JSONB,
        status      VARCHAR(50) DEFAULT 'pending_review',
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
    console.log('[MediaGeneration] DB schema initialised');
  } catch (err) {
    console.error('[MediaGeneration] Schema init error:', err.message);
    throw err;
  }
}

// Auto-init on first request
router.use(async (req, res, next) => {
  try {
    await initializeSchema();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database initialisation failed', detail: err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/media/projects — create project
router.post('/projects', async (req, res) => {
  try {
    const { name, client, notes } = req.body;
    if (!name) return res.status(400).json({ error: '"name" is required' });
    const project = await getOrchestrator().createProject({ name, client, notes });
    res.json({ success: true, project });
  } catch (err) {
    console.error('[MediaGeneration] createProject error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/projects — list all
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, client, status, created_at, updated_at FROM media_projects ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ projects: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/projects/:id — full state
router.get('/projects/:id', async (req, res) => {
  try {
    const state = await getOrchestrator().getProjectState(parseInt(req.params.id, 10));
    if (!state) return res.status(404).json({ error: 'Project not found' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/media/projects/:id
router.delete('/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media_projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/projects/:id/brief — submit brief → translate → style guide
router.post('/projects/:id/brief', async (req, res) => {
  try {
    const { brief } = req.body;
    if (!brief) return res.status(400).json({ error: '"brief" is required' });
    const result = await getOrchestrator().submitBrief(parseInt(req.params.id, 10), brief);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[MediaGeneration] submitBrief error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/projects/:id/generate-prompts — generate all prompts + workflow configs
router.post('/projects/:id/generate-prompts', async (req, res) => {
  try {
    const results = await getOrchestrator().generatePrompts(parseInt(req.params.id, 10));
    res.json({ success: true, results });
  } catch (err) {
    console.error('[MediaGeneration] generatePrompts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/projects/:id/assets — register a completed GPU output
router.post('/projects/:id/assets', async (req, res) => {
  try {
    const { promptId, type, url, metadata } = req.body;
    if (!type || !url) return res.status(400).json({ error: '"type" and "url" are required' });
    const asset = await getOrchestrator().registerAsset(parseInt(req.params.id, 10), { promptId, type, url, metadata });
    res.json({ success: true, asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/assets/:assetId/qc — run QC on an asset
router.post('/assets/:assetId/qc', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: '"projectId" is required' });
    const result = await getOrchestrator().runAssetQc(
      parseInt(req.params.assetId, 10),
      parseInt(projectId, 10)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[MediaGeneration] runAssetQc error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/prompts — prompt library (all projects)
router.get('/prompts', async (req, res) => {
  try {
    const { projectId, status, type } = req.query;
    const conditions = [];
    const params = [];
    if (projectId) { conditions.push(`p.project_id = $${params.length + 1}`); params.push(projectId); }
    if (status)    { conditions.push(`p.status = $${params.length + 1}`);     params.push(status); }
    if (type)      { conditions.push(`p.deliverable_type = $${params.length + 1}`); params.push(type); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT p.*, pr.name AS project_name, pr.client
       FROM media_prompts p
       JOIN media_projects pr ON pr.id = p.project_id
       ${where}
       ORDER BY p.created_at DESC LIMIT 200`,
      params
    );
    res.json({ prompts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/media/prompts/:id/approve — approve a prompt for production
router.patch('/prompts/:id/approve', async (req, res) => {
  try {
    await pool.query(
      `UPDATE media_prompts SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Brand history + memory ────────────────────────────────────────────────────

// POST /api/media/projects/:id/link-brand — link project to a CRM brand
router.post('/projects/:id/link-brand', async (req, res) => {
  try {
    const { brandId } = req.body;
    if (!brandId) return res.status(400).json({ error: '"brandId" is required' });
    const orch = getOrchestrator();
    await orch.ensureExtendedSchema();
    await orch.brandHistory.linkProjectToBrand(parseInt(req.params.id, 10), brandId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/brands/:brandId/memory — get brand history / memory
router.get('/brands/:brandId/memory', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const memory = await orch.brandHistory.getBrandMemory(req.params.brandId);
    if (!memory) {
      // Build fresh
      const fresh = await orch.brandHistory.buildBrandMemory(req.params.brandId);
      return res.json({ memory: fresh, fresh: true });
    }
    res.json({ memory, fresh: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/brands/:brandId/memory/refresh — rebuild brand memory
router.post('/brands/:brandId/memory/refresh', async (req, res) => {
  try {
    const memory = await getOrchestrator().brandHistory.buildBrandMemory(req.params.brandId);
    res.json({ success: true, memory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Client feedback / revision ────────────────────────────────────────────────

// POST /api/media/assets/:assetId/feedback — parse client feedback into param changes
router.post('/assets/:assetId/feedback', async (req, res) => {
  try {
    const { feedback, projectId } = req.body;
    if (!feedback) return res.status(400).json({ error: '"feedback" is required' });

    const orch = getOrchestrator();

    // Load asset + its prompt for context
    const assetResult = await pool.query(
      `SELECT a.*, pr.prompt_json, pr.image_workflow_json, pr.video_workflow_json
       FROM media_assets a
       LEFT JOIN media_prompts pr ON pr.id = a.prompt_id
       WHERE a.id = $1`,
      [req.params.assetId]
    );
    const asset = assetResult.rows[0];

    // Load style guide and brief spec for brand context
    let styleGuide = null;
    let briefSpec = null;
    if (projectId || asset?.project_id) {
      const pid = projectId || asset.project_id;
      styleGuide = await orch.styleManager.getStyleGuide(pid);
      const projResult = await pool.query('SELECT brief_spec_json FROM media_projects WHERE id = $1', [pid]);
      briefSpec = projResult.rows[0]?.brief_spec_json;
    }

    const result = await orch.clientFeedback.parseFeedback({
      feedback,
      currentPrompt: asset?.prompt_json?.image,
      currentWorkflow: asset?.image_workflow_json,
      styleGuide,
      briefSpec,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[MediaGeneration] parseFeedback error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/assets/:assetId/feedback — revision history
router.get('/assets/:assetId/feedback', async (req, res) => {
  try {
    const history = await getOrchestrator().clientFeedback.getRevisionHistory(parseInt(req.params.assetId, 10));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Asset library / search ────────────────────────────────────────────────────

// GET /api/media/library — search asset library
router.get('/library', async (req, res) => {
  try {
    const { q, brandId, type, channel, limit } = req.query;
    const assets = await getOrchestrator().assetLibrarian.searchAssets({
      query: q,
      brandId,
      type,
      channel,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/assets/:assetId/tag — auto-tag an asset
router.post('/assets/:assetId/tag', async (req, res) => {
  try {
    const { context } = req.body;
    const tags = await getOrchestrator().assetLibrarian.tagAsset(parseInt(req.params.assetId, 10), context || {});
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/assets/:assetId/lineage — full production lineage
router.get('/assets/:assetId/lineage', async (req, res) => {
  try {
    const lineage = await getOrchestrator().assetLibrarian.getAssetLineage(parseInt(req.params.assetId, 10));
    if (!lineage) return res.status(404).json({ error: 'Asset not found' });
    res.json({ lineage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Performance / learning loop ───────────────────────────────────────────────

// POST /api/media/assets/:assetId/performance — record social media metric
router.post('/assets/:assetId/performance', async (req, res) => {
  try {
    const { platform, metric, value } = req.body;
    if (!platform || !metric || value == null) {
      return res.status(400).json({ error: '"platform", "metric", and "value" are required' });
    }
    await getOrchestrator().assetLibrarian.recordPerformance(parseInt(req.params.assetId, 10), { platform, metric, value });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/projects/:id/performance-insights — learning loop analysis
router.get('/projects/:id/performance-insights', async (req, res) => {
  try {
    const insights = await getOrchestrator().assetLibrarian.analysePerformance(parseInt(req.params.id, 10));
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/chat — conversational orchestrator (template-driven system prompt)
router.post('/chat', async (req, res) => {
  try {
    const { messages, projectId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '"messages" array is required' });
    }
    const result = await getOrchestrator().chat(messages, projectId || null);
    res.json(result);
  } catch (err) {
    console.error('[MediaGeneration] chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-media-generation', schemaInitialized });
});

module.exports = router;
