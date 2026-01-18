/**
 * React Hook for WebSocket Receipt Processing Updates
 *
 * Connects to WebSocket server and provides real-time updates
 * for receipt batch processing.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  batchId?: string;
  event?: string;
  timestamp?: string;
  data?: any;
  error?: string;
  message?: string;
}

export interface ProcessingProgress {
  total_receipts: number;
  processed_receipts: number;
  failed_receipts: number;
  current_step: string;
  current_file?: string;
  total_amount?: number;
  deductible_amount?: number;
}

export interface ProcessingLog {
  level: string;
  message: string;
  step: string;
}

export interface UseReceiptWebSocketOptions {
  batchId: string | null;
  onProgress?: (progress: ProcessingProgress) => void;
  onStatus?: (status: string, details: any) => void;
  onLog?: (log: ProcessingLog) => void;
  onCompleted?: (summary: any) => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
}

export function useReceiptWebSocket({
  batchId,
  onProgress,
  onStatus,
  onLog,
  onCompleted,
  onError,
  autoReconnect = true,
}: UseReceiptWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!batchId) {
      return;
    }

    // Get WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to batch updates
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            batchId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'connected':
              console.log('WebSocket handshake complete');
              break;

            case 'subscribed':
              console.log(`Subscribed to batch ${message.batchId}`);
              break;

            case 'update':
              handleUpdate(message);
              break;

            case 'error':
              console.error('WebSocket error message:', message.error);
              if (onError) {
                onError(message.error || 'Unknown error');
              }
              break;

            case 'pong':
              // Heartbeat response
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect
        if (autoReconnect && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [batchId, autoReconnect, onError]);

  const handleUpdate = (message: WebSocketMessage) => {
    const { event, data } = message;

    switch (event) {
      case 'progress':
        if (onProgress && data) {
          onProgress(data);
        }
        break;

      case 'status':
        if (onStatus && data) {
          onStatus(data.status, data);
        }
        break;

      case 'log':
        if (onLog && data) {
          onLog(data);
        }
        break;

      case 'completed':
        if (onCompleted && data) {
          onCompleted(data);
        }
        // Disconnect after completion
        disconnect();
        break;

      case 'error':
        if (onError && data) {
          onError(data.error);
        }
        break;

      default:
        console.log('Unknown event:', event);
    }
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Unsubscribe before closing
      if (batchId && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'unsubscribe',
            batchId,
          })
        );
      }

      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [batchId]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }, []);

  // Connect on mount or when batchId changes
  useEffect(() => {
    if (batchId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [batchId, connect, disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const heartbeat = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // 30 seconds

    return () => {
      clearInterval(heartbeat);
    };
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    connectionError,
    disconnect,
    sendMessage,
  };
}

export default useReceiptWebSocket;
