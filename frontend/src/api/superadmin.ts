import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const superadminApi = {
  getStats: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/stats`, getHeaders());
    return response.data;
  },

  getRestaurants: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/restaurants`, getHeaders());
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/users`, getHeaders());
    return response.data;
  },

  approveRestaurant: async (id: string) => {
    const response = await axios.put(`${BASE_URL}/superadmin/restaurants/${id}/approve`, {}, getHeaders());
    return response.data;
  },

  updateSubscription: async (id: string, plan: string, status: string, expiryDate?: string) => {
    const payload: any = { plan, status };
    if (expiryDate) {
      payload.expiry_date = expiryDate;
    }
    const response = await axios.put(`${BASE_URL}/superadmin/restaurants/${id}/subscription`, payload, getHeaders());
    return response.data;
  },

  deleteRestaurant: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/superadmin/restaurants/${id}`, getHeaders());
    return response.data;
  }
};
