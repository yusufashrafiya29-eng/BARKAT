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
    const response = await axios.get(`${BASE_URL}/tables/`, getHeaders());
    return response.data;
  },

  getMenu: async () => {
    // We pass restaurant_id dynamically as query param for customer, but for waiter, they have a token.
    // However, the backend expects restaurant_id as query for public, or it can be derived. 
    // BUT wait! In our backend change, we made restaurant_id optional query? 
    // Wait, let's just pass token and the backend will not need restaurant_id if it's not provided? 
    // No, I explicitly raised 400 if it's not provided in `api/api_v1/menu.py` inside get_categories.
    // Let me check my code. I wrote:
    // `def get_categories(restaurant_id: UUID = None, db: Session = Depends(get_db)): if not restaurant_id: raise HTTPException(400)`
    // So the frontend MUST pass restaurant_id? Wait, waiters don't know the restaurant_id easily!
    // But they have a token. Wait, if they have a token, we could inject it if we change `get_categories` to use `Depends(get_current_restaurant)` optionally.
    // Or I can change backend to handle it.
    // Let me first add headers. `axios.get(..., getHeaders())`. I will need to fix backend `menu.py` slightly to allow waiters to use token.
    const response = await axios.get(`${BASE_URL}/menu/categories`, getHeaders());
    return response.data;
  },

  placeOrder: async (orderData: any) => {
    // Inject WAITER source directly, which maps to is_accepted=true automatically in the Pydantic schema if provided
    const response = await axios.post(`${BASE_URL}/orders/`, {
      ...orderData,
      source: 'WAITER',
      is_accepted: true
    }, getHeaders());
    return response.data;
  },

  getOrdersByTable: async (tableId: string) => {
    const response = await axios.get(`${BASE_URL}/orders/table/${tableId}`, getHeaders());
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
