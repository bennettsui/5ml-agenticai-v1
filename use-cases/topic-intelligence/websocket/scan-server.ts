/**
 * WebSocket Server for Real-Time Scan Updates
 * Handles connections for /intelligence/live-scan page
 *
 * Events:
 * - article_analyzed: New article analyzed
 * - progress_update: Overall progress metrics
 * - source_status_update: Per-source status change
 * - scan_complete: Workflow finished
 * - error_occurred: Error during workflow
 */

import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface ClientConnection {
  id: string;
  socket: WebSocket;
  topicId: string;
  subscribedAt: Date;
  lastPing: Date;
}

export interface ScanServerConfig {
  port: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export interface BroadcastMessage {
  event: string;
  topicId: string;
  data: unknown;
  timestamp: string;
}

const DEFAULT_CONFIG: ScanServerConfig = {
  port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
  heartbeatInterval: 30000, // 30 seconds
  heartbeatTimeout: 35000, // 35 seconds
};

export class ScanWebSocketServer extends EventEmitter {
  private server: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private topicClients: Map<string, Set<string>> = new Map(); // topicId -> clientIds
  private config: ScanServerConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ScanServerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the WebSocket server
   */
  start(): void {
    if (this.server) {
      console.warn('[ScanWebSocketServer] Server already running');
      return;
    }

    this.server = new WebSocketServer({ port: this.config.port });

    this.server.on('connection', (socket, request) => {
      this.handleConnection(socket, request);
    });

    this.server.on('error', error => {
      console.error('[ScanWebSocketServer] Server error:', error);
      this.emit('error', error);
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log(`[ScanWebSocketServer] Started on port ${this.config.port}`);
    this.emit('started', { port: this.config.port });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: WebSocket, request: any): void {
    const clientId = uuidv4();

    // Extract topic ID from query string
    const url = new URL(request.url || '', `ws://localhost:${this.config.port}`);
    const topicId = url.searchParams.get('topicId') || 'global';

    const client: ClientConnection = {
      id: clientId,
      socket,
      topicId,
      subscribedAt: new Date(),
      lastPing: new Date(),
    };

    this.clients.set(clientId, client);
    this.addClientToTopic(topicId, clientId);

    console.log(`[ScanWebSocketServer] Client ${clientId} connected for topic ${topicId}`);
    this.emit('client_connected', { clientId, topicId });

    // Send welcome message
    this.sendToClient(clientId, {
      event: 'connected',
      topicId,
      data: { clientId, message: 'Connected to scan server' },
      timestamp: new Date().toISOString(),
    });

    // Handle messages
    socket.on('message', data => {
      this.handleMessage(clientId, data);
    });

    // Handle close
    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle errors
    socket.on('error', error => {
      console.error(`[ScanWebSocketServer] Client ${clientId} error:`, error);
      this.handleDisconnect(clientId);
    });

    // Handle pong (for heartbeat)
    socket.on('pong', () => {
      client.lastPing = new Date();
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          // Change topic subscription
          if (message.topicId) {
            this.removeClientFromTopic(client.topicId, clientId);
            client.topicId = message.topicId;
            this.addClientToTopic(message.topicId, clientId);

            this.sendToClient(clientId, {
              event: 'subscribed',
              topicId: message.topicId,
              data: { message: `Subscribed to topic ${message.topicId}` },
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'unsubscribe':
          // Unsubscribe from current topic
          this.removeClientFromTopic(client.topicId, clientId);
          client.topicId = 'global';
          this.addClientToTopic('global', clientId);

          this.sendToClient(clientId, {
            event: 'unsubscribed',
            topicId: 'global',
            data: { message: 'Unsubscribed from topic' },
            timestamp: new Date().toISOString(),
          });
          break;

        case 'ping':
          // Respond to client ping
          this.sendToClient(clientId, {
            event: 'pong',
            topicId: client.topicId,
            data: { timestamp: Date.now() },
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          // Forward to event handlers
          this.emit('message', { clientId, topicId: client.topicId, message });
      }
    } catch (error) {
      console.error(`[ScanWebSocketServer] Failed to parse message from ${clientId}:`, error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.removeClientFromTopic(client.topicId, clientId);
    this.clients.delete(clientId);

    console.log(`[ScanWebSocketServer] Client ${clientId} disconnected`);
    this.emit('client_disconnected', { clientId, topicId: client.topicId });
  }

  /**
   * Add client to topic subscribers
   */
  private addClientToTopic(topicId: string, clientId: string): void {
    if (!this.topicClients.has(topicId)) {
      this.topicClients.set(topicId, new Set());
    }
    this.topicClients.get(topicId)!.add(clientId);
  }

  /**
   * Remove client from topic subscribers
   */
  private removeClientFromTopic(topicId: string, clientId: string): void {
    const clients = this.topicClients.get(topicId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.topicClients.delete(topicId);
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: BroadcastMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) return;

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[ScanWebSocketServer] Failed to send to ${clientId}:`, error);
    }
  }

  // ==================== Public API ====================

  /**
   * Broadcast event to all clients subscribed to a topic
   */
  broadcast(topicId: string, event: string, data: unknown): void {
    const clientIds = this.topicClients.get(topicId);
    if (!clientIds || clientIds.size === 0) {
      // Also try global subscribers
      const globalClients = this.topicClients.get('global');
      if (!globalClients || globalClients.size === 0) return;

      for (const clientId of globalClients) {
        this.sendToClient(clientId, {
          event,
          topicId,
          data,
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }

    const message: BroadcastMessage = {
      event,
      topicId,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }

    // Also broadcast to global subscribers
    const globalClients = this.topicClients.get('global');
    if (globalClients) {
      for (const clientId of globalClients) {
        if (!clientIds.has(clientId)) {
          this.sendToClient(clientId, message);
        }
      }
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastAll(event: string, data: unknown): void {
    const message: BroadcastMessage = {
      event,
      topicId: 'global',
      data,
      timestamp: new Date().toISOString(),
    };

    for (const [clientId] of this.clients) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Get broadcast callback for workflows
   */
  getBroadcastCallback(): (topicId: string, event: string, data: unknown) => void {
    return (topicId: string, event: string, data: unknown) => {
      this.broadcast(topicId, event, data);
    };
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients for a topic
   */
  getTopicClientCount(topicId: string): number {
    return this.topicClients.get(topicId)?.size || 0;
  }

  /**
   * Get server status
   */
  getStatus(): {
    running: boolean;
    port: number;
    totalClients: number;
    topicSubscriptions: Record<string, number>;
  } {
    const subscriptions: Record<string, number> = {};
    for (const [topicId, clients] of this.topicClients) {
      subscriptions[topicId] = clients.size;
    }

    return {
      running: !!this.server,
      port: this.config.port,
      totalClients: this.clients.size,
      topicSubscriptions: subscriptions,
    };
  }

  // ==================== Heartbeat ====================

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }

  /**
   * Check client heartbeats
   */
  private checkHeartbeats(): void {
    const timeout = this.config.heartbeatTimeout || 35000;
    const now = Date.now();

    for (const [clientId, client] of this.clients) {
      // Check if client has timed out
      if (now - client.lastPing.getTime() > timeout) {
        console.log(`[ScanWebSocketServer] Client ${clientId} timed out`);
        client.socket.terminate();
        this.handleDisconnect(clientId);
        continue;
      }

      // Send ping
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.ping();
      }
    }
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      client.socket.close(1000, 'Server shutting down');
      this.handleDisconnect(clientId);
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    console.log('[ScanWebSocketServer] Stopped');
    this.emit('stopped');
  }
}

// Export factory function
export function createScanWebSocketServer(config?: Partial<ScanServerConfig>): ScanWebSocketServer {
  return new ScanWebSocketServer(config);
}

// Create and export singleton instance
let serverInstance: ScanWebSocketServer | null = null;

export function getScanWebSocketServer(): ScanWebSocketServer {
  if (!serverInstance) {
    serverInstance = createScanWebSocketServer();
  }
  return serverInstance;
}

export default ScanWebSocketServer;
