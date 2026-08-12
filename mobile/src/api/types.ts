export interface Table {
  id: string;
  table_number: number;
  restaurant_id: string;
  position_x: number;
  position_y: number;
  capacity: number;
  category: string;
  is_active: boolean;
  last_order_at?: string;
  status?: string; // Derived status for UI
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id: string;
  is_veg: boolean;
  is_available: boolean;
  image_url?: string;
  modifier_groups?: ModifierGroup[];
}

export interface Category {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  is_required: boolean;
  max_selections?: number;
  price_replaces_base: boolean;
  modifiers: Modifier[];
}

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  notes: string;
  is_parcel: boolean;
  selectedModifiers: { modifier_id: string; price: number }[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order_time: number;
  subtotal: number;
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY';
  is_parcel: boolean;
  menu_item?: { name: string; price: number };
  modifiers?: { id: string; modifier_id: string; price_at_order_time: number; modifier: { name: string } }[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  source: 'WAITER' | 'CUSTOMER';
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'VERIFYING';
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  tip_amount: number;
  created_at: string;
  items?: OrderItem[];
  is_accepted?: boolean;
  customer_name?: string;
  customer_phone?: string;
  guests_count?: number;
}

export interface Bill {
  id: string;
  order_id: string;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  delivery_charge: number;
  container_charge: number;
  total_amount: number;
  status: string;
}

export interface Reservation {
  id: string;
  table_id: string;
  customer_name: string;
  reservation_time: string;
  guests_count: number;
  status: string;
}
