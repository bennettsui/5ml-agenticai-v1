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
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

    totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    pageInfo.textContent  = `Page ${currentPage} of ${totalPages}`;
    totalInfo.textContent = `${data.total} participant(s)`;
    const badge = document.getElementById('entryCountBadge');
    if (badge) badge.textContent = `— ${data.total} entries`;
    prevPageBtn.disabled  = currentPage <= 1;
    nextPageBtn.disabled  = currentPage >= totalPages;

    renderTable(data.rows);
  } catch (err) {
    toast(`Failed to load participants: ${err.message}`, 'error');
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--color-red);font-size:13px;">Error: ${esc(err.message)}</td></tr>`;
  }
}

// ─── Render table ─────────────────────────────────────────────────────────────

function renderTable(rows) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-muted);">No participants found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(p => {
    const checked = p.status === 'checked_in';
    return `
      <tr data-id="${p.id}">
        <td><input type="checkbox" class="row-check" data-id="${p.id}" /></td>
        <td style="color:var(--text-muted);font-size:12px;">${p.id}</td>
        <td><span class="tag" data-color="${esc(p.color)}">${esc(p.color)}</span></td>
        <td>${esc(p.title || '')}</td>
        <td>${esc(p.first_name || '')}</td>
        <td>${esc(p.last_name || '')}</td>
        <td>${esc(p.organization || '')}</td>
        <td style="white-space:nowrap;">${esc(p.phone || '')}</td>
        <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(p.email||'')}">${esc(p.email || '')}</td>
        <td>${checked ? `<span class="status-checked">✓ Checked-in</span>` : `<span class="status-not-checked">○ Not checked-in</span>`}</td>
        <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(p.remarks||'')}">${esc(p.remarks || '')}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-outline" data-action="edit"   data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-outline" data-action="enrich" data-id="${p.id}" style="margin-left:4px;" title="AI Enrich">✨</button>
          <button class="btn btn-sm btn-danger"  data-action="delete" data-id="${p.id}" style="margin-left:4px;">Del</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="enrich"]').forEach(btn => {
    btn.addEventListener('click', () => openEnrichModal(Number(btn.dataset.id)));
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

// ─── Delete All ───────────────────────────────────────────────────────────────

document.getElementById('deleteAllBtn').addEventListener('click', async () => {
  if (!confirm('Delete ALL participants? This cannot be undone.')) return;
  if (!confirm('Are you sure? This will permanently delete every participant record.')) return;
  try {
    const resp = await fetch(`${API}/admin/participants/all`, { method: 'DELETE' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    toast(`Deleted all ${data.deleted} participant(s).`, 'success');
    loadPage(1);
  } catch (err) { toast(`Delete all failed: ${err.message}`, 'error'); }
});

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

document.getElementById('addParticipantBtn').addEventListener('click', () => openEditModal(null));

function openEditModal(id) {
  editForm.reset();
  document.getElementById('ef-id').value = id || '';
  const titleEl   = document.getElementById('editModalTitle');
  const submitBtn = document.getElementById('editModalSubmit');
  const newIdRow  = document.getElementById('ef-new-id-row');
  const newIdInput = document.getElementById('ef-new-id');

  if (id) {
    titleEl.textContent   = 'Edit Participant';
    submitBtn.textContent = 'Save Changes';
    newIdRow.style.display = 'none'; // ID can't change on edit
    // Pre-fill from current row
    const row = tbody.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const cells = row.querySelectorAll('td');
      setField('ef-color',   row.querySelector('.tag')?.textContent?.trim() || '');
      setField('ef-title',   cells[3]?.textContent?.trim() || '');
      setField('ef-first',   cells[4]?.textContent?.trim() || '');
      setField('ef-last',    cells[5]?.textContent?.trim() || '');
      setField('ef-org',     cells[6]?.textContent?.trim() || '');
      setField('ef-phone',   cells[7]?.textContent?.trim() || '');
      setField('ef-email',   cells[8]?.getAttribute('title') || cells[8]?.textContent?.trim() || '');
      setField('ef-status',  row.querySelector('.status-checked') ? 'checked_in' : 'not_checked_in');
      setField('ef-remarks', cells[10]?.getAttribute('title') || '');
    }
  } else {
    titleEl.textContent    = 'Add Participant';
    submitBtn.textContent  = 'Add';
    newIdRow.style.display = '';
    newIdInput.value       = '';
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

  if (!body.color || (!body.first_name && !body.last_name)) { toast('Color and at least one name field are required.', 'error'); return; }

  // Include optional custom ID when creating a new participant
  if (!id) {
    const rawNewId = document.getElementById('ef-new-id').value;
    if (rawNewId) body.id = parseInt(rawNewId, 10) || undefined;
  }

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

const importLogPanel = document.getElementById('importLogPanel');
const importLogEl    = document.getElementById('importLog');
const importLogTitle = document.getElementById('importLogTitle');

document.getElementById('importLogClose').addEventListener('click', () => {
  importLogPanel.classList.add('hidden');
});

function showImportLog(html, title) {
  importLogTitle.textContent = title || '📋 Import Log';
  importLogEl.innerHTML = html;
  importLogPanel.classList.remove('hidden');
  importLogPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('importBtn').addEventListener('click', async () => {
  const file = document.getElementById('importFile').files[0];
  if (!file) { toast('Please select a file first.', 'error'); return; }

  const fd  = new FormData();
  fd.append('file', file);
  const btn = document.getElementById('importBtn');
  btn.disabled = true; btn.textContent = 'Uploading…';

  showImportLog(`
    <div style="display:flex;align-items:center;gap:10px;color:var(--text-muted);">
      <span style="font-size:18px;">⏳</span>
      <span>Uploading <strong>${esc(file.name)}</strong> and processing rows…</span>
    </div>
  `, '📋 Import Log — Uploading…');

  try {
    const resp = await fetch(`${API}/admin/import`, { method: 'POST', body: fd });
    const data = await resp.json();
    if (!resp.ok) {
      showImportLog(`<div style="color:#fca5a5;">❌ ${esc(data.error || 'Import failed.')}</div>`, '📋 Import Log — Failed');
      toast(data.error || 'Import failed.', 'error');
      return;
    }

    const summary = document.getElementById('importSummary');
    summary.classList.remove('hidden');
    const skipDetails = [];
    if (data.skipped_no_color > 0) skipDetails.push(`${data.skipped_no_color} missing/invalid Color`);
    if (data.skipped_no_name  > 0) skipDetails.push(`${data.skipped_no_name} missing Name`);
    if (data.skipped > (data.skipped_no_color || 0) + (data.skipped_no_name || 0)) {
      skipDetails.push(`${data.skipped - (data.skipped_no_color||0) - (data.skipped_no_name||0)} duplicates`);
    }
    const skipNote = data.skipped > 0
      ? ` <span style="color:#fbbf24;">(${skipDetails.join(', ') || data.skipped + ' skipped'})</span>`
      : '';
    summary.innerHTML = `
      <strong>Import complete</strong><br/>
      Rows processed: ${data.processed} &nbsp;|&nbsp;
      Inserted: <strong>${data.inserted}</strong> &nbsp;|&nbsp;
      Skipped: ${data.skipped}${skipNote}
      ${data.skipped_no_color > 0 ? '<br/><span style="color:#fbbf24;font-size:12px;">⚠️ Color/Type must be: Red, Purple, Blue, Green, 策略影響夥伴, AI 戰略合作夥伴 iKala, 實物與社群夥伴</span>' : ''}
    `;

    if (data.inserted === 0 && data.skipped > 0) {
      toast(`Import: 0 inserted — ${skipDetails.join(', ')}`, 'error');
    } else {
      toast(`Imported ${data.inserted} new participant(s).`, 'success');
    }

    // ── Per-row detail log ──────────────────────────────────────────────────
    if (data.detail && data.detail.length) {
      const skippedRows = data.detail.filter(r => r.status === 'skipped');
      const rows = data.detail.map(r => {
        const ok = r.status === 'inserted';
        const bg = ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
        const statusHtml = ok
          ? '<span style="color:#86efac;font-weight:600;">✓ Inserted</span>'
          : `<span style="color:#fca5a5;">✗ Skipped</span><br/><span style="color:var(--text-muted);font-size:11px;">${esc(r.reason || '')}</span>`;
        return `<tr style="border-top:1px solid var(--border);background:${bg};">
          <td style="padding:5px 10px;color:var(--text-muted);">${r.n ?? ''}</td>
          <td style="padding:5px 10px;color:var(--text-muted);">${esc(r.sheet || '')}</td>
          <td style="padding:5px 10px;font-weight:600;">${esc(r.name || '—')}</td>
          <td style="padding:5px 10px;">${esc(r.color || '')}</td>
          <td style="padding:5px 10px;">${esc(r.title || '')}</td>
          <td style="padding:5px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.org||'')}">${esc(r.org || '')}</td>
          <td style="padding:5px 10px;">${statusHtml}</td>
        </tr>`;
      }).join('');

      showImportLog(`
        <div style="margin-bottom:10px;font-size:12px;color:var(--text-muted);">
          ${data.detail.length} rows read &nbsp;·&nbsp;
          <span style="color:#86efac;font-weight:600;">${data.inserted} inserted</span> &nbsp;·&nbsp;
          <span style="color:${skippedRows.length ? '#fbbf24' : 'var(--text-muted)'};">${skippedRows.length} skipped</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:rgba(255,255,255,0.05);">
            <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Row</th>
            <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Sheet</th>
            <th style="padding:6px 10px;text-align:left;">Name</th>
            <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Color/Type</th>
            <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Title</th>
            <th style="padding:6px 10px;text-align:left;">Org</th>
            <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Status / Reason</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `, `📋 Import Log — ${file.name}`);
    } else {
      showImportLog(`<div style="color:var(--text-muted);">No row detail returned.</div>`, '📋 Import Log');
    }

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

// ═══════════════════════════════════════════════════════════════
//  AI FEATURES
// ═══════════════════════════════════════════════════════════════

// ─── AI Enrich ────────────────────────────────────────────────────────────────

const enrichModal      = document.getElementById('enrichModal');
const enrichModalBody  = document.getElementById('enrichModalBody');
const enrichModalApply = document.getElementById('enrichModalApply');
let   enrichPending    = null; // { id, suggestions }

document.getElementById('enrichModalClose').addEventListener('click',  closeEnrichModal);
document.getElementById('enrichModalCancel').addEventListener('click', closeEnrichModal);
enrichModal.addEventListener('click', e => { if (e.target === enrichModal) closeEnrichModal(); });

async function openEnrichModal(id) {
  enrichPending = null;
  enrichModalApply.classList.add('hidden');
  enrichModalBody.innerHTML = '<div class="ai-thinking">✨ Analysing record with AI…</div>';
  enrichModal.classList.remove('hidden');

  try {
    const resp = await fetch(`${API}/ai/enrich/${id}`, { method: 'POST' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');

    const { suggestions, current } = data;
    const keys = Object.keys(suggestions);

    if (!keys.length) {
      enrichModalBody.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">
        No suggestions — record looks complete already.</p>`;
      return;
    }

    enrichPending = { id, suggestions };
    enrichModalApply.classList.remove('hidden');

    const rows = keys.map(k => `
      <tr>
        <td style="color:var(--text-muted);text-transform:uppercase;font-size:11px;font-weight:700;">${k.replace('_',' ')}</td>
        <td style="color:var(--text-muted);text-decoration:line-through;">${esc(current[k] || '—')}</td>
        <td style="color:var(--color-green);font-weight:600;">→ ${esc(suggestions[k])}</td>
      </tr>`).join('');

    enrichModalBody.innerHTML = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">AI suggests the following changes:</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;">Field</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;">Current</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;">Suggestion</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (err) {
    enrichModalBody.innerHTML = `<p style="color:var(--color-red);font-size:14px;">Error: ${esc(err.message)}</p>`;
  }
}

enrichModalApply.addEventListener('click', async () => {
  if (!enrichPending) return;
  const { id, suggestions } = enrichPending;
  enrichModalApply.disabled = true;
  enrichModalApply.textContent = 'Applying…';
  try {
    const resp = await fetch(`${API}/ai/enrich/${id}/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suggestions),
    });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
    toast('Record updated by AI.', 'success');
    closeEnrichModal();
    loadPage(currentPage);
  } catch (err) {
    toast('Apply failed: ' + err.message, 'error');
  } finally {
    enrichModalApply.disabled = false;
    enrichModalApply.textContent = 'Apply Suggestions';
  }
});

function closeEnrichModal() {
  enrichModal.classList.add('hidden');
  enrichPending = null;
  enrichModalApply.classList.add('hidden');
}

// ─── Explain Stats ────────────────────────────────────────────────────────────

document.getElementById('explainBtn').addEventListener('click', async () => {
  const out = document.getElementById('explainOutput');
  const btn = document.getElementById('explainBtn');
  btn.disabled = true; btn.textContent = '💬 Thinking…';
  out.classList.remove('hidden');
  out.innerHTML = '<div class="ai-thinking">Analysing current stats…</div>';
  try {
    const resp = await fetch(`${API}/ai/explain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    out.innerHTML = `<div class="ai-text">${esc(data.explanation).replace(/\n/g, '<br/>')}</div>`;
  } catch (err) {
    out.innerHTML = `<div style="color:var(--color-red);font-size:13px;">Error: ${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '💬 Explain Stats';
  }
});

// ─── Generate Report ──────────────────────────────────────────────────────────

const reportModal = document.getElementById('reportModal');
document.getElementById('reportModalClose').addEventListener('click', () => reportModal.classList.add('hidden'));
reportModal.addEventListener('click', e => { if (e.target === reportModal) reportModal.classList.add('hidden'); });

document.getElementById('reportBtn').addEventListener('click', async () => {
  const btn = document.getElementById('reportBtn');
  const content = document.getElementById('reportContent');
  btn.disabled = true; btn.textContent = '📊 Generating…';
  content.innerHTML = '<div class="ai-thinking">Generating report…</div>';
  reportModal.classList.remove('hidden');
  try {
    const resp = await fetch(`${API}/ai/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    content.innerHTML = markdownToHtml(data.report);
  } catch (err) {
    content.innerHTML = `<div style="color:var(--color-red);">Error: ${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '📊 Generate Report';
  }
});

// ─── AI Concierge ─────────────────────────────────────────────────────────────

document.getElementById('conciergeBtn').addEventListener('click', askConcierge);
document.getElementById('conciergeInput').addEventListener('keydown', e => { if (e.key === 'Enter') askConcierge(); });

async function askConcierge() {
  const input = document.getElementById('conciergeInput');
  const out   = document.getElementById('conciergeOutput');
  const btn   = document.getElementById('conciergeBtn');
  const q = input.value.trim();
  if (!q) return;

  btn.disabled = true; btn.textContent = '…';
  out.classList.remove('hidden');
  out.innerHTML = '<div class="ai-thinking">✨ Thinking…</div>';

  try {
    const resp = await fetch(`${API}/ai/concierge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    out.innerHTML = `<div class="ai-text">${esc(data.answer).replace(/\n/g, '<br/>')}</div>`;
    input.value = '';
  } catch (err) {
    out.innerHTML = `<div style="color:var(--color-red);font-size:13px;">Error: ${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = 'Ask';
  }
}

// ─── Minimal markdown → HTML (for report display) ─────────────────────────────

function markdownToHtml(md) {
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^- (.+)$/gm,    '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[hup])/gm, '<p>')
    .replace(/([^>])$/gm, '$1</p>')
    .replace(/<p><\/p>/g, '');
}

// ─── Chat History ─────────────────────────────────────────────────────────────

async function loadChatHistory() {
  const wrap = document.getElementById('chatHistoryWrap');
  wrap.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Loading…</p>';
  try {
    const resp = await fetch(`${API}/admin/chat-history`);
    const chats = await resp.json();
    if (!resp.ok) throw new Error(chats.error || 'Failed');

    if (!chats.length) {
      wrap.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No conversations yet. Questions asked in the Dashboard AI Assistant will appear here.</p>';
      return;
    }

    wrap.innerHTML = chats.map(c => {
      const ts = new Date(c.created_at).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      return `
        <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--color-blue);text-transform:uppercase;letter-spacing:.05em;">Question</span>
            <span style="font-size:11px;color:var(--text-muted);">${esc(ts)}</span>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">${esc(c.question)}</div>
          <div style="font-size:11px;font-weight:700;color:var(--color-green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Answer</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.6;">${esc(c.answer).replace(/\n/g, '<br/>')}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    wrap.innerHTML = `<p style="color:var(--color-red);font-size:13px;">Error: ${esc(err.message)}</p>`;
  }
}

document.getElementById('refreshChatBtn').addEventListener('click', loadChatHistory);

// ─── Init ─────────────────────────────────────────────────────────────────────
loadPage(1);
loadChatHistory();
