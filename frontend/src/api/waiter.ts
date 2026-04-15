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

export const waiterApi = {
  getTables: async () => {
    const response = await axios.get(`${BASE_URL}/tables/`);
    return response.data;
  },

  getMenu: async () => {
    const response = await axios.get(`${BASE_URL}/menu/categories`);
    return response.data;
  },

  placeOrder: async (orderData: any) => {
    // Inject WAITER source directly, which maps to is_accepted=true automatically in the Pydantic schema if provided
    const response = await axios.post(`${BASE_URL}/orders/`, {
      ...orderData,
      source: 'WAITER',
      is_accepted: true
    });
    return response.data;
  },

  getOrdersByTable: async (tableId: string) => {
    const response = await axios.get(`${BASE_URL}/orders/table/${tableId}`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await axios.get(`${BASE_URL}/orders/waiter/active`, getHeaders());
    return response.data;
  },

  acceptOrder: async (orderId: string) => {
    const response = await axios.put(`${BASE_URL}/orders/${orderId}/accept`, {}, getHeaders());
    return response.data;
  },

  deleteOrder: async (orderId: string) => {
    const response = await axios.delete(`${BASE_URL}/orders/${orderId}`, getHeaders());
    return response.data;
  },

  updateOrderItems: async (orderId: string, items: any[]) => {
    const response = await axios.put(`${BASE_URL}/orders/${orderId}/items`, { items }, getHeaders());
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await axios.put(`${BASE_URL}/orders/${orderId}/status`, { status }, getHeaders());
    return response.data;
  },

  generateBill: async (orderId: string, paymentMethod: string = 'CASH', discount: number = 0) => {
    const response = await axios.post(`${BASE_URL}/billing/${orderId}/generate`, {
      payment_method: paymentMethod,
      discount_amount: discount
    }, getHeaders());
    return response.data;
  },

  confirmPayment: async (orderId: string, transactionId?: string) => {
    const response = await axios.put(`${BASE_URL}/billing/${orderId}/confirm`, {
      transaction_id: transactionId || null
    }, getHeaders());
    return response.data;
  },

  getUpiId: async () => {
    const response = await axios.get(`${BASE_URL}/settings/upi`, getHeaders());
    return response.data;
  }
};
