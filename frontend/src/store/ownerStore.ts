import { create } from 'zustand';
import { ownerApi } from '../api/owner';
import { waiterApi } from '../api/waiter';
import toast from 'react-hot-toast';

interface OwnerState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  loading: boolean;
  formLoading: boolean;
  setLoading: (val: boolean) => void;
  setFormLoading: (val: boolean) => void;

  analytics: any;
  historyData: any[];
  historicalOrders: any[];
  staff: any[];
  menuCategories: any[];
  tables: any[];
  inventory: any[];
  reservations: any[];
  customers: any[];
  aiInsights: any[];
  inventoryVelocity: any[];
  staffPerformance: any[];
  upiId: string;
  razorpayKeys: { razorpay_key_id: string; razorpay_key_secret: string };

  subscriptionStatus: string | null;
  subscriptionPlan: string;
  daysRemaining: number | null;

  fetchData: () => Promise<void>;
  silentlyFetchData: () => Promise<void>;
  initSubscription: () => Promise<void>;
}

export const useOwnerStore = create<OwnerState>((set, get) => ({
  activeTab: 'analytics',
  setActiveTab: (tab) => set({ activeTab: tab }),

  loading: true,
  formLoading: false,
  setLoading: (val) => set({ loading: val }),
  setFormLoading: (val) => set({ formLoading: val }),

  analytics: null,
  historyData: [],
  historicalOrders: [],
  staff: [],
  menuCategories: [],
  tables: [],
  inventory: [],
  reservations: [],
  customers: [],
  aiInsights: [],
  inventoryVelocity: [],
  staffPerformance: [],
  upiId: '',
  razorpayKeys: { razorpay_key_id: '', razorpay_key_secret: '' },

  subscriptionStatus: null,
  subscriptionPlan: 'basic',
  daysRemaining: null,

  initSubscription: async () => {
    try {
      const { authApi } = await import('../api/auth');
      const { data } = await authApi.getMe();
      if (data) {
        if (data.restaurant_gstin) localStorage.setItem('restaurantGstin', data.restaurant_gstin);
        if (data.restaurant_fssai) localStorage.setItem('restaurantFssai', data.restaurant_fssai);
        if (data.restaurant_name) localStorage.setItem('restaurantName', data.restaurant_name);
        if (data.restaurant_id) localStorage.setItem('restaurantId', data.restaurant_id);
        if (data.advance_booking_fee !== undefined) localStorage.setItem('advanceBookingFee', String(data.advance_booking_fee));
        
        const status = data.subscription_status;
        const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const subEnd = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null;
        const now = new Date();
        const endDate = status === 'active' ? subEnd : trialEnd;
        let diff = null;
        if (endDate) {
          diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        set({
          subscriptionStatus: status || 'trial',
          subscriptionPlan: data.subscription_plan || 'basic',
          daysRemaining: diff !== null ? Math.max(0, diff) : null,
        });
        localStorage.setItem('subscriptionPlan', data.subscription_plan || 'basic');
      }
    } catch (e) {
      console.error("Failed to init subscription", e);
    }
  },

  fetchData: async () => {
    const { activeTab } = get();
    set({ loading: true });
    try {
      switch (activeTab) {
        case 'analytics':
          const [analyticRes, historyRes, invVelRes, staffPerfRes, aiRes] = await Promise.all([
            ownerApi.getDailyAnalytics(),
            ownerApi.getHistoryAnalytics(),
            ownerApi.getInventoryVelocity(),
            ownerApi.getStaffPerformance(),
            ownerApi.getAiInsights()
          ]);
          set({ 
            analytics: analyticRes, 
            historyData: historyRes,
            inventoryVelocity: invVelRes,
            staffPerformance: staffPerfRes,
            aiInsights: aiRes
          });
          break;
        case 'orders':
          const ordersRes = await ownerApi.getOwnerOrders();
          set({ historicalOrders: ordersRes });
          break;
        case 'staff':
          const staffRes = await ownerApi.getStaff();
          set({ staff: staffRes });
          break;
        case 'menu':
          const menuRes = await waiterApi.getMenu();
          set({ menuCategories: menuRes });
          break;
        case 'tables':
          const tableRes = await waiterApi.getTables();
          set({ tables: tableRes });
          break;
        case 'inventory':
          const invRes = await ownerApi.getInventory();
          set({ inventory: invRes });
          break;
        case 'reports':
          break;
        case 'reservations':
          const [resvRes2, tabRes2] = await Promise.all([ownerApi.getReservations(), waiterApi.getTables()]);
          set({ reservations: resvRes2, tables: tabRes2 });
          break;
        case 'crm':
          const crmRes = await ownerApi.getCustomers();
          set({ customers: crmRes });
          break;
        case 'settings':
          const [payResData, rzpResData] = await Promise.all([
            ownerApi.getUpiId(),
            ownerApi.getRazorpayKeys()
          ]);
          set({ upiId: payResData.upi_id || '', razorpayKeys: rzpResData });
          break;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to fetch data`);
    } finally {
      set({ loading: false });
    }
  },

  silentlyFetchData: async () => {
    const { activeTab } = get();
    try {
      switch (activeTab) {
        case 'analytics':
          const [silAnalyticRes, silHistoryRes, silInvVelRes, silStaffPerfRes, silAiRes] = await Promise.all([
            ownerApi.getDailyAnalytics(),
            ownerApi.getHistoryAnalytics(),
            ownerApi.getInventoryVelocity(),
            ownerApi.getStaffPerformance(),
            ownerApi.getAiInsights()
          ]);
          set({ 
            analytics: silAnalyticRes, 
            historyData: silHistoryRes,
            inventoryVelocity: silInvVelRes,
            staffPerformance: silStaffPerfRes,
            aiInsights: silAiRes
          });
          break;
        case 'orders':
          const ordersResSil = await ownerApi.getOwnerOrders();
          set({ historicalOrders: ordersResSil });
          break;
        case 'staff':
          const staffRes = await ownerApi.getStaff();
          set({ staff: staffRes });
          break;
        case 'menu':
          const menuRes = await waiterApi.getMenu();
          set({ menuCategories: menuRes });
          break;
        case 'tables':
          const tableRes = await waiterApi.getTables();
          set({ tables: tableRes });
          break;
        case 'inventory':
          const invRes = await ownerApi.getInventory();
          set({ inventory: invRes });
          break;
        case 'reports':
          break;
        case 'reservations':
          const [resvRes, tabRes] = await Promise.all([ownerApi.getReservations(), waiterApi.getTables()]);
          set({ reservations: resvRes, tables: tabRes });
          break;
        case 'crm':
          const crmResSil = await ownerApi.getCustomers();
          set({ customers: crmResSil });
          break;
        case 'settings':
          const [payRes, rzpRes] = await Promise.all([
            ownerApi.getUpiId(),
            ownerApi.getRazorpayKeys()
          ]);
          set({ upiId: payRes.upi_id || '', razorpayKeys: rzpRes });
          break;
      }
    } catch (err) {
      // silent poll fail
    }
  }
}));
