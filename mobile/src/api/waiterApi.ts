import { apiClient } from './client';
import { Table, Category, Order, Bill, Reservation } from './types';

export const waiterApi = {
  // Auth is handled separately or you can put login here, but usually it's in useAuthStore
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });
    return response.data;
  },

  // Tables
  getTables: async (): Promise<Table[]> => {
    const response = await apiClient.get('/tables/');
    return response.data;
  },

  // Menu
  getMenu: async (): Promise<Category[]> => {
    const response = await apiClient.get('/menu/categories');
    return response.data;
  },

  // Orders
  placeOrder: async (orderData: any) => {
    const response = await apiClient.post('/orders/', orderData);
    return response.data;
  },

  getActiveOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/waiter/active');
    return response.data;
  },

  getOrdersByTable: async (tableId: string): Promise<Order[]> => {
    const response = await apiClient.get(`/orders/table/${tableId}`);
    return response.data;
  },

  acceptOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/accept`);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  updateOrderItems: async (orderId: string, items: any[]): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/items`, { items });
    return response.data;
  },

  deleteOrder: async (orderId: string) => {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
  },

  // Billing
  generateBill: async (orderId: string, paymentMethod: string, discountAmount: number = 0): Promise<Bill> => {
    const response = await apiClient.post(`/billing/${orderId}/generate`, {
      payment_method: paymentMethod,
      discount_amount: discountAmount
    });
    return response.data;
  },

  confirmPayment: async (orderId: string, amount: number, paymentMethod: string, transactionReference?: string): Promise<Bill> => {
    const response = await apiClient.put(`/billing/${orderId}/confirm`, {
      amount,
      payment_method: paymentMethod,
      transaction_reference: transactionReference || null
    });
    return response.data;
  },

  // Settings
  getUpiId: async (): Promise<{ upi_id: string }> => {
    const response = await apiClient.get('/settings/upi');
    return response.data;
  },

  // Reservations
  getReservations: async (): Promise<Reservation[]> => {
    const response = await apiClient.get('/reservations/');
    return response.data;
  }
};
