import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const customerApi = {
  getTableInfo: async (tableId: string) => {
    const response = await axios.get(`${BASE_URL}/tables/${tableId}`);
    return response.data;
  },

  getMenu: async () => {
    const response = await axios.get(`${BASE_URL}/menu/categories`);
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
  }
};
