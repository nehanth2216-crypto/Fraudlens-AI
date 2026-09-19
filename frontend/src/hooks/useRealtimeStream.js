import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useRealtimeStream({ onTransaction, onAlert, onAlertUpdated } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Compute WebSocket URL
  const getWsUrl = () => {
    const isProd = import.meta.env.PROD;
    const customApi = import.meta.env.VITE_API_URL;

    if (customApi) {
      const url = new URL(customApi);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/ws/alerts`;
    }

    if (isProd) {
      // Production Render host
      return 'wss://fraudlens-ai-1-pfvy.onrender.com/ws/alerts';
    }

    // Local dev: backend runs on port 8000
    return 'ws://localhost:8000/ws/alerts';
  };

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsUrl();
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Start ping keepalive
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessageTime(new Date());

          if (data.type === 'NEW_TRANSACTION') {
            if (onTransaction) onTransaction(data.payload);
          } else if (data.type === 'NEW_ALERT') {
            const alert = data.payload;
            if (alert.severity === 'CRITICAL' || alert.risk_level === 'CRITICAL') {
              toast.error(`🚨 CRITICAL FRAUD: ${alert.title || 'High-Risk Transaction Flagged'} (₹${Number(alert.amount || 0).toLocaleString('en-IN')})`, {
                duration: 6000,
                id: `alert-${alert.alert_id || alert.id}`,
              });
            } else if (alert.severity === 'HIGH' || alert.risk_level === 'HIGH') {
              toast(`⚠️ High-Risk Alert: ${alert.title || 'Suspicious Activity Detected'}`, {
                icon: '⚠️',
                duration: 4000,
              });
            }
            if (onAlert) onAlert(alert);
          } else if (data.type === 'ALERT_UPDATED' || data.type === 'ALERT_RESOLVED') {
            if (onAlertUpdated) onAlertUpdated(data.payload);
          }
        } catch (e) {
          // Non-JSON ping/pong or ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Attempt automatic reconnect after 4 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    } catch (err) {
      setIsConnected(false);
    }
  }, [onTransaction, onAlert, onAlertUpdated]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessageTime,
    reconnect: connect,
  };
}
