'use strict';

/**
 * EventFlow Notification Engine
 * - Runs on a cron every 5 minutes
 * - Picks up due ef_notification_schedule rows
 * - Dispatches via email / WhatsApp / LINE
 */

const cron     = require('node-cron');
const db       = require('../db');
const email    = require('./email');
const whatsapp = require('./whatsapp');
const line     = require('./line');
const push     = require('./push');

let running = false;

async function processQueue() {
  if (running) return;
  running = true;
  try {
    const due = await db.getDueNotifications(50);
    if (!due.length) return;

    console.log(`[eventflow/notifications] Processing ${due.length} due notifications`);

    for (const n of due) {
      try {
        let result;

        if (n.channel === 'email') {
          result = await email.sendEmail({
            to: n.email,
            toName: `${n.first_name} ${n.last_name}`.trim(),
            type: n.type,
            attendee: {
              first_name: n.first_name, last_name: n.last_name,
              email: n.email, registration_code: n.registration_code,
            },
            event: {
              title: n.event_title, start_at: n.start_at, end_at: n.end_at,
              location: n.location, slug: n.slug, banner_url: n.banner_url,
              timezone: n.timezone,
            },
            tier: n.tier_name ? { name: n.tier_name } : null,
          });

        } else if (n.channel === 'whatsapp') {
          result = await whatsapp.send({
            phone: n.phone,
            type: n.type,
            attendee: { first_name: n.first_name, last_name: n.last_name, registration_code: n.registration_code },
            event: { title: n.event_title, start_at: n.start_at, slug: n.slug, timezone: n.timezone, location: n.location },
          });

        } else if (n.channel === 'line') {
          result = await line.send({
            lineUserId: n.line_user_id,
            type: n.type,
            attendee: { first_name: n.first_name, last_name: n.last_name, registration_code: n.registration_code },
            event: {
              title: n.event_title, start_at: n.start_at, slug: n.slug,
              banner_url: n.banner_url, location: n.location, timezone: n.timezone,
            },
          });

        } else {
          result = { ok: false, error: `Unknown channel: ${n.channel}` };
        }

        if (result?.ok) {
          await db.markNotificationSent(n.id, result.messageId);
        } else {
          console.warn(`[eventflow/notifications] Failed: id=${n.id} type=${n.type} channel=${n.channel}: ${result?.error}`);
          await db.markNotificationFailed(n.id, result?.error || 'unknown');
        }
      } catch (err) {
        console.error(`[eventflow/notifications] Error processing id=${n.id}:`, err.message);
        await db.markNotificationFailed(n.id, err.message);
      }
    }
  } finally {
    running = false;
  }
}

function start() {
  // Process every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    processQueue().catch((err) =>
      console.error('[eventflow/notifications] Queue error:', err.message)
    );
  });
  console.log('[eventflow/notifications] Engine started (every 5 min)');
}

/** Schedule all notification types for a new attendee */
async function scheduleForAttendee(attendee, event) {
  const channels = ['email'];
  if (attendee.notify_whatsapp && attendee.phone) channels.push('whatsapp');
  if (attendee.notify_line && attendee.line_user_id) channels.push('line');

  await db.scheduleAllChannels(
    attendee.id, event.id, attendee.contact_id, event.start_at, channels
  );

  // Send immediate push confirmation to participant (fire-and-forget)
  sendParticipantPush(attendee, event, 'confirmation').catch(() => {});
}

/**
 * Send a push notification to a participant (keyed by session_id if provided).
 * session_id is stored on the attendee.metadata._session_id when passed during RSVP.
 */
async function sendParticipantPush(attendee, event, type) {
  try {
    const sessionId = attendee.metadata && attendee.metadata._session_id;
    if (!sessionId) return;
    const tokens = await db.getPushTokensByContext('participant', sessionId);
    if (!tokens.length) return;
    const tpl = push.templates[type];
    if (!tpl) return;
    const { title, body } = tpl(event.title, attendee.first_name);
    await push.sendPush(tokens, title, body, {
      type,
      event_slug: event.slug,
      registration_code: attendee.registration_code,
    });
  } catch (err) {
    console.warn('[eventflow/push] participant push error:', err.message);
  }
}

/**
 * Send push to an organizer (e.g. new registration alert).
 */
async function sendOrganizerPush(organizerId, title, body, data = {}) {
  try {
    const tokens = await db.getPushTokensByContext('organizer', organizerId);
    if (!tokens.length) return;
    await push.sendPush(tokens, title, body, data);
  } catch (err) {
    console.warn('[eventflow/push] organizer push error:', err.message);
  }
}

module.exports = { start, processQueue, scheduleForAttendee, sendOrganizerPush };
