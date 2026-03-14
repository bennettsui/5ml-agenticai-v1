'use strict';

/**
 * WhatsApp Business Cloud API
 * Requires:
 *   WHATSAPP_PHONE_NUMBER_ID  — phone number ID from Meta Business Manager
 *   WHATSAPP_ACCESS_TOKEN     — permanent system user token
 *
 * Template messages must be pre-approved in Meta Business Manager.
 * Template names used here:
 *   ef_confirmation   — "Hi {{1}}, your registration for {{2}} is confirmed..."
 *   ef_reminder_7d    — "{{1}}, {{2}} is in 7 days! Here's your QR link: {{3}}"
 *   ef_reminder_1d    — "{{1}}, {{2}} is TOMORROW! QR link: {{3}}"
 *   ef_doors_open     — "{{1}}, {{2}} is happening right now! QR: {{3}}"
 *   ef_post_event     — "Thank you for attending {{1}}, {{2}}!"
 */

const BASE_URL = process.env.EVENTFLOW_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN      = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v20.0';

const TEMPLATE_MAP = {
  confirmation:  'ef_confirmation',
  reminder_7d:   'ef_reminder_7d',
  reminder_1d:   'ef_reminder_1d',
  doors_open:    'ef_doors_open',
  post_event_1d: 'ef_post_event',
};

function isConfigured() {
  return !!(PHONE_ID && TOKEN);
}

function toE164(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `852${digits.slice(1)}`; // HK fallback
  return digits;
}

function buildComponents(type, { attendee, event }) {
  const qrUrl = `${BASE_URL}/eventflow/${event.slug}?qr=${attendee.registration_code}`;
  const params = (strs) => strs.map((text) => ({ type: 'text', text }));

  switch (type) {
    case 'confirmation':
      return [{ type: 'body', parameters: params([attendee.first_name, event.title]) }];
    case 'reminder_7d':
    case 'reminder_1d':
    case 'doors_open':
      return [{ type: 'body', parameters: params([attendee.first_name, event.title, qrUrl]) }];
    case 'post_event_1d':
      return [{ type: 'body', parameters: params([event.title, attendee.first_name]) }];
    default:
      return [];
  }
}

async function send({ phone, type, attendee, event }) {
  if (!isConfigured()) return { ok: false, error: 'WhatsApp not configured' };
  if (!phone) return { ok: false, error: 'No phone number' };

  const templateName = TEMPLATE_MAP[type];
  if (!templateName) return { ok: false, error: `No WhatsApp template for type: ${type}` };

  const body = {
    messaging_product: 'whatsapp',
    to: toE164(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: buildComponents(type, { attendee, event }),
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || JSON.stringify(data) };
    }
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { send, isConfigured };
