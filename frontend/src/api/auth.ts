import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1') + '/auth';

export const authApi = {
  signupOwner: async (data: FormData) => {
    // Note: Do NOT set Content-Type header manually for FormData. 
    // Axios will automatically set it with the correct boundary.
    const response = await axios.post(`${API_URL}/signup/owner`, data);
    return response.data;
  },
  
  signupStaff: async (data: any) => {
    const response = await axios.post(`${API_URL}/signup/staff`, data);
    return response.data;
  },
  
  login: async (data: any) => {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data;
  },
  
  verifyOtp: async (data: { email: string; otp_code: string }) => {
    const response = await axios.post(`${API_URL}/verify-otp`, data);
    return response.data;
  },
  
  sendOtp: async (data: { email: string }) => {
    const response = await axios.post(`${API_URL}/send-otp`, data);
    return response.data;
  },
  
  getMe: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("No token found");
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  getActiveAnnouncements: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];
    
    // The endpoint is under /users, not /auth
    const USERS_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1') + '/users';
    try {
      const response = await axios.get(`${USERS_URL}/announcements/active`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      return [];
    }
  },
  
  getPublicPlatformSettings: async () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
    try {
      const response = await axios.get(`${API_BASE}/platform-settings`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch platform settings:", error);
      return [];
    }
  }
};
