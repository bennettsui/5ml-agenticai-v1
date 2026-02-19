// Multimedia Library — Express API Routes
// Base path: /api/library
// Supports: image upload (file / base64 / URL) + video URL analysis

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
const fs = require('fs');

const { pool } = require('../../../db');
const ImageAnalyzerAgent = require('../agents/image-analyzer');
const VideoAnalyzerAgent = require('../agents/video-analyzer');
const PromptTemplateBuilderAgent = require('../agents/prompt-template-builder');

const router = express.Router();

let anthropic = null;
let imageAnalyzer = null;
let videoAnalyzer = null;
let templateBuilder = null;
let schemaInitialized = false;

function getAgents() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    imageAnalyzer = new ImageAnalyzerAgent(anthropic);
    videoAnalyzer = new VideoAnalyzerAgent(anthropic);
    templateBuilder = new PromptTemplateBuilderAgent(anthropic, pool);
  }
  return { imageAnalyzer, videoAnalyzer, templateBuilder };
}

// ─── Schema ───────────────────────────────────────────────────────────────────
async function initializeSchema() {
  if (schemaInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_library_items (
        id              SERIAL PRIMARY KEY,
        item_id         UUID DEFAULT gen_random_uuid() UNIQUE,
        type            VARCHAR(20) NOT NULL,
        source_type     VARCHAR(20) NOT NULL,
        source_url      TEXT,
        local_path      TEXT,
        thumbnail_url   TEXT,
        analysis_json   JSONB,
        tags_json       JSONB DEFAULT '[]',
        brand_id        INTEGER,
        project_id      INTEGER,
        template_id     VARCHAR(100),
        title           VARCHAR(500),
        notes           TEXT,
        status          VARCHAR(50) DEFAULT 'analyzed',
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_prompt_templates (
        id              SERIAL PRIMARY KEY,
        template_id     VARCHAR(100) UNIQUE,
        name            VARCHAR(500),
        category        VARCHAR(100),
        source_type     VARCHAR(20),
        template_json   JSONB NOT NULL,
        tags            JSONB DEFAULT '[]',
        usage_count     INTEGER DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_library_annotations (
        id              SERIAL PRIMARY KEY,
        item_id         UUID REFERENCES media_library_items(item_id) ON DELETE CASCADE,
        annotation_json JSONB NOT NULL,
        feedback_text   TEXT,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
    console.log('[MultimediaLibrary] DB schema initialised');
  } catch (err) {
    console.error('[MultimediaLibrary] Schema init error:', err.message);
    throw err;
  }
}

router.use(async (req, res, next) => {
  try { await initializeSchema(); next(); }
  catch (err) { res.status(500).json({ error: 'DB init failed', detail: err.message }); }
});

// ─── Image analysis ───────────────────────────────────────────────────────────

// POST /api/library/analyze-image
// Body: { type: 'url'|'base64', value: string, options: {...} }
// Also accepts multipart via multer for file uploads
router.post('/analyze-image', async (req, res) => {
  try {
    const { type, value, brandContext, targetChannel, title, notes, buildTemplate } = req.body;

    if (!type || !value) {
      return res.status(400).json({ error: '"type" and "value" are required' });
    }

    const { imageAnalyzer: ia, templateBuilder: tb } = getAgents();

    const analysis = await ia.analyzeImage(
      { type, value },
      { brandContext, targetChannel }
    );

    // Save to library
    const result = await pool.query(
      `INSERT INTO media_library_items
         (type, source_type, source_url, analysis_json, title, notes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'analyzed', NOW())
       RETURNING *`,
      [
        'image',
        type,
        type === 'url' ? value : null,
        JSON.stringify(analysis),
        title || analysis.styleClassification?.aesthetic || 'Untitled',
        notes || null,
      ]
    );
    const item = result.rows[0];

    // Optionally build a prompt template
    let template = null;
    if (buildTemplate) {
      template = await tb.buildFromImageAnalysis(analysis, {
        templateName: title || null,
        tags: [],
      });
      // Link template to item
      await pool.query(
        'UPDATE media_library_items SET template_id = $1 WHERE id = $2',
        [template.templateId, item.id]
      );
    }

    res.json({ success: true, item, analysis, template });
  } catch (err) {
    console.error('[MultimediaLibrary] analyze-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/analyze-image/file — multipart file upload
router.post('/analyze-image/file', async (req, res) => {
  try {
    let multer;
    try { multer = require('multer'); } catch { return res.status(400).json({ error: 'multer not installed' }); }

    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
        cb(null, true);
      },
    }).single('image');

    upload(req, res, async (uploadErr) => {
      if (uploadErr) return res.status(400).json({ error: uploadErr.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;

      const { imageAnalyzer: ia, templateBuilder: tb } = getAgents();
      const analysis = await ia.analyzeImage(
        { type: 'base64', value: dataUri },
        { brandContext: req.body.brandContext ? JSON.parse(req.body.brandContext) : null }
      );

      const saveResult = await pool.query(
        `INSERT INTO media_library_items
           (type, source_type, analysis_json, title, status, created_at)
         VALUES ('image', 'file_upload', $1, $2, 'analyzed', NOW())
         RETURNING *`,
        [JSON.stringify(analysis), req.body.title || 'Uploaded Image']
      );

      let template = null;
      if (req.body.buildTemplate === 'true') {
        template = await tb.buildFromImageAnalysis(analysis, { templateName: req.body.title });
      }

      res.json({ success: true, item: saveResult.rows[0], analysis, template });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Video analysis ───────────────────────────────────────────────────────────

// POST /api/library/analyze-video
// Body: { url: string, keyframeBase64List?: string[], targetChannel?: string, buildTemplate?: boolean }
router.post('/analyze-video', async (req, res) => {
  try {
    const { url, keyframeBase64List = [], targetChannel, title, buildTemplate } = req.body;
    if (!url) return res.status(400).json({ error: '"url" is required' });

    const { videoAnalyzer: va, templateBuilder: tb } = getAgents();

    const analysis = await va.analyzeVideoUrl(url, { keyframeBase64List, targetChannel });

    const saveResult = await pool.query(
      `INSERT INTO media_library_items
         (type, source_type, source_url, analysis_json, title, status, created_at)
       VALUES ('video', 'url', $1, $2, $3, 'analyzed', NOW())
       RETURNING *`,
      [url, JSON.stringify(analysis), title || analysis.metadata?.title || url]
    );

    let template = null;
    if (buildTemplate) {
      template = await tb.buildFromVideoAnalysis(analysis, { templateName: title });
      await pool.query(
        'UPDATE media_library_items SET template_id = $1 WHERE id = $2',
        [template.templateId, saveResult.rows[0].id]
      );
    }

    // Check if yt-dlp is available
    const ytDlpAvailable = VideoAnalyzerAgent.isYtDlpAvailable();

    res.json({ success: true, item: saveResult.rows[0], analysis, template, ytDlpAvailable });
  } catch (err) {
    console.error('[MultimediaLibrary] analyze-video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Library CRUD ──────────────────────────────────────────────────────────────

// GET /api/library/items — list all items
router.get('/items', async (req, res) => {
  try {
    const { type, search, brandId, limit = 50 } = req.query;
    const conditions = [];
    const params = [];

    if (type) { conditions.push(`type = $${params.length + 1}`); params.push(type); }
    if (brandId) { conditions.push(`brand_id = $${params.length + 1}`); params.push(brandId); }
    if (search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR notes ILIKE $${params.length + 1})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, item_id, type, source_type, source_url, thumbnail_url, title, notes, status, template_id,
              analysis_json->'reversedPrompt' AS reversed_prompt,
              analysis_json->'styleClassification' AS style_classification,
              analysis_json->'promptTemplate' AS prompt_template_summary,
              created_at
       FROM media_library_items ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1}`,
      [...params, parseInt(limit, 10)]
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/library/items/:id — full item with analysis
router.get('/items/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM media_library_items WHERE id = $1 OR item_id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/library/items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media_library_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/items/:id/annotation — save canvas annotation / feedback
router.post('/items/:id/annotation', async (req, res) => {
  try {
    const { annotationJson, feedbackText } = req.body;
    // Get item_id from numeric id
    const itemResult = await pool.query(
      'SELECT item_id FROM media_library_items WHERE id = $1',
      [req.params.id]
    );
    if (!itemResult.rows.length) return res.status(404).json({ error: 'Item not found' });

    const result = await pool.query(
      `INSERT INTO media_library_annotations (item_id, annotation_json, feedback_text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [itemResult.rows[0].item_id, JSON.stringify(annotationJson || {}), feedbackText || null]
    );
    res.json({ success: true, annotation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/library/items/:id/annotations — get all annotations for an item
router.get('/items/:id/annotations', async (req, res) => {
  try {
    const itemResult = await pool.query(
      'SELECT item_id FROM media_library_items WHERE id = $1',
      [req.params.id]
    );
    if (!itemResult.rows.length) return res.status(404).json({ error: 'Item not found' });
    const result = await pool.query(
      'SELECT * FROM media_library_annotations WHERE item_id = $1 ORDER BY created_at DESC',
      [itemResult.rows[0].item_id]
    );
    res.json({ annotations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Prompt templates ─────────────────────────────────────────────────────────

// GET /api/library/templates — list templates
router.get('/templates', async (req, res) => {
  try {
    const { category, sourceType, search } = req.query;
    const templates = await getAgents().templateBuilder.listTemplates({ category, sourceType, search });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/library/templates/:templateId — get a template
router.get('/templates/:templateId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM media_prompt_templates WHERE template_id = $1',
      [req.params.templateId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json({ template: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/templates/:templateId/use — increment usage counter
router.post('/templates/:templateId/use', async (req, res) => {
  try {
    await pool.query(
      'UPDATE media_prompt_templates SET usage_count = usage_count + 1, updated_at = NOW() WHERE template_id = $1',
      [req.params.templateId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/library/health
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'multimedia-library',
    schemaInitialized,
    ytDlpAvailable: VideoAnalyzerAgent.isYtDlpAvailable(),
  });
});

module.exports = router;
