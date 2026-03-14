'use strict';

/**
 * LINE Messaging API
 * Requires:
 *   LINE_CHANNEL_ACCESS_TOKEN — from LINE Developers console
 *
 * Sends Flex Messages (rich card design) to users who connected their LINE account.
 * line_user_id is obtained via LINE Login OAuth during RSVP (stored in ef_attendees).
 */

const BASE_URL = process.env.EVENTFLOW_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const TOKEN    = process.env.LINE_CHANNEL_ACCESS_TOKEN;

function isConfigured() {
  return !!TOKEN;
}

function formatDate(dt, tz = 'Asia/Hong_Kong') {
  return new Date(dt).toLocaleString('en-HK', {
    timeZone: tz, weekday: 'short', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function buildFlexMessage(type, { attendee, event }) {
  const qrUrl = `${BASE_URL}/eventflow/${event.slug}?qr=${attendee.registration_code}`;
  const eventUrl = `${BASE_URL}/eventflow/${event.slug}`;
  const dateStr = formatDate(event.start_at, event.timezone);

  const badgeMap = {
    confirmation:  { text: 'Registration Confirmed ✓', color: '#059669' },
    reminder_7d:   { text: '7 Days to Go',             color: '#f59e0b' },
    reminder_1d:   { text: 'Tomorrow!',                color: '#ef4444' },
    doors_open:    { text: '🟢 Happening Now',         color: '#22c55e' },
    post_event_1d: { text: 'Thank You',                color: '#8b5cf6' },
  };

  const titleMap = {
    confirmation:  `Hi ${attendee.first_name}, you're registered!`,
    reminder_7d:   `${event.title} is in 7 days`,
    reminder_1d:   `See you tomorrow at ${event.title}`,
    doors_open:    `The doors are open!`,
    post_event_1d: `Thank you for attending`,
  };

  const badge = badgeMap[type] || { text: 'EventFlow', color: '#f59e0b' };
  const title = titleMap[type] || event.title;

  const flex = {
    type: 'flex',
    altText: `${event.title} — ${badge.text}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      ...(event.banner_url ? {
        hero: {
          type: 'image', url: event.banner_url,
          size: 'full', aspectRatio: '20:9', aspectMode: 'cover',
        },
      } : {}),
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: badge.text, size: 'xs', color: badge.color, weight: 'bold' },
          { type: 'text', text: event.title, weight: 'bold', size: 'xl', wrap: true, color: '#0f172a' },
          { type: 'text', text: title, size: 'sm', color: '#64748b', wrap: true, margin: 'sm' },
          {
            type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
            contents: [
              { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                { type: 'text', text: '📅', size: 'sm', flex: 0 },
                { type: 'text', text: dateStr, size: 'sm', color: '#475569', wrap: true },
              ]},
              ...(event.location ? [{ type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                { type: 'text', text: '📍', size: 'sm', flex: 0 },
                { type: 'text', text: event.location, size: 'sm', color: '#475569', wrap: true },
              ]}] : []),
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm',
        contents: [
          {
            type: 'button', style: 'primary',
            color: '#f59e0b', height: 'sm',
            action: { type: 'uri', label: type === 'post_event_1d' ? 'View Event' : 'View My QR Code', uri: type === 'post_event_1d' ? eventUrl : qrUrl },
          },
        ],
      },
    },
  };

  return flex;
}

async function send({ lineUserId, type, attendee, event }) {
  if (!isConfigured()) return { ok: false, error: 'LINE not configured' };
  if (!lineUserId) return { ok: false, error: 'No LINE user ID' };

  const message = buildFlexMessage(type, { attendee, event });

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: lineUserId, messages: [message] }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data) };
    }
    return { ok: true, messageId: data?.sentMessages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { send, isConfigured };
