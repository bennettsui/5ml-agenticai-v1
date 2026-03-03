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
const PAGES_DIR = path.join(__dirname, '../../../frontend/app/vibe-demo/tedx-xinyi');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ---- PostgreSQL persistence for media CDN URLs ----
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
      CREATE TABLE IF NOT EXISTS tedx_media_assets (
        key VARCHAR(512) PRIMARY KEY,
        public_url TEXT,
        alt TEXT DEFAULT '',
        source VARCHAR(50) DEFAULT 'uploaded',
        description TEXT DEFAULT '',
        circles_gallery BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add circles_gallery to any existing table that predates this column
    await pool.query(`
      ALTER TABLE tedx_media_assets
        ADD COLUMN IF NOT EXISTS circles_gallery BOOLEAN DEFAULT FALSE
    `).catch(() => {});
    console.log('[TEDxXinyi] Media assets table ready');
  } catch (err) {
    console.error('[TEDxXinyi] Failed to create media table:', err.message);
  }
}

async function saveMediaUrlToDb(key, publicUrl, { alt, source, description } = {}) {
  const pool = getDbPool();
  if (!pool || !publicUrl) return;
  try {
    await pool.query(`
      INSERT INTO tedx_media_assets (key, public_url, alt, source, description, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (key) DO UPDATE SET
        public_url = COALESCE(EXCLUDED.public_url, tedx_media_assets.public_url),
        alt = COALESCE(NULLIF(EXCLUDED.alt, ''), tedx_media_assets.alt),
        source = COALESCE(EXCLUDED.source, tedx_media_assets.source),
        description = COALESCE(NULLIF(EXCLUDED.description, ''), tedx_media_assets.description),
        updated_at = NOW()
    `, [key, publicUrl, alt || '', source || 'uploaded', description || '']);
  } catch (err) {
    console.error('[TEDxXinyi] DB save failed:', err.message);
  }
}

async function saveCirclesGalleryToDb(key, inCircles) {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      INSERT INTO tedx_media_assets (key, circles_gallery, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET circles_gallery = $2, updated_at = NOW()
    `, [key, !!inCircles]);
  } catch (err) {
    console.error('[TEDxXinyi] DB circles_gallery save failed:', err.message);
  }
}

async function loadMediaUrlsFromDb() {
  const pool = getDbPool();
  if (!pool) return {};
  try {
    const { rows } = await pool.query('SELECT key, public_url, alt, source, description, circles_gallery, created_at FROM tedx_media_assets ORDER BY created_at');
    const map = {};
    for (const row of rows) {
      map[row.key] = { publicUrl: row.public_url, alt: row.alt || '', source: row.source, description: row.description, circlesGallery: !!row.circles_gallery, dbStored: true };
    }
    return map;
  } catch (err) {
    console.error('[TEDxXinyi] DB load failed:', err.message);
    return {};
  }
}

// ---- PostgreSQL persistence for social posts ----
async function initSocialPostsTable() {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tedx_social_posts (
        id VARCHAR(100) PRIMARY KEY,
        copy TEXT DEFAULT '',
        comment TEXT DEFAULT '',
        image_prompt TEXT DEFAULT '',
        image_url TEXT,
        platform VARCHAR(50) DEFAULT 'instagram',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add image_prompt column if table already existed without it
    await pool.query(`
      ALTER TABLE tedx_social_posts ADD COLUMN IF NOT EXISTS image_prompt TEXT DEFAULT ''
    `).catch(() => {});
    console.log('[TEDxXinyi] Social posts table ready');
  } catch (err) {
    console.error('[TEDxXinyi] Failed to create social posts table:', err.message);
  }
}

async function loadSocialPostsFromDb() {
  const pool = getDbPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      'SELECT id, copy, comment, image_prompt, image_url, platform, created_at, updated_at FROM tedx_social_posts ORDER BY created_at DESC'
    );
    return rows.map(r => ({
      id: r.id,
      copy: r.copy || '',
      comment: r.comment || '',
      imagePrompt: r.image_prompt || '',
      imageUrl: r.image_url || null,
      platform: r.platform || 'instagram',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[TEDxXinyi] DB load social posts failed:', err.message);
    return null;
  }
}

async function saveSocialPostToDb(post) {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      INSERT INTO tedx_social_posts (id, copy, comment, image_prompt, image_url, platform, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        copy = EXCLUDED.copy,
        comment = EXCLUDED.comment,
        image_prompt = EXCLUDED.image_prompt,
        image_url = EXCLUDED.image_url,
        platform = EXCLUDED.platform,
        updated_at = EXCLUDED.updated_at
    `, [post.id, post.copy || '', post.comment || '', post.imagePrompt || '', post.imageUrl || null, post.platform || 'instagram', post.createdAt, post.updatedAt]);
  } catch (err) {
    console.error('[TEDxXinyi] DB save social post failed:', err.message);
  }
}

async function deleteSocialPostFromDb(id) {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query('DELETE FROM tedx_social_posts WHERE id = $1', [id]);
  } catch (err) {
    console.error('[TEDxXinyi] DB delete social post failed:', err.message);
  }
}

// Init media table on module load, then hydrate metadata from DB
initMediaTable().then(() => hydrateMetadataFromDb()).catch(() => {});
initSocialPostsTable().catch(() => {});

// On startup: if .media-metadata.json is empty/missing, populate from DB CDN URLs.
// This fixes image loading on Fly.dev where the ephemeral FS loses the metadata file
// but the DB retains CDN URLs from previous sessions.
async function hydrateMetadataFromDb() {
  // Only hydrate if metadata is empty/missing
  let existing = {};
  try {
    if (fs.existsSync(METADATA_PATH)) {
      existing = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
      if (Object.keys(existing).filter(k => !k.startsWith('_')).length > 0) return; // already has entries
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
    console.log(`[TEDxXinyi] Hydrated metadata from DB (${entries.length} CDN URLs)`);
  } catch (e) {
    console.error('[TEDxXinyi] Failed to hydrate metadata:', e.message);
  }
}

// ---- Scan external image URLs from website source files ----
let _externalUrlsCache = null;
function scanExternalUrls() {
  if (_externalUrlsCache) return _externalUrlsCache;
  const urls = new Map();
  if (!fs.existsSync(PAGES_DIR)) return [];
  const urlRe = /https?:\/\/[^\s'")\]>]+\.(jpg|jpeg|png|webp|gif)/gi;
  function scanDir(dir, rel) {
    try {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) { scanDir(full, `${rel}/${entry}`); }
        else if (/\.(tsx?|jsx?)$/.test(entry)) {
          const content = fs.readFileSync(full, 'utf8');
          let m;
          while ((m = urlRe.exec(content)) !== null) {
            const url = m[0];
            if (url.includes('5ml-agenticai-v1.fly.dev')) continue;
            if (!urls.has(url)) urls.set(url, { url, page: `${rel}/${entry}`, filename: decodeURIComponent(url.split('/').pop() || 'unknown') });
          }
        }
      }
    } catch {}
  }
  scanDir(PAGES_DIR, '');
  _externalUrlsCache = [...urls.values()];
  return _externalUrlsCache;
}

// ---- API: list all image slots used across website pages ----
router.get('/image-slots', (req, res) => {
  const slots = [];
  const meta = (() => { try { return loadMetadata(); } catch { return {}; } })();

  // ── Phase 0: Guarantee all VISUALS always appear (baseline) ──
  // Prevents dynamic-expression references (e.g. src={VAR || '/tedx-xinyi/...'})
  // from being silently missed by the regex scanner.
  const seenVisualKeys = new Set();
  for (const v of VISUALS) {
    const key = v.filename;
    seenVisualKeys.add(key);
    const localPath = `/tedx-xinyi/${key}`;
    const metaEntry = meta[key];
    const cdnUrl = metaEntry?.publicUrl || null;
    const localExists = fs.existsSync(path.join(OUTPUT_DIR, key));
    const isHero   = key.includes('hero-');
    const isPoster = key.includes('poster-');
    const isSalon  = key.includes('salon-');
    let type = 'other';
    if (isHero)   type = 'hero';
    else if (isPoster) type = 'poster';
    else if (isSalon)  type = 'visual';
    slots.push({
      page: 'visuals',
      src: localPath,
      type,
      isExternal: false,
      isLocal: true,
      metaKey: key,
      cdnUrl,
      localExists,
      status: cdnUrl ? 'cdn' : localExists ? 'local-only' : 'missing',
      note: v.description || '',
      generatable: true,
      visualId: v.id,
    });
  }

  // Scan all TSX/TS files for image src references
  if (fs.existsSync(PAGES_DIR)) {
    const srcRe = /src\s*=\s*\{?\s*["'`]([^"'`]+\.(jpg|jpeg|png|webp|gif))[^"'`]*["'`]/gi;
    const cdnMapRe = /SPEAKER_CDN_URLS\[['"]([^'"]+)['"]\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g;
    const imgSrcRe = /src\s*=\s*["']([^"']+)["']/gi;

    function scanFile(filePath, pageName) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const seen = new Set();

        // Match all src="..." patterns
        let m;
        const allSrcRe = /src\s*[=:]\s*\{?\s*["'`]([^"'`\s][^"'`]*)["'`]/gi;
        while ((m = allSrcRe.exec(content)) !== null) {
          const url = m[1].trim();
          if (seen.has(url)) continue;
          seen.add(url);

          // Classify the image
          const isExternal = /^https?:\/\//.test(url);
          const isLocal = url.startsWith('/tedx-xinyi/');
          const isSpeaker = url.includes('speakers/') || url.includes('speaker');
          const isHero = url.includes('hero-');
          const isPoster = url.includes('poster-');
          const isSalon = url.includes('salon-');
          const isVideo = url.includes('youtube') || url.includes('youtu.be');
          if (isVideo) continue; // skip video thumbnails/embeds

          // Determine image type
          let type = 'other';
          if (isHero) type = 'hero';
          else if (isPoster) type = 'poster';
          else if (isSalon) type = 'visual';
          else if (isSpeaker) type = 'speaker';
          else if (isExternal) type = 'external';

          // Check if local image has a CDN URL in metadata
          let metaKey = null;
          let cdnUrl = null;
          let localExists = false;
          if (isLocal) {
            metaKey = url.replace('/tedx-xinyi/', '');
            const metaEntry = meta[metaKey];
            cdnUrl = metaEntry?.publicUrl || null;
            localExists = fs.existsSync(path.join(OUTPUT_DIR, metaKey));
          }

          // When Phase 1 finds a VISUAL that Phase 0 already added, update its page
          // from the generic 'visuals' bucket to the actual page filename so the
          // admin's page-filter shows it under the correct page.
          if (isLocal && metaKey && seenVisualKeys.has(metaKey)) {
            const existing = slots.find(s => s.metaKey === metaKey && s.page === 'visuals');
            if (existing) existing.page = pageName;
            continue;
          }

          slots.push({
            page: pageName,
            src: url,
            type,
            isExternal,
            isLocal,
            metaKey,
            cdnUrl,
            localExists,
            status: isExternal ? 'external' : (cdnUrl ? 'cdn' : (localExists ? 'local-only' : 'missing')),
          });
        }

        // Also detect any '/tedx-xinyi/...' path in quoted strings (e.g. image: '/tedx-xinyi/entry-about.webp')
        const anyLocalRe = /['"`](\/tedx-xinyi\/[^'"`\s]+\.(jpg|jpeg|png|webp|gif))['"`]/gi;
        let al;
        while ((al = anyLocalRe.exec(content)) !== null) {
          const url = al[1];
          if (seen.has(url)) continue;
          seen.add(url);
          const metaKey = url.replace('/tedx-xinyi/', '');
          // If already a VISUAL baseline, update its page to this actual page
          if (seenVisualKeys.has(metaKey)) {
            const existing = slots.find(s => s.metaKey === metaKey && s.page === 'visuals');
            if (existing) existing.page = pageName;
            continue;
          }
          const metaEntry = meta[metaKey];
          const localEx = fs.existsSync(path.join(OUTPUT_DIR, metaKey));
          const isSpeakerImg = url.includes('speakers/');
          const isHeroImg = url.includes('hero-');
          const isPosterImg = url.includes('poster-');
          const isSalonImg = url.includes('salon-');
          let imgType = 'other';
          if (isHeroImg) imgType = 'hero';
          else if (isPosterImg) imgType = 'poster';
          else if (isSalonImg) imgType = 'visual';
          else if (isSpeakerImg) imgType = 'speaker';
          slots.push({
            page: pageName,
            src: url,
            type: imgType,
            isExternal: false,
            isLocal: true,
            metaKey,
            cdnUrl: metaEntry?.publicUrl || null,
            localExists: localEx,
            status: metaEntry?.publicUrl ? 'cdn' : (localEx ? 'local-only' : 'missing'),
          });
        }

        // Also find CDN map fallback patterns like: SPEAKER_CDN_URLS[id] || '/tedx-xinyi/...'
        let cm;
        while ((cm = cdnMapRe.exec(content)) !== null) {
          const imageId = cm[1];
          const fallbackUrl = cm[2];
          if (seen.has(`cdn-map:${imageId}`)) continue;
          seen.add(`cdn-map:${imageId}`);
          const speakerKey = `speakers/${imageId}.jpg`;
          const metaEntry = meta[speakerKey] || meta[`speakers/${imageId}.png`] || meta[`speakers/${imageId}.webp`];
          slots.push({
            page: pageName,
            src: fallbackUrl,
            type: 'speaker',
            isExternal: false,
            isLocal: true,
            metaKey: speakerKey,
            cdnUrl: metaEntry?.publicUrl || null,
            localExists: fs.existsSync(path.join(OUTPUT_DIR, speakerKey)),
            status: metaEntry?.publicUrl ? 'cdn' : (fs.existsSync(path.join(OUTPUT_DIR, speakerKey)) ? 'local-only' : 'missing'),
            note: `CDN map fallback for ${imageId}`,
          });
        }

        // Detect imageId-based speaker patterns: { imageId: 'xxx' } used with template literals
        // Handles: imageId: 'cheng-shi-jia' where src uses `/tedx-xinyi/speakers/${speaker.imageId}.jpg`
        const imageIdRe = /imageId:\s*['"]([^'"]+)['"]/g;
        let im;
        while ((im = imageIdRe.exec(content)) !== null) {
          const imageId = im[1];
          if (seen.has(`imageId:${imageId}`)) continue;
          seen.add(`imageId:${imageId}`);
          // Check all extensions
          let foundKey = null;
          let foundMeta = null;
          for (const ext of ['jpg', 'png', 'webp']) {
            const key = `speakers/${imageId}.${ext}`;
            const entry = meta[key];
            if (entry?.publicUrl || fs.existsSync(path.join(OUTPUT_DIR, key))) {
              foundKey = key;
              foundMeta = entry;
              break;
            }
          }
          const speakerKey = foundKey || `speakers/${imageId}.jpg`;
          const metaEntry = foundMeta || meta[speakerKey];
          const local = fs.existsSync(path.join(OUTPUT_DIR, speakerKey));
          slots.push({
            page: pageName,
            src: `/tedx-xinyi/speakers/${imageId}.jpg`,
            type: 'speaker',
            isExternal: false,
            isLocal: true,
            metaKey: speakerKey,
            cdnUrl: metaEntry?.publicUrl || null,
            localExists: local,
            status: metaEntry?.publicUrl ? 'cdn' : (local ? 'local-only' : 'missing'),
            note: `Speaker imageId: ${imageId}`,
          });
        }
      } catch {}
    }

    function scanDir(dir) {
      try {
        for (const entry of fs.readdirSync(dir)) {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            scanDir(full);
          } else if (/\.(tsx?|jsx?)$/.test(entry)) {
            // Derive page name from path
            const rel = path.relative(PAGES_DIR, full);
            const pageName = rel.replace(/\/page\.tsx$/, '').replace(/\.tsx$/, '') || 'home';
            scanFile(full, pageName);
          }
        }
      } catch {}
    }
    scanDir(PAGES_DIR);
  }

  // Also include layout.tsx metadata images
  const layoutPath = path.join(PAGES_DIR, 'layout.tsx');
  if (fs.existsSync(layoutPath)) {
    try {
      const content = fs.readFileSync(layoutPath, 'utf8');
      const urlRe = /https?:\/\/[^\s'")\]>]+\.(jpg|jpeg|png|webp|gif)/gi;
      let m;
      while ((m = urlRe.exec(content)) !== null) {
        slots.push({
          page: 'layout (meta)',
          src: m[0],
          type: 'meta',
          isExternal: true,
          isLocal: false,
          metaKey: null,
          cdnUrl: null,
          localExists: false,
          status: 'external',
        });
      }
    } catch {}
  }

  // Summary stats
  const total = slots.length;
  const missing = slots.filter(s => s.status === 'missing').length;
  const cdnOk = slots.filter(s => s.status === 'cdn').length;
  const localOnly = slots.filter(s => s.status === 'local-only').length;
  const external = slots.filter(s => s.status === 'external').length;

  res.json({ slots, summary: { total, missing, cdnOk, localOnly, external } });
});

// ==================== VISUAL DEFINITIONS ====================
// Festival poster aesthetic: warm golden hour, Taipei Xinyi energy,
// bright optimistic tones (distinct from Boundary Street's dark noir)
const VISUALS = [
  {
    id: 'hero-home',
    filename: 'hero-home.webp',
    description: 'Home hero — luminous galaxy distance cinematic banner',
    prompt: 'Wide 16:9 cinematic banner, expansive sky transitioning from deep midnight blue at the edges to warm indigo and soft violet in the centre, layered nebula clouds in luminous violet rose-pink and warm amber tones that look like long-exposure astrophotography mixed with painting not 3D cartoon, a clear smooth galaxy arc curves gracefully across the upper half with a brightly glowing warm golden-amber core radiating soft light surrounded by many tiny sharp stars, from the galaxy arc let a few very thin beams of warm golden light and sparse glowing data-like particles flow downward along curved paths suggesting AI as a vast quiet information system, the overall scene should feel luminous hopeful and bright not oppressively dark, foreground at very bottom centre a tiny solitary human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose arms relaxed head slightly tilted upward, warm realistic rim light from the galaxy outlining head shoulders and coat clearly, around the upper body a few faint rising particles of golden light where data streams begin to touch this person, palette balanced between deep midnight blues and warm violet rose amber and cream highlights with the galaxy core glowing warm gold, generous amounts of star light and nebula glow so the image feels radiant not heavy, no text no watermarks no UI HUD graphics, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art that feels uplifting and aspirational',
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
    id: 'about-xinyi',
    filename: 'about-xinyi.webp',
    description: 'About page — Xinyi district creative community gathering',
    prompt: 'Wide 4:3 photograph-style image of a creative community gathering in a modern urban space in Taipei Xinyi district, warm golden hour lighting through large windows showing city skyline at dusk, a diverse group of people in animated conversation forming small circles, modern minimalist furniture and potted plants, the feeling of post-event networking at a TEDx event, warm amber and cream tones with natural light, candid documentary photography style, depth of field with some figures softly blurred, no text no watermarks no logos, optimistic community atmosphere',
  },
  {
    id: 'salon-curiosity',
    filename: 'salon-curiosity.webp',
    description: 'Curiosity zones visual — multi-zone experience',
    prompt: 'Vertical portrait 3:4 image composed of multiple stacked zones, bottom a small open-mic corner with a mic stand and a small seated audience, middle a creative market area with small booths plants and people talking, upper a quiet reading journaling corner with books notebooks lamps, style semi-illustrative slightly stylised not hyper-realistic, people appear diverse but not individually recognisable, lighting warm glows in each zone connected with a gentle path or staircase hinting at moving from one version of yourself to the next, palette mix of warm earth tones and deep blues with small red accents, no text no watermarks no logos',
  },
  {
    id: 'entry-about',
    filename: 'entry-about.webp',
    description: 'Entry card — About TEDxXinyi community',
    prompt: 'Horizontal 16:10 card thumbnail image, warm intimate creative gathering in a modern Taipei event loft space, a few diverse people in casual animated conversation slightly blurred in background, foreground shows minimalist venue details with a warm TED red accent wall or column, overall warm cream and red colour palette, soft golden hour light from tall windows, documentary photography style, shallow depth of field, optimistic open community atmosphere, no text no watermarks no logos',
  },
  {
    id: 'entry-sustainability',
    filename: 'entry-sustainability.webp',
    description: 'Entry card — Sustainability stage design',
    prompt: 'Horizontal 16:10 card thumbnail image, beautiful artistic close-up of sustainable stage materials arranged on a pale oak workbench: a 3D-printed geometric lamp module in matte white, a flat sheet of patterned recycled wood veneer, a small coil of recycled copper wire, all catching warm amber afternoon sunlight from a window at left, shallow depth of field with warm cream and amber palette, refined makers workshop aesthetic, optimistic and creative mood, no text no watermarks no people',
  },
  {
    id: 'entry-community',
    filename: 'entry-community.webp',
    description: 'Entry card — Community and small gatherings',
    prompt: 'Horizontal 16:10 card thumbnail image, gentle three-quarter overhead angle of a small circle of chairs arranged in a cozy modern Taipei creative space, warm amber-green evening lighting, colourful cushions on chairs, a low wooden coffee table in the centre with cups and small plants, arrangement clearly suggests a small intimate discussion group event, soft bokeh background, community warmth, documentary photography style, no text no watermarks no people',
  },
  {
    id: 'report-cave-intro',
    filename: 'report-cave-intro.webp',
    description: 'Report foreword — cave silhouette, person walking toward light',
    prompt: 'Cinematic photograph of a cave interior, rough dark brown and charcoal rock walls and floor in the foreground with deep shadows and visible texture, the cave narrows into an arched tunnel passage, strong bright golden-white light floods in from the cave mouth creating a glowing halo effect, a single lone human figure stands backlit at the cave opening as a silhouette — full upright posture, no facial features visible, facing away from camera toward the light, the contrast between the dark cave interior and the blinding white-gold exterior light is extreme and dramatic, mood: emergence, awakening, walking out of darkness into light, metaphorical and cinematic, no text, no watermarks',
  },
  {
    id: 'hero-sponsors',
    filename: 'hero-sponsors.webp',
    description: 'Sponsors hero — partnership and ideas, warm Taipei networking',
    prompt: 'Wide 16:9 cinematic banner of a warmly lit modern creative venue interior in Taipei, floor-to-ceiling windows revealing Xinyi district skyline at dusk bathed in amber and soft violet light, inside the space warm golden overhead lights illuminate a networking scene, in the middle ground two pairs of hands connecting in a gentle handshake gesture slightly motion-blurred suggesting trust and partnership, surrounding them blurred silhouettes of diverse people in animated conversation forming small clusters, clean minimalist modern furniture with a few potted plants, the overall atmosphere is optimistic warm and collaborative like the networking break at a TEDx event, palette of warm cream amber and soft neutral tones with a single bold red accent object visible in the decor, no text no watermarks no logos, cinematic depth of field with bokeh on background figures, festival-poster quality photography that feels genuine and aspirational',
  },
  {
    id: 'ted-circles',
    filename: 'ted-circles.webp',
    description: 'TED Circles — iconic red circle carpet in dramatic dark venue',
    prompt: 'Dramatic wide-angle photograph shot from a slightly elevated angle, a large bold vivid solid TEDx red circular carpet perfectly centred on a dark polished concrete floor, the surrounding space is very dark — nearly black walls ceiling and floor beyond the carpet, a single precise overhead spotlight makes the red circle glow intensely, chairs arranged in a perfect ring just outside the red carpet with participants visible as dark silhouettes, the bold saturated red carpet is the only strong colour in the entire frame, atmosphere is cinematic and intimate like a private theatre, documentary photography with extreme high-contrast lighting, no text no watermarks no logos',
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

    // Upload to mmdbfiles and get public URL
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(imageBuffer);
      savePublicUrl(visual.filename, publicUrl);
      updateWebpageImageUrl(visual.filename, '', publicUrl);
      console.log(`[TEDxXinyi] ${visual.filename} → ${publicUrl}`);
    } catch (uploadErr) {
      console.error(`[TEDxXinyi] mmdbfiles upload failed for ${visual.filename}:`, uploadErr.message);
    }

    res.json({
      success: true,
      id: visual.id,
      filename: visual.filename,
      size: imageBuffer.length,
      path: `/tedx-xinyi/${visual.filename}`,
      publicUrl,
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

        // Upload to mmdbfiles
        let publicUrl = null;
        try {
          publicUrl = await uploadToMmdb(imageBuffer);
          savePublicUrl(visual.filename, publicUrl);
          console.log(`[TEDxXinyi] ${visual.filename} → ${publicUrl}`);
        } catch (uploadErr) {
          console.error(`[TEDxXinyi] mmdbfiles upload failed for ${visual.filename}:`, uploadErr.message);
        }
        batchState.results.push({ id: visual.id, status: 'generated', size: imageBuffer.length, publicUrl });
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
  const meta = loadMetadata();
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
      publicUrl: (meta[v.filename] && meta[v.filename].publicUrl) || null,
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

// ---- Sponsor Logos ----
const SPONSORS_LOGOS_DIR = path.join(OUTPUT_DIR, 'sponsors');
const SPONSOR_LOGOS_FILE = path.join(__dirname, '.sponsor-logos.json');

const SPONSOR_CATEGORIES = [
  { id: 'featured',   label: '精選夥伴', label_en: 'Featured Partners' },
  { id: 'strategic',  label: '策略夥伴', label_en: 'Strategic Partners' },
  { id: 'patron',     label: '主贊助',   label_en: 'Patron' },
  { id: 'honor',      label: '榮譽贊助', label_en: 'Honor' },
  { id: 'basic',      label: '基礎贊助', label_en: 'Basic' },
  { id: 'individual', label: '個人贊助', label_en: 'Individual' },
  { id: 'in-kind',    label: '實物贊助', label_en: 'In-Kind' },
  { id: 'community',  label: '社區夥伴', label_en: 'Community Partners' },
];

function loadSponsorLogos() {
  try { return JSON.parse(fs.readFileSync(SPONSOR_LOGOS_FILE, 'utf8')); }
  catch { return {}; }
}

function saveSponsorLogos(data) {
  fs.writeFileSync(SPONSOR_LOGOS_FILE, JSON.stringify(data, null, 2));
}

const METADATA_PATH = path.join(OUTPUT_DIR, '.media-metadata.json');
const METADATA_SEED_PATH = path.join(__dirname, '.media-metadata-seed.json');

// --- Metadata persistence ---
// On Fly.dev, the filesystem is EPHEMERAL. .media-metadata.json is wiped on
// every machine restart, deploy, or sleep/wake. To survive restarts:
// 1. A seed file (.media-metadata-seed.json) is committed to git as baseline
// 2. After every save, metadata is backed up to mmdbfiles as a tiny image
// 3. On startup, if metadata is missing, restore from seed or mmdbfiles backup

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_PATH)) {
      const meta = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
      if (Object.keys(meta).length > 0) return meta;
    }
  } catch { /* ignore */ }
  // Try to restore from seed file (committed to git)
  try {
    if (fs.existsSync(METADATA_SEED_PATH)) {
      const seed = JSON.parse(fs.readFileSync(METADATA_SEED_PATH, 'utf8'));
      if (Object.keys(seed).length > 0) {
        console.log(`[TEDxXinyi] Restored metadata from seed (${Object.keys(seed).length} entries)`);
        fs.writeFileSync(METADATA_PATH, JSON.stringify(seed, null, 2));
        return seed;
      }
    }
  } catch { /* ignore */ }
  return {};
}

function saveMetadata(meta) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
  // Also update the seed file so it can be committed to git
  try {
    fs.writeFileSync(METADATA_SEED_PATH, JSON.stringify(meta, null, 2));
  } catch (e) {
    console.error('[TEDxXinyi] Failed to update seed:', e.message);
  }
  // Async backup to mmdbfiles (fire-and-forget)
  backupMetadataToMmdb(meta).catch(() => {});
}

let _metadataBackupTimeout = null;
async function backupMetadataToMmdb(meta) {
  // Debounce: only backup after 5s of no changes
  if (_metadataBackupTimeout) clearTimeout(_metadataBackupTimeout);
  _metadataBackupTimeout = setTimeout(async () => {
    try {
      const fetch = (await import('node-fetch')).default;
      const sharp = require('sharp');
      // Encode metadata JSON into a 1x1 PNG with the data in a text chunk
      const jsonStr = JSON.stringify(meta);
      // Create a tiny 1x1 red PNG and embed JSON as EXIF comment
      const buf = await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 230, g: 43, b: 30 } },
      }).jpeg({ quality: 50 }).toBuffer();
      const base64 = buf.toString('base64');
      const fileData = `data:image/jpeg;base64,${base64}`;
      const response = await fetch('http://5ml.mmdbfiles.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: fileData, metadata: jsonStr }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.public_url) {
          // Store backup URL in the metadata itself for future recovery
          meta._backupUrl = data.public_url;
          meta._backupTime = new Date().toISOString();
          fs.writeFileSync(METADATA_PATH, JSON.stringify(meta, null, 2));
          try { fs.writeFileSync(METADATA_SEED_PATH, JSON.stringify(meta, null, 2)); } catch {}
          console.log(`[TEDxXinyi] Metadata backed up to mmdbfiles`);
        }
      }
    } catch (err) {
      console.error('[TEDxXinyi] Metadata backup failed:', err.message);
    }
  }, 5000);
}

// ---- API: public TED Circles photo listing (no auth required) ----
router.get('/circles', async (req, res) => {
  const meta = loadMetadata();
  const dbUrls = await loadMediaUrlsFromDb();
  const photos = [];
  const seen = new Set();

  // Helper: is this key included in circles gallery?
  function inCircles(key, data) {
    if (key.startsWith('ted-circles/')) return true;
    // Check both JSON metadata and DB (DB wins after Fly restarts)
    const dbData = dbUrls[key];
    return (data && data.circlesGallery === true) || (dbData && dbData.circlesGallery === true);
  }

  for (const [key, data] of Object.entries(meta)) {
    if (!data || typeof data !== 'object') continue;
    if (!inCircles(key, data)) continue;
    if (key.includes('--archived-')) continue;
    seen.add(key);
    const localExists = fs.existsSync(path.join(OUTPUT_DIR, key));
    const src = (data.publicUrl || dbUrls[key]?.publicUrl) || (localExists ? `/tedx-xinyi/${key}` : null);
    if (src) photos.push({ key, src, publicUrl: data.publicUrl || dbUrls[key]?.publicUrl || null, alt: data.alt || '' });
  }

  // Also check DB for any circles_gallery items not in JSON metadata
  for (const [key, data] of Object.entries(dbUrls)) {
    if (seen.has(key)) continue;
    if (!data.circlesGallery && !key.startsWith('ted-circles/')) continue;
    if (key.includes('--archived-')) continue;
    const localExists = fs.existsSync(path.join(OUTPUT_DIR, key));
    const src = data.publicUrl || (localExists ? `/tedx-xinyi/${key}` : null);
    if (src) photos.push({ key, src, publicUrl: data.publicUrl || null, alt: data.alt || '' });
  }

  res.json({ photos });
});

// ---- API: toggle a media item in/out of the TED Circles gallery ----
router.post('/media/toggle-circles', express.json(), (req, res) => {
  const { key, inCircles } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  meta[key].circlesGallery = !!inCircles;
  saveMetadata(meta);
  // Persist to DB so it survives Fly.dev machine restarts
  saveCirclesGalleryToDb(key, !!inCircles).catch(() => {});
  res.json({ success: true, key, circlesGallery: !!inCircles });
});

// ---- Expected speaker photo slots (salon page + homepage lineup) ----
const SPEAKER_SLOTS = [
  // Salon page speakers
  { imageId: 'cheng-shi-jia', name: '程世嘉', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'yang-shi-yi', name: '楊士毅', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'lin-dong-liang', name: '林東良', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'liao-wei-jie', name: '廖唯傑', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'liao-guan-jie', name: '廖冠傑', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'cao-rong-xuan', name: '曹榮軒', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'zhang-hui-jun', name: '張卉君', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'lin-jing-yi', name: '林靜宜', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'guo-an-ni', name: '郭安妮', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'dawn-chang', name: 'Dawn Chang', extensions: ['jpg', 'png', 'webp'] },
  // Homepage lineup speakers (zhang-hui-jun already above)
  { imageId: 'jiang-zhen-cheng', name: '江振誠', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'xiao-qing-yang', name: '蕭青陽', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'ling-zong-yong', name: '凌宗湧', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'wang-shi-hao', name: '王士豪', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'liu-xin-yu', name: '劉欣瑜', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'fan-qin-hui', name: '范欽慧', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'duan-zhi-min', name: '段智敏', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'lin-zhi-qin', name: '林知秦', extensions: ['jpg', 'png', 'webp'] },
  { imageId: 'zhou-shi-xiong', name: '周世雄', extensions: ['jpg', 'png', 'webp'] },
];

// ---- Helper: check if local file exists ----
function localFileExists(key) {
  return fs.existsSync(path.join(OUTPUT_DIR, key));
}

// ---- API: list all media (metadata + DB + local filesystem + external URLs) ----
router.get('/media', async (req, res) => {
  const meta = loadMetadata();
  const dbUrls = await loadMediaUrlsFromDb();
  const result = [];
  const seenKeys = new Set();

  // Helper: merge metadata from JSON + DB
  function getMeta(key) {
    const j = meta[key] || {};
    const d = dbUrls[key] || {};
    return { publicUrl: j.publicUrl || d.publicUrl || null, alt: j.alt || d.alt || '', description: d.description || '' };
  }

  // 1. All expected VISUALS (generated hero/salon images)
  for (const v of VISUALS) {
    const key = v.filename;
    seenKeys.add(key);
    const m = getMeta(key);
    const local = localFileExists(key);
    result.push({
      filename: v.filename, folder: '', key,
      path: `/tedx-xinyi/${v.filename}`,
      source: 'generated', description: v.description,
      publicUrl: m.publicUrl, localExists: local, alt: m.alt,
      missing: !m.publicUrl && !local,
      circlesGallery: !!(meta[key] && meta[key].circlesGallery) || !!(dbUrls[key] && dbUrls[key].circlesGallery),
    });
  }

  // 2. All expected speaker photos
  for (const sp of SPEAKER_SLOTS) {
    let found = false;
    for (const ext of sp.extensions) {
      const key = `speakers/${sp.imageId}.${ext}`;
      const m = getMeta(key);
      const local = localFileExists(key);
      if (m.publicUrl || local) {
        seenKeys.add(key);
        result.push({
          filename: `${sp.imageId}.${ext}`, folder: 'speakers', key,
          path: `/tedx-xinyi/speakers/${sp.imageId}.${ext}`,
          source: 'speaker', description: `Speaker photo — ${sp.name}`,
          publicUrl: m.publicUrl, localExists: local,
          alt: m.alt || sp.name, missing: false,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      const key = `speakers/${sp.imageId}.jpg`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const m = getMeta(key);
        result.push({
          filename: `${sp.imageId}.jpg`, folder: 'speakers', key,
          path: `/tedx-xinyi/speakers/${sp.imageId}.jpg`,
          source: 'speaker', description: `Speaker photo — ${sp.name}`,
          publicUrl: m.publicUrl, localExists: false,
          alt: m.alt || sp.name, missing: !m.publicUrl,
        });
      }
    }
  }

  // 3. Entries in JSON metadata not yet listed (uploaded images, etc.)
  for (const [key, data] of Object.entries(meta)) {
    if (key.startsWith('_')) continue;
    if (seenKeys.has(key)) continue;
    if (!data || typeof data !== 'object') continue;
    seenKeys.add(key);
    const parts = key.split('/');
    const filename = parts.pop() || key;
    const folder = parts.join('/');
    const local = localFileExists(key);
    result.push({
      filename, folder, key, path: `/tedx-xinyi/${key}`,
      source: 'uploaded', description: '',
      publicUrl: data.publicUrl || null, localExists: local, alt: data.alt || '',
      missing: !data.publicUrl && !local,
      circlesGallery: !!data.circlesGallery || !!(dbUrls[key] && dbUrls[key].circlesGallery),
    });
  }

  // 3b. Entries in DB not yet listed (persisted CDN URLs from previous sessions)
  for (const [key, data] of Object.entries(dbUrls)) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const parts = key.split('/');
    const filename = parts.pop() || key;
    const folder = parts.join('/');
    result.push({
      filename, folder, key, path: `/tedx-xinyi/${key}`,
      source: data.source || 'db-restored', description: data.description || '',
      publicUrl: data.publicUrl || null, localExists: false, alt: data.alt || '',
      missing: !data.publicUrl,
    });
  }

  // 4. Scan local filesystem for any files not yet tracked
  const imgRe = /\.(jpg|jpeg|png|webp|gif)$/i;
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      if (f.startsWith('.')) continue;
      const full = path.join(OUTPUT_DIR, f);
      if (fs.statSync(full).isFile() && imgRe.test(f) && !seenKeys.has(f)) {
        seenKeys.add(f);
        const m = getMeta(f);
        result.push({
          filename: f, folder: '', key: f, path: `/tedx-xinyi/${f}`,
          source: 'local', description: '',
          publicUrl: m.publicUrl, localExists: true, alt: m.alt, missing: false,
        });
      }
    }
    for (const dir of fs.readdirSync(OUTPUT_DIR)) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (dir.startsWith('.')) continue;
      try { if (!fs.statSync(dirPath).isDirectory()) continue; } catch { continue; }
      for (const f of fs.readdirSync(dirPath)) {
        const key = `${dir}/${f}`;
        if (seenKeys.has(key)) continue;
        const full = path.join(dirPath, f);
        if (fs.statSync(full).isFile() && imgRe.test(f)) {
          seenKeys.add(key);
          const m = getMeta(key);
          result.push({
            filename: f, folder: dir, key, path: `/tedx-xinyi/${key}`,
            source: 'local', description: '',
            publicUrl: m.publicUrl, localExists: true, alt: m.alt, missing: false,
          });
        }
      }
    }
  }

  // 5. External image URLs from website source code
  const extUrls = scanExternalUrls();
  for (const ext of extUrls) {
    const key = `ext:${ext.filename}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    result.push({
      filename: ext.filename, folder: 'external', key,
      path: ext.url,
      source: 'external', description: `Used in ${ext.page}`,
      publicUrl: ext.url, localExists: false, alt: '', missing: false,
    });
  }

  res.json({ images: result, total: result.length });
});

// ---- API: export/import metadata (for backup/recovery) ----
router.get('/metadata-export', (req, res) => {
  const meta = loadMetadata();
  res.setHeader('Content-Disposition', 'attachment; filename=media-metadata.json');
  res.json(meta);
});

router.post('/metadata-import', express.json({ limit: '5mb' }), (req, res) => {
  try {
    const imported = req.body;
    if (!imported || typeof imported !== 'object') return res.status(400).json({ error: 'Invalid metadata JSON' });
    // Merge with existing (don't overwrite)
    const current = loadMetadata();
    const merged = { ...current, ...imported };
    saveMetadata(merged);
    console.log(`[TEDxXinyi] Imported metadata: ${Object.keys(imported).length} entries, merged total: ${Object.keys(merged).length}`);
    res.json({ success: true, imported: Object.keys(imported).length, total: Object.keys(merged).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- API: update metadata (alt, customName, publicUrl/cdnUrl) ----
router.post('/media/metadata', express.json(), (req, res) => {
  const { key, alt, customName, publicUrl, cdnUrl } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  if (alt !== undefined) meta[key].alt = alt;
  if (customName !== undefined) meta[key].customName = customName;
  // Accept either publicUrl or cdnUrl to set the CDN URL
  const newUrl = publicUrl || cdnUrl;
  if (newUrl !== undefined) {
    meta[key].publicUrl = newUrl || null;
    // Also persist to DB so it survives Fly.dev restarts
    if (newUrl) {
      saveMediaUrlToDb(key, newUrl, { alt: meta[key].alt, source: 'manual' }).catch(() => {});
      // Update TSX source files so the CDN URL is baked into the next build
      const parts = key.split('/');
      const filename = parts.pop();
      const folder = parts.join('/');
      updateWebpageImageUrl(filename, folder, newUrl);
    }
  }
  saveMetadata(meta);
  res.json({ success: true, key, meta: meta[key] });
});

// ---- API: push local file to CDN (upload existing local image to mmdbfiles) ----
router.post('/media/push-to-cdn', express.json(), async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const filePath = path.join(OUTPUT_DIR, key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `File not found locally: ${key}` });
  }
  try {
    const raw = fs.readFileSync(filePath);
    const publicUrl = await uploadToMmdb(raw);
    const isSpeaker = key.startsWith('speakers/');
    const parts = key.split('/');
    const filename = parts.pop();
    const folder = parts.join('/');
    savePublicUrl(key, publicUrl, { source: isSpeaker ? 'speaker' : 'generated' });
    updateWebpageImageUrl(filename, folder, publicUrl);
    console.log(`[TEDxXinyi] Pushed to CDN: ${key} → ${publicUrl}`);
    res.json({ success: true, key, publicUrl, size: raw.length });
  } catch (err) {
    console.error(`[TEDxXinyi] Push to CDN failed for ${key}:`, err.message);
    res.status(500).json({ error: err.message });
  }
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

// ---- API: compress all images (local files only) ----
router.post('/media/compress-all', express.json(), async (req, res) => {
  const imgRe = /\.(jpg|jpeg|png|webp|gif)$/i;
  const images = [];
  // Scan local filesystem for images to compress
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      const full = path.join(OUTPUT_DIR, f);
      if (fs.statSync(full).isFile() && imgRe.test(f)) images.push({ key: f, fullPath: full });
    }
    for (const dir of fs.readdirSync(OUTPUT_DIR)) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        for (const f of fs.readdirSync(dirPath)) {
          const full = path.join(dirPath, f);
          if (fs.statSync(full).isFile() && imgRe.test(f)) images.push({ key: `${dir}/${f}`, fullPath: full });
        }
      }
    }
  }
  const results = [];
  for (const img of images) {
    try {
      const raw = fs.readFileSync(img.fullPath);
      const compressed = await optimizeImage(raw, img.key);
      if (compressed.length < raw.length) {
        fs.writeFileSync(img.fullPath, compressed);
        const ratio = ((1 - compressed.length / raw.length) * 100).toFixed(0);
        results.push({ key: img.key, before: raw.length, after: compressed.length, savings: `${ratio}%` });
      } else {
        results.push({ key: img.key, before: raw.length, after: raw.length, savings: '0%', note: 'Already optimized' });
      }
    } catch (err) {
      results.push({ key: img.key, error: err.message });
    }
  }
  const totalBefore = results.reduce((s, r) => s + (r.before || 0), 0);
  const totalAfter = results.reduce((s, r) => s + (r.after || r.before || 0), 0);
  console.log(`[TEDxXinyi] Compress all: ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB`);
  res.json({ success: true, results, totalBefore, totalAfter });
});

// ---- API: convert image format ----
router.post('/media/convert', express.json(), async (req, res) => {
  const { key, format } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  if (!['jpg', 'png', 'webp'].includes(format)) return res.status(400).json({ error: 'format must be jpg, png, or webp' });
  const filePath = path.join(OUTPUT_DIR, key);
  // Check CDN source if local file missing
  const meta = loadMetadata();
  let raw;
  if (fs.existsSync(filePath)) {
    raw = fs.readFileSync(filePath);
  } else if (meta[key] && meta[key].publicUrl) {
    // Download from CDN
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(meta[key].publicUrl);
      if (!resp.ok) return res.status(404).json({ error: 'CDN download failed' });
      raw = Buffer.from(await resp.arrayBuffer());
    } catch (e) {
      return res.status(404).json({ error: 'File not found locally or on CDN' });
    }
  } else {
    return res.status(404).json({ error: 'File not found' });
  }
  try {
    const sharp = require('sharp');
    const oldExt = path.extname(key).toLowerCase();
    const newExt = '.' + (format === 'jpg' ? 'jpg' : format);
    if (oldExt === newExt) return res.json({ success: true, key, note: 'Already in this format' });
    const newKey = key.replace(/\.(jpg|jpeg|png|webp|gif)$/i, newExt);
    let pipeline = sharp(raw);
    if (format === 'jpg') {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 9 });
    } else {
      pipeline = pipeline.webp({ quality: 85, effort: 4 });
    }
    const converted = await pipeline.toBuffer();
    const newPath = path.join(OUTPUT_DIR, newKey);
    if (!fs.existsSync(path.dirname(newPath))) fs.mkdirSync(path.dirname(newPath), { recursive: true });
    fs.writeFileSync(newPath, converted);
    // Update metadata: copy old metadata to new key
    if (meta[key]) {
      meta[newKey] = { ...meta[key], publicUrl: null }; // CDN URL no longer valid for new format
    } else {
      meta[newKey] = {};
    }
    saveMetadata(meta);
    // Update VISUALS reference if this is a generated visual
    const visual = VISUALS.find(v => v.filename === key);
    if (visual) {
      visual.filename = newKey;
    }
    console.log(`[TEDxXinyi] Converted ${key} → ${newKey} (${(raw.length / 1024).toFixed(0)} KB → ${(converted.length / 1024).toFixed(0)} KB)`);
    res.json({ success: true, oldKey: key, newKey, before: raw.length, after: converted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const isSpeakerFolder = folder === 'speakers';
    const subFolder = folder && !isSpeakerFolder ? folder : null;
    const targetDir = isSpeakerFolder ? SPEAKERS_DIR : (subFolder ? path.join(OUTPUT_DIR, subFolder) : OUTPUT_DIR);
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

    // Always save metadata entry for uploaded file (so /media finds it)
    const metaKey = isSpeakerFolder ? `speakers/${safeName}` : (subFolder ? `${subFolder}/${safeName}` : safeName);
    {
      const meta = loadMetadata();
      if (!meta[metaKey]) meta[metaKey] = {};
      if (alt) meta[metaKey].alt = alt;
      meta[metaKey].uploadedAt = new Date().toISOString();
      saveMetadata(meta);
    }

    const ratio = ((1 - compressed.length / rawBuffer.length) * 100).toFixed(0);
    const urlPath = isSpeakerFolder ? `/tedx-xinyi/speakers/${safeName}` : (subFolder ? `/tedx-xinyi/${subFolder}/${safeName}` : `/tedx-xinyi/${safeName}`);
    console.log(`[TEDxXinyi] Upload: ${metaKey} — ${(rawBuffer.length / 1024).toFixed(0)} KB -> ${(compressed.length / 1024).toFixed(0)} KB (${ratio}% smaller)`);

    // Upload to mmdbfiles
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(compressed);
      savePublicUrl(metaKey, publicUrl, { source: isSpeakerFolder ? 'speaker' : 'uploaded' });
      updateWebpageImageUrl(safeName, isSpeakerFolder ? 'speakers' : (subFolder || ''), publicUrl);
      console.log(`[TEDxXinyi] ${metaKey} → ${publicUrl}`);
    } catch (uploadErr) {
      console.error(`[TEDxXinyi] mmdbfiles upload failed for ${safeName}:`, uploadErr.message);
    }

    res.json({ success: true, filename: safeName, path: urlPath, originalSize: rawBuffer.length, compressedSize: compressed.length, savings: `${ratio}%`, publicUrl });
  } catch (err) {
    console.error('[TEDxXinyi] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- API: replace image (archive old, set new as active) ----
router.post('/media/replace', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { key, data, alt } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    if (!data || !data.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid image data' });
    const match = data.match(/^data:image\/(jpeg|png|webp|gif);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Unsupported format' });
    const rawBuffer = Buffer.from(match[2], 'base64');
    if (rawBuffer.length > 25 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 25MB)' });

    const meta = loadMetadata();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const ext = path.extname(key);
    const base = key.replace(ext, '');
    const archiveKey = `${base}--archived-${ts}${ext}`;

    // Archive old file if it exists locally
    const oldPath = path.join(OUTPUT_DIR, key);
    if (fs.existsSync(oldPath)) {
      const archivePath = path.join(OUTPUT_DIR, archiveKey);
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      fs.copyFileSync(oldPath, archivePath);
      // Copy old metadata to archive key
      if (meta[key]) {
        meta[archiveKey] = { ...meta[key], archivedFrom: key, archivedAt: new Date().toISOString() };
      }
      console.log(`[TEDxXinyi] Archived ${key} → ${archiveKey}`);
    } else if (meta[key] && meta[key].publicUrl) {
      // No local file but has CDN URL — save archive metadata pointing to old CDN
      meta[archiveKey] = { ...meta[key], archivedFrom: key, archivedAt: new Date().toISOString() };
      console.log(`[TEDxXinyi] Archived metadata ${key} → ${archiveKey} (CDN-only)`);
    }

    // Write new file
    const sharp = require('sharp');
    const isSpeaker = key.startsWith('speakers/');
    const maxWidth = isSpeaker ? 800 : 1920;
    let compressed;
    if (ext === '.webp') {
      compressed = await sharp(rawBuffer).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    } else if (ext === '.png') {
      compressed = await sharp(rawBuffer).resize({ width: maxWidth, withoutEnlargement: true }).png({ quality: 80, compressionLevel: 9 }).toBuffer();
    } else {
      compressed = await sharp(rawBuffer).resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toBuffer();
    }
    const targetDir = path.dirname(path.join(OUTPUT_DIR, key));
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, key), compressed);

    // Update metadata for the active key
    if (!meta[key]) meta[key] = {};
    if (alt) meta[key].alt = alt;
    meta[key].replacedAt = new Date().toISOString();
    meta[key].publicUrl = null; // Clear old CDN URL since content changed
    saveMetadata(meta);

    // Upload new version to CDN
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(compressed);
      const parts = key.split('/');
      const filename = parts.pop();
      const folder = parts.join('/');
      savePublicUrl(key, publicUrl, { source: isSpeaker ? 'speaker' : 'uploaded' });
      updateWebpageImageUrl(filename, folder, publicUrl);
      console.log(`[TEDxXinyi] Replaced ${key} → CDN: ${publicUrl}`);
    } catch (uploadErr) {
      console.error(`[TEDxXinyi] CDN upload failed for replacement ${key}:`, uploadErr.message);
    }

    const ratio = ((1 - compressed.length / rawBuffer.length) * 100).toFixed(0);
    res.json({
      success: true, key, archiveKey,
      originalSize: rawBuffer.length, compressedSize: compressed.length, savings: `${ratio}%`,
      publicUrl,
    });
  } catch (err) {
    console.error('[TEDxXinyi] Replace error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- API: regenerate image using AI based on current image context ----
router.post('/media/regenerate', express.json(), async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured — cannot regenerate' });
  }

  const { key, instructions } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });

  try {
    const meta = loadMetadata();
    const metaEntry = meta[key] || {};

    // 1. Find matching VISUAL definition for prompt + dimensions
    const visual = VISUALS.find(v => v.filename === key);

    // 2. Determine dimensions and format from the key
    const ext = path.extname(key);
    const isSpeaker = key.startsWith('speakers/');
    const isPoster = key.includes('poster');
    // Speakers: 800x800 square, Poster: 4:5 portrait, default: 16:9 landscape
    let targetWidth = 1920, targetHeight = 1080, fit = 'cover';
    if (isSpeaker) { targetWidth = 800; targetHeight = 800; }
    else if (isPoster) { targetWidth = 1080; targetHeight = 1350; }

    // 3. Build regeneration prompt
    let prompt;
    if (visual) {
      // Use the original VISUAL prompt — best quality, already tuned
      prompt = visual.prompt;
    } else {
      // Build a prompt from metadata context
      const desc = metaEntry.description || metaEntry.alt || key.replace(/[-_./]/g, ' ').replace(/\.(webp|jpg|png|jpeg)$/, '');
      const aspect = isPoster ? '4:5 portrait' : (isSpeaker ? 'square 1:1' : 'wide 16:9');
      prompt = `Generate a high-quality ${aspect} image for the TEDxXinyi 2026 event website. `
        + `This image is used as: ${desc}. `
        + `Brand style: TEDx red (#E62B1E) accent, warm golden amber tones, deep blue-violet galaxy/space aesthetic, `
        + `cinematic photography feel, luminous hopeful mood, premium theatrical quality. `
        + `No text, no watermarks, no logos, no UI elements. `
        + `Mature, restrained, aspirational composition suitable for a professional event website.`;
    }

    // Append user instructions if provided
    if (instructions && instructions.trim()) {
      prompt += `\n\nAdditional instructions from the user: ${instructions.trim()}`;
    }

    console.log(`[TEDxXinyi] Regenerating: ${key} (${targetWidth}x${targetHeight})${instructions ? ' with custom instructions' : ''}`);

    // 4. Archive old version
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const base = key.replace(ext, '');
    const archiveKey = `${base}--archived-${ts}${ext}`;

    const oldPath = path.join(OUTPUT_DIR, key);
    if (fs.existsSync(oldPath)) {
      const archivePath = path.join(OUTPUT_DIR, archiveKey);
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      fs.copyFileSync(oldPath, archivePath);
      if (meta[key]) {
        meta[archiveKey] = { ...meta[key], archivedFrom: key, archivedAt: new Date().toISOString() };
      }
      console.log(`[TEDxXinyi] Archived ${key} → ${archiveKey}`);
    } else if (meta[key]?.publicUrl) {
      meta[archiveKey] = { ...meta[key], archivedFrom: key, archivedAt: new Date().toISOString() };
    }

    // 5. Generate new image via Gemini
    const rawBuffer = await generateVisual(client, prompt);

    // 6. Resize to target dimensions + compress
    const sharp = require('sharp');
    let compressed;
    if (ext === '.webp') {
      compressed = await sharp(rawBuffer).resize({ width: targetWidth, height: targetHeight, fit }).webp({ quality: 82, effort: 4 }).toBuffer();
    } else if (ext === '.png') {
      compressed = await sharp(rawBuffer).resize({ width: targetWidth, height: targetHeight, fit }).png({ quality: 80, compressionLevel: 9 }).toBuffer();
    } else {
      compressed = await sharp(rawBuffer).resize({ width: targetWidth, height: targetHeight, fit }).jpeg({ quality: 85, progressive: true }).toBuffer();
    }

    // 7. Write new file
    const targetDir = path.dirname(path.join(OUTPUT_DIR, key));
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, key), compressed);

    // 8. Update metadata
    if (!meta[key]) meta[key] = {};
    meta[key].regeneratedAt = new Date().toISOString();
    meta[key].source = 'ai-regenerated';
    meta[key].publicUrl = null; // Clear old CDN since content changed
    saveMetadata(meta);

    // 9. Upload to CDN
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(compressed);
      const parts = key.split('/');
      const filename = parts.pop();
      const folder = parts.join('/');
      savePublicUrl(key, publicUrl, { source: 'ai-regenerated' });
      updateWebpageImageUrl(filename, folder, publicUrl);
      console.log(`[TEDxXinyi] Regenerated ${key} → CDN: ${publicUrl}`);
    } catch (uploadErr) {
      console.error(`[TEDxXinyi] CDN upload failed for regenerated ${key}:`, uploadErr.message);
    }

    res.json({
      success: true, key, archiveKey,
      originalSize: rawBuffer.length,
      compressedSize: compressed.length,
      dimensions: `${targetWidth}x${targetHeight}`,
      publicUrl,
      hadVisualDef: !!visual,
    });
  } catch (err) {
    console.error(`[TEDxXinyi] Regenerate failed for ${key}:`, err.message);
    res.status(500).json({ error: err.message, key });
  }
});

// ---- API: archive image (deactivate, keep asset in storage) ----
router.post('/media/remove', express.json(), async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const meta = loadMetadata();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const ext = path.extname(key);
    const base = key.replace(ext, '');
    const archiveKey = `${base}--archived-${ts}${ext}`;

    // Move local file to archive name
    const filePath = path.join(OUTPUT_DIR, key);
    if (fs.existsSync(filePath)) {
      const archivePath = path.join(OUTPUT_DIR, archiveKey);
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      fs.renameSync(filePath, archivePath);
      console.log(`[TEDxXinyi] Archived ${key} → ${archiveKey}`);
    }

    // Move metadata to archive key
    if (meta[key]) {
      meta[archiveKey] = { ...meta[key], archivedFrom: key, archivedAt: new Date().toISOString() };
      delete meta[key];
    }
    saveMetadata(meta);

    res.json({ success: true, key, archiveKey, message: `Archived as ${archiveKey}` });
  } catch (err) {
    console.error('[TEDxXinyi] Archive error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Legacy speaker upload endpoint (still works)
router.post('/upload-speaker', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { speaker, data } = req.body;
    const validSpeakers = ['cheng-shi-jia', 'lin-dong-liang', 'liao-wei-jie', 'yang-shi-yi', 'dawn-chang'];
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
.card-url{margin-bottom:0.4rem;padding:0.25rem 0.4rem;background:#111;border-radius:4px;display:flex;align-items:center;gap:0.35rem;cursor:pointer;transition:background 0.15s}.card-url:hover{background:#1a2a1a}
.card-actions{display:flex;gap:0.25rem}
.tag{display:inline-block;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.65rem;font-weight:600}
.tag-gen{background:#1e293b;color:#60a5fa}.tag-up{background:#1c1917;color:#fb923c}.tag-spk{background:#14532d;color:#86efac}.tag-local{background:#3b2f1e;color:#fbbf24}.tag-cdn{background:#065f46;color:#6ee7b7}.tag-ext{background:#3b1f6e;color:#c4b5fd}.tag-db{background:#164e63;color:#67e8f9}
.card-local{border-color:#78350f55}
.card-missing{opacity:0.6;border-style:dashed;border-color:#333}
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
  <button class="btn btn-outline" id="regenMissingBtn" onclick="regenAllMissing()">Generate Missing</button>
  <button class="btn btn-outline" id="regenAllBtn" onclick="regenAll()">Generate All</button>
  <button class="btn btn-outline" id="compressAllBtn" onclick="compressAll()">Compress All</button>
  <button class="btn btn-outline" id="compressSelBtn" onclick="compressSelected()" disabled>Compress Selected</button>
  <button class="btn btn-outline" id="syncCdnBtn" onclick="syncCdn()" style="border-color:#065f46;color:#6ee7b7">Sync All → CDN</button>
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
    const key = img.key || (img.folder ? img.folder + '/' + img.filename : img.filename);
    const sel = selectedKeys.has(key) ? ' selected' : '';
    const sourceTag = img.source === 'generated' ? '<span class="tag tag-gen">Generated</span>'
              : img.source === 'speaker' ? '<span class="tag tag-spk">Speaker</span>'
              : img.source === 'external' ? '<span class="tag tag-ext">External</span>'
              : img.source === 'db-restored' ? '<span class="tag tag-db">DB Restored</span>'
              : img.source === 'local' ? '<span class="tag tag-up">Local File</span>'
              : '<span class="tag tag-up">Uploaded</span>';
    const hasCdn = !!img.publicUrl;
    const hasLocal = !!img.localExists;
    const id = img.filename.replace(/\\.webp$|\\.png$|\\.jpg$|\\.jpeg$/, '');

    // Status badge: CDN / Local Only / Missing
    const statusBadge = hasCdn && hasLocal
      ? '<span class="tag tag-cdn">CDN</span> <span class="tag tag-local">Local</span>'
      : hasCdn
      ? '<span class="tag tag-cdn">CDN</span>'
      : hasLocal
      ? '<span class="tag tag-local">Local Only</span>'
      : '<span class="tag" style="background:#7f1d1d;color:#fca5a5">Missing</span>';

    // ---- MISSING: neither CDN nor local ----
    if (img.missing) {
      const desc = img.description || '';
      const isGenerated = img.source === 'generated';
      return '<div class="card card-missing" data-key="' + key + '">' +
        '<div class="card-img" style="background:#0d0d0d;flex-direction:column;gap:0.4rem">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
          '<span style="color:#555;font-size:0.65rem;text-align:center;padding:0 0.5rem">' + (desc || 'No image') + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-filename" style="color:#888">' + img.filename + ' ' + statusBadge + ' ' + sourceTag + '</div>' +
          '<div class="card-actions" style="margin-top:0.4rem">' +
            (isGenerated ? '<button class="btn btn-red btn-sm" onclick="regenOne(\\'' + id + '\\',this)">Generate</button>' : '') +
            '<button class="btn btn-outline btn-sm" onclick="openUploadFor(\\'' + key + '\\')">Upload</button>' +
          '</div>' +
        '</div></div>';
    }

    // ---- HAS image (CDN and/or local) ----
    // Prefer CDN URL for display; fall back to local path
    const localPath = img.folder ? '/tedx-xinyi/' + img.folder + '/' + img.filename : '/tedx-xinyi/' + img.filename;
    const imgSrc = hasCdn ? img.publicUrl : localPath;
    const cardClass = hasCdn ? '' : ' card-local';

    // CDN URL row (or "Upload to CDN" prompt)
    const cdnRow = hasCdn
      ? '<div class="card-url" onclick="copyUrl(\\'' + img.publicUrl + '\\')" title="Click to copy CDN URL">' +
          '<span class="tag tag-cdn" style="cursor:pointer">CDN</span> ' +
          '<span style="font-size:0.65rem;color:#888;word-break:break-all;cursor:pointer">' + img.publicUrl + '</span>' +
        '</div>'
      : '<div class="card-url" style="border:1px dashed #78350f55;border-radius:4px">' +
          '<span class="tag tag-local">Local Only</span> ' +
          '<span style="font-size:0.65rem;color:#78350f">Not on CDN yet</span>' +
        '</div>';

    return '<div class="card' + cardClass + sel + '" data-key="' + key + '">' +
      '<div class="card-check" onclick="toggleSelect(event,\\'' + key + '\\')">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<div class="card-img"><img src="' + imgSrc + '" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\'"><div class="placeholder" style="display:none">?</div></div>' +
      '<div class="card-body">' +
        '<div class="card-filename">' + img.filename + ' ' + statusBadge + ' ' + sourceTag + '</div>' +
        cdnRow +
        '<textarea class="card-alt" rows="1" placeholder="Alt text..." data-key="' + key + '" onfocus="this.rows=2" onblur="this.rows=1;saveAlt(this)">' + (img.alt || '') + '</textarea>' +
        '<div class="card-actions">' +
          (img.source === 'generated' ? '<button class="btn btn-outline btn-sm" onclick="regenOne(\\'' + id + '\\',this)">Regenerate</button>' : '') +
          (!hasCdn ? '<button class="btn btn-outline btn-sm" style="border-color:#065f46;color:#6ee7b7" onclick="uploadOneToCdn(\\'' + key + '\\',this)">Upload → CDN</button>' : '') +
          '<select class="btn btn-outline btn-sm" style="padding:2px 6px;font-size:0.65rem;cursor:pointer" onchange="convertFormat(\\'' + key + '\\',this.value,this);this.selectedIndex=0"><option value="">Convert →</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

function updateStats() {
  const total = mediaItems.length;
  const onCdn = mediaItems.filter(i => !!i.publicUrl).length;
  const localOnly = mediaItems.filter(i => !i.publicUrl && i.localExists).length;
  const missing = mediaItems.filter(i => i.missing).length;
  const visuals = mediaItems.filter(i => i.source === 'generated').length;
  const speakers = mediaItems.filter(i => i.source === 'speaker').length;
  const external = mediaItems.filter(i => i.source === 'external').length;
  const dbRestored = mediaItems.filter(i => i.source === 'db-restored').length;
  const parts = [total + ' assets'];
  parts.push(onCdn + ' on CDN');
  if (localOnly) parts.push(localOnly + ' local only');
  if (missing) parts.push(missing + ' missing');
  const breakdown = [visuals + ' visuals', speakers + ' speakers'];
  if (external) breakdown.push(external + ' external');
  if (dbRestored) breakdown.push(dbRestored + ' db-restored');
  parts.push(breakdown.join(', '));
  document.getElementById('stats').textContent = parts.join(' | ');
  document.getElementById('compressSelBtn').disabled = selectedKeys.size === 0;
}

async function regenOne(id, btn) {
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const r = await authFetch('/api/tedx-xinyi/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    const d = await r.json();
    if (r.ok) { showToast('Generated: ' + (d.filename || id) + (d.publicUrl ? ' → CDN uploaded' : '')); if (d.publicUrl) copyUrl(d.publicUrl); loadMedia(); }
    else { showToast('Error: ' + (d.error || 'Failed'), true); btn.disabled = false; btn.textContent = 'Regenerate'; }
  } catch(e) { showToast(e.message, true); btn.disabled = false; btn.textContent = 'Regenerate'; }
}

async function regenAllMissing() {
  const missing = mediaItems.filter(i => i.missing);
  if (!missing.length) { showToast('No missing images'); return; }
  const btn = document.getElementById('regenMissingBtn');
  btn.disabled = true;
  for (let i = 0; i < missing.length; i++) {
    const img = missing[i];
    const id = img.filename.replace(/\\.webp$|\\.png$|\\.jpg$/, '');
    btn.textContent = (i+1) + '/' + missing.length + '...';
    try {
      await authFetch('/api/tedx-xinyi/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    } catch(e) { /* continue */ }
    await new Promise(r => setTimeout(r, 500));
  }
  showToast('Generated ' + missing.length + ' images');
  btn.disabled = false; btn.textContent = 'Generate Missing';
  loadMedia();
}

async function regenAll() {
  const generated = mediaItems.filter(i => i.source === 'generated');
  if (!generated.length) { showToast('No generated visuals defined'); return; }
  if (!confirm('Regenerate all ' + generated.length + ' AI visuals? This uses Gemini API credits.')) return;
  const btn = document.getElementById('regenAllBtn');
  btn.disabled = true;
  for (let i = 0; i < generated.length; i++) {
    const img = generated[i];
    const id = img.filename.replace(/\\.webp$|\\.png$|\\.jpg$/, '');
    btn.textContent = (i+1) + '/' + generated.length + '...';
    try {
      await authFetch('/api/tedx-xinyi/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    } catch(e) { /* continue */ }
    await new Promise(r => setTimeout(r, 500));
  }
  showToast('Generated ' + generated.length + ' images');
  btn.disabled = false; btn.textContent = 'Generate All';
  loadMedia();
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

async function syncCdn() {
  const btn = document.getElementById('syncCdnBtn');
  btn.disabled = true; btn.textContent = 'Syncing to CDN...';
  try {
    const r = await authFetch('/api/tedx-xinyi/sync-cdn', { method:'POST' });
    const d = await r.json();
    if (r.ok) {
      showToast('CDN sync: ' + d.summary.uploaded + ' uploaded, ' + d.summary.existing + ' existing, ' + d.summary.errors + ' errors (' + (d.summary.localFilesFound || 0) + ' local files found)');
      loadMedia();
    } else { showToast('Error: ' + (d.error || 'Sync failed'), true); }
  } catch(e) { showToast(e.message, true); }
  btn.disabled = false; btn.textContent = 'Sync All → CDN';
}

async function uploadOneToCdn(key, btn) {
  btn.disabled = true; btn.textContent = 'Uploading...';
  try {
    const r = await authFetch('/api/tedx-xinyi/sync-cdn-one', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key }) });
    const d = await r.json();
    if (r.ok && d.publicUrl) {
      showToast('Uploaded to CDN: ' + d.publicUrl);
      copyUrl(d.publicUrl);
      loadMedia();
    } else { showToast('Error: ' + (d.error || 'Upload failed'), true); btn.disabled = false; btn.textContent = 'Upload → CDN'; }
  } catch(e) { showToast(e.message, true); btn.disabled = false; btn.textContent = 'Upload → CDN'; }
}

async function convertFormat(key, format, sel) {
  if (!format) return;
  sel.disabled = true;
  try {
    const r = await authFetch('/api/tedx-xinyi/media/convert', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key, format }) });
    const d = await r.json();
    if (r.ok) {
      if (d.note) { showToast(d.note); }
      else { showToast('Converted ' + d.oldKey + ' → ' + d.newKey); loadMedia(); }
    } else { showToast('Error: ' + (d.error || 'Convert failed'), true); }
  } catch(e) { showToast(e.message, true); }
  sel.disabled = false; sel.selectedIndex = 0;
}

function openUpload() { document.getElementById('uploadModal').classList.add('open'); }
function closeUpload() { document.getElementById('uploadModal').classList.remove('open'); document.getElementById('uploadPreview').innerHTML = '<span style="color:#444;font-size:0.85rem">Select a file</span>'; document.getElementById('uploadFolder').value = ''; document.getElementById('uploadName').value = ''; }
function openUploadFor(key) {
  const parts = key.split('/');
  const filename = parts.pop();
  const folder = parts.join('/');
  openUpload();
  if (folder === 'speakers') document.getElementById('uploadFolder').value = 'speakers';
  document.getElementById('uploadName').value = filename;
}

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
      showToast('Uploaded: ' + d.filename + (d.publicUrl ? ' → CDN: ' + d.publicUrl : ''));
      if (d.publicUrl) copyUrl(d.publicUrl);
      closeUpload(); document.getElementById('uploadFile').value = ''; document.getElementById('uploadName').value = ''; document.getElementById('uploadAlt').value = '';
      loadMedia();
    } else { showToast('Error: ' + d.error, true); }
  } catch(e) { showToast(e.message, true); }
  btn.disabled = false; btn.textContent = 'Upload';
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => showToast('Copied: ' + url)).catch(() => { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); showToast('Copied: ' + url); });
}

function showToast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (err ? 'err' : 'ok');
  const dur = msg.length > 60 ? 5000 : 3000;
  setTimeout(() => { t.className = 'toast'; }, dur);
}
</script>
</body></html>`;

// ==================== MMDBFILES UPLOAD ====================

/**
 * Convert image buffer to JPEG base64, then upload to mmdbfiles.
 * Always converts to JPEG for CDN compatibility.
 * Returns the public_url from the response.
 */
async function uploadToMmdb(imageBuffer) {
  const fetch = (await import('node-fetch')).default;
  const sharp = require('sharp');

  // Always convert to JPEG for CDN
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

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`mmdbfiles upload failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('mmdbfiles upload returned success: false');
  }

  console.log(`[TEDxXinyi] Uploaded to mmdbfiles: ${data.public_url} (${(data.size / 1024).toFixed(0)} KB)`);
  return data.public_url;
}

/**
 * Save the mmdbfiles public URL for an image key in metadata.
 */
function savePublicUrl(key, publicUrl, extra = {}) {
  const meta = loadMetadata();
  if (!meta[key]) meta[key] = {};
  meta[key].publicUrl = publicUrl;
  saveMetadata(meta);
  // Persist to DB so URL survives Fly.dev restarts
  saveMediaUrlToDb(key, publicUrl, { alt: meta[key].alt, source: extra.source, description: extra.description }).catch(() => {});
}

// ==================== WEBPAGE URL UPDATE ====================

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * After generate/upload, replace local image paths in webpage TSX files
 * with the mmdbfiles CDN URL so the site serves from CDN.
 */
function updateWebpageImageUrl(filename, folder, publicUrl) {
  if (!publicUrl) return;
  const localPath = folder ? `/tedx-xinyi/${folder}/${filename}` : `/tedx-xinyi/${filename}`;

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanDir(full);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        let content = fs.readFileSync(full, 'utf8');
        let changed = false;
        // Replace relative paths: /tedx-xinyi/filename
        if (content.includes(localPath)) {
          content = content.replace(new RegExp(escapeRegExp(localPath), 'g'), publicUrl);
          changed = true;
        }
        // Replace full URLs in metadata: https://5ml-agenticai-v1.fly.dev/tedx-xinyi/filename
        const fullUrl = `https://5ml-agenticai-v1.fly.dev${localPath}`;
        if (content.includes(fullUrl)) {
          content = content.replace(new RegExp(escapeRegExp(fullUrl), 'g'), publicUrl);
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(full, content);
          console.log(`[TEDxXinyi] Updated webpage: ${path.basename(dir)}/${entry} — ${localPath} → ${publicUrl}`);
        }
      }
    }
  };

  try {
    scanDir(PAGES_DIR);
  } catch (err) {
    console.error(`[TEDxXinyi] Failed to update webpage URLs:`, err.message);
  }
}

/**
 * Batch: upload ALL local images to mmdbfiles and replace ALL local paths
 * in TSX source files with CDN URLs. This is the one-shot migration.
 */
async function uploadAllAndReplacePaths() {
  const results = [];
  const meta = loadMetadata();
  const imgRe = /\.(jpg|jpeg|png|webp|gif)$/i;

  // Collect all local images
  const images = [];
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      const full = path.join(OUTPUT_DIR, f);
      if (fs.statSync(full).isFile() && imgRe.test(f)) {
        images.push({ key: f, filename: f, folder: '', fullPath: full });
      }
    }
    for (const dir of fs.readdirSync(OUTPUT_DIR)) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        for (const f of fs.readdirSync(dirPath)) {
          const full = path.join(dirPath, f);
          if (fs.statSync(full).isFile() && imgRe.test(f)) {
            images.push({ key: `${dir}/${f}`, filename: f, folder: dir, fullPath: full });
          }
        }
      }
    }
  }

  for (const img of images) {
    // Skip if already has a CDN URL
    if (meta[img.key] && meta[img.key].publicUrl) {
      // Still update the TSX pages with existing CDN URL
      updateWebpageImageUrl(img.filename, img.folder, meta[img.key].publicUrl);
      results.push({ key: img.key, status: 'already_uploaded', publicUrl: meta[img.key].publicUrl });
      continue;
    }
    try {
      const buffer = fs.readFileSync(img.fullPath);
      const publicUrl = await uploadToMmdb(buffer);
      savePublicUrl(img.key, publicUrl, { source: img.folder === 'speakers' ? 'speaker' : 'generated' });
      updateWebpageImageUrl(img.filename, img.folder, publicUrl);
      results.push({ key: img.key, status: 'uploaded', publicUrl });
    } catch (err) {
      results.push({ key: img.key, status: 'error', error: err.message });
    }
  }

  // Also update pages using CDN URLs from metadata (for images not on local disk)
  const latestMeta = loadMetadata();
  for (const [key, data] of Object.entries(latestMeta)) {
    if (key.startsWith('_')) continue;
    if (data && data.publicUrl && !images.find(i => i.key === key)) {
      const parts = key.split('/');
      const filename = parts.pop();
      const folder = parts.join('/');
      updateWebpageImageUrl(filename, folder, data.publicUrl);
      results.push({ key, status: 'page_updated_from_metadata', publicUrl: data.publicUrl });
    }
  }

  // Update speaker CDN URL map in salon/page.tsx
  const speakerUrls = {};
  for (const [key, data] of Object.entries(latestMeta)) {
    if (key.startsWith('speakers/') && data && data.publicUrl) {
      // key = "speakers/cheng-shi-jia.jpg" → imageId = "cheng-shi-jia"
      const basename = key.replace('speakers/', '').replace(/\.(jpg|jpeg|png|webp)$/i, '');
      speakerUrls[basename] = data.publicUrl;
    }
  }
  if (Object.keys(speakerUrls).length > 0) {
    try {
      const salonPath = path.join(PAGES_DIR, 'salon', 'page.tsx');
      if (fs.existsSync(salonPath)) {
        let content = fs.readFileSync(salonPath, 'utf8');
        const mapStr = JSON.stringify(speakerUrls, null, 2)
          .replace(/"/g, "'")
          .replace(/'([^']+)':/g, "'$1':");
        const newMap = `const SPEAKER_CDN_URLS: Record<string, string> = ${mapStr};`;
        content = content.replace(
          /const SPEAKER_CDN_URLS: Record<string, string> = \{[^}]*\};/,
          newMap
        );
        fs.writeFileSync(salonPath, content);
        console.log(`[TEDxXinyi] Updated SPEAKER_CDN_URLS with ${Object.keys(speakerUrls).length} speakers`);
      }
    } catch (err) {
      console.error('[TEDxXinyi] Failed to update speaker CDN map:', err.message);
    }
  }

  // Update IMAGE_CDN_URLS in homepage page.tsx (hero + entry card images)
  const imageUrls = {};
  for (const [key, data] of Object.entries(latestMeta)) {
    if (key.startsWith('speakers/') || key.startsWith('_')) continue;
    if (data && data.publicUrl) {
      // key = "hero-home.webp" → mapKey = "hero-home"
      const mapKey = key.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
      imageUrls[mapKey] = data.publicUrl;
    }
  }
  if (Object.keys(imageUrls).length > 0) {
    try {
      const homePath = path.join(PAGES_DIR, 'page.tsx');
      if (fs.existsSync(homePath)) {
        let content = fs.readFileSync(homePath, 'utf8');
        const mapStr = JSON.stringify(imageUrls, null, 2)
          .replace(/"/g, "'")
          .replace(/'([^']+)':/g, "'$1':");
        const newMap = `const IMAGE_CDN_URLS: Record<string, string> = ${mapStr};`;
        content = content.replace(
          /const IMAGE_CDN_URLS: Record<string, string> = \{[^}]*\};/s,
          newMap
        );
        fs.writeFileSync(homePath, content);
        console.log(`[TEDxXinyi] Updated IMAGE_CDN_URLS with ${Object.keys(imageUrls).length} images`);
      }
    } catch (err) {
      console.error('[TEDxXinyi] Failed to update homepage CDN map:', err.message);
    }
  }

  return results;
}

// ---- API: batch upload all images to mmdbfiles and update pages ----
router.post('/sync-cdn', async (req, res) => {
  try {
    console.log(`[TEDxXinyi] Starting batch CDN sync... OUTPUT_DIR=${OUTPUT_DIR}`);
    // Pre-check: count local files
    const imgRe = /\.(jpg|jpeg|png|webp|gif)$/i;
    let localCount = 0;
    if (fs.existsSync(OUTPUT_DIR)) {
      for (const f of fs.readdirSync(OUTPUT_DIR)) {
        if (f.startsWith('.')) continue;
        const full = path.join(OUTPUT_DIR, f);
        if (fs.statSync(full).isFile() && imgRe.test(f)) localCount++;
        else if (fs.statSync(full).isDirectory()) {
          for (const sf of fs.readdirSync(full)) {
            if (fs.statSync(path.join(full, sf)).isFile() && imgRe.test(sf)) localCount++;
          }
        }
      }
    }
    console.log(`[TEDxXinyi] Found ${localCount} local image files to sync`);
    const results = await uploadAllAndReplacePaths();
    const uploaded = results.filter(r => r.status === 'uploaded').length;
    const existing = results.filter(r => r.status === 'already_uploaded').length;
    const pageUpdated = results.filter(r => r.status === 'page_updated_from_metadata').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log(`[TEDxXinyi] CDN sync done: ${uploaded} uploaded, ${existing} already had CDN, ${pageUpdated} page-updated, ${errors} errors (${localCount} local files found)`);
    res.json({ success: true, results, summary: { uploaded, existing, pageUpdated, errors, total: results.length, localFilesFound: localCount } });
  } catch (err) {
    console.error('[TEDxXinyi] CDN sync failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- API: upload a single local file to CDN ----
router.post('/sync-cdn-one', express.json(), async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const filePath = path.join(OUTPUT_DIR, key);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: `File not found locally: ${key}` });
  try {
    const buffer = fs.readFileSync(filePath);
    const parts = key.split('/');
    const filename = parts.pop();
    const folder = parts.join('/');
    const publicUrl = await uploadToMmdb(buffer);
    savePublicUrl(key, publicUrl);
    updateWebpageImageUrl(filename, folder, publicUrl);
    console.log(`[TEDxXinyi] Single CDN sync: ${key} → ${publicUrl}`);
    res.json({ success: true, key, publicUrl });
  } catch (err) {
    console.error(`[TEDxXinyi] CDN upload failed for ${key}:`, err.message);
    res.status(500).json({ error: err.message });
  }
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
        const rawBuffer = Buffer.from(imageData.data, 'base64');
        // Resize to 1920×1080 (16:9) + compress to JPEG
        try {
          const sharp = require('sharp');
          const jpegBuffer = await sharp(rawBuffer)
            .resize({ width: 1920, height: 1080, fit: 'cover' })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          console.log(`[TEDxXinyi] Optimized: ${(rawBuffer.length / 1024).toFixed(0)} KB → ${(jpegBuffer.length / 1024).toFixed(0)} KB JPEG (${((1 - jpegBuffer.length / rawBuffer.length) * 100).toFixed(0)}% smaller)`);
          return jpegBuffer;
        } catch {
          return rawBuffer;
        }
      }
    }
  }

  throw new Error('No image in Gemini response');
}

// ==================== PUBLISH HTML PACK ====================

router.post('/publish-html-pack', async (req, res) => {
  const { execSync } = require('child_process');
  const archiver = require('archiver');
  const FRONTEND_DIR = path.join(__dirname, '../../../frontend');
  const OUT_DIR = path.join(FRONTEND_DIR, 'out');
  const TEDX_OUT = path.join(OUT_DIR, 'vibe-demo', 'tedx-xinyi');
  const TEDX_HOME_HTML = path.join(OUT_DIR, 'vibe-demo', 'tedx-xinyi.html');
  const NEXT_DIR = path.join(OUT_DIR, '_next');
  const PUBLIC_IMAGES = path.join(FRONTEND_DIR, 'public', 'tedx-xinyi');

  try {
    // 1. Use existing build output if available (avoids OOM on small Fly.dev machines)
    if (fs.existsSync(OUT_DIR) && fs.existsSync(path.join(OUT_DIR, '_next'))) {
      console.log('[TEDxXinyi] Publish: using existing build output');
    } else {
      // Only rebuild if out/ doesn't exist — this can OOM on small machines
      console.log('[TEDxXinyi] Publish: no existing build, running npm run build …');
      execSync('npm run build', { cwd: FRONTEND_DIR, timeout: 180000, stdio: 'pipe' });
      console.log('[TEDxXinyi] Publish: build complete');
    }

    // 2. Verify output exists
    if (!fs.existsSync(TEDX_OUT)) {
      return res.status(500).json({ error: 'Build output not found' });
    }

    // 3. Stream ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="tedx-xinyi-${Date.now()}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    // Collect sub-pages (exclude admin.html)
    const EXCLUDE_PAGES = new Set(['admin']);
    const htmlFiles = fs.existsSync(TEDX_OUT)
      ? fs.readdirSync(TEDX_OUT).filter(f => f.endsWith('.html') && !EXCLUDE_PAGES.has(f.replace('.html', '')))
      : [];

    // Homepage at vibe-demo/tedx-xinyi/index.html (matches the URL structure baked into Next.js output)
    if (fs.existsSync(TEDX_HOME_HTML)) {
      archive.file(TEDX_HOME_HTML, { name: 'vibe-demo/tedx-xinyi/index.html' });
    }

    // Sub-pages at vibe-demo/tedx-xinyi/<page>.html
    for (const f of htmlFiles) {
      archive.file(path.join(TEDX_OUT, f), { name: `vibe-demo/tedx-xinyi/${f}` });
    }

    // _next/ static assets (JS, CSS) — at root since HTML references /_next/...
    if (fs.existsSync(NEXT_DIR)) {
      archive.directory(NEXT_DIR, '_next');
    }

    // tedx-xinyi/ images from public folder — at root since HTML references /tedx-xinyi/...
    if (fs.existsSync(PUBLIC_IMAGES)) {
      archive.directory(PUBLIC_IMAGES, 'tedx-xinyi');
    }

    // index.php — PHP router for Apache/PHP hosting
    const phpPages = htmlFiles.map(f => f.replace('.html', ''));
    const phpRouter = `<?php
/**
 * TEDxXinyi — PHP Router
 * Drop this folder on any Apache + PHP host. No Python or Node needed.
 *
 * Supports clean URLs with the /vibe-demo/tedx-xinyi/ prefix that
 * Next.js bakes into all internal links:
 *   /vibe-demo/tedx-xinyi/        → homepage
 *   /vibe-demo/tedx-xinyi/salon   → salon page
 *   /vibe-demo/tedx-xinyi/about   → about page
 *   /_next/...                    → static JS/CSS assets
 *   /tedx-xinyi/...               → images
 *
 * For Apache: add .htaccess (included) to enable clean URLs.
 * For PHP built-in server: php -S localhost:8000 index.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Static files — serve directly (handles /_next/, /tedx-xinyi/, etc.)
if ($uri !== '' && file_exists(__DIR__ . $uri)) {
    $ext = pathinfo($uri, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
    ];
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile(__DIR__ . $uri);
    return;
}

// Strip /vibe-demo/tedx-xinyi prefix (Next.js bakes this into all links)
$prefix = '/vibe-demo/tedx-xinyi';
$page_uri = (strpos($uri, $prefix) === 0) ? substr($uri, strlen($prefix)) : $uri;
$page_uri = ltrim(rtrim($page_uri, '/'), '/');

// Clean URL routing
$pages = [${phpPages.map(p => `'${p}'`).join(', ')}];

if ($page_uri === '' || $page_uri === 'index') {
    include __DIR__ . '/vibe-demo/tedx-xinyi/index.html';
} elseif (in_array($page_uri, $pages) && file_exists(__DIR__ . '/vibe-demo/tedx-xinyi/' . $page_uri . '.html')) {
    include __DIR__ . '/vibe-demo/tedx-xinyi/' . $page_uri . '.html';
} else {
    http_response_code(404);
    include __DIR__ . '/vibe-demo/tedx-xinyi/index.html';
}
`;
    archive.append(phpRouter, { name: 'index.php' });

    // .htaccess — Apache rewrite rules for clean URLs
    const htaccess = `# TEDxXinyi — Apache rewrite rules
RewriteEngine On
RewriteBase /

# Serve existing files directly
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Serve existing directories directly
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route clean URLs through index.php
RewriteRule ^ index.php [L]
`;
    archive.append(htaccess, { name: '.htaccess' });

    // manifest.json
    const manifest = {
      name: 'TEDxXinyi Static HTML + PHP Pack',
      built: new Date().toISOString(),
      pages: ['vibe-demo/tedx-xinyi/index.html', ...htmlFiles.map(f => `vibe-demo/tedx-xinyi/${f}`)],
      phpRouter: 'index.php',
      htaccess: '.htaccess',
      usage: {
        apache: 'Upload entire folder to Apache web root. .htaccess + index.php handle routing for /vibe-demo/tedx-xinyi/ URLs.',
        phpBuiltIn: 'php -S localhost:8000 index.php  (then open http://localhost:8000/vibe-demo/tedx-xinyi/)',
        staticOnly: 'Open vibe-demo/tedx-xinyi/index.html directly. Navigation links won\'t work without a server.',
      },
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    await archive.finalize();
    console.log(`[TEDxXinyi] Publish: ZIP streamed (${archive.pointer()} bytes)`);
  } catch (err) {
    console.error('[TEDxXinyi] Publish failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ==================== SOCIAL MEDIA POSTS ====================

const SOCIAL_POSTS_PATH = path.join(__dirname, '.social-posts.json');

function loadSocialPostsFromFile() {
  try {
    if (fs.existsSync(SOCIAL_POSTS_PATH)) {
      return JSON.parse(fs.readFileSync(SOCIAL_POSTS_PATH, 'utf8'));
    }
  } catch { /* ignore */ }
  return [];
}

function saveSocialPostsToFile(posts) {
  try {
    fs.writeFileSync(SOCIAL_POSTS_PATH, JSON.stringify(posts, null, 2));
  } catch { /* ignore */ }
}

// Load from DB first, fall back to file
async function loadSocialPosts() {
  const dbPosts = await loadSocialPostsFromDb();
  if (dbPosts && dbPosts.length > 0) return dbPosts;
  // Fall back to file (and migrate to DB if possible)
  const filePosts = loadSocialPostsFromFile();
  if (filePosts.length > 0) {
    for (const p of filePosts) {
      if (!p.imagePrompt) p.imagePrompt = '';
      await saveSocialPostToDb(p);
    }
  }
  return filePosts;
}

// Save to both DB and file
async function saveSocialPosts(posts) {
  saveSocialPostsToFile(posts);
  for (const p of posts) {
    await saveSocialPostToDb(p);
  }
}

// TEDx Xinyi event context for AI prompts
const TEDX_EVENT_CONTEXT = `
Event: TEDxXinyi 2026 — "We Are Becoming"
Theme: AI時代趨勢沙龍 (AI Era Trend Salon)
Tagline: AI 時代，每天學著重來，日常活出新精彩。(In the AI era, learn to start fresh every day, live out new brilliance in daily life.)
Date: March 31, 2026 (Tuesday)
Venue: 台北表演藝術中心 藍盒子 (Taipei Performing Arts Center, Blue Box)
Location: Taipei, Taiwan

Speakers:
- 程世嘉 (Sega Cheng) — iKala co-founder & CEO, Stanford CS, ex-Google. Topic: AI趨勢, humanistic thinking in AI era
- 林東良 (Lin Dong-Liang) — Kuroshio Ocean Education Foundation CEO. Topic: Ocean ecology × AI environment
- 廖唯傑 (Liao Wei-Jie) — Education × Technology cross-discipline. Topic: Building a 100-year sustainable business
- 楊士毅 (Yang Shi-Yi) — Paper-cutting artist, director, photographer. Apple Taipei 101 flagship 75m artwork. Topic: 幸福沒有門檻 (Happiness has no threshold)

Core Values:
- Pulling AI back to human feelings and choices
- Learning to keep learning through massive change
- Dialogue on a real city stage (Blue Box, not a hotel conference room)

Program: Morning talks (4×18 min), experience zones (meditation, art, sustainability food, ocean education), afternoon discovery sessions

Brand Style: TEDx red (#E62B1E), warm golden amber, deep blue-violet galaxy aesthetic, cinematic feel, luminous hopeful mood
Website: https://5ml-agenticai-v1.fly.dev/vibe-demo/tedx-xinyi
Instagram: @tedxxinyi
`.trim();

// ---- List all social posts ----
router.get('/social/posts', async (req, res) => {
  try {
    const posts = await loadSocialPosts();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Create a new empty post slot ----
router.post('/social/posts', express.json(), async (req, res) => {
  try {
    const posts = await loadSocialPosts();
    const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const post = {
      id,
      copy: '',
      comment: '',
      imagePrompt: '',
      imageUrl: null,
      platform: req.body.platform || 'instagram',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts.unshift(post);
    await saveSocialPosts(posts);
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Update a post (copy, comment, imagePrompt, platform) ----
router.put('/social/posts/:id', express.json(), async (req, res) => {
  try {
    const posts = await loadSocialPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    const { copy, comment, imagePrompt, platform } = req.body;
    if (copy !== undefined) posts[idx].copy = copy;
    if (comment !== undefined) posts[idx].comment = comment;
    if (imagePrompt !== undefined) posts[idx].imagePrompt = imagePrompt;
    if (platform !== undefined) posts[idx].platform = platform;
    posts[idx].updatedAt = new Date().toISOString();
    await saveSocialPosts(posts);
    res.json({ post: posts[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Delete a post ----
router.delete('/social/posts/:id', async (req, res) => {
  try {
    let posts = await loadSocialPosts();
    const deletedId = req.params.id;
    posts = posts.filter(p => p.id !== deletedId);
    await saveSocialPosts(posts);
    await deleteSocialPostFromDb(deletedId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate copy with DeepSeek ----
router.post('/social/generate-copy', express.json(), async (req, res) => {
  const { postId, comment, existingCopy, platform } = req.body;

  try {
    const deepseek = require('../../../services/deepseekService');
    if (!deepseek.isAvailable()) {
      return res.status(503).json({ error: 'DeepSeek API key not configured' });
    }

    let userPrompt;
    if (existingCopy && comment) {
      // Regenerate with feedback
      userPrompt = `Here is an existing social media post draft:\n\n---\n${existingCopy}\n---\n\nThe user wants this revision:\n"${comment}"\n\nPlease rewrite the post incorporating this feedback. Return ONLY the updated post copy, nothing else.`;
    } else {
      // Generate fresh
      userPrompt = `Write a compelling ${platform || 'Instagram'} post to promote this TEDx event. The post should be engaging, inspire curiosity, and drive ticket interest. Include relevant hashtags. Use a mix of Chinese and English where natural. Return ONLY the post copy, nothing else.`;
    }

    const systemPrompt = `You are a social media copywriter for TEDxXinyi, a TEDx event in Taipei. Write in a warm, inspiring, authentic voice that matches TEDx's tone — thought-provoking, human-centered, optimistic but not cheesy.

${TEDX_EVENT_CONTEXT}

Guidelines:
- Keep it concise and punchy for ${platform || 'Instagram'}
- Use a mix of Traditional Chinese and English naturally
- Include 5-8 relevant hashtags at the end
- Use line breaks for readability
- Tone: warm, curious, forward-looking
- DO NOT use placeholder brackets like [something] — write complete, ready-to-post copy`;

    const result = await deepseek.analyze(systemPrompt, userPrompt, {
      model: 'deepseek-chat',
      maxTokens: 1000,
      temperature: 0.8,
    });

    // Save the generated copy to the post
    if (postId) {
      const posts = await loadSocialPosts();
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        posts[idx].copy = result.content;
        posts[idx].comment = '';
        posts[idx].updatedAt = new Date().toISOString();
        await saveSocialPosts(posts);
      }
    }

    res.json({ copy: result.content, model: result.model, usage: result.usage });
  } catch (err) {
    console.error('[TEDxXinyi] Generate copy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate image prompt from copy with DeepSeek ----
router.post('/social/generate-image-prompt', express.json(), async (req, res) => {
  const { postId, copy, comment, existingPrompt } = req.body;
  if (!copy) return res.status(400).json({ error: 'copy is required to generate an image prompt' });

  try {
    const deepseek = require('../../../services/deepseekService');
    if (!deepseek.isAvailable()) {
      return res.status(503).json({ error: 'DeepSeek API key not configured' });
    }

    let userPrompt;
    if (existingPrompt && comment) {
      userPrompt = `Here is an existing image generation prompt:\n\n---\n${existingPrompt}\n---\n\nThe user wants this revision:\n"${comment}"\n\nPlease rewrite the image prompt incorporating this feedback. Return ONLY the updated image prompt, nothing else.`;
    } else {
      userPrompt = `Based on this social media post copy, create a detailed image generation prompt for an Instagram post image (1080x1080):\n\n---\n${copy}\n---\n\nReturn ONLY the image generation prompt, nothing else.`;
    }

    const systemPrompt = `You are an expert at writing image generation prompts for AI image generators (like Gemini, DALL-E, Midjourney). Your job is to translate social media copy into detailed visual prompts.

${TEDX_EVENT_CONTEXT}

Write prompts that produce visually striking, on-brand images for TEDxXinyi Instagram posts.

Guidelines for the prompt:
- Specify 1080x1080 square format, 1:1 aspect ratio
- Extract key themes/phrases from the copy to guide the visual
- Use TEDx brand colors: TEDx red (#E62B1E), deep midnight blue, warm golden amber, soft violet, cream
- Style: cinematic, luminous, premium theatrical quality
- Include "TEDxXinyi" text placement direction
- Galaxy/cosmic subtle background matching "We Are Becoming" theme
- Professional event promotion feel
- Instagram best practice: readable text, high contrast for mobile
- Artistic and unique — no stock photo feel
- Include date hint: 2026.3.31
- DO NOT use placeholder brackets — all text should be finalized copy
- Keep prompt under 300 words but detailed enough for high-quality output`;

    const result = await deepseek.analyze(systemPrompt, userPrompt, {
      model: 'deepseek-chat',
      maxTokens: 800,
      temperature: 0.7,
    });

    // Save the generated prompt to the post
    if (postId) {
      const posts = await loadSocialPosts();
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        posts[idx].imagePrompt = result.content;
        posts[idx].updatedAt = new Date().toISOString();
        await saveSocialPosts(posts);
      }
    }

    res.json({ imagePrompt: result.content, model: result.model, usage: result.usage });
  } catch (err) {
    console.error('[TEDxXinyi] Generate image prompt error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate IG post image with Gemini (NanoBanana) ----
router.post('/social/generate-image', express.json(), async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured — cannot generate image' });
  }

  const { postId, copy, imagePrompt: customPrompt } = req.body;
  if (!copy && !customPrompt) return res.status(400).json({ error: 'copy or imagePrompt is required to generate an image' });

  try {
    let prompt;
    if (customPrompt) {
      // Use the user-provided/AI-generated image prompt
      prompt = customPrompt;
    } else {
      // Fallback: auto-generate a prompt from the copy
      const headline = copy.split('\n').find(l => l.trim().length > 0 && l.trim().length < 80) || 'We Are Becoming';
      prompt = `Create a visually striking Instagram post image (1080x1080 square, 1:1 aspect ratio).

Design brief:
- Big bold headline text prominently displayed: "${headline.replace(/[#@]/g, '').trim().slice(0, 60)}"
- TEDx branded style: use TEDx red (#E62B1E) as accent color
- Color palette: deep midnight blue, warm golden amber, soft violet, cream highlights
- Style: cinematic, luminous, premium theatrical quality
- Include "TEDxXinyi" text somewhere visible but secondary
- Simple, clean composition — not cluttered
- Galaxy/cosmic subtle background elements matching the "We Are Becoming" theme
- Professional event promotion feel
- Instagram best practice: readable text over imagery, high contrast for mobile viewing
- No stock photo feel — artistic and unique
- Date hint: 2026.3.31

Do NOT include any placeholder text. All text in the image should be real, finalized copy.`;
    }

    console.log(`[TEDxXinyi] Generating social media image for post ${postId || 'unknown'}`);
    const rawBuffer = await generateVisual(client, prompt);

    // Resize to 1080x1080 for IG post
    const sharp = require('sharp');
    const compressed = await sharp(rawBuffer)
      .resize({ width: 1080, height: 1080, fit: 'cover' })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    // Save locally
    const filename = `social-${postId || Date.now()}.jpg`;
    const socialDir = path.join(OUTPUT_DIR, 'social');
    if (!fs.existsSync(socialDir)) fs.mkdirSync(socialDir, { recursive: true });
    fs.writeFileSync(path.join(socialDir, filename), compressed);

    // Upload to CDN
    let publicUrl = null;
    try {
      publicUrl = await uploadToMmdb(compressed);
      const key = `social/${filename}`;
      savePublicUrl(key, publicUrl, { source: 'social-post', description: `Social media post image` });
      console.log(`[TEDxXinyi] Social image → CDN: ${publicUrl}`);
    } catch (uploadErr) {
      console.error(`[TEDxXinyi] CDN upload failed for social image:`, uploadErr.message);
    }

    const imageUrl = publicUrl || `/tedx-xinyi/social/${filename}`;

    // Save to post
    if (postId) {
      const posts = await loadSocialPosts();
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        posts[idx].imageUrl = imageUrl;
        posts[idx].updatedAt = new Date().toISOString();
        await saveSocialPosts(posts);
      }
    }

    res.json({
      success: true,
      imageUrl,
      publicUrl,
      size: compressed.length,
      dimensions: '1080x1080',
    });
  } catch (err) {
    console.error('[TEDxXinyi] Generate social image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SPONSOR LOGOS ====================

router.get('/sponsors/logos', (req, res) => {
  const data = loadSponsorLogos();
  const result = {};
  for (const [key, logo] of Object.entries(data)) {
    const localExists = logo.filename ? fs.existsSync(path.join(SPONSORS_LOGOS_DIR, logo.filename)) : false;
    result[key] = { ...logo, localExists };
  }
  res.json({ logos: result, categories: SPONSOR_CATEGORIES });
});

router.post('/sponsors/logos', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { data: imgData, name, category } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'name and category required' });
    if (!SPONSOR_CATEGORIES.find(c => c.id === category)) return res.status(400).json({ error: 'Invalid category' });

    if (!fs.existsSync(SPONSORS_LOGOS_DIR)) fs.mkdirSync(SPONSORS_LOGOS_DIR, { recursive: true });

    const slug = name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 40);
    const key = `sponsor-${category}-${slug}-${Date.now()}`;
    let filename = null;
    let publicUrl = null;

    if (imgData && imgData.startsWith('data:image/')) {
      const match = imgData.match(/^data:image\/(jpeg|png|webp|gif);base64,(.+)$/);
      if (match) {
        const rawBuffer = Buffer.from(match[2], 'base64');
        const sharp = require('sharp');
        const compressed = await sharp(rawBuffer).webp({ quality: 82, effort: 4 }).toBuffer();
        filename = `${key}.webp`;
        fs.writeFileSync(path.join(SPONSORS_LOGOS_DIR, filename), compressed);
        try {
          publicUrl = await uploadToMmdb(compressed);
        } catch (err) {
          console.error('[TEDxXinyi] Sponsor logo CDN upload failed:', err.message);
        }
      }
    }

    const logos = loadSponsorLogos();
    logos[key] = { key, name, category, filename, publicUrl, uploadedAt: new Date().toISOString() };
    saveSponsorLogos(logos);
    res.json({ success: true, logo: { ...logos[key], localExists: !!filename } });
  } catch (err) {
    console.error('[TEDxXinyi] Sponsor logo upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/sponsors/logos/:key', express.json(), (req, res) => {
  try {
    const { key } = req.params;
    const { name, category } = req.body;
    const logos = loadSponsorLogos();
    if (!logos[key]) return res.status(404).json({ error: 'Logo not found' });
    if (name) logos[key].name = name;
    if (category && SPONSOR_CATEGORIES.find(c => c.id === category)) logos[key].category = category;
    saveSponsorLogos(logos);
    res.json({ success: true, logo: logos[key] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sponsors/logos/:key', (req, res) => {
  try {
    const { key } = req.params;
    const logos = loadSponsorLogos();
    const logo = logos[key];
    if (!logo) return res.status(404).json({ error: 'Logo not found' });
    if (logo.filename) {
      const fp = path.join(SPONSORS_LOGOS_DIR, logo.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    delete logos[key];
    saveSponsorLogos(logos);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.router = router;
module.exports.VISUALS = VISUALS;
