import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api/env';

interface WebSocketContextData {
  lastMessage: any;
}

const WebSocketContext = createContext<WebSocketContextData>({ lastMessage: null });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, restaurantId } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!token || !restaurantId) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    // Convert HTTP URL to WS URL
    const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/orders/ws/kitchen/${restaurantId}?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected to kitchen namespace');
    };

    ws.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);

        // Check if food is ready
        if (data.type === 'order_update' && data.status === 'READY') {
          // Check settings
          const settingsStr = await AsyncStorage.getItem('app_settings');
          const settings = settingsStr ? JSON.parse(settingsStr) : null;
          
          const alertsEnabled = settings ? settings.foodReadyAlerts : true; // Default true
          
          if (alertsEnabled) {
            Toast.show({
              type: 'success',
              text1: '🍽️ Food is Ready!',
              text2: `Order for Table ${data.table_name || 'Unknown'} is ready to be served.`,
              position: 'top',
              visibilityTime: 4000,
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.current.onerror = (error) => {
      console.log('WebSocket error', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token, restaurantId]);

  return (
    <WebSocketContext.Provider value={{ lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
