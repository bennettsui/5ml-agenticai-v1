/**
 * TEDxXinyi — Visual Generation API
 *
 * Leverages the existing GeminiImageClient (nanobanana) to generate
 * website visuals following the "Bold Festival Poster" design concept.
 *
 * Design direction: Warm, high-contrast, Taipei creative festival energy.
 * Light backgrounds, golden hour warmth, bold typography feel.
 *
 * Endpoints:
 *   GET  /api/tedx-xinyi/status       — Check Gemini availability
 *   POST /api/tedx-xinyi/generate     — Generate a single visual by ID
 *   POST /api/tedx-xinyi/generate-all — Generate all visuals (batch)
 *   GET  /api/tedx-xinyi/visuals      — List generated visuals
 *   GET  /api/tedx-xinyi/visuals/:id  — Serve a generated visual image
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createGeminiImageClient } = require('../../photo-booth/lib/geminiImageClient');

const OUTPUT_DIR = path.join(__dirname, '../../../frontend/public/tedx-xinyi');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==================== VISUAL DEFINITIONS ====================
// Festival poster aesthetic: warm golden hour, Taipei Xinyi energy,
// bright optimistic tones (distinct from Boundary Street's dark noir)
const VISUALS = [
  {
    id: 'hero-home',
    filename: 'hero-home.webp',
    description: 'Home hero — dark galaxy distance cinematic banner',
    prompt: 'Wide 16:9 cinematic banner, vast deep-space sky in dark navy and charcoal black, layered nebula clouds in rich indigo violet and magenta that look like long-exposure astrophotography mixed with painting not 3D cartoon, a clear smooth galaxy arc curves gracefully across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the galaxy arc let a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths suggesting AI as a vast quiet information system, foreground at very bottom centre a tiny solitary human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose arms relaxed head slightly tilted upward, soft realistic rim light from the galaxy outlining head shoulders and coat clearly against the darkness, around the upper body a few faint rising particles of light where data streams begin to touch this person, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no UI HUD graphics, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art that a 40-year-old professional would comfortably share',
  },
  {
    id: 'hero-about',
    filename: 'hero-about.webp',
    description: 'About hero — creative gathering space Xinyi',
    prompt: 'Warm intimate view of a modern creative event space in Taipei, rows of minimalist chairs facing a small stage with warm amber lighting, large floor-to-ceiling windows showing Xinyi skyline at dusk, soft golden light streaming in, a few potted plants and modern furniture, the feeling of anticipation before a talk begins, cinematic photography, warm color palette with cream and amber tones, no text, no watermarks, no people, slight bokeh effect',
  },
  {
    id: 'hero-speakers',
    filename: 'hero-speakers.webp',
    description: 'Speakers hero — stage atmosphere warm light',
    prompt: 'Close up of a minimalist TEDx stage from the audience perspective, warm spotlight creating a circle of golden light on a clean stage, blurred audience seats in foreground, modern venue architecture visible, Taipei city lights visible through large windows in background, warm amber and cream color palette, dramatic but optimistic lighting like a festival concert poster, no text, no watermarks, no people, cinematic depth of field',
  },
  {
    id: 'hero-sustainability',
    filename: 'hero-sustainability.webp',
    description: 'Sustainability hero — 3D printed stage materials',
    prompt: 'Artistic close-up of sustainable stage materials: 3D printed geometric lamp components, recycled wood panels, and modular metal structures arranged beautifully on a workbench, warm natural daylight from a large window, workshop atmosphere, cream and warm brown tones with subtle green accents, macro photography style showing material textures, optimistic and creative mood, no text, no watermarks, no people, shallow depth of field',
  },
  {
    id: 'hero-community',
    filename: 'hero-community.webp',
    description: 'Community hero — circle gathering warmth',
    prompt: 'Overhead bird-eye view of chairs arranged in a circle in a modern Taipei rooftop terrace, warm evening golden hour light, potted trees and string lights creating cozy atmosphere, Xinyi district buildings visible in soft background, some chairs have warm red and amber cushions, the feeling of community gathering and conversation, warm bright photography style, no text, no watermarks, no people, festival poster mood',
  },
  {
    id: 'salon-teaser',
    filename: 'salon-teaser.webp',
    description: 'Home hero / Salon teaser — Blue Box venue cinematic',
    prompt: 'Wide 16:9 cinematic still of a theatre space reminiscent of Taipei Performing Arts Center Blue Box, clean modern architecture, high ceiling, deep blue ambient light, subtle hints of tiered seating and a stage, in the foreground silhouettes of diverse people standing or sitting facing towards a glowing central focal point symbolising AI and ideas not a literal screen of code, thin streams of light or flowing lines connecting people to the central glow suggesting shared learning and becoming, colour palette deep blue dark charcoal with accents of TED red and warm skin tones, enough negative space on one side for overlay text, no text no watermarks no logos, optimistic contemplative atmosphere',
  },
  {
    id: 'salon-hero',
    filename: 'salon-hero.webp',
    description: 'Salon page main visual — full galaxy centered cinematic wide',
    prompt: 'Wide 16:9 cinematic banner, the ENTIRE galaxy is fully visible and vertically centred in frame with generous breathing room above and below, vast spiral galaxy with smooth arc curving gracefully across the centre of the image, rich indigo violet and magenta nebula clouds in a dark navy charcoal sky mixing long-exposure astrophotography with painting not 3D cartoon, softly glowing warm core at galaxy centre surrounded by many tiny sharp stars, a few very thin beams of light and sparse glowing data-like particles radiating outward from the core, deep space surrounds the galaxy on all sides so the full shape is clearly visible from edge to edge, at the very bottom centre a single tiny solitary human figure silhouette stands on a minimal dark ledge facing upward toward the galaxy occupying only 3-5% of image height, soft rim light from the galaxy outlines the figure against the darkness, palette of deep blues violets blacks and neutral whites with warm highlights at galaxy core, camera pulled back far enough to frame the complete galaxy with dark space margins, no text no watermarks no logos no UI, cinematic contrast soft bloom on galaxy subtle film-grain, mature restrained theatrical atmosphere',
  },
  {
    id: 'poster-dark',
    filename: 'poster-dark.webp',
    description: 'Dark galaxy poster background — 4:5 portrait for key visual section',
    prompt: '4:5 vertical cinematic sci-fi poster background, upper 80% is a vast deep-space sky in dark navy and charcoal black with layered slightly abstract nebula clouds in rich indigo violet and magenta mixing long-exposure astrophotography with painting not 3D cartoon, a clear smooth galaxy arc curves from left to right across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the arc a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths, in the very bottom centre a tiny human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose feet near edge arms relaxed head slightly tilted up, soft realistic rim light from galaxy above so the outline of head shoulders and coat is clearly readable against the darkness, around the upper body a few faint rising particles of light, the lower 15% of image fades to near-pure black providing a clean base for text overlay, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no logos no HUD no UI, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art',
  },
  {
    id: 'salon-galaxy',
    filename: 'salon-galaxy.webp',
    description: 'Galaxy networking visual — The Quest community',
    prompt: 'Square abstract galaxy made of floating islands or orbits each representing a different Intelligence domain, Design Intelligence with minimal objects like chairs posters typography, Food Intelligence with stylised table ingredients coffee, Ocean Intelligence with wave lines tiny whale dolphin icons, Music Art Intelligence with musical notes vinyl simple instrument shapes, no realistic logos but iconic shapes suggesting each domain, dark background with colourful but slightly muted orbit colours connected by thin lines with one orbit subtly highlighted in TED red, overall composition usable as a background behind text, no text no watermarks',
  },
  {
    id: 'salon-curiosity',
    filename: 'salon-curiosity.webp',
    description: 'Curiosity zones visual — multi-zone experience',
    prompt: 'Vertical portrait 3:4 image composed of multiple stacked zones, bottom a small open-mic corner with a mic stand and a small seated audience, middle a creative market area with small booths plants and people talking, upper a quiet reading journaling corner with books notebooks lamps, style semi-illustrative slightly stylised not hyper-realistic, people appear diverse but not individually recognisable, lighting warm glows in each zone connected with a gentle path or staircase hinting at moving from one version of yourself to the next, palette mix of warm earth tones and deep blues with small red accents, no text no watermarks no logos',
  },
];

// Lazy init Gemini client
let geminiClient = null;
function getClient() {
  if (!geminiClient && GEMINI_API_KEY) {
    geminiClient = createGeminiImageClient(GEMINI_API_KEY);
  }
  return geminiClient;
}

// Background generation state
let batchState = { running: false, startedAt: null, results: [], force: false };

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ==================== ROUTES ====================

router.get('/status', (req, res) => {
  const hasKey = !!GEMINI_API_KEY;
  const generated = VISUALS.map((v) => ({
    id: v.id,
    filename: v.filename,
    description: v.description,
    exists: fs.existsSync(path.join(OUTPUT_DIR, v.filename)),
  }));

  res.json({
    status: 'ok',
    geminiAvailable: hasKey,
    model: 'gemini-2.5-flash-image (nanobanana)',
    totalVisuals: VISUALS.length,
    generatedCount: generated.filter((v) => v.exists).length,
    visuals: generated,
  });
});

router.post('/generate', async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { id } = req.body;
  const visual = VISUALS.find((v) => v.id === id);
  if (!visual) {
    return res.status(400).json({ error: `Unknown visual ID: ${id}`, available: VISUALS.map((v) => v.id) });
  }

  try {
    console.log(`[TEDxXinyi] Generating visual: ${visual.id} (${visual.description})`);
    const imageBuffer = await generateVisual(client, visual.prompt);
    const outputPath = path.join(OUTPUT_DIR, visual.filename);
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`[TEDxXinyi] Saved ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);

    res.json({
      success: true,
      id: visual.id,
      filename: visual.filename,
      size: imageBuffer.length,
      path: `/tedx-xinyi/${visual.filename}`,
    });
  } catch (err) {
    console.error(`[TEDxXinyi] Failed to generate ${visual.id}:`, err.message);
    res.status(500).json({ error: err.message, id: visual.id });
  }
});

router.post('/generate-all', async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  if (batchState.running) {
    return res.status(409).json({
      error: 'Batch generation already in progress',
      startedAt: batchState.startedAt,
      progress: batchState.results.length + '/' + VISUALS.length,
      statusUrl: '/api/tedx-xinyi/generate-all/status',
    });
  }

  const force = req.body?.force === true;

  // Return immediately, process in background
  batchState = { running: true, startedAt: new Date().toISOString(), results: [], force };

  res.status(202).json({
    accepted: true,
    message: 'Batch generation started in background',
    force,
    totalVisuals: VISUALS.length,
    statusUrl: '/api/tedx-xinyi/generate-all/status',
  });

  // Background processing
  (async () => {
    for (const visual of VISUALS) {
      const outputPath = path.join(OUTPUT_DIR, visual.filename);
      const exists = fs.existsSync(outputPath);

      if (exists && !force) {
        batchState.results.push({ id: visual.id, status: 'skipped', reason: 'already exists' });
        continue;
      }

      try {
        console.log(`[TEDxXinyi] Generating: ${visual.id}...`);
        const imageBuffer = await generateVisual(client, visual.prompt);
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`[TEDxXinyi] ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
        batchState.results.push({ id: visual.id, status: 'generated', size: imageBuffer.length });
      } catch (err) {
        console.error(`[TEDxXinyi] ${visual.id}: ${err.message}`);
        batchState.results.push({ id: visual.id, status: 'failed', error: err.message });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    batchState.running = false;
    const generated = batchState.results.filter((r) => r.status === 'generated').length;
    const failed = batchState.results.filter((r) => r.status === 'failed').length;
    console.log(`[TEDxXinyi] Batch complete: ${generated} generated, ${failed} failed`);
  })();
});

router.get('/generate-all/status', (req, res) => {
  const generated = batchState.results.filter((r) => r.status === 'generated').length;
  const failed = batchState.results.filter((r) => r.status === 'failed').length;
  const skipped = batchState.results.filter((r) => r.status === 'skipped').length;

  res.json({
    running: batchState.running,
    startedAt: batchState.startedAt,
    force: batchState.force,
    progress: batchState.results.length + '/' + VISUALS.length,
    summary: { generated, failed, skipped, total: VISUALS.length },
    results: batchState.results,
  });
});

router.get('/visuals', (req, res) => {
  const visuals = VISUALS.map((v) => {
    const filePath = path.join(OUTPUT_DIR, v.filename);
    const exists = fs.existsSync(filePath);
    const stat = exists ? fs.statSync(filePath) : null;
    return {
      id: v.id,
      filename: v.filename,
      description: v.description,
      exists,
      size: stat ? stat.size : 0,
      url: exists ? `/tedx-xinyi/${v.filename}` : null,
    };
  });

  res.json({ visuals });
});

router.get('/visuals/:id', (req, res) => {
  const visual = VISUALS.find((v) => v.id === req.params.id);
  if (!visual) {
    return res.status(404).json({ error: 'Unknown visual ID' });
  }

  const filePath = path.join(OUTPUT_DIR, visual.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Visual not yet generated', id: visual.id });
  }

  res.sendFile(filePath);
});

// ==================== MEDIA LIBRARY ====================

const SPEAKERS_DIR = path.join(OUTPUT_DIR, 'speakers');
if (!fs.existsSync(SPEAKERS_DIR)) {
  fs.mkdirSync(SPEAKERS_DIR, { recursive: true });
}

const METADATA_PATH = path.join(OUTPUT_DIR, '.media-metadata.json');

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_PATH)) return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
  } catch { /* ignore */ }
  return {};
}

function saveMetadata(meta) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
}

function scanAllImages() {
  const images = [];
  const imgRe = /\.(jpg|jpeg|png|webp|gif)$/i;
  // Root images
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      const full = path.join(OUTPUT_DIR, f);
      if (fs.statSync(full).isFile() && imgRe.test(f)) {
        const stat = fs.statSync(full);
        const visual = VISUALS.find(v => v.filename === f);
        images.push({ filename: f, folder: '', path: `/tedx-xinyi/${f}`, size: stat.size, modified: stat.mtime.toISOString(), source: visual ? 'generated' : 'uploaded', description: visual ? visual.description : '' });
      }
    }
  }
  // Scan all subdirectories (speakers, etc.)
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const dir of fs.readdirSync(OUTPUT_DIR)) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        for (const f of fs.readdirSync(dirPath)) {
          const full = path.join(dirPath, f);
          if (fs.statSync(full).isFile() && imgRe.test(f)) {
            const stat = fs.statSync(full);
            images.push({ filename: f, folder: dir, path: `/tedx-xinyi/${dir}/${f}`, size: stat.size, modified: stat.mtime.toISOString(), source: 'uploaded', description: '' });
          }
        }
      }
    }
  }
  return images;
}

// ---- API: list all media ----
router.get('/media', (req, res) => {
  const images = scanAllImages();
  const meta = loadMetadata();
  const result = images.map(img => {
    const key = img.folder ? `${img.folder}/${img.filename}` : img.filename;
    return { ...img, alt: (meta[key] && meta[key].alt) || '', customName: (meta[key] && meta[key].customName) || '' };
  });
  res.json({ images: result, total: result.length });
});

// ---- API: update metadata (alt, customName) ----
router.post('/media/metadata', express.json(), (req, res) => {
  const { key, alt, customName } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  if (alt !== undefined) meta[key].alt = alt;
  if (customName !== undefined) meta[key].customName = customName;
  saveMetadata(meta);
  res.json({ success: true, key, meta: meta[key] });
});

// Resize + compress helper: hero/poster images → max 1920w, speakers → 800w
async function optimizeImage(raw, key) {
  const sharp = require('sharp');
  const isSpeaker = key.startsWith('speakers/');
  const maxWidth = isSpeaker ? 800 : 1920;
  const ext = path.extname(key).toLowerCase();
  let pipeline = sharp(raw).resize({ width: maxWidth, withoutEnlargement: true });
  if (ext === '.webp') {
    return pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
  } else if (ext === '.png') {
    return pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
  } else {
    return pipeline.jpeg({ quality: 80, progressive: true }).toBuffer();
  }
}

// ---- API: compress single image ----
router.post('/media/compress', express.json(), async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const filePath = path.join(OUTPUT_DIR, key);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  try {
    const raw = fs.readFileSync(filePath);
    const compressed = await optimizeImage(raw, key);
    if (compressed.length < raw.length) {
      fs.writeFileSync(filePath, compressed);
      const ratio = ((1 - compressed.length / raw.length) * 100).toFixed(0);
      console.log(`[TEDxXinyi] Compressed ${key}: ${(raw.length / 1024).toFixed(0)} KB -> ${(compressed.length / 1024).toFixed(0)} KB (${ratio}% smaller)`);
      res.json({ success: true, key, before: raw.length, after: compressed.length, savings: `${ratio}%` });
    } else {
      res.json({ success: true, key, before: raw.length, after: raw.length, savings: '0%', note: 'Already optimized' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- API: compress all images ----
router.post('/media/compress-all', express.json(), async (req, res) => {
  const images = scanAllImages();
  const results = [];
  for (const img of images) {
    const key = img.folder ? `${img.folder}/${img.filename}` : img.filename;
    const filePath = path.join(OUTPUT_DIR, key);
    try {
      const raw = fs.readFileSync(filePath);
      const compressed = await optimizeImage(raw, key);
      if (compressed.length < raw.length) {
        fs.writeFileSync(filePath, compressed);
        const ratio = ((1 - compressed.length / raw.length) * 100).toFixed(0);
        results.push({ key, before: raw.length, after: compressed.length, savings: `${ratio}%` });
      } else {
        results.push({ key, before: raw.length, after: raw.length, savings: '0%', note: 'Already optimized' });
      }
    } catch (err) {
      results.push({ key, error: err.message });
    }
  }
  const totalBefore = results.reduce((s, r) => s + (r.before || 0), 0);
  const totalAfter = results.reduce((s, r) => s + (r.after || r.before || 0), 0);
  console.log(`[TEDxXinyi] Compress all: ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB`);
  res.json({ success: true, results, totalBefore, totalAfter });
});

// ---- API: upload image ----
router.post('/media/upload', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { data, filename, folder, alt } = req.body;
    if (!data || !data.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid image data' });
    const match = data.match(/^data:image\/(jpeg|png|webp|gif);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Unsupported format' });
    const rawBuffer = Buffer.from(match[2], 'base64');
    if (rawBuffer.length > 25 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 25MB)' });

    // Sanitize filename
    const safeName = (filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const targetDir = folder === 'speakers' ? SPEAKERS_DIR : OUTPUT_DIR;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Compress with sharp
    const sharp = require('sharp');
    const ext = path.extname(safeName).toLowerCase();
    let compressed;
    if (ext === '.webp') {
      compressed = await sharp(rawBuffer).webp({ quality: 82, effort: 4 }).toBuffer();
    } else if (ext === '.png') {
      compressed = await sharp(rawBuffer).png({ quality: 80, compressionLevel: 9 }).toBuffer();
    } else {
      compressed = await sharp(rawBuffer).jpeg({ quality: 80, progressive: true }).toBuffer();
    }

    const outPath = path.join(targetDir, safeName);
    fs.writeFileSync(outPath, compressed);

    // Save alt text if provided
    if (alt) {
      const meta = loadMetadata();
      const key = folder === 'speakers' ? `speakers/${safeName}` : safeName;
      if (!meta[key]) meta[key] = {};
      meta[key].alt = alt;
      saveMetadata(meta);
    }

    const ratio = ((1 - compressed.length / rawBuffer.length) * 100).toFixed(0);
    const urlPath = folder === 'speakers' ? `/tedx-xinyi/speakers/${safeName}` : `/tedx-xinyi/${safeName}`;
    console.log(`[TEDxXinyi] Upload: ${safeName} — ${(rawBuffer.length / 1024).toFixed(0)} KB -> ${(compressed.length / 1024).toFixed(0)} KB (${ratio}% smaller)`);
    res.json({ success: true, filename: safeName, path: urlPath, originalSize: rawBuffer.length, compressedSize: compressed.length, savings: `${ratio}%` });
  } catch (err) {
    console.error('[TEDxXinyi] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Legacy speaker upload endpoint (still works)
router.post('/upload-speaker', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { speaker, data } = req.body;
    const validSpeakers = ['cheng-shi-jia', 'lin-dong-liang', 'yang-shi-yi', 'glass-brothers'];
    if (!validSpeakers.includes(speaker)) return res.status(400).json({ error: 'Invalid speaker ID' });
    if (!data || !data.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid image data' });
    const match = data.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Unsupported image format' });
    const rawBuffer = Buffer.from(match[2], 'base64');
    if (rawBuffer.length > 25 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 25MB)' });
    const sharp = require('sharp');
    const compressed = await sharp(rawBuffer).resize(800, 800, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, progressive: true }).toBuffer();
    const outFilename = `${speaker}.jpg`;
    fs.writeFileSync(path.join(SPEAKERS_DIR, outFilename), compressed);
    const ratio = ((1 - compressed.length / rawBuffer.length) * 100).toFixed(0);
    res.json({ success: true, speaker, filename: outFilename, path: `/tedx-xinyi/speakers/${outFilename}`, originalSize: rawBuffer.length, compressedSize: compressed.length, savings: `${ratio}%` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Media Library Admin UI ----
router.get('/upload', (req, res) => {
  res.send(MEDIA_LIBRARY_HTML);
});

const MEDIA_LIBRARY_HTML = `<!DOCTYPE html>
<html lang="zh-TW"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TEDxXinyi — Media Library</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#111;color:#e5e5e5;min-height:100vh}
/* Login */
.login-bg{position:fixed;inset:0;background:#111;z-index:200;display:flex;align-items:center;justify-content:center}
.login-bg.hidden{display:none}
.login-box{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:2rem;width:90%;max-width:360px;text-align:center}
.login-box h1{font-size:1.1rem;margin-bottom:0.3rem}.login-box h1 em{color:#E62B1E;font-style:normal}
.login-box .sub{color:#666;font-size:0.8rem;margin-bottom:1.5rem}
.login-box input{width:100%;padding:0.6rem;background:#111;border:1px solid #333;border-radius:6px;color:#ccc;font-size:0.9rem;margin-bottom:1rem;text-align:center}
.login-box input:focus{outline:none;border-color:#E62B1E}
.login-box .err{color:#f87171;font-size:0.8rem;margin-top:0.5rem;display:none}
/* App */
.app{display:none}
.app.show{display:block}
.header{background:#1a1a1a;border-bottom:1px solid #333;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.header h1{font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:0.5rem}
.header h1 em{color:#E62B1E;font-style:normal}
.header-actions{display:flex;gap:0.5rem;align-items:center}
.toolbar{background:#1a1a1a;border-bottom:1px solid #222;padding:0.75rem 1.5rem;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;position:sticky;top:52px;z-index:40}
.btn{border:none;padding:0.45rem 1rem;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.8rem;transition:all 0.15s;display:inline-flex;align-items:center;gap:0.35rem}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.btn-red{background:#E62B1E;color:#fff}.btn-red:hover:not(:disabled){background:#c42419}
.btn-outline{background:transparent;border:1px solid #444;color:#ccc}.btn-outline:hover:not(:disabled){border-color:#888;color:#fff}
.btn-ghost{background:transparent;color:#999;border:1px solid transparent}.btn-ghost:hover{color:#fff}
.btn-sm{padding:0.3rem 0.6rem;font-size:0.75rem}
.stats{font-size:0.75rem;color:#666;margin-left:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;padding:1.5rem}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;transition:all 0.15s;position:relative}
.card:hover{border-color:#444;transform:translateY(-1px)}
.card.selected{border-color:#E62B1E;box-shadow:0 0 0 1px #E62B1E}
.card-check{position:absolute;top:0.5rem;left:0.5rem;z-index:5;width:20px;height:20px;border-radius:4px;border:2px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
.card.selected .card-check{background:#E62B1E;border-color:#E62B1E}
.card-check svg{opacity:0;transition:opacity 0.1s}.card.selected .card-check svg{opacity:1}
.card-img{aspect-ratio:4/3;background:#0a0a0a;display:flex;align-items:center;justify-content:center;overflow:hidden}
.card-img img{width:100%;height:100%;object-fit:cover}
.card-img .placeholder{color:#333;font-size:2rem;font-weight:900}
.card-body{padding:0.75rem}
.card-filename{font-size:0.8rem;font-weight:600;color:#ddd;word-break:break-all;margin-bottom:0.25rem}
.card-meta{font-size:0.7rem;color:#666;display:flex;gap:0.5rem;margin-bottom:0.5rem}
.card-alt{width:100%;padding:0.35rem 0.5rem;background:#111;border:1px solid #333;border-radius:5px;color:#ccc;font-size:0.75rem;margin-bottom:0.4rem;resize:none;font-family:inherit}
.card-alt:focus{outline:none;border-color:#E62B1E}
.card-actions{display:flex;gap:0.25rem}
.tag{display:inline-block;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.65rem;font-weight:600}
.tag-gen{background:#1e293b;color:#60a5fa}.tag-up{background:#1c1917;color:#fb923c}.tag-spk{background:#14532d;color:#86efac}
.toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:0.75rem 1rem;font-size:0.8rem;z-index:100;opacity:0;transition:opacity 0.3s;pointer-events:none}
.toast.show{opacity:1}.toast.ok{border-color:#065f46;color:#6ee7b7}.toast.err{border-color:#991b1b;color:#fca5a5}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:60;display:none;align-items:center;justify-content:center}
.modal-bg.open{display:flex}
.modal{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:1.5rem;width:90%;max-width:480px}
.modal h2{font-size:1rem;font-weight:700;margin-bottom:1rem}
.modal label{display:block;font-size:0.8rem;font-weight:600;color:#999;margin-bottom:0.3rem}
.modal input[type=file]{width:100%;margin-bottom:0.75rem;font-size:0.8rem}
.modal input[type=text],.modal select,.modal textarea{width:100%;padding:0.45rem 0.6rem;background:#111;border:1px solid #333;border-radius:6px;color:#ccc;font-size:0.8rem;margin-bottom:0.75rem;font-family:inherit}
.modal input[type=text]:focus,.modal select:focus,.modal textarea:focus{outline:none;border-color:#E62B1E}
.modal .preview-area{aspect-ratio:16/9;background:#0a0a0a;border-radius:8px;margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;overflow:hidden}
.modal .preview-area img{max-width:100%;max-height:100%;object-fit:contain}
.modal-foot{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.5rem}
.compress-bar{height:3px;background:#222;border-radius:2px;margin-top:0.5rem;overflow:hidden;display:none}
.compress-bar .fill{height:100%;background:#E62B1E;transition:width 0.3s;width:0}
</style>
</head><body>

<!-- Login Screen -->
<div class="login-bg" id="loginScreen">
  <div class="login-box">
    <h1><em>TEDx</em>Xinyi Admin</h1>
    <p class="sub">Media Library</p>
    <form onsubmit="event.preventDefault();doLogin()">
      <input type="password" id="loginPw" placeholder="Password" autofocus>
      <button class="btn btn-red" type="submit" style="width:100%">Enter</button>
    </form>
    <p class="err" id="loginErr">Incorrect password</p>
  </div>
</div>

<!-- Main App (hidden until logged in) -->
<div class="app" id="app">
<div class="header">
  <h1><em>TEDx</em>Xinyi Media Library</h1>
  <div class="header-actions">
    <button class="btn btn-outline" onclick="loadMedia()">Refresh</button>
    <button class="btn btn-ghost btn-sm" onclick="doLogout()">Logout</button>
  </div>
</div>
<div class="toolbar">
  <button class="btn btn-red" onclick="openUpload()">+ Upload</button>
  <button class="btn btn-outline" id="compressAllBtn" onclick="compressAll()">Compress All</button>
  <button class="btn btn-outline" id="compressSelBtn" onclick="compressSelected()" disabled>Compress Selected</button>
  <button class="btn btn-ghost btn-sm" onclick="toggleSelectAll()">Select All</button>
  <div class="stats" id="stats"></div>
</div>
<div class="compress-bar" id="compressBar"><div class="fill" id="compressFill"></div></div>
<div class="grid" id="grid"></div>
</div>

<!-- Upload Modal -->
<div class="modal-bg" id="uploadModal">
  <div class="modal">
    <h2>Upload Image</h2>
    <label>File (JPG / PNG / WebP, max 25 MB)</label>
    <input type="file" id="uploadFile" accept="image/jpeg,image/png,image/webp">
    <div class="preview-area" id="uploadPreview"><span style="color:#444;font-size:0.85rem">Select a file</span></div>
    <label>Save to</label>
    <select id="uploadFolder">
      <option value="">Root (hero / poster / salon)</option>
      <option value="speakers">Speakers</option>
    </select>
    <label>Custom filename (optional)</label>
    <input type="text" id="uploadName" placeholder="auto-detect from file">
    <label>Alt text</label>
    <textarea id="uploadAlt" rows="2" placeholder="Describe the image..."></textarea>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeUpload()">Cancel</button>
      <button class="btn btn-red" id="uploadBtn" onclick="doUpload()">Upload</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let token = sessionStorage.getItem('tedx_token') || '';
let mediaItems = [];
let selectedKeys = new Set();

// Auth
async function doLogin() {
  const pw = document.getElementById('loginPw').value;
  if (!pw) return;
  try {
    const r = await fetch('/api/tedx-xinyi/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
    const d = await r.json();
    if (r.ok && d.token) { token = d.token; sessionStorage.setItem('tedx_token', token); showApp(); }
    else { document.getElementById('loginErr').style.display = 'block'; }
  } catch(e) { document.getElementById('loginErr').style.display = 'block'; }
}
function doLogout() { token = ''; sessionStorage.removeItem('tedx_token'); document.getElementById('loginScreen').classList.remove('hidden'); document.getElementById('app').classList.remove('show'); }
function showApp() { document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('app').classList.add('show'); loadMedia(); }
if (token) { showApp(); }

// Authed fetch helper
function authFetch(url, opts = {}) {
  if (!opts.headers) opts.headers = {};
  opts.headers['x-admin-token'] = token;
  return fetch(url, opts);
}

async function loadMedia() {
  try {
    const r = await authFetch('/api/tedx-xinyi/media');
    if (r.status === 401) { doLogout(); return; }
    const d = await r.json();
    mediaItems = d.images || [];
    renderGrid();
    updateStats();
  } catch(e) { showToast('Failed to load: ' + e.message, true); }
}

function renderGrid() {
  const g = document.getElementById('grid');
  if (!mediaItems.length) { g.innerHTML = '<div style="text-align:center;padding:4rem;color:#444;grid-column:1/-1">No images found</div>'; return; }
  g.innerHTML = mediaItems.map(img => {
    const key = img.folder ? img.folder + '/' + img.filename : img.filename;
    const sel = selectedKeys.has(key) ? ' selected' : '';
    const sizeKb = (img.size / 1024).toFixed(0);
    const src = img.folder ? '/tedx-xinyi/' + img.folder + '/' + img.filename : '/tedx-xinyi/' + img.filename;
    const tag = img.source === 'generated' ? '<span class="tag tag-gen">Generated</span>' : img.folder === 'speakers' ? '<span class="tag tag-spk">Speaker</span>' : '<span class="tag tag-up">Uploaded</span>';
    const v = img.size;
    return '<div class="card' + sel + '" data-key="' + key + '">' +
      '<div class="card-check" onclick="toggleSelect(event,\\'' + key + '\\')">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<div class="card-img"><img src="' + src + '?v=' + v + '" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\'"><div class="placeholder" style="display:none">?</div></div>' +
      '<div class="card-body">' +
        '<div class="card-filename">' + img.filename + ' ' + tag + '</div>' +
        '<div class="card-meta"><span>' + sizeKb + ' KB</span></div>' +
        '<textarea class="card-alt" rows="1" placeholder="Alt text..." data-key="' + key + '" onfocus="this.rows=2" onblur="this.rows=1;saveAlt(this)">' + (img.alt || '') + '</textarea>' +
        '<div class="card-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="compressOne(\\'' + key + '\\')">Compress</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

function updateStats() {
  const total = mediaItems.length;
  const totalSize = mediaItems.reduce((s, i) => s + i.size, 0);
  document.getElementById('stats').textContent = total + ' images | ' + (totalSize / 1024 / 1024).toFixed(1) + ' MB total';
  document.getElementById('compressSelBtn').disabled = selectedKeys.size === 0;
}

function toggleSelect(e, key) {
  e.stopPropagation();
  if (selectedKeys.has(key)) selectedKeys.delete(key); else selectedKeys.add(key);
  const card = document.querySelector('.card[data-key="' + key + '"]');
  if (card) card.classList.toggle('selected');
  updateStats();
}

function toggleSelectAll() {
  if (selectedKeys.size === mediaItems.length) {
    selectedKeys.clear();
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
  } else {
    mediaItems.forEach(img => { const k = img.folder ? img.folder + '/' + img.filename : img.filename; selectedKeys.add(k); });
    document.querySelectorAll('.card').forEach(c => c.classList.add('selected'));
  }
  updateStats();
}

async function saveAlt(el) {
  const key = el.dataset.key;
  const alt = el.value.trim();
  try {
    await authFetch('/api/tedx-xinyi/media/metadata', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key, alt }) });
  } catch(e) { showToast('Save failed: ' + e.message, true); }
}

async function compressOne(key) {
  const btn = event.target;
  btn.disabled = true; btn.textContent = '...';
  try {
    const r = await authFetch('/api/tedx-xinyi/media/compress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key }) });
    const d = await r.json();
    if (d.note) showToast(key + ': already optimized'); else showToast(key + ': ' + d.savings + ' smaller');
    loadMedia();
  } catch(e) { showToast('Error: ' + e.message, true); }
  btn.disabled = false; btn.textContent = 'Compress';
}

async function compressAll() {
  const btn = document.getElementById('compressAllBtn');
  const bar = document.getElementById('compressBar');
  const fill = document.getElementById('compressFill');
  btn.disabled = true; btn.textContent = 'Compressing...';
  bar.style.display = 'block'; fill.style.width = '20%';
  try {
    fill.style.width = '50%';
    const r = await authFetch('/api/tedx-xinyi/media/compress-all', { method:'POST', headers:{'Content-Type':'application/json'}, body: '{}' });
    const d = await r.json();
    fill.style.width = '100%';
    const saved = d.totalBefore - d.totalAfter;
    showToast('Done! Saved ' + (saved / 1024).toFixed(0) + ' KB across ' + d.results.length + ' images');
    loadMedia();
  } catch(e) { showToast('Error: ' + e.message, true); }
  btn.disabled = false; btn.textContent = 'Compress All';
  setTimeout(() => { bar.style.display = 'none'; fill.style.width = '0'; }, 2000);
}

async function compressSelected() {
  if (!selectedKeys.size) return;
  const btn = document.getElementById('compressSelBtn');
  const bar = document.getElementById('compressBar');
  const fill = document.getElementById('compressFill');
  btn.disabled = true; btn.textContent = 'Compressing...';
  bar.style.display = 'block';
  const keys = [...selectedKeys];
  let done = 0;
  for (const key of keys) {
    fill.style.width = ((done / keys.length) * 100) + '%';
    try {
      await authFetch('/api/tedx-xinyi/media/compress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key }) });
    } catch(e) { /* continue */ }
    done++;
  }
  fill.style.width = '100%';
  showToast('Compressed ' + keys.length + ' images');
  selectedKeys.clear();
  loadMedia();
  btn.disabled = false; btn.textContent = 'Compress Selected';
  setTimeout(() => { bar.style.display = 'none'; fill.style.width = '0'; }, 2000);
}

function openUpload() { document.getElementById('uploadModal').classList.add('open'); }
function closeUpload() { document.getElementById('uploadModal').classList.remove('open'); document.getElementById('uploadPreview').innerHTML = '<span style="color:#444;font-size:0.85rem">Select a file</span>'; }

document.getElementById('uploadFile').onchange = function(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => { document.getElementById('uploadPreview').innerHTML = '<img src="' + ev.target.result + '">'; };
  r.readAsDataURL(f);
  if (!document.getElementById('uploadName').value) {
    document.getElementById('uploadName').value = f.name;
  }
};

async function doUpload() {
  const file = document.getElementById('uploadFile').files[0];
  if (!file) return showToast('Select a file first', true);
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true; btn.textContent = 'Uploading...';
  try {
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const filename = document.getElementById('uploadName').value || file.name;
    const folder = document.getElementById('uploadFolder').value;
    const alt = document.getElementById('uploadAlt').value;
    const r = await authFetch('/api/tedx-xinyi/media/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ data, filename, folder, alt }) });
    const d = await r.json();
    if (r.ok) {
      showToast('Uploaded: ' + d.filename + ' (' + d.savings + ' smaller)');
      closeUpload(); document.getElementById('uploadFile').value = ''; document.getElementById('uploadName').value = ''; document.getElementById('uploadAlt').value = '';
      loadMedia();
    } else { showToast('Error: ' + d.error, true); }
  } catch(e) { showToast(e.message, true); }
  btn.disabled = false; btn.textContent = 'Upload';
}

function showToast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (err ? 'err' : 'ok');
  setTimeout(() => { t.className = 'toast'; }, 3000);
}
</script>
</body></html>`;

// ==================== HELPER ====================

async function generateVisual(client, prompt) {
  const fetch = (await import('node-fetch')).default;
  const IMAGE_MODEL = 'gemini-2.5-flash-image';
  const url = `${client.baseUrl}/models/${IMAGE_MODEL}:generateContent?key=${client.apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.8,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const candidates = data.candidates || [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      const imageData = part.inlineData || part.inline_data;
      if (imageData && imageData.mimeType?.startsWith('image/')) {
        const rawBuffer = Buffer.from(imageData.data, 'base64');
        // Resize to max 1920px wide + compress to WebP
        try {
          const sharp = require('sharp');
          const webpBuffer = await sharp(rawBuffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
          console.log(`[TEDxXinyi] Optimized: ${(rawBuffer.length / 1024).toFixed(0)} KB → ${(webpBuffer.length / 1024).toFixed(0)} KB WebP (${((1 - webpBuffer.length / rawBuffer.length) * 100).toFixed(0)}% smaller)`);
          return webpBuffer;
        } catch {
          return rawBuffer;
        }
      }
    }
  }

  throw new Error('No image in Gemini response');
}

module.exports = router;
module.exports.router = router;
module.exports.VISUALS = VISUALS;
