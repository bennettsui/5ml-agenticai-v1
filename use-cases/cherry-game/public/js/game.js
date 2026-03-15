/**
 * 貓貓暖湯 TAP TAP — Game Logic
 * Made with love for Cherry 💕
 *
 * Architecture:
 *   - All game state lives in Fly Postgres (server-side)
 *   - Frontend keeps ONLY in-memory state (lost on reload = intentional)
 *   - sessionStorage stores ONLY the session token (not game values)
 *   - Every ~5 seconds, pending taps are sent to server; server computes new state
 *   - Frontend shows optimistic UI (instant +N) while waiting for server
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG  (adjust here for tuning without touching game logic)
// ─────────────────────────────────────────────────────────────────────────────
const BASE_API = '/api/cherry-game';  // Change if hosted elsewhere

const LEVEL_THRESHOLDS = [0, 500, 2000, 5000, 10000, 20000, 40000, 75000, 125000, 200000];
const TAP_POWER        = [1, 2, 4, 7, 12, 20, 35, 60, 100, 175, 300];
const TAP_UPGRADE_COSTS= [0, 200, 800, 2000, 5000, 12000, 30000, 70000, 150000, 300000];
const IDLE_RATE        = [0, 0.2, 0.5, 1.0, 2.0, 4.0, 8.0, 15.0, 28.0, 50.0, 90.0];
const MAX_LEVEL        = 10;
const SYNC_INTERVAL_MS = 5000;   // Send tap delta to server every 5s
const IDLE_SYNC_MS     = 10000;  // Pull full state from server every 10s
const MAX_PENDING_TAPS = 2000;   // Safety cap on queued taps

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STATE  (NEVER persisted to localStorage/IndexedDB)
// ─────────────────────────────────────────────────────────────────────────────
const state = {
  sessionToken:   null,  // from sessionStorage (set on login only)
  totalPoints:    0,
  displayPoints:  0,     // smoothly animated display value
  currentLevel:   1,
  tapPowerLevel:  1,
  idleRateLevel:  1,
  tapPower:       1,
  idleRate:       0.2,
  nextLevelThreshold: 500,
  levelProgress:  0,
  tapUpgradeCost: 200,
  pendingTaps:    0,     // taps not yet sent to server
  lastSyncAt:     Date.now(),
  muted:          false,
  reduceFx:       false,
  darkOverlay:    false,
  loaded:         false,
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const els = {
  loadingScreen:  $('loading-screen'),
  loadingBar:     $('loading-bar'),
  loadingMsg:     $('loading-msg'),
  gameBg:         $('game-bg'),
  tapZone:        $('tap-zone'),
  tapHint:        $('tap-hint'),
  particles:      $('particles'),
  bubbleContainer:$('bubble-container'),
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
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION  (sessionStorage = only for session token, NOT game values)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get or create a player session.
 * Session token stored in sessionStorage (volatile, clears on tab close).
 * All game progress is in Postgres — reloading re-fetches from server.
 * NOTE: We do NOT store total_points, level, or any game value in sessionStorage.
 */
async function initSession() {
  setLoadingMsg('建立暖湯廚房連線…', 10);

  // Only the token is kept in sessionStorage; it has no game value itself
  const savedToken = sessionStorage.getItem('cherry_game_token');

  try {
    const resp = await apiFetch('/session', 'POST', { token: savedToken });
    state.sessionToken = resp.token;
    sessionStorage.setItem('cherry_game_token', resp.token); // safe: just an ID

    setLoadingMsg('載入遊戲進度…', 40);
    return true;
  } catch (err) {
    setLoadingMsg('連線失敗，請刷新頁面。', 100);
    console.error('[CherryGame] Session init failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
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
  const tapsToSend = Math.min(state.pendingTaps, MAX_PENDING_TAPS);
  state.pendingTaps -= tapsToSend;

  try {
    const s = await apiFetch('/state/update', 'POST', { tapCount: tapsToSend, action: 'tap' });
    applyServerState(s);
    if (s.levelUpMessage) showLevelUp(s.levelUpMessage);
  } catch (err) {
    // On failure, add taps back to queue
    state.pendingTaps += tapsToSend;
    console.warn('[CherryGame] syncTaps failed:', err.message);
  }
}

function applyServerState(s) {
  const oldLevel = state.currentLevel;

  state.totalPoints       = s.totalPoints;
  state.currentLevel      = s.currentLevel;
  state.tapPowerLevel     = s.tapPowerLevel;
  state.idleRateLevel     = s.idleRateLevel;
  state.tapPower          = s.tapPower;
  state.idleRate          = s.idleRate;
  state.nextLevelThreshold= s.nextLevelThreshold;
  state.levelProgress     = s.levelProgress;
  state.tapUpgradeCost    = s.tapUpgradeCost;

  // Sync display points upward only (prevent flicker on idle gain)
  if (state.totalPoints > state.displayPoints) {
    state.displayPoints = state.totalPoints;
  }

  if (state.currentLevel !== oldLevel && state.loaded) {
    onLevelChange(oldLevel, state.currentLevel);
  }

  updateHUD();
}

// ─────────────────────────────────────────────────────────────────────────────
// TAPPING MECHANIC
// ─────────────────────────────────────────────────────────────────────────────

function handleTap(event) {
  event.preventDefault();

  // Optimistic: add points immediately to display
  state.displayPoints += state.tapPower;
  state.pendingTaps   += 1;
  state.tapHintShown  = true;

  // Hide hint after first tap
  if (els.tapHint.style.opacity !== '0') {
    els.tapHint.style.opacity = '0';
  }

  // Visual effects
  const rect = els.tapZone.getBoundingClientRect();
  const touch = event.touches?.[0] || event;
  const x = (touch.clientX || rect.left + rect.width / 2) - rect.left;
  const y = (touch.clientY || rect.top  + rect.height / 2) - rect.top;

  spawnTapParticle(x, y);
  if (!state.reduceFx) spawnShockwave(x, y);
  animateCauldron();

  updateHUDPoints();
  updateProgressBar();
  updateUpgradeButton();
}

function spawnTapParticle(x, y) {
  const el = document.createElement('div');
  el.className = 'tap-particle' + (state.tapPower >= 20 ? ' big' : '');

  const value = state.tapPower;
  el.textContent = value >= 10 ? `+${value} 暖暖` : `+${value}`;

  // Random horizontal drift
  const drift = (Math.random() - 0.5) * 60;
  el.style.left   = (x + drift) + 'px';
  el.style.top    = y + 'px';
  el.style.transform = 'translate(-50%, -50%)';

  els.particles.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function spawnShockwave(x, y) {
  const el = document.createElement('div');
  el.className = 'tap-shockwave';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  els.particles.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function animateCauldron() {
  const wrap = document.querySelector('.cauldron-wrap');
  if (!wrap) return;
  wrap.style.transition = 'transform 0.08s';
  wrap.style.transform  = 'scale(0.93) rotate(-2deg)';
  setTimeout(() => {
    wrap.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
    wrap.style.transform  = 'scale(1) rotate(0deg)';
  }, 80);
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

    // Flash effect
    els.upgradeBtn.style.transition = 'background 0.1s';
    els.upgradeBtn.style.background = 'linear-gradient(135deg, rgba(255,220,80,0.7), rgba(230,130,30,0.9))';
    setTimeout(() => { els.upgradeBtn.style.background = ''; }, 400);

    showMiniToast(`暖暖火力升到 Lv.${state.tapPowerLevel}！每撳 +${state.tapPower} 點 🔥`);
  } catch (err) {
    if (err.message.includes('點數唔夠')) {
      shakeBounce(els.upgradeBtn);
    }
    console.warn('[CherryGame] upgrade failed:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD UPDATES
// ─────────────────────────────────────────────────────────────────────────────

function updateHUD() {
  updateHUDPoints();
  updateProgressBar();
  updateUpgradeButton();

  els.hudLevel.textContent     = state.currentLevel;
  els.hudLevelName.textContent = getLevelName(state.currentLevel);
  els.hudTapPower.textContent  = `+${state.tapPower}`;
  els.hudIdleRate.textContent  = `+${state.idleRate.toFixed(1)}`;

  document.body.className = `level-${state.currentLevel}`;
}

function updateHUDPoints() {
  els.hudPoints.textContent = formatNumber(Math.floor(state.displayPoints));
}

function updateProgressBar() {
  const pct = Math.min(100, Math.round((state.levelProgress || 0) * 100));
  els.progressFill.style.width = pct + '%';

  const cur = state.totalPoints;
  const next = state.nextLevelThreshold;
  els.progCurrent.textContent = formatNumber(cur);

  if (next) {
    els.progNext.textContent = `${formatNumber(next)} → 第 ${state.currentLevel + 1} 關`;
  } else {
    els.progNext.textContent = '已達最高關！';
  }
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
  const canAfford = state.displayPoints >= cost;

  els.upgradeBtn.disabled     = false;
  els.upgradeInfo.textContent = `消耗 ${formatNumber(cost)} 點 → 每撳 +${nextPow}`;
  els.upgradeBadge.textContent = `Lv.${state.tapPowerLevel}`;
  els.upgradeBtn.classList.toggle('can-afford', canAfford);
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL CHANGE
// ─────────────────────────────────────────────────────────────────────────────

function onLevelChange(oldLevel, newLevel) {
  console.log(`[CherryGame] Level ${oldLevel} → ${newLevel}`);
  loadBackground(newLevel);

  // Idle particles for level 9+
  if (newLevel >= 9 && !state.idleParticleInterval) {
    startIdleParticles();
  }

  // Level 10 special glow
  if (newLevel >= 10) {
    document.body.classList.add('level-10');
  }
}

function showLevelUp(message) {
  els.levelupToast.classList.remove('hidden');
  els.levelupMsg.textContent = message;

  requestAnimationFrame(() => {
    els.levelupToast.classList.add('show');
  });

  setTimeout(() => {
    els.levelupToast.classList.remove('show');
    setTimeout(() => els.levelupToast.classList.add('hidden'), 500);
  }, 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND LOADING
// ─────────────────────────────────────────────────────────────────────────────

let currentBgLevel = 0;
const bgCache = {};  // level → data URL (in-memory cache only)

function loadBackground(level) {
  if (currentBgLevel === level && bgCache[level]) return;
  currentBgLevel = level;

  const key = `bg_level_${level}`;
  const url = `${BASE_API}/assets/${key}`;

  if (bgCache[level]) {
    applyBackground(bgCache[level]);
    return;
  }

  // Load image — if not yet generated, show gradient placeholder
  const img = new Image();
  img.onload = () => {
    // Store data URL in memory (not localStorage!)
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    bgCache[level] = url; // just cache the URL reference
    applyBackground(url);
  };
  img.onerror = () => {
    // Background not generated yet — use warm gradient
    applyBackground(null, level);
  };
  img.src = url + '?t=' + Date.now();
}

function applyBackground(url, level) {
  if (url) {
    els.gameBg.style.backgroundImage = `url('${url}')`;
    els.gameBg.classList.add('has-image');
    els.gameBg.querySelector('.bg-placeholder')?.remove();
  } else {
    // Gradient fallback per level
    const gradients = [
      'linear-gradient(180deg, #1a0f06 0%, #3a1a08 50%, #1a0f06 100%)',
      'linear-gradient(180deg, #1a1205 0%, #3a2510 50%, #1a1205 100%)',
      'linear-gradient(180deg, #180a05 0%, #4a1510 50%, #180a05 100%)',
      'linear-gradient(180deg, #0a0f1a 0%, #1a2535 50%, #0a0f1a 100%)',
      'linear-gradient(180deg, #1a1205 0%, #352010 50%, #1a1205 100%)',
      'linear-gradient(180deg, #1a1205 0%, #3a2810 50%, #1a1205 100%)',
      'linear-gradient(180deg, #1a1205 0%, #4a2510 50%, #1a1205 100%)',
      'linear-gradient(180deg, #050a1a 0%, #0f1a35 50%, #050a1a 100%)',
      'linear-gradient(180deg, #0f0a05 0%, #3a2805 50%, #0f0a05 100%)',
      'linear-gradient(180deg, #1a1000 0%, #5a3a00 50%, #1a1000 100%)',
    ];
    els.gameBg.style.backgroundImage = gradients[(level || 1) - 1] || gradients[0];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IDLE POINTS (CLIENT-SIDE INTERPOLATION)
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

// ─────────────────────────────────────────────────────────────────────────────
// IDLE PARTICLES (level 9+)
// ─────────────────────────────────────────────────────────────────────────────

function startIdleParticles() {
  state.idleParticleInterval = setInterval(() => {
    if (state.reduceFx) return;
    const el = document.createElement('div');
    el.className = 'idle-particle';
    el.textContent = '✨';
    el.style.left = (20 + Math.random() * 60) + 'vw';
    el.style.top  = (40 + Math.random() * 40) + 'vh';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }, 800);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

function toggleSettings() {
  $('settings-panel').classList.toggle('hidden');
}

function toggleMute(v)        { state.muted      = v; }
function toggleReduceFx(v)    { state.reduceFx   = v; }
function toggleDarkOverlay(v) {
  state.darkOverlay = v;
  document.body.classList.toggle('dark-overlay', v);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

async function adminLoadStatus() {
  try {
    const data = await fetch(`${BASE_API}/assets`).then(r => r.json());
    const lines = data.assets.map(a =>
      `${a.generated ? '✅' : '⬜'} ${a.key} ${a.sizeKb ? `(${a.sizeKb}KB)` : '(未生成)'}`
    ).join('\n');
    $('admin-asset-status').textContent = `圖片狀態 (${data.generatedCount}/${data.totalCount}):\n\n${lines}`;
  } catch (e) {
    $('admin-asset-status').textContent = '載入失敗: ' + e.message;
  }
}

async function adminGenerateAll() {
  adminLog('開始生成全部 Pixar 風格圖片…');
  try {
    await fetch(`${BASE_API}/assets/generate-all`, { method: 'POST' });
    adminLog('生成任務已在後台啟動，請稍後刷新查看狀態。');
  } catch (e) {
    adminLog('錯誤: ' + e.message);
  }
}

async function adminGenerateAsset() {
  const key = $('admin-key-input').value.trim();
  if (!key) { adminLog('請輸入 asset key'); return; }
  adminLog(`生成 ${key}…`);
  try {
    const r = await fetch(`${BASE_API}/assets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }).then(r => r.json());
    adminLog(r.ok ? `✅ ${key} 完成 (${r.sizeKb}KB)` : `❌ ${r.error}`);
  } catch (e) {
    adminLog('錯誤: ' + e.message);
  }
}

function adminLog(msg) {
  const log = $('admin-log');
  log.textContent += msg + '\n';
  log.scrollTop = log.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000)    return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString('zh-HK');
}

function getLevelName(level) {
  const names = ['', '暖湯初現','貓貓相遇','燈籠輝光','窗外飄雪','風鈴魚乾','小動物齊來','BB快樂到來','星空月色','暖光粒子','金湯滿溢'];
  return names[level] || `第 ${level} 關`;
}

function setLoadingMsg(msg, pct) {
  els.loadingMsg.textContent = msg;
  els.loadingBar.style.width = pct + '%';
}

function shakeBounce(el) {
  el.style.animation = 'none';
  el.style.transform = 'translateX(-6px)';
  setTimeout(() => { el.style.transform = 'translateX(6px)'; }, 80);
  setTimeout(() => { el.style.transform = 'translateX(-4px)'; }, 160);
  setTimeout(() => { el.style.transform = 'translateX(0)'; el.style.animation = ''; }, 240);
}

let miniToastTimer;
function showMiniToast(msg) {
  let el = document.querySelector('.mini-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'mini-toast';
    el.style.cssText = `
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) scale(1);
      background:rgba(255,220,100,0.95); color:#3d2b1a; padding:10px 20px;
      border-radius:20px; font-size:14px; font-weight:700; z-index:500;
      pointer-events:none; transition:opacity 0.3s; font-family:${document.body.style.fontFamily};
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(miniToastTimer);
  miniToastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  setLoadingMsg('暖湯小廚房準備中…', 5);

  // Check for admin mode
  const isAdmin = new URLSearchParams(location.search).get('admin') === '1';

  const ok = await initSession();
  if (!ok) return;

  setLoadingMsg('取得遊戲進度…', 60);
  await fetchState();

  setLoadingMsg('載入背景圖片…', 80);
  loadBackground(state.currentLevel);

  setLoadingMsg('暖湯廚房準備好！', 100);

  // Short delay then fade out loading screen
  await new Promise(r => setTimeout(r, 600));
  els.loadingScreen.classList.add('fade-out');
  setTimeout(() => { els.loadingScreen.style.display = 'none'; }, 900);

  state.loaded = true;

  // Start idle particle effect for high levels
  if (state.currentLevel >= 9) startIdleParticles();

  // Admin panel
  if (isAdmin) {
    $('admin-panel').classList.remove('hidden');
    adminLoadStatus();
  }

  // Bind tap events
  els.tapZone.addEventListener('touchstart', handleTap, { passive: false });
  els.tapZone.addEventListener('mousedown',  handleTap);

  // Prevent context menu on long-press
  els.tapZone.addEventListener('contextmenu', e => e.preventDefault());

  // Periodic sync: send pending taps to server
  setInterval(syncTaps, SYNC_INTERVAL_MS);

  // Periodic full state refresh (catches idle gains computed server-side)
  setInterval(fetchState, IDLE_SYNC_MS);

  // Smooth client-side idle animation (60fps)
  function animFrame() {
    idleTick();
    requestAnimationFrame(animFrame);
  }
  requestAnimationFrame(animFrame);

  updateHUD();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSE to HTML onclick handlers
// ─────────────────────────────────────────────────────────────────────────────
window.game = {
  upgradeFirePower,
  toggleSettings,
  toggleMute,
  toggleReduceFx,
  toggleDarkOverlay,
  adminGenerateAll,
  adminGenerateAsset,
};

// Start!
document.addEventListener('DOMContentLoaded', init);
