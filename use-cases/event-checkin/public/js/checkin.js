'use strict';

/* ═══════════════════════════════════════════════════════════════
   Check-in Page — Client JS
   ═══════════════════════════════════════════════════════════════ */

// ─── State ────────────────────────────────────────────────────────────────────
// Map of participantId → DOM card element, for real-time updates
const cardMap = new Map();
// Last search query (used to scope real-time updates)
let lastQuery = '';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const searchInput  = document.getElementById('searchInput');
const autocomplete = document.getElementById('autocomplete');
const resultsList  = document.getElementById('resultsList');
const hint         = document.getElementById('hint');
const addModal     = document.getElementById('addModal');
const addForm      = document.getElementById('addForm');
const toastCont    = document.getElementById('toastContainer');

// ─── WebSocket ────────────────────────────────────────────────────────────────
const socket = io({ reconnectionDelayMax: 10000 });

socket.on('connect', () => setConn(true));
socket.on('disconnect', () => setConn(false));

function setConn(online) {
  const dot   = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  dot.className   = 'conn-dot ' + (online ? 'connected' : 'disconnected');
  label.textContent = online ? 'Live' : 'Reconnecting…';
}

// ─── Real-time events ─────────────────────────────────────────────────────────

socket.on('participant_updated', ({ payload }) => {
  // Update existing card if visible
  const card = cardMap.get(payload.id);
  if (card) updateCard(card, payload);
});

socket.on('participant_created', ({ payload }) => {
  // If the new participant matches current search, prepend a card
  if (lastQuery && participantMatchesQuery(payload, lastQuery)) {
    prependCard(payload);
    toast('New participant added by another device.', 'info');
  }
});

socket.on('participant_deleted', ({ payload }) => {
  const card = cardMap.get(payload.id);
  if (card) { card.remove(); cardMap.delete(payload.id); }
});

socket.on('bulk_status_updated', ({ payload }) => {
  for (const p of (payload.rows || [])) {
    const card = cardMap.get(p.id);
    if (card) updateCard(card, p);
  }
});

socket.on('bulk_deleted', ({ payload }) => {
  for (const id of (payload.ids || [])) {
    const card = cardMap.get(id);
    if (card) { card.remove(); cardMap.delete(id); }
  }
});

socket.on('bulk_imported', ({ payload }) => {
  if (lastQuery && Array.isArray(payload)) {
    const matches = payload.filter(p => participantMatchesQuery(p, lastQuery));
    if (matches.length) {
      matches.forEach(prependCard);
      toast(`${matches.length} new participant(s) imported.`, 'info');
    }
  }
});

// ─── Search ───────────────────────────────────────────────────────────────────

let debounceTimer;

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (!q) { clearResults(); showHint(true); hideAutocomplete(); return; }
  debounceTimer = setTimeout(() => doSearch(q), 250);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer);
    hideAutocomplete();
    doSearch(searchInput.value.trim());
  }
  if (e.key === 'Escape') { hideAutocomplete(); }
});

// Close autocomplete on outside click
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !autocomplete.contains(e.target)) {
    hideAutocomplete();
  }
});

async function doSearch(query) {
  if (!query) return;
  lastQuery = query;
  showHint(false);

  try {
    const resp = await fetch(`/api/participants/search?query=${encodeURIComponent(query)}`);
    const data = await resp.json();
    renderResults(data, query);
    renderAutocomplete(data);
  } catch (err) {
    toast('Search failed. Please try again.', 'error');
  }
}

function renderAutocomplete(participants) {
  if (!participants.length) { hideAutocomplete(); return; }

  autocomplete.innerHTML = '';
  const limit = Math.min(participants.length, 8);
  for (let i = 0; i < limit; i++) {
    const p    = participants[i];
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.innerHTML = `
      <span class="badge badge-${p.color}" style="font-size:10px;">${p.color}</span>
      <span style="font-weight:600;">${esc(p.full_name)}</span>
      <span style="color:var(--text-muted);font-size:12px;">${esc(p.organization || '')}</span>
    `;
    item.addEventListener('click', () => {
      searchInput.value = p.full_name;
      hideAutocomplete();
      doSearch(p.full_name);
    });
    autocomplete.appendChild(item);
  }
  autocomplete.classList.remove('hidden');
}

function hideAutocomplete() { autocomplete.classList.add('hidden'); }

// ─── Render results ───────────────────────────────────────────────────────────

function clearResults() {
  resultsList.innerHTML = '';
  cardMap.clear();
}

function renderResults(participants, query) {
  clearResults();

  if (!participants.length) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>No relevant result</h3>
        <p>No participant found matching "<strong>${esc(query)}</strong>".</p>
        <p>Do you want to add this participant?</p>
        <button class="btn btn-primary" id="addNewBtn">+ Add New Participant</button>
      </div>
    `;
    document.getElementById('addNewBtn').addEventListener('click', openAddModal);
    return;
  }

  for (const p of participants) {
    const card = buildCard(p);
    resultsList.appendChild(card);
    cardMap.set(p.id, card);
  }
}

function prependCard(p) {
  if (cardMap.has(p.id)) return; // already shown
  const card = buildCard(p);
  resultsList.prepend(card);
  cardMap.set(p.id, card);
}

function buildCard(p) {
  const checked  = p.status === 'checked_in';
  const card     = document.createElement('div');
  card.className = `participant-card${checked ? ' is-checked' : ''}`;
  card.dataset.id = p.id;

  card.innerHTML = `
    <div class="card-badge-col">
      <span class="badge badge-${p.color}">${p.color}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${esc(p.full_name)}</div>
      <div class="card-meta">${[p.title, p.first_name, p.last_name].filter(Boolean).map(esc).join(' ')}</div>
      <div class="card-org">${esc(p.organization || '')}</div>

      <div class="card-actions">
        <div>
          ${checked
            ? `<span class="status-checked">✓ Checked-in</span>`
            : `<span class="status-not-checked">○ Not checked-in</span>`
          }
        </div>

        <button
          class="btn btn-sm ${checked ? 'btn-outline' : `btn-color-${p.color}`}"
          data-action="checkin"
          ${checked ? 'disabled' : ''}
          style="min-width:110px;"
        >
          ${checked ? 'Checked-in' : 'Check In'}
        </button>

        <div class="card-remarks">
          <textarea
            data-action="remarks"
            placeholder="Remarks…"
            rows="1"
          >${esc(p.remarks || '')}</textarea>
        </div>
        <button class="btn btn-sm btn-outline" data-action="save-remarks">Save</button>
      </div>
    </div>
  `;

  // ── Check-in button ────────────────────────────────────────────────────────
  card.querySelector('[data-action="checkin"]').addEventListener('click', async (e) => {
    const btn     = e.currentTarget;
    const remarks = card.querySelector('[data-action="remarks"]').value;
    btn.disabled  = true;
    btn.textContent = 'Checking in…';

    try {
      const resp = await fetch(`/api/participants/${p.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const updated = await resp.json();
      updateCard(card, updated);
      toast(`${updated.full_name} checked in!`, 'success');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Check In';
      toast('Check-in failed. Please retry.', 'error');
    }
  });

  // ── Save remarks button ────────────────────────────────────────────────────
  card.querySelector('[data-action="save-remarks"]').addEventListener('click', async () => {
    await saveRemarks(p.id, card);
  });

  // ── Remarks textarea blur → auto-save ─────────────────────────────────────
  card.querySelector('[data-action="remarks"]').addEventListener('blur', async () => {
    await saveRemarks(p.id, card);
  });

  return card;
}

async function saveRemarks(id, card) {
  const remarks = card.querySelector('[data-action="remarks"]').value;
  try {
    const resp = await fetch(`/api/participants/${id}/remarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    if (!resp.ok) throw new Error();
  } catch {
    toast('Failed to save remarks.', 'error');
  }
}

/** In-place update of an existing card's status/remarks without rebuilding it. */
function updateCard(card, p) {
  const checked = p.status === 'checked_in';
  card.className = `participant-card${checked ? ' is-checked' : ''}`;

  // Status label
  const statusEl = card.querySelector('.status-checked, .status-not-checked');
  if (statusEl) {
    statusEl.className   = checked ? 'status-checked' : 'status-not-checked';
    statusEl.textContent = checked ? '✓ Checked-in' : '○ Not checked-in';
  }

  // Check-in button
  const btn = card.querySelector('[data-action="checkin"]');
  if (btn) {
    btn.disabled    = checked;
    btn.textContent = checked ? 'Checked-in' : 'Check In';
    btn.className   = `btn btn-sm ${checked ? 'btn-outline' : `btn-color-${p.color}`}`;
  }

  // Remarks (only update if the field doesn't currently have focus — avoid clobbering user input)
  const ta = card.querySelector('[data-action="remarks"]');
  if (ta && document.activeElement !== ta) {
    ta.value = p.remarks || '';
  }
}

// ─── Add participant modal ─────────────────────────────────────────────────────

function openAddModal() {
  addForm.reset();
  addModal.classList.remove('hidden');
}

function closeAddModal() { addModal.classList.add('hidden'); }

document.getElementById('addModalClose').addEventListener('click', closeAddModal);
document.getElementById('addModalCancel').addEventListener('click', closeAddModal);
addModal.addEventListener('click', (e) => { if (e.target === addModal) closeAddModal(); });

document.getElementById('addModalSubmit').addEventListener('click', async () => {
  const fd = new FormData(addForm);
  const body = {};
  for (const [k, v] of fd.entries()) body[k] = v;

  if (!body.color || !body.full_name) {
    toast('Color and Full Name are required.', 'error');
    return;
  }

  try {
    const resp = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
    const p = await resp.json();

    closeAddModal();
    clearResults();
    const card = buildCard(p);
    resultsList.appendChild(card);
    cardMap.set(p.id, card);
    toast(`${p.full_name} added successfully.`, 'success');
  } catch (err) {
    toast(err.message || 'Failed to add participant.', 'error');
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showHint(show) { hint.style.display = show ? '' : 'none'; }

function participantMatchesQuery(p, q) {
  const lq = q.toLowerCase();
  return [p.full_name, p.first_name, p.last_name, p.organization, p.color]
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
