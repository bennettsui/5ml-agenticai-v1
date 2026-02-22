// AI Media Generation — Express API Routes
// Base path: /api/media

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { pool } = require('../../../db');
const MediaGenerationOrchestrator = require('../agents/orchestrator');

// ─── Uploads directory ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'media');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

// POST /api/media/projects/:id/brief — submit brief (async: responds immediately, processes in background)
router.post('/projects/:id/brief', async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  try {
    const { brief } = req.body;
    if (!brief) return res.status(400).json({ error: '"brief" is required' });
    // Mark as in-progress BEFORE responding so client poll doesn't see stale "done" status
    await pool.query(
      `UPDATE media_projects SET status = 'translating_brief', brief_text = $1, updated_at = NOW() WHERE id = $2`,
      [brief, projectId]
    );
    res.json({ success: true, status: 'processing' });
    setImmediate(async () => {
      try {
        await getOrchestrator().submitBrief(projectId, brief);
      } catch (err) {
        console.error('[MediaGeneration] submitBrief background error:', err.message);
        await pool.query(
          `UPDATE media_projects SET status = 'error', updated_at = NOW() WHERE id = $1`,
          [projectId]
        ).catch(() => {});
      }
    });
  } catch (err) {
    console.error('[MediaGeneration] submitBrief error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/projects/:id/generate-prompts — generate prompts (async: responds immediately)
router.post('/projects/:id/generate-prompts', async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  try {
    // Mark as in-progress before responding to avoid stale-status race
    await pool.query(
      `UPDATE media_projects SET status = 'generating_prompts', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );
    res.json({ success: true, status: 'processing' });
    setImmediate(async () => {
      try {
        await getOrchestrator().generatePrompts(projectId);
      } catch (err) {
        console.error('[MediaGeneration] generatePrompts background error:', err.message);
        await pool.query(
          `UPDATE media_projects SET status = 'error', updated_at = NOW() WHERE id = $1`,
          [projectId]
        ).catch(() => {});
      }
    });
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

// PATCH /api/media/prompts/:id — update prompt content (manual edit)
router.patch('/prompts/:id', async (req, res) => {
  try {
    const { prompt_json, status } = req.body;
    const fields = [];
    const params = [];
    if (prompt_json !== undefined) { fields.push(`prompt_json = $${params.length + 1}`); params.push(JSON.stringify(prompt_json)); }
    if (status !== undefined)      { fields.push(`status = $${params.length + 1}`);      params.push(status); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    fields.push(`updated_at = NOW()`);
    params.push(req.params.id);
    await pool.query(
      `UPDATE media_prompts SET ${fields.join(', ')} WHERE id = $${params.length}`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/projects/:id/prompts — create a manual prompt
router.post('/projects/:id/prompts', async (req, res) => {
  try {
    const { deliverable_type = 'image', format = 'custom', prompt_json } = req.body;
    if (!prompt_json) return res.status(400).json({ error: '"prompt_json" is required' });
    const result = await pool.query(
      `INSERT INTO media_prompts
         (project_id, deliverable_type, format, prompt_json, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', 'v1.0-manual', NOW(), NOW())
       RETURNING *`,
      [req.params.id, deliverable_type, format, JSON.stringify(prompt_json)]
    );
    res.json({ success: true, prompt: result.rows[0] });
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

// POST /api/media/prompt-assist — AI expands a plain description into a full SD prompt
router.post('/prompt-assist', async (req, res) => {
  try {
    const { description, type = 'image', style, format } = req.body;
    if (!description) return res.status(400).json({ error: '"description" is required' });

    const orch = getOrchestrator();
    const systemPrompt = `You are a Stable Diffusion / SDXL prompt engineer.
Given a plain-English description, produce a detailed, optimised prompt.
Return ONLY JSON with this schema (no markdown, no explanation):
{
  "positive": "full detailed SD positive prompt",
  "negative": "negative prompt (always include: worst quality, low quality, blurry, deformed, watermark, text, signature)",
  "suggestedSampler": "DPM++ 2M Karras",
  "suggestedCfg": 7,
  "suggestedSteps": 25
}`;
    const userContent = `Create an SD prompt for: "${description}"${style ? `\nStyle: ${style}` : ''}${format ? `\nFormat: ${format}` : ''}${type === 'video' ? '\nThis is for video/AnimateDiff — add motion descriptors at the end of the positive prompt.' : ''}`;

    const resp = await orch.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: userContent }],
      system: systemPrompt,
    });

    const text = resp.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return a valid prompt JSON');
    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[MediaGeneration] prompt-assist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Background image download helper ────────────────────────────────────────
// Retries up to 2 extra times (3 total) for transient 5xx / timeout errors.
async function downloadAndSaveImage(url, destPath) {
  const RETRYABLE = new Set([500, 502, 503, 504, 520, 524, 530]);
  const MAX_ATTEMPTS = 3;

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000 });
      fs.writeFileSync(destPath, resp.data);
      return; // success
    } catch (err) {
      const status = err?.response?.status;

      // Translate known error codes into friendly messages
      if (status && !RETRYABLE.has(status)) {
        // Non-retryable HTTP error — fail immediately
        const hints = {
          401: `Pollinations.ai requires an API key (HTTP 401). Get a free key at https://enter.pollinations.ai then add POLLINATIONS_API_KEY=pk_... to your .env`,
          403: 'Pollinations.ai refused the request (403 Forbidden) — the prompt may have been blocked by content filters',
          429: 'Pollinations.ai rate limit reached (429) — wait a moment and try again',
        };
        throw new Error(hints[status] || `Pollinations.ai returned HTTP ${status} — external API error`);
      }

      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        throw new Error('Cannot reach Pollinations.ai — check internet connectivity or DNS');
      }

      lastErr = err;

      if (attempt < MAX_ATTEMPTS) {
        const delayMs = attempt * 6000; // 6 s, then 12 s
        const statusStr = status ? ` (HTTP ${status})` : (err.code ? ` (${err.code})` : '');
        console.warn(`[MediaGeneration] Pollinations attempt ${attempt} failed${statusStr}, retrying in ${delayMs / 1000}s…`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  // All attempts exhausted — produce a clear final error
  const status = lastErr?.response?.status;
  const timeoutCodes = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET']);
  if (status) {
    throw new Error(`Pollinations.ai returned HTTP ${status} after ${MAX_ATTEMPTS} attempts — their service appears to be down`);
  }
  if (timeoutCodes.has(lastErr?.code)) {
    throw new Error(`Request to Pollinations.ai timed out after ${MAX_ATTEMPTS} attempts — their service may be slow or unavailable`);
  }
  throw lastErr;
}

// Available Pollinations models
const POLLINATIONS_MODELS = new Set(['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo']);

// Convert an aspect ratio string (e.g. "16:9", "9:16", "4:5") to pixel dimensions
// Uses Pollinations-friendly sizes (multiples of 64, ~1M total pixels)
function aspectRatioDimensions(ratio) {
  const MAP = {
    '1:1':   { width: 1024, height: 1024 },
    '16:9':  { width: 1344, height: 768  },
    '9:16':  { width: 768,  height: 1344 },
    '4:5':   { width: 896,  height: 1120 },
    '5:4':   { width: 1120, height: 896  },
    '3:2':   { width: 1152, height: 768  },
    '2:3':   { width: 768,  height: 1152 },
    '4:3':   { width: 1024, height: 768  },
    '3:4':   { width: 768,  height: 1024 },
    '21:9':  { width: 1344, height: 576  },
    '1.91:1':{ width: 1232, height: 640  },
  };
  return MAP[ratio] || { width: 1024, height: 1024 };
}

// GET /api/media/assets/:id — fetch single asset (for polling generation status)
router.get('/assets/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM media_assets WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/prompts/:id/generate-image — kick off async image generation
// Returns immediately with assetId; client polls GET /api/media/assets/:id for status
router.post('/prompts/:id/generate-image', async (req, res) => {
  try {
    const promptResult = await pool.query(
      'SELECT * FROM media_prompts WHERE id = $1',
      [req.params.id]
    );
    const record = promptResult.rows[0];
    if (!record) return res.status(404).json({ error: 'Prompt not found' });

    // Support both top-level prompt_json.positive and nested image/video structures
    const pj = record.prompt_json || {};
    const positivePrompt = pj.image?.positive || pj.video?.positive || pj.positive;
    if (!positivePrompt) return res.status(400).json({ error: 'No positive prompt found on this record' });

    const requestedModel = req.body?.model || 'flux';

    // ── Create placeholder asset immediately (status = generating) ─────────────
    const placeholder = await pool.query(
      `INSERT INTO media_assets
         (project_id, prompt_id, type, url, metadata_json, status, created_at)
       VALUES ($1, $2, 'image', NULL, $3, 'generating', NOW())
       RETURNING id`,
      [record.project_id, record.id, JSON.stringify({ generator: requestedModel, auto: true })]
    );
    const assetId = placeholder.rows[0].id;

    // Respond immediately so the client can start polling
    res.json({ success: true, assetId, status: 'generating' });

    // ── Background: download image and update asset ────────────────────────────
    setImmediate(async () => {
      try {
        let imageUrl;

        if (requestedModel === 'dall-e-3') {
          if (!process.env.OPENAI_API_KEY) throw new Error('DALL-E 3 requires OPENAI_API_KEY');
          const dalleResp = await axios.post(
            'https://api.openai.com/v1/images/generations',
            { model: 'dall-e-3', prompt: positivePrompt.substring(0, 4000), n: 1, size: '1024x1024', response_format: 'url' },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 }
          );
          const dalleUrl = dalleResp.data?.data?.[0]?.url;
          if (!dalleUrl) throw new Error('DALL-E did not return an image URL');
          const filename = `media_${record.project_id}_p${record.id}_dalle_${Date.now()}.jpg`;
          await downloadAndSaveImage(dalleUrl, path.join(UPLOADS_DIR, filename));
          imageUrl = `/api/media/serve/${filename}`;
        } else {
          const pollinationsModel = POLLINATIONS_MODELS.has(requestedModel) ? requestedModel : 'flux';
          const seed = Math.floor(Math.random() * 2147483647);
          const encodedPrompt = encodeURIComponent(positivePrompt.substring(0, 800));
          const { width, height } = aspectRatioDimensions(pj.image?.aspectRatio);
          const pollinationsKey = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : '';
          const pollinationsUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${pollinationsModel}&nologo=true&seed=${seed}${pollinationsKey}`;
          const filename = `media_${record.project_id}_p${record.id}_${seed}.jpg`;
          await downloadAndSaveImage(pollinationsUrl, path.join(UPLOADS_DIR, filename));
          imageUrl = `/api/media/serve/${filename}`;
        }

        // Update asset with the final URL
        await pool.query(
          `UPDATE media_assets SET url = $1, status = 'pending_review', updated_at = NOW() WHERE id = $2`,
          [imageUrl, assetId]
        );
      } catch (bgErr) {
        console.error('[MediaGeneration] background image download error:', bgErr.message);
        await pool.query(
          `UPDATE media_assets SET status = 'error', metadata_json = metadata_json || $1::jsonb, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify({ error: bgErr.message }), assetId]
        ).catch(() => {});
      }
    });
  } catch (err) {
    console.error('[MediaGeneration] generate-image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/quick-test?prompt=...&model=flux
// Fire a one-shot test image generation with no project/prompt record needed.
// Responds immediately; poll GET /api/media/quick-test/status/:jobId for result.
const quickTestJobs = new Map(); // jobId → { status, url, error }

router.get('/quick-test', (req, res) => {
  const defaultPrompt = 'A professional product photograph of a premium glass perfume bottle sitting on white marble, soft studio diffused lighting from above, shallow depth of field with subtle bokeh background, warm neutral color palette, commercial advertising photography aesthetic';
  const prompt = (req.query.prompt || defaultPrompt).trim();
  const model = POLLINATIONS_MODELS.has(req.query.model) ? req.query.model : 'flux';
  const ratio = req.query.ratio || '1:1';
  const jobId = `qt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  quickTestJobs.set(jobId, { status: 'generating', url: null, error: null, prompt, model, startedAt: Date.now() });

  // Respond immediately
  res.json({ jobId, status: 'generating', prompt, model });

  // Background download
  setImmediate(async () => {
    try {
      const seed = Math.floor(Math.random() * 2147483647);
      const encoded = encodeURIComponent(prompt.substring(0, 800));
      const { width, height } = aspectRatioDimensions(ratio);
      const pollinationsKey = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : '';
      const pollinationsUrl = `https://gen.pollinations.ai/image/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}${pollinationsKey}`;
      await downloadAndSaveImage(pollinationsUrl, path.join(UPLOADS_DIR, `${jobId}.jpg`));
      quickTestJobs.set(jobId, { ...quickTestJobs.get(jobId), status: 'done', url: `/api/media/serve/${jobId}.jpg` });
    } catch (err) {
      console.error('[MediaGeneration] quick-test error:', err.message);
      quickTestJobs.set(jobId, { ...quickTestJobs.get(jobId), status: 'error', error: err.message });
    }
  });
});

router.get('/quick-test/status/:jobId', (req, res) => {
  const job = quickTestJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// GET /api/media/serve/:filename — serve a locally-saved generated image
router.get('/serve/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent directory traversal
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Image not found' });
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(filePath);
});

// PATCH /api/media/assets/:id/status — update asset status (approve / reject / reset)
router.patch('/assets/:id/status', async (req, res) => {
  try {
    const { status, revisionNotes } = req.body;
    const allowed = ['approved', 'rejected', 'pending_review', 'needs_revision'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    await pool.query(
      `UPDATE media_assets SET status = $1, qc_json = COALESCE(qc_json, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $3`,
      [status, JSON.stringify({ approved: status === 'approved', revisionNotes: revisionNotes || null }), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-media-generation', schemaInitialized });
});

module.exports = router;
