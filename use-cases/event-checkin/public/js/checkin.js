'use strict';

/* ═══════════════════════════════════════════════════════════════
   Check-in Page — Client JS
   Uses Server-Sent Events (SSE) for real-time sync.
   API base is injected as window.API_BASE from the HTML.
   ═══════════════════════════════════════════════════════════════ */

const API = window.API_BASE || '/api/event-checkin';

// ─── State ────────────────────────────────────────────────────────────────────
const cardMap = new Map(); // participantId → DOM card element
let lastQuery = '';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const searchInput  = document.getElementById('searchInput');
const autocomplete = document.getElementById('autocomplete');
const resultsList  = document.getElementById('resultsList');
const hint         = document.getElementById('hint');
const addModal     = document.getElementById('addModal');
const addForm      = document.getElementById('addForm');
const toastCont    = document.getElementById('toastContainer');

// ─── SSE real-time connection ─────────────────────────────────────────────────
let evtSource;

function connectSSE() {
  evtSource = new EventSource(`${API}/events`);

  evtSource.addEventListener('connected', () => setConn(true));

  evtSource.onerror = () => {
    setConn(false);
    // Browser auto-reconnects EventSource; just update UI
  };

  evtSource.addEventListener('participant_updated', (e) => {
    const { payload } = JSON.parse(e.data);
    const card = cardMap.get(payload.id);
    if (card) updateCard(card, payload);
  });

  evtSource.addEventListener('participant_created', (e) => {
    const { payload } = JSON.parse(e.data);
    if (lastQuery && participantMatchesQuery(payload, lastQuery)) {
      prependCard(payload);
      toast('New participant added by another device.', 'info');
    }
  });

  evtSource.addEventListener('participant_deleted', (e) => {
    const { payload } = JSON.parse(e.data);
    const card = cardMap.get(payload.id);
    if (card) { card.remove(); cardMap.delete(payload.id); }
  });

  evtSource.addEventListener('bulk_status_updated', (e) => {
    const { payload } = JSON.parse(e.data);
    for (const p of (payload.rows || [])) {
      const card = cardMap.get(p.id);
      if (card) updateCard(card, p);
    }
  });

  evtSource.addEventListener('bulk_deleted', (e) => {
    const { payload } = JSON.parse(e.data);
    for (const id of (payload.ids || [])) {
      const card = cardMap.get(id);
      if (card) { card.remove(); cardMap.delete(id); }
    }
  });

  evtSource.addEventListener('bulk_imported', (e) => {
    const { payload } = JSON.parse(e.data);
    if (lastQuery && Array.isArray(payload)) {
      const matches = payload.filter(p => participantMatchesQuery(p, lastQuery));
      if (matches.length) {
        matches.forEach(prependCard);
        toast(`${matches.length} new participant(s) imported.`, 'info');
      }
    }
  });

  // Reconnection: EventSource reconnects automatically, but we watch onerror
  // to update the UI indicator. Re-mark connected on the next 'connected' event.
}

function setConn(online) {
  const dot   = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  dot.className     = 'conn-dot ' + (online ? 'connected' : 'disconnected');
  label.textContent = online ? 'Live' : 'Reconnecting…';
}

connectSSE();

// ─── Search ───────────────────────────────────────────────────────────────────

let debounceTimer;
let lastSuggestions = []; // cached results for Enter-to-show-cards

// Typing → fetch suggestions → show autocomplete dropdown only (no cards yet)
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (!q) { clearResults(); showHint(true); hideAutocomplete(); lastSuggestions = []; return; }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 150);
});

// Enter → show result cards from cached suggestions (or re-fetch)
// Escape → close autocomplete
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer);
    hideAutocomplete();
    const q = searchInput.value.trim();
    if (!q) return;
    if (lastSuggestions.length > 0) {
      renderCards(lastSuggestions, q);
    } else {
      fetchAndShowCards(q);
    }
  }
  if (e.key === 'Escape') hideAutocomplete();
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !autocomplete.contains(e.target)) hideAutocomplete();
});

// Fetch for autocomplete: shows dropdown, does NOT render cards
async function fetchSuggestions(query) {
  lastQuery = query;
  showHint(false);
  try {
    const resp = await fetch(`${API}/participants/search?query=${encodeURIComponent(query)}`);
    const data = await resp.json();
    lastSuggestions = data;
    renderAutocomplete(data);
  } catch {
    hideAutocomplete();
  }
}

// Fetch then immediately render cards (used when Enter pressed before suggestions loaded)
async function fetchAndShowCards(query) {
  lastQuery = query;
  showHint(false);
  try {
    const resp = await fetch(`${API}/participants/search?query=${encodeURIComponent(query)}`);
    const data = await resp.json();
    lastSuggestions = data;
    renderCards(data, query);
  } catch {
    toast('Search failed. Please try again.', 'error');
  }
}

function composeName(p) {
  return [p.title, p.first_name, p.last_name].filter(Boolean).join(' ');
}

function renderAutocomplete(participants) {
  if (!participants.length) { hideAutocomplete(); return; }
  autocomplete.innerHTML = '';
  const limit = Math.min(participants.length, 8);
  for (let i = 0; i < limit; i++) {
    const p    = participants[i];
    const name = composeName(p);
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.innerHTML = `
      <span class="badge badge-${p.color}" style="font-size:10px;">${p.color}</span>
      <span style="font-weight:600;">${esc(name)}</span>
      <span style="color:var(--text-muted);font-size:12px;">${esc(p.organization || '')}</span>
    `;
    // Click: fill input, show that participant's card immediately, hide dropdown
    item.addEventListener('click', () => {
      searchInput.value = name;
      hideAutocomplete();
      lastQuery = name;
      showHint(false);
      renderCards([p], name);
    });
    autocomplete.appendChild(item);
  }
  autocomplete.classList.remove('hidden');
}

function hideAutocomplete() { autocomplete.classList.add('hidden'); }

// ─── Render results ───────────────────────────────────────────────────────────

function clearResults() { resultsList.innerHTML = ''; cardMap.clear(); }

function renderCards(participants, query) {
  clearResults();
  if (!participants.length) {
    // No exact match — kick off AI fuzzy search
    resultsList.innerHTML = `
      <div class="empty-state" id="aiSearchState">
        <div class="ai-spinner">✨ No match found — trying AI search…</div>
      </div>
    `;
    doAISearch(query);
    return;
  }
  for (const p of participants) {
    const card = buildCard(p);
    resultsList.appendChild(card);
    cardMap.set(p.id, card);
  }
}

async function doAISearch(query) {
  try {
    const resp = await fetch(`${API}/ai/search-assist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await resp.json();
    const state = document.getElementById('aiSearchState');
    if (!state) return; // user typed again, ignore

    if (!data.participants || !data.participants.length) {
      state.innerHTML = `
        <h3>No results found</h3>
        <p>No participant found matching "<strong>${esc(query)}</strong>".</p>
        <p>Do you want to add this participant?</p>
        <button class="btn btn-primary" id="addNewBtn">+ Add New Participant</button>
      `;
      document.getElementById('addNewBtn').addEventListener('click', openAddModal);
      return;
    }

    state.innerHTML = `<div class="ai-label">✨ AI-suggested matches for "<strong>${esc(query)}</strong>"</div>`;
    for (const p of data.participants) {
      const card = buildCard(p);
      state.appendChild(card);
      cardMap.set(p.id, card);
    }
  } catch {
    const state = document.getElementById('aiSearchState');
    if (state) {
      state.innerHTML = `
        <h3>No results found</h3>
        <p>No participant found matching "<strong>${esc(query)}</strong>".</p>
        <button class="btn btn-primary" id="addNewBtn">+ Add New Participant</button>
      `;
      document.getElementById('addNewBtn').addEventListener('click', openAddModal);
    }
  }
}

function prependCard(p) {
  if (cardMap.has(p.id)) return;
  const card = buildCard(p);
  resultsList.prepend(card);
  cardMap.set(p.id, card);
}

function buildCard(p) {
  const checked = p.status === 'checked_in';
  const card    = document.createElement('div');
  card.className = `participant-card${checked ? ' is-checked' : ''}`;
  card.dataset.id = p.id;

  const displayName = composeName(p);
  const hasRemarks  = !!(p.remarks && p.remarks.trim());
  card.innerHTML = `
    <div class="card-badge-col">
      <span class="badge badge-${p.color}">${p.color}</span>
      ${p.no ? `<span class="card-num">#${esc(p.no)}</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-name">${esc(displayName)}</div>
      <div class="card-org">${esc(p.organization || '')}</div>
      ${p.phone ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">📞 ${esc(p.phone)}</div>` : ''}
      ${p.email ? `<div style="font-size:12px;color:var(--text-muted);">✉ ${esc(p.email)}</div>` : ''}
      <div class="card-actions">
        ${checked
          ? `<span class="status-checked">✓ Checked-in</span>`
          : `<span class="status-not-checked">○ Not checked-in</span>`}
        <button
          class="btn btn-checkin ${checked ? 'btn-outline' : `btn-color-${p.color}`}"
          data-action="checkin"
          ${checked ? 'disabled' : ''}
        >${checked ? 'Checked-in ✓' : 'Check In'}</button>
        <button class="btn btn-outline" data-action="toggle-remarks"
          style="font-size:14px;">
          📝 Remarks${hasRemarks ? ' ●' : ''}
        </button>
      </div>
      <div class="card-remarks-wrap hidden" data-remarks-wrap>
        <textarea data-action="remarks" placeholder="Add remarks…" rows="2">${esc(p.remarks || '')}</textarea>
        <button class="btn btn-sm btn-outline" data-action="save-remarks" style="margin-top:8px;">Save Remarks</button>
      </div>
    </div>
  `;

  card.querySelector('[data-action="toggle-remarks"]').addEventListener('click', () => {
    card.querySelector('[data-remarks-wrap]').classList.toggle('hidden');
  });

  card.querySelector('[data-action="checkin"]').addEventListener('click', async (e) => {
    const btn     = e.currentTarget;
    const remarks = card.querySelector('[data-action="remarks"]').value;
    btn.disabled  = true; btn.textContent = 'Checking in…';
    try {
      const resp = await fetch(`${API}/participants/${p.id}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const updated = await resp.json();
      updateCard(card, updated);
      toast(`${composeName(updated)} checked in!`, 'success');
    } catch {
      btn.disabled = false; btn.textContent = 'Check In';
      toast('Check-in failed. Please retry.', 'error');
    }
  });

  card.querySelector('[data-action="save-remarks"]').addEventListener('click', () => saveRemarks(p.id, card));
  card.querySelector('[data-action="remarks"]').addEventListener('blur', () => saveRemarks(p.id, card));

  return card;
}

async function saveRemarks(id, card) {
  const remarks = card.querySelector('[data-action="remarks"]').value;
  try {
    const resp = await fetch(`${API}/participants/${id}/remarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    if (!resp.ok) throw new Error();
  } catch {
    toast('Failed to save remarks.', 'error');
  }
}

function updateCard(card, p) {
  const checked = p.status === 'checked_in';
  card.className = `participant-card${checked ? ' is-checked' : ''}`;

  const statusEl = card.querySelector('.status-checked, .status-not-checked');
  if (statusEl) {
    statusEl.className   = checked ? 'status-checked' : 'status-not-checked';
    statusEl.textContent = checked ? '✓ Checked-in' : '○ Not checked-in';
  }

  const btn = card.querySelector('[data-action="checkin"]');
  if (btn) {
    btn.disabled  = checked;
    btn.textContent = checked ? 'Checked-in ✓' : 'Check In';
    btn.className = `btn btn-checkin ${checked ? 'btn-outline' : `btn-color-${p.color}`}`;
  }

  const ta = card.querySelector('[data-action="remarks"]');
  if (ta && document.activeElement !== ta) ta.value = p.remarks || '';

  const toggle = card.querySelector('[data-action="toggle-remarks"]');
  if (toggle) toggle.textContent = `📝 Remarks${p.remarks ? ' ●' : ''}`;
}

// ─── Add participant modal ─────────────────────────────────────────────────────

function openAddModal()  { addForm.reset(); addModal.classList.remove('hidden'); }
function closeAddModal() { addModal.classList.add('hidden'); }

document.getElementById('headerAddBtn').addEventListener('click', openAddModal);
document.getElementById('addModalClose').addEventListener('click', closeAddModal);
document.getElementById('addModalCancel').addEventListener('click', closeAddModal);
addModal.addEventListener('click', (e) => { if (e.target === addModal) closeAddModal(); });

document.getElementById('addModalSubmit').addEventListener('click', async () => {
  const fd = new FormData(addForm);
  const body = {};
  for (const [k, v] of fd.entries()) body[k] = v;

  if (!body.color)      { toast('Color is required.', 'error'); return; }
  if (!body.first_name) { toast('First Name is required.', 'error'); return; }

  // Parse optional custom ID
  if (body.id) body.id = parseInt(body.id, 10) || undefined;
  else delete body.id;

  try {
    const resp = await fetch(`${API}/participants`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
    const p = await resp.json();
    closeAddModal();
    clearResults();
    const card = buildCard(p);
    resultsList.appendChild(card);
    cardMap.set(p.id, card);
    toast(`${composeName(p)} added successfully.`, 'success');
  } catch (err) {
    toast(err.message || 'Failed to add participant.', 'error');
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showHint(show) { hint.style.display = show ? '' : 'none'; }

function participantMatchesQuery(p, q) {
  const lq = q.toLowerCase();
  return [p.first_name, p.last_name, p.organization, p.color]
    .some(v => v && v.toLowerCase().includes(lq));
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
