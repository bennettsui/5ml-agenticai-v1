/**
 * WebSocket Server for Real-time Receipt Processing Updates
 *
 * Provides real-time status updates to frontend clients during batch processing.
 * Clients subscribe to batch updates and receive progress notifications.
 */

const WebSocket = require('ws');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // batchId -> Set of WebSocket clients
  }

  /**
   * Initialize WebSocket server
   *
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Invalid message format',
            })
          );
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.unsubscribeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to receipt processing updates',
        })
      );
    });

    // Heartbeat to detect broken connections
    const heartbeat = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating inactive WebSocket connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(heartbeat);
    });

    console.log('✅ WebSocket server initialized at /ws');
  }

  /**
   * Handle incoming messages from clients
   *
   * @param {WebSocket} ws - WebSocket client
   * @param {Object} data - Message data
   */
  handleMessage(ws, data) {
    const { type, batchId } = data;

    switch (type) {
      case 'subscribe':
        if (batchId) {
          this.subscribeClient(ws, batchId);
          ws.send(
            JSON.stringify({
              type: 'subscribed',
              batchId,
              message: `Subscribed to batch ${batchId}`,
            })
          );
          console.log(`Client subscribed to batch ${batchId}`);
        }
        break;

      case 'unsubscribe':
        if (batchId) {
          this.unsubscribeClient(ws, batchId);
          ws.send(
            JSON.stringify({
              type: 'unsubscribed',
              batchId,
              message: `Unsubscribed from batch ${batchId}`,
            })
          );
          console.log(`Client unsubscribed from batch ${batchId}`);
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            error: `Unknown message type: ${type}`,
          })
        );
    }
  }

  /**
   * Subscribe client to batch updates
   *
   * @param {WebSocket} ws - WebSocket client
   * @param {string} batchId - Batch ID to subscribe to
   */
  subscribeClient(ws, batchId) {
    if (!this.clients.has(batchId)) {
      this.clients.set(batchId, new Set());
    }
    this.clients.get(batchId).add(ws);
  }

  /**
   * Unsubscribe client from specific batch or all batches
   *
   * @param {WebSocket} ws - WebSocket client
   * @param {string} [batchId] - Specific batch ID (if not provided, unsubscribe from all)
   */
  unsubscribeClient(ws, batchId = null) {
    if (batchId) {
      const clients = this.clients.get(batchId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.clients.delete(batchId);
        }
      }
    } else {
      // Unsubscribe from all batches
      this.clients.forEach((clients, id) => {
        clients.delete(ws);
        if (clients.size === 0) {
          this.clients.delete(id);
        }
      });
    }
  }

  /**
   * Broadcast update to all clients subscribed to a batch
   *
   * @param {string} batchId - Batch ID
   * @param {Object} data - Update data to broadcast
   */
  broadcast(batchId, data) {
    const clients = this.clients.get(batchId);
    if (!clients || clients.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'update',
      batchId,
      timestamp: new Date().toISOString(),
      ...data,
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`Broadcast to ${clients.size} clients for batch ${batchId}:`, data.event);
  }

  /**
   * Send progress update
   *
   * @param {string} batchId - Batch ID
   * @param {Object} progress - Progress data
   */
  sendProgress(batchId, progress) {
    this.broadcast(batchId, {
      event: 'progress',
      data: progress,
    });
  }

  /**
   * Send status update
   *
   * @param {string} batchId - Batch ID
   * @param {string} status - New status
   * @param {Object} details - Additional details
   */
  sendStatus(batchId, status, details = {}) {
    this.broadcast(batchId, {
      event: 'status',
      data: {
        status,
        ...details,
      },
    });
  }

  /**
   * Send log message
   *
   * @param {string} batchId - Batch ID
   * @param {string} level - Log level (info, warning, error)
   * @param {string} message - Log message
   * @param {string} step - Processing step
   */
  sendLog(batchId, level, message, step) {
    this.broadcast(batchId, {
      event: 'log',
      data: {
        level,
        message,
        step,
      },
    });
  }

  /**
   * Send completion notification
   *
   * @param {string} batchId - Batch ID
   * @param {Object} summary - Processing summary
   */
  sendCompletion(batchId, summary) {
    this.broadcast(batchId, {
      event: 'completed',
      data: summary,
    });
  }

  /**
   * Send error notification
   *
   * @param {string} batchId - Batch ID
   * @param {string} error - Error message
   */
  sendError(batchId, error) {
    this.broadcast(batchId, {
      event: 'error',
      data: {
        error,
      },
    });
  }

  /**
   * Get connection statistics
   *
   * @returns {Object} Connection stats
   */
  getStats() {
    const totalClients = this.wss ? this.wss.clients.size : 0;
    const subscriptions = Array.from(this.clients.entries()).map(([batchId, clients]) => ({
      batchId,
      subscribers: clients.size,
    }));

    return {
      totalClients,
      activeBatches: this.clients.size,
      subscriptions,
    };
  }
}

// Export singleton instance
const wsServer = new WebSocketServer();

module.exports = wsServer;
