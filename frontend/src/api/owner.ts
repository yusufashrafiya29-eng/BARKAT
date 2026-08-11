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

  updateStaffAccess: async (userId: string, allowed_categories: string[]) => {
    const response = await axios.put(`${BASE_URL}/users/staff/${userId}/access`, { allowed_categories }, getHeaders());
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

  updateMenuItem: async (itemId: string, payload: any) => {
    const response = await axios.put(`${BASE_URL}/menu/items/${itemId}`, payload, getHeaders());
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

  updateTablePositions: async (positions: { id: string; position_x: number; position_y: number }[]) => {
    const response = await axios.put(`${BASE_URL}/tables/positions`, positions, getHeaders());
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

  updateInventoryItem: async (itemId: string, payload: any) => {
    const response = await axios.put(`${BASE_URL}/inventory/${itemId}`, payload, getHeaders());
    return response.data;
  },

  deleteInventoryItem: async (itemId: string) => {
    const response = await axios.delete(`${BASE_URL}/inventory/${itemId}`, getHeaders());
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

  // CRM & Loyalty
  getCustomers: async () => {
    const response = await axios.get(`${BASE_URL}/crm/`, getHeaders());
    return response.data;
  },

  getAiInsights: async () => {
    const response = await axios.get(`${BASE_URL}/analytics/ai-insights`, getHeaders());
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

  createSubscriptionOrder: async (plan_name: string, is_yearly: boolean) => {
    const response = await axios.post(`${BASE_URL}/subscriptions/create-order`, { plan_name, is_yearly }, getHeaders());
    return response.data;
  },

  verifySubscriptionPayment: async (data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) => {
    const response = await axios.post(`${BASE_URL}/subscriptions/verify`, data, getHeaders());
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

  uploadMenuItemImage: async (itemId: string, formData: FormData, slot: string = "main") => {
    const response = await axios.post(`${BASE_URL}/menu/items/${itemId}/upload-image?slot=${slot}`, formData, {
      headers: {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteMenuItemImage: async (itemId: string, slot: string) => {
    const response = await axios.delete(`${BASE_URL}/menu/items/${itemId}/image?slot=${slot}`, getHeaders());
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
  },

  // Support Tickets
  getTickets: async () => {
    const response = await axios.get(`${BASE_URL}/users/tickets`, getHeaders());
    return response.data;
  },

  createTicket: async (payload: { subject: string, description: string }) => {
    const response = await axios.post(`${BASE_URL}/users/tickets`, payload, getHeaders());
    return response.data;
  },

  // 3D AR Methods
  generate3DModel: async (itemId: string, payload: any = {}) => {
    const response = await axios.post(`${BASE_URL}/menu/items/${itemId}/generate-3d`, payload, getHeaders());
    return response.data;
  },

  check3DModelStatus: async (itemId: string) => {
    const response = await axios.get(`${BASE_URL}/menu/items/${itemId}/3d-status`, getHeaders());
    return response.data;
  },

  delete3DModel: async (itemId: string) => {
    const response = await axios.delete(`${BASE_URL}/menu/items/${itemId}/3d`, getHeaders());
    return response.data;
  },

  // Enterprise DB Methods (Expenses, Discounts, Commissary, Aggregators)
  getExpenses: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/expenses`, getHeaders());
    return response.data;
  },
  createExpense: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/expenses`, data, getHeaders());
    return response.data;
  },
  deleteExpense: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/enterprise/expenses/${id}`, getHeaders());
    return response.data;
  },

  getCoupons: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/coupons`, getHeaders());
    return response.data;
  },
  createCoupon: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/coupons`, data, getHeaders());
    return response.data;
  },

  getHappyHours: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/happy-hours`, getHeaders());
    return response.data;
  },
  createHappyHour: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/happy-hours`, data, getHeaders());
    return response.data;
  },

  getBogoRules: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/bogo`, getHeaders());
    return response.data;
  },
  createBogoRule: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/bogo`, data, getHeaders());
    return response.data;
  },

  getBranches: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/branches`, getHeaders());
    return response.data;
  },
  createBranch: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/branches`, data, getHeaders());
    return response.data;
  },
  deleteBranch: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/enterprise/branches/${id}`, getHeaders());
    return response.data;
  },

  getCentralStock: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/stock`, getHeaders());
    return response.data;
  },
  createCentralStock: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/stock`, data, getHeaders());
    return response.data;
  },
  deleteCentralStock: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/enterprise/stock/${id}`, getHeaders());
    return response.data;
  },

  getTransfers: async () => {
    const response = await axios.get(`${BASE_URL}/enterprise/transfers`, getHeaders());
    return response.data;
  },
  createTransfer: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/enterprise/transfers`, data, getHeaders());
    return response.data;
  },
  markTransferReceived: async (id: string) => {
    const response = await axios.put(`${BASE_URL}/enterprise/transfers/${id}/receive`, {}, getHeaders());
    return response.data;
  },

  // --- Integrations ---
  getIntegrations: async () => {
    const res = await axios.get(`${BASE_URL}/settings/integrations`, getHeaders());
    return res.data;
  },
  updateIntegrations: async (data: any) => {
    const res = await axios.post(`${BASE_URL}/settings/integrations`, data, getHeaders());
    return res.data;
  },

  // --- Real Aggregator Webhooks API ---
  getAggregators: async () => {
    const res = await axios.get(`${BASE_URL}/aggregators/orders`, getHeaders());
    return res.data;
  },
  createAggregatorOrder: async (data: any) => {
    const res = await axios.post(`${BASE_URL}/aggregators/webhooks/simulate`, data, getHeaders());
    return res.data;
  },
  updateAggregatorOrderStatus: async (id: string, status: string) => {
    const res = await axios.put(`${BASE_URL}/aggregators/orders/${id}/status`, { status }, getHeaders());
    return res.data;
  },
  deleteAggregatorOrder: async (id: string) => {
    const res = await axios.put(`${BASE_URL}/aggregators/orders/${id}/status`, { status: 'DELIVERED' }, getHeaders());
    return res.data;
  }
};
