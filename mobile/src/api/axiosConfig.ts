import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './env';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { DeviceEventEmitter } from 'react-native';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      DeviceEventEmitter.emit('force_logout');
    }
    return Promise.reject(error);
  }
);

export default api;
