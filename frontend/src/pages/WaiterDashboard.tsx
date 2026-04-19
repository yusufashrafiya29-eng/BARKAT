import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Plus, Minus,
  Search, Trash2, Loader2,
  LayoutGrid, Clock,
  RefreshCcw, AlertCircle, Edit2,
  ShoppingCart, CheckCircle2, X,
  Wallet, CreditCard, Smartphone,
  Send, Zap
} from 'lucide-react';
import { waiterApi } from '../api/waiter';
import toast from 'react-hot-toast';

/* ── Types ──────────────────────────────────────────────────── */
interface MenuItem { id: string; name: string; price: number; description?: string; category_id: string; is_veg: boolean; is_available: boolean; }
interface Category  { id: string; name: string; menu_items: MenuItem[]; }
interface Table     { id: string; table_number: number; capacity: number; category: string; status?: 'Free' | 'Occupied' | 'Ordering'; }
interface CartItem  extends MenuItem { quantity: number; notes: string; }
interface OrderItem { id: string; menu_item_id: string; quantity: number; price_at_order_time: number; subtotal?: number; notes?: string; menu_item?: { name: string; price: number }; }
interface Order     { id: string; table_id: string; status: 'PENDING'|'ACCEPTED'|'PREPARING'|'READY'|'SERVED'; total_amount: number; created_at: string; items?: OrderItem[]; source?: 'CUSTOMER'|'WAITER'; is_accepted?: boolean; }

/* ── Status helpers ──────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PENDING:   { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', dot: '#f59e0b' },
  ACCEPTED:  { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1' },
  PREPARING: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff', dot: '#a855f7' },
  READY:     { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7', dot: '#10b981' },
  SERVED:    { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  CANCELLED: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e' },
};

export default function WaiterDashboard() {
  const navigate  = useNavigate();
  const [view, setView]               = useState<'tables'|'order'|'status'>('tables');
  const [tables, setTables]           = useState<Table[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [selectedTable, setSelectedTable]   = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string|'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [checkoutModalOpen, setCheckoutModalOpen]   = useState(false);
  const [checkoutOrder, setCheckoutOrder]           = useState<Order | null>(null);
  const [billDetails, setBillDetails]               = useState<any>(null);
  const [paymentMethod, setPaymentMethod]           = useState<'CASH'|'CARD'|'UPI'>('CASH');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiId, setUpiId]             = useState<string | null>(null);

  /* ── Data fetching ─────────────────────────────────────────── */
  const fetchOrdersOnly = async () => {
    try {
      const ordersData = await waiterApi.getAllOrders();
      setActiveOrders(ordersData);
      setTables(prev => prev.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      })));
    } catch {}
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchOrdersOnly, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tablesData, menuData, ordersData, upiData] = await Promise.all([
        waiterApi.getTables(), waiterApi.getMenu(), waiterApi.getAllOrders(), waiterApi.getUpiId()
      ]);
      setTables(tablesData.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      })));
      setCategories(menuData);
      setActiveOrders(ordersData);
      if (upiData?.upi_id) setUpiId(upiData.upi_id);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to load dashboard');
    } finally { setLoading(false); }
  };

  /* ── Cart actions ───────────────────────────────────────────── */
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    toast.success(`${item.name} added`, { position: 'top-center' });
  };
  const updateQuantity = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  const updateNotes = (id: string, notes: string) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  /* ── Order actions ──────────────────────────────────────────── */
  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    try {
      if (editingOrderId) {
        await waiterApi.updateOrderItems(editingOrderId, cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity, notes: i.notes })));
        toast.success('Order updated!');
        setEditingOrderId(null);
      } else {
        await waiterApi.placeOrder({ table_id: selectedTable.id, items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity, notes: i.notes })) });
        toast.success('🚀 Ticket sent to kitchen!');
      }
      setView('status');
      fetchInitialData();
    } catch (e: any) {
      const d = e.response?.data?.detail;
      toast.error(Array.isArray(d) ? d[0]?.msg : d || 'Failed to process order');
    }
  };

  const handleDeleteOrder   = async (id: string) => { if (!confirm('Delete this order?')) return; try { await waiterApi.deleteOrder(id); toast.success('Deleted'); fetchInitialData(); } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } };
  const handleEditOrder     = (order: Order) => { setEditingOrderId(order.id); setCart(order.items?.map(i => ({ id: i.menu_item_id, name: i.menu_item?.name||'Item', price: i.price_at_order_time, quantity: i.quantity, notes: i.notes||'', category_id:'', is_veg:false, is_available:true })) || []); toast('✏️ Editing order'); };
  const handleServeOrder    = async (id: string) => { try { await waiterApi.updateOrderStatus(id,'SERVED'); toast.success('Marked served!'); fetchOrdersOnly(); } catch (e: any) { toast.error(e.response?.data?.detail||'Failed'); } };
  const handleAcceptOrder   = async (id: string) => { try { await waiterApi.acceptOrder(id); toast.success('Accepted — sent to kitchen'); fetchInitialData(); } catch (e: any) { toast.error(e.response?.data?.detail||'Failed'); } };
  const handleRejectOrder   = async (id: string) => { if (!confirm('Reject this order?')) return; try { await waiterApi.updateOrderStatus(id,'CANCELLED'); toast.success('Rejected'); fetchInitialData(); } catch (e: any) { toast.error(e.response?.data?.detail||'Failed'); } };
  const handleStartCheckout = async (order: Order) => { try { const bill = await waiterApi.generateBill(order.id,'CASH',0); setCheckoutOrder(order); setBillDetails(bill); setPaymentMethod('CASH'); setCheckoutModalOpen(true); } catch (e: any) { toast.error(e.response?.data?.detail||'Failed'); } };
  const handleConfirmPayment = async () => {
    if (!checkoutOrder) return;
    setIsProcessingPayment(true);
    try {
      await waiterApi.confirmPayment(checkoutOrder.id, paymentMethod === 'CASH' ? undefined : `TRX-${Date.now()}`);
      toast.success('✅ Payment confirmed! Table cleared.');
      setCheckoutModalOpen(false); setCheckoutOrder(null); setBillDetails(null);
      fetchInitialData();
    } catch (e: any) { toast.error(e.response?.data?.detail||'Payment failed'); }
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
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
              view === 'status' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock size={13} /> Orders
          </button>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">Floor Plan</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 font-medium">{tables.length} tables · tap to manage orders</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'Free',     bg: '#f8fafc', text: '#94a3b8', border: '#e2e8f0', dot: '#e2e8f0' },
                  { label: 'Occupied', bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#4f46e5' },
                  { label: '⚡ Pending', bg: '#fef3c7', text: '#b45309', border: '#fcd34d',  dot: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: s.dot, boxShadow: `0 0 4px ${s.dot}` }} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* AC / Non-AC sections */}
            {['AC', 'Non-AC'].map(section => {
              const sectionTables = tables.filter((t: any) => (t.category || t.section || 'Non-AC') === section);
              if (sectionTables.length === 0) return null;
              return (
                <div key={section}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={section === 'AC'
                        ? { background:'#eef2ff', color:'#4338ca', border:'1px solid #c7d2fe' }
                        : { background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0' }
                      }
                    >
                      {section === 'AC' ? '❄️ AC Section' : '🌿 Non-AC Section'}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400 font-medium">{sectionTables.length} tables</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sectionTables.map(table => {
                      const isPending  = (table as any).hasPendingCustomerOrder;
                      const isOccupied = table.status === 'Occupied';
                      return (
                        <button
                          key={table.id}
                          onClick={() => { setSelectedTable(table); setView('order'); setCart([]); setEditingOrderId(null); }}
                          className="relative group bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-1"
                          style={{
                            border: `1.5px solid ${isPending ? '#fcd34d' : isOccupied ? '#c7d2fe' : '#e2e8f0'}`,
                            boxShadow: isPending
                              ? '0 4px 20px rgb(245 158 11 / .18), 0 1px 4px rgb(0 0 0 / .04)'
                              : isOccupied
                              ? '0 4px 20px rgb(79 70 229 / .12), 0 1px 4px rgb(0 0 0 / .04)'
                              : '0 1px 4px rgb(0 0 0 / .04)',
                          }}
                        >
                          {isPending && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap z-10" style={{ background:'#f59e0b', color:'#fff', boxShadow:'0 2px 8px rgb(245 158 11 / .5)' }}>
                              ⚡ NEW
                            </span>
                          )}
                          {/* Table number box */}
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-[18px] transition-transform duration-200 group-hover:scale-105"
                            style={{
                              background: isPending ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : isOccupied ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                              color: isPending ? '#b45309' : isOccupied ? '#4338ca' : '#94a3b8',
                              border: `1.5px solid ${isPending ? '#fcd34d' : isOccupied ? '#c7d2fe' : '#e2e8f0'}`,
                            }}
                          >
                            {table.table_number}
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">{table.capacity} seats</p>
                            <div
                              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                              style={{
                                background: isPending ? '#fef3c7' : isOccupied ? '#eef2ff' : '#f8fafc',
                                color: isPending ? '#b45309' : isOccupied ? '#4338ca' : '#94a3b8',
                                border: `1px solid ${isPending ? '#fcd34d' : isOccupied ? '#c7d2fe' : '#e2e8f0'}`,
                              }}
                            >
                              {isPending ? '⚡ Pending' : table.status}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Fallback (if no section data) */}
            {tables.every((t: any) => !t.category && !t.section) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => {
                  const isPending  = (table as any).hasPendingCustomerOrder;
                  const isOccupied = table.status === 'Occupied';
                  return (
                    <button
                      key={table.id}
                      onClick={() => { setSelectedTable(table); setView('order'); setCart([]); setEditingOrderId(null); }}
                      className="relative group bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-1"
                      style={{
                        border: `1.5px solid ${isPending ? '#fcd34d' : isOccupied ? '#c7d2fe' : '#e2e8f0'}`,
                        boxShadow: isPending ? '0 4px 20px rgb(245 158 11 / .15)' : isOccupied ? '0 4px 20px rgb(79 70 229 / .1)' : '0 1px 4px rgb(0 0 0 / .04)',
                      }}
                    >
                      {isPending && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase z-10" style={{ background:'#f59e0b', color:'#fff' }}>⚡ NEW</span>}
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-[18px] group-hover:scale-105 transition-transform" style={{ background: isPending?'linear-gradient(135deg,#fef3c7,#fde68a)':isOccupied?'linear-gradient(135deg,#eef2ff,#e0e7ff)':'linear-gradient(135deg,#f8fafc,#f1f5f9)', color:isPending?'#b45309':isOccupied?'#4338ca':'#94a3b8', border:`1.5px solid ${isPending?'#fcd34d':isOccupied?'#c7d2fe':'#e2e8f0'}` }}>
                        {table.table_number}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">{table.capacity} seats</p>
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background:isPending?'#fef3c7':isOccupied?'#eef2ff':'#f8fafc', color:isPending?'#b45309':isOccupied?'#4338ca':'#94a3b8', border:`1px solid ${isPending?'#fcd34d':isOccupied?'#c7d2fe':'#e2e8f0'}` }}>
                          {isPending ? '⚡ Pending' : table.status}
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
        <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">

          {/* ── LEFT: Menu ── */}
          <div className="flex-[1.6] flex flex-col border-r border-slate-200 h-full" style={{ background: '#f8fafc' }}>

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

            {/* Menu grid */}
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories
                  .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                  .flatMap(cat => cat.menu_items)
                  .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="group bg-white rounded-2xl border border-slate-200 p-4 flex flex-col text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300"
                        style={{ boxShadow: inCart ? '0 0 0 2px #6366f1, 0 4px 12px rgb(79 70 229 / .15)' : undefined, borderColor: inCart ? '#6366f1' : undefined }}
                        disabled={!item.is_available}
                      >
                        <div className="flex justify-between items-start mb-2 w-full gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2.5 h-2.5 shrink-0 rounded-sm border-2 flex items-center justify-center ${item.is_veg ? 'border-emerald-500' : 'border-rose-500'}`}>
                              <div className={`w-1 h-1 rounded-sm ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </div>
                            <h4 className="text-[13px] font-semibold text-slate-800 truncate">{item.name}</h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {inCart && (
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                                {inCart.quantity}
                              </span>
                            )}
                            <span className="text-[13px] font-bold text-slate-700">₹{item.price}</span>
                          </div>
                        </div>
                        {item.description && <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>}
                        {!item.is_available && <span className="mt-2 text-[10px] font-bold text-rose-500 uppercase">Unavailable</span>}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Cart / Order Ticket ── */}
          <div className="flex-1 flex flex-col h-full lg:min-w-[380px] bg-white">

            {/* Cart header */}
            <div className="h-[60px] px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-indigo-600" />
                <h3 className="font-bold text-[15px] text-slate-900">
                  {selectedTable ? `Table ${selectedTable.table_number}` : 'Order Ticket'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {editingOrderId && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">Editing</span>}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: cart.length ? '#eef2ff' : '#f8fafc', color: cart.length ? '#4338ca' : '#94a3b8', border: `1px solid ${cart.length ? '#c7d2fe' : '#e2e8f0'}` }}>
                  {cart.length} items
                </span>
              </div>
            </div>

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
                                <p key={idx} className="text-[12px]" style={{ color: st.text }}>
                                  <span className="font-bold">{item.quantity}×</span> {item.menu_item?.name || 'Item'}
                                </p>
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
                      <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-[13px] text-slate-800">{item.name}</h4>
                            <p className="text-[11px] text-indigo-600 font-bold">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"><Minus size={11} className="text-slate-600" /></button>
                            <span className="text-[13px] font-bold text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-indigo-50 transition-colors"><Plus size={11} className="text-indigo-600" /></button>
                          </div>
                        </div>
                        <input
                          placeholder="Chef notes (optional)..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                          value={item.notes}
                          onChange={e => updateNotes(item.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500 font-medium">Draft Total</span>
                <span className="text-[20px] font-extrabold text-slate-900 tracking-tight">₹{totalAmount}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={cart.length > 0 ? { background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', boxShadow: '0 4px 16px rgb(79 70 229 / .4)' } : { background: '#f1f5f9', color: '#94a3b8' }}
              >
                <Send size={15} />
                {editingOrderId ? 'Update Order' : 'Send to Kitchen'}
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
                      <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background:'#fffbeb', color:'#b45309', border:'1px solid #fcd34d' }}>
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
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px]" style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', color:'#b45309', border:'1px solid #fcd34d' }}>
                                  T{tNum}
                                </div>
                                <div>
                                  <p className="font-bold text-[14px] text-slate-800">Order #{order.id.slice(0,6)}</p>
                                  <p className="text-[11px] font-semibold text-amber-600">Customer Request</p>
                                </div>
                              </div>
                              <span className="font-extrabold text-[16px] text-slate-800">₹{order.total_amount}</span>
                            </div>
                            <div className="space-y-1 pb-4 mb-4 border-b border-dashed border-amber-200">
                              {order.items?.map((item, idx) => (
                                <p key={idx} className="text-[12px] text-slate-600"><span className="font-bold text-slate-800">{item.quantity}×</span> {item.menu_item?.name||'Item'}{item.notes && <span className="text-amber-600 ml-1 italic">({item.notes})</span>}</p>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleRejectOrder(order.id)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Reject</button>
                              <button onClick={() => handleAcceptOrder(order.id)} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 2px 8px rgb(245 158 11 / .4)' }}>
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
                      <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background:'#eef2ff', color:'#4338ca', border:'1px solid #c7d2fe' }}>
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
                                  <p className="font-bold text-[14px] text-slate-800">#{order.id.slice(0,6)}</p>
                                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-[16px] text-slate-800">₹{order.total_amount}</span>
                            </div>
                            <div className="space-y-1 pb-3 mb-3 border-b border-dashed" style={{ borderColor: st.border }}>
                              {order.items?.map((item, idx) => (
                                <p key={idx} className="text-[12px] text-slate-600"><span className="font-bold">{item.quantity}×</span> {item.menu_item?.name||'Item'}</p>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              {order.status === 'READY' && (
                                <button onClick={() => handleServeOrder(order.id)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 2px 8px rgb(16 185 129 / .4)' }}>
                                  ✓ Mark Served
                                </button>
                              )}
                              {order.status === 'SERVED' && (
                                <button onClick={() => handleStartCheckout(order)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow:'0 2px 8px rgb(79 70 229 / .4)' }}>
                                  💳 Checkout
                                </button>
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
            { id: 'status', Icon: Clock,      label: 'Orders', badge: activeOrders.filter(o=>o.status!=='SERVED').length },
          ].map(({ id, Icon, label, badge }) => (
            <button key={id} onClick={() => setView(id as any)} className="flex flex-col items-center gap-1 relative px-6">
              <div className="relative">
                <Icon size={20} className={view===id ? 'text-indigo-600' : 'text-slate-400'} />
                {badge && badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">{badge}</span>}
              </div>
              <span className={`text-[10px] font-bold ${view===id?'text-indigo-600':'text-slate-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── CHECKOUT MODAL ── */}
      {checkoutModalOpen && billDetails && checkoutOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(8px)' }}>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden" style={{ animation: 'zoomIn95 .18s ease both' }}>

            {/* Header gradient */}
            <div className="px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">Checkout</p>
                  <h2 className="text-[22px] font-extrabold text-white tracking-tight mt-0.5">Table {selectedTable?.table_number}</h2>
                </div>
                <button onClick={() => !isProcessingPayment && setCheckoutModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <X size={15} />
                </button>
              </div>
              {/* Bill summary */}
              <div className="mt-4 bg-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-[13px] text-indigo-200"><span>Subtotal</span><span>₹{billDetails.subtotal}</span></div>
                <div className="flex justify-between text-[13px] text-indigo-200"><span>Tax</span><span>₹{billDetails.tax_amount}</span></div>
                <div className="h-px bg-white/20 my-1" />
                <div className="flex justify-between text-white font-extrabold text-[18px]"><span>Total</span><span>₹{billDetails.total_amount}</span></div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment methods */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'CASH', Icon: Wallet, label: 'Cash' },
                    { id: 'CARD', Icon: CreditCard, label: 'Card' },
                    { id: 'UPI',  Icon: Smartphone, label: 'UPI' },
                  ] as const).map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className="py-3 rounded-2xl flex flex-col items-center gap-1.5 text-[11px] font-bold transition-all"
                      style={paymentMethod === id
                        ? { background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'#fff', boxShadow:'0 2px 8px rgb(79 70 229 / .4)' }
                        : { background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }
                      }
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI QR */}
              {paymentMethod === 'UPI' && upiId && (
                <div className="flex flex-col items-center rounded-2xl p-4" style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=BARKAT&am=${billDetails.total_amount}&cu=INR`)}`}
                    alt="UPI QR"
                    className="w-36 h-36 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-2">{upiId}</p>
                </div>
              )}

              <button
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', boxShadow:'0 4px 16px rgb(16 185 129 / .4)' }}
              >
                {isProcessingPayment ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
