'use strict';

/**
 * routes.js — Event Check-in API
 *
 * Mounted at: /api/event-checkin   (in the main index.js)
 *
 * Endpoints:
 *   GET  /events                      — SSE stream (real-time updates)
 *   GET  /participants/search?query=  — search participants
 *   POST /participants/:id/checkin    — check in
 *   POST /participants/:id/remarks    — update remarks
 *   POST /participants                — create (from check-in page)
 *   GET  /admin/participants          — paginated list
 *   POST /admin/participants          — create (from admin)
 *   PUT  /admin/participants/:id      — update
 *   DELETE /admin/participants/:id    — delete
 *   POST /admin/participants/bulk-delete
 *   POST /admin/participants/bulk-status
 *   POST /admin/import                — Excel/CSV upload
 *   GET  /admin/export-checkedin.csv
 *   GET  /admin/export-checkedin.xlsx
 */

const express = require('express');
const multer  = require('multer');
const ExcelJS = require('exceljs');
const path    = require('path');
const router  = express.Router();

const db  = require('./db');
const sse = require('./sse');

// Initialise the SQLite database when this module is first loaded
db.init();

// Multer: store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const VALID_COLORS = ['Red', 'Purple', 'Blue', 'Green'];

// ─── SSE stream ───────────────────────────────────────────────────────────────
// Clients connect here once and receive all real-time events.
router.get('/events', sse.handler);

// ═══════════════════════════════════════════════════════════════
//  PUBLIC — CHECK-IN PAGE
// ═══════════════════════════════════════════════════════════════

// GET /participants/search?query=...
router.get('/participants/search', (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) return res.json([]);
  try {
    res.json(db.search(query));
  } catch (err) {
    console.error('[event-checkin search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /participants/:id/checkin
router.post('/participants/:id/checkin', (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : undefined;
  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updates = { status: 'checked_in' };
    if (remarks !== undefined) updates.remarks = remarks;

    const updated = db.update(id, updates);
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin checkin]', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// POST /participants/:id/remarks
router.post('/participants/:id/remarks', (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : '';
  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updated = db.update(id, { remarks });
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin remarks]', err);
    res.status(500).json({ error: 'Remarks update failed' });
  }
});

// POST /participants  — create from check-in "add new" form
router.post('/participants', (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, remarks } = req.body;
  if (!color || !full_name)               return res.status(400).json({ error: 'color and full_name are required' });
  if (!VALID_COLORS.includes(color))      return res.status(400).json({ error: 'Invalid color' });
  try {
    const p = db.insert({ color, title, first_name, last_name, full_name, organization, remarks });
    sse.broadcast('participant_created', { type: 'participant_created', payload: p });
    res.status(201).json(p);
  } catch (err) {
    console.error('[event-checkin create]', err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN — MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /admin/participants  — paginated list with filters
router.get('/admin/participants', (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page, 10)      || 1);
  const pageSize = Math.min(200, parseInt(req.query.pageSize, 10) || 50);
  const color    = VALID_COLORS.includes(req.query.color)  ? req.query.color  : undefined;
  const status   = ['checked_in','not_checked_in'].includes(req.query.status) ? req.query.status : undefined;
  const query    = (req.query.query || '').trim() || undefined;
  try {
    res.json({ ...db.list({ page, pageSize, color, status, query }), page, pageSize });
  } catch (err) {
    console.error('[event-checkin admin list]', err);
    res.status(500).json({ error: 'Failed to list participants' });
  }
});

// POST /admin/participants — create from admin
router.post('/admin/participants', (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;
  if (!color || !full_name)          return res.status(400).json({ error: 'color and full_name are required' });
  if (!VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  try {
    const p = db.insert({ color, title, first_name, last_name, full_name, organization, status, remarks });
    sse.broadcast('participant_created', { type: 'participant_created', payload: p });
    res.status(201).json(p);
  } catch (err) {
    console.error('[event-checkin admin create]', err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

// PUT /admin/participants/:id — update
router.put('/admin/participants/:id', (req, res) => {
  const id = Number(req.params.id);
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;
  if (color && !VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  try {
    if (!db.findById(id)) return res.status(404).json({ error: 'Not found' });
    const fields = {};
    if (color        !== undefined) fields.color        = color;
    if (title        !== undefined) fields.title        = title;
    if (first_name   !== undefined) fields.first_name   = first_name;
    if (last_name    !== undefined) fields.last_name    = last_name;
    if (full_name    !== undefined) fields.full_name    = full_name;
    if (organization !== undefined) fields.organization = organization;
    if (status       !== undefined) fields.status       = status;
    if (remarks      !== undefined) fields.remarks      = remarks;
    const updated = db.update(id, fields);
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin admin update]', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE /admin/participants/:id
router.delete('/admin/participants/:id', (req, res) => {
  const id = Number(req.params.id);
  try {
    if (!db.findById(id)) return res.status(404).json({ error: 'Not found' });
    db.remove(id);
    sse.broadcast('participant_deleted', { type: 'participant_deleted', payload: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[event-checkin admin delete]', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /admin/participants/bulk-delete
router.post('/admin/participants/bulk-delete', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'ids required' });
  try {
    const count = db.bulkDelete(ids);
    sse.broadcast('bulk_deleted', { type: 'bulk_deleted', payload: { ids } });
    res.json({ deleted: count });
  } catch (err) {
    console.error('[event-checkin bulk delete]', err);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// POST /admin/participants/bulk-status
router.post('/admin/participants/bulk-status', (req, res) => {
  const ids    = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  const status = req.body.status;
  if (!ids.length)                                          return res.status(400).json({ error: 'ids required' });
  if (!['checked_in','not_checked_in'].includes(status))   return res.status(400).json({ error: 'Invalid status' });
  try {
    const count      = db.bulkStatus(ids, status);
    const updatedRows = ids.map(id => db.findById(id)).filter(Boolean);
    sse.broadcast('bulk_status_updated', { type: 'bulk_status_updated', payload: { ids, status, rows: updatedRows } });
    res.json({ updated: count });
  } catch (err) {
    console.error('[event-checkin bulk status]', err);
    res.status(500).json({ error: 'Bulk status update failed' });
  }
});

// ─── Import ───────────────────────────────────────────────────────────────────
//
// TUNE: Change DEDUP_MODE to control import behaviour:
//   "skip"   → skip rows that match (full_name, organization, color)  ← default
//   "update" → update non-status fields on duplicates
//   "insert" → always insert, no dedup
const DEDUP_MODE = 'skip';

router.post('/admin/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext  = req.file.originalname.split('.').pop().toLowerCase();
  const rows = [];

  try {
    if (ext === 'csv') {
      const text    = req.file.buffer.toString('utf8');
      const lines   = text.split(/\r?\n/);
      if (lines.length < 2) return res.status(400).json({ error: 'CSV missing header' });

      // TUNE: CSV column mapping — adjust candidate names to match your CSV headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s-]/g, '_'));
      const colMap  = {
        color:        findCol(headers, ['color']),
        title:        findCol(headers, ['title']),
        first_name:   findCol(headers, ['first_name','firstname']),
        last_name:    findCol(headers, ['last_name','lastname']),
        full_name:    findCol(headers, ['full_name','fullname']),
        organization: findCol(headers, ['organization','org']),
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cells = parseCsvLine(line);
        rows.push({
          color:        cells[colMap.color]        || null,
          title:        cells[colMap.title]        || null,
          first_name:   cells[colMap.first_name]   || null,
          last_name:    cells[colMap.last_name]     || null,
          full_name:    cells[colMap.full_name]     || null,
          organization: cells[colMap.organization] || null,
        });
      }

    } else if (ext === 'xlsx' || ext === 'xls') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      for (const ws of workbook.worksheets) {
        const sheetColor = VALID_COLORS.includes(ws.name) ? ws.name : null;

        // Build column index map from header row
        const colIndex = {};
        ws.getRow(1).eachCell((cell, colNum) => {
          if (cell.value) colIndex[String(cell.value).trim()] = colNum;
        });

        // TUNE: Excel column mapping — adjust property names to match your Excel headers
        const cellText = (val) => {
          if (val == null) return null;
          // ExcelJS may return rich text objects: { richText: [{text:'...'}, ...] }
          if (typeof val === 'object' && Array.isArray(val.richText)) {
            return val.richText.map(r => r.text ?? '').join('').trim() || null;
          }
          const s = String(val).trim();
          return s || null;
        };
        const getCell = (row, ...names) => {
          for (const name of names) {
            const idx = colIndex[name];
            if (idx) {
              const val = cellText(row.getCell(idx).value);
              if (val) return val;
            }
          }
          return null;
        };

        ws.eachRow((row, rowNum) => {
          if (rowNum === 1) return;
          const full_name = getCell(row,
            'FullName', 'full_name', 'Full Name',
            'Name', 'English Name', 'EnglishName',
            'Participant Name', 'Display Name', 'Badge Name',
          );
          if (!full_name) return;
          rows.push({
            color:        sheetColor || getCell(row,
              'Color', 'color', 'Colour', 'colour',
              'Group', 'group', 'Table', 'table',
              'Table Color', 'TableColor', 'Badge Color',
            ) || null,
            title:        getCell(row, 'Title', 'title', 'Salutation', 'salutation', 'Title/Salutation') || null,
            first_name:   getCell(row, 'FirstName', 'first_name', 'First Name', 'Given Name') || null,
            last_name:    getCell(row, 'LastName', 'last_name', 'Last Name', 'Family Name', 'Surname') || null,
            full_name,
            organization: getCell(row, 'Organization', 'organization', 'Organisation', 'Org', 'Company', 'Affiliation') || null,
          });
        });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use .xlsx or .csv' });
    }

    // ── Deduplication + insert ─────────────────────────────────────────────────
    let inserted = 0, skipped = 0, updated = 0;
    const newRows = [];

    for (const row of rows) {
      if (!row.full_name || !VALID_COLORS.includes(row.color)) { skipped++; continue; }

      // TUNE: deduplication key is (full_name, organization, color)
      const existing = DEDUP_MODE !== 'insert'
        ? db.findDuplicate(row.full_name, row.organization, row.color)
        : null;

      if (existing) {
        if (DEDUP_MODE === 'skip') {
          skipped++;
        } else if (DEDUP_MODE === 'update') {
          const p = db.update(existing.id, { title: row.title, first_name: row.first_name, last_name: row.last_name, organization: row.organization });
          newRows.push(p); updated++;
        }
      } else {
        const p = db.insert({ ...row, status: 'not_checked_in' });
        newRows.push(p); inserted++;
      }
    }

    if (newRows.length) sse.broadcast('bulk_imported', { type: 'bulk_imported', payload: newRows });
    res.json({ processed: rows.length, inserted, skipped, updated, dedup_mode: DEDUP_MODE });

  } catch (err) {
    console.error('[event-checkin import]', err);
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

// ─── Export CSV ───────────────────────────────────────────────────────────────
router.get('/admin/export-checkedin.csv', (req, res) => {
  try {
    const rows    = db.getCheckedIn();
    const headers = ['id','color','title','first_name','last_name','full_name','organization','status','remarks','created_at','updated_at'];
    const lines   = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = r[h] == null ? '' : String(r[h]);
        return /[,"\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
      }).join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="checked-in-participants.csv"');
    res.send(lines.join('\r\n'));
  } catch (err) {
    console.error('[event-checkin export csv]', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── Export XLSX ──────────────────────────────────────────────────────────────
router.get('/admin/export-checkedin.xlsx', async (req, res) => {
  try {
    const rows    = db.getCheckedIn();
    const headers = ['id','color','title','first_name','last_name','full_name','organization','status','remarks','created_at','updated_at'];
    const wb      = new ExcelJS.Workbook();
    const ws      = wb.addWorksheet('Checked-in Participants');
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach(c => { c.width = 18; });
    for (const row of rows) ws.addRow(headers.map(h => row[h] ?? ''));
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="checked-in-participants.xlsx"');
    res.send(buf);
  } catch (err) {
    console.error('[event-checkin export xlsx]', err);
    res.status(500).json({ error: 'Excel export failed' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findCol(headers, candidates) {
  for (const c of candidates) { const i = headers.indexOf(c); if (i !== -1) return i; }
  return -1;
}

function parseCsvLine(line) {
  const result = []; let current = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuote && line[i+1] === '"') { current += '"'; i++; } else inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

module.exports = router;
