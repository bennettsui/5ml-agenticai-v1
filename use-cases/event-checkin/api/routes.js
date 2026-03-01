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

// Initialise the PostgreSQL table when this module is first loaded
db.init().catch(err => console.error('[event-checkin] DB init error:', err));

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
router.get('/participants/search', async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) return res.json([]);
  try {
    res.json(await db.search(query));
  } catch (err) {
    console.error('[event-checkin search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /participants/:id/checkin
router.post('/participants/:id/checkin', async (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : undefined;
  try {
    const existing = await db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updates = { status: 'checked_in' };
    if (remarks !== undefined) updates.remarks = remarks;

    const updated = await db.update(id, updates);
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin checkin]', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// POST /participants/:id/remarks
router.post('/participants/:id/remarks', async (req, res) => {
  const id      = Number(req.params.id);
  const remarks = req.body.remarks !== undefined ? String(req.body.remarks) : '';
  try {
    const existing = await db.findById(id);
    if (!existing) return res.status(404).json({ error: 'Participant not found' });

    const updated = await db.update(id, { remarks });
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin remarks]', err);
    res.status(500).json({ error: 'Remarks update failed' });
  }
});

// POST /participants  — create from check-in "add new" form
router.post('/participants', async (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, remarks } = req.body;
  if (!color || !full_name)               return res.status(400).json({ error: 'color and full_name are required' });
  if (!VALID_COLORS.includes(color))      return res.status(400).json({ error: 'Invalid color' });
  try {
    const p = await db.insert({ color, title, first_name, last_name, full_name, organization, remarks });
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
router.get('/admin/participants', async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page, 10)      || 1);
  const pageSize = Math.min(200, parseInt(req.query.pageSize, 10) || 50);
  const color    = VALID_COLORS.includes(req.query.color)  ? req.query.color  : undefined;
  const status   = ['checked_in','not_checked_in'].includes(req.query.status) ? req.query.status : undefined;
  const query    = (req.query.query || '').trim() || undefined;
  try {
    res.json({ ...(await db.list({ page, pageSize, color, status, query })), page, pageSize });
  } catch (err) {
    console.error('[event-checkin admin list]', err);
    res.status(500).json({ error: 'Failed to list participants' });
  }
});

// POST /admin/participants — create from admin
router.post('/admin/participants', async (req, res) => {
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;
  if (!color || !full_name)          return res.status(400).json({ error: 'color and full_name are required' });
  if (!VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  try {
    const p = await db.insert({ color, title, first_name, last_name, full_name, organization, status, remarks });
    sse.broadcast('participant_created', { type: 'participant_created', payload: p });
    res.status(201).json(p);
  } catch (err) {
    console.error('[event-checkin admin create]', err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

// PUT /admin/participants/:id — update
router.put('/admin/participants/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { color, title, first_name, last_name, full_name, organization, status, remarks } = req.body;
  if (color && !VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  try {
    if (!(await db.findById(id))) return res.status(404).json({ error: 'Not found' });
    const fields = {};
    if (color        !== undefined) fields.color        = color;
    if (title        !== undefined) fields.title        = title;
    if (first_name   !== undefined) fields.first_name   = first_name;
    if (last_name    !== undefined) fields.last_name    = last_name;
    if (full_name    !== undefined) fields.full_name    = full_name;
    if (organization !== undefined) fields.organization = organization;
    if (status       !== undefined) fields.status       = status;
    if (remarks      !== undefined) fields.remarks      = remarks;
    const updated = await db.update(id, fields);
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    console.error('[event-checkin admin update]', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE /admin/participants/:id
router.delete('/admin/participants/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (!(await db.findById(id))) return res.status(404).json({ error: 'Not found' });
    await db.remove(id);
    sse.broadcast('participant_deleted', { type: 'participant_deleted', payload: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[event-checkin admin delete]', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /admin/participants/bulk-delete
router.post('/admin/participants/bulk-delete', async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'ids required' });
  try {
    const count = await db.bulkDelete(ids);
    sse.broadcast('bulk_deleted', { type: 'bulk_deleted', payload: { ids } });
    res.json({ deleted: count });
  } catch (err) {
    console.error('[event-checkin bulk delete]', err);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// POST /admin/participants/bulk-status
router.post('/admin/participants/bulk-status', async (req, res) => {
  const ids    = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  const status = req.body.status;
  if (!ids.length)                                          return res.status(400).json({ error: 'ids required' });
  if (!['checked_in','not_checked_in'].includes(status))   return res.status(400).json({ error: 'Invalid status' });
  try {
    const count       = await db.bulkStatus(ids, status);
    const updatedRows = (await Promise.all(ids.map(id => db.findById(id)))).filter(Boolean);
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

      // Normalize a color string to proper-case (handles PURPLE → Purple, blue → Blue)
      const normalizeColor = (c) =>
        VALID_COLORS.find(v => v.toLowerCase() === (c ?? '').toLowerCase()) ?? null;

      // Safely extract text from any ExcelJS cell value (string, number, rich-text object, Date)
      const cellText = (val) => {
        if (val == null) return null;
        if (typeof val === 'object' && Array.isArray(val.richText))
          return val.richText.map(r => r.text ?? '').join('').trim() || null;
        if (val instanceof Date) return null; // skip date cells
        const s = String(val).trim();
        return s || null;
      };

      for (const ws of workbook.worksheets) {
        // Case-insensitive sheet name → color (handles PURPLE, BLUE, etc.)
        const sheetColor = normalizeColor(ws.name.trim());

        // Detect whether row 1 is a header row or data row.
        // Heuristic: if col A is purely numeric (e.g. "001", "1") → no headers.
        const firstRow    = ws.getRow(1);
        const firstCellA  = cellText(firstRow.getCell(1).value) ?? '';
        const hasHeaders  = !/^\d+$/.test(firstCellA);
        const dataStart   = hasHeaders ? 2 : 1;

        // Build named column index from header row (only when headers exist)
        const colIndex = {};
        if (hasHeaders) {
          firstRow.eachCell((cell, colNum) => {
            const h = cellText(cell.value);
            if (h) colIndex[h] = colNum;
          });
        }

        // Look up a cell by one or more candidate header names
        const getByName = (row, ...names) => {
          for (const name of names) {
            const idx = colIndex[name];
            if (idx) {
              const v = cellText(row.getCell(idx).value);
              if (v) return v;
            }
          }
          return null;
        };

        ws.eachRow((row, rowNum) => {
          if (rowNum < dataStart) return;

          let color, title, first_name, last_name, full_name, organization;

          if (hasHeaders) {
            // Named-column mapping (flexible header names)
            full_name    = getByName(row,
              'FullName', 'full_name', 'Full Name',
              'Name', 'English Name', 'EnglishName',
              'Participant Name', 'Display Name', 'Badge Name');
            color        = sheetColor ?? normalizeColor(getByName(row,
              'Color', 'color', 'Colour', 'colour',
              'Group', 'group', 'Table', 'table', 'Table Color', 'Badge Color'));
            title        = getByName(row, 'Title', 'title', 'Salutation', 'salutation', 'Title/Salutation');
            first_name   = getByName(row, 'FirstName', 'first_name', 'First Name', 'Given Name');
            last_name    = getByName(row, 'LastName',  'last_name',  'Last Name',  'Surname');
            organization = getByName(row, 'Organization', 'organization', 'Organisation', 'Org', 'Company', 'Affiliation');
          } else {
            // No header row — positional mapping based on observed column layout:
            // A=No.  B=Color  C=Title  D=FirstName  E=LastName  F=FullName  G=Organization
            color        = sheetColor ?? normalizeColor(cellText(row.getCell(2).value));
            title        = cellText(row.getCell(3).value);
            first_name   = cellText(row.getCell(4).value);
            last_name    = cellText(row.getCell(5).value);
            full_name    = cellText(row.getCell(6).value);
            organization = cellText(row.getCell(7).value);
          }

          if (!full_name) return;
          rows.push({ color, title, first_name, last_name, full_name, organization });
        });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use .xlsx or .csv' });
    }

    // ── Deduplication + insert ─────────────────────────────────────────────────
    let inserted = 0, skipped = 0, updated = 0;
    const newRows = [];

    for (const row of rows) {
      // Normalize color one final time (handles any remaining case mismatches)
      if (row.color) row.color = VALID_COLORS.find(v => v.toLowerCase() === row.color.toLowerCase()) ?? row.color;
      if (!row.full_name || !VALID_COLORS.includes(row.color)) { skipped++; continue; }

      // TUNE: deduplication key is (full_name, organization, color)
      const existing = DEDUP_MODE !== 'insert'
        ? await db.findDuplicate(row.full_name, row.organization, row.color)
        : null;

      if (existing) {
        if (DEDUP_MODE === 'skip') {
          skipped++;
        } else if (DEDUP_MODE === 'update') {
          const p = await db.update(existing.id, { title: row.title, first_name: row.first_name, last_name: row.last_name, organization: row.organization });
          newRows.push(p); updated++;
        }
      } else {
        const p = await db.insert({ ...row, status: 'not_checked_in' });
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
    const rows    = await db.getCheckedIn();
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
    const rows    = await db.getCheckedIn();
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

// ═══════════════════════════════════════════════════════════════
//  AI ENDPOINTS  (deepseek-reasoner)
// ═══════════════════════════════════════════════════════════════

const deepseek = (() => {
  try { return require('../../../services/deepseekService'); } catch { return null; }
})();

function requireAI(res) {
  if (!deepseek || !deepseek.isAvailable()) {
    res.status(503).json({ error: 'AI unavailable — DEEPSEEK_API_KEY not set' });
    return false;
  }
  return true;
}

// Strip <think>…</think> blocks and extract first JSON object/array from AI output
function extractJson(text) {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const m = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!m) throw new Error('No JSON in AI response');
  return JSON.parse(m[1]);
}

async function getStats() {
  const { rows } = await db.list({ pageSize: 5000 });
  const byColor = {};
  for (const c of VALID_COLORS) {
    byColor[c] = {
      total:      rows.filter(p => p.color === c).length,
      checked_in: rows.filter(p => p.color === c && p.status === 'checked_in').length,
    };
  }
  return {
    total:       rows.length,
    checked_in:  rows.filter(p => p.status === 'checked_in').length,
    by_color:    byColor,
    orgs:        [...new Set(rows.map(p => p.organization).filter(Boolean))].length,
  };
}

// POST /ai/search-assist — fuzzy match when SQL returns 0 results
router.post('/ai/search-assist', async (req, res) => {
  if (!requireAI(res)) return;
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  const { rows } = await db.list({ pageSize: 2000 });
  const list = rows.map(p => `${p.id}|${p.full_name}|${p.organization || ''}|${p.color}`).join('\n');

  try {
    const result = await deepseek.analyze(
      `You are a guest list assistant for the RD Symposium check-in desk.
Find participants whose names or organisations fuzzy-match the search query.
Consider typos, partial names, abbreviations, name-order swaps, and romanisation variants.
Return ONLY valid JSON: {"ids":[id1,id2,...]} — up to 5 IDs, best match first. No explanation.`,
      `Query: "${query}"\n\nParticipants (id|full_name|organization|color):\n${list}`,
      { maxTokens: 512, temperature: 0 }
    );
    const { ids = [] } = extractJson(result.content);
    const participants = ids.slice(0, 5).map(id => db.findById(Number(id))).filter(Boolean);
    res.json({ participants });
  } catch (err) {
    console.error('[checkin ai search]', err);
    res.status(500).json({ error: 'AI search failed: ' + err.message });
  }
});

// POST /ai/enrich/:id — suggest cleaned/missing field values for a participant
router.post('/ai/enrich/:id', async (req, res) => {
  if (!requireAI(res)) return;
  const p = await db.findById(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });

  try {
    const result = await deepseek.analyze(
      `You are a data-quality assistant for an event guest list.
Given a participant record, suggest corrections or fill-ins for empty fields.
Rules: extract title (Dr./Mr./Ms./Prof./Hon.) and first/last name from full_name when those fields are blank.
Do NOT change full_name. Return ONLY valid JSON with keys: title, first_name, last_name, organization.
Only include a key if you have a confident suggestion that differs from the current value. No explanation.`,
      `Record:\n${JSON.stringify(p, null, 2)}`,
      { maxTokens: 256, temperature: 0 }
    );
    const raw = extractJson(result.content);
    const suggestions = {};
    for (const k of ['title', 'first_name', 'last_name', 'organization']) {
      if (raw[k] && String(raw[k]).trim() && raw[k] !== p[k]) suggestions[k] = String(raw[k]).trim();
    }
    res.json({ id: p.id, suggestions, current: p });
  } catch (err) {
    console.error('[checkin ai enrich]', err);
    res.status(500).json({ error: 'AI enrich failed: ' + err.message });
  }
});

// POST /ai/enrich/:id/apply — write AI suggestions back to the DB
router.post('/ai/enrich/:id/apply', (req, res) => {
  const id = Number(req.params.id);
  if (!db.findById(id)) return res.status(404).json({ error: 'Not found' });
  const safe = {};
  for (const k of ['title', 'first_name', 'last_name', 'organization']) {
    if (req.body[k] !== undefined) safe[k] = req.body[k];
  }
  if (!Object.keys(safe).length) return res.status(400).json({ error: 'No valid fields' });
  try {
    const updated = await db.update(id, safe);
    sse.broadcast('participant_updated', { type: 'participant_updated', payload: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Apply failed: ' + err.message });
  }
});

// POST /ai/report — generate a post-event attendance report (markdown)
router.post('/ai/report', async (req, res) => {
  if (!requireAI(res)) return;
  const stats = await getStats();
  const { rows } = await db.list({ pageSize: 5000 });
  const noShows = rows.filter(p => p.status === 'not_checked_in').map(p => `${p.full_name} (${p.color})`).slice(0, 30);

  try {
    const result = await deepseek.analyze(
      `You are an event coordinator writing a post-event attendance report for the RD Symposium.
Write a concise, professional report in markdown. Include: executive summary, attendance rate,
breakdown by group colour, notable observations, and a no-show list if applicable.`,
      `Event: RD Symposium\nDate: ${new Date().toDateString()}\n\nStats:\n${JSON.stringify(stats, null, 2)}\n\nNo-shows (sample):\n${noShows.join('\n')}`,
      { maxTokens: 1500, temperature: 0.3 }
    );
    res.json({ report: result.content, stats });
  } catch (err) {
    console.error('[checkin ai report]', err);
    res.status(500).json({ error: 'Report failed: ' + err.message });
  }
});

// POST /ai/explain — plain-language explanation of current dashboard stats
router.post('/ai/explain', async (req, res) => {
  if (!requireAI(res)) return;
  const stats = await getStats();

  try {
    const result = await deepseek.analyze(
      `You are a friendly event assistant. Explain the current check-in stats in 2–3 short paragraphs.
Highlight anything notable (low attendance in a group, overall progress, etc.).
Use plain language for an event organiser who needs a quick overview. No markdown headers.`,
      `RD Symposium live stats:\n${JSON.stringify(stats, null, 2)}`,
      { maxTokens: 400, temperature: 0.4 }
    );
    res.json({ explanation: result.content, stats });
  } catch (err) {
    console.error('[checkin ai explain]', err);
    res.status(500).json({ error: 'Explain failed: ' + err.message });
  }
});

// POST /ai/concierge — Q&A assistant about the participant list
router.post('/ai/concierge', async (req, res) => {
  if (!requireAI(res)) return;
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question required' });

  const { rows } = await db.list({ pageSize: 5000 });
  const compact = rows.map(p =>
    `${p.full_name}|${p.color}|${p.organization || ''}|${p.status === 'checked_in' ? '✓' : '○'}`
  ).join('\n');

  try {
    const result = await deepseek.analyze(
      `You are an intelligent concierge for the RD Symposium check-in desk.
You have the full guest list with live check-in status (✓=checked in, ○=not yet).
Answer the coordinator's question accurately and concisely.`,
      `Question: ${question}\n\nGuest list (name|color|org|status):\n${compact}`,
      { maxTokens: 800, temperature: 0.3 }
    );
    res.json({ answer: result.content });
  } catch (err) {
    console.error('[checkin ai concierge]', err);
    res.status(500).json({ error: 'Concierge failed: ' + err.message });
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
