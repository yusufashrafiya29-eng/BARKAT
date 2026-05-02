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

export const ownerApi = {
  // Staff
  getStaff: async () => {
    const response = await axios.get(`${BASE_URL}/users/staff`, getHeaders());
    return response.data;
  },
  
  verifyStaff: async (userId: string) => {
    const response = await axios.put(`${BASE_URL}/users/staff/${userId}/verify`, {}, getHeaders());
    return response.data;
  },
  
  deleteStaff: async (userId: string) => {
    const response = await axios.delete(`${BASE_URL}/users/staff/${userId}`, getHeaders());
    return response.data;
  },

  updateStaffRole: async (userId: string, role: string) => {
    const response = await axios.put(`${BASE_URL}/users/staff/${userId}/role`, { role }, getHeaders());
    return response.data;
  },

  // Menu Modifications
  addCategory: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/menu/categories`, payload, getHeaders());
    return response.data;
  },
  
  addMenuItem: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/menu/items`, payload, getHeaders());
    return response.data;
  },

  toggleMenuItemAvailability: async (itemId: string, is_available: boolean) => {
    const response = await axios.put(`${BASE_URL}/menu/items/${itemId}`, { is_available }, getHeaders());
    return response.data;
  },

  updateMenuItemRecipe: async (itemId: string, payload: any) => {
    const response = await axios.post(`${BASE_URL}/menu/items/${itemId}/recipe`, payload, getHeaders());
    return response.data;
  },

  deleteMenuItem: async (itemId: string) => {
    const response = await axios.delete(`${BASE_URL}/menu/items/${itemId}`, getHeaders());
    return response.data;
  },
  
  // Tables
  addTable: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/tables/`, payload, getHeaders());
    return response.data;
  },

  deleteTable: async (tableId: string) => {
    const response = await axios.delete(`${BASE_URL}/tables/${tableId}`, getHeaders());
    return response.data;
  },
  
  // Staff Native Create
  createVerifiedStaff: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/users/staff`, payload, getHeaders());
    return response.data;
  },

  // Inventory
  getInventory: async () => {
    const response = await axios.get(`${BASE_URL}/inventory/`, getHeaders());
    return response.data;
  },

  addInventoryItem: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/inventory/`, payload, getHeaders());
    return response.data;
  },

  // Analytics
  getDailyAnalytics: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/today`, getHeaders());
    return response.data;
  },

  getHistoryAnalytics: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/history`, getHeaders());
    return response.data;
  },

  getInventoryVelocity: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/inventory-velocity`, getHeaders());
    return response.data;
  },

  getStaffPerformance: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/staff-performance`, getHeaders());
    return response.data;
  },

  // Orders
  getOwnerOrders: async () => {
    const response = await axios.get(`${BASE_URL}/orders/history/owner`, getHeaders());
    return response.data;
  },

  // Settings
  getUpiId: async () => {
    const response = await axios.get(`${BASE_URL}/settings/upi`, getHeaders());
    return response.data;
  },

  updateUpiId: async (upi_id: string) => {
    const response = await axios.post(`${BASE_URL}/settings/upi`, { upi_id }, getHeaders());
    return response.data;
  },

  getRazorpayKeys: async () => {
    const response = await axios.get(`${BASE_URL}/settings/razorpay`, getHeaders());
    return response.data;
  },

  updateRazorpayKeys: async (keys: { razorpay_key_id: string, razorpay_key_secret: string }) => {
    const response = await axios.post(`${BASE_URL}/settings/razorpay`, keys, getHeaders());
    return response.data;
  },

  // Profile & Security
  changePassword: async (payload: any) => {
    const response = await axios.put(`${BASE_URL}/users/me/password`, payload, getHeaders());
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await axios.put(`${BASE_URL}/settings/restaurant-profile`, formData, {
      headers: {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  uploadMenuItemImage: async (itemId: string, formData: FormData) => {
    const response = await axios.post(`${BASE_URL}/menu/items/${itemId}/upload-image`, formData, {
      headers: {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Reservations
  getReservations: async () => {
    const response = await axios.get(`${BASE_URL}/reservations/`, getHeaders());
    return response.data;
  },

  addManualReservation: async (payload: any) => {
    const response = await axios.post(`${BASE_URL}/reservations/manual`, payload, getHeaders());
    return response.data;
  },

  updateReservationStatus: async (resId: string, status: string, tableId?: string) => {
    const response = await axios.put(`${BASE_URL}/reservations/${resId}/status`, { status, table_id: tableId }, getHeaders());
    return response.data;
  }
};
