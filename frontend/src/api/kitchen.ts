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

export const kitchenApi = {
  getActiveOrders: async () => {
    const response = await axios.get(`${BASE_URL}/orders/kitchen/active`, getHeaders());
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await axios.put(`${BASE_URL}/orders/${orderId}/status`, { status }, getHeaders());
    return response.data;
  }
};
