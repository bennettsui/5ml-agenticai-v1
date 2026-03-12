'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../../../db');

// ─── helpers ────────────────────────────────────────────────────────────────

async function getDeck(slug) {
  const { rows } = await pool.query(
    'SELECT * FROM presentation_decks WHERE slug = $1',
    [slug]
  );
  return rows[0] || null;
}

async function getSlides(slug) {
  const { rows } = await pool.query(
    `SELECT ps.*, COALESCE(
       json_agg(sa ORDER BY sa.prompt_index) FILTER (WHERE sa.id IS NOT NULL),
       '[]'
     ) AS assets
     FROM presentation_slides ps
     LEFT JOIN slide_assets sa ON sa.slide_id = ps.id
     WHERE ps.deck_slug = $1
     GROUP BY ps.id
     ORDER BY ps.slide_number`,
    [slug]
  );
  return rows;
}

// ─── GET /api/presentation-deck ─────────────────────────────────────────────
// List all decks

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, slug, title, title_cn, client, sections, created_at, updated_at FROM presentation_decks ORDER BY created_at DESC'
    );
    res.json({ decks: rows });
  } catch (err) {
    console.error('[presentation-deck] list error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug ───────────────────────────────────────
// Full deck + slides + assets

router.get('/:slug', async (req, res) => {
  try {
    const deck = await getDeck(req.params.slug);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    const slides = await getSlides(req.params.slug);
    res.json({ ...deck, slides });
  } catch (err) {
    console.error('[presentation-deck] get error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug/slides/:num ───────────────────────────
// Single slide + its assets

router.get('/:slug/slides/:num', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.*, COALESCE(
         json_agg(sa ORDER BY sa.prompt_index) FILTER (WHERE sa.id IS NOT NULL),
         '[]'
       ) AS assets
       FROM presentation_slides ps
       LEFT JOIN slide_assets sa ON sa.slide_id = ps.id
       WHERE ps.deck_slug = $1 AND ps.slide_number = $2
       GROUP BY ps.id`,
      [req.params.slug, parseInt(req.params.num, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[presentation-deck] slide get error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/seed ───────────────────────────────────────
// Upsert a full deck JSON (from the master prompt output)
// Body: { presentation: { slug, title, title_cn, client, sections, slides[] } }

router.post('/seed', async (req, res) => {
  const { presentation } = req.body || {};
  if (!presentation || !presentation.slug) {
    return res.status(400).json({ error: 'presentation.slug is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert deck
    await client.query(
      `INSERT INTO presentation_decks (slug, title, title_cn, client, sections, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         title_cn = EXCLUDED.title_cn,
         client = EXCLUDED.client,
         sections = EXCLUDED.sections,
         updated_at = NOW()`,
      [
        presentation.slug,
        presentation.title,
        presentation.title_cn || null,
        presentation.client || null,
        JSON.stringify(presentation.sections || []),
      ]
    );

    // Upsert slides
    let inserted = 0;
    for (const slide of (presentation.slides || [])) {
      const { rows } = await client.query(
        `INSERT INTO presentation_slides
           (deck_slug, slide_number, section, title, subtitle, layout_type, content, visual_prompts, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (deck_slug, slide_number) DO UPDATE SET
           section       = EXCLUDED.section,
           title         = EXCLUDED.title,
           subtitle      = EXCLUDED.subtitle,
           layout_type   = EXCLUDED.layout_type,
           content       = EXCLUDED.content,
           visual_prompts = EXCLUDED.visual_prompts,
           notes         = EXCLUDED.notes
         RETURNING id`,
        [
          presentation.slug,
          slide.slide_number,
          slide.section || null,
          slide.title || null,
          slide.subtitle || null,
          slide.layout_type || null,
          JSON.stringify(slide.content || {}),
          JSON.stringify(slide.visual_prompts || []),
          slide.notes || null,
        ]
      );
      inserted++;
    }

    await client.query('COMMIT');
    res.json({ ok: true, slug: presentation.slug, slides_upserted: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[presentation-deck] seed error', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── POST /api/presentation-deck/:slug/slides/:num/generate-asset ────────────
// Generate image(s) for a slide's visual_prompts using Gemini (nanobanana)
// Body: { prompt_index?: number }  — omit to generate all prompts for the slide

router.post('/:slug/slides/:num/generate-asset', async (req, res) => {
  const { slug, num } = req.params;
  const { prompt_index } = req.body || {};

  try {
    // Fetch slide
    const { rows } = await pool.query(
      'SELECT * FROM presentation_slides WHERE deck_slug = $1 AND slide_number = $2',
      [slug, parseInt(num, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide not found' });
    const slide = rows[0];
    const prompts = slide.visual_prompts || [];

    const indices =
      typeof prompt_index === 'number'
        ? [prompt_index]
        : prompts.map((_, i) => i);

    const results = [];

    for (const idx of indices) {
      const promptText = prompts[idx];
      if (!promptText) continue;

      // Call Gemini image generation (nanobanana)
      const imageData = await generateImageWithGemini(promptText);

      if (!imageData) {
        results.push({ prompt_index: idx, ok: false, error: 'No image returned' });
        continue;
      }

      // Save asset record (file_path points to saved file, or null if using base64 in metadata)
      const { rows: assetRows } = await pool.query(
        `INSERT INTO slide_assets (slide_id, asset_type, prompt_index, prompt_used, file_path, public_url, metadata)
         VALUES ($1, 'image', $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          slide.id,
          idx,
          promptText,
          imageData.file_path || null,
          imageData.public_url || null,
          JSON.stringify(imageData.metadata || {}),
        ]
      );
      results.push({ prompt_index: idx, ok: true, asset_id: assetRows[0]?.id });
    }

    res.json({ ok: true, slide_id: slide.id, results });
  } catch (err) {
    console.error('[presentation-deck] generate-asset error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/:slug/generate-all-assets ──────────────────
// Kick off image generation for every visual_prompt in every slide (async)

router.post('/:slug/generate-all-assets', async (req, res) => {
  const { slug } = req.params;
  try {
    const deck = await getDeck(slug);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const slides = await pool.query(
      'SELECT id, slide_number, visual_prompts FROM presentation_slides WHERE deck_slug = $1 ORDER BY slide_number',
      [slug]
    );

    // Return immediately; process in background
    res.json({ ok: true, message: 'Asset generation started', slide_count: slides.rows.length });

    // Background processing
    (async () => {
      for (const slide of slides.rows) {
        const prompts = slide.visual_prompts || [];
        for (let idx = 0; idx < prompts.length; idx++) {
          try {
            const imageData = await generateImageWithGemini(prompts[idx]);
            if (imageData) {
              await pool.query(
                `INSERT INTO slide_assets (slide_id, asset_type, prompt_index, prompt_used, file_path, public_url, metadata)
                 VALUES ($1, 'image', $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [
                  slide.id,
                  idx,
                  prompts[idx],
                  imageData.file_path || null,
                  imageData.public_url || null,
                  JSON.stringify(imageData.metadata || {}),
                ]
              );
            }
          } catch (e) {
            console.error(`[presentation-deck] asset gen failed slide ${slide.slide_number} prompt ${idx}:`, e.message);
          }
        }
      }
      console.log(`[presentation-deck] ✅ Asset generation complete for deck: ${slug}`);
    })();
  } catch (err) {
    console.error('[presentation-deck] generate-all-assets error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/presentation-deck/:slug ────────────────────────────────────

router.delete('/:slug', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM presentation_decks WHERE slug = $1',
      [req.params.slug]
    );
    if (!rowCount) return res.status(404).json({ error: 'Deck not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[presentation-deck] delete error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Gemini image generation helper (nanobanana) ─────────────────────────────

async function generateImageWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn('[presentation-deck] No Gemini API key — skipping image generation');
    return null;
  }

  const model = 'gemini-2.0-flash-preview-image-generation';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);

  if (!imagePart) return null;

  const { mimeType, data: base64 } = imagePart.inlineData;

  // Return base64 data in metadata; callers can persist to object storage if needed
  return {
    file_path: null,
    public_url: null,
    metadata: { mimeType, base64, prompt },
  };
}

module.exports = router;
