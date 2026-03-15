'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../../../db');

// ─── Startup schema guard ────────────────────────────────────────────────────
// Runs once when module loads; ensures all required columns exist even if
// the main initDatabase() SQL block failed partway through.
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS presentation_decks (
        id         SERIAL PRIMARY KEY,
        slug       VARCHAR(100) UNIQUE NOT NULL,
        title      TEXT NOT NULL,
        title_cn   TEXT,
        client     TEXT,
        sections   JSONB NOT NULL DEFAULT '[]',
        metadata   JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS presentation_slides (
        id           SERIAL PRIMARY KEY,
        deck_slug    VARCHAR(100) NOT NULL REFERENCES presentation_decks(slug) ON DELETE CASCADE,
        slide_number INTEGER NOT NULL,
        section      VARCHAR(50),
        title        TEXT,
        subtitle     TEXT,
        layout_type  VARCHAR(50),
        content      JSONB NOT NULL DEFAULT '{}',
        visual_prompts JSONB NOT NULL DEFAULT '[]',
        notes        TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (deck_slug, slide_number)
      );
      CREATE TABLE IF NOT EXISTS slide_assets (
        id           SERIAL PRIMARY KEY,
        slide_id     INTEGER REFERENCES presentation_slides(id) ON DELETE CASCADE,
        deck_slug    VARCHAR(100),
        asset_type   VARCHAR(50) DEFAULT 'image',
        prompt_index INTEGER,
        prompt_used  TEXT,
        image_data   TEXT,
        mime_type    VARCHAR(50) DEFAULT 'image/png',
        file_path    TEXT,
        public_url   TEXT,
        metadata     JSONB NOT NULL DEFAULT '{}',
        generated_at TIMESTAMPTZ DEFAULT NOW()
      );
      -- safe column migrations for older deployments
      ALTER TABLE slide_assets ADD COLUMN IF NOT EXISTS image_data   TEXT;
      ALTER TABLE slide_assets ADD COLUMN IF NOT EXISTS mime_type    VARCHAR(50) DEFAULT 'image/png';
      ALTER TABLE slide_assets ADD COLUMN IF NOT EXISTS deck_slug    VARCHAR(100);
      ALTER TABLE slide_assets ADD COLUMN IF NOT EXISTS prompt_index INTEGER;
      ALTER TABLE slide_assets ADD COLUMN IF NOT EXISTS prompt_used  TEXT;

      -- image manifest tables (needed for build-manifest / generate-approved)
      CREATE TABLE IF NOT EXISTS presentation_settings (
        presentation_slug VARCHAR(100) PRIMARY KEY REFERENCES presentation_decks(slug) ON DELETE CASCADE,
        theme             TEXT DEFAULT 'dark',
        font_primary      TEXT DEFAULT 'Inter',
        font_secondary    TEXT DEFAULT 'Crimson Pro',
        color_primary     TEXT DEFAULT '#ef4444',
        color_secondary   TEXT DEFAULT '#1e293b',
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS image_manifests (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        presentation_slug VARCHAR(100) NOT NULL REFERENCES presentation_decks(slug) ON DELETE CASCADE,
        slide_id          INTEGER REFERENCES presentation_slides(id) ON DELETE CASCADE,
        slide_number      INTEGER NOT NULL,
        section           TEXT,
        slide_title       TEXT,
        usage             TEXT,
        layout_type       TEXT,
        original_prompt   TEXT NOT NULL,
        override_prompt   TEXT,
        status            TEXT NOT NULL DEFAULT 'pending',
        priority          TEXT NOT NULL DEFAULT 'normal',
        notes             TEXT,
        asset_id          INTEGER REFERENCES slide_assets(id) ON DELETE SET NULL,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_image_manifest_slug   ON image_manifests(presentation_slug);
      CREATE INDEX IF NOT EXISTS idx_image_manifest_status ON image_manifests(status);
      CREATE INDEX IF NOT EXISTS idx_image_manifest_slide  ON image_manifests(slide_id);

      -- slide content overrides (AI + user edits applied on the web)
      CREATE TABLE IF NOT EXISTS slide_content_overrides (
        id           SERIAL PRIMARY KEY,
        deck_slug    VARCHAR(100) NOT NULL,
        slide_number INTEGER NOT NULL,
        title        TEXT,
        subtitle     TEXT,
        content      JSONB NOT NULL DEFAULT '{}',
        notes        TEXT,
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(deck_slug, slide_number)
      );

      -- full version history for every slide change
      CREATE TABLE IF NOT EXISTS slide_version_history (
        id             SERIAL PRIMARY KEY,
        deck_slug      VARCHAR(100) NOT NULL,
        slide_number   INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        title          TEXT,
        subtitle       TEXT,
        content        JSONB NOT NULL DEFAULT '{}',
        notes          TEXT,
        change_summary TEXT,
        changed_by     VARCHAR(20) DEFAULT 'ai',
        ai_comment     TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_slide_version_slug_num ON slide_version_history(deck_slug, slide_number);

      -- chat conversation history per slide
      CREATE TABLE IF NOT EXISTS slide_chat_messages (
        id           SERIAL PRIMARY KEY,
        deck_slug    VARCHAR(100) NOT NULL,
        slide_number INTEGER NOT NULL,
        role         VARCHAR(20) NOT NULL,
        content      TEXT NOT NULL,
        model        VARCHAR(50),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_slide_chat ON slide_chat_messages(deck_slug, slide_number, created_at);
    `);
    console.log('✅ [presentation-deck] schema guard OK');
  } catch (e) {
    console.warn('⚠️ [presentation-deck] schema guard error:', e.message);
  }
})();

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
        (SELECT COUNT(*)::int FROM presentation_slides WHERE deck_slug = pd.slug) AS slide_count,
        (SELECT COUNT(*)::int FROM slide_assets WHERE deck_slug = pd.slug) AS asset_count
      FROM presentation_decks pd
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
          // Reset to 'pending' so the progress bar doesn't block forever and user can retry
          await pool.query(
            `UPDATE image_manifests SET status = 'pending', updated_at = NOW() WHERE id = $1`,
            [item.id]
          ).catch(() => {});
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

// ─── GET /api/presentation-deck/:slug/slide-overrides ────────────────────────
// Returns all content overrides indexed by slide_number

router.get('/:slug/slide-overrides', async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT slide_number, title, subtitle, content, notes, updated_at
       FROM slide_content_overrides WHERE deck_slug = $1 ORDER BY slide_number`,
      [slug]
    );
    const overrides = {};
    for (const row of rows) overrides[row.slide_number] = row;
    res.json({ overrides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/:slug/slides/:slideNum/ai-review ────────────
// DeepSeek AI review with suggested content improvements

router.post('/:slug/slides/:slideNum/ai-review', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  const { slide, userComment, chatHistory = [] } = req.body;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'DEEPSEEK_API_KEY not configured' });

  try {
    const axios = require('axios');
    const MODEL = 'deepseek-chat';

    const systemContent = `You are a senior presentation consultant reviewing slides for a CLP Power Hong Kong tender proposal by 5 Miles Lab.

Always respond with ONLY valid JSON (no markdown fences) matching this schema exactly:
{
  "overall": "2–3 sentence overall assessment",
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["improvement 1", "improvement 2"],
  "change_summary": "one-line summary of what changed",
  "updated_content": { /* improved content using the EXACT SAME JSON keys as the current content */ }
}

Slide context for this session:
- Slide ${slideNumber} of ${slide.total || '?'} · Section: "${slide.section}" · Layout: "${slide.layout_type}"
- Title: ${slide.title || '(none)'}
- Subtitle: ${slide.subtitle || '(none)'}
- Presenter notes: ${slide.notes || '(none)'}

Current content:
${JSON.stringify(slide.content, null, 2)}`;

    // Build conversation: system + prior turns (max 4, with updated_content stripped from AI messages)
    const messages = [{ role: 'system', content: systemContent }];
    for (const msg of chatHistory.slice(-4)) {
      if (msg.role === 'assistant') {
        // Strip updated_content from AI history to avoid token overflow
        let content = msg.content;
        try {
          const parsed = JSON.parse(msg.content);
          content = `Previous analysis:\nOverall: ${parsed.overall || ''}\nSuggestions: ${(parsed.suggestions || []).join('; ')}\nChange: ${parsed.change_summary || ''}`;
        } catch { /* not JSON, use as-is */ }
        messages.push({ role: 'assistant', content });
      } else {
        messages.push({ role: 'user', content: msg.content });
      }
    }
    messages.push({ role: 'user', content: userComment || 'Please analyse this slide and suggest improvements.' });

    const estTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
    console.log(`[ai-review] slide=${slideNumber} turns=${chatHistory.length} est_tokens≈${estTokens}`);

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      { model: MODEL, messages, max_tokens: 3000, temperature: 0.7 },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    const raw = response.data.choices[0]?.message?.content || '';
    const usage = response.data.usage || {};
    console.log(`[ai-review] success slide=${slideNumber} tokens=${JSON.stringify(usage)}`);
    let review;
    try {
      review = JSON.parse(raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim());
    } catch {
      review = { overall: raw, issues: [], suggestions: [], change_summary: 'AI review', updated_content: slide.content };
    }
    res.json({ review, model: response.data.model || MODEL, usage });
  } catch (err) {
    // Expose DeepSeek's actual error body (rate limit, invalid key, etc.)
    const deepseekErr = err.response?.data?.error;
    const detail = deepseekErr
      ? `DeepSeek ${err.response.status}: ${deepseekErr.message || JSON.stringify(deepseekErr)}`
      : err.message;
    console.error('[presentation-deck] ai-review error', detail, err.response?.status);
    res.status(500).json({
      error: detail,
      status: err.response?.status,
      usage_hint: err.response?.status === 429 ? 'Rate limit hit — wait a moment and retry' : null,
    });
  }
});

// ─── GET /api/presentation-deck/:slug/slides/:slideNum/chat ──────────────────
router.get('/:slug/slides/:slideNum/chat', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  try {
    const { rows } = await pool.query(
      `SELECT id, role, content, model, created_at
       FROM slide_chat_messages
       WHERE deck_slug=$1 AND slide_number=$2
       ORDER BY created_at ASC LIMIT 40`,
      [slug, slideNumber]
    );
    res.json({ messages: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/presentation-deck/:slug/slides/:slideNum/chat/messages ────────
router.post('/:slug/slides/:slideNum/chat/messages', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  const { messages } = req.body;
  try {
    for (const msg of (messages || [])) {
      await pool.query(
        `INSERT INTO slide_chat_messages (deck_slug, slide_number, role, content, model) VALUES ($1,$2,$3,$4,$5)`,
        [slug, slideNumber, msg.role, msg.content, msg.model || null]
      );
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/presentation-deck/:slug/slides/:slideNum/chat ───────────────
router.delete('/:slug/slides/:slideNum/chat', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  try {
    await pool.query(`DELETE FROM slide_chat_messages WHERE deck_slug=$1 AND slide_number=$2`, [slug, slideNumber]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/presentation-deck/:slug/slides/:slideNum/content ────────────────
// Save slide content override + create version history entry

router.put('/:slug/slides/:slideNum/content', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  const { title, subtitle, content, notes, change_summary = 'Edit', changed_by = 'ai', ai_comment } = req.body;
  try {
    const { rows: vRows } = await pool.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_v
       FROM slide_version_history WHERE deck_slug=$1 AND slide_number=$2`,
      [slug, slideNumber]
    );
    const nextV = vRows[0].next_v;

    await pool.query(
      `INSERT INTO slide_version_history
         (deck_slug, slide_number, version_number, title, subtitle, content, notes, change_summary, changed_by, ai_comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [slug, slideNumber, nextV, title, subtitle, JSON.stringify(content), notes, change_summary, changed_by, ai_comment || null]
    );

    const { rows } = await pool.query(
      `INSERT INTO slide_content_overrides (deck_slug, slide_number, title, subtitle, content, notes, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (deck_slug, slide_number)
       DO UPDATE SET title=$3, subtitle=$4, content=$5, notes=$6, updated_at=NOW()
       RETURNING *`,
      [slug, slideNumber, title, subtitle, JSON.stringify(content), notes]
    );
    res.json({ ok: true, override: rows[0], version: nextV });
  } catch (err) {
    console.error('[presentation-deck] slide content save error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/presentation-deck/:slug/slides/:slideNum/history ────────────────
// Version history for a slide (newest first)

router.get('/:slug/slides/:slideNum/history', async (req, res) => {
  const { slug, slideNum } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  try {
    const { rows } = await pool.query(
      `SELECT id, version_number, title, subtitle, content, notes,
              change_summary, changed_by, ai_comment, created_at
       FROM slide_version_history
       WHERE deck_slug=$1 AND slide_number=$2
       ORDER BY version_number DESC LIMIT 20`,
      [slug, slideNumber]
    );
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/presentation-deck/:slug/slides/:slideNum/restore/:versionId ───
// Restore a slide to a specific version

router.post('/:slug/slides/:slideNum/restore/:versionId', async (req, res) => {
  const { slug, slideNum, versionId } = req.params;
  const slideNumber = parseInt(slideNum, 10);
  try {
    const { rows: vRows } = await pool.query(
      `SELECT * FROM slide_version_history WHERE id=$1 AND deck_slug=$2 AND slide_number=$3`,
      [parseInt(versionId, 10), slug, slideNumber]
    );
    if (!vRows.length) return res.status(404).json({ error: `Version ${versionId} not found for slide ${slideNumber}` });
    const v = vRows[0];

    const { rows: cRows } = await pool.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_v
       FROM slide_version_history WHERE deck_slug=$1 AND slide_number=$2`,
      [slug, slideNumber]
    );
    await pool.query(
      `INSERT INTO slide_version_history
         (deck_slug, slide_number, version_number, title, subtitle, content, notes, change_summary, changed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'restore')`,
      [slug, slideNumber, cRows[0].next_v, v.title, v.subtitle, JSON.stringify(v.content), v.notes,
       `Restored to v${v.version_number}`]
    );
    await pool.query(
      `INSERT INTO slide_content_overrides (deck_slug, slide_number, title, subtitle, content, notes, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (deck_slug, slide_number)
       DO UPDATE SET title=$3, subtitle=$4, content=$5, notes=$6, updated_at=NOW()`,
      [slug, slideNumber, v.title, v.subtitle, JSON.stringify(v.content), v.notes]
    );
    res.json({ ok: true, content: v.content, title: v.title, subtitle: v.subtitle, notes: v.notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PPTX Export ─────────────────────────────────────────────────────────────

const PPTX_BG      = 'FFFFFF';  // white background
const PPTX_DARK    = '1E293B';  // main headings (was PPTX_WHITE)
const PPTX_GRAY300 = '334155';  // body text (dark on white)
const PPTX_GRAY400 = '475569';  // secondary body text
const PPTX_GRAY500 = '64748B';  // muted / labels
const PPTX_CARD_BG = 'F1F5F9';  // card / block backgrounds
const PPTX_BORDER  = 'E2E8F0';  // card borders
const PPTX_ACCENT  = { opening: '0057A8', understanding: '0057A8', approach: 'F4A742', logistics: '22C55E', lettershop: 'A855F7', hsse: 'F97316', team: '14B8A6', closing: '0057A8' };
const FONT_TITLE = 'Nourd';
const FONT_BODY  = 'Canva Sans';
const PPTX_SECTION = { opening: 'Opening', understanding: 'Understanding', approach: 'Design & Production', logistics: 'Logistics', lettershop: 'Lettershop', hsse: 'HSSE', team: 'Team', closing: 'Closing' };

function pptxAddSlideHeader(sl, pptx, s) {
  const accent = PPTX_ACCENT[s.section] || '0057A8';
  sl.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.28, w: 0.28, h: 0.05, fill: { color: accent }, line: { color: accent } });
  sl.addText((PPTX_SECTION[s.section] || s.section).toUpperCase(), { x: 0.88, y: 0.18, w: 6, h: 0.28, color: PPTX_GRAY500, fontSize: 7.5, charSpacing: 1.5, fontFace: FONT_BODY });
  sl.addText(s.title || '', { x: 0.5, y: 0.58, w: 12.33, h: 0.65, color: PPTX_DARK, fontSize: 21, bold: true, fontFace: FONT_TITLE });
  if (s.subtitle) sl.addText(s.subtitle, { x: 0.5, y: 1.26, w: 12.33, h: 0.3, color: PPTX_GRAY400, fontSize: 11, fontFace: FONT_BODY });
  sl.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.62, w: 12.33, h: 0.007, fill: { color: PPTX_BORDER }, line: { color: PPTX_BORDER } });
}

router.get('/:slug/export/pptx', async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows: dbSlides } = await pool.query(
      `SELECT ps.slide_number, ps.section, ps.layout_type,
              COALESCE(sco.title,    ps.title)    AS title,
              COALESCE(sco.subtitle, ps.subtitle) AS subtitle,
              COALESCE(sco.content,  ps.content)  AS content,
              COALESCE(sco.notes,    ps.notes)    AS notes
       FROM presentation_slides ps
       LEFT JOIN slide_content_overrides sco
         ON sco.deck_slug = ps.deck_slug AND sco.slide_number = ps.slide_number
       WHERE ps.deck_slug = $1 ORDER BY ps.slide_number`,
      [slug]
    );
    if (!dbSlides.length) return res.status(404).json({ error: 'No slides found. Seed the presentation first.' });

    // First generated image URL per slide
    const { rows: imgRows } = await pool.query(
      `SELECT im.slide_number, sa.public_url
       FROM image_manifests im
       JOIN slide_assets sa ON sa.id = im.asset_id
       WHERE im.presentation_slug=$1 AND im.status='generated' AND sa.public_url IS NOT NULL
       ORDER BY im.slide_number, im.created_at ASC`,
      [slug]
    );
    const slideImages = {};
    for (const r of imgRows) { if (!slideImages[r.slide_number]) slideImages[r.slide_number] = r.public_url; }

    const PptxGenJS = require('pptxgenjs');
    const pptx = new PptxGenJS();
    // pptxgenjs v3 uses 'LAYOUT_WIDE'; define custom to be version-safe
    pptx.defineLayout({ name: 'WIDESCREEN', width: 13.33, height: 7.5 });
    pptx.layout = 'WIDESCREEN';
    pptx.title = 'CLP Power — 5 Miles Lab Tender Proposal';
    pptx.company = '5 Miles Lab';

    for (const row of dbSlides) {
      const s = { ...row, content: row.content || {} };
      const sl = pptx.addSlide();
      sl.background = { color: PPTX_BG };
      const c = s.content;
      const accent = PPTX_ACCENT[s.section] || 'E60000';

      // Semi-transparent generated image background
      if (slideImages[s.slide_number]) {
        sl.addImage({ path: slideImages[s.slide_number], x: 0, y: 0, w: 13.33, h: 7.5, transparency: 78 });
      }

      // ── Cover ──────────────────────────────────────────────────────────────
      if (s.layout_type === 'cover') {
        sl.addText('CLP  ·  5 MILES LAB', { x: 0, y: 1.5, w: 13.33, h: 0.35, align: 'center', color: accent, fontSize: 9, bold: true, charSpacing: 3, fontFace: FONT_BODY });
        sl.addText(c.main_title || s.title || '', { x: 1, y: 2.05, w: 11.33, h: 1.85, align: 'center', color: PPTX_DARK, fontSize: 34, bold: true, fontFace: FONT_TITLE });
        sl.addText(c.subtitle_cn || s.subtitle || '', { x: 1, y: 4.0, w: 11.33, h: 0.65, align: 'center', color: PPTX_GRAY400, fontSize: 19, fontFace: FONT_BODY });
        sl.addShape(pptx.ShapeType.rect, { x: 5.67, y: 4.85, w: 2, h: 0.04, fill: { color: accent }, line: { color: accent } });
        if (c.project_name) sl.addText(c.project_name, { x: 1, y: 5.15, w: 11.33, h: 0.35, align: 'center', color: PPTX_GRAY500, fontSize: 10, fontFace: FONT_BODY });
        if (c.date) sl.addText(c.date, { x: 1, y: 6.55, w: 11.33, h: 0.35, align: 'center', color: PPTX_GRAY500, fontSize: 9, fontFace: FONT_BODY });
      }

      // ── Section divider ────────────────────────────────────────────────────
      else if (s.layout_type === 'section-divider') {
        sl.addShape(pptx.ShapeType.rect, { x: 5.67, y: 2.52, w: 2, h: 0.05, fill: { color: accent }, line: { color: accent } });
        sl.addText(c.section_title || s.title || '', { x: 0.5, y: 2.88, w: 12.33, h: 1.3, align: 'center', color: PPTX_DARK, fontSize: 38, bold: true, fontFace: FONT_TITLE });
        sl.addText(c.section_subtitle || s.subtitle || '', { x: 1.5, y: 4.28, w: 10.33, h: 0.7, align: 'center', color: PPTX_GRAY400, fontSize: 16, fontFace: FONT_BODY });
      }

      // ── Statement ──────────────────────────────────────────────────────────
      else if (s.layout_type === 'statement') {
        pptxAddSlideHeader(sl, pptx, s);
        const y0 = 1.78;
        if (c.problem) sl.addText(c.problem, { x: 0.5, y: y0, w: 12.33, h: 0.65, color: PPTX_GRAY400, fontSize: 13, fontFace: FONT_BODY });
        if (c.our_difference) sl.addText(c.our_difference, { x: 0.5, y: y0 + 0.8, w: 12.33, h: 1.4, color: PPTX_DARK, fontSize: 19, bold: true, fontFace: FONT_TITLE });
        (Array.isArray(c.supporting_points) ? c.supporting_points : []).forEach((pt, i) => {
          sl.addShape(pptx.ShapeType.ellipse, { x: 0.5, y: y0 + 2.48 + i * 0.52, w: 0.14, h: 0.14, fill: { color: accent + '33' }, line: { color: accent } });
          sl.addText(String(pt), { x: 0.76, y: y0 + 2.41 + i * 0.52, w: 11.57, h: 0.36, color: PPTX_GRAY300, fontSize: 12, fontFace: FONT_BODY });
        });
      }

      // ── Content (numbered blocks) ──────────────────────────────────────────
      else if (s.layout_type === 'content') {
        pptxAddSlideHeader(sl, pptx, s);
        const blocks = Array.isArray(c.blocks) ? c.blocks : [];
        const gap = blocks.length > 4 ? 1.1 : 1.3;
        blocks.slice(0, 6).forEach((block, i) => {
          const y = 1.78 + i * gap;
          sl.addText(String(i + 1).padStart(2, '0'), { x: 0.5, y, w: 0.55, h: 0.35, color: PPTX_GRAY500, fontSize: 9, fontFace: FONT_BODY });
          sl.addText(block.heading || '', { x: 1.15, y, w: 11.5, h: 0.38, color: PPTX_DARK, fontSize: 13, bold: true, fontFace: FONT_TITLE });
          sl.addText(block.body || '', { x: 1.15, y: y + 0.42, w: 11.5, h: 0.58, color: PPTX_GRAY400, fontSize: 11, fontFace: FONT_BODY });
        });
      }

      // ── Two-column ─────────────────────────────────────────────────────────
      else if (s.layout_type === 'two-column') {
        pptxAddSlideHeader(sl, pptx, s);
        [c.left, c.right].forEach((col, ci) => {
          if (!col) return;
          const x = ci === 0 ? 0.5 : 7.1;
          sl.addText(col.title || '', { x, y: 1.82, w: 5.8, h: 0.38, color: PPTX_DARK, fontSize: 13, bold: true, fontFace: FONT_TITLE });
          sl.addShape(pptx.ShapeType.rect, { x, y: 2.24, w: 5.8, h: 0.006, fill: { color: PPTX_BORDER }, line: { color: PPTX_BORDER } });
          (Array.isArray(col.items) ? col.items : []).forEach((item, j) => {
            sl.addText(`›  ${item}`, { x, y: 2.38 + j * 0.52, w: 5.8, h: 0.44, color: PPTX_GRAY300, fontSize: 11, fontFace: FONT_BODY });
          });
        });
      }

      // ── Timeline ───────────────────────────────────────────────────────────
      else if (s.layout_type === 'timeline') {
        pptxAddSlideHeader(sl, pptx, s);
        const phases = Array.isArray(c.phases) ? c.phases : [];
        phases.slice(0, 4).forEach((phase, i) => {
          const x = 0.4 + i * 3.25;
          sl.addShape(pptx.ShapeType.roundRect, { x, y: 1.75, w: 3.0, h: 5.45, fill: { color: PPTX_CARD_BG }, line: { color: PPTX_BORDER, pt: 0.6 }, rectRadius: 0.07 });
          sl.addText(phase.label || `Phase ${i + 1}`, { x: x + 0.2, y: 1.92, w: 2.6, h: 0.28, color: accent, fontSize: 8.5, fontFace: FONT_BODY });
          sl.addText(phase.title || '', { x: x + 0.2, y: 2.24, w: 2.6, h: 0.58, color: PPTX_DARK, fontSize: 11, bold: true, fontFace: FONT_TITLE });
          (Array.isArray(phase.activities) ? phase.activities : []).slice(0, 5).forEach((act, j) => {
            sl.addShape(pptx.ShapeType.ellipse, { x: x + 0.22, y: 3.04 + j * 0.47, w: 0.07, h: 0.07, fill: { color: PPTX_GRAY500 }, line: { color: PPTX_GRAY500 } });
            sl.addText(act, { x: x + 0.35, y: 2.97 + j * 0.47, w: 2.45, h: 0.38, color: PPTX_GRAY400, fontSize: 9.5, fontFace: FONT_BODY });
          });
          if (phase.client_role) sl.addText(phase.client_role, { x: x + 0.2, y: 6.5, w: 2.6, h: 0.38, color: PPTX_GRAY500, fontSize: 8.5, italic: true, fontFace: FONT_BODY });
        });
      }

      // ── Visual-heavy / split-metrics / fallback ────────────────────────────
      else {
        pptxAddSlideHeader(sl, pptx, s);
        const y0 = 1.78;
        const blocks = Array.isArray(c.blocks) ? c.blocks : null;
        if (blocks) {
          blocks.slice(0, 6).forEach((block, i) => {
            const x = i % 2 === 0 ? 0.5 : 6.9;
            const y = y0 + Math.floor(i / 2) * 1.28;
            sl.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.85, h: 1.14, fill: { color: PPTX_CARD_BG }, line: { color: PPTX_BORDER, pt: 0.5 }, rectRadius: 0.06 });
            sl.addText(block.heading || '', { x: x + 0.2, y: y + 0.1, w: 5.45, h: 0.36, color: PPTX_DARK, fontSize: 12, bold: true, fontFace: FONT_TITLE });
            sl.addText(block.body || '', { x: x + 0.2, y: y + 0.5, w: 5.45, h: 0.54, color: PPTX_GRAY400, fontSize: 10.5, fontFace: FONT_BODY });
          });
        } else if (c.left && c.right) {
          [c.left, c.right].forEach((col, ci) => {
            const x = ci === 0 ? 0.5 : 7.1;
            sl.addShape(pptx.ShapeType.roundRect, { x, y: y0, w: 5.8, h: 5.0, fill: { color: PPTX_CARD_BG }, line: { color: PPTX_BORDER, pt: 0.5 }, rectRadius: 0.08 });
            sl.addText(col.title || '', { x: x + 0.25, y: y0 + 0.2, w: 5.3, h: 0.38, color: PPTX_DARK, fontSize: 12, bold: true, fontFace: FONT_TITLE });
            (Array.isArray(col.items) ? col.items : []).forEach((item, j) => {
              sl.addText(`·  ${item}`, { x: x + 0.25, y: y0 + 0.72 + j * 0.52, w: 5.3, h: 0.44, color: PPTX_GRAY300, fontSize: 11, fontFace: FONT_BODY });
            });
          });
        } else {
          sl.addText(JSON.stringify(c, null, 2), { x: 0.5, y: y0, w: 12.33, h: 5.2, color: PPTX_GRAY500, fontSize: 9, fontFace: FONT_BODY });
        }
      }

      if (s.notes) sl.addNotes(s.notes);
    }

    const buf = await pptx.write({ outputType: 'nodebuffer' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="5ML-CLP-Tender-${slug}.pptx"`,
      'Content-Length': buf.length,
    });
    res.send(buf);
  } catch (err) {
    console.error('[presentation-deck] PPTX export error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Gemini image generation ─────────────────────────────────────────────────

async function generateImageWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn('[presentation-deck] No Gemini API key — skipping image generation');
    return null;
  }

  // gemini-2.5-flash-image (nanobanana) — same model used by photo-booth & tedx
  const model = 'gemini-2.5-flash-image';
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

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    // Handle both camelCase (SDK) and snake_case (REST API) formats
    const imgData = part.inlineData || part.inline_data;
    if (imgData?.data) {
      return {
        base64: imgData.data,
        mimeType: imgData.mimeType || imgData.mime_type || 'image/png',
      };
    }
  }

  // Log response for debugging if no image found
  console.error('[presentation-deck] generateImageWithGemini: no image in response',
    JSON.stringify({ candidateCount: data.candidates?.length, promptFeedback: data.promptFeedback }, null, 2));
  return null;
}

module.exports = router;
