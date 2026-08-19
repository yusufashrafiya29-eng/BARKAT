import api from './axiosConfig';

export const waiterApi = {
  getTables: async () => {
    const response = await api.get('/tables/');
    return response.data;
  },

  getMenu: async () => {
    const response = await api.get(`/menu/categories`);
    return response.data;
  },

  placeOrder: async (orderData: any) => {
    // Inject WAITER source directly, which maps to is_accepted=true automatically
    const payload = {
      ...orderData,
      source: 'WAITER',
      is_accepted: true
    };
    const response = await api.post('/orders/', payload);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await api.get('/orders/waiter/active');
    return response.data;
  },

  getWaiterStats: async () => {
    const response = await api.get('/orders/waiter/stats');
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  generateBill: async (orderId: string, paymentMethod: string = 'CASH', discount: number = 0) => {
    const response = await api.post(`/billing/${orderId}/generate`, {
      payment_method: paymentMethod,
      discount_amount: discount
    });
    return response.data;
  },

  confirmPayment: async (orderId: string, amount: number, paymentMethod: string, transactionReference?: string) => {
    const response = await api.put(`/billing/${orderId}/confirm`, {
      amount: amount,
      payment_method: paymentMethod,
      transaction_reference: transactionReference || null
    });
    return response.data;
  }
};
