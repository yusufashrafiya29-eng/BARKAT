import api from './axiosConfig';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const payload = {
      email: credentials.email,
      password: credentials.password
    };
    
    // FastAPI endpoint expects JSON (LoginRequest Pydantic model)
    const response = await api.post('/auth/login', payload);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
