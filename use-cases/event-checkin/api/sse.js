'use strict';

/**
 * sse.js — Simple Server-Sent Events broadcast manager.
 *
 * Keeps a set of active SSE response objects and broadcasts
 * named events to all connected clients.
 *
 * Usage:
 *   const sse = require('./sse');
 *   // In a route handler that receives a change:
 *   sse.broadcast('participant_updated', { ... });
 *   // SSE endpoint:
 *   router.get('/events', sse.handler);
 */

const clients = new Set();

/**
 * Express route handler for GET /events
 * Keeps the connection open and registers the client.
 */
function handler(req, res) {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if behind proxy
  res.flushHeaders();

  // Send an initial ping so the client knows it's connected
  res.write('event: connected\ndata: {}\n\n');

  clients.add(res);

  // Heartbeat every 30s to keep the connection alive through proxies
  const hb = setInterval(() => res.write(':heartbeat\n\n'), 30_000);

  req.on('close', () => {
    clearInterval(hb);
    clients.delete(res);
  });
}

/**
 * Broadcast a named event to all connected SSE clients.
 * @param {string} event  — event name (e.g. 'participant_updated')
 * @param {object} data   — JSON-serialisable payload
 */
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(msg);
  }
}

/** Number of connected clients (useful for diagnostics). */
function clientCount() { return clients.size; }

module.exports = { handler, broadcast, clientCount };
