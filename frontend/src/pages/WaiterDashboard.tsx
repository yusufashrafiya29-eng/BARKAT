import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Minus,
  Search, Trash2, Loader2,
  LayoutGrid, Clock,
  RefreshCcw, AlertCircle, Edit2
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
      setView('status');
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
      case 'PENDING': return 'text-amber-500 border-amber-500/30 bg-amber-500/5';
      case 'ACCEPTED': return 'text-primary border-primary/30 bg-primary/5';
      case 'PREPARING': return 'text-primary border-primary/30 bg-primary/5';
      case 'READY': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5';
      case 'SERVED': return 'text-slate-500 border-slate-200 bg-slate-100';
      default: return 'text-slate-500 border-slate-200 bg-slate-100';
    }
  };

  if (loading && view === 'tables') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Sleek Vercel-style Header */}
      <header className="h-[60px] border-b border-slate-200 bg-slate-50 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            {view !== 'tables' && (
              <button 
                onClick={() => setView('tables')}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors transition-all mr-1"
              >
                <ChevronLeft size={16} className="text-slate-800" />
              </button>
            )}
             <div className="w-6 h-6 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
               {localStorage.getItem('restaurantLogo') ? (
                 <img 
                   src={localStorage.getItem('restaurantLogo') || ''} 
                   alt="Logo" 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-3 h-3 bg-slate-50 rounded-sm"></div>
               )}
             </div>
             <div className="flex items-center gap-2 text-[14px]">
               <span className="font-medium tracking-tight text-slate-500 hidden sm:inline">
                 {localStorage.getItem('restaurantName') || 'BARKAT'}
               </span>
               <span className="hidden sm:inline text-slate-500">/</span>
               <span className="text-slate-800 font-medium capitalize">
                 {view === 'tables' && 'Floor Plan'}
                 {view === 'order' && `Table ${selectedTable?.table_number}`}
                 {view === 'status' && 'Active Orders'}
               </span>
             </div>
          </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('status')}
            className={`hidden md:flex flex-row items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${view === 'status' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Clock size={14} />
            Orders Status
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[12px] font-medium text-slate-500 hidden sm:inline">Online</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center border border-transparent hover:border-slate-200 transition-colors"
          >
            <LayoutGrid size={14} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      {view === 'tables' && (
        <div className="flex-grow p-8 animate-in fade-in pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Incoming Orders Section (Prominent at Top) */}
            {activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-semibold text-slate-800 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" /> 
                    Incoming Orders
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING').map(order => {
                    const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || '??';
                    return (
                      <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-amber-500/30 flex justify-between items-center group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50"></div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded border border-amber-500/20 bg-slate-50 flex items-center justify-center text-slate-800 font-semibold text-[15px]">
                            T{tableNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-[14px]">Order #{order.id.slice(0, 4)}</span>
                              <span className="text-[11px] text-slate-500 font-medium">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="text-[13px] text-slate-500 line-clamp-1">
                              {order.items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRejectOrder(order.id)}
                            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center px-3 py-1.5 text-[12px]"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-3 py-1.5 rounded-md text-[12px] transition-colors"
                          >
                            Accept
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
                <h2 className="text-2xl font-semibold tracking-tight mb-1">Floor Plan</h2>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full border border-slate-200"></div>
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-primary uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20"></div>
                  <span>Occupied</span>
                </div>
              </div>
            </div>
 
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  className={`
                    bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-3 
                    transition-colors group relative
                    ${(table as any).hasPendingCustomerOrder ? 'border-amber-500/50' : table.status === 'Occupied' ? 'border-primary/50' : 'hover:border-indigo-500'}
                  `}
                >
                  {(table as any).hasPendingCustomerOrder && (
                    <span className="absolute -top-2 px-1.5 py-0.5 border border-amber-500/30 bg-slate-100 text-amber-500 text-[10px] font-semibold rounded z-10 block">
                      NEW
                    </span>
                  )}
                  <div className={`
                    w-10 h-10 rounded border flex items-center justify-center transition-colors
                    ${(table as any).hasPendingCustomerOrder ? 'border-amber-500/30 bg-slate-50 text-amber-500' : table.status === 'Occupied' ? 'border-primary/30 bg-slate-50 text-primary' : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:text-slate-800'}
                  `}>
                    <span className="text-[16px] font-semibold">T{table.table_number}</span>
                  </div>
                  <div className="text-center w-full">
                     <p className="text-[11px] text-slate-500 mb-2">{table.capacity} Seats</p>
                     <div className={`
                       py-1 px-3 rounded text-[10px] font-medium border w-full
                       ${(table as any).hasPendingCustomerOrder ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : table.status === 'Occupied' ? 'border-primary/30 text-primary bg-primary/5' : 'border-slate-200 text-slate-500 bg-slate-100'}
                     `}>
                       {(table as any).hasPendingCustomerOrder ? 'Pending' : table.status}
                     </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'order' && (
        <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-60px)] overflow-hidden animate-in fade-in">
          {/* Menu Section */}
          <div className="flex-[1.5] flex flex-col border-r border-slate-200 h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Search catalog..." 
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-9 text-[13px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium whitespace-nowrap transition-colors border ${selectedCategory === 'all' ? 'bg-slate-50 text-slate-800 border-indigo-500' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'}`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat.id ? 'bg-slate-50 text-slate-800 border-indigo-500' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
 
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories
                  .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                  .flatMap(cat => cat.menu_items)
                  .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col text-left hover:border-indigo-500 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                           <div className={`w-2 h-2 shrink-0 border ${item.is_veg ? 'border-emerald-500' : 'border-rose-500'} p-0.5 rounded-sm flex items-center justify-center`}>
                               <div className={`w-1 h-1 rounded-sm ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                           </div>
                           <h4 className="text-[13px] font-medium text-slate-800 truncate pr-2">{item.name}</h4>
                        </div>
                        <span className="text-[13px] text-slate-500 shrink-0">₹{item.price}</span>
                      </div>
                      <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="flex-1 bg-slate-100 flex flex-col h-full lg:min-w-[380px]">
            <div className="h-[60px] px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-[15px]">Order Ticket</h3>
              <span className="text-[11px] border border-slate-200 bg-slate-50 text-slate-500 px-2 py-0.5 rounded font-medium">
                {cart.length} ITEMS
              </span>
            </div>
 
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              {/* Placed Orders */}
              {(() => {
                const tableActiveOrders = activeOrders.filter(o => o.table_id === selectedTable?.id && o.status !== 'SERVED');
                if (tableActiveOrders.length === 0) return null;
                return (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Orders</h4>
                    {tableActiveOrders.map(order => (
                      <div key={order.id} className="bg-slate-50 border border-indigo-500 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <span className="font-medium text-[13px]">#{order.id.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.status !== 'SERVED' && (
                              <div className="flex items-center gap-1.5 mr-1">
                                <button onClick={() => handleEditOrder(order)} className="p-1 text-slate-500 hover:text-slate-800 rounded">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleDeleteOrder(order.id)} className="p-1 text-slate-500 hover:text-rose-500 rounded">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                            <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[12px] text-slate-500">
                              <span><span className="font-medium text-slate-800 mr-1">{item.quantity}x</span> {item.menu_item?.name || 'Item'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="h-px bg-slate-100 w-full my-6"></div>
                  </div>
                );
              })()}
 
              <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Drafted Items</h4>
              {cart.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-md">
                  <p className="text-[12px] font-medium">Ticket is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[13px] text-slate-800">{item.name}</h4>
                          <p className="text-[12px] text-slate-500">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-[12px] font-medium min-w-[14px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <input 
                        placeholder="Add preparation notes..." 
                        className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-[12px] outline-none focus:border-muted transition-colors text-slate-800"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            <div className="p-5 border-t border-slate-200 bg-slate-100 shrink-0">
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-[13px] text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-[15px] font-medium text-slate-800 pt-2">
                  <span>Draft Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
 
              <button 
                onClick={placeOrder}
                disabled={cart.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full disabled:opacity-50"
              >
                {editingOrderId ? "Confirm Edits" : "Send Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'status' && (
        <div className="flex-grow p-8 animate-in fade-in pb-24 md:pb-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Queue Status</h2>
            </div>
            <button 
              onClick={fetchInitialData}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center text-[12px]"
            >
              <RefreshCcw size={14} className="mr-2" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-md bg-white rounded-xl shadow-sm border border-slate-200">
              <p className="text-[14px] font-medium">No active tickets.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {activeOrders.filter(o => o.status === 'PENDING').length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-amber-500 mb-4">Pending Acceptance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOrders.filter(o => o.status === 'PENDING').map(order => {
                      const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || 'Unknown';
                      return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-amber-500/30 flex flex-col gap-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/50"></div>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-slate-50 border border-amber-500/20 flex items-center justify-center text-slate-800 font-semibold text-[14px]">
                                T{tableNumber}
                              </div>
                              <div>
                                <h3 className="font-semibold text-[14px]">Order #{order.id.slice(0, 5)}</h3>
                                <span className="text-[11px] text-amber-500 font-medium">Customer Origin</span>
                              </div>
                            </div>
                            <span className="text-[13px] font-semibold">₹{order.total_amount}</span>
                          </div>
                          
                          <div className="space-y-1.5 border-t border-slate-200 pt-3">
                            {order.items?.map((item, idx) => (
                              <p key={idx} className="text-[13px] text-slate-500">
                                <span className="text-slate-800 font-medium">{item.quantity}x</span> {item.menu_item?.name || 'Item'} 
                                {item.notes && <span className="text-[11px] ml-2 italic">({item.notes})</span>}
                              </p>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => handleRejectOrder(order.id)}
                              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center flex-1 text-[12px]"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleAcceptOrder(order.id)}
                              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex-1 rounded-md text-[12px] transition-colors"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeOrders.filter(o => o.status !== 'PENDING').length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-4 mt-6">Ordered Tickets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOrders.filter(o => o.status !== 'PENDING').map(order => {
                      const tableNumber = tables.find(t => t.id === order.table_id)?.table_number || 'Unknown';
                      
                      return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-semibold text-[14px]">
                                T{tableNumber}
                              </div>
                              <div>
                                <h3 className="font-semibold text-[14px]">Order #{order.id.slice(0, 5)}</h3>
                                <span className={`px-2 py-0.5 mt-1 rounded text-[10px] uppercase font-medium border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            <span className="text-[13px] font-semibold">₹{order.total_amount}</span>
                          </div>
                          
                          <div className="space-y-1.5 border-t border-slate-200 border-dashed pt-3">
                            {order.items?.map((item, idx) => (
                              <p key={idx} className="text-[13px] text-slate-500">
                                <span className="text-slate-800 font-medium">{item.quantity}x</span> {item.menu_item?.name || 'Item'} 
                                {item.notes && <span className="text-[11px] ml-2 italic">({item.notes})</span>}
                              </p>
                            ))}
                          </div>

                          <div className="pt-2 flex justify-end gap-2">
                             {order.status === 'READY' && (
                                <button 
                                  onClick={() => handleServeOrder(order.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center text-[12px]"
                                >
                                  Mark Served
                                </button>
                             )}
                             {order.status === 'SERVED' && (
                                <button 
                                  onClick={() => handleStartCheckout(order)}
                                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center border-primary/30 text-primary hover:bg-primary/5 text-[12px]"
                                >
                                  Checkout Table
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
      )}

      {/* Mobile Nav */}
      {(view === 'tables' || view === 'status') && (
        <div className="fixed bottom-0 w-full h-[60px] border-t border-slate-200 bg-slate-100 flex items-center justify-around px-4 md:hidden z-50">
          <button 
             onClick={() => setView('tables')}
             className={`flex flex-col items-center gap-1.5 ${view === 'tables' ? 'text-slate-800' : 'text-slate-500'}`}>
            <LayoutGrid size={18} />
            <span className="text-[10px] font-medium">Tables</span>
          </button>
          <button 
             onClick={() => setView('status')}
             className={`flex flex-col items-center gap-1.5 ${view === 'status' ? 'text-slate-800' : 'text-slate-500'}`}>
            <Clock size={18} />
            <span className="text-[10px] font-medium">Status</span>
          </button>
        </div>
      )}

      {/* Flat Checkout Modal */}
      {checkoutModalOpen && billDetails && checkoutOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-50" onClick={() => !isProcessingPayment && setCheckoutModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <h2 className="text-[18px] font-semibold mb-1">T{selectedTable?.table_number} Checkout</h2>
            <p className="text-[12px] text-slate-500 mb-6">Order #{checkoutOrder.id.slice(0,6)}</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3 mb-6">
              <div className="flex justify-between text-[13px] text-slate-500">
                 <span>Subtotal</span>
                 <span>₹{billDetails.subtotal}</span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-500">
                 <span>Tax</span>
                 <span>₹{billDetails.tax_amount}</span>
              </div>
              <div className="h-px bg-slate-100 my-2 border-dashed"></div>
              <div className="flex justify-between text-[16px] font-medium text-slate-800">
                 <span>Total Due</span>
                 <span>₹{billDetails.total_amount}</span>
              </div>
            </div>
 
            <div className="space-y-2 mb-6">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'UPI'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`py-2 rounded text-[12px] font-medium transition-colors border ${paymentMethod === method ? 'bg-slate-50 text-slate-800 border-indigo-500' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
 
            {paymentMethod === 'UPI' && (
              <div className="flex flex-col items-center justify-center mb-6 animate-in fade-in">
                {upiId ? (
                   <div className="bg-white p-2 rounded border border-slate-200 mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=BARKAT_RESTAURANT&am=${billDetails.total_amount}&cu=INR`)}`} 
                        alt="Scan to Pay" 
                        className="w-32 h-32" 
                      />
                   </div>
                ) : (
                   <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-200 w-32 h-32 mb-3 flex items-center justify-center text-slate-500">
                     <p className="text-[11px] text-center">UPI not configured</p>
                   </div>
                )}
                <p className="text-[11px] text-slate-500 text-center max-w-[200px]">Scan with any UPI app to complete the transaction securely.</p>
              </div>
            )}
 
            <button 
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full"
            >
              {isProcessingPayment ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
