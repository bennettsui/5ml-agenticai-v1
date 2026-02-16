/**
 * TEDxBoundaryStreet — Visual Generation API
 *
 * Leverages the existing GeminiImageClient (nanobanana) to generate
 * website visuals following the "The Line as Canvas" design concept.
 *
 * Endpoints:
 *   GET  /api/tedx/status       — Check Gemini availability
 *   POST /api/tedx/generate     — Generate a single visual by ID
 *   POST /api/tedx/generate-all — Generate all visuals (batch)
 *   GET  /api/tedx/visuals      — List generated visuals
 *   GET  /api/tedx/visuals/:id  — Serve a generated visual image
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createGeminiImageClient } = require('../../photo-booth/lib/geminiImageClient');

const OUTPUT_DIR = path.join(__dirname, '../../../frontend/public/tedx');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ==================== VISUAL DEFINITIONS ====================
const VISUALS = [
  {
    id: 'hero-bg',
    filename: 'hero-boundary-street.png',
    description: 'Hero background — Boundary Street low angle',
    prompt: 'Street view of Boundary Street Hong Kong, low angle looking up at buildings, monochromatic desaturated tones, misty atmospheric depth, one bold red horizontal line crossing through the middle of frame, minimalist urban photography style, cinematic wide aspect ratio, no text, no watermarks, no people',
  },
  {
    id: 'map-overlay',
    filename: 'map-1898-overlay.png',
    description: 'Historical map — 1898 boundary overlay',
    prompt: 'Vintage map of Boundary Street Hong Kong 1898 overlaid with modern city map, red boundary line highlighted, archival texture, faded sepia tones transitioning to modern grayscale, dual timeline visual, no text labels, clean graphic design',
  },
  {
    id: 'theme-city',
    filename: 'theme-city-space.png',
    description: 'Theme card — City & Space',
    prompt: 'Abstract architectural composition showing old Hong Kong tong lau buildings fading into modern glass towers, split composition, one side vintage one side futuristic, red accent line dividing them, minimal graphic style, no text, clean design',
  },
  {
    id: 'theme-language',
    filename: 'theme-language-identity.png',
    description: 'Theme card — Language & Identity',
    prompt: 'Typographic art showing Traditional Chinese characters, English letters, and linguistic elements overlapping and intersecting, bilingual identity visual, red connecting threads, clean modern layout, abstract, no readable words, artistic composition',
  },
  {
    id: 'theme-tech',
    filename: 'theme-tech-humanity.png',
    description: 'Theme card — Technology & Humanity',
    prompt: 'Human silhouette formed by circuit board patterns dissolving into organic flowing lines, technology meets humanity metaphor, red data streams, minimal tech aesthetic, dark background, no text',
  },
  {
    id: 'kai-tak-memory',
    filename: 'kai-tak-memory.png',
    description: 'Why Boundary Street — Kai Tak nostalgia',
    prompt: 'Nostalgic Hong Kong memory scene: Kai Tak airport plane taking off over Kowloon rooftops, Checkerboard Hill in distant background, evening golden hour lighting, cinematic film grain, red flight path trajectory overlay, vintage 1990s Hong Kong atmosphere, no text',
  },
  {
    id: 'dot-pattern',
    filename: 'dot-pattern-community.png',
    description: 'Background texture — community dots',
    prompt: 'Abstract dot pattern texture representing community and gathering, subtle gray dots on white background, minimal graphic design, TEDx aesthetic, data visualization inspired, seamless tileable pattern, no text',
  },
  {
    id: 'partner-icons',
    filename: 'partner-icons.png',
    description: 'Partner section — line art icons',
    prompt: 'Minimalist line icon set for event partnerships: venue building, production clapperboard, community people circle, media megaphone, four icons in a row, simple geometric line art, red accent color on white background, consistent stroke width, no text labels',
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

/**
 * GET /api/tedx/status — Check Gemini availability and list visuals
 */
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

/**
 * POST /api/tedx/generate — Generate a single visual
 * Body: { id: "hero-bg" }
 */
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
    console.log(`[TEDx] Generating visual: ${visual.id} (${visual.description})`);

    const imageBuffer = await generateVisual(client, visual.prompt);
    const outputPath = path.join(OUTPUT_DIR, visual.filename);
    fs.writeFileSync(outputPath, imageBuffer);

    console.log(`[TEDx] ✅ Saved ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);

    res.json({
      success: true,
      id: visual.id,
      filename: visual.filename,
      size: imageBuffer.length,
      path: `/tedx/${visual.filename}`,
    });
  } catch (err) {
    console.error(`[TEDx] ❌ Failed to generate ${visual.id}:`, err.message);
    res.status(500).json({ error: err.message, id: visual.id });
  }
});

/**
 * POST /api/tedx/generate-all — Generate all visuals (batch)
 * Optional body: { force: true } to regenerate existing
 */
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
      console.log(`[TEDx] Generating: ${visual.id}...`);
      const imageBuffer = await generateVisual(client, visual.prompt);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`[TEDx] ✅ ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
      results.push({ id: visual.id, status: 'generated', size: imageBuffer.length });
    } catch (err) {
      console.error(`[TEDx] ❌ ${visual.id}: ${err.message}`);
      results.push({ id: visual.id, status: 'failed', error: err.message });
    }

    // Rate limit
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

/**
 * GET /api/tedx/visuals — List all available generated visuals
 */
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
      url: exists ? `/tedx/${v.filename}` : null,
    };
  });

  res.json({ visuals });
});

/**
 * GET /api/tedx/visuals/:id — Serve a specific visual image
 */
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

/**
 * GET /api/tedx/list-models — List available Gemini models (diagnostic)
 */
router.get('/list-models', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    // Filter to image-related models
    const imageModels = (data.models || [])
      .filter((m) => m.name.includes('image') || m.name.includes('imagen'))
      .map((m) => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods,
      }));
    res.json({ imageModels, totalModels: (data.models || []).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== HELPER ====================

async function generateVisual(client, prompt) {
  // Use the Gemini REST API directly with the current image generation model
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
