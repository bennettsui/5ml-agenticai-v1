'use strict';

/* ═══════════════════════════════════════════════════════════════
   Client Dashboard — Live Status + AI Chatbot
   Real-time stats via SSE + periodic polling.
   ═══════════════════════════════════════════════════════════════ */

const API = window.API_BASE || '/api/event-checkin';
const COLORS = ['Red', 'Purple', 'Blue', 'Green', '策略影響夥伴', 'AI 戰略合作夥伴 iKala', '實物與社群夥伴'];
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
const listSearch   = document.getElementById('listSearch');
const listBody     = document.getElementById('listBody');
const listCount    = document.getElementById('listCount');
const listLoading  = document.getElementById('listLoading');

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
    listUpdateOne(payload);
  });

  src.addEventListener('bulk_status_updated', (e) => {
    const { payload } = JSON.parse(e.data);
    if (payload.status === 'checked_in') {
      for (const p of (payload.rows || [])) addActivity(p);
    }
    for (const p of (payload.rows || [])) listUpdateOne(p);
  });

  src.addEventListener('participant_created', (e) => {
    const { payload } = JSON.parse(e.data);
    allParticipants.unshift(payload);
    applyFilter();
  });

  src.addEventListener('bulk_imported', (e) => {
    const { payload } = JSON.parse(e.data);
    if (Array.isArray(payload)) {
      allParticipants.unshift(...payload);
      applyFilter();
    }
  });

  src.addEventListener('participant_deleted', (e) => {
    const { payload } = JSON.parse(e.data);
    const idx = allParticipants.findIndex(p => p.id === payload.id);
    if (idx !== -1) { allParticipants.splice(idx, 1); applyFilter(); }
  });

  src.addEventListener('bulk_deleted', (e) => {
    const { payload } = JSON.parse(e.data);
    const ids = new Set(payload.ids || []);
    allParticipants = allParticipants.filter(p => !ids.has(p.id));
    applyFilter();
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

// ─── Guest list ───────────────────────────────────────────────────────────────

let allParticipants = [];
let listFilterColor  = '';
let listFilterStatus = '';
let listSearchQ      = '';
let sortCol = 'name';
let sortDir = 1; // 1=asc, -1=desc

async function loadParticipants() {
  try {
    const resp = await fetch(`${API}/admin/participants?pageSize=2000`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);
    allParticipants = data.rows || [];
    listLoading.textContent = '';
    applyFilter();
  } catch (err) {
    listLoading.textContent = 'Failed to load';
    listBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--color-red);font-size:13px;">Error: ${esc(err.message)}</td></tr>`;
  }
}

function applyFilter() {
  const q = listSearchQ.toLowerCase();
  let rows = allParticipants.filter(p => {
    if (listFilterColor  && p.color  !== listFilterColor)  return false;
    if (listFilterStatus && p.status !== listFilterStatus) return false;
    if (q) {
      const name = composeName(p).toLowerCase();
      const org  = (p.organization || '').toLowerCase();
      if (!name.includes(q) && !org.includes(q)) return false;
    }
    return true;
  });

  // Sort
  rows.sort((a, b) => {
    let av, bv;
    if (sortCol === 'name')         { av = composeName(a); bv = composeName(b); }
    else if (sortCol === 'organization') { av = a.organization || ''; bv = b.organization || ''; }
    else if (sortCol === 'status')  { av = a.status; bv = b.status; }
    else if (sortCol === 'color')   { av = a.color;  bv = b.color; }
    return av.localeCompare(bv) * sortDir;
  });

  listCount.textContent = `${rows.length} / ${allParticipants.length} guests`;
  renderListRows(rows);
}

function renderListRows(rows) {
  if (!rows.length) {
    listBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">No guests match the current filter.</td></tr>`;
    return;
  }
  listBody.innerHTML = rows.map(p => {
    const name    = esc(composeName(p));
    const org     = esc(p.organization || '');
    const checked = p.status === 'checked_in';
    return `<tr data-id="${p.id}">
      <td><span class="tag" data-color="${p.color}">${p.color}</span></td>
      <td style="font-weight:600;">${name}</td>
      <td style="color:var(--text-muted);">${org}</td>
      <td>${checked
        ? '<span class="status-checked">✓ Checked-in</span>'
        : '<span class="status-not-checked">○ Not yet</span>'}</td>
    </tr>`;
  }).join('');
}

// Update a single participant in allParticipants and re-render
function listUpdateOne(p) {
  const idx = allParticipants.findIndex(r => r.id === p.id);
  if (idx !== -1) {
    allParticipants[idx] = p;
    // Patch just the status cell if the row is visible — avoids full re-render on every check-in
    const tr = listBody.querySelector(`tr[data-id="${p.id}"]`);
    if (tr) {
      const checked = p.status === 'checked_in';
      tr.cells[3].innerHTML = checked
        ? '<span class="status-checked">✓ Checked-in</span>'
        : '<span class="status-not-checked">○ Not yet</span>';
    }
  } else {
    allParticipants.unshift(p);
    applyFilter();
  }
}

// ─── Sort controls ────────────────────────────────────────────────────────────

document.querySelectorAll('.list-table thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortCol === col) { sortDir *= -1; }
    else { sortCol = col; sortDir = 1; }
    // Update icons
    document.querySelectorAll('.sort-icon').forEach(el => {
      el.textContent = '↕'; el.classList.remove('active');
    });
    const icon = document.getElementById(`sort-${col}`);
    if (icon) { icon.textContent = sortDir === 1 ? '↑' : '↓'; icon.classList.add('active'); }
    applyFilter();
  });
});

// ─── Filter pills ────────────────────────────────────────────────────────────

document.getElementById('colorPills').addEventListener('click', (e) => {
  const btn = e.target.closest('.pill');
  if (!btn) return;
  document.querySelectorAll('#colorPills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  listFilterColor = btn.dataset.color;
  applyFilter();
});

document.getElementById('statusPills').addEventListener('click', (e) => {
  const btn = e.target.closest('.pill');
  if (!btn) return;
  document.querySelectorAll('#statusPills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  listFilterStatus = btn.dataset.status;
  applyFilter();
});

// ─── Quick search ─────────────────────────────────────────────────────────────

let listSearchTimer;
listSearch.addEventListener('input', () => {
  clearTimeout(listSearchTimer);
  listSearchTimer = setTimeout(() => {
    listSearchQ = listSearch.value.trim();
    applyFilter();
  }, 120);
});

loadParticipants();

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
