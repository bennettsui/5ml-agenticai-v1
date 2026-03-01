'use strict';

/* ═══════════════════════════════════════════════════════════════
   Admin Page — Client JS
   Uses Server-Sent Events (SSE) for real-time sync.
   API base is injected as window.API_BASE from the HTML.
   ═══════════════════════════════════════════════════════════════ */

const API = window.API_BASE || '/api/event-checkin';

// ─── State ────────────────────────────────────────────────────────────────────
let currentPage = 1;
let totalPages  = 1;
const PAGE_SIZE = 50;
let selectedIds = new Set();

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const tbody       = document.getElementById('adminTableBody');
const selectAll   = document.getElementById('selectAll');
const filterColor  = document.getElementById('filterColor');
const filterStatus = document.getElementById('filterStatus');
const filterQuery  = document.getElementById('filterQuery');
const prevPageBtn  = document.getElementById('prevPage');
const nextPageBtn  = document.getElementById('nextPage');
const pageInfo     = document.getElementById('pageInfo');
const totalInfo    = document.getElementById('totalInfo');
const bulkBar      = document.getElementById('bulkBar');
const bulkCount    = document.getElementById('bulkCount');
const editModal    = document.getElementById('editModal');
const editForm     = document.getElementById('editForm');
const toastCont    = document.getElementById('toastContainer');

// ─── SSE real-time connection ─────────────────────────────────────────────────

function connectSSE() {
  const evtSource = new EventSource(`${API}/events`);
  evtSource.addEventListener('connected', () => setConn(true));
  evtSource.onerror = () => setConn(false);

  // Refresh table on any relevant event
  const refreshEvents = ['participant_updated','participant_created','participant_deleted','bulk_status_updated','bulk_deleted','bulk_imported'];
  for (const evt of refreshEvents) {
    evtSource.addEventListener(evt, () => loadPage(currentPage));
  }
}

function setConn(online) {
  const dot   = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  dot.className     = 'conn-dot ' + (online ? 'connected' : 'disconnected');
  label.textContent = online ? 'Live' : 'Reconnecting…';
}

connectSSE();

// ─── Load page ────────────────────────────────────────────────────────────────

async function loadPage(page = 1) {
  currentPage = page;
  selectedIds.clear();
  updateBulkBar();
  selectAll.checked = false;

  const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
  if (filterColor.value)         params.set('color',  filterColor.value);
  if (filterStatus.value)        params.set('status', filterStatus.value);
  if (filterQuery.value.trim())  params.set('query',  filterQuery.value.trim());

  try {
    const resp = await fetch(`${API}/admin/participants?${params}`);
    const data = await resp.json();

    totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    pageInfo.textContent  = `Page ${currentPage} of ${totalPages}`;
    totalInfo.textContent = `${data.total} participant(s)`;
    prevPageBtn.disabled  = currentPage <= 1;
    nextPageBtn.disabled  = currentPage >= totalPages;

    renderTable(data.rows);
  } catch {
    toast('Failed to load participants.', 'error');
  }
}

// ─── Render table ─────────────────────────────────────────────────────────────

function renderTable(rows) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--text-muted);">No participants found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(p => {
    const checked = p.status === 'checked_in';
    return `
      <tr data-id="${p.id}">
        <td><input type="checkbox" class="row-check" data-id="${p.id}" /></td>
        <td style="color:var(--text-muted);font-size:12px;">${p.id}</td>
        <td><span class="tag tag-${p.color}">${p.color}</span></td>
        <td style="font-weight:600;">${esc(p.full_name)}</td>
        <td>${esc(p.title || '')}</td>
        <td>${esc(p.first_name || '')}</td>
        <td>${esc(p.last_name || '')}</td>
        <td>${esc(p.organization || '')}</td>
        <td>${checked ? `<span class="status-checked">✓ Checked-in</span>` : `<span class="status-not-checked">○ Not checked-in</span>`}</td>
        <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(p.remarks||'')}">${esc(p.remarks || '')}</td>
        <td>
          <button class="btn btn-sm btn-outline" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-danger"  data-action="delete" data-id="${p.id}" style="margin-left:4px;">Del</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteOne(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('.row-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = Number(chk.dataset.id);
      if (chk.checked) selectedIds.add(id); else selectedIds.delete(id);
      updateBulkBar();
      selectAll.checked = selectedIds.size === rows.length;
    });
  });
}

// ─── Select all ───────────────────────────────────────────────────────────────

selectAll.addEventListener('change', () => {
  tbody.querySelectorAll('.row-check').forEach(chk => {
    chk.checked = selectAll.checked;
    const id = Number(chk.dataset.id);
    if (selectAll.checked) selectedIds.add(id); else selectedIds.delete(id);
  });
  updateBulkBar();
});

function updateBulkBar() {
  const n = selectedIds.size;
  bulkBar.classList.toggle('hidden', n === 0);
  bulkCount.textContent = `${n} selected`;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

prevPageBtn.addEventListener('click', () => { if (currentPage > 1) loadPage(currentPage - 1); });
nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) loadPage(currentPage + 1); });

// ─── Filters ─────────────────────────────────────────────────────────────────

filterColor.addEventListener('change',  () => loadPage(1));
filterStatus.addEventListener('change', () => loadPage(1));
let filterDebounce;
filterQuery.addEventListener('input', () => { clearTimeout(filterDebounce); filterDebounce = setTimeout(() => loadPage(1), 300); });

// ─── Bulk actions ─────────────────────────────────────────────────────────────

document.getElementById('bulkCheckin').addEventListener('click', () => bulkStatus('checked_in'));
document.getElementById('bulkUncheck').addEventListener('click', () => bulkStatus('not_checked_in'));
document.getElementById('bulkDelete').addEventListener('click',  bulkDeleteSelected);

async function bulkStatus(status) {
  if (!selectedIds.size) return;
  try {
    const resp = await fetch(`${API}/admin/participants/bulk-status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selectedIds], status }),
    });
    if (!resp.ok) throw new Error();
    toast(`Updated ${(await resp.json()).updated} participant(s).`, 'success');
    loadPage(currentPage);
  } catch { toast('Bulk status update failed.', 'error'); }
}

async function bulkDeleteSelected() {
  if (!selectedIds.size) return;
  if (!confirm(`Delete ${selectedIds.size} participant(s)?`)) return;
  try {
    const resp = await fetch(`${API}/admin/participants/bulk-delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    if (!resp.ok) throw new Error();
    toast(`Deleted ${(await resp.json()).deleted} participant(s).`, 'success');
    loadPage(currentPage);
  } catch { toast('Bulk delete failed.', 'error'); }
}

async function deleteOne(id) {
  if (!confirm('Delete this participant?')) return;
  try {
    const resp = await fetch(`${API}/admin/participants/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error();
    toast('Participant deleted.', 'success');
    loadPage(currentPage);
  } catch { toast('Delete failed.', 'error'); }
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

document.getElementById('addParticipantBtn').addEventListener('click', () => openEditModal(null));

function openEditModal(id) {
  editForm.reset();
  document.getElementById('ef-id').value = id || '';
  const titleEl   = document.getElementById('editModalTitle');
  const submitBtn = document.getElementById('editModalSubmit');

  if (id) {
    titleEl.textContent   = 'Edit Participant';
    submitBtn.textContent = 'Save Changes';
    // Pre-fill from current row
    const row = tbody.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const cells = row.querySelectorAll('td');
      setField('ef-color',   row.querySelector('.tag')?.textContent?.trim() || '');
      setField('ef-full',    cells[3]?.textContent?.trim() || '');
      setField('ef-title',   cells[4]?.textContent?.trim() || '');
      setField('ef-first',   cells[5]?.textContent?.trim() || '');
      setField('ef-last',    cells[6]?.textContent?.trim() || '');
      setField('ef-org',     cells[7]?.textContent?.trim() || '');
      setField('ef-status',  row.querySelector('.status-checked') ? 'checked_in' : 'not_checked_in');
      setField('ef-remarks', cells[9]?.getAttribute('title') || '');
    }
  } else {
    titleEl.textContent   = 'Add Participant';
    submitBtn.textContent = 'Add';
  }
  editModal.classList.remove('hidden');
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function closeEditModal() { editModal.classList.add('hidden'); }

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editModalCancel').addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

document.getElementById('editModalSubmit').addEventListener('click', async () => {
  const id   = document.getElementById('ef-id').value;
  const body = formToObj(editForm);

  if (!body.color || !body.full_name) { toast('Color and Full Name are required.', 'error'); return; }

  const url    = id ? `${API}/admin/participants/${id}` : `${API}/admin/participants`;
  const method = id ? 'PUT' : 'POST';
  try {
    const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
    toast(id ? 'Participant updated.' : 'Participant added.', 'success');
    closeEditModal();
    loadPage(currentPage);
  } catch (err) { toast(err.message || 'Save failed.', 'error'); }
});

// ─── Import ───────────────────────────────────────────────────────────────────

document.getElementById('importBtn').addEventListener('click', async () => {
  const file = document.getElementById('importFile').files[0];
  if (!file) { toast('Please select a file first.', 'error'); return; }

  const fd  = new FormData();
  fd.append('file', file);
  const btn = document.getElementById('importBtn');
  btn.disabled = true; btn.textContent = 'Uploading…';

  try {
    const resp = await fetch(`${API}/admin/import`, { method: 'POST', body: fd });
    const data = await resp.json();
    if (!resp.ok) { toast(data.error || 'Import failed.', 'error'); return; }

    const summary = document.getElementById('importSummary');
    summary.classList.remove('hidden');
    summary.innerHTML = `
      <strong>Import complete</strong><br/>
      Rows processed: ${data.processed} &nbsp;|&nbsp;
      Inserted: <strong>${data.inserted}</strong> &nbsp;|&nbsp;
      Skipped (duplicates): ${data.skipped} &nbsp;|&nbsp;
      Updated: ${data.updated} &nbsp;|&nbsp;
      Mode: <em>${data.dedup_mode}</em>
    `;
    toast(`Imported ${data.inserted} new participant(s).`, 'success');
    loadPage(1);
  } catch { toast('Import request failed.', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Upload'; }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formToObj(form) {
  const obj = {};
  for (const [k, v] of new FormData(form).entries()) { if (k !== 'id') obj[k] = v; }
  return obj;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  toastCont.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadPage(1);
