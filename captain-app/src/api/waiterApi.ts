import api from './axios';

export const waiterApi = {
  getTables: async () => {
    const response = await api.get('/tables/');
    return response.data;
  },

  getMenu: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  placeOrder: async (orderData: any) => {
    const response = await api.post('/orders/', {
      ...orderData,
      source: 'WAITER',
      is_accepted: true
    });
    return response.data;
  },

  getOrdersByTable: async (tableId: string) => {
    const response = await api.get(`/orders/table/${tableId}`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await api.get('/orders/waiter/active');
    return response.data;
  },

  acceptOrder: async (orderId: string) => {
    const response = await api.put(`/orders/${orderId}/accept`, {});
    return response.data;
  },

  deleteOrder: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderItems: async (orderId: string, items: any[]) => {
    const response = await api.put(`/orders/${orderId}/items`, { items });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  updatePaymentStatus: async (orderId: string, payment_status: string) => {
    const response = await api.put(`/orders/${orderId}/payment-status`, { payment_status });
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
  },

  getReservations: async () => {
    const response = await api.get('/reservations/');
    return response.data;
  },

  getUpiId: async () => {
    try {
      const response = await api.get('/settings/platform-config');
      const configs = response.data || [];
      const upiConfig = configs.find((c: any) => c.key === 'platform_upi_id');
      return { upi_id: upiConfig?.value || null };
    } catch {
      return { upi_id: null };
    }
  }
};
