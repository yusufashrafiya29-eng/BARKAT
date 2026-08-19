import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigation from './src/navigation/RootNavigation';
import { AuthProvider } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProvider>
          <RootNavigation />
          <Toast />
        </WebSocketProvider>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
