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
    `SELECT ps.id, ps.slide_number, ps.section, ps.title, ps.subtitle,
            ps.layout_type, ps.content, ps.visual_prompts, ps.notes,
            COALESCE(
              json_agg(
                json_build_object(
                  'id',           sa.id,
                  'prompt_index', sa.prompt_index,
                  'prompt_used',  sa.prompt_used,
                  'mime_type',    sa.mime_type,
                  'public_url',   sa.public_url,
                  'image_url',    '/api/presentation-deck/assets/' || sa.id || '/image',
                  'generated_at', sa.generated_at
                ) ORDER BY sa.prompt_index
              ) FILTER (WHERE sa.id IS NOT NULL),
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

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        pd.id, pd.slug, pd.title, pd.title_cn, pd.client, pd.sections,
        pd.created_at, pd.updated_at,
        COUNT(DISTINCT ps.id)::int AS slide_count,
        COUNT(DISTINCT sa.id)::int AS asset_count
      FROM presentation_decks pd
      LEFT JOIN presentation_slides ps ON ps.deck_slug = pd.slug
      LEFT JOIN slide_assets sa ON sa.deck_slug = pd.slug AND sa.image_data IS NOT NULL
      GROUP BY pd.id
      ORDER BY pd.created_at DESC
    `);
    res.json({ decks: rows });
  } catch (err) {
    console.error('[presentation-deck] list error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/assets ──────────────────────────────────────
// Image library — all generated assets across all decks

router.get('/assets', async (req, res) => {
  try {
    const { deck_slug, limit = '100', offset = '0' } = req.query;

    const conditions = ['sa.image_data IS NOT NULL'];
    const params = [];
    let idx = 1;

    if (deck_slug) {
      conditions.push(`sa.deck_slug = $${idx++}`);
      params.push(deck_slug);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM slide_assets sa ${where}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT
         sa.id,
         sa.deck_slug,
         sa.slide_id,
         sa.prompt_index,
         sa.prompt_used,
         sa.mime_type,
         sa.public_url,
         sa.generated_at,
         '/api/presentation-deck/assets/' || sa.id || '/image' AS image_url,
         ps.slide_number,
         ps.section,
         ps.title AS slide_title,
         pd.title  AS deck_title,
         pd.client AS deck_client
       FROM slide_assets sa
       LEFT JOIN presentation_slides ps ON ps.id = sa.slide_id
       LEFT JOIN presentation_decks  pd ON pd.slug = sa.deck_slug
       ${where}
       ORDER BY sa.generated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    res.json({
      total: countRows[0].total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      assets: rows,
    });
  } catch (err) {
    console.error('[presentation-deck] assets list error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/assets/:id/image ────────────────────────────
// Serve the actual image binary from Postgres

router.get('/assets/:id/image', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT image_data, mime_type FROM slide_assets WHERE id = $1',
      [parseInt(req.params.id, 10)]
    );
    if (!rows.length || !rows[0].image_data) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const { image_data, mime_type } = rows[0];
    const buf = Buffer.from(image_data, 'base64');
    res.set({
      'Content-Type': mime_type || 'image/png',
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.send(buf);
  } catch (err) {
    console.error('[presentation-deck] image serve error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/assets/:id ──────────────────────────────────
// Single asset metadata (no binary)

router.get('/assets/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sa.id, sa.deck_slug, sa.slide_id, sa.prompt_index, sa.prompt_used,
              sa.mime_type, sa.public_url, sa.generated_at,
              '/api/presentation-deck/assets/' || sa.id || '/image' AS image_url,
              ps.slide_number, ps.section, ps.title AS slide_title
       FROM slide_assets sa
       LEFT JOIN presentation_slides ps ON ps.id = sa.slide_id
       WHERE sa.id = $1`,
      [parseInt(req.params.id, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[presentation-deck] asset meta error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/presentation-deck/assets/:id ───────────────────────────────

router.delete('/assets/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM slide_assets WHERE id = $1',
      [parseInt(req.params.id, 10)]
    );
    if (!rowCount) return res.status(404).json({ error: 'Asset not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[presentation-deck] asset delete error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug ───────────────────────────────────────

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

router.get('/:slug/slides/:num', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',          sa.id,
                    'prompt_index',sa.prompt_index,
                    'mime_type',   sa.mime_type,
                    'image_url',   '/api/presentation-deck/assets/' || sa.id || '/image',
                    'generated_at',sa.generated_at
                  ) ORDER BY sa.prompt_index
                ) FILTER (WHERE sa.id IS NOT NULL),
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

router.post('/seed', async (req, res) => {
  const { presentation } = req.body || {};
  if (!presentation || !presentation.slug) {
    return res.status(400).json({ error: 'presentation.slug is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO presentation_decks (slug, title, title_cn, client, sections, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title      = EXCLUDED.title,
         title_cn   = EXCLUDED.title_cn,
         client     = EXCLUDED.client,
         sections   = EXCLUDED.sections,
         updated_at = NOW()`,
      [
        presentation.slug,
        presentation.title,
        presentation.title_cn || null,
        presentation.client || null,
        JSON.stringify(presentation.sections || []),
      ]
    );

    let inserted = 0;
    for (const slide of (presentation.slides || [])) {
      await client.query(
        `INSERT INTO presentation_slides
           (deck_slug, slide_number, section, title, subtitle, layout_type, content, visual_prompts, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (deck_slug, slide_number) DO UPDATE SET
           section        = EXCLUDED.section,
           title          = EXCLUDED.title,
           subtitle       = EXCLUDED.subtitle,
           layout_type    = EXCLUDED.layout_type,
           content        = EXCLUDED.content,
           visual_prompts = EXCLUDED.visual_prompts,
           notes          = EXCLUDED.notes`,
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

router.post('/:slug/slides/:num/generate-asset', async (req, res) => {
  const { slug, num } = req.params;
  const { prompt_index } = req.body || {};

  try {
    const { rows } = await pool.query(
      'SELECT * FROM presentation_slides WHERE deck_slug = $1 AND slide_number = $2',
      [slug, parseInt(num, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide not found' });
    const slide = rows[0];
    const prompts = slide.visual_prompts || [];

    const indices =
      typeof prompt_index === 'number' ? [prompt_index] : prompts.map((_, i) => i);

    const results = [];
    for (const idx of indices) {
      const promptText = prompts[idx];
      if (!promptText) continue;

      const imageData = await generateImageWithGemini(promptText);
      if (!imageData) {
        results.push({ prompt_index: idx, ok: false, error: 'No image returned' });
        continue;
      }

      const { rows: assetRows } = await pool.query(
        `INSERT INTO slide_assets
           (slide_id, deck_slug, asset_type, prompt_index, prompt_used, image_data, mime_type, public_url, metadata)
         VALUES ($1, $2, 'image', $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          slide.id,
          slug,
          idx,
          promptText,
          imageData.base64,
          imageData.mimeType,
          null,
          JSON.stringify({ prompt: promptText }),
        ]
      );
      const assetId = assetRows[0]?.id;
      results.push({
        prompt_index: idx,
        ok: true,
        asset_id: assetId,
        image_url: `/api/presentation-deck/assets/${assetId}/image`,
      });
    }

    res.json({ ok: true, slide_id: slide.id, results });
  } catch (err) {
    console.error('[presentation-deck] generate-asset error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/:slug/generate-all-assets ──────────────────

router.post('/:slug/generate-all-assets', async (req, res) => {
  const { slug } = req.params;
  try {
    const deck = await getDeck(slug);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const { rows: slides } = await pool.query(
      'SELECT id, slide_number, visual_prompts FROM presentation_slides WHERE deck_slug = $1 ORDER BY slide_number',
      [slug]
    );

    res.json({ ok: true, message: 'Asset generation started', slide_count: slides.length });

    // Background processing
    (async () => {
      for (const slide of slides) {
        const prompts = slide.visual_prompts || [];
        for (let idx = 0; idx < prompts.length; idx++) {
          try {
            const imageData = await generateImageWithGemini(prompts[idx]);
            if (imageData) {
              await pool.query(
                `INSERT INTO slide_assets
                   (slide_id, deck_slug, asset_type, prompt_index, prompt_used, image_data, mime_type, metadata)
                 VALUES ($1, $2, 'image', $3, $4, $5, $6, $7)`,
                [
                  slide.id,
                  slug,
                  idx,
                  prompts[idx],
                  imageData.base64,
                  imageData.mimeType,
                  JSON.stringify({ prompt: prompts[idx] }),
                ]
              );
            }
          } catch (e) {
            console.error(`[presentation-deck] gen failed slide ${slide.slide_number} prompt ${idx}:`, e.message);
          }
        }
      }
      console.log(`[presentation-deck] ✅ Asset generation complete: ${slug}`);
    })();
  } catch (err) {
    console.error('[presentation-deck] generate-all-assets error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug/generation-status ─────────────────────
// Returns progress of asset generation: total visual_prompts vs generated assets

router.get('/:slug/generation-status', async (req, res) => {
  try {
    // Count total visual prompts across all slides
    const { rows: promptRows } = await pool.query(
      `SELECT COALESCE(SUM(jsonb_array_length(visual_prompts)), 0)::int AS total_prompts
       FROM presentation_slides WHERE deck_slug = $1`,
      [req.params.slug]
    );
    // Count generated assets (those with image_data)
    const { rows: assetRows } = await pool.query(
      `SELECT COUNT(*)::int AS generated
       FROM slide_assets
       WHERE deck_slug = $1 AND image_data IS NOT NULL`,
      [req.params.slug]
    );

    const total = promptRows[0]?.total_prompts ?? 0;
    const generated = assetRows[0]?.generated ?? 0;

    res.json({
      slug: req.params.slug,
      total_prompts: total,
      generated,
      pending: Math.max(0, total - generated),
      percent: total > 0 ? Math.round((generated / total) * 100) : 0,
      complete: total > 0 && generated >= total,
    });
  } catch (err) {
    console.error('[presentation-deck] generation-status error', err.message);
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

// ─── POST /api/presentation-deck/:slug/build-manifest ───────────────────────
// Reads all slides → writes image_manifests rows (status=pending). Idempotent.

router.post('/:slug/build-manifest', async (req, res) => {
  const { slug } = req.params;
  try {
    const deck = await getDeck(slug);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const { rows: slides } = await pool.query(
      `SELECT id, slide_number, section, title, layout_type, visual_prompts
       FROM presentation_slides WHERE deck_slug = $1 ORDER BY slide_number`,
      [slug]
    );

    let inserted = 0;
    let skipped = 0;

    for (const slide of slides) {
      const prompts = slide.visual_prompts || [];
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const usage = inferManifestUsage(slide.layout_type, i);

        // Idempotent: skip if exact same original_prompt already exists for this slide+index
        const { rows: existing } = await pool.query(
          `SELECT id FROM image_manifests
           WHERE slide_id = $1 AND original_prompt = $2`,
          [slide.id, prompt]
        );
        if (existing.length) { skipped++; continue; }

        await pool.query(
          `INSERT INTO image_manifests
             (presentation_slug, slide_id, slide_number, section, slide_title,
              usage, layout_type, original_prompt, status, priority)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9)`,
          [
            slug, slide.id, slide.slide_number, slide.section, slide.title,
            usage, slide.layout_type, prompt,
            usage === 'background-hero' || usage === 'section-hero' ? 'high' : 'normal',
          ]
        );
        inserted++;
      }
    }

    res.json({ ok: true, inserted, skipped, total: inserted + skipped });
  } catch (err) {
    console.error('[presentation-deck] build-manifest error', err.message);
    res.status(500).json({ error: err.message });
  }
});

function inferManifestUsage(layout, idx) {
  if (layout === 'cover' && idx === 0) return 'background-hero';
  if (layout === 'section-divider' && idx === 0) return 'section-hero';
  if (layout === 'visual-heavy') return idx === 0 ? 'main-visual' : 'secondary-visual';
  if (layout === 'timeline') return 'content-figure';
  return 'content-figure';
}

// ─── GET /api/presentation-deck/:slug/images ─────────────────────────────────
// List manifest items, optionally filtered by status / section

router.get('/:slug/images', async (req, res) => {
  const { slug } = req.params;
  const { status, section, priority, limit = '200', offset = '0' } = req.query;

  try {
    const conditions = ['im.presentation_slug = $1'];
    const params = [slug];
    let idx = 2;

    if (status && status !== 'all') {
      conditions.push(`im.status = $${idx++}`);
      params.push(status);
    }
    if (section) {
      conditions.push(`im.section = $${idx++}`);
      params.push(section);
    }
    if (priority) {
      conditions.push(`im.priority = $${idx++}`);
      params.push(priority);
    }

    const where = conditions.join(' AND ');

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM image_manifests im WHERE ${where}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT
         im.id, im.slide_number, im.section, im.slide_title, im.usage,
         im.layout_type, im.original_prompt, im.override_prompt,
         im.status, im.priority, im.notes, im.asset_id,
         im.created_at, im.updated_at,
         CASE WHEN im.asset_id IS NOT NULL
           THEN '/api/presentation-deck/assets/' || im.asset_id || '/image'
           ELSE NULL
         END AS image_url
       FROM image_manifests im
       WHERE ${where}
       ORDER BY im.slide_number ASC, im.usage ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    // Summary counts
    const { rows: summaryRows } = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM image_manifests WHERE presentation_slug = $1
       GROUP BY status`,
      [slug]
    );
    const summary = summaryRows.reduce((acc, r) => { acc[r.status] = r.count; return acc; }, {});

    res.json({
      presentation_slug: slug,
      total: countRows[0].total,
      summary,
      images: rows,
    });
  } catch (err) {
    console.error('[presentation-deck] images list error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/presentation-deck/images/:id ────────────────────────────────
// Update a manifest item: status, override_prompt, priority, notes

router.patch('/images/:id', async (req, res) => {
  const { id } = req.params;
  const { status, override_prompt, priority, notes } = req.body || {};

  const allowed = ['pending', 'approved', 'skip', 'generated'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const updates = [];
    const params = [];
    let idx = 1;

    if (status !== undefined) { updates.push(`status = $${idx++}`); params.push(status); }
    if (override_prompt !== undefined) { updates.push(`override_prompt = $${idx++}`); params.push(override_prompt || null); }
    if (priority !== undefined) { updates.push(`priority = $${idx++}`); params.push(priority); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE image_manifests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Manifest item not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[presentation-deck] manifest patch error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/:slug/generate-approved ─────────────────────
// Generates images only for manifest items with status='approved'

router.post('/:slug/generate-approved', async (req, res) => {
  const { slug } = req.params;
  try {
    const deck = await getDeck(slug);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const { rows: items } = await pool.query(
      `SELECT im.*, ps.deck_slug
       FROM image_manifests im
       JOIN presentation_slides ps ON ps.id = im.slide_id
       WHERE im.presentation_slug = $1 AND im.status = 'approved'
       ORDER BY im.priority DESC, im.slide_number ASC`,
      [slug]
    );

    res.json({ ok: true, queued: items.length, message: `Generating ${items.length} approved images` });

    (async () => {
      for (const item of items) {
        try {
          const prompt = item.override_prompt || item.original_prompt;
          const imageData = await generateImageWithGemini(prompt);
          if (!imageData) continue;

          const { rows: assetRows } = await pool.query(
            `INSERT INTO slide_assets
               (slide_id, deck_slug, asset_type, prompt_used, image_data, mime_type, metadata)
             VALUES ($1,$2,'image',$3,$4,$5,$6)
             RETURNING id`,
            [
              item.slide_id, slug, prompt,
              imageData.base64, imageData.mimeType,
              JSON.stringify({ usage: item.usage, manifest_id: item.id }),
            ]
          );
          const assetId = assetRows[0]?.id;

          await pool.query(
            `UPDATE image_manifests
             SET status = 'generated', asset_id = $1, updated_at = NOW()
             WHERE id = $2`,
            [assetId, item.id]
          );
        } catch (e) {
          console.error(`[presentation-deck] generate-approved failed item ${item.id}:`, e.message);
        }
      }
      console.log(`[presentation-deck] ✅ generate-approved complete: ${slug}`);
    })();
  } catch (err) {
    console.error('[presentation-deck] generate-approved error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug/manifest-status ───────────────────────
// Quick summary of manifest state for UI polling

router.get('/:slug/manifest-status', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM image_manifests WHERE presentation_slug = $1
       GROUP BY status`,
      [req.params.slug]
    );
    const summary = rows.reduce((acc, r) => { acc[r.status] = r.count; return acc; }, {});
    const total = Object.values(summary).reduce((s, v) => s + v, 0);
    const generated = summary.generated || 0;
    res.json({
      slug: req.params.slug,
      total,
      summary,
      percent: total > 0 ? Math.round((generated / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gemini image generation (nanobanana) ───────────────────────────────────

async function generateImageWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn('[presentation-deck] No Gemini API key — skipping image generation');
    return null;
  }

  const model = 'gemini-2.0-flash-preview-image-generation';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) return null;

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  };
}

module.exports = router;
