import { create } from 'zustand';
import { Order, Reservation } from '../api/types';
import { waiterApi } from '../api/waiterApi';

interface OrderState {
  activeOrders: Order[];
  reservations: Reservation[];
  lastFetched: number | null;
  isRefreshing: boolean;
  
  fetchOrders: () => Promise<void>;
  acceptOrder: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrders: [],
  reservations: [],
  lastFetched: null,
  isRefreshing: false,

  fetchOrders: async () => {
    try {
      set({ isRefreshing: true });
      const [ordersData, resData] = await Promise.all([
        waiterApi.getActiveOrders(),
        waiterApi.getReservations()
      ]);
      set({ 
        activeOrders: ordersData, 
        reservations: resData,
        lastFetched: Date.now()
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      set({ isRefreshing: false });
    }
  },

  acceptOrder: async (id: string) => {
    await waiterApi.acceptOrder(id);
    await get().fetchOrders(); // refresh
  },

  updateStatus: async (id: string, status: string) => {
    await waiterApi.updateOrderStatus(id, status);
    await get().fetchOrders(); // refresh
  },

  deleteOrder: async (id: string) => {
    await waiterApi.deleteOrder(id);
    await get().fetchOrders(); // refresh
  }
}));
