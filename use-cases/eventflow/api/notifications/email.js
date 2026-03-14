'use strict';

const nodemailer = require('nodemailer');
const { getTemplate } = require('./templates');
const { toDataURI } = require('../qr');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.RESEND_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    });
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    console.warn('[eventflow/email] No SMTP config — emails will not be sent');
    return null;
  }

  return transporter;
}

const FROM = process.env.EVENTFLOW_FROM_EMAIL || process.env.SMTP_USER || 'events@eventflow.app';
const FROM_NAME = process.env.EVENTFLOW_FROM_NAME || 'EventFlow';

async function sendEmail({ to, toName, type, attendee, event, tier }) {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'No email transport configured' };

  const tmpl = getTemplate(type);
  if (!tmpl) return { ok: false, error: `Unknown template: ${type}` };

  let qrDataUri = null;
  try { qrDataUri = await toDataURI(attendee.registration_code); } catch { /* best effort */ }

  const { subject, html } = tmpl({ attendee, event, tier, qrDataUri });

  try {
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${FROM}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[eventflow/email] send error:', err.message);
    return { ok: false, error: err.message };
  }
}

/** Send confirmation immediately with QR code */
async function sendConfirmation({ attendee, event, tier }) {
  return sendEmail({
    to: attendee.email,
    toName: `${attendee.first_name} ${attendee.last_name}`.trim(),
    type: 'confirmation',
    attendee, event, tier,
  });
}

/** Send a fully custom email (subject + html already composed) */
async function sendRaw({ to, toName, subject, html }) {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'No email transport configured' };
  try {
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${FROM}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject, html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail, sendConfirmation, sendRaw };
