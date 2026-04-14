import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/v1/auth';

export const authApi = {
  signupOwner: async (data: any) => {
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
  }
};
