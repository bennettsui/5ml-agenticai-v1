'use strict';

/**
 * routes/admin.js
 * Admin management API — CRUD, bulk ops, import, export.
 *
 * Mounted at: /api/admin
 *
 * Key extension points are clearly commented with "TUNE:" markers.
 */

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const ExcelJS  = require('exceljs');
const db       = require('../db');

// Multer: store uploaded files in memory (files are at most a few MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Valid colors used throughout
const VALID_COLORS = ['Red', 'Purple', 'Blue', 'Green'];

// ─── GET /api/admin/participants ──────────────────────────────────────────────
// Paginated list with optional filters: color, status, query.
// Query params: page, pageSize, color, status, query
router.get('/participants', (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page, 10)     || 1);
  const pageSize = Math.min(200, parseInt(req.query.pageSize, 10) || 50);
  const color    = VALID_COLORS.includes(req.query.color)  ? req.query.color  : undefined;
  const status   = ['checked_in','not_checked_in'].includes(req.query.status) ? req.query.status : undefined;
  const query    = (req.query.query || '').trim() || undefined;

  try {
    const result = db.list({ page, pageSize, color, status, query });
    res.json({ ...result, page, pageSize });
  } catch (err) {
    console.error('[admin list]', err);
    res.status(500).json({ error: 'Failed to list participants' });
  }
});

// ─── POST /api/admin/participants ────────────────────────────────────────────
// Create a participant from admin.
router.post('/participants', (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;

  if (!color || !full_name) return res.status(400).json({ error: 'color and full_name are required' });
  if (!VALID_COLORS.includes(color)) return res.status(400).json({ error: `color must be one of ${VALID_COLORS.join(', ')}` });

  try {
    const participant = db.insert({ color, title, first_name, last_name, full_name, organization, status, remarks });
    req.app.locals.io.emit('participant_created', { type: 'participant_created', payload: participant });
    res.status(201).json(participant);
  } catch (err) {
    console.error('[admin create]', err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

// ─── PUT /api/admin/participants/:id ─────────────────────────────────────────
// Update any fields of a participant.
router.put('/participants/:id', (req, res) => {
  const id = Number(req.params.id);
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;

  if (color && !VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });

  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

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
    req.app.locals.io.emit('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[admin update]', err);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// ─── DELETE /api/admin/participants/:id ───────────────────────────────────────
router.delete('/participants/:id', (req, res) => {
  const id = Number(req.params.id);
  try {
    const existing = db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    db.remove(id);
    req.app.locals.io.emit('participant_deleted', { type: 'participant_deleted', payload: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin delete]', err);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

// ─── POST /api/admin/participants/bulk-delete ─────────────────────────────────
// Body: { ids: number[] }
router.post('/participants/bulk-delete', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'ids array is required' });

  try {
    const count = db.bulkDelete(ids);
    req.app.locals.io.emit('bulk_deleted', { type: 'bulk_deleted', payload: { ids } });
    res.json({ deleted: count });
  } catch (err) {
    console.error('[bulk delete]', err);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// ─── POST /api/admin/participants/bulk-status ─────────────────────────────────
// Body: { ids: number[], status: "checked_in" | "not_checked_in" }
router.post('/participants/bulk-status', (req, res) => {
  const ids    = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  const status = req.body.status;

  if (!ids.length) return res.status(400).json({ error: 'ids array is required' });
  if (!['checked_in','not_checked_in'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const count = db.bulkStatus(ids, status);
    // Fetch updated rows to broadcast full data
    const updatedRows = ids.map(id => db.findById(id)).filter(Boolean);
    req.app.locals.io.emit('bulk_status_updated', { type: 'bulk_status_updated', payload: { ids, status, rows: updatedRows } });
    res.json({ updated: count });
  } catch (err) {
    console.error('[bulk status]', err);
    res.status(500).json({ error: 'Bulk status update failed' });
  }
});

// ─── POST /api/admin/import ───────────────────────────────────────────────────
// Multipart file upload — Excel (.xlsx) or CSV.
//
// Excel: expects sheets named "Red", "Purple", "Blue", "Green".
//   Each sheet row: seq_no, Color, Title, FirstName, LastName, FullName, Organization
//
// CSV: expects columns (case-insensitive header):
//   color, title, first_name (or FirstName), last_name (or LastName),
//   full_name (or FullName), organization
//
// TUNE: Deduplication mode below — change DEDUP_MODE to control behaviour:
//   "skip"   → skip existing rows (current default)
//   "update" → update existing rows with new data
//   "insert" → always insert (no dedup)
const DEDUP_MODE = 'skip'; // TUNE: 'skip' | 'update' | 'insert'

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext  = req.file.originalname.split('.').pop().toLowerCase();
  const rows = [];

  try {
    if (ext === 'csv') {
      // ── CSV parsing ─────────────────────────────────────────────────────────
      const text    = req.file.buffer.toString('utf8');
      const lines   = text.split(/\r?\n/);
      if (lines.length < 2) return res.status(400).json({ error: 'CSV file is empty or missing header' });

      // Normalise header names (lower-case, replace spaces/hyphens with _)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s-]/g, '_'));

      // TUNE: Column mapping for CSV — adjust keys here if your CSV uses different names
      const colMap = {
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
      // ── Excel parsing using ExcelJS ──────────────────────────────────────────
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name;
        // Use sheet name as color if it matches; otherwise fall through to "Color" column
        const sheetColor = VALID_COLORS.includes(sheetName) ? sheetName : null;

        // Read header row (row 1) to build column index map
        const headerRow = worksheet.getRow(1);
        const colIndex  = {}; // normalised header → column number (1-based)
        headerRow.eachCell((cell, colNum) => {
          if (cell.value) colIndex[String(cell.value).trim()] = colNum;
        });

        // TUNE: Excel column mapping — adjust property names here if your Excel headers differ
        const getCell = (row, ...names) => {
          for (const name of names) {
            const idx = colIndex[name];
            if (idx) {
              const val = row.getCell(idx).value;
              if (val !== null && val !== undefined) return String(val).trim();
            }
          }
          return null;
        };

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header
          const full_name = getCell(row, 'FullName', 'full_name', 'Full Name');
          if (!full_name) return; // skip empty rows

          rows.push({
            // Priority: sheet name → "Color" column
            color:        sheetColor || getCell(row, 'Color', 'color') || null,
            title:        getCell(row, 'Title', 'title')               || null,
            first_name:   getCell(row, 'FirstName', 'first_name', 'First Name') || null,
            last_name:    getCell(row, 'LastName', 'last_name', 'Last Name')    || null,
            full_name,
            organization: getCell(row, 'Organization', 'organization', 'Org') || null,
          });
        });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use .xlsx or .csv' });
    }

    // ── Import with deduplication ──────────────────────────────────────────────
    let inserted = 0;
    let skipped  = 0;
    let updated  = 0;
    const newParticipants = [];

    for (const row of rows) {
      // Validate required fields
      if (!row.full_name || !VALID_COLORS.includes(row.color)) {
        skipped++;
        continue;
      }

      // TUNE: Deduplication check — uniqueness key is (full_name, organization, color)
      const existing = DEDUP_MODE !== 'insert'
        ? db.findDuplicate(row.full_name, row.organization, row.color)
        : null;

      if (existing) {
        if (DEDUP_MODE === 'skip') {
          // TUNE: "skip" — leave existing record untouched
          skipped++;
        } else if (DEDUP_MODE === 'update') {
          // TUNE: "update" — overwrite non-status fields on duplicate
          const p = db.update(existing.id, {
            title:        row.title,
            first_name:   row.first_name,
            last_name:    row.last_name,
            organization: row.organization,
          });
          newParticipants.push(p);
          updated++;
        }
      } else {
        const p = db.insert({ ...row, status: 'not_checked_in' });
        newParticipants.push(p);
        inserted++;
      }
    }

    // Broadcast newly inserted / updated participants
    if (newParticipants.length) {
      req.app.locals.io.emit('bulk_imported', { type: 'bulk_imported', payload: newParticipants });
    }

    res.json({
      processed: rows.length,
      inserted,
      skipped,
      updated,
      dedup_mode: DEDUP_MODE,
    });

  } catch (err) {
    console.error('[import]', err);
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

// ─── GET /api/admin/export-checkedin.csv ─────────────────────────────────────
router.get('/export-checkedin.csv', (req, res) => {
  try {
    const rows    = db.getCheckedIn();
    const headers = ['id','color','title','first_name','last_name','full_name','organization','status','remarks','created_at','updated_at'];

    const csvLines = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const val = r[h] == null ? '' : String(r[h]);
          return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
      )
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="checked-in-participants.csv"');
    res.send(csvLines.join('\r\n'));
  } catch (err) {
    console.error('[export csv]', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── GET /api/admin/export-checkedin.xlsx ────────────────────────────────────
router.get('/export-checkedin.xlsx', async (req, res) => {
  try {
    const rows    = db.getCheckedIn();
    const headers = ['id','color','title','first_name','last_name','full_name','organization','status','remarks','created_at','updated_at'];

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Checked-in Participants');

    // Header row with bold styling
    worksheet.addRow(headers);
    worksheet.getRow(1).font = { bold: true };

    // Data rows
    for (const row of rows) {
      worksheet.addRow(headers.map(h => row[h] ?? ''));
    }

    // Auto-fit columns (approximate)
    worksheet.columns.forEach(col => { col.width = 18; });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="checked-in-participants.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('[export xlsx]', err);
    res.status(500).json({ error: 'Excel export failed' });
  }
});

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Find first matching column index from an array of candidate names. */
function findCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Simple CSV line parser that handles quoted fields. */
function parseCsvLine(line) {
  const result = [];
  let current  = '';
  let inQuote  = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

module.exports = router;
