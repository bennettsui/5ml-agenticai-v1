/**
 * RecruitAI Studio — Image Generation & Media Library API
 *
 * Uses nanobanana (gemini-2.5-flash-image) for AI image generation.
 * All images are uploaded to mmdbfiles CDN for permanent storage
 * (Fly.dev filesystem is ephemeral — wiped on restart/deploy).
 *
 * Endpoints:
 *   GET  /api/recruitai-media/status            — Check Gemini availability + list visuals
 *   POST /api/recruitai-media/generate          — Generate a single visual by ID
 *   POST /api/recruitai-media/generate-all      — Generate all visuals (background batch)
 *   GET  /api/recruitai-media/generate-all/status — Poll batch progress
 *   GET  /api/recruitai-media/media             — List all media (library)
 *   POST /api/recruitai-media/media/upload      — Upload new image → CDN
 *   POST /api/recruitai-media/media/push-to-cdn — Upload local file to CDN
 *   POST /api/recruitai-media/media/metadata    — Update alt/CDN URL
 *   POST /api/recruitai-media/media/regenerate  — AI regenerate with instructions
 *   POST /api/recruitai-media/media/compress    — Optimize a single image
 *   POST /api/recruitai-media/media/compress-all— Optimize all images
 *   GET  /api/recruitai-media/metadata-export   — Download metadata JSON
 *   POST /api/recruitai-media/metadata-import   — Restore metadata from JSON
 *   POST /api/recruitai-media/sync-cdn          — Batch upload all locals to CDN
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR  = path.join(__dirname, '../../../frontend/public/recruitai');
const PAGES_DIR   = path.join(__dirname, '../../../frontend/app/vibe-demo/recruitai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const METADATA_PATH      = path.join(OUTPUT_DIR, '.media-metadata.json');
const METADATA_SEED_PATH = path.join(__dirname, '.media-metadata-seed.json');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── VISUALS definitions ────────────────────────────────────────────────────
// Each visual has: id, filename, description, prompt, dimensions
const VISUALS = [
  {
    id: 'hero-main',
    filename: 'hero-main.jpg',
    description: 'Main landing page hero banner',
    dimensions: { w: 1920, h: 1080 },
    prompt: `Ultra-modern enterprise technology hero banner, 1920x1080 landscape.
Deep navy-to-blue-black gradient background with subtle geometric network nodes.
Abstract glowing data streams, AI neural network visualization in electric blue and cyan.
Floating UI card wireframes suggesting automation workflow. Clean, professional, no text.
Hong Kong city skyline silhouette subtle in bottom-third. Cinematic lighting, depth of field.
Style: B2B SaaS landing page hero, premium quality, 8K render.`,
  },
  {
    id: 'hero-invoice',
    filename: 'hero-invoice.jpg',
    description: 'Invoice processing agent hero',
    dimensions: { w: 1200, h: 675 },
    prompt: `Professional AI invoice processing visualization, 1200x675 landscape.
Dark slate background. Floating invoice documents with OCR scanning laser lines in electric blue.
Data extraction highlights, checkmarks, automated workflow arrows.
Xero/QuickBooks style UI elements. Clean geometric style. No text overlays.
Style: fintech dashboard, professional B2B, premium lighting.`,
  },
  {
    id: 'hero-customer',
    filename: 'hero-customer.jpg',
    description: 'Customer service AI agent hero',
    dimensions: { w: 1200, h: 675 },
    prompt: `AI customer service chat visualization, 1200x675 landscape.
Dark emerald-to-slate gradient background. WhatsApp-style chat bubbles floating in 3D space.
AI chatbot avatar, response speed indicators, happy customer emoji icons.
Multichannel icons (WhatsApp, email, web). Clean modern illustration style.
24/7 clock visual element. No text. Style: friendly enterprise tech, premium quality.`,
  },
  {
    id: 'hero-bi',
    filename: 'hero-bi.jpg',
    description: 'Business intelligence agent hero',
    dimensions: { w: 1200, h: 675 },
    prompt: `Business intelligence dashboard visualization, 1200x675 landscape.
Deep amber-to-orange gradient dark background. Floating 3D charts: bar charts, line graphs, pie charts.
Data connections, KPI cards, trend arrows pointing up. Analytics dashboard UI fragments.
Glowing data flow between nodes. Clean modern style, no text.
Style: premium BI software, enterprise quality, warm amber highlights.`,
  },
  {
    id: 'hero-growth',
    filename: 'hero-growth.jpg',
    description: 'Growth module hero — advertising and SEO automation',
    dimensions: { w: 1200, h: 675 },
    prompt: `Digital advertising and growth automation hero, 1200x675 landscape.
Electric blue and cyan on dark background. Google/Meta Ads UI fragments floating in 3D.
SEO ranking graphs trending up, ROAS improvement charts, lead generation funnel visualization.
Rocket icon, upward arrows, growth curves. No text. Premium enterprise style.`,
  },
  {
    id: 'hero-marketing',
    filename: 'hero-marketing.jpg',
    description: 'Marketing module hero — social content and EDM',
    dimensions: { w: 1200, h: 675 },
    prompt: `AI marketing content generation visualization, 1200x675 landscape.
Violet-to-pink gradient on dark background. Social media post templates floating in 3D.
Instagram/Facebook mockup frames, email template wireframes, AI content generation sparkles.
Content calendar UI, engagement metrics. No text. Style: creative tech, vibrant but professional.`,
  },
  {
    id: 'hero-ops',
    filename: 'hero-ops.jpg',
    description: 'Business operations module hero — invoice and form automation',
    dimensions: { w: 1200, h: 675 },
    prompt: `Business operations automation hero, 1200x675 landscape.
Orange-to-amber gradient on dark background. Document processing pipeline visualization.
Form automation, workflow diagrams, automated report generation UI.
Efficiency arrows, time-saving clocks, process automation nodes. No text. Premium enterprise style.`,
  },
  {
    id: 'hero-analytics',
    filename: 'hero-analytics.jpg',
    description: 'Analytics module hero — full-channel data dashboard',
    dimensions: { w: 1200, h: 675 },
    prompt: `Full-channel analytics dashboard hero, 1200x675 landscape.
Indigo-to-deep-blue on very dark background. Multi-source data visualization: POS, CRM, web analytics.
Data lake illustration, BI dashboard fragments, real-time updating charts.
Glowing data nodes connected in a network. No text. Style: enterprise data platform, premium dark UI.`,
  },
  {
    id: 'hero-carnival',
    filename: 'hero-carnival.jpg',
    description: 'AI Carnival interactive experience hero',
    dimensions: { w: 1920, h: 1080 },
    prompt: `Futuristic AI carnival festival visual, 1920x1080 landscape.
Vibrant neon lights: yellow, cyan, magenta on dark night background.
Carnival tent silhouette with holographic AI projections. Tech meets festival energy.
3D floating AI agent characters, sparkles, celebration confetti in neon colors.
Hong Kong urban night atmosphere. Exciting, fun, tech-forward. No text.`,
  },
  {
    id: 'bg-testimonials',
    filename: 'bg-testimonials.jpg',
    description: 'Testimonials section background',
    dimensions: { w: 1920, h: 1080 },
    prompt: `Abstract dark background for testimonials section, 1920x1080.
Very dark slate blue, subtle bokeh lights, soft geometric patterns.
Professional, understated, allows white text to be readable over it.
No people, no faces, no text. Minimal premium abstract tech background.`,
  },
  {
    id: 'bg-cta',
    filename: 'bg-cta.jpg',
    description: 'Call-to-action section background',
    dimensions: { w: 1920, h: 400 },
    prompt: `Premium call-to-action banner background, 1920x400 wide format.
Deep blue gradient left to right, subtle circuit board pattern, glowing edge lighting.
Clean, modern, conveys urgency and professionalism. No text or UI elements.`,
  },
  {
    id: 'industry-retail',
    filename: 'industry-retail.jpg',
    description: 'Retail industry visual',
    dimensions: { w: 800, h: 500 },
    prompt: `Modern Hong Kong retail store with AI technology visualization, 800x500.
Boutique shop interior, product displays, AI chat interface floating on glass.
Warm lighting, premium products, digital price tags, inventory management UI.
No people faces visible, no text. Style: aspirational retail tech.`,
  },
  {
    id: 'industry-fnb',
    filename: 'industry-fnb.jpg',
    description: 'F&B industry visual',
    dimensions: { w: 800, h: 500 },
    prompt: `Hong Kong restaurant with AI technology overlay, 800x500.
Modern restaurant interior, kitchen visible, digital ordering interface.
Invoice scanning visualization, booking system UI overlay.
Warm food-service tones, professional. No faces, no text.`,
  },
  {
    id: 'industry-finance',
    filename: 'industry-finance.jpg',
    description: 'Finance industry visual',
    dimensions: { w: 800, h: 500 },
    prompt: `Modern Hong Kong financial services office with AI, 800x500.
Professional office environment, financial data dashboards on screens.
Document processing automation, compliance indicators.
Corporate blue tones, premium professional aesthetic. No faces, no text.`,
  },
  {
    id: 'industry-logistics',
    filename: 'industry-logistics.jpg',
    description: 'Logistics industry visual',
    dimensions: { w: 800, h: 500 },
    prompt: `Logistics and supply chain with AI visualization, 800x500.
Warehouse or shipping containers, Hong Kong port suggestion.
AI tracking UI overlay, route optimization visualization, automated invoice processing.
Industrial but tech-forward. No faces, no text.`,
  },
  {
    id: 'og-recruitai',
    filename: 'og-recruitai.jpg',
    description: 'OpenGraph social sharing image (1200x630)',
    dimensions: { w: 1200, h: 630 },
    prompt: `Professional OpenGraph social sharing image for AI platform, 1200x630.
Dark blue gradient background, modern abstract tech visuals.
Three floating card wireframes suggesting the three AI agents: invoice, chat, analytics.
Clean premium B2B SaaS aesthetic. No text (will be added in Next.js). Subtle Hong Kong element.`,
  },
];

module.exports.VISUALS = VISUALS;

// ─── PostgreSQL pool ────────────────────────────────────────────────────────
let _dbPool = null;
function getDbPool() {
  if (!_dbPool && process.env.DATABASE_URL) {
    try { _dbPool = require('../../../db').pool; } catch { _dbPool = null; }
  }
  return _dbPool;
}

async function initMediaTable() {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recruitai_media_assets (
        key VARCHAR(512) PRIMARY KEY,
        public_url TEXT,
        alt TEXT DEFAULT '',
        source VARCHAR(50) DEFAULT 'uploaded',
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('[RecruitAI] Media assets table ready');
  } catch (err) {
    console.error('[RecruitAI] Failed to create media table:', err.message);
  }
}

async function saveMediaUrlToDb(key, publicUrl, { alt, source, description } = {}) {
  const pool = getDbPool();
  if (!pool || !publicUrl) return;
  try {
    await pool.query(`
      INSERT INTO recruitai_media_assets (key, public_url, alt, source, description, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (key) DO UPDATE SET
        public_url = COALESCE(EXCLUDED.public_url, recruitai_media_assets.public_url),
        alt = COALESCE(NULLIF(EXCLUDED.alt, ''), recruitai_media_assets.alt),
        source = COALESCE(EXCLUDED.source, recruitai_media_assets.source),
        description = COALESCE(NULLIF(EXCLUDED.description, ''), recruitai_media_assets.description),
        updated_at = NOW()
    `, [key, publicUrl, alt || '', source || 'uploaded', description || '']);
  } catch (err) {
    console.error('[RecruitAI] DB save failed:', err.message);
  }
}

async function loadMediaUrlsFromDb() {
  const pool = getDbPool();
  if (!pool) return {};
  try {
    const { rows } = await pool.query(
      'SELECT key, public_url, alt, source, description, created_at FROM recruitai_media_assets ORDER BY created_at'
    );
    const map = {};
    for (const row of rows) {
      map[row.key] = { publicUrl: row.public_url, alt: row.alt || '', source: row.source, description: row.description, dbStored: true };
    }
    return map;
  } catch (err) {
    console.error('[RecruitAI] DB load failed:', err.message);
    return {};
  }
}

// ─── Metadata (JSON file + DB + seed) ──────────────────────────────────────
function loadMetadata() {
  // Try live file first, then seed
  for (const p of [METADATA_PATH, METADATA_SEED_PATH]) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { /* ignore */ }
  }
  return {};
}

let _metadataBackupTimeout = null;
function saveMetadata(meta) {
  try {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
    // Update seed file too so CDN URLs survive deploys
    try { fs.writeFileSync(METADATA_SEED_PATH, JSON.stringify(meta, null, 2)); } catch { /* ignore */ }
    // Debounced backup to mmdbfiles
    scheduleMetadataBackup(meta);
  } catch (err) {
    console.error('[RecruitAI] Failed to save metadata:', err.message);
  }
}

function scheduleMetadataBackup(meta) {
  if (_metadataBackupTimeout) clearTimeout(_metadataBackupTimeout);
  _metadataBackupTimeout = setTimeout(async () => {
    try {
      const sharp = require('sharp');
      const buf = await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 37, g: 99, b: 235 } },
      }).jpeg({ quality: 50 }).toBuffer();
      const base64 = buf.toString('base64');
      const resp = await fetch('http://5ml.mmdbfiles.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: `data:image/jpeg;base64,${base64}`, metadata: JSON.stringify(meta) }),
      });
      const data = await resp.json();
      if (data.success && data.public_url) {
        meta._backupUrl = data.public_url;
        meta._backupTime = new Date().toISOString();
        fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
        console.log('[RecruitAI] Metadata backed up to mmdbfiles');
      }
    } catch (err) {
      console.error('[RecruitAI] Metadata backup failed:', err.message);
    }
  }, 5000);
}

function savePublicUrl(key, publicUrl, extra = {}) {
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  meta[key].publicUrl = publicUrl;
  if (extra.alt)    meta[key].alt = extra.alt;
  if (extra.source) meta[key].source = extra.source;
  saveMetadata(meta);
  saveMediaUrlToDb(key, publicUrl, extra).catch(() => {});
}

async function hydrateMetadataFromDb() {
  let existing = {};
  try {
    if (fs.existsSync(METADATA_PATH)) {
      existing = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
      if (Object.keys(existing).filter(k => !k.startsWith('_')).length > 0) return;
    }
  } catch { /* ignore */ }
  const dbUrls = await loadMediaUrlsFromDb();
  const entries = Object.entries(dbUrls).filter(([, v]) => v.publicUrl);
  if (entries.length === 0) return;
  const meta = { ...existing };
  for (const [key, data] of entries) {
    meta[key] = { publicUrl: data.publicUrl, alt: data.alt || '', source: data.source || 'db-restored' };
  }
  try {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
    console.log(`[RecruitAI] Hydrated metadata from DB (${entries.length} CDN URLs)`);
  } catch (e) {
    console.error('[RecruitAI] Failed to hydrate metadata:', e.message);
  }
}

// ─── mmdbfiles CDN upload ───────────────────────────────────────────────────
async function uploadToMmdb(imageBuffer) {
  const sharp = require('sharp');
  const jpegBuffer = await sharp(imageBuffer)
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
  const base64 = jpegBuffer.toString('base64');
  const fileData = `data:image/jpeg;base64,${base64}`;
  const response = await fetch('http://5ml.mmdbfiles.com/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_data: fileData }),
  });
  const data = await response.json();
  if (!data.success) throw new Error('mmdbfiles upload returned success: false');
  console.log(`[RecruitAI] Uploaded to mmdbfiles: ${data.public_url}`);
  return data.public_url;
}

// ─── Gemini image generation ────────────────────────────────────────────────
async function generateVisual(prompt, dimensions) {
  const sharp = require('sharp');
  const MODEL = 'gemini-2.0-flash-preview-image-generation';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) throw new Error('No image returned by Gemini');
  const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const { w, h } = dimensions || { w: 1920, h: 1080 };
  const optimized = await sharp(imageBuffer)
    .resize(w, h, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
  return optimized;
}

// ─── Startup ────────────────────────────────────────────────────────────────
initMediaTable().then(() => hydrateMetadataFromDb()).catch(() => {});

// ─── Batch state ────────────────────────────────────────────────────────────
let batchState = { running: false, results: [], progress: 0, total: 0 };

// ─── Endpoints ──────────────────────────────────────────────────────────────

// GET /status — check availability + list visuals
router.get('/status', (req, res) => {
  const meta = loadMetadata();
  const visuals = VISUALS.map(v => ({
    id: v.id,
    filename: v.filename,
    description: v.description,
    exists: fs.existsSync(path.join(OUTPUT_DIR, v.filename)),
    publicUrl: meta[v.filename]?.publicUrl || null,
  }));
  res.json({
    geminiAvailable: !!GEMINI_API_KEY,
    model: 'gemini-2.5-flash-image (nanobanana)',
    total: VISUALS.length,
    generated: visuals.filter(v => v.exists).length,
    hasCdn: visuals.filter(v => v.publicUrl).length,
    visuals,
  });
});

// POST /generate — single visual
router.post('/generate', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const visual = VISUALS.find(v => v.id === id);
  if (!visual) return res.status(404).json({ error: `Visual '${id}' not found` });
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY not set' });

  try {
    console.log(`[RecruitAI] Generating ${id}...`);
    const imgBuffer = await generateVisual(visual.prompt, visual.dimensions);

    // Save locally
    const localPath = path.join(OUTPUT_DIR, visual.filename);
    fs.writeFileSync(localPath, imgBuffer);

    // Upload to CDN
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(imgBuffer);
      savePublicUrl(visual.filename, publicUrl, { source: 'generated', description: visual.description });
    } catch (cdnErr) {
      console.warn(`[RecruitAI] CDN upload failed for ${id}:`, cdnErr.message);
    }

    const stat = fs.statSync(localPath);
    res.json({
      success: true,
      id,
      filename: visual.filename,
      size: stat.size,
      path: `/recruitai/${visual.filename}`,
      publicUrl,
    });
  } catch (err) {
    console.error(`[RecruitAI] Generate ${id} failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /generate-all — batch (background)
router.post('/generate-all', (req, res) => {
  if (batchState.running) return res.status(409).json({ error: 'Batch already running', state: batchState });
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY not set' });

  const { force = false } = req.body || {};
  const toGenerate = force ? VISUALS : VISUALS.filter(v => !fs.existsSync(path.join(OUTPUT_DIR, v.filename)));

  batchState = { running: true, results: [], progress: 0, total: toGenerate.length };
  res.json({ success: true, message: `Generating ${toGenerate.length} visuals in background`, state: batchState });

  (async () => {
    for (const visual of toGenerate) {
      try {
        const imgBuffer = await generateVisual(visual.prompt, visual.dimensions);
        const localPath = path.join(OUTPUT_DIR, visual.filename);
        fs.writeFileSync(localPath, imgBuffer);
        let publicUrl = null;
        try {
          publicUrl = await uploadToMmdb(imgBuffer);
          savePublicUrl(visual.filename, publicUrl, { source: 'generated', description: visual.description });
        } catch { /* log only */ }
        batchState.results.push({ id: visual.id, success: true, publicUrl });
      } catch (err) {
        batchState.results.push({ id: visual.id, success: false, error: err.message });
      }
      batchState.progress++;
    }
    batchState.running = false;
    console.log(`[RecruitAI] Batch done: ${batchState.results.filter(r => r.success).length}/${toGenerate.length} succeeded`);
  })().catch(err => {
    batchState.running = false;
    console.error('[RecruitAI] Batch error:', err.message);
  });
});

// GET /generate-all/status — poll batch progress
router.get('/generate-all/status', (req, res) => {
  res.json({ success: true, state: batchState });
});

// GET /media — comprehensive media library list
router.get('/media', (req, res) => {
  const meta = loadMetadata();
  const images = [];

  // 1. VISUALS (generated images)
  for (const v of VISUALS) {
    const localPath = path.join(OUTPUT_DIR, v.filename);
    const exists = fs.existsSync(localPath);
    const metaEntry = meta[v.filename] || {};
    const cdnUrl = metaEntry.publicUrl || null;
    images.push({
      key: v.filename,
      filename: v.filename,
      folder: '',
      path: `/recruitai/${v.filename}`,
      source: 'generated',
      publicUrl: cdnUrl,
      localExists: exists,
      alt: metaEntry.alt || v.description,
      description: v.description,
      prompt: v.prompt,
      visualId: v.id,
      missing: !exists && !cdnUrl,
      canGenerate: true,
      size: exists ? fs.statSync(localPath).size : null,
      modified: exists ? fs.statSync(localPath).mtime.toISOString() : null,
    });
  }

  // 2. Any additional uploaded images in metadata
  for (const [key, entry] of Object.entries(meta)) {
    if (key.startsWith('_')) continue;
    if (VISUALS.some(v => v.filename === key)) continue; // already covered
    const localPath = path.join(OUTPUT_DIR, key);
    const exists = fs.existsSync(localPath);
    images.push({
      key,
      filename: key,
      folder: '',
      path: `/recruitai/${key}`,
      source: entry.source || 'uploaded',
      publicUrl: entry.publicUrl || null,
      localExists: exists,
      alt: entry.alt || key,
      description: entry.description || '',
      missing: !exists && !entry.publicUrl,
      canGenerate: false,
      size: exists ? fs.statSync(localPath).size : null,
      modified: exists ? fs.statSync(localPath).mtime.toISOString() : null,
    });
  }

  // 3. Scan filesystem for any unlisted images
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f)) continue;
      if (images.some(i => i.key === f)) continue;
      const localPath = path.join(OUTPUT_DIR, f);
      const stat = fs.statSync(localPath);
      images.push({
        key: f,
        filename: f,
        folder: '',
        path: `/recruitai/${f}`,
        source: 'uploaded',
        publicUrl: null,
        localExists: true,
        alt: f.replace(/[-_]/g, ' ').replace(/\.\w+$/, ''),
        description: '',
        missing: false,
        canGenerate: false,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  }

  res.json({ success: true, images, total: images.length });
});

// POST /media/upload — upload a new image file → CDN
router.post('/media/upload', async (req, res) => {
  const { fileData, filename, alt } = req.body;
  if (!fileData || !filename) return res.status(400).json({ error: 'fileData and filename required' });
  try {
    const sharp = require('sharp');
    const base64 = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const optimized = await sharp(buffer).jpeg({ quality: 85, progressive: true }).toBuffer();

    // Save locally
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const localPath = path.join(OUTPUT_DIR, safeName);
    fs.writeFileSync(localPath, optimized);

    // Upload to CDN
    const publicUrl = await uploadToMmdb(optimized);
    savePublicUrl(safeName, publicUrl, { alt: alt || safeName, source: 'uploaded' });

    res.json({ success: true, filename: safeName, publicUrl, path: `/recruitai/${safeName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /media/push-to-cdn — upload existing local file to CDN
router.post('/media/push-to-cdn', async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const localPath = path.join(OUTPUT_DIR, key);
  if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'File not found locally' });
  try {
    const buffer = fs.readFileSync(localPath);
    const publicUrl = await uploadToMmdb(buffer);
    const meta = loadMetadata();
    const alt = meta[key]?.alt || key;
    savePublicUrl(key, publicUrl, { alt, source: meta[key]?.source || 'uploaded' });
    res.json({ success: true, key, publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sync-cdn — batch push all local images to CDN
router.post('/sync-cdn', async (req, res) => {
  const results = [];
  if (!fs.existsSync(OUTPUT_DIR)) return res.json({ success: true, results });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f)) continue;
    const localPath = path.join(OUTPUT_DIR, f);
    try {
      const buffer = fs.readFileSync(localPath);
      const publicUrl = await uploadToMmdb(buffer);
      const meta = loadMetadata();
      savePublicUrl(f, publicUrl, { alt: meta[f]?.alt || f, source: meta[f]?.source || 'uploaded' });
      results.push({ key: f, success: true, publicUrl });
    } catch (err) {
      results.push({ key: f, success: false, error: err.message });
    }
  }
  res.json({ success: true, results });
});

// POST /media/metadata — update alt/publicUrl
router.post('/media/metadata', (req, res) => {
  const { key, alt, publicUrl, description } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  if (alt !== undefined)       meta[key].alt = alt;
  if (publicUrl !== undefined) meta[key].publicUrl = publicUrl;
  if (description !== undefined) meta[key].description = description;
  saveMetadata(meta);
  if (publicUrl) saveMediaUrlToDb(key, publicUrl, { alt, description }).catch(() => {});
  res.json({ success: true, key, entry: meta[key] });
});

// POST /media/compress — optimize a single image
router.post('/media/compress', async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const localPath = path.join(OUTPUT_DIR, key);
  if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'File not found' });
  try {
    const sharp = require('sharp');
    const before = fs.statSync(localPath).size;
    const buf = await sharp(fs.readFileSync(localPath)).jpeg({ quality: 82, progressive: true }).toBuffer();
    fs.writeFileSync(localPath, buf);
    const after = buf.length;
    res.json({ success: true, key, before, after, saved: before - after });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /media/compress-all — optimize all local images
router.post('/media/compress-all', async (req, res) => {
  const sharp = require('sharp');
  const results = [];
  if (!fs.existsSync(OUTPUT_DIR)) return res.json({ success: true, results });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) continue;
    const p = path.join(OUTPUT_DIR, f);
    try {
      const before = fs.statSync(p).size;
      const buf = await sharp(fs.readFileSync(p)).jpeg({ quality: 82, progressive: true }).toBuffer();
      fs.writeFileSync(p, buf);
      results.push({ key: f, success: true, before, after: buf.length });
    } catch (err) {
      results.push({ key: f, success: false, error: err.message });
    }
  }
  res.json({ success: true, results });
});

// POST /media/regenerate — AI regenerate with optional instructions
router.post('/media/regenerate', async (req, res) => {
  const { key, instructions } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY not set' });

  const visual = VISUALS.find(v => v.filename === key);
  if (!visual) return res.status(404).json({ error: `No VISUAL definition for '${key}'` });

  try {
    const prompt = instructions ? `${visual.prompt}\n\nAdditional instructions: ${instructions}` : visual.prompt;
    const imgBuffer = await generateVisual(prompt, visual.dimensions);

    // Archive old file
    const localPath = path.join(OUTPUT_DIR, key);
    if (fs.existsSync(localPath)) {
      const archivePath = localPath.replace(/(\.\w+)$/, `--archived-${Date.now()}$1`);
      fs.renameSync(localPath, archivePath);
    }

    fs.writeFileSync(localPath, imgBuffer);
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(imgBuffer);
      savePublicUrl(key, publicUrl, { source: 'generated', description: visual.description });
    } catch { /* log only */ }

    res.json({ success: true, key, publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /metadata-export — download current metadata
router.get('/metadata-export', (req, res) => {
  const meta = loadMetadata();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="recruitai-media-metadata.json"');
  res.send(JSON.stringify(meta, null, 2));
});

// POST /metadata-import — restore metadata (merge)
router.post('/metadata-import', (req, res) => {
  const { metadata } = req.body;
  if (!metadata || typeof metadata !== 'object') return res.status(400).json({ error: 'metadata object required' });
  const existing = loadMetadata();
  const merged = { ...existing, ...metadata };
  saveMetadata(merged);
  res.json({ success: true, keys: Object.keys(merged).length });
});

module.exports = router;
