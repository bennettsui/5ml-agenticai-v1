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
    filename: 'hero-home.png',
    description: 'Home hero — dark galaxy distance cinematic banner',
    prompt: 'Wide 16:9 cinematic banner, vast deep-space sky in dark navy and charcoal black, layered nebula clouds in rich indigo violet and magenta that look like long-exposure astrophotography mixed with painting not 3D cartoon, a clear smooth galaxy arc curves gracefully across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the galaxy arc let a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths suggesting AI as a vast quiet information system, foreground at very bottom centre a tiny solitary human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose arms relaxed head slightly tilted upward, soft realistic rim light from the galaxy outlining head shoulders and coat clearly against the darkness, around the upper body a few faint rising particles of light where data streams begin to touch this person, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no UI HUD graphics, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art that a 40-year-old professional would comfortably share',
  },
  {
    id: 'hero-about',
    filename: 'hero-about.png',
    description: 'About hero — creative gathering space Xinyi',
    prompt: 'Warm intimate view of a modern creative event space in Taipei, rows of minimalist chairs facing a small stage with warm amber lighting, large floor-to-ceiling windows showing Xinyi skyline at dusk, soft golden light streaming in, a few potted plants and modern furniture, the feeling of anticipation before a talk begins, cinematic photography, warm color palette with cream and amber tones, no text, no watermarks, no people, slight bokeh effect',
  },
  {
    id: 'hero-speakers',
    filename: 'hero-speakers.png',
    description: 'Speakers hero — stage atmosphere warm light',
    prompt: 'Close up of a minimalist TEDx stage from the audience perspective, warm spotlight creating a circle of golden light on a clean stage, blurred audience seats in foreground, modern venue architecture visible, Taipei city lights visible through large windows in background, warm amber and cream color palette, dramatic but optimistic lighting like a festival concert poster, no text, no watermarks, no people, cinematic depth of field',
  },
  {
    id: 'hero-sustainability',
    filename: 'hero-sustainability.png',
    description: 'Sustainability hero — 3D printed stage materials',
    prompt: 'Artistic close-up of sustainable stage materials: 3D printed geometric lamp components, recycled wood panels, and modular metal structures arranged beautifully on a workbench, warm natural daylight from a large window, workshop atmosphere, cream and warm brown tones with subtle green accents, macro photography style showing material textures, optimistic and creative mood, no text, no watermarks, no people, shallow depth of field',
  },
  {
    id: 'hero-community',
    filename: 'hero-community.png',
    description: 'Community hero — circle gathering warmth',
    prompt: 'Overhead bird-eye view of chairs arranged in a circle in a modern Taipei rooftop terrace, warm evening golden hour light, potted trees and string lights creating cozy atmosphere, Xinyi district buildings visible in soft background, some chairs have warm red and amber cushions, the feeling of community gathering and conversation, warm bright photography style, no text, no watermarks, no people, festival poster mood',
  },
  {
    id: 'salon-teaser',
    filename: 'salon-teaser.png',
    description: 'Home hero / Salon teaser — Blue Box venue cinematic',
    prompt: 'Wide 16:9 cinematic still of a theatre space reminiscent of Taipei Performing Arts Center Blue Box, clean modern architecture, high ceiling, deep blue ambient light, subtle hints of tiered seating and a stage, in the foreground silhouettes of diverse people standing or sitting facing towards a glowing central focal point symbolising AI and ideas not a literal screen of code, thin streams of light or flowing lines connecting people to the central glow suggesting shared learning and becoming, colour palette deep blue dark charcoal with accents of TED red and warm skin tones, enough negative space on one side for overlay text, no text no watermarks no logos, optimistic contemplative atmosphere',
  },
  {
    id: 'salon-hero',
    filename: 'salon-hero.png',
    description: 'Salon page main visual — full galaxy centered cinematic wide',
    prompt: 'Wide 16:9 cinematic banner, the ENTIRE galaxy is fully visible and vertically centred in frame with generous breathing room above and below, vast spiral galaxy with smooth arc curving gracefully across the centre of the image, rich indigo violet and magenta nebula clouds in a dark navy charcoal sky mixing long-exposure astrophotography with painting not 3D cartoon, softly glowing warm core at galaxy centre surrounded by many tiny sharp stars, a few very thin beams of light and sparse glowing data-like particles radiating outward from the core, deep space surrounds the galaxy on all sides so the full shape is clearly visible from edge to edge, at the very bottom centre a single tiny solitary human figure silhouette stands on a minimal dark ledge facing upward toward the galaxy occupying only 3-5% of image height, soft rim light from the galaxy outlines the figure against the darkness, palette of deep blues violets blacks and neutral whites with warm highlights at galaxy core, camera pulled back far enough to frame the complete galaxy with dark space margins, no text no watermarks no logos no UI, cinematic contrast soft bloom on galaxy subtle film-grain, mature restrained theatrical atmosphere',
  },
  {
    id: 'poster-dark',
    filename: 'poster-dark.png',
    description: 'Dark galaxy poster background — 4:5 portrait for key visual section',
    prompt: '4:5 vertical cinematic sci-fi poster background, upper 80% is a vast deep-space sky in dark navy and charcoal black with layered slightly abstract nebula clouds in rich indigo violet and magenta mixing long-exposure astrophotography with painting not 3D cartoon, a clear smooth galaxy arc curves from left to right across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the arc a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths, in the very bottom centre a tiny human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose feet near edge arms relaxed head slightly tilted up, soft realistic rim light from galaxy above so the outline of head shoulders and coat is clearly readable against the darkness, around the upper body a few faint rising particles of light, the lower 15% of image fades to near-pure black providing a clean base for text overlay, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no logos no HUD no UI, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art',
  },
  {
    id: 'salon-galaxy',
    filename: 'salon-galaxy.png',
    description: 'Galaxy networking visual — The Quest community',
    prompt: 'Square abstract galaxy made of floating islands or orbits each representing a different Intelligence domain, Design Intelligence with minimal objects like chairs posters typography, Food Intelligence with stylised table ingredients coffee, Ocean Intelligence with wave lines tiny whale dolphin icons, Music Art Intelligence with musical notes vinyl simple instrument shapes, no realistic logos but iconic shapes suggesting each domain, dark background with colourful but slightly muted orbit colours connected by thin lines with one orbit subtly highlighted in TED red, overall composition usable as a background behind text, no text no watermarks',
  },
  {
    id: 'salon-curiosity',
    filename: 'salon-curiosity.png',
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
        return Buffer.from(imageData.data, 'base64');
      }
    }
  }

  throw new Error('No image in Gemini response');
}

module.exports = router;
module.exports.router = router;
module.exports.VISUALS = VISUALS;
