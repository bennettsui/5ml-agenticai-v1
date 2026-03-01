'use strict';

/* ═══════════════════════════════════════════════════════════════
   Client Dashboard — Live Status + AI Chatbot
   Real-time stats via SSE + periodic polling.
   ═══════════════════════════════════════════════════════════════ */

const API = window.API_BASE || '/api/event-checkin';
const COLORS = ['Red', 'Purple', 'Blue', 'Green'];
const MAX_ACTIVITY = 20;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const heroChecked  = document.getElementById('heroChecked');
const heroTotal    = document.getElementById('heroTotal');
const heroPct      = document.getElementById('heroPct');
const lastRefresh  = document.getElementById('lastRefresh');
const groupsGrid   = document.getElementById('groupsGrid');
const activityList = document.getElementById('activityList');
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');
const toastCont    = document.getElementById('toastContainer');

// ─── SSE connection ───────────────────────────────────────────────────────────

function connectSSE() {
  const src = new EventSource(`${API}/events`);
  src.addEventListener('connected', () => setConn(true));
  src.onerror = () => setConn(false);

  // Refresh stats on any status-changing event
  const statsEvents = ['participant_updated', 'bulk_status_updated', 'participant_created', 'bulk_imported'];
  for (const evt of statsEvents) {
    src.addEventListener(evt, () => loadStats());
  }

  // Track check-ins for the activity feed
  src.addEventListener('participant_updated', (e) => {
    const { payload } = JSON.parse(e.data);
    if (payload.status === 'checked_in') addActivity(payload);
  });

  src.addEventListener('bulk_status_updated', (e) => {
    const { payload } = JSON.parse(e.data);
    if (payload.status === 'checked_in') {
      for (const p of (payload.rows || [])) addActivity(p);
    }
  });
}

function setConn(online) {
  const dot   = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  dot.className     = 'conn-dot ' + (online ? 'connected' : 'disconnected');
  label.textContent = online ? 'Live' : 'Reconnecting…';
}

connectSSE();

// ─── Stats loading ────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const resp = await fetch(`${API}/stats`);
    if (!resp.ok) throw new Error(await resp.text());
    const stats = await resp.json();
    renderStats(stats);
    lastRefresh.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error('[client dashboard] stats error:', err);
  }
}

function renderStats(stats) {
  const total   = stats.total      || 0;
  const checked = stats.checked_in || 0;
  const pct     = total ? Math.round((checked / total) * 100) : 0;

  heroChecked.textContent = checked;
  heroTotal.textContent   = total;
  heroPct.textContent     = pct + '%';

  // Color group cards
  groupsGrid.innerHTML = COLORS.map(color => {
    const g    = (stats.by_color || {})[color] || { total: 0, checked_in: 0 };
    const gpct = g.total ? Math.round((g.checked_in / g.total) * 100) : 0;
    return `
      <div class="group-card">
        <div class="group-card-header">
          <span class="badge badge-${color} group-name">${color}</span>
          <span class="group-count">${g.checked_in} / ${g.total}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill fill-${color}" style="width:${gpct}%;"></div>
        </div>
        <div class="group-footer">
          <span>${g.total - g.checked_in} remaining</span>
          <span class="group-pct">${gpct}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// Load immediately then poll every 30s as a safety net
loadStats();
setInterval(loadStats, 30000);

// ─── Activity feed ────────────────────────────────────────────────────────────

let activityItems = [];
let activitySeeded = false;

function addActivity(p) {
  if (!activitySeeded) {
    activityList.innerHTML = '';
    activitySeeded = true;
  }
  const name = composeName(p);
  const now  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const li = document.createElement('li');
  li.className = 'activity-item';
  li.innerHTML = `
    <span class="badge badge-${p.color}" style="font-size:10px;flex-shrink:0;">${p.color}</span>
    <span class="activity-name">${esc(name)}</span>
    <span class="activity-org">${esc(p.organization || '')}</span>
    <span class="activity-time">${now}</span>
  `;
  activityList.prepend(li);

  activityItems.unshift(p.id);
  if (activityItems.length > MAX_ACTIVITY) {
    activityItems.pop();
    activityList.lastElementChild?.remove();
  }
}

// ─── AI Chatbot ───────────────────────────────────────────────────────────────

function appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendMessage() {
  const q = chatInput.value.trim();
  if (!q) return;
  chatInput.value = '';
  chatSend.disabled = true;

  appendMsg(q, 'user');
  const thinking = appendMsg('✨ Thinking…', 'thinking');

  try {
    const resp = await fetch(`${API}/ai/concierge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await resp.json();
    thinking.remove();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    appendMsg(data.answer, 'bot');
  } catch (err) {
    thinking.remove();
    appendMsg('Sorry, the AI assistant is unavailable right now.', 'bot');
  } finally {
    chatSend.disabled = false;
    chatInput.focus();
  }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function composeName(p) {
  return [p.title, p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || '';
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  toastCont.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
