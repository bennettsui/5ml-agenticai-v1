'use strict';

const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../auth');
const { processQueue } = require('../notifications/engine');
const { sendRaw } = require('../notifications/email');

// GET /api/eventflow/notifications/log/:eventId
router.get('/log/:eventId', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.eventId));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });
    const log = await db.getNotificationLog(event.id, parseInt(req.query.limit || 200));
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/notifications/trigger — manual queue flush (dev/admin)
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    await processQueue();
    res.json({ ok: true, message: 'Queue processed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventflow/notifications/blast/:eventId  — send to all/filtered attendees
router.post('/blast/:eventId', requireAuth, async (req, res) => {
  try {
    const event = await db.findEventById(parseInt(req.params.eventId));
    if (!event || event.organizer_id !== req.organizer.id) return res.status(403).json({ error: 'Forbidden' });

    const { subject, message, filter_status } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });

    const { rows: attendees } = await db.listAttendees(event.id, {
      status: filter_status || null,
      pageSize: 5000, page: 1,
    });

    let sent = 0; let failed = 0;
    const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;padding:40px;">
      <div style="max-width:520px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;color:#f1f5f9;">
        <h2 style="margin:0 0 16px;">${event.title}</h2>
        <p style="line-height:1.6;color:#cbd5e1;">${message.replace(/\n/g, '<br>')}</p>
        <hr style="border:none;border-top:1px solid #334155;margin:24px 0;">
        <p style="font-size:12px;color:#64748b;">Sent via EventFlow</p>
      </div>
    </body></html>`;

    for (const a of attendees) {
      const result = await sendRaw({
        to: a.email,
        toName: `${a.first_name} ${a.last_name}`.trim(),
        subject, html: htmlBody,
      });
      if (result.ok) sent++; else failed++;
    }

    res.json({ sent, failed, total: attendees.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
