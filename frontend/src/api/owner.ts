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

export const ownerApi = {
  // Staff
  getStaff: async () => {
    const response = await axios.get(`${BASE_URL}/users/staff`, getHeaders());
    return response.data;
  },
  
  verifyStaff: async (userId: string) => {
    const response = await axios.put(`${BASE_URL}/users/staff/${userId}/verify`, {}, getHeaders());
    return response.data;
  },
  
  deleteStaff: async (userId: string) => {
    const response = await axios.delete(`${BASE_URL}/users/staff/${userId}`, getHeaders());
    return response.data;
  },

  // Menu Modifications
  addCategory: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/menu/categories`, payload, getHeaders());
    return response.data;
  },
  
  addMenuItem: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/menu/items`, payload, getHeaders());
    return response.data;
  },

  toggleMenuItemAvailability: async (itemId: string, is_available: boolean) => {
    const response = await axios.put(`${BASE_URL}/menu/items/${itemId}`, { is_available }, getHeaders());
    return response.data;
  },
  
  // Tables
  addTable: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/tables/`, payload, getHeaders());
    return response.data;
  },

  deleteTable: async (tableId: string) => {
    const response = await axios.delete(`${BASE_URL}/tables/${tableId}`, getHeaders());
    return response.data;
  },
  
  // Staff Native Create
  createVerifiedStaff: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/users/staff`, payload, getHeaders());
    return response.data;
  },

  // Inventory
  getInventory: async () => {
    const response = await axios.get(`${BASE_URL}/inventory/`, getHeaders());
    return response.data;
  },

  addInventoryItem: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/inventory/`, payload, getHeaders());
    return response.data;
  },

  // Analytics
  getDailyAnalytics: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/today`, getHeaders());
    return response.data;
  },

  // Settings
  getUpiId: async () => {
    const response = await axios.get(`${BASE_URL}/settings/upi`, getHeaders());
    return response.data;
  },

  updateUpiId: async (upi_id: string) => {
    const response = await axios.post(`${BASE_URL}/settings/upi`, { upi_id }, getHeaders());
    return response.data;
  }
};
