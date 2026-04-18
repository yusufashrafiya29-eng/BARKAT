import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  UtensilsCrossed, CircleDot, Plus, Minus, 
  ShoppingCart, AlertCircle, CheckCircle2, ChevronRight,
  Receipt, QrCode, X, Clock
} from 'lucide-react';
import { customerApi } from '../api/customer';
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

interface CartItem extends MenuItem {
  quantity: number;
  notes: string;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  price_at_order_time: number;
  menu_item?: { name: string; price: number };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

const CustomerMenu: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  
  const [tableInfo, setTableInfo] = useState<{ id: string, table_number: number, restaurant_id: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const [customerView, setCustomerView] = useState<'menu' | 'bill'>('menu');
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  useEffect(() => {
    if (!tableId) {
      setErrorHeader("Invalid Table QR Code");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Validate table exists and get number
        const tblData = await customerApi.getTableInfo(tableId);
        setTableInfo(tblData);

        // Fetch active menu
        const menuData = await customerApi.getMenu(tblData.restaurant_id);
        setCategories(menuData);

        // Fetch running orders for the bill
        const ordersData = await customerApi.getTableOrders(tableId);
        setTableOrders(ordersData);
      } catch (err: any) {
        setErrorHeader(err.response?.data?.detail || "Invalid Table or Error Loading Menu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId, isSuccess]);

  const addToCart = (item: MenuItem) => {
    if (!item.is_available) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    // Haptic feedback illusion using immediate tiny visual response via toast
    toast.success(`1x ${item.name} added`, { position: 'top-center', duration: 1500 });
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
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!tableInfo || cart.length === 0) return;

    try {
      setIsSubmitting(true);
      const payload = {
        table_id: tableInfo.id,
        items: cart.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity,
          notes: i.notes // Could implement a note modal later if needed
        })),
        customer_phone: customerPhone ? `+${customerPhone.replace(/\D/g, '')}` : undefined
      };

      await customerApi.placeOrder(payload);
      setIsSuccess(true);
    } catch (err: any) {
      // Show user-friendly rate limit or rejection errors directly from backend 
      toast.error(err.response?.data?.detail || 'Failed to place order. Please ask a waiter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-cyan-400">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium tracking-widest text-sm uppercase">Loading Menu...</p>
      </div>
    );
  }

  if (errorHeader) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-rose-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-4">{errorHeader}</h1>
        <p className="text-slate-400">Please scan the QR code on your table again or ask a staff member for assistance.</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-cyan-400/20 rounded-full flex items-center justify-center mb-8 relative">
           <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-20"></div>
           <CheckCircle2 size={48} className="text-cyan-400" />
        </div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">Order Placed!</h1>
        <p className="text-xl text-slate-300 mb-8 bg-white/5 px-6 py-2 rounded-full border border-white/10">Table {tableInfo?.table_number}</p>
        <p className="text-slate-400 mb-12 max-w-sm leading-relaxed">
          The kitchen has received your order and our chefs are getting to work.
        </p>
        <button 
          onClick={() => {
            setCart([]);
            setIsSuccess(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full max-w-sm py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all active:scale-95"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
             <UtensilsCrossed size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-[0.2em] text-gradient">BARKAT</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{categories.length} Categories Available</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/5 shadow-inner">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Table</p>
          <p className="text-xl font-bold leading-none text-white">{tableInfo?.table_number}</p>
        </div>
      </header>

      {/* Category Pills Slider */}
      {customerView === 'menu' && (
      <div className="sticky top-[73px] z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4 pl-4 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto pr-4 scrollbar-hide">
          <button
            onClick={() => { setSelectedCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
              selectedCategory === 'all' 
                ? 'bg-cyan-400 text-black shadow-cyan-400/20' 
                : 'bg-white/5 text-slate-300 border border-white/5'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
             <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                selectedCategory === cat.id 
                  ? 'bg-cyan-400 text-black shadow-cyan-400/20' 
                  : 'bg-white/5 text-slate-300 border border-white/5'
              }`}
             >
               {cat.name}
             </button>
          ))}
        </div>
      </div>
      )}

      {/* Main Content Area */}
      {customerView === 'menu' ? (
      <div className="p-4 space-y-6 pb-40">
        {categories
          .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
          .map(category => {
            const items = category.menu_items;
            if (items.length === 0) return null;

            return (
              <div key={category.id} className="animate-fade-in">
                <h2 className="text-xl font-black mb-4 tracking-tight flex items-center gap-2">
                  {category.name}
                  <span className="text-xs font-medium bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => {
                    const cartItem = cart.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 transition-colors hover:border-white/10 active:bg-white/10">
                         <div className="shrink-0 pt-1">
                            {item.is_veg ? <CircleDot className="text-green-500" size={18} /> : <CircleDot className="text-red-500" size={18} />}
                         </div>
                         <div className="flex-grow">
                           <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-lg leading-tight pr-4">{item.name}</h3>
                             <span className="font-black text-cyan-400 pt-0.5">₹{item.price}</span>
                           </div>
                           <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                           
                           <div className="flex items-center justify-between mt-auto">
                              {!item.is_available ? (
                                <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full">SOLD OUT</span>
                              ) : cartItem ? (
                                <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="text-base font-black w-4 text-center">{cartItem.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 rounded-lg transition-colors active:scale-95"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="px-6 py-2 bg-white/10 hover:bg-white/20 font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 text-cyan-400"
                                >
                                  ADD
                                </button>
                              )}
                           </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
      ) : (
        <div className="p-4 pb-40 animate-fade-in-up">
          <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-2">
            <Receipt className="text-cyan-400" /> My Bill
          </h2>
          
          {tableOrders.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-slate-400">
              <p>No active orders for this table yet.</p>
              <button 
                onClick={() => setCustomerView('menu')}
                className="mt-4 px-6 py-2 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {tableOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="font-bold block">Order #{order.id.slice(0, 4)}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest ${
                        ['PENDING', 'CANCELLED'].includes(order.status) ? 'bg-rose-500/20 text-rose-500' :
                        order.status === 'SERVED' ? 'bg-slate-500/20 text-slate-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-300">
                            <span className="text-slate-500 font-bold mr-2">{item.quantity}x</span> 
                            {item.menu_item?.name || 'Item'}
                          </span>
                          <span className="font-semibold text-slate-200">₹{item.price_at_order_time * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-sm font-medium text-slate-400">Order Total</span>
                      <span className="text-lg font-black text-white">₹{order.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-3xl p-6 shadow-xl shadow-cyan-900/20">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-sm text-cyan-400/80 font-bold tracking-widest uppercase mb-1">Total Outstanding</p>
                    <p className="text-4xl font-black text-white">
                      ₹{tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowPaymentQR(true)}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl text-white font-black text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-cyan-400/20"
                >
                  <QrCode size={20} /> Pay Via QR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Checkout Bar */}
      {/* Floating Cart Checkout Bar (Only on Menu) */}
      {cart.length > 0 && customerView === 'menu' && (
        <div className="fixed bottom-[80px] left-0 w-full p-4 z-40 animate-fade-in-up pointer-events-none">
           <div className="max-w-md mx-auto bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl p-4 pointer-events-auto flex flex-col gap-4">
              
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-3">
                    <div className="bg-cyan-400/20 w-10 h-10 rounded-full flex items-center justify-center relative">
                      <ShoppingCart size={18} className="text-cyan-400" />
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">To Pay</p>
                      <p className="text-xl font-black leading-none">₹{totalAmount}</p>
                    </div>
                 </div>
              </div>

              <div className="relative">
                <input 
                  type="tel"
                  placeholder="WhatsApp Number (optional)"
                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50 transition-colors placeholder:text-slate-500"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <button 
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl text-white font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-cyan-400/20"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Place Order <ChevronRight size={20} /></>
                )}
              </button>
           </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full h-[80px] bg-[#050505]/95 backdrop-blur-md border-t border-white/5 z-50 px-4 flex">
        <div className="max-w-md w-full mx-auto flex items-center justify-around h-full">
          <button 
            onClick={() => setCustomerView('menu')}
            className={`flex flex-col items-center justify-center gap-1 w-20 transition-colors ${customerView === 'menu' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <UtensilsCrossed size={24} className={customerView === 'menu' ? 'animate-bounce' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
          </button>
          <button 
            onClick={() => setCustomerView('bill')}
            className={`flex flex-col items-center justify-center gap-1 w-20 transition-colors relative ${customerView === 'bill' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tableOrders.length > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
            {tableOrders.length > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>}
            <Receipt size={24} className={customerView === 'bill' ? 'animate-bounce' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">My Bill</span>
          </button>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentQR && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl shadow-cyan-500/20">
            <button 
              onClick={() => setShowPaymentQR(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="p-8 pb-6 bg-gradient-to-b from-cyan-900/30 to-transparent flex flex-col items-center text-center">
              <QrCode className="text-cyan-400 mb-4" size={48} />
              <h3 className="text-2xl font-black mb-1">Pay Restaurant</h3>
              <p className="text-slate-400 text-sm mb-6">Scan QR with any UPI app to securely pay your bill directly to the owner.</p>
              
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner">
                {/* Simulated QR Code via API */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=restaurant@upi&pn=Barkat&am=${tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}`} 
                  alt="Payment QR" 
                  className="w-full h-auto aspect-square rounded-xl"
                />
              </div>

              <p className="text-lg font-bold text-slate-300">Amount: <span className="text-cyan-400 font-black text-2xl">₹{tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}</span></p>
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5 text-center">
               <p className="text-xs text-slate-500">Waiters will confirm payment upon successful transfer.</p>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Cart Animation */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CustomerMenu;
