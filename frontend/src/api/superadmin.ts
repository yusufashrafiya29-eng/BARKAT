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

  getFinancials: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/financials`, getHeaders());
    return response.data;
  },

  getAnnouncements: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/announcements`, getHeaders());
    return response.data;
  },

  createAnnouncement: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/superadmin/announcements`, data, getHeaders());
    return response.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/superadmin/announcements/${id}`, getHeaders());
    return response.data;
  },

  getPlatformSettings: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/platform-settings`, getHeaders());
    return response.data;
  },

  updatePlatformSettings: async (data: {key: string, value: string}[]) => {
    const response = await axios.put(`${BASE_URL}/superadmin/platform-settings`, data, getHeaders());
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/users`, getHeaders());
    return response.data;
  },

  getTickets: async () => {
    const response = await axios.get(`${BASE_URL}/superadmin/tickets`, getHeaders());
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, status: string, notes?: string) => {
    const response = await axios.put(`${BASE_URL}/superadmin/tickets/${ticketId}`, { status, resolution_notes: notes }, getHeaders());
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
  },

  impersonateRestaurant: async (id: string) => {
    const response = await axios.post(`${BASE_URL}/superadmin/restaurants/${id}/impersonate`, {}, getHeaders());
    return response.data;
  },

  impersonateUser: async (id: string) => {
    const response = await axios.post(`${BASE_URL}/superadmin/users/${id}/impersonate`, {}, getHeaders());
    return response.data;
  }
};
