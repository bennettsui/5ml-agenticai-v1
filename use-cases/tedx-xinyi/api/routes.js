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
    description: 'Home hero — Xinyi district golden hour festival',
    prompt: 'Wide panoramic view of Taipei Xinyi district at golden hour sunset, warm amber and coral light washing over modern skyscrapers and tree-lined boulevards, slightly abstract and painterly style like a bold festival poster, lens flare, optimistic and energetic atmosphere, soft focus on background with sharp geometric building silhouettes, TED red accent streak across the sky, no text, no watermarks, no people, 16:9 aspect ratio, high contrast warm tones',
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
];

// Lazy init Gemini client
let geminiClient = null;
function getClient() {
  if (!geminiClient && GEMINI_API_KEY) {
    geminiClient = createGeminiImageClient(GEMINI_API_KEY);
  }
  return geminiClient;
}

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

  const force = req.body?.force === true;
  const results = [];

  for (const visual of VISUALS) {
    const outputPath = path.join(OUTPUT_DIR, visual.filename);
    const exists = fs.existsSync(outputPath);

    if (exists && !force) {
      results.push({ id: visual.id, status: 'skipped', reason: 'already exists' });
      continue;
    }

    try {
      console.log(`[TEDxXinyi] Generating: ${visual.id}...`);
      const imageBuffer = await generateVisual(client, visual.prompt);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`[TEDxXinyi] ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
      results.push({ id: visual.id, status: 'generated', size: imageBuffer.length });
    } catch (err) {
      console.error(`[TEDxXinyi] ${visual.id}: ${err.message}`);
      results.push({ id: visual.id, status: 'failed', error: err.message });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  const generated = results.filter((r) => r.status === 'generated').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  res.json({
    summary: { generated, failed, skipped, total: VISUALS.length },
    results,
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
