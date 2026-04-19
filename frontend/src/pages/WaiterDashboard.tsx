import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ChevronLeft, Plus, Minus, Send, 
  Search, Trash2, Loader2, UtensilsCrossed,
  LayoutGrid, Coffee, CircleDot, Clock,
  RefreshCcw, AlertCircle, Edit2, QrCode
} from 'lucide-react';
import { waiterApi } from '../api/waiter';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id: string;
  is_veg: boolean;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  category: string;
  status?: 'Free' | 'Occupied' | 'Ordering';
}

interface CartItem extends MenuItem {
  quantity: number;
  notes: string;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order_time: number;
  subtotal?: number;
  notes?: string;
  menu_item?: { name: string; price: number };
}

interface Order {
  id: string;
  table_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED';
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
  source?: 'CUSTOMER' | 'WAITER';
  is_accepted?: boolean;
}

const WaiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'tables' | 'order' | 'status'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Checkout States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [billDetails, setBillDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CARD'|'UPI'>('CASH');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiId, setUpiId] = useState<string | null>(null);

  const fetchOrdersOnly = async () => {
    try {
      const ordersData = await waiterApi.getAllOrders();
      setActiveOrders(ordersData);
      setTables(prev => prev.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      })));
    } catch (error) {
      // silent poll fail
    }
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      fetchOrdersOnly();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tablesData, menuData, ordersData, upiData] = await Promise.all([
        waiterApi.getTables(),
        waiterApi.getMenu(),
        waiterApi.getAllOrders(),
        waiterApi.getUpiId()
      ]);
      
      // Map table status based on active orders
      const enrichedTables = tablesData.map((t: any) => ({
        ...t,
        status: ordersData.some((o: any) => o.table_id === t.id && o.status !== 'SERVED') ? 'Occupied' : 'Free',
        hasPendingCustomerOrder: ordersData.some((o: any) => o.table_id === t.id && o.source === 'CUSTOMER' && o.status === 'PENDING')
      }));

      setTables(enrichedTables);
      setCategories(menuData);
      setActiveOrders(ordersData);
      if (upiData && upiData.upi_id) {
         setUpiId(upiData.upi_id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setView('order');
    setCart([]);
    setEditingOrderId(null);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    toast.success(`${item.name} added`, { position: 'bottom-center' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    try {
      if (editingOrderId) {
        await waiterApi.updateOrderItems(editingOrderId, cart.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity,
          notes: i.notes
        })));
        toast.success("Order updated successfully!");
        setEditingOrderId(null);
      } else {
        const orderData = {
          table_id: selectedTable.id,
          items: cart.map(i => ({
            menu_item_id: i.id,
            quantity: i.quantity,
            notes: i.notes
          }))
        };

        await waiterApi.placeOrder(orderData);
        toast.success('Order sent to kitchen!');
      }
      setView('status'); // Redirect to status after order
      fetchInitialData();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail[0]?.msg : detail || 'Failed to process order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to completely delete this order?")) return;
    try {
      await waiterApi.deleteOrder(orderId);
      toast.success("Order deleted successfully!");
      if (editingOrderId === orderId) {
        setCart([]);
        setEditingOrderId(null);
      }
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete order");
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    const orderItems: CartItem[] = order.items?.map(i => ({
      id: i.menu_item_id,
      name: i.menu_item?.name || 'Unknown Item',
      price: i.price_at_order_time,
      quantity: i.quantity,
      notes: i.notes || '',
      category_id: '',
      is_veg: false,
      is_available: true
    })) || [];
    setCart(orderItems);
    toast("Drafting edits for Order #" + order.id.slice(0,4), { icon: '📝' });
  };

  const handleServeOrder = async (orderId: string) => {
    try {
      await waiterApi.updateOrderStatus(orderId, 'SERVED');
      toast.success('Order marked as SERVED!');
      fetchOrdersOnly();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to serve order');
    }
  };

  const handleStartCheckout = async (order: Order) => {
    try {
      const bill = await waiterApi.generateBill(order.id, 'CASH', 0);
      setCheckoutOrder(order);
      setBillDetails(bill);
      setPaymentMethod('CASH');
      setCheckoutModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate bill');
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutOrder) return;
    setIsProcessingPayment(true);
    try {
      await waiterApi.confirmPayment(checkoutOrder.id, paymentMethod === 'CASH' ? undefined : `TRX-${Date.now()}`);
      toast.success('Payment confirmed! Table cleared.');
      setCheckoutModalOpen(false);
      setCheckoutOrder(null);
      setBillDetails(null);
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await waiterApi.acceptOrder(orderId);
      toast.success('Order accepted! Sent to kitchen.');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to reject this order?")) return;
    try {
      await waiterApi.updateOrderStatus(orderId, 'CANCELLED');
      toast.success('Order rejected.');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reject order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'ACCEPTED': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'PREPARING': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'READY': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'SERVED': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  if (loading && view === 'tables') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* Global CSS for Animations */}
      <style>{`
        @keyframes pulse-rose {
          0%, 100% { border-color: rgba(244, 63, 94, 0.3); box-shadow: 0 0 0 rgba(244, 63, 94, 0); }
          50% { border-color: rgba(244, 63, 94, 0.8); box-shadow: 0 0 15px rgba(244, 63, 94, 0.4); }
        }
        .animate-pulse-rose {
          animation: pulse-rose 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            {view === 'order' && (
              <button 
                onClick={() => setView('tables')}
                className="p-2 hover:bg-white/5 rounded-full transition-colors mr-1"
              >
                <ChevronLeft size={24} />
              </button>
            )}
             {localStorage.getItem('restaurantLogo') ? (
               <img 
                 src={localStorage.getItem('restaurantLogo') || ''} 
                 alt="Logo" 
                 className="w-10 h-10 rounded-xl object-cover border border-white/10"
               />
             ) : (
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-bold">
                {localStorage.getItem('restaurantName')?.charAt(0) || 'B'}
              </div>
             )}
            <h1 className="text-xl font-bold tracking-tight">
              {localStorage.getItem('restaurantName') || 'BARKAT'}
              <span className="text-slate-500 text-sm ml-3 font-medium hidden sm:inline">
                {view === 'tables' && 'Waiter Station'}
                {view === 'order' && `Ordering: Table ${selectedTable?.table_number}`}
                {view === 'status' && 'Active Orders'}
              </span>
            </h1>
          </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('status')}
            className={`hidden md:flex flex-row items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${view === 'status' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            <Clock size={16} />
            Orders Status
          </button>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 uppercase">Status</span>
            <span className="text-sm font-semibold text-cyan-400">Online</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      {view === 'tables' && (
        <div className="flex-grow p-6 animate-fade-in pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Incoming Orders Section (Prominent at Top) */}
            {activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING').length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-rose-500 flex items-center gap-2">
                    <AlertCircle size={20} className="animate-pulse" /> 
                    Incoming Orders
                  </h3>
                  <span className="bg-rose-500/20 text-rose-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    ACTION REQUIRED
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING').map(order => {
                    const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || '??';
                    return (
                      <div key={order.id} className="glass-panel p-5 border-rose-500/30 animate-pulse-rose flex justify-between items-center group">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-lg">
                            T{tableNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold">Order #{order.id.slice(0, 4)}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1">
                              {order.items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleRejectOrder(order.id)}
                            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-bold transition-all active:scale-95 border border-white/5"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Table Layout</h2>
                <p className="text-slate-500 text-sm">Select a table to start a new order or manage existing ones.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500/50"></div>
                  <span className="text-slate-400">Free</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-pink-500/20 border border-pink-500/50"></div>
                  <span className="text-slate-400">Occupied</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  className={`
                    glass-panel p-8 flex flex-col items-center justify-center gap-4 
                    transition-all duration-300 hover:-translate-y-1 group relative
                    ${(table as any).hasPendingCustomerOrder ? 'border-rose-500/50 animate-pulse-rose' : table.status === 'Occupied' ? 'border-pink-500/30' : 'border-cyan-500/10 hover:border-cyan-500/40'}
                  `}
                >
                  {(table as any).hasPendingCustomerOrder && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-tighter shadow-lg z-10 animate-bounce">
                      NEW ORDER
                    </div>
                  )}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110
                    ${(table as any).hasPendingCustomerOrder ? 'bg-rose-500/10' : table.status === 'Occupied' ? 'bg-pink-500/10' : 'bg-cyan-500/10'}
                  `}>
                    <UtensilsCrossed 
                      size={32} 
                      className={(table as any).hasPendingCustomerOrder ? 'text-rose-500' : table.status === 'Occupied' ? 'text-pink-500' : 'text-cyan-400'} 
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-bold mb-1 block">T-{table.table_number}</span>
                    <div className="flex items-center gap-2 text-slate-500 text-xs justify-center">
                      <Users size={12} />
                      <span>{table.capacity} Seats</span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        table.category === 'AC' 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-white/5'
                      }`}>
                        {table.category}
                      </span>
                    </div>
                  </div>
                  <div className={`
                    mt-2 py-1 px-4 rounded-full text-[10px] uppercase font-bold tracking-widest
                    ${(table as any).hasPendingCustomerOrder ? 'bg-rose-500 text-white' : table.status === 'Occupied' ? 'bg-pink-500/20 text-pink-500' : 'bg-cyan-500/20 text-cyan-400'}
                  `}>
                    {(table as any).hasPendingCustomerOrder ? 'PENDING' : table.status}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'order' && (
        <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Menu Section */}
          <div className="flex-[1.5] flex flex-col border-r border-white/5 h-full">
            <div className="p-4 border-b border-white/5 space-y-4 bg-white/[0.01]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-cyan-500/50 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 md:pb-4">
                {categories
                  .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                  .flatMap(cat => cat.menu_items)
                  .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="glass-panel p-4 flex gap-4 text-left hover:border-cyan-500/30 transition-all group active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                         {item.is_veg ? <CircleDot className="text-green-500" size={24} /> : <CircleDot className="text-red-500" size={24} />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{item.name}</h4>
                          <span className="font-bold text-cyan-400">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="flex-1 bg-white/[0.01] flex flex-col h-full lg:min-w-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 size={18} className="text-slate-500" />
                <h3 className="font-bold text-lg">Order Summary</h3>
              </div>
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                {cart.length} ITEMS
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* SHOW EXISTING TABLE ORDERS */}
              {(() => {
                const tableActiveOrders = activeOrders.filter(o => o.table_id === selectedTable?.id && o.status !== 'SERVED');
                if (tableActiveOrders.length === 0) return null;
                return (
                  <div className="mb-6 space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Placed Orders</h4>
                    {tableActiveOrders.map(order => (
                      <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <span className="font-bold text-sm block">Order #{order.id.slice(0, 4)}</span>
                            <span className="text-[10px] text-slate-500 uppercase">Total: ₹{order.total_amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.status !== 'SERVED' && (
                              <>
                                <button onClick={() => handleEditOrder(order)} className="p-1 hover:bg-white/10 rounded text-cyan-400 transition-colors">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteOrder(order.id)} className="p-1 hover:bg-white/10 rounded text-rose-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            <span className={`text-[10px] uppercase font-black px-2 py-1 rounded bg-black/40 border border-white/10 ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 bg-black/20 p-2 rounded-xl border border-white/5">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300">
                              <span><span className="text-slate-500 font-bold mr-1">{item.quantity}x</span> {item.menu_item?.name || 'Item'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="h-px w-full bg-white/10 my-4"></div>
                  </div>
                );
              })()}

              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mt-4">Draft New Items</h4>
              {cart.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <UtensilsCrossed size={32} className="mb-4" />
                  <p className="text-sm">No new items in draft</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-xs text-slate-500">₹{item.price} per unit</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-cyan-400 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea 
                      placeholder="Add special instructions..." 
                      className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs outline-none focus:border-cyan-500/20 resize-none h-12"
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/40 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service Charges</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/5">
                  <span className="text-gradient">Total</span>
                  <span className="text-cyan-400">₹{totalAmount}</span>
                </div>
              </div>

              <button 
                onClick={placeOrder}
                disabled={cart.length === 0}
                className={`
                  w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all
                  ${cart.length > 0 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20 active:scale-95' 
                    : 'bg-white/5 text-slate-600 cursor-not-allowed shadow-none'}
                `}
              >
                <Send size={20} />
                {editingOrderId ? "Update Order" : "Send to Kitchen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'status' && (
        <div className="flex-grow p-6 animate-fade-in relative pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Active Orders</h2>
                <p className="text-slate-500 text-sm">Monitor table orders in real-time.</p>
              </div>
              <button 
                onClick={fetchInitialData}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No active orders</p>
                <p className="text-sm">Orders placed will appear here.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Incoming Orders Section (Repeat for visibility in Status view) */}
                {activeOrders.filter(o => o.status === 'PENDING').length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
                      <AlertCircle size={20} /> Incoming Customer Orders
                    </h3>
                    <div className="space-y-4">
                      {activeOrders.filter(o => o.status === 'PENDING').map(order => {
                        const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || 'Unknown';
                        return (
                          <div key={order.id} className="glass-panel p-6 border-rose-500/30 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative overflow-hidden animate-pulse-rose">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                <span className="font-bold text-xl">T{tableNumber}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border text-rose-500 bg-rose-500/10 border-rose-500/20">
                                    NEW CUSTOMER ORDER
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-white">₹{order.total_amount}</span>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-4 space-y-1">
                                    {order.items.map((item, idx) => (
                                      <p key={idx} className="text-sm text-slate-300">
                                        <span className="text-slate-500">{item.quantity}x</span> {item.menu_item?.name || 'Item'} 
                                        {item.notes && <span className="text-slate-500 text-xs ml-2 italic">({item.notes})</span>}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                              <button 
                                onClick={() => handleRejectOrder(order.id)}
                                className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 transition-all active:scale-95"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleAcceptOrder(order.id)}
                                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                Accept Order
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accepted Orders Section */}
                {activeOrders.filter(o => o.status !== 'PENDING').length > 0 && (
                  <div>
                    {activeOrders.filter(o => o.status === 'PENDING').length > 0 && (
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">In Progress</h3>
                    )}
                    <div className="space-y-4">
                      {activeOrders.filter(o => o.status !== 'PENDING').map(order => {
                        const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || 'Unknown';
                        
                        return (
                          <div key={order.id} className="glass-panel p-6 border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                <span className="font-bold text-xl">T{tableNumber}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${order.source === 'CUSTOMER' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-white/5 text-slate-400'}`}>
                                    {order.source === 'CUSTOMER' ? 'Customer' : 'Waiter'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-white">₹{order.total_amount}</span>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-4 space-y-1">
                                    {order.items.map((item, idx) => (
                                      <p key={idx} className="text-sm text-slate-300">
                                        <span className="text-slate-500">{item.quantity}x</span> {item.menu_item?.name || 'Item'} 
                                        {item.notes && <span className="text-slate-500 text-xs ml-2 italic">({item.notes})</span>}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {order.status === 'READY' && (
                              <div className="flex flex-col md:flex-row w-full md:w-auto gap-3 shrink-0">
                                <button 
                                  onClick={() => handleServeOrder(order.id)}
                                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                  Mark Served
                                </button>
                              </div>
                            )}

                            {order.status === 'SERVED' && (
                              <div className="flex flex-col md:flex-row w-full md:w-auto gap-3 shrink-0">
                                <button 
                                  onClick={() => handleStartCheckout(order)}
                                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                  Checkout & Bill
                                </button>
                              </div>
                            )}

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

      {/* Footer / App-like Bottom Nav */}
      {(view === 'tables' || view === 'status') && (
        <div className="fixed bottom-0 w-full h-20 border-t border-white/5 bg-[#050505]/95 backdrop-blur-md flex items-center justify-around px-4 md:hidden z-50">
          <button 
             onClick={() => setView('tables')}
             className={`flex flex-col items-center gap-1 ${view === 'tables' ? 'text-cyan-400' : 'text-slate-600'}`}>
            <LayoutGrid size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tables</span>
          </button>
          <button 
             onClick={() => setView('status')}
             className={`flex flex-col items-center gap-1 ${view === 'status' ? 'text-cyan-400' : 'text-slate-600'}`}>
            <Coffee size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && billDetails && checkoutOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isProcessingPayment && setCheckoutModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in flex flex-col pt-10">
            <button onClick={() => !isProcessingPayment && setCheckoutModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
               <UtensilsCrossed size={20} className="rotate-45" />
            </button>
            
            <h2 className="text-2xl font-black text-center mb-6">Order #{checkoutOrder.id.slice(0,6)} Checkout</h2>
            
            <div className="bg-black/30 rounded-2xl p-6 border border-white/5 space-y-4 mb-6">
              <div className="flex justify-between text-sm text-slate-400">
                 <span>Subtotal</span>
                 <span>₹{billDetails.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                 <span>Tax Amount</span>
                 <span>₹{billDetails.tax_amount}</span>
              </div>
              <div className="h-px bg-white/5 my-2"></div>
              <div className="flex justify-between text-2xl font-black text-white">
                 <span>Total Due</span>
                 <span className="text-cyan-400">₹{billDetails.total_amount}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'CARD', 'UPI'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`py-3 rounded-xl font-bold transition-all border ${paymentMethod === method ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="flex flex-col items-center justify-center mb-6 animate-scale-up">
                {upiId ? (
                   <div className="bg-white p-4 rounded-3xl shadow-xl w-48 h-48 mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=BARKAT_RESTAURANT&am=${billDetails.total_amount}&cu=INR`)}`} 
                        alt="Scan to Pay" 
                        className="w-full h-full object-contain mix-blend-multiply" 
                      />
                   </div>
                ) : (
                   <div className="bg-white/5 p-4 rounded-3xl border border-white/10 w-48 h-48 mb-3 flex flex-col items-center justify-center text-slate-500 text-center">
                     <QrCode size={32} className="mb-2 opacity-50" />
                     <p className="text-xs font-bold px-2">UPI not configured in Owner Panel</p>
                   </div>
                )}
                <p className="text-xs font-black text-cyan-400 tracking-widest text-center">ASK CUSTOMER TO SCAN</p>
              </div>
            )}

            <button 
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none"
            >
              {isProcessingPayment ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Payment Received'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default WaiterDashboard;
