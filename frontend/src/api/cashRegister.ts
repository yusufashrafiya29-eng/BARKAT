import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
});

export const cashApi = {
  getCurrentShift: async () => {
    const res = await axios.get(`${BASE_URL}/cash/shift/current`, getHeaders());
    return res.data;
  },

  openShift: async (opening_balance: number) => {
    const res = await axios.post(`${BASE_URL}/cash/shift/open`, { opening_balance }, getHeaders());
    return res.data;
  },

  closeShift: async (shift_id: string, closing_balance: number, notes?: string) => {
    const res = await axios.put(`${BASE_URL}/cash/shift/${shift_id}/close`, { closing_balance, notes }, getHeaders());
    return res.data;
  },

  addTransaction: async (shift_id: string, type: 'CASH_IN' | 'CASH_OUT', amount: number, description?: string) => {
    const res = await axios.post(`${BASE_URL}/cash/shift/${shift_id}/transaction`, { type, amount, description }, getHeaders());
    return res.data;
  },

  getHistory: async () => {
    const res = await axios.get(`${BASE_URL}/cash/shift/history`, getHeaders());
    return res.data;
  },
};
