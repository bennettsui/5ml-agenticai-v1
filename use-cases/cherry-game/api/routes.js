/**
 * 貓貓暖湯 TAP TAP — Cherry Game API Routes
 * A cozy tapping game, made with love for Cherry 💕
 *
 * Endpoints:
 *   POST /api/cherry-game/session          — Create or restore player session
 *   GET  /api/cherry-game/state            — Get current game state
 *   POST /api/cherry-game/state/update     — Submit tap delta, server computes new state
 *   GET  /api/cherry-game/assets/:key      — Serve Nano Banana generated image
 *   POST /api/cherry-game/assets/generate  — Trigger image generation for a level
 *   GET  /api/cherry-game/assets           — List all generated assets
 *
 * Storage: Fly Postgres only. Frontend uses sessionStorage for session_token ONLY.
 * NO localStorage, NO IndexedDB, NO game state in browser flash memory.
 */

'use strict';

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

let pool; // injected via initDb()

// ─────────────────────────────────────────────────────────────────────────────
// DB INIT
// ─────────────────────────────────────────────────────────────────────────────

async function initDb(dbPool) {
  pool = dbPool;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cherry_game_players (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_token VARCHAR(64) UNIQUE NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cherry_game_progress (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id         UUID REFERENCES cherry_game_players(id) ON DELETE CASCADE,
      total_points      BIGINT DEFAULT 0,
      current_level     INT DEFAULT 1,
      tap_power_level   INT DEFAULT 1,
      idle_rate_level   INT DEFAULT 1,
      last_tick_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(player_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cherry_game_assets (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_key   VARCHAR(100) UNIQUE NOT NULL,
      image_data  TEXT,
      mime_type   VARCHAR(50) DEFAULT 'image/jpeg',
      prompt      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log('✅ Cherry Game: DB tables ready');

  // Start background asset generation (non-blocking)
  setTimeout(() => autoGenerateMissingAssets(dbPool), 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME CONFIG
// ─────────────────────────────────────────────────────────────────────────────

// Points needed to REACH each level (index = level number, value = cumulative points)
const LEVEL_THRESHOLDS = [
  0,      // Level 1  — start
  100,    // Level 2
  300,    // Level 3
  700,    // Level 4
  1500,   // Level 5
  3000,   // Level 6
  6000,   // Level 7
  12000,  // Level 8
  25000,  // Level 9
  50000,  // Level 10
];

// Tap power per tap_power_level: points added per tap
const TAP_POWER = [1, 3, 6, 10, 18, 30, 50, 85, 140, 230, 380];

// Upgrade cost for tap power (cost to go from level N to N+1)
const TAP_UPGRADE_COSTS = [0, 50, 150, 400, 900, 2000, 4500, 10000, 22000, 45000];

// Idle points per second per idle_rate_level
const IDLE_RATE = [0, 0.5, 1.2, 2.5, 5.0, 10.0, 18.0, 32.0, 58.0, 100.0, 180.0];

// Max level
const MAX_LEVEL = 10;
const MAX_TAP_POWER_LEVEL = 10;

// Level names (HK Chinese)
const LEVEL_NAMES = [
  '', // placeholder, levels start at 1
  '暖湯初現',
  '貓貓相遇',
  '燈籠輝光',
  '窗外飄雪',
  '風鈴魚乾',
  '小動物齊來',
  'BB 快樂到來',
  '星空月色',
  '暖光粒子',
  '金湯滿溢',
];

// Level unlock messages (HK Chinese)
const LEVEL_MESSAGES = [
  '',
  '歡迎來到暖湯小廚房！',
  '升級到第 2 關：第二隻貓出現咗，幫手煮湯！',
  '升級到第 3 關：小燈籠亮起，氣氛更溫暖。',
  '升級到第 4 關：窗外開始落小雪，裡面更暖。',
  '升級到第 5 關：魚乾同風鈴都掛好咗！',
  '升級到第 6 關：刺蝟同兔仔都嚟幫手喇！',
  '升級到第 7 關：木牌寫住「BB 快樂出世」。',
  '升級到第 8 關：窗外星空同月亮出現喇！',
  '升級到第 9 關：金色小光點慢慢上升，好夢幻。',
  '升級到第 10 關：整個廚房都係金色暖光，最幸福的時刻！',
];

// ─────────────────────────────────────────────────────────────────────────────
// NANO BANANA (Gemini 2.5 Flash Image) — Pixar-Style Prompts
// Story-correlated, portrait (9:16) mobile format, ultra cute
// ─────────────────────────────────────────────────────────────────────────────

// Generation priority — soup stages first (most visible), then backgrounds
const GENERATION_PRIORITY = [
  'soup_stage_1','soup_stage_2','soup_stage_3','soup_stage_4','soup_stage_5',
  'bg_level_1','bg_level_2','bg_level_3','bg_level_4','bg_level_5',
  'bg_level_6','bg_level_7','bg_level_8','bg_level_9','bg_level_10',
];

const STYLE_BASE = 'Pixar 3D CGI animation style, ultra detailed render quality like Ratatouille, cinematic lighting, extremely cute characters, portrait vertical format 9:16, no text, no watermark';

const ASSET_PROMPTS = {
  // ── SOUP STAGE IMAGES (progressive visual upgrade every ~20 taps) ──────────

  soup_stage_1:
    `A single simple round clay soup pot, plain water just starting to warm, tiny wisps of steam just beginning, the pot is humble and empty-looking, soft warm clay colors, very cute chunky round proportions, gentle amber light from below, Pixar 3D CGI animation style, centered portrait composition, VERY DARK deep navy-black vignette background fading to pure black at edges, subject isolated in center with dramatic dark surround, extremely cute, no text`,

  soup_stage_2:
    `A cute round clay soup pot filled with light golden broth just starting to simmer, a few small vegetable slices (carrot, mushroom) just dropped in, small delicate steam wisps rising upward, the broth beginning to glow warm amber, cute chunky proportions, warm golden light from within the pot, Pixar 3D CGI animation style, centered portrait composition, VERY DARK deep navy-black background with dark vignette, pot glowing against darkness, no text`,

  soup_stage_3:
    `A beautiful round soup pot bubbling with rich golden broth, colorful vegetables clearly visible inside — orange carrots, soft white tofu, dark mushrooms, bright green leaves — generous steam rising in beautiful curls, the pot glowing warm amber-gold from within, appetizing and abundant, Pixar 3D CGI animation style, centered portrait composition, DARK background deep brown-black vignette with warm glow emanating from pot, ultra cute, no text`,

  soup_stage_4:
    `A magnificent round magical soup cauldron overflowing with gorgeous rich golden broth, abundant delicious ingredients clearly visible, thick rising steam forming beautiful cloud shapes, the cauldron radiating warm golden light outward, truly beautiful and comforting, surrounded by golden glow against darkness, Pixar 3D CGI animation style, centered portrait composition, VERY DARK background — deep black with only warm light from the cauldron illuminating surrounding space, ultra cute chunky proportions, no text`,

  soup_stage_5:
    `A magical glowing soup cauldron transcending ordinary cooking — the soup shimmers and sparkles with magical golden light, tiny glowing particles rise like fireflies, the entire cauldron surrounded by brilliant warm golden aura radiating outward into pure darkness, the steam itself made of golden light, the ultimate magical healing soup, Pixar 3D CGI animation style, centered portrait composition, PURE BLACK background — like a jewel floating in the void, maximum magical glow, radiant golden palette, ultra cute, no text`,

  // ── BACKGROUNDS (story-correlated full kitchen scenes) ────────────────────

  bg_level_1:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, warm amber firelight from a small stone stove at the bottom center, ONE adorably chubby orange tabby kitten with huge round sparkling eyes sitting beside a plain round clay soup pot, the kitchen is simple and humble, rustic wooden walls with wood grain texture, small curtained window in background, wooden shelf with cute jars, everything very quiet and peaceful — this is just the beginning of a warm story, ${STYLE_BASE}`,

  bg_level_2:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, warm golden firelight, a glowing round soup cauldron on the stone stove center stage, an orange tabby cat sits watching it lovingly, a second fluffy gray kitten has just ARRIVED carrying a big bunch of colorful vegetables (orange carrots, green onions) in tiny paws, the gray cat looks overjoyed to help, colorful vegetables scattered joyfully on the wooden counter, two cats now making the kitchen feel more alive, ${STYLE_BASE}`,

  bg_level_3:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, warm festive atmosphere, beautiful GLOWING RED PAPER LANTERNS hanging from ceiling wooden beams (3-4 lanterns prominent in frame), the lanterns cast warm pink-orange light that mixes with firelight, soup cauldron glowing on stove, two cats cooking happily, the kitchen feels like a festival now, rich warm amber-red-orange palette, very festive and cozy, ${STYLE_BASE}`,

  bg_level_4:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, red lanterns inside, two cats by glowing cauldron, the ROUND WINDOW in the background now shows BEAUTIFUL SNOWFALL outside in a dark blue-purple forest, snowflakes drifting gently in the dark outside, warm golden firelight inside creates a magical contrast with the cool snowy blue outside, the kitchen feels extra cozy against the cold, frosted window edges, ${STYLE_BASE}`,

  bg_level_5:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, red lanterns, snow outside, two cats cooking, now with RUSTIC DECORATIONS added: bundles of dried golden-brown fish hanging from ceiling beam, a small beautiful wind chime with tiny bells near the window swaying gently, the kitchen feels deeply homey and lived-in, every corner has a little charm, warm amber light, ${STYLE_BASE}`,

  bg_level_6:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, red lanterns, snow outside, dried fish, two cats plus NEW ANIMAL FRIENDS: a small round chubby HEDGEHOG wearing a tiny apron carrying herbs, a fluffy white BUNNY enthusiastically rolling dough at a tiny table, the kitchen is now full of adorable helpers bustling about, warm golden firelight, full of joy and life, ${STYLE_BASE}`,

  bg_level_7:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, all cats and animal friends cooking together joyfully, red lanterns, a PROMINENTLY DISPLAYED WOODEN SIGN hanging on the back wall carved and painted with stars and flowers, the kitchen decorated for a special occasion, warm festive golden light, anticipation and celebration in the air, baby-themed little star decorations, ${STYLE_BASE}`,

  bg_level_8:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, all animals cooking, red lanterns, the large WINDOW now reveals a breathtaking NIGHT SKY filled with glittering stars, a LARGE GLOWING FULL MOON dominates the window, silver-blue moonlight streams dramatically into the warm kitchen creating beautiful blue-gold contrast, magical celestial night, ${STYLE_BASE}`,

  bg_level_9:
    `A charming cozy wooden forest kitchen interior at night in portrait vertical format, all animals, red lanterns, starry moon sky, the kitchen now FILLED WITH HUNDREDS OF TINY GOLDEN LIGHT PARTICLES floating upward like magical fireflies, the light particles rise from the golden soup cauldron and drift throughout the entire kitchen, dreamlike ethereal golden magical atmosphere, magical sparkles on every surface, ${STYLE_BASE}`,

  bg_level_10:
    `A cozy magical forest kitchen in the most beautiful moment of all — portrait vertical format, enormous brilliant GOLD-GLOWING MAGICAL SOUP CAULDRON radiating warm golden rays outward like a sun, ALL adorable animals gathered around with peaceful blissful happy expressions, eyes soft with joy, red lanterns at maximum glow, golden starry sky outside, golden light particles filling the entire room, soft golden halo envelopes everything, the most beautiful cozy scene imaginable, ultimate celebration and warmth, like the final scene of Coco, ${STYLE_BASE}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GENERATION (Nano Banana = gemini-2.5-flash-image)
// ─────────────────────────────────────────────────────────────────────────────

async function generateNanaBananaImage(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const { default: fetch } = await import('node-fetch');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.8,
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${err.slice(0, 300)}`);
  }

  const data = await resp.json();
  for (const candidate of (data.candidates || [])) {
    for (const part of (candidate.content?.parts || [])) {
      const img = part.inlineData || part.inline_data;
      if (img) {
        const mt = img.mimeType || img.mime_type || '';
        if (mt.startsWith('image/')) {
          return { data: img.data, mimeType: mt };
        }
      }
    }
  }
  throw new Error('No image returned from Nano Banana (Gemini 2.5 Flash Image)');
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-GENERATION  — generate missing assets in background on startup
// ─────────────────────────────────────────────────────────────────────────────

async function autoGenerateMissingAssets(dbPool) {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const result = await dbPool.query(
      'SELECT asset_key FROM cherry_game_assets WHERE image_data IS NOT NULL'
    );
    const already = new Set(result.rows.map(r => r.asset_key));
    const missing  = GENERATION_PRIORITY.filter(k => !already.has(k));
    if (missing.length === 0) {
      console.log('[CherryGame] All assets already generated ✅');
      return;
    }
    console.log(`[CherryGame] Auto-generating ${missing.length} missing assets in background…`);
    (async () => {
      for (const key of missing) {
        try {
          const prompt = ASSET_PROMPTS[key];
          if (!prompt) continue;
          console.log(`[CherryGame] Generating "${key}"…`);
          const { data, mimeType } = await generateNanaBananaImage(prompt);
          await dbPool.query(
            `INSERT INTO cherry_game_assets (asset_key, image_data, mime_type, prompt)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (asset_key) DO UPDATE
             SET image_data = $2, mime_type = $3, prompt = $4, created_at = NOW()`,
            [key, data, mimeType, prompt]
          );
          console.log(`[CherryGame] ✅ Auto-generated: "${key}"`);
          await new Promise(r => setTimeout(r, 3500)); // rate-limit
        } catch (err) {
          console.error(`[CherryGame] ❌ Auto-gen failed "${key}":`, err.message);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      console.log('[CherryGame] 🎉 Auto-generation complete!');
    })();
  } catch (err) {
    console.error('[CherryGame] autoGenerateMissingAssets error:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function computeLevel(totalPoints) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, MAX_LEVEL);
}

function requireSession(req, res, next) {
  req.sessionToken = req.headers['x-session-token'] || req.query.token;
  if (!req.sessionToken) return res.status(401).json({ error: '缺少 session token' });
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/cherry-game/session
 * Body: { token?: string }  — if token provided, restore; else create new
 * Returns: { token, playerId, isNew }
 */
router.post('/session', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const existingToken = req.body?.token;

    if (existingToken) {
      // Try to restore
      const existing = await pool.query(
        'SELECT id FROM cherry_game_players WHERE session_token = $1',
        [existingToken]
      );
      if (existing.rows.length > 0) {
        const playerId = existing.rows[0].id;
        await pool.query('UPDATE cherry_game_players SET last_seen_at = NOW() WHERE id = $1', [playerId]);
        return res.json({ token: existingToken, playerId, isNew: false });
      }
    }

    // Create new player
    const token = crypto.randomBytes(24).toString('hex');
    const playerRes = await pool.query(
      'INSERT INTO cherry_game_players (session_token) VALUES ($1) RETURNING id',
      [token]
    );
    const playerId = playerRes.rows[0].id;

    // Create initial progress
    await pool.query(
      'INSERT INTO cherry_game_progress (player_id) VALUES ($1)',
      [playerId]
    );

    return res.json({ token, playerId, isNew: true });
  } catch (err) {
    console.error('[CherryGame] /session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cherry-game/state
 * Header: x-session-token
 * Returns full game state from Postgres
 */
router.get('/state', requireSession, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const playerRes = await pool.query(
      'SELECT id FROM cherry_game_players WHERE session_token = $1',
      [req.sessionToken]
    );
    if (!playerRes.rows.length) return res.status(404).json({ error: 'Session not found' });

    const playerId = playerRes.rows[0].id;
    const progRes = await pool.query(
      'SELECT * FROM cherry_game_progress WHERE player_id = $1',
      [playerId]
    );

    if (!progRes.rows.length) {
      // Create default progress if missing
      await pool.query('INSERT INTO cherry_game_progress (player_id) VALUES ($1)', [playerId]);
      return res.json(buildStateResponse({ total_points: 0, current_level: 1, tap_power_level: 1, idle_rate_level: 1 }));
    }

    const prog = progRes.rows[0];

    // Apply idle points earned since last tick
    const now = new Date();
    const lastTick = new Date(prog.last_tick_at);
    const secondsElapsed = Math.max(0, (now - lastTick) / 1000);
    const idleGain = Math.floor(secondsElapsed * IDLE_RATE[prog.idle_rate_level] || 0);

    if (idleGain > 0) {
      const newTotal = BigInt(prog.total_points) + BigInt(idleGain);
      const newLevel = computeLevel(Number(newTotal));
      await pool.query(
        `UPDATE cherry_game_progress
         SET total_points = $1, current_level = $2, last_tick_at = NOW(), updated_at = NOW()
         WHERE player_id = $3`,
        [newTotal.toString(), newLevel, playerId]
      );
      prog.total_points = newTotal.toString();
      prog.current_level = newLevel;
    }

    await pool.query('UPDATE cherry_game_players SET last_seen_at = NOW() WHERE id = $1', [playerId]);

    return res.json(buildStateResponse(prog));
  } catch (err) {
    console.error('[CherryGame] /state error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function buildStateResponse(prog) {
  const totalPoints = Number(prog.total_points);
  const currentLevel = Number(prog.current_level);
  const tapPowerLevel = Number(prog.tap_power_level);
  const idleRateLevel = Number(prog.idle_rate_level);

  const nextLevelThreshold = currentLevel < MAX_LEVEL ? LEVEL_THRESHOLDS[currentLevel] : null;
  const tapUpgradeCost = tapPowerLevel < MAX_TAP_POWER_LEVEL ? TAP_UPGRADE_COSTS[tapPowerLevel] : null;

  return {
    totalPoints,
    currentLevel,
    levelName: LEVEL_NAMES[currentLevel],
    tapPowerLevel,
    tapPower: TAP_POWER[tapPowerLevel],
    idleRateLevel,
    idleRate: IDLE_RATE[idleRateLevel],
    nextLevelThreshold,
    levelProgress: nextLevelThreshold
      ? (totalPoints - LEVEL_THRESHOLDS[currentLevel - 1]) / (nextLevelThreshold - LEVEL_THRESHOLDS[currentLevel - 1])
      : 1,
    tapUpgradeCost,
    maxLevel: currentLevel >= MAX_LEVEL,
    levelThresholds: LEVEL_THRESHOLDS,
  };
}

/**
 * POST /api/cherry-game/state/update
 * Header: x-session-token
 * Body: { tapCount: number, action?: 'tap' | 'upgrade_tap' }
 * Server validates and computes new state. Frontend only sends deltas.
 */
router.post('/state/update', requireSession, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const { tapCount = 0, action = 'tap' } = req.body || {};

    const playerRes = await pool.query(
      'SELECT id FROM cherry_game_players WHERE session_token = $1',
      [req.sessionToken]
    );
    if (!playerRes.rows.length) return res.status(404).json({ error: 'Session not found' });

    const playerId = playerRes.rows[0].id;
    const progRes = await pool.query(
      'SELECT * FROM cherry_game_progress WHERE player_id = $1',
      [playerId]
    );
    if (!progRes.rows.length) return res.status(404).json({ error: 'Progress not found' });

    const prog = progRes.rows[0];
    let totalPoints = Number(prog.total_points);
    let tapPowerLevel = Number(prog.tap_power_level);
    let idleRateLevel = Number(prog.idle_rate_level);
    let levelUpMessage = null;

    // Apply idle gain since last tick
    const now = new Date();
    const lastTick = new Date(prog.last_tick_at);
    const secondsElapsed = Math.max(0, Math.min((now - lastTick) / 1000, 300)); // cap at 5 min
    const idleGain = Math.floor(secondsElapsed * (IDLE_RATE[idleRateLevel] || 0));
    totalPoints += idleGain;

    if (action === 'tap') {
      // Validate tap count (max 30 taps per second * elapsed time, plus buffer)
      const maxTaps = Math.max(50, secondsElapsed * 30 + 50);
      const validatedTaps = Math.min(Math.max(0, tapCount), maxTaps);
      const tapGain = validatedTaps * TAP_POWER[tapPowerLevel];
      totalPoints += tapGain;
    } else if (action === 'upgrade_tap') {
      if (tapPowerLevel < MAX_TAP_POWER_LEVEL) {
        const cost = TAP_UPGRADE_COSTS[tapPowerLevel];
        if (totalPoints >= cost) {
          totalPoints -= cost;
          tapPowerLevel += 1;
          // Also bump idle rate every 2 tap upgrades
          if (tapPowerLevel % 2 === 0 && idleRateLevel < MAX_TAP_POWER_LEVEL) {
            idleRateLevel += 1;
          }
        } else {
          return res.status(400).json({ error: '點數唔夠升級', needed: cost, have: totalPoints });
        }
      }
    }

    const oldLevel = Number(prog.current_level);
    const newLevel = computeLevel(totalPoints);

    if (newLevel > oldLevel) {
      levelUpMessage = LEVEL_MESSAGES[newLevel];
    }

    await pool.query(
      `UPDATE cherry_game_progress
       SET total_points = $1, current_level = $2, tap_power_level = $3,
           idle_rate_level = $4, last_tick_at = NOW(), updated_at = NOW()
       WHERE player_id = $5`,
      [totalPoints, newLevel, tapPowerLevel, idleRateLevel, playerId]
    );

    const state = buildStateResponse({
      total_points: totalPoints,
      current_level: newLevel,
      tap_power_level: tapPowerLevel,
      idle_rate_level: idleRateLevel,
    });

    return res.json({ ...state, levelUpMessage, levelChanged: newLevel !== oldLevel });
  } catch (err) {
    console.error('[CherryGame] /state/update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cherry-game/state/reset
 * Resets the player's progress back to zero.
 */
router.post('/state/reset', requireSession, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const playerRes = await pool.query(
      'SELECT id FROM cherry_game_players WHERE session_token = $1',
      [req.sessionToken]
    );
    if (!playerRes.rows.length) return res.status(404).json({ error: 'Session not found' });

    const playerId = playerRes.rows[0].id;
    await pool.query(
      `UPDATE cherry_game_progress
         SET total_points = 0, current_level = 1,
             tap_power_level = 1, idle_rate_level = 1,
             last_tick_at = NOW(), updated_at = NOW()
       WHERE player_id = $1`,
      [playerId]
    );

    res.json({ ok: true, message: '進度已重置！' });
  } catch (err) {
    console.error('[CherryGame] /state/reset error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cherry-game/assets/:key
 * Serves generated image (from Postgres base64 storage).
 * Adds long cache headers since images rarely change.
 */
router.get('/assets/:key', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const { key } = req.params;
    const result = await pool.query(
      'SELECT image_data, mime_type FROM cherry_game_assets WHERE asset_key = $1',
      [key]
    );

    if (!result.rows.length || !result.rows[0].image_data) {
      return res.status(404).json({ error: '圖片未生成', key });
    }

    const { image_data, mime_type } = result.rows[0];
    const buf = Buffer.from(image_data, 'base64');

    res.set({
      'Content-Type': mime_type || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // 1 day
      'Content-Length': buf.length,
    });
    return res.end(buf);
  } catch (err) {
    console.error('[CherryGame] /assets/:key error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cherry-game/assets/generate
 * Body: { key: string }  — generate one asset via Nano Banana
 * Admin-triggered (no auth for now; add if needed)
 */
router.post('/assets/generate', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'Missing key' });

    const prompt = ASSET_PROMPTS[key];
    if (!prompt) return res.status(400).json({ error: `Unknown asset key: ${key}`, validKeys: Object.keys(ASSET_PROMPTS) });

    console.log(`[CherryGame] Generating asset "${key}" via Nano Banana (Pixar style)…`);
    const { data, mimeType } = await generateNanaBananaImage(prompt);

    await pool.query(
      `INSERT INTO cherry_game_assets (asset_key, image_data, mime_type, prompt)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (asset_key) DO UPDATE SET image_data = $2, mime_type = $3, created_at = NOW()`,
      [key, data, mimeType, prompt]
    );

    console.log(`[CherryGame] Asset "${key}" generated & stored in Postgres ✅`);
    return res.json({ ok: true, key, mimeType, sizeKb: Math.round(data.length * 0.75 / 1024) });
  } catch (err) {
    console.error('[CherryGame] /assets/generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cherry-game/assets/generate-all
 * Triggers generation of ALL defined assets (background, characters, UI).
 */
router.post('/assets/generate-all', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB not ready' });

  const keys = Object.keys(ASSET_PROMPTS);
  res.json({ message: `開始生成 ${keys.length} 張圖片…`, keys });

  // Run generation in background
  (async () => {
    for (const key of keys) {
      try {
        const prompt = ASSET_PROMPTS[key];
        console.log(`[CherryGame] Generating "${key}"…`);
        const { data, mimeType } = await generateNanaBananaImage(prompt);
        await pool.query(
          `INSERT INTO cherry_game_assets (asset_key, image_data, mime_type, prompt)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (asset_key) DO UPDATE SET image_data = $2, mime_type = $3, created_at = NOW()`,
          [key, data, mimeType, prompt]
        );
        console.log(`[CherryGame] ✅ "${key}" done`);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[CherryGame] ❌ "${key}" failed:`, err.message);
      }
    }
    console.log('[CherryGame] All asset generation complete!');
  })();
});

/**
 * GET /api/cherry-game/assets
 * List all assets and their generation status
 */
router.get('/assets', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DB not ready' });

    const result = await pool.query(
      'SELECT asset_key, mime_type, created_at, LENGTH(image_data) as data_len FROM cherry_game_assets ORDER BY created_at'
    );

    const generated = new Set(result.rows.map(r => r.asset_key));
    const all = Object.keys(ASSET_PROMPTS).map(key => ({
      key,
      generated: generated.has(key),
      prompt: ASSET_PROMPTS[key],
      url: generated.has(key) ? `/api/cherry-game/assets/${key}` : null,
      sizeKb: result.rows.find(r => r.asset_key === key)?.data_len
        ? Math.round(result.rows.find(r => r.asset_key === key).data_len * 0.75 / 1024)
        : null,
    }));

    return res.json({ assets: all, generatedCount: generated.size, totalCount: all.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cherry-game/config
 * Returns game configuration for the frontend
 */
router.get('/config', (req, res) => {
  res.json({
    levelThresholds: LEVEL_THRESHOLDS,
    levelNames: LEVEL_NAMES,
    tapPowerByLevel: TAP_POWER,
    tapUpgradeCosts: TAP_UPGRADE_COSTS,
    idleRateByLevel: IDLE_RATE,
    maxLevel: MAX_LEVEL,
    assetKeys: Object.keys(ASSET_PROMPTS),
  });
});

module.exports = router;
module.exports.initDb = initDb;
