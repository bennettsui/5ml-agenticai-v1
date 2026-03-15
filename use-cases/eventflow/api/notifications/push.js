'use strict';

/**
 * Expo Push Notification Client
 * Uses the free Expo Push API — no server key needed for development.
 * Handles both APNs (iOS) and FCM (Android) via Expo's gateway.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/expo-push/v2/push/send';

/**
 * Send push notifications to one or more Expo push tokens.
 * @param {string[]} tokens  - Array of ExponentPushToken[...] strings
 * @param {string}   title   - Notification title
 * @param {string}   body    - Notification body text
 * @param {object}   data    - Extra data passed to the app on tap
 * @param {object}   opts    - Optional: badge, sound, channelId
 */
async function sendPush(tokens, title, body, data = {}, opts = {}) {
  if (!tokens || tokens.length === 0) return { ok: true, sent: 0 };

  // Filter valid Expo push tokens
  const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken['));
  if (validTokens.length === 0) return { ok: true, sent: 0 };

  const messages = validTokens.map(token => ({
    to: token,
    title,
    body,
    data,
    sound: opts.sound !== false ? 'default' : undefined,
    badge: opts.badge,
    channelId: opts.channelId || 'default',
    priority: opts.priority || 'high',
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[eventflow/push] Expo API error:', res.status, text);
      return { ok: false, error: `Expo API ${res.status}` };
    }

    const result = await res.json();
    const errors = (result.data || []).filter(r => r.status === 'error');
    if (errors.length) {
      console.warn('[eventflow/push] Some tokens failed:', JSON.stringify(errors));
    }

    return { ok: true, sent: validTokens.length - errors.length };
  } catch (err) {
    console.error('[eventflow/push] Fetch error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Push templates for common notification types.
 */
const templates = {
  confirmation: (eventTitle, firstName) => ({
    title: '🎉 Registration Confirmed!',
    body: `You're registered for ${eventTitle}. Check your ticket in the app.`,
  }),

  reminder_1d: (eventTitle) => ({
    title: '⏰ Event Tomorrow!',
    body: `${eventTitle} is tomorrow. Don't forget your QR ticket!`,
  }),

  reminder_7d: (eventTitle) => ({
    title: '📅 Coming Up Next Week',
    body: `${eventTitle} is in 7 days. Get ready!`,
  }),

  doors_open: (eventTitle, location) => ({
    title: '🚪 Doors Are Open!',
    body: `${eventTitle} has started${location ? ` at ${location}` : ''}. Show your QR code at the entrance.`,
  }),

  post_event_1d: (eventTitle) => ({
    title: '🙏 Thank You for Attending!',
    body: `How was ${eventTitle}? We hope to see you at future events.`,
  }),

  new_attendee: (firstName, lastName, eventTitle) => ({
    title: '👤 New Registration',
    body: `${firstName} ${lastName} registered for ${eventTitle}`,
  }),

  checkin_milestone: (percent, eventTitle) => ({
    title: `🎯 ${percent}% Checked In`,
    body: `${eventTitle} has reached ${percent}% attendance`,
  }),
};

module.exports = { sendPush, templates };
