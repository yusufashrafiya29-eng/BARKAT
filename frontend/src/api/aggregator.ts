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

export interface AggregatorOrder {
  id: string;
  restaurant_id: string;
  platform: string;
  platform_order_id: string;
  customer_name: string;
  customer_phone: string;
  items_summary: string;
  gross_amount: number;
  status: string;
  is_accepted: boolean;
  rejection_reason: string | null;
  created_at: string;
}

export const getPendingOrders = async (): Promise<AggregatorOrder[]> => {
  const response = await axios.get(`${BASE_URL}/aggregators/orders/pending`, getHeaders());
  return response.data;
};

export const getActiveOrders = async (): Promise<AggregatorOrder[]> => {
  const response = await axios.get(`${BASE_URL}/aggregators/orders/active`, getHeaders());
  return response.data;
};

export const acceptOrder = async (orderId: string): Promise<{ message: string; order_id: string }> => {
  const response = await axios.post(`${BASE_URL}/aggregators/${orderId}/accept`, {}, getHeaders());
  return response.data;
};

export const rejectOrder = async (orderId: string, reason: string): Promise<{ message: string }> => {
  const response = await axios.post(`${BASE_URL}/aggregators/${orderId}/reject`, { reason }, getHeaders());
  return response.data;
};

export interface AggregatorItemMapping {
  id: string;
  platform: string;
  platform_item_id: string;
  platform_item_name: string;
  menu_item_id: string;
}

export const getItemMappings = async (): Promise<AggregatorItemMapping[]> => {
  const response = await axios.get(`${BASE_URL}/aggregators/item-mappings`, getHeaders());
  return response.data;
};

export const createItemMapping = async (payload: { platform: string, platform_item_id: string, platform_item_name: string, menu_item_id: string }) => {
  const response = await axios.post(`${BASE_URL}/aggregators/item-mappings`, payload, getHeaders());
  return response.data;
};

export const deleteItemMapping = async (mappingId: string) => {
  const response = await axios.delete(`${BASE_URL}/aggregators/item-mappings/${mappingId}`, getHeaders());
  return response.data;
};
