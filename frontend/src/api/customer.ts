import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const customerApi = {
  getTableInfo: async (tableId: string) => {
    const response = await axios.get(`${BASE_URL}/tables/${tableId}`);
    return response.data;
  },

  getMenu: async (restaurantId: string) => {
    const response = await axios.get(`${BASE_URL}/menu/categories`, {
      params: { restaurant_id: restaurantId }
    });
    return response.data;
  },

  placeOrder: async (orderData: any) => {
    const response = await axios.post(`${BASE_URL}/orders/`, {
      ...orderData,
      source: 'CUSTOMER'
    });
    return response.data;
  },

  getTableOrders: async (tableId: string) => {
    const response = await axios.get(`${BASE_URL}/orders/table/${tableId}`);
    return response.data;
  },

  notifyPayment: async (tableId: string) => {
    const response = await axios.put(`${BASE_URL}/orders/table/${tableId}/verify-payment`);
    return response.data;
  },

  createRazorpayOrder: async (tableId: string) => {
    const response = await axios.post(`${BASE_URL}/payments/create-order`, {
      table_id: tableId
    });
    return response.data;
  },

  confirmRazorpayPayment: async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
    const response = await axios.post(`${BASE_URL}/payments/confirm`, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    return response.data;
  }
};
