import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In web, localhost works fine. For Android Emulator, use 10.0.2.2.
// For physical device, use your computer's local IP address (e.g. 192.168.1.5)
const BASE_URL = 'http://localhost:8000/api/v1'; 

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
