import { create } from 'zustand';
import { Table, CartItem } from '../api/types';

interface CartState {
  cart: CartItem[];
  selectedTable: Table | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  guestPax: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  tipAmount: number;

  addToCart: (item: any, modifiers: any[], qty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQty: (cartItemId: string, delta: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  toggleParcel: (cartItemId: string) => void;
  clearCart: () => void;
  setTable: (table: Table | null, pax?: number) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  
  // Form fields
  setCustomerInfo: (name: string, phone: string, address: string) => void;
  setTip: (amount: number) => void;
  
  totalAmount: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  selectedTable: null,
  orderType: 'DINE_IN',
  guestPax: 2,
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  tipAmount: 0,

  addToCart: (item, modifiers = [], qty = 1) => set((state) => {
    // Generate a unique ID based on modifiers
    const modifierSignature = modifiers.map((m: any) => m.id).sort().join('|');
    const cartItemId = `${item.id}-${modifierSignature}`;

    const existing = state.cart.find(i => i.cartItemId === cartItemId && !i.notes && !i.is_parcel);
    if (existing) {
      return {
        cart: state.cart.map(i =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      };
    }
    return {
      cart: [...state.cart, { 
        ...item, 
        quantity: qty, 
        cartItemId: cartItemId + '-' + Date.now().toString(), 
        notes: '', 
        is_parcel: false, 
        selectedModifiers: modifiers 
      }]
    };
  }),

  removeFromCart: (cartItemId) => set((state) => ({
    cart: state.cart.filter((item) => item.cartItemId !== cartItemId)
  })),

  updateQty: (cartItemId, delta) => set((state) => {
    const newCart = state.cart
      .map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0); // remove item if qty drops to 0
    return { cart: newCart };
  }),

  updateNotes: (cartItemId, notes) => set((state) => ({
    cart: state.cart.map(i => i.cartItemId === cartItemId ? { ...i, notes } : i)
  })),

  toggleParcel: (cartItemId) => set((state) => ({
    cart: state.cart.map(i => i.cartItemId === cartItemId ? { ...i, is_parcel: !i.is_parcel } : i)
  })),

  clearCart: () => set({ 
    cart: [], 
    selectedTable: null, 
    guestPax: 2,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    tipAmount: 0
  }),

  setTable: (table, pax = 2) => set({ selectedTable: table, guestPax: pax }),
  setOrderType: (type) => set({ orderType: type }),

  setCustomerInfo: (name, phone, address) => set({ customerName: name, customerPhone: phone, customerAddress: address }),
  setTip: (amount) => set({ tipAmount: amount }),

  totalAmount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => {
      let basePrice = item.price;
      let modsTotal = 0;
      item.selectedModifiers?.forEach(m => {
        // Assume price_replaces_base logic needs group info, but here we just add or replace based on what's passed
        modsTotal += m.price;
      });
      return sum + (basePrice + modsTotal) * item.quantity;
    }, 0);
  },

  itemCount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}));
