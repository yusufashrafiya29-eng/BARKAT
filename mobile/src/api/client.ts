import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Use localhost for Web testing, and 10.0.2.2 for Android Emulator testing.
// For physical devices on the same Wi-Fi, change this to your computer's IP (e.g. 192.168.x.x)
export const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api/v1' 
  : 'http://10.0.2.2:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
