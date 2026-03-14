'use strict';

/**
 * SSE broadcaster — per-event channels.
 * Clients connect to /api/eventflow/events/:id/stream
 */

const clients = new Map(); // eventId → Set<res>

function addClient(eventId, res) {
  if (!clients.has(eventId)) clients.set(eventId, new Set());
  clients.get(eventId).add(res);
}

function removeClient(eventId, res) {
  clients.get(eventId)?.delete(res);
}

function broadcast(eventId, type, data) {
  const conns = clients.get(eventId);
  if (!conns || !conns.size) return;
  const payload = `data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`;
  for (const res of conns) {
    try { res.write(payload); } catch { conns.delete(res); }
  }
}

/** Broadcast to ALL events (e.g. platform-level updates) */
function broadcastAll(type, data) {
  for (const [eventId] of clients) broadcast(eventId, type, data);
}

module.exports = { addClient, removeClient, broadcast, broadcastAll };
