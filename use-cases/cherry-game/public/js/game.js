/**
 * 貓貓暖湯 TAP TAP — Game Logic
 * Made with love for Cherry 💕
 *
 * PERSISTENCE: All game state lives in Fly Postgres.
 * - localStorage stores ONLY the session token (not game values) so progress
 *   survives page refresh AND browser restarts.
 * - Frontend keeps optimistic in-memory display only.
 * - Every 5s, pending taps are sent to server; server validates & saves.
 * - On every load, state is fetched fresh from server.
 */
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — must match routes.js
// ─────────────────────────────────────────────────────────────────────────────
const BASE_API = '/api/cherry-game';

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
const TAP_POWER        = [1, 3, 6, 10, 18, 30, 50, 85, 140, 230, 380];
const TAP_UPGRADE_COSTS= [0, 50, 150, 400, 900, 2000, 4500, 10000, 22000, 45000];
const IDLE_RATE        = [0, 0.5, 1.2, 2.5, 5.0, 10.0, 18.0, 32.0, 58.0, 100.0, 180.0];
const MAX_LEVEL        = 10;
const SYNC_INTERVAL_MS = 5000;
const POLL_INTERVAL_MS = 10000;

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL CONTENT  (names + stories + story ticker + scene unlocks)
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_NAMES = [
  '', '暖湯初現','貓貓相遇','燈籠輝光','窗外飄雪',
  '風鈴魚乾','小動物齊來','BB快樂到來','星空月色','暖光粒子','金湯滿溢',
];

const LEVEL_STORIES = [
  '',
  // Lv1 → Lv2
  '喵喵的好朋友小橙聞到暖湯香味，\n悄悄推開廚房門，\n帶來一籃新鮮蔬菜！',
  // Lv2 → Lv3
  '貓咪們掛起小紅燈籠，\n廚房裡亮起溫暖的橙紅光，\n就像你心裡那份溫柔。',
  // Lv3 → Lv4
  '窗外飄起細細的雪，\n廚房裡卻好暖好暖，\n就像有人一直陪住你。',
  // Lv4 → Lv5
  '風鈴輕輕叮叮噹，\n魚乾飄著鹹鹹香，\n小廚房的每個角落都是故事。',
  // Lv5 → Lv6
  '刺蝟刺刺抱著一把香草，\n兔仔白雪咿咿呀呀搓湯圓，\n大家都想讓暖湯更香！',
  // Lv6 → Lv7
  '貓咪們齊心掛起木牌：\n「BB 快樂出世 🌟」\n整個廚房都充滿期待！',
  // Lv7 → Lv8
  '雲開了，窗外出現滿天星星，\n月亮又大又圓，\n好像在說：「你做得好好！」',
  // Lv8 → Lv9
  '金色光點從湯煲升起，\n像小螢火蟲在廚房飛舞，\n每一點光都是暖暖的祝福。',
  // Lv9 → Lv10
  '金湯滿溢，廚房沐浴在最溫柔的金光裡。\n喵喵閉上眼睛，輕輕說：\n「Cherry，你已經好勇敢，BB 快嚟喇！」🌟',
];

// Story ticker lines — shown at bottom during gameplay
const STORY_TICKERS = [
  // Lv1
  [
    '🍲 暖湯小廚房⋯ 輕輕一撳，暖暖加一點。',
    '🐱 喵喵望住湯煲，尾巴搖呀搖。',
    '✨ 每一撳，都係對自己的溫柔。',
    '💕 不需要表現完美，只需要慢慢撳。',
  ],
  // Lv2
  [
    '🐱🐈 兩隻貓咪一起煮湯，廚房更熱鬧喇！',
    '🥕 小橙咔嚓咔嚓切蘿蔔，好勤力！',
    '💨 暖暖的霧氣升起，香味飄出窗外。',
    '🍲 湯越煮越香，點數越撳越多。',
  ],
  // Lv3
  [
    '🏮 紅燈籠輕輕搖，光暈好溫柔。',
    '🐱 喵喵仰頭看燈籠，眼睛閃閃發光。',
    '✨ 廚房比之前更靚喇！',
    '🌸 暖光照住你，照住BB，照住所有人。',
  ],
  // Lv4
  [
    '❄ 窗外飄雪，裡面更暖。',
    '🐱 懶懶縮成一團，睡得好甜。',
    '☁ 雪花輕輕飄落，好靜好美。',
    '🔥 爐火跳動，把冷都擋在外面。',
  ],
  // Lv5
  [
    '🔔 風鈴叮叮噹，有風在輕訴。',
    '🐟 魚乾吊著搖，廚房更有生氣。',
    '🐱 喵喵用鼻子嗅嗅，滿足地點頭。',
    '💕 每個細節都係心意，為你佈置的。',
  ],
  // Lv6
  [
    '🦔 刺刺悄悄送上一把迷迭香。',
    '🐰 白雪咿呀咿呀搓湯圓，好可愛！',
    '🌿 草藥加進去，暖湯更有療癒力。',
    '👨‍🍳 大家都想讓你舒服一點。',
  ],
  // Lv7
  [
    '🌟 BB快樂到來！廚房掛上祝福牌。',
    '🐱 喵喵歪頭：「好快喇，你撐住！」',
    '🏮 燈籠光更暖，每隻貓都在為你加油。',
    '💕 你好勇敢，真的好勇敢。',
  ],
  // Lv8
  [
    '🌕 月亮出來喇！又大又圓，像個大湯圓。',
    '⭐ 滿天星星，每顆都係一個祝福。',
    '🐱 喵喵對月亮許願：BB 快啲嚟！',
    '✨ 星光灑落廚房，好夢幻。',
  ],
  // Lv9
  [
    '✨ 金色光點飛舞，像螢火蟲在跳舞。',
    '🌟 每個光點都係祝福，數都數不完。',
    '🍲 湯煲發出金光，好神奇好溫暖。',
    '💫 快到最後喇！你做到喇！',
  ],
  // Lv10
  [
    '🥇 金湯滿溢！你已達到最高關！',
    '🐱 所有貓咪圍住你，一齊為你鼓掌！',
    '🌟 喵喵說：「Cherry，你係最勇敢的媽媽！」',
    '💕 BB已經在路上，你唔係一個人！',
    '🌸 加油，就快喇，就快喇！',
  ],
];

// Which scene elements to show per level (add class to body, CSS handles the rest)
const LEVEL_SCENE_CATS = {
  1:  ['cat-main'],
  2:  ['cat-main', 'cat-helper'],
  3:  ['cat-main', 'cat-helper'],
  4:  ['cat-main', 'cat-helper', 'cat-sleepy'],
  5:  ['cat-main', 'cat-helper', 'cat-sleepy'],
  6:  ['cat-main', 'cat-helper', 'cat-sleepy', 'cat-hedgehog', 'cat-bunny'],
  7:  ['cat-main', 'cat-helper', 'cat-sleepy', 'cat-hedgehog', 'cat-bunny'],
  8:  ['cat-main', 'cat-helper', 'cat-sleepy', 'cat-hedgehog', 'cat-bunny'],
  9:  ['cat-main', 'cat-helper', 'cat-sleepy', 'cat-hedgehog', 'cat-bunny'],
  10: ['cat-main', 'cat-helper', 'cat-sleepy', 'cat-hedgehog', 'cat-bunny'],
};

// Soup stage labels and thresholds
const SOUP_STAGE_LABELS = ['清水 🫙', '暖湯初現 🌡️', '香氣升起 💨', '滾滾熱湯 🍵', '神奇暖湯 ✨', '金光暖湯 🌟'];
const SOUP_STAGE_TAPS   = 20; // taps per stage upgrade

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STATE
// ─────────────────────────────────────────────────────────────────────────────
const state = {
  sessionToken:   null,
  totalPoints:    0,
  displayPoints:  0,
  currentLevel:   1,
  tapPowerLevel:  1,
  idleRateLevel:  1,
  tapPower:       1,
  idleRate:       0.5,
  nextLevelThreshold: 100,
  levelProgress:  0,
  tapUpgradeCost: 50,
  pendingTaps:    0,
  muted: false, reduceFx: false, darkOverlay: false,
  loaded: false,
  tickerIndex: 0,
  soupStage:      0,   // 0=plain water, 1-5 = progressive glow
  bgLevel:        0,   // which bg image is loaded
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM
// ─────────────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const els = {
  loadingScreen:  $('loading-screen'),
  loadingBar:     $('loading-bar'),
  loadingMsg:     $('loading-msg'),
  tapZone:        $('tap-zone'),
  tapHint:        $('tap-hint'),
  particles:      $('particles'),
  hudPoints:      $('hud-points'),
  hudLevel:       $('hud-level-num'),
  hudLevelName:   $('hud-level-name'),
  hudTapPower:    $('hud-tap-power'),
  hudIdleRate:    $('hud-idle-rate'),
  progressFill:   $('progress-fill'),
  progCurrent:    $('prog-current'),
  progNext:       $('prog-next'),
  upgradeBtn:     $('upgrade-btn'),
  upgradeInfo:    $('upgrade-info'),
  upgradeBadge:   $('upgrade-badge'),
  levelupToast:   $('levelup-toast'),
  levelupMsg:     $('levelup-msg'),
  levelupIcon:    $('levelup-icon'),
  levelupStory:   $('levelup-story'),
  storyText:      $('story-text'),
  cauldronWrap:   $('cauldron-wrap'),
  cauldronRing:   $('cauldron-ring'),
  cauldronImg:    $('cauldron-img'),
  cauldronEmoji:  $('cauldron-emoji'),
  soupLabel:      $('soup-label'),
  gameBg:         $('game-bg'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION  — token in localStorage (survives tab close), game values never stored locally
// ─────────────────────────────────────────────────────────────────────────────
async function initSession() {
  setLoadingMsg('連接雲端暖湯廚房…', 10);
  // localStorage stores ONLY the anonymous session token — not any game values
  const savedToken = localStorage.getItem('cherry_game_token');
  try {
    const resp = await apiFetch('/session', 'POST', { token: savedToken });
    state.sessionToken = resp.token;
    localStorage.setItem('cherry_game_token', resp.token); // just an ID, not game data
    return true;
  } catch (err) {
    setLoadingMsg('連線失敗，請刷新頁面。', 100);
    console.error('[CherryGame] session init failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.sessionToken ? { 'x-session-token': state.sessionToken } : {}),
    },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const resp = await fetch(BASE_API + path, opts);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || resp.statusText);
  }
  return resp.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE SYNC
// ─────────────────────────────────────────────────────────────────────────────
async function fetchState() {
  try {
    const s = await apiFetch('/state');
    applyServerState(s);
  } catch (err) {
    console.warn('[CherryGame] fetchState failed:', err.message);
  }
}

async function syncTaps() {
  if (state.pendingTaps <= 0) return;
  const tapsToSend = Math.min(state.pendingTaps, 2000);
  state.pendingTaps -= tapsToSend;
  try {
    const s = await apiFetch('/state/update', 'POST', { tapCount: tapsToSend, action: 'tap' });
    applyServerState(s);
    if (s.levelUpMessage) showLevelUp(s.levelUpMessage, s.currentLevel);
  } catch (err) {
    state.pendingTaps += tapsToSend;
    console.warn('[CherryGame] syncTaps failed:', err.message);
  }
}

function applyServerState(s) {
  const oldLevel = state.currentLevel;

  state.totalPoints        = s.totalPoints;
  state.currentLevel       = s.currentLevel;
  state.tapPowerLevel      = s.tapPowerLevel;
  state.idleRateLevel      = s.idleRateLevel;
  state.tapPower           = s.tapPower;
  state.idleRate           = s.idleRate;
  state.nextLevelThreshold = s.nextLevelThreshold;
  state.levelProgress      = s.levelProgress;
  state.tapUpgradeCost     = s.tapUpgradeCost;

  // Only sync display upward (avoid flicker)
  if (state.totalPoints > state.displayPoints) {
    state.displayPoints = state.totalPoints;
  }

  if (state.currentLevel !== oldLevel) {
    onLevelChange(oldLevel, state.currentLevel);
  }

  updateHUD();
}

// ─────────────────────────────────────────────────────────────────────────────
// TAPPING
// ─────────────────────────────────────────────────────────────────────────────
let tapCount = 0; // total taps this session for combo tracking

function handleTap(event) {
  event.preventDefault();
  tapCount++;

  // Optimistic
  state.displayPoints += state.tapPower;
  state.pendingTaps   += 1;

  // Hide hint
  els.tapHint.style.opacity = '0';

  const rect  = els.tapZone.getBoundingClientRect();
  const touch = event.touches?.[0] || event;
  const x = (touch.clientX ?? rect.left + rect.width  / 2) - rect.left;
  const y = (touch.clientY ?? rect.top  + rect.height / 2) - rect.top;

  // Floating number
  spawnTapNumber(x, y);

  // Cat reaction (random cat wiggles)
  wiggleRandomCat();

  // Ring flash on cauldron
  flashCauldronRing();

  // Occasional bonus particles
  if (!state.reduceFx && tapCount % 5 === 0) spawnSparkles(x, y);

  // Soup stage upgrade every N taps
  if (tapCount > 0 && tapCount % SOUP_STAGE_TAPS === 0) {
    const nextStage = Math.min(5, state.soupStage + 1);
    if (nextStage > state.soupStage) upgradeSoupStage(nextStage);
  }

  updateHUDPoints();
  updateProgressBar();
  updateUpgradeButton();
}

function spawnTapNumber(x, y) {
  const el = document.createElement('div');
  const v = state.tapPower;
  const size = v >= 50 ? 'mega' : v >= 10 ? 'big' : '';
  el.className = `tap-particle ${size}`;

  const emoji = tapCount % 10 === 0 ? ' 💕' : tapCount % 7 === 0 ? ' ✨' : '';
  el.textContent = `+${v}${emoji}`;

  const drift = (Math.random() - 0.5) * 70;
  el.style.left      = (x + drift) + 'px';
  el.style.top       = y + 'px';
  el.style.transform = 'translate(-50%, -50%)';
  els.particles.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function spawnSparkles(cx, cy) {
  const icons = ['✨','🌸','⭐','💛','🔥','🌟','💕'];
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'tap-particle';
    el.style.fontSize = '18px';
    el.textContent = icons[Math.floor(Math.random() * icons.length)];
    const angle = (i / 3) * Math.PI * 2 + Math.random();
    const dist  = 30 + Math.random() * 40;
    el.style.left      = (cx + Math.cos(angle) * dist) + 'px';
    el.style.top       = (cy + Math.sin(angle) * dist) + 'px';
    el.style.transform = 'translate(-50%, -50%)';
    els.particles.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function flashCauldronRing() {
  const ring = els.cauldronRing;
  ring.classList.remove('flash');
  void ring.offsetWidth; // reflow
  ring.classList.add('flash');
  setTimeout(() => ring.classList.remove('flash'), 600);
}

function wiggleRandomCat() {
  const activeCats = LEVEL_SCENE_CATS[state.currentLevel] || ['cat-main'];
  const id = activeCats[Math.floor(Math.random() * activeCats.length)];
  const catEl = $(id);
  if (!catEl) return;
  const body = catEl.querySelector('.cat-body');
  if (!body) return;
  body.classList.remove('tapped');
  void body.offsetWidth;
  body.classList.add('tapped');
  setTimeout(() => body.classList.remove('tapped'), 450);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUP STAGE PROGRESSION
// ─────────────────────────────────────────────────────────────────────────────
function upgradeSoupStage(stage) {
  state.soupStage = stage;

  // Apply CSS glow class (removes old, adds new)
  const tz = els.tapZone;
  for (let i = 0; i <= 5; i++) tz.classList.remove(`soup-s${i}`);
  if (stage > 0) tz.classList.add(`soup-s${stage}`);

  // Update label
  if (els.soupLabel) els.soupLabel.textContent = SOUP_STAGE_LABELS[stage] || '';

  // Try to load Nano Banana soup image
  loadSoupImage(stage);

  // Toast
  const toasts = ['', '湯開始暖起來 🌡️', '香氣四溢 💨✨', '滾滾熱湯！🍵🔥', '神奇暖湯出現！✨🌟', '金光暖湯！終極魔法！🌟💫'];
  showMiniToast(toasts[stage] || `湯升級喇！`);
}

function loadSoupImage(stage) {
  if (stage < 1) return;
  const key = `soup_stage_${stage}`;
  const url = `${BASE_API}/assets/${key}`;
  const img = new Image();
  img.onload = () => {
    els.cauldronImg.src = url;
    els.cauldronImg.style.display = 'block';
    els.cauldronEmoji.style.display = 'none';
  };
  img.onerror = () => {
    // Asset not generated yet — keep emoji
    els.cauldronImg.style.display = 'none';
    els.cauldronEmoji.style.display = 'block';
  };
  img.src = url;
}

function loadBgImage(level) {
  if (state.bgLevel === level) return;
  const key = `bg_level_${level}`;
  const url = `${BASE_API}/assets/${key}`;
  const img = new Image();
  img.onload = () => {
    state.bgLevel = level;
    // Set as background of game-bg; CSS scene layers will render on top
    if (els.gameBg) {
      els.gameBg.style.backgroundImage = `url('${url}')`;
      els.gameBg.style.backgroundSize  = 'cover';
      els.gameBg.style.backgroundPosition = 'center bottom';
      els.gameBg.classList.add('has-nano-bg');
    }
  };
  img.onerror = () => {
    // Not generated yet — CSS gradient handles background
  };
  img.src = url;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPGRADE
// ─────────────────────────────────────────────────────────────────────────────
async function upgradeFirePower() {
  if (state.tapPowerLevel >= 10) return;
  if (state.displayPoints < state.tapUpgradeCost) {
    shakeBounce(els.upgradeBtn);
    return;
  }
  try {
    const s = await apiFetch('/state/update', 'POST', { action: 'upgrade_tap' });
    applyServerState(s);
    showMiniToast(`暖暖火力升到 Lv.${state.tapPowerLevel}！每撳 +${state.tapPower} 點 🔥`);
    // Cat celebrate
    const catEl = $('cat-main');
    if (catEl) {
      const body = catEl.querySelector('.cat-body');
      if (body) { body.classList.remove('tapped'); void body.offsetWidth; body.classList.add('tapped'); }
    }
  } catch (err) {
    if (err.message.includes('唔夠')) shakeBounce(els.upgradeBtn);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────────────────────────
function updateHUD() {
  updateHUDPoints();
  updateProgressBar();
  updateUpgradeButton();
  els.hudLevel.textContent     = state.currentLevel;
  els.hudLevelName.textContent = LEVEL_NAMES[state.currentLevel] || `第${state.currentLevel}關`;
  els.hudTapPower.textContent  = `+${state.tapPower}`;
  els.hudIdleRate.textContent  = `+${state.idleRate.toFixed(1)}`;
  // Apply level class to body for CSS scene changes
  document.body.className = `level-${state.currentLevel}`;
  updateCatVisibility(state.currentLevel);
}

function updateHUDPoints() {
  els.hudPoints.textContent = formatNumber(Math.floor(state.displayPoints));
}

function updateProgressBar() {
  const pct = Math.min(100, Math.round((state.levelProgress || 0) * 100));
  els.progressFill.style.width = pct + '%';
  const cur  = Math.floor(state.displayPoints);
  const next = state.nextLevelThreshold;
  els.progCurrent.textContent = formatNumber(cur);
  els.progNext.textContent    = next
    ? `${formatNumber(next)} → 第 ${state.currentLevel + 1} 關`
    : '已達最高關！';
}

function updateUpgradeButton() {
  if (state.tapPowerLevel >= 10) {
    els.upgradeBtn.disabled     = true;
    els.upgradeInfo.textContent = '已達最強火力 💪';
    els.upgradeBadge.textContent = 'MAX';
    els.upgradeBtn.classList.remove('can-afford');
    return;
  }
  const cost    = state.tapUpgradeCost;
  const nextPow = TAP_POWER[state.tapPowerLevel + 1] || state.tapPower;
  els.upgradeBtn.disabled     = false;
  els.upgradeInfo.textContent = `消耗 ${formatNumber(cost)} 點 → 每撳 +${nextPow}`;
  els.upgradeBadge.textContent = `Lv.${state.tapPowerLevel}`;
  els.upgradeBtn.classList.toggle('can-afford', state.displayPoints >= cost);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE / CATS
// ─────────────────────────────────────────────────────────────────────────────
function updateCatVisibility(level) {
  const visible = new Set(LEVEL_SCENE_CATS[level] || ['cat-main']);
  ['cat-main','cat-helper','cat-sleepy','cat-hedgehog','cat-bunny'].forEach(id => {
    const el = $(id);
    if (!el) return;
    if (visible.has(id)) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL-UP
// ─────────────────────────────────────────────────────────────────────────────
function onLevelChange(oldLevel, newLevel) {
  console.log(`[CherryGame] ✨ Level ${oldLevel} → ${newLevel}`);
  document.body.className = `level-${newLevel}`;
  updateCatVisibility(newLevel);

  // Start idle particles for Lv9+
  if (newLevel >= 9 && !state.idleParticleInterval) startIdleParticles();

  // Rotate story ticker to new level content
  state.tickerIndex = 0;

  // Try to load Nano Banana background for the new level
  loadBgImage(newLevel);
}

let levelupTimer;
function showLevelUp(message, level) {
  const story = LEVEL_STORIES[level] || '';
  const icons = ['','🌱','🐱','🏮','❄️','🔔','🦔','🌟','🌕','✨','👑'];

  els.levelupIcon.textContent = icons[level] || '⬆️';
  els.levelupMsg.textContent  = message;
  els.levelupStory.textContent = story;

  els.levelupToast.classList.remove('hidden');
  requestAnimationFrame(() => els.levelupToast.classList.add('show'));

  clearTimeout(levelupTimer);
  levelupTimer = setTimeout(() => {
    els.levelupToast.classList.remove('show');
    setTimeout(() => els.levelupToast.classList.add('hidden'), 500);
  }, 4500);
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY TICKER  (rotating lines at bottom)
// ─────────────────────────────────────────────────────────────────────────────
function rotateTicker() {
  const lines = STORY_TICKERS[state.currentLevel] || STORY_TICKERS[1];
  const line  = lines[state.tickerIndex % lines.length];
  state.tickerIndex++;

  // Animate out/in
  const span = els.storyText;
  span.style.animation = 'none';
  span.textContent = line;
  void span.offsetWidth;
  span.style.animation = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// IDLE ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
let lastIdleAt = Date.now();
function idleTick() {
  const now = Date.now();
  const dt  = (now - lastIdleAt) / 1000;
  lastIdleAt = now;
  if (state.idleRate > 0) {
    state.displayPoints += state.idleRate * dt;
    updateHUDPoints();
    updateProgressBar();
    updateUpgradeButton();
  }
}

function startIdleParticles() {
  state.idleParticleInterval = setInterval(() => {
    if (state.reduceFx) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:5;
      font-size:14px; left:${20 + Math.random()*60}vw; top:${40+Math.random()*40}vh;
      animation: particle-float 2s ease-out forwards;
    `;
    el.textContent = ['✨','🌟','💕','⭐','🌸'][Math.floor(Math.random()*5)];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }, 600);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function toggleSettings()     { $('settings-panel').classList.toggle('hidden'); }
function toggleMute(v)        { state.muted     = v; }
function toggleReduceFx(v)    { state.reduceFx  = v; }
function toggleDarkOverlay(v) { state.darkOverlay = v; document.body.classList.toggle('dark-overlay', v); }

async function resetProgress() {
  if (!confirm('確定重置所有分數同進度嗎？\n（此操作唔可以復原）')) return;
  try {
    await apiFetch('/state/reset', 'POST');
    // Reset local state
    state.displayPoints = 0;
    state.pendingTaps   = 0;
    state.soupStage     = 0;
    state.bgLevel       = 0;
    // Remove soup stage classes
    for (let i = 0; i <= 5; i++) els.tapZone.classList.remove(`soup-s${i}`);
    // Remove nano bg
    if (els.gameBg) { els.gameBg.style.backgroundImage = ''; els.gameBg.classList.remove('has-nano-bg'); }
    // Reset soup label
    if (els.soupLabel) els.soupLabel.textContent = SOUP_STAGE_LABELS[0];
    // Restore emoji
    els.cauldronImg.style.display   = 'none';
    els.cauldronEmoji.style.display = 'block';
    // Fetch fresh state from server
    await fetchState();
    $('settings-panel').classList.add('hidden');
    showMiniToast('進度已重置！新旅程開始 🌱');
  } catch (err) {
    showMiniToast('重置失敗：' + err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
async function adminLoadStatus() {
  try {
    const d = await fetch(`${BASE_API}/assets`).then(r => r.json());
    const lines = d.assets.map(a => `${a.generated?'✅':'⬜'} ${a.key} ${a.sizeKb?`(${a.sizeKb}KB)`:''}`).join('\n');
    $('admin-asset-status').textContent = `圖片狀態 (${d.generatedCount}/${d.totalCount}):\n${lines}`;
  } catch (e) { $('admin-asset-status').textContent = '載入失敗: '+e.message; }
}
async function adminGenerateAll() {
  adminLog('開始生成全部 Pixar 風格圖片…');
  await fetch(`${BASE_API}/assets/generate-all`, {method:'POST'});
  adminLog('任務已在後台啟動，稍後刷新查看。');
}
async function adminGenerateAsset() {
  const key = $('admin-key-input').value.trim();
  if (!key) { adminLog('請輸入 asset key'); return; }
  adminLog(`生成 ${key}…`);
  try {
    const r = await fetch(`${BASE_API}/assets/generate`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key}),
    }).then(r=>r.json());
    adminLog(r.ok ? `✅ ${key} (${r.sizeKb}KB)` : `❌ ${r.error}`);
  } catch(e) { adminLog('錯誤: '+e.message); }
}
function adminLog(msg) {
  const log = $('admin-log');
  log.textContent += msg+'\n';
  log.scrollTop = log.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function formatNumber(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 10_000)    return (n/1000).toFixed(1)+'K';
  return Math.floor(n).toLocaleString('zh-HK');
}
function setLoadingMsg(msg, pct) {
  $('loading-msg').textContent = msg;
  $('loading-bar').style.width = pct + '%';
}
function shakeBounce(el) {
  el.style.transform='translateX(-6px)';
  setTimeout(()=>{el.style.transform='translateX(6px)';},80);
  setTimeout(()=>{el.style.transform='translateX(0)';},200);
}
let miniToastTimer;
function showMiniToast(msg) {
  let el = document.querySelector('.mini-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'mini-toast';
    el.style.cssText = `
      position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);
      background:rgba(255,220,100,0.96);color:#3d2b1a;padding:10px 20px;
      border-radius:20px;font-size:14px;font-weight:700;z-index:500;
      pointer-events:none;transition:opacity 0.3s;
      font-family:-apple-system,'PingFang HK',sans-serif;
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(miniToastTimer);
  miniToastTimer = setTimeout(()=>{ el.style.opacity='0'; }, 2200);
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
async function init() {
  setLoadingMsg('暖湯小廚房準備中…', 5);

  const isAdmin = new URLSearchParams(location.search).get('admin') === '1';

  const ok = await initSession();
  if (!ok) return;

  setLoadingMsg('載入你的遊戲進度…', 50);
  await fetchState();

  setLoadingMsg('廚房準備好喇！', 100);
  await new Promise(r => setTimeout(r, 600));

  // Apply initial scene
  document.body.className = `level-${state.currentLevel}`;
  updateCatVisibility(state.currentLevel);
  loadBgImage(state.currentLevel);

  $('loading-screen').classList.add('fade-out');
  setTimeout(() => { $('loading-screen').style.display = 'none'; }, 900);

  state.loaded = true;

  if (state.currentLevel >= 9) startIdleParticles();

  if (isAdmin) { $('admin-panel').classList.remove('hidden'); adminLoadStatus(); }

  // Bind tap
  els.tapZone.addEventListener('touchstart', handleTap, { passive: false });
  els.tapZone.addEventListener('mousedown',  handleTap);
  els.tapZone.addEventListener('contextmenu', e => e.preventDefault());

  // Periodic sync
  setInterval(syncTaps,     SYNC_INTERVAL_MS);
  setInterval(fetchState,   POLL_INTERVAL_MS);
  setInterval(rotateTicker, 8000);

  // Smooth idle tick
  function animFrame() { idleTick(); requestAnimationFrame(animFrame); }
  requestAnimationFrame(animFrame);

  // Initial ticker
  rotateTicker();
  updateHUD();
}

window.game = { upgradeFirePower, toggleSettings, toggleMute, toggleReduceFx, toggleDarkOverlay, resetProgress, adminGenerateAll, adminGenerateAsset };
document.addEventListener('DOMContentLoaded', init);
