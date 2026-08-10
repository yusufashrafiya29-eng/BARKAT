import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Plus, Minus,
  Search, Trash2, Loader2,
  LayoutGrid, Clock,
  RefreshCcw, AlertCircle, Edit2,
  ShoppingCart, CheckCircle2, X,
  Wallet, CreditCard, Smartphone,
  Send, Zap, ChefHat, Shield, Banknote, Printer, ShoppingBag
} from 'lucide-react';
import { waiterApi } from '../api/waiter';
import { cashApi } from '../api/cashRegister';
import toast from 'react-hot-toast';
import ReceiptPrinter from '../components/ReceiptPrinter';
import CustomizationModal from '../components/CustomizationModal';
import LiveTelemetryBanner from '../components/LiveTelemetryBanner';
import DishARViewerModal from '../components/DishARViewerModal';

/* ── Types ──────────────────────────────────────────────────── */
interface MenuItem { id: string; name: string; price: number; description?: string; category_id: string; is_veg: boolean; is_available: boolean; image_url?: string; modifier_groups?: any[]; }
interface Category { id: string; name: string; menu_items: MenuItem[]; }
interface Table { id: string; table_number: number; capacity: number; category: string; status?: 'Free' | 'Occupied' | 'Ordering'; }
interface CartItem extends MenuItem { cartItemId: string; quantity: number; notes: string; is_parcel?: boolean; modifiers?: any[]; }
interface OrderItem { id: string; menu_item_id: string; quantity: number; price_at_order_time: number; subtotal?: number; notes?: string; is_parcel?: boolean; modifiers?: any[]; menu_item?: { name: string; price: number }; }
interface Order { id: string; table_id: string | null; order_type?: string; status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED'; payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'VERIFYING'; total_amount: number; created_at: string; items?: OrderItem[]; source?: 'CUSTOMER' | 'WAITER'; is_accepted?: boolean; razorpay_order_id?: string | null; }

/* ── Status helpers ──────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PENDING: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', dot: '#f59e0b' },
  ACCEPTED: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1' },
  PREPARING: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff', dot: '#a855f7' },
  READY: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7', dot: '#10b981' },
  SERVED: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  CANCELLED: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e' },
};

/* ── Table Status Config (5 states) ─────────────────────────── */
const TABLE_STATUS_CONFIG = {
  free:     { color: '#94a3b8', borderColor: '#e2e8f0', bgGrad: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', dotColor: '#cbd5e1', label: 'Free' },
  customer: { color: '#4338ca', borderColor: '#a5b4fc', bgGrad: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', dotColor: '#6366f1', label: '⚡ New Order' },
  running:  { color: '#b45309', borderColor: '#fcd34d', bgGrad: 'linear-gradient(135deg,#fffbeb,#fef3c7)', dotColor: '#f59e0b', label: '🔥 KOT Running' },
  printed:  { color: '#065f46', borderColor: '#6ee7b7', bgGrad: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', dotColor: '#10b981', label: '🖨️ Bill Printed' },
  reserved: { color: '#d97706', borderColor: '#fde68a', bgGrad: 'linear-gradient(135deg,#fffbeb,#fef9c3)', dotColor: '#fbbf24', label: 'Reserved' },
} as const;
type TStatusKey = keyof typeof TABLE_STATUS_CONFIG;

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'tables' | 'order' | 'status'>('tables');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedItemForAR, setSelectedItemForAR] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [billDetails, setBillDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiId, setUpiId] = useState<string | null>(null);
  const [shiftOpen, setShiftOpen] = useState<boolean | null>(null); // null = loading
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const subscriptionPlan = localStorage.getItem('subscriptionPlan') || 'basic';

  /* ── Sprint 1: New billing states ─────────────────────────── */
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [containerCharge, setContainerCharge] = useState(0);
  const [customerPaidAmount, setCustomerPaidAmount] = useState('');

  /* ── Sprint 1: Reason Modal states ────────────────────────── */
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<{ type: 'delete' | 'reject', id: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('Customer Changed Mind');
  const [customReason, setCustomReason] = useState<string>('');
  const [isProcessingReason, setIsProcessingReason] = useState(false);

  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 100); // Wait for React to render the invisible component
  };

  /* ── Data fetching ─────────────────────────────────────────── */
  const fetchOrdersOnly = async () => {
    try {
      const [ordersData, resData] = await Promise.all([waiterApi.getAllOrders(), waiterApi.getReservations()]);
      setActiveOrders(ordersData);
      setReservations(resData || []);
      setTables(prev => prev.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      })));
    } catch { }
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchOrdersOnly, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tablesData, menuData, ordersData, upiData, resData] = await Promise.all([
        waiterApi.getTables(), waiterApi.getMenu(), waiterApi.getAllOrders(), waiterApi.getUpiId(), waiterApi.getReservations()
      ]);
      setTables(tablesData.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      })));
      setCategories(menuData);
      setActiveOrders(ordersData);
      setReservations(resData || []);
      if (upiData?.upi_id) setUpiId(upiData.upi_id);
      // Check if shift is open (read-only for waiter)
      try {
        await cashApi.getCurrentShift();
        setShiftOpen(true);
      } catch { setShiftOpen(false); }
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
      toast.error(e.response?.data?.detail || e.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  };

  /* ── Cart actions ───────────────────────────────────────────── */
  const handleAddToCartClick = (item: MenuItem) => {
    if (!item.is_available) return;
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setCustomizingItem(item);
    } else {
      addToCart(item, [], 1, '');
    }
  };

  const addToCart = (item: MenuItem, modifiers: any[] = [], quantity: number = 1, notes: string = '') => {
    const modifierSignature = modifiers.map(m => m.id).sort().join('|');
    const cartItemId = `${item.id}-${modifierSignature}`;
    
    setCart(prev => {
      const ex = prev.find(i => i.cartItemId === cartItemId);
      if (ex) return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { ...item, cartItemId, quantity, notes, modifiers }];
    });
    setCustomizingItem(null);
    toast.success(`${item.name} added`, { position: 'top-center' });
  };
  const updateQuantity = (cartItemId: string, delta: number) =>
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  const updateNotes = (cartItemId: string, notes: string) =>
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, notes } : i));
  const totalAmount = cart.reduce((s, i) => {
    let basePrice = i.price;
    let modsTotal = 0;
    i.modifiers?.forEach(m => {
      const group = i.modifier_groups?.find(g => g.modifiers?.some((gm: any) => gm.id === m.id));
      if (group?.price_replaces_base) {
        basePrice = m.price;
      } else {
        modsTotal += m.price;
      }
    });
    return s + (basePrice + modsTotal) * i.quantity;
  }, 0);

  /* ── Order actions ──────────────────────────────────────────── */
  const placeOrder = async () => {
    if ((!selectedTable && orderType !== 'TAKEAWAY') || cart.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      if (editingOrderId) {
        await waiterApi.updateOrderItems(editingOrderId, cart.map(i => ({ 
          menu_item_id: i.id, quantity: i.quantity, notes: i.notes, is_parcel: i.is_parcel, modifiers: i.modifiers?.map(m => ({ modifier_id: m.id })) || [] 
        })));
        toast.success('Order updated!');
        setEditingOrderId(null);
      } else {
        await waiterApi.placeOrder({
          table_id: selectedTable?.id || null,
          order_type: orderType,
          items: cart.map(i => ({ 
            menu_item_id: i.id, quantity: i.quantity, notes: i.notes, is_parcel: i.is_parcel, modifiers: i.modifiers?.map(m => ({ modifier_id: m.id })) || [] 
          })),
          customer_name: customerName || undefined,
          customer_phone: customerPhone ? `+${customerPhone.replace(/\D/g, '')}` : undefined
        });
        toast.success('🚀 Ticket sent to kitchen!');
        setCustomerName('');
        setCustomerPhone('');
      }
      setView('status');
      fetchInitialData();
    } catch (e: any) {
      const d = e.response?.data?.detail;
      toast.error(Array.isArray(d) ? d[0]?.msg : d || 'Failed to process order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleDeleteOrder = (id: string) => { 
    setReasonAction({ type: 'delete', id });
    setSelectedReason('Customer Changed Mind');
    setCustomReason('');
    setReasonModalOpen(true); 
  };
  const handleEditOrder = (order: Order) => { setEditingOrderId(order.id); setCart(order.items?.map(i => ({ id: i.menu_item_id, name: i.menu_item?.name || 'Item', price: i.price_at_order_time, quantity: i.quantity, notes: i.notes || '', is_parcel: !i.is_parcel, category_id: '', is_veg: false, is_available: true, cartItemId: i.id, modifiers: i.modifiers || [] })) || []); toast('✏️ Editing order'); };
  
  const handleServeOrder = async (id: string) => { if (processingOrders.has(id)) return; setProcessingOrders(prev => new Set(prev).add(id)); try { await waiterApi.updateOrderStatus(id, 'SERVED'); toast.success('Marked served!'); fetchOrdersOnly(); } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setProcessingOrders(prev => { const n = new Set(prev); n.delete(id); return n; }); } };
  const handleAcceptOrder = async (id: string) => { if (processingOrders.has(id)) return; setProcessingOrders(prev => new Set(prev).add(id)); try { await waiterApi.acceptOrder(id); toast.success('Accepted — sent to kitchen'); fetchInitialData(); } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setProcessingOrders(prev => { const n = new Set(prev); n.delete(id); return n; }); } };
  const handleRejectOrder = (id: string) => { 
    if (processingOrders.has(id)) return; 
    setReasonAction({ type: 'reject', id });
    setSelectedReason('Out of Stock');
    setCustomReason('');
    setReasonModalOpen(true);
  };

  const executeReasonAction = async () => {
    if (!reasonAction || isProcessingReason) return;
    setIsProcessingReason(true);
    const finalReason = selectedReason === 'Other' ? customReason || 'No reason specified' : selectedReason;
    try {
      if (reasonAction.type === 'delete') {
        await waiterApi.deleteOrder(reasonAction.id);
        toast.success(`🗑️ Order deleted (${finalReason})`);
      } else {
        setProcessingOrders(prev => new Set(prev).add(reasonAction.id));
        await waiterApi.updateOrderStatus(reasonAction.id, 'CANCELLED');
        toast.success(`❌ Order cancelled (${finalReason})`);
        setProcessingOrders(prev => { const n = new Set(prev); n.delete(reasonAction.id); return n; });
      }
      setReasonModalOpen(false);
      setReasonAction(null);
      fetchInitialData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Action failed');
    } finally {
      setIsProcessingReason(false);
    }
  };
  const handleDirectPaymentConfirm = async (id: string) => { if (processingOrders.has(id)) return; setProcessingOrders(prev => new Set(prev).add(id)); try { await waiterApi.updatePaymentStatus(id, 'PAID'); toast.success('Payment settled directly'); fetchOrdersOnly(); } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setProcessingOrders(prev => { const n = new Set(prev); n.delete(id); return n; }); } };
  const handleStartCheckout = async (order: Order) => { if (processingOrders.has(order.id)) return; setProcessingOrders(prev => new Set(prev).add(order.id)); try { const bill = await waiterApi.generateBill(order.id, 'CASH', 0); setCheckoutOrder(order); setBillDetails(bill); setPaymentMethod('CASH'); setCheckoutStep(1); setDiscountAmount(0); setDiscountType('percent'); setDeliveryCharge(0); setContainerCharge(0); setCustomerPaidAmount(''); setCheckoutModalOpen(true); } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setProcessingOrders(prev => { const n = new Set(prev); n.delete(order.id); return n; }); } };
  const handleConfirmPayment = async () => {
    if (!checkoutOrder) return;
    setIsProcessingPayment(true);
    try {
      const amountToPay = billDetails.total_amount - (billDetails.amount_paid || 0);
      await waiterApi.confirmPayment(
        checkoutOrder.id, 
        amountToPay, 
        paymentMethod, 
        paymentMethod === 'CASH' ? undefined : `TRX-${Date.now()}`
      );
      toast.success('✅ Payment confirmed! Table cleared.');
      setCheckoutModalOpen(false); setCheckoutOrder(null); setBillDetails(null);
      fetchInitialData();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Payment failed'); }
    finally { setIsProcessingPayment(false); }
  };

  if (loading && view === 'tables') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-pulse">
            <ShoppingCart size={22} className="text-white" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingCustomerOrders = activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <LiveTelemetryBanner activeOrdersCount={activeOrders.length} />
      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="h-[64px] border-b border-slate-200 bg-white flex items-center justify-between px-5 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          {view !== 'tables' && (
            <button onClick={() => setView('tables')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
          )}
          {/* Restaurant brand */}
          <div
            className="w-11 h-11 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: localStorage.getItem('restaurantLogo') ? '#f8fafc' : 'linear-gradient(135deg,#4338ca,#6366f1)',
              boxShadow: '0 0 0 2.5px #6366f140, 0 4px 14px rgb(79 70 229 / .20)',
              border: '1px solid #e0e7ff',
            }}
          >
            {localStorage.getItem('restaurantLogo')
              ? <img src={localStorage.getItem('restaurantLogo')!} alt="Logo" className="w-full h-full object-cover" />
              : <span className="text-white font-extrabold text-[17px]">{(localStorage.getItem('restaurantName') || 'R').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold text-slate-900 tracking-tight leading-none">{localStorage.getItem('restaurantName') || 'Restaurant'}</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {view === 'tables' && 'Floor Plan'}
              {view === 'order' && `Table ${selectedTable?.table_number}`}
              {view === 'status' && 'Order Queue'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pending badge */}
          {pendingCustomerOrders.length > 0 && (
            <button
              onClick={() => setView('status')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold animate-pulse"
              style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
            >
              <AlertCircle size={13} />
              {pendingCustomerOrders.length} Pending
            </button>
          )}
          <button
            onClick={() => setView('status')}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${view === 'status' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Clock size={13} /> Orders
          </button>
          {/* Shift status badge */}
          {shiftOpen !== null && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold"
              style={shiftOpen
                ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }
                : { background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }
              }
            >
              <Banknote size={12} />
              {shiftOpen ? 'Shift Open' : 'No Shift'}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 hidden sm:block">Online</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-colors">
            <LayoutGrid size={14} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          VIEW: FLOOR PLAN (TABLES)
          ════════════════════════════════════════════════ */}
      {view === 'tables' && (
        <div className="flex-grow p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ── Incoming Customer Orders Banner ── */}
            {pendingCustomerOrders.length > 0 && (
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fcd34d' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f59e0b18', borderBottom: '1px solid #fcd34d' }}>
                  <div className="flex items-center gap-2">
                    <Zap size={15} className="text-amber-600" />
                    <span className="text-[13px] font-bold text-amber-800 uppercase tracking-wider">
                      {pendingCustomerOrders.length} New Customer {pendingCustomerOrders.length === 1 ? 'Order' : 'Orders'} Waiting
                    </span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingCustomerOrders.map(order => {
                    const tableNum = tables.find(t => t.id === order.table_id)?.table_number ?? '?';
                    return (
                      <div key={order.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-amber-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[14px]" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}>
                            T{tableNum}
                          </div>
                          <div>
                            <p className="font-bold text-[13px] text-slate-800">Order #{order.id.slice(0, 5)}</p>
                            <p className="text-[11px] text-slate-500">{order.items?.map(i => `${i.quantity}× ${i.menu_item?.name}`).join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRejectOrder(order.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Reject</button>
                          <button onClick={() => handleAcceptOrder(order.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 8px rgb(245 158 11 / .4)' }}>Accept ✓</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Section header ── */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">Floor Plan</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 font-medium">{tables.length} tables · tap to manage orders</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedTable(null); setOrderType('TAKEAWAY'); setView('order'); setCart([]); setEditingOrderId(null); }}
                  className="px-4 py-2 rounded-xl text-[12px] font-extrabold tracking-wide flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors uppercase"
                >
                  <ShoppingBag size={14} /> Parcel Order
                </button>
              </div>
            </div>

            {/* Sections grid */}
            {!tables.every((t: any) => !t.category && !t.section) && (
              ['AC', 'Non-AC'].map(section => {
              const sectionTables = tables.filter((t: any) => (t.category || t.section || 'Non-AC') === section);
              if (sectionTables.length === 0) return null;
              return (
                <div key={section}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={section === 'AC'
                        ? { background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }
                        : { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                      }
                    >
                      {section === 'AC' ? '❄️ AC Section' : '🌿 Non-AC Section'}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400 font-medium">{sectionTables.length} tables</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sectionTables.map(table => {
                      const isPending = (table as any).hasPendingCustomerOrder;
                      const isOccupied = table.status === 'Occupied';
                      
                      const today = new Date().toISOString().split('T')[0];
                      const tableReservations = reservations.filter(r => 
                        r.table_id === table.id && 
                        (r.status === 'CONFIRMED' || r.payment_status === 'PAID') && 
                        r.reservation_date.startsWith(today)
                      );
                      const isReserved = tableReservations.length > 0;

                      // Sprint 1: compute live data
                      const tableOrders = activeOrders.filter(o => o.table_id === table.id && o.status !== 'SERVED');
                      const tableAmount = tableOrders.reduce((sum, o) => sum + o.total_amount, 0);
                      const earliestMs = tableOrders.length > 0 ? Math.min(...tableOrders.map(o => new Date(o.created_at).getTime())) : 0;
                      const elapsedMins = earliestMs > 0 ? Math.floor((Date.now() - earliestMs) / 60000) : 0;
                      const hasBillPrinted = tableOrders.some(o => o.payment_status === 'VERIFYING');
                      const tStatusKey: TStatusKey = isPending ? 'customer' : hasBillPrinted ? 'printed' : isOccupied ? 'running' : isReserved ? 'reserved' : 'free';
                      const tCfg = TABLE_STATUS_CONFIG[tStatusKey];
                      
                      return (
                        <button
                          key={table.id}
                          onClick={() => { setSelectedTable(table); setOrderType('DINE_IN'); setView('order'); setCart([]); setEditingOrderId(null); }}
                          className="relative group bg-white rounded-2xl transition-all duration-200 hover:-translate-y-1 overflow-hidden"
                          style={{
                            border: `1.5px solid ${tCfg.borderColor}`,
                            boxShadow: tStatusKey !== 'free'
                              ? `0 4px 24px ${tCfg.dotColor}30, 0 1px 4px rgb(0 0 0/.04)`
                              : '0 1px 4px rgb(0 0 0/.04)',
                          }}
                        >
                          {/* Top accent bar */}
                            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${tCfg.dotColor}, ${tCfg.dotColor}80)` }} />
                            <div className="p-3.5">
                              {/* Timer + Amount row */}
                              <div className="flex justify-between items-center mb-2 min-h-[16px]">
                                {elapsedMins > 0 ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: elapsedMins > 30 ? '#f43f5e' : elapsedMins > 15 ? '#f59e0b' : '#94a3b8' }}>
                                    <Clock size={9} />
                                    {elapsedMins}m
                                  </span>
                                ) : <span />}
                                {tableAmount > 0 && (
                                  <span className="text-[11px] font-extrabold" style={{ color: tCfg.color }}>
                                    ₹{tableAmount.toFixed(0)}
                                  </span>
                                )}
                              </div>
                              {/* Table number */}
                              <div
                                className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center font-extrabold text-[20px] mb-2.5 transition-transform duration-200 group-hover:scale-105"
                                style={{ background: tCfg.bgGrad, color: tCfg.color, border: `1.5px solid ${tCfg.borderColor}` }}
                              >
                                {table.table_number}
                              </div>
                              {/* Capacity */}
                              <p className="text-[9px] text-center text-slate-400 font-semibold mb-2 uppercase tracking-wide">{table.capacity} seats</p>
                              {/* Status badge */}
                              <div
                                className="px-2 py-0.5 rounded-full text-center text-[9px] font-extrabold uppercase tracking-wide leading-5"
                                style={{ background: tCfg.bgGrad, color: tCfg.color, border: `1px solid ${tCfg.borderColor}` }}
                              >
                                {tStatusKey === 'reserved' && tableReservations.length > 0
                                  ? `Rsrv ${tableReservations[0].reservation_time.substring(0,5)}`
                                  : tCfg.label}
                              </div>
                            </div>
                          </button>
                        );
                    })}
                  </div>
                </div>
              );
            })
            )}

            {/* Fallback (if no section data) */}
            {tables.every((t: any) => !t.category && !t.section) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => {
                  const isPending = (table as any).hasPendingCustomerOrder;
                  const isOccupied = table.status === 'Occupied';
                  
                  const today = new Date().toISOString().split('T')[0];
                  const tableReservations = reservations.filter(r => 
                    r.table_id === table.id && 
                    (r.status === 'CONFIRMED' || r.payment_status === 'PAID') && 
                    r.reservation_date.startsWith(today)
                  );
                  const isReserved = tableReservations.length > 0;

                  // Sprint 1: live data
                  const tableOrders = activeOrders.filter(o => o.table_id === table.id && o.status !== 'SERVED');
                  const tableAmount = tableOrders.reduce((sum, o) => sum + o.total_amount, 0);
                  const earliestMs = tableOrders.length > 0 ? Math.min(...tableOrders.map(o => new Date(o.created_at).getTime())) : 0;
                  const elapsedMins = earliestMs > 0 ? Math.floor((Date.now() - earliestMs) / 60000) : 0;
                  const hasBillPrinted = tableOrders.some(o => o.payment_status === 'VERIFYING');
                  const tStatusKey: TStatusKey = isPending ? 'customer' : hasBillPrinted ? 'printed' : isOccupied ? 'running' : isReserved ? 'reserved' : 'free';
                  const tCfg = TABLE_STATUS_CONFIG[tStatusKey];
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => { setSelectedTable(table); setOrderType('DINE_IN'); setView('order'); setCart([]); setEditingOrderId(null); }}
                      className="relative group bg-white rounded-2xl transition-all duration-200 hover:-translate-y-1 overflow-hidden"
                      style={{
                        border: `1.5px solid ${tCfg.borderColor}`,
                        boxShadow: tStatusKey !== 'free'
                          ? `0 4px 24px ${tCfg.dotColor}30, 0 1px 4px rgb(0 0 0/.04)`
                          : '0 1px 4px rgb(0 0 0/.04)',
                      }}
                    >
                      {/* Top accent bar */}
                      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${tCfg.dotColor}, ${tCfg.dotColor}80)` }} />
                      <div className="p-3.5">
                        {/* Timer + Amount row */}
                        <div className="flex justify-between items-center mb-2 min-h-[16px]">
                          {elapsedMins > 0 ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: elapsedMins > 30 ? '#f43f5e' : elapsedMins > 15 ? '#f59e0b' : '#94a3b8' }}>
                              <Clock size={9} />
                              {elapsedMins}m
                            </span>
                          ) : <span />}
                          {tableAmount > 0 && (
                            <span className="text-[11px] font-extrabold" style={{ color: tCfg.color }}>
                              ₹{tableAmount.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {/* Table number */}
                        <div
                          className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center font-extrabold text-[20px] mb-2.5 transition-transform duration-200 group-hover:scale-105"
                          style={{ background: tCfg.bgGrad, color: tCfg.color, border: `1.5px solid ${tCfg.borderColor}` }}
                        >
                          {table.table_number}
                        </div>
                        {/* Capacity */}
                        <p className="text-[9px] text-center text-slate-400 font-semibold mb-2 uppercase tracking-wide">{table.capacity} seats</p>
                        {/* Status badge */}
                        <div
                          className="px-2 py-0.5 rounded-full text-center text-[9px] font-extrabold uppercase tracking-wide leading-5"
                          style={{ background: tCfg.bgGrad, color: tCfg.color, border: `1px solid ${tCfg.borderColor}` }}
                        >
                          {tStatusKey === 'reserved' && tableReservations.length > 0
                            ? `Rsrv ${tableReservations[0].reservation_time.substring(0,5)}`
                            : tCfg.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VIEW: ORDER (MENU + CART)
          ════════════════════════════════════════════════ */}
      {view === 'order' && (
        <div className="flex-grow flex flex-row h-[calc(100vh-64px)] overflow-hidden">

          {/* ── LEFT: Menu ── */}
          <div className="flex-[1.6] flex flex-col border-r border-slate-200 min-w-0 h-full" style={{ background: '#f8fafc' }}>

            {/* Search + Filter bar */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {[{ id: 'all', name: 'All Items' }, ...categories].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all"
                    style={selectedCategory === cat.id
                      ? { background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', boxShadow: '0 2px 8px rgb(79 70 229 / .35)' }
                      : { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Sprint 1: Quick Items Strip (Favorites / Hot Pick) ── */}
            {selectedCategory === 'all' && !searchQuery && (() => {
              const allItems = categories.flatMap(c => c.menu_items).filter(i => i.is_available);
              const quickItems = allItems.slice(0, 6); // Display up to 6 quick items
              if (quickItems.length === 0) return null;
              return (
                <div className="px-4 pt-3 pb-2 bg-slate-100/60 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      ⚡ Quick Add (Most Ordered)
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">One-tap billing</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {quickItems.map(item => {
                      const inCart = cart.find(c => c.id === item.id);
                      return (
                        <button
                          key={`quick-${item.id}`}
                          onClick={() => handleAddToCartClick(item)}
                          className="px-3 py-2 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 shrink-0 hover:border-indigo-300 transition-all hover:scale-[1.02]"
                        >
                          <div className={`w-3 h-3 shrink-0 rounded-xs border-2 flex items-center justify-center ${item.is_veg ? 'border-emerald-500' : 'border-rose-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-xs ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>
                          <span className="text-[12px] font-bold text-slate-800">{item.name}</span>
                          <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">₹{item.price}</span>
                          {inCart && <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">{inCart.quantity}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Menu grid */}
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 md:pb-4">
                {categories
                  .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                  .flatMap(cat => cat.menu_items)
                  .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleAddToCartClick(item)}
                        className="group bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-start text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 gap-2 relative overflow-hidden"
                        style={{ boxShadow: inCart ? '0 0 0 2px #6366f1, 0 4px 12px rgb(79 70 229 / .15)' : undefined, borderColor: inCart ? '#6366f1' : undefined }}
                        disabled={!item.is_available}
                      >
                        {/* Top row: Image & Price & Badge */}
                        <div className="flex justify-between items-start w-full">
                          <div className="relative shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-xl shrink-0 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 font-black text-slate-300 text-lg shadow-sm">
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-xs bg-white shadow-xs border flex items-center justify-center ${item.is_veg ? 'border-emerald-600' : 'border-rose-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-xs ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[13px] font-extrabold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 tracking-tight">₹{item.price}</span>
                            {inCart && (
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                                {inCart.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text row */}
                        <div className="flex flex-col flex-grow min-w-0 w-full mt-1.5">
                          <div className="flex items-start justify-between gap-1 w-full">
                            <h4 className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-tight">
                              {item.name}
                            </h4>
                            <span
                              onClick={(e) => { e.stopPropagation(); setSelectedItemForAR(item); }}
                              className="px-1.5 py-0.5 rounded-md bg-orange-50 text-[#e85d04] hover:bg-[#e85d04] hover:text-white font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer shrink-0 border border-orange-100 shadow-xs"
                              title="Open 3D AR Model Preview"
                            >
                              🧊 3D
                            </span>
                          </div>
                          {item.description && <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-1.5">{item.description}</p>}
                          {!item.is_available && <span className="mt-2 text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">Unavailable</span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Cart / Order Ticket ── */}
          <div className="flex flex-col bg-white shrink-0 relative h-full w-[320px] md:w-[340px] lg:w-[380px] border-l border-slate-200">
            {/* Cart header */}
            <div className="h-[60px] px-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-indigo-600" />
                <h3 className="font-bold text-[15px] text-slate-900">
                  {orderType === 'TAKEAWAY' ? 'Parcel Order' : (selectedTable ? `Table ${selectedTable.table_number}` : 'Order Ticket')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {editingOrderId && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">Editing</span>}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: cart.length ? '#eef2ff' : '#f8fafc', color: cart.length ? '#4338ca' : '#94a3b8', border: `1px solid ${cart.length ? '#c7d2fe' : '#e2e8f0'}` }}>
                  {cart.length} items
                </span>
              </div>
            </div>

            {/* ── Sprint 1: Customer Details moved to TOP of ticket for fast entry ── */}
            {!editingOrderId && (
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="👤 Customer Name (opt.)"
                  className="flex-1 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-slate-800 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400 shadow-2xs"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="💬 WhatsApp Phone (opt.)"
                  className="flex-1 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-slate-800 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400 shadow-2xs"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-4 space-y-5 scrollbar-thin">

              {/* Live orders for this table */}
              {(() => {
                const liveOrders = activeOrders.filter(o => o.table_id === selectedTable?.id && o.status !== 'SERVED');
                if (!liveOrders.length) return null;
                return (
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Live Orders</p>
                    <div className="space-y-2">
                      {liveOrders.map(order => {
                        const st = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
                        return (
                          <div key={order.id} className="rounded-xl p-3.5" style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-[12px]" style={{ color: st.text }}>#{order.id.slice(0, 6)}</span>
                              <div className="flex items-center gap-2">
                                {order.status !== 'SERVED' && (
                                  <>
                                    <button onClick={() => handleEditOrder(order)} className="p-1 rounded-lg hover:bg-white/60 transition-colors" style={{ color: st.text }}><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteOrder(order.id)} className="p-1 rounded-lg hover:bg-white/60 transition-colors text-rose-500"><Trash2 size={12} /></button>
                                  </>
                                )}
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'white', color: st.text, border: `1px solid ${st.border}` }}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                  <p className="text-[12px]" style={{ color: st.text }}>
                                    <span className="font-bold">{item.quantity}×</span> {item.menu_item?.name || 'Item'}
                                  </p>
                                  {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="pl-6 text-[10px] opacity-80" style={{ color: st.text }}>
                                      {item.modifiers.map(m => `+ ${m.modifier?.name || 'Add-on'}`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-px bg-slate-100 my-4" />
                  </div>
                );
              })()}

              {/* Draft cart */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Draft Items</p>
                {cart.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center rounded-2xl text-slate-400" style={{ border: '1.5px dashed #e2e8f0', background: '#fafafa' }}>
                    <ShoppingCart size={24} className="mb-2 opacity-30" />
                    <p className="text-[12px] font-medium">Tap items to add</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-[13px] text-slate-800">{item.name}</h4>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[11px] text-slate-500 my-1">
                                {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                              </div>
                            )}
                            <p className="text-[11px] text-indigo-600 font-bold">₹{((() => {
                              let bp = item.price;
                              let mt = 0;
                              item.modifiers?.forEach(m => {
                                const group = item.modifier_groups?.find(g => g.modifiers?.some((gm: any) => gm.id === m.id));
                                if (group?.price_replaces_base) bp = m.price;
                                else mt += m.price;
                              });
                              return bp + mt;
                            })() * item.quantity).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1">
                            <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"><Minus size={11} className="text-slate-600" /></button>
                            <span className="text-[13px] font-bold text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-indigo-50 transition-colors"><Plus size={11} className="text-indigo-600" /></button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            placeholder="Chef notes (optional)..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                            value={item.notes}
                            onChange={e => updateNotes(item.cartItemId, e.target.value)}
                          />
                          <button
                            onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, is_parcel: !i.is_parcel } : i))}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5 border ${item.is_parcel || orderType === 'TAKEAWAY' ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm shadow-orange-100' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-500'}`}
                            disabled={orderType === 'TAKEAWAY'}
                          >
                            <ShoppingBag size={12} className={item.is_parcel || orderType === 'TAKEAWAY' ? 'fill-orange-100' : ''} />
                            PARCEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[13px] text-slate-500 font-medium">Draft Total</span>
                  {cart.length > 0 && (
                    <p className="text-[10px] text-indigo-600 font-bold tracking-tight">🏷️ Discounts apply at checkout</p>
                  )}
                </div>
                <span className="text-[22px] font-extrabold text-slate-900 tracking-tight">₹{totalAmount}</span>
              </div>

              <button
                onClick={placeOrder}
                disabled={cart.length === 0 || isPlacingOrder}
                className="w-full py-3.5 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={cart.length > 0 ? { background: 'linear-gradient(135deg, #e85d04, #fb8c00)', color: '#fff', boxShadow: '0 4px 20px rgba(232, 93, 4, 0.45)', border: '1px solid rgba(251, 140, 0, 0.3)' } : { background: '#f1f5f9', color: '#94a3b8' }}
              >
                {isPlacingOrder ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
                {isPlacingOrder ? 'Processing...' : (editingOrderId ? 'Update Order' : '🔥 Send to Kitchen (FIRE KOT)')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VIEW: ORDER STATUS QUEUE
          ════════════════════════════════════════════════ */}
      {view === 'status' && (
        <div className="flex-grow p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">Order Queue</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 font-medium">{activeOrders.length} active tickets</p>
              </div>
              <button onClick={fetchInitialData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <RefreshCcw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
            ) : activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: 'white', border: '1.5px dashed #e2e8f0' }}>
                <CheckCircle2 size={40} className="text-slate-200 mb-3" />
                <p className="text-[15px] font-bold text-slate-400">All clear — no active tickets</p>
              </div>
            ) : (
              <div className="space-y-8">

                {/* Pending section */}
                {activeOrders.filter(o => o.status === 'PENDING').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' }}>
                        ⚡ Pending Acceptance
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeOrders.filter(o => o.status === 'PENDING').map(order => {
                        const tNum = tables.find(t => t.id === order.table_id)?.table_number ?? '?';
                        return (
                          <div key={order.id} className="bg-white rounded-2xl p-5 relative overflow-hidden" style={{ border: '1px solid #fcd34d', boxShadow: '0 4px 20px rgb(245 158 11 / .12)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                            <div className="flex justify-between items-start mb-4 mt-1">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px]" style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#b45309', border: '1px solid #fcd34d' }}>
                                  T{tNum}
                                </div>
                                <div>
                                  <p className="font-bold text-[14px] text-slate-800">Order #{order.id.slice(0, 6)}</p>
                                  <p className="text-[11px] font-semibold text-amber-600">Customer Request</p>
                                </div>
                              </div>
                              <span className="font-extrabold text-[16px] text-slate-800">₹{order.total_amount}</span>
                            </div>
                            <div className="space-y-1 pb-4 mb-4 border-b border-dashed border-amber-200">
                              {order.items?.map((item, idx) => (
                                <p key={idx} className="text-[12px] text-slate-600"><span className="font-bold text-slate-800">{item.quantity}×</span> {item.menu_item?.name || 'Item'}{item.notes && <span className="text-amber-600 ml-1 italic">({item.notes})</span>}</p>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleRejectOrder(order.id)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Reject</button>
                              <button onClick={() => handleAcceptOrder(order.id)} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 8px rgb(245 158 11 / .4)' }}>
                                Accept & Send ✓
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active orders */}
                {activeOrders.filter(o => o.status !== 'PENDING').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                        🍽 Active Tickets
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeOrders.filter(o => o.status !== 'PENDING').map(order => {
                        const tNum = tables.find(t => t.id === order.table_id)?.table_number ?? '?';
                        const st = STATUS_STYLE[order.status] || STATUS_STYLE.SERVED;
                        return (
                          <div key={order.id} className="bg-white rounded-2xl p-5 relative overflow-hidden" style={{ border: `1px solid ${st.border}`, boxShadow: `0 4px 20px ${st.dot}18` }}>
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg,${st.dot},${st.dot}90)` }} />
                            <div className="flex justify-between items-start mb-3 mt-1">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px]" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                  T{tNum}
                                </div>
                                <div>
                                  <p className="font-bold text-[14px] text-slate-800">#{order.id.slice(0, 6)}</p>
                                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-[16px] text-slate-800">₹{order.total_amount}</span>
                            </div>
                            <div className="space-y-1 pb-3 mb-3 border-b border-dashed" style={{ borderColor: st.border }}>
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                  <p className="text-[12px] text-slate-600"><span className="font-bold">{item.quantity}×</span> {item.menu_item?.name || 'Item'}</p>
                                  {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="pl-6 text-[10px] text-slate-400">
                                      {item.modifiers.map(m => `+ ${m.modifier?.name || 'Add-on'}`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              {order.payment_status === 'VERIFYING' && !order.razorpay_order_id && (
                                <button onClick={() => handleDirectPaymentConfirm(order.id)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 transition-all hover:bg-indigo-100">
                                  Confirm Payment
                                </button>
                              )}
                              {order.payment_status === 'VERIFYING' && order.razorpay_order_id && (
                                <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                                  ⚡ Razorpay — Auto Confirming
                                </span>
                              )}
                              {order.status === 'READY' && (
                                <button onClick={() => handleServeOrder(order.id)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 8px rgb(16 185 129 / .4)' }}>
                                  ✓ Mark Served
                                </button>
                              )}
                              {order.status === 'SERVED' && (
                                <>
                                  {subscriptionPlan !== 'basic' && (
                                    <button onClick={() => handlePrintReceipt(order)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-700 bg-slate-100 border border-slate-200 transition-all hover:bg-slate-200 flex items-center gap-1.5">
                                      <Printer size={14} /> Print Bill
                                    </button>
                                  )}
                                  <button onClick={() => handleStartCheckout(order)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 2px 8px rgb(79 70 229 / .4)' }}>
                                    💳 Checkout
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      {(view === 'tables' || view === 'status') && (
        <div className="fixed bottom-0 w-full h-[64px] bg-white border-t border-slate-200 flex items-center justify-around px-4 md:hidden z-50 shadow-[0_-4px_16px_rgb(0_0_0/.06)]">
          {[
            { id: 'tables', Icon: LayoutGrid, label: 'Tables' },
            { id: 'status', Icon: Clock, label: 'Orders', badge: activeOrders.filter(o => o.status !== 'SERVED').length },
          ].map(({ id, Icon, label, badge }) => (
            <button key={id} onClick={() => setView(id as any)} className="flex flex-col items-center gap-1 relative px-6">
              <div className="relative">
                <Icon size={20} className={view === id ? 'text-indigo-600' : 'text-slate-400'} />
                {badge && badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">{badge}</span>}
              </div>
              <span className={`text-[10px] font-bold ${view === id ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── CHECKOUT MODAL (2-Step) ── */}
      {checkoutModalOpen && billDetails && checkoutOrder && (() => {
        const discAmt = discountType === 'percent'
          ? Math.round(billDetails.total_amount * discountAmount / 100 * 100) / 100
          : discountAmount;
        const grandTotal = Math.max(0, billDetails.total_amount - discAmt + deliveryCharge + containerCharge);
        const changeBack = customerPaidAmount && parseFloat(customerPaidAmount) > 0
          ? Math.max(0, parseFloat(customerPaidAmount) - grandTotal)
          : null;
        return (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(8px)' }}>
            <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col" style={{ maxHeight: '92vh', animation: 'slideUp .2s ease both' }}>

              {/* ── HEADER ── */}
              <div className="px-5 pt-5 pb-4 shrink-0" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                      Step {checkoutStep}/2 — {checkoutStep === 1 ? 'Bill Review' : 'Payment'}
                    </p>
                    <h2 className="text-[20px] font-extrabold text-white mt-0.5">
                      {orderType === 'TAKEAWAY' ? '📦 Parcel' : `Table ${selectedTable?.table_number}`}
                    </h2>
                  </div>
                  <button onClick={() => !isProcessingPayment && setCheckoutModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <X size={15} />
                  </button>
                </div>
                {/* Step indicator */}
                <div className="flex gap-1.5">
                  {[1, 2].map(s => (
                    <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: s <= checkoutStep ? '#818cf8' : '#ffffff20' }} />
                  ))}
                </div>
              </div>

              {/* ══ STEP 1: BILL ══════════════════════════════════════════════ */}
              {checkoutStep === 1 && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {/* Items list */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Items Ordered</p>
                    <div className="bg-slate-50 rounded-xl overflow-hidden divide-y divide-slate-100 border border-slate-100">
                      {checkoutOrder.items?.map((item, i) => (
                        <div key={i} className="flex justify-between px-3.5 py-2.5 text-[13px]">
                          <span className="text-slate-600">
                            <span className="font-bold text-slate-800">{item.quantity}×</span> {item.menu_item?.name || 'Item'}
                          </span>
                          <span className="font-semibold text-slate-800">₹{(item.price_at_order_time * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Charges & Discount */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Adjust Charges</p>
                    <div className="space-y-2.5 bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex justify-between text-[13px] text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-800">₹{billDetails.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-slate-500">
                        <span>Tax</span>
                        <span className="font-semibold text-slate-800">₹{billDetails.tax_amount}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      {/* Discount row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-600 w-20 shrink-0">Discount</span>
                        <select
                          className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 shrink-0"
                          value={discountType}
                          onChange={e => setDiscountType(e.target.value as any)}
                        >
                          <option value="percent">%</option>
                          <option value="fixed">₹</option>
                        </select>
                        <input
                          type="number"
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:border-rose-400 bg-white min-w-0"
                          placeholder="0"
                          min="0"
                          value={discountAmount || ''}
                          onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        />
                        {discAmt > 0 && (
                          <span className="text-[12px] font-bold text-rose-500 shrink-0 w-16 text-right">-₹{discAmt.toFixed(0)}</span>
                        )}
                      </div>
                      {/* Delivery row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-600 w-20 shrink-0">Delivery</span>
                        <input
                          type="number"
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:border-indigo-400 bg-white min-w-0"
                          placeholder="0"
                          min="0"
                          value={deliveryCharge || ''}
                          onChange={e => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                        />
                        {deliveryCharge > 0 && (
                          <span className="text-[12px] font-semibold text-slate-500 shrink-0 w-16 text-right">+₹{deliveryCharge}</span>
                        )}
                      </div>
                      {/* Container row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-600 w-20 shrink-0">Container</span>
                        <input
                          type="number"
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:border-indigo-400 bg-white min-w-0"
                          placeholder="0"
                          min="0"
                          value={containerCharge || ''}
                          onChange={e => setContainerCharge(parseFloat(e.target.value) || 0)}
                        />
                        {containerCharge > 0 && (
                          <span className="text-[12px] font-semibold text-slate-500 shrink-0 w-16 text-right">+₹{containerCharge}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="rounded-2xl p-4 border" style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderColor: '#c7d2fe' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-bold text-indigo-900">Grand Total</span>
                      <span className="text-[26px] font-extrabold text-indigo-700 tracking-tight">₹{grandTotal.toFixed(2)}</span>
                    </div>
                    {discAmt > 0 && (
                      <p className="text-[11px] text-indigo-500 mt-1">You saved ₹{discAmt.toFixed(2)} 🎉</p>
                    )}
                  </div>
                </div>
              )}
              {checkoutStep === 1 && (
                <div className="p-4 shrink-0 border-t border-slate-100">
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="w-full py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 4px 16px rgb(79 70 229 / .4)' }}
                  >
                    Next: Choose Payment →
                  </button>
                </div>
              )}

              {/* ══ STEP 2: PAYMENT ═══════════════════════════════════════════ */}
              {checkoutStep === 2 && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {/* Amount reminder */}
                  <div className="rounded-xl p-3.5 border flex justify-between items-center" style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}>
                    <span className="text-[13px] font-semibold text-indigo-800">Amount to Pay</span>
                    <span className="text-[20px] font-extrabold text-indigo-700">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment methods */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'CASH', Icon: Wallet, label: 'Cash' },
                        { id: 'CARD', Icon: CreditCard, label: 'Card' },
                        { id: 'UPI', Icon: Smartphone, label: 'UPI' },
                      ] as const).map(({ id, Icon, label }) => (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          className="py-3.5 rounded-2xl flex flex-col items-center gap-1.5 text-[11px] font-bold transition-all"
                          style={paymentMethod === id
                            ? { background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', boxShadow: '0 2px 8px rgb(79 70 229 / .4)' }
                            : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
                          }
                        >
                          <Icon size={18} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash: change calculator */}
                  {paymentMethod === 'CASH' && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Change Calculator</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-slate-600 font-medium shrink-0">Customer gave</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-[15px] font-bold text-slate-800 focus:outline-none focus:border-indigo-400 bg-white"
                            placeholder="0"
                            value={customerPaidAmount}
                            onChange={e => setCustomerPaidAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      {changeBack !== null && (
                        <div
                          className="flex justify-between items-center rounded-xl px-4 py-3 border"
                          style={{
                            background: changeBack >= 0 ? '#ecfdf5' : '#fff1f2',
                            borderColor: changeBack >= 0 ? '#6ee7b7' : '#fecdd3',
                          }}
                        >
                          <span className="text-[13px] font-semibold" style={{ color: changeBack >= 0 ? '#065f46' : '#be123c' }}>
                            {changeBack >= 0 ? 'Return to customer' : 'Amount short'}
                          </span>
                          <span className="text-[22px] font-extrabold" style={{ color: changeBack >= 0 ? '#10b981' : '#f43f5e' }}>
                            ₹{Math.abs(changeBack).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI QR */}
                  {paymentMethod === 'UPI' && upiId && (
                    <div className="flex flex-col items-center rounded-2xl p-4 border border-slate-200 bg-slate-50">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Restaurant&am=${grandTotal.toFixed(2)}&cu=INR`)}`}
                        alt="UPI QR"
                        className="w-36 h-36 rounded-xl"
                      />
                      <p className="text-[11px] text-slate-500 font-medium mt-2">{upiId}</p>
                    </div>
                  )}
                </div>
              )}
              {checkoutStep === 2 && (
                <div className="p-4 shrink-0 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="px-5 py-3.5 rounded-2xl font-bold text-[13px] text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors shrink-0"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgb(16 185 129 / .4)' }}
                  >
                    {isProcessingPayment ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm Payment</>}
                  </button>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Fixed bottom-left: Navigation Buttons */}
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2">
        <button
          onClick={() => navigate('/kitchen')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[13px] shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', boxShadow: '0 4px 20px rgb(245 158 11 / .4)' }}
        >
          <ChefHat size={15} />
          Kitchen View
        </button>
        <button
          onClick={() => navigate('/owner')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[13px] shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', boxShadow: '0 4px 20px rgb(99 102 241 / .4)' }}
        >
          <Shield size={15} />
          Owner View
        </button>
      </div>
      {/* ── RECEIPTS OVERLAY ── */}
      {printingOrder && (
        <ReceiptPrinter 
          order={printingOrder}
          tableNumber={tables.find(t => t.id === printingOrder.table_id)?.table_number}
          restaurantName={localStorage.getItem('restaurantName') || 'MyRestro'}
          gstin={localStorage.getItem('restaurantGstin') || undefined}
          fssai={localStorage.getItem('restaurantFssai') || undefined}
        />
      )}

      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(item, modifiers, quantity, notes) => addToCart(item, modifiers, quantity, notes)}
        />
      )}

      {/* ── SPRINT 1: REASON MODAL FOR DELETE & REJECT ── */}
      {reasonModalOpen && reasonAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(6px)' }}>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5" style={{ animation: 'zoomIn95 .18s ease both' }}>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 text-lg font-extrabold border border-rose-100">
                {reasonAction.type === 'delete' ? '🗑️' : '❌'}
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-900">
                {reasonAction.type === 'delete' ? 'Delete Order Ticket?' : 'Cancel / Reject Order?'}
              </h3>
              <p className="text-[12px] text-slate-500 mt-1">
                Please select a reason for auditing & inventory control:
              </p>
            </div>

            <div className="space-y-2">
              {['Customer Changed Mind', 'Out of Stock', 'Entered by Mistake', 'Duplicate Order', 'Other'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-left text-[13px] font-semibold flex items-center justify-between transition-all"
                  style={selectedReason === reason 
                    ? { background: '#fff1f2', color: '#be123c', border: '1.5px solid #f43f5e', fontWeight: 700 } 
                    : { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                >
                  <span>{reason}</span>
                  {selectedReason === reason && <CheckCircle2 size={16} className="text-rose-600 shrink-0" />}
                </button>
              ))}
            </div>

            {selectedReason === 'Other' && (
              <textarea
                placeholder="Type custom reason here..."
                className="w-full border border-slate-200 rounded-xl p-3 text-[13px] text-slate-800 focus:outline-none focus:border-rose-400 resize-none h-20"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                autoFocus
              />
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => { setReasonModalOpen(false); setReasonAction(null); }}
                disabled={isProcessingReason}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeReasonAction}
                disabled={isProcessingReason}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-200"
              >
                {isProcessingReason ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D AR DISH PREVIEW MODAL */}
      <DishARViewerModal
        item={selectedItemForAR}
        onClose={() => setSelectedItemForAR(null)}
        onAddToCart={() => selectedItemForAR && handleAddToCartClick(selectedItemForAR)}
      />
    </div>
  );
}
