import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  UtensilsCrossed, Plus, Minus, 
  ShoppingCart, AlertCircle, CheckCircle2, ChevronRight,
  Receipt, QrCode, X, Loader2
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
  
  const [tableInfo, setTableInfo] = useState<{ id: string, table_number: number, restaurant_id: string, restaurant_name: string, restaurant_logo: string | null } | null>(null);
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
        const tblData = await customerApi.getTableInfo(tableId);
        setTableInfo(tblData);

        const menuData = await customerApi.getMenu(tblData.restaurant_id);
        setCategories(menuData);

        const ordersData = await customerApi.getTableOrders(tableId);
        setTableOrders(ordersData);

        if (tblData.restaurant_name) document.title = `${tblData.restaurant_name} | Menu`;
        if (tblData.restaurant_logo) {
          const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = tblData.restaurant_logo;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      } catch (err: any) {
        setErrorHeader(err.response?.data?.detail || "Invalid Table Code");
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
    toast.success(`${item.name} added`, { position: 'top-center' });
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
          notes: i.notes
        })),
        customer_phone: customerPhone ? `+${customerPhone.replace(/\D/g, '')}` : undefined
      };

      await customerApi.placeOrder(payload);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin w-5 h-5 text-slate-500" />
      </div>
    );
  }
 
  if (errorHeader) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 text-center border-t-4 border-rose-500">
        <AlertCircle size={32} className="text-rose-500 mb-6" />
        <h1 className="text-xl font-semibold mb-2">{errorHeader}</h1>
        <p className="text-[13px] text-slate-500 max-w-xs mx-auto">Please scan a valid table QR code.</p>
      </div>
    );
  }
 
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded border border-emerald-500/30 flex items-center justify-center mb-8 bg-slate-50 text-emerald-500">
           <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl font-semibold mb-2 tracking-tight">Order received</h1>
        <p className="text-[13px] text-slate-500 mb-8 italic">T{tableInfo?.table_number}</p>
        <p className="text-[14px] text-slate-500 mb-12 max-w-xs mx-auto leading-relaxed border border-dashed border-slate-200 p-4 rounded-md">
          Your request was sent directly to the kitchen. Track updates in the bill tab.
        </p>
        <button 
          onClick={() => {
            setCart([]);
            setIsSuccess(false);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full max-w-xs text-[13px]"
        >
          Add More Items
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200 px-5 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
            {tableInfo?.restaurant_logo ? (
              <img 
                src={tableInfo.restaurant_logo} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed size={14} className="text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight truncate max-w-[150px]">
              {tableInfo?.restaurant_name || 'Restaurant'}
            </h1>
            <p className="text-[10px] text-slate-500">Digital Menu</p>
          </div>
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-center flex items-center gap-2">
          <p className="text-[10px] text-slate-500 font-medium uppercase">Table</p>
          <p className="text-[14px] font-semibold">{tableInfo?.table_number}</p>
        </div>
      </header>

      {/* Category Navigation */}
      {customerView === 'menu' && (
      <div className="sticky top-[60px] z-30 bg-white shadow-sm border-b border-slate-200 py-3 pl-5 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2 overflow-x-auto pr-5 scrollbar-hide">
          <button
            onClick={() => { setSelectedCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-4 py-1.5 rounded border text-[12px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-slate-50 text-slate-800 border-indigo-500' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:border-indigo-500'
            }`}
          >
            All Choices
          </button>
          {categories.map(cat => (
             <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-4 py-1.5 rounded border text-[12px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-slate-50 text-slate-800 border-indigo-500' 
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:border-indigo-500'
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
      <div className="p-5 space-y-10 pb-40">
        {categories
          .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
          .map(category => {
            const items = category.menu_items;
            if (items.length === 0) return null;
 
            return (
              <div key={category.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-[12px] font-medium text-slate-800 uppercase tracking-wider mb-4 px-1 flex items-center gap-3">
                  {category.name}
                  <div className="h-px bg-slate-50 flex-grow"></div>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(item => {
                    const cartItem = cart.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-4 transition-colors group">
                         <div className="shrink-0 pt-1">
                            <div className={`w-2.5 h-2.5 border p-[1px] rounded-sm flex items-center justify-center ${item.is_veg ? 'border-emerald-500' : 'border-rose-500'}`}>
                              <div className={`w-1 h-1 rounded flex-grow ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            </div>
                         </div>
                         <div className="flex-grow min-w-0">
                           <div className="flex justify-between items-start mb-1 gap-2">
                             <h3 className="font-semibold text-[14px] leading-snug truncate group-hover:text-primary transition-colors">{item.name}</h3>
                             <span className="font-semibold text-[14px] shrink-0">₹{item.price}</span>
                           </div>
                           <p className="text-[12px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                           
                           <div className="flex items-center justify-end mt-2">
                              {!item.is_available ? (
                                <span className="text-[10px] uppercase font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">SOLD OUT</span>
                              ) : cartItem ? (
                                <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded border border-slate-200">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-[13px] font-semibold w-5 text-center">{cartItem.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-5 h-5 flex items-center justify-center text-slate-800 hover:text-primary transition-colors"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center px-4 py-1.5 text-[12px]"
                                >
                                  Add
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
        <div className="p-5 pb-40 animate-in fade-in duration-300 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-dashed border-slate-200">
            <h2 className="text-[18px] font-semibold tracking-tight">Active Bills</h2>
          </div>
          
          {tableOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center border border-dashed border-slate-200">
              <p className="text-[13px] text-slate-500 mb-4">No active billing history.</p>
              <button 
                onClick={() => setCustomerView('menu')}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center px-6 py-2 text-[12px]"
              >
                Return to Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                {tableOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex justify-between items-start mb-4 border-b border-dashed border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[14px]">#{order.id.slice(0, 5)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border ${
                            ['PENDING', 'CANCELLED'].includes(order.status) ? 'bg-slate-50 text-slate-500 border-slate-200' :
                            ['SERVED', 'COMPLETED'].includes(order.status) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <span className="font-semibold text-[14px]">₹{order.total_amount}</span>
                    </div>
 
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[13px] text-slate-500">
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{item.quantity}x</span> 
                            {item.menu_item?.name || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
 
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 bg-slate-50 border border-indigo-500">
                <div className="text-center mb-6">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Cumulative Total</p>
                  <p className="text-3xl font-semibold tracking-tight">
                    ₹{tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowPaymentQR(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full"
                >
                  <QrCode size={16} className="mr-2" /> Pay Electronically
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && customerView === 'menu' && (
        <div className="fixed bottom-[60px] left-0 w-full p-4 z-40 animate-in slide-in-from-bottom-2 duration-300 pointer-events-none">
           <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 border border-indigo-500 p-4 pointer-events-auto flex flex-col gap-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
              
              <div className="flex justify-between items-center px-1 border-b border-dashed border-slate-200 pb-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center relative opacity-80">
                      <ShoppingCart size={14} className="text-slate-800" />
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-black text-[9px] w-4 h-4 rounded flex items-center justify-center font-bold">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Ticket Total</p>
                      <p className="text-[16px] font-semibold leading-none">₹{totalAmount}</p>
                    </div>
                 </div>
              </div>
 
              <div className="flex gap-2">
                <input 
                  type="tel"
                  placeholder="WhatsApp number (optional)"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[12px] py-2 flex-grow border-slate-200 focus:border-muted"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <button 
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center px-4 text-[12px] whitespace-nowrap min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : <>Place Order <ChevronRight size={14} className="ml-1" /></>}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full h-[60px] bg-slate-50 border-t border-slate-200 z-50 px-5 flex">
        <div className="max-w-md w-full mx-auto flex items-center justify-around h-full">
          <button 
            onClick={() => setCustomerView('menu')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-colors ${customerView === 'menu' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <UtensilsCrossed size={18} />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
          <button 
            onClick={() => setCustomerView('bill')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-colors relative ${customerView === 'bill' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tableOrders.length > 0 && <span className="absolute top-1 right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>}
            <Receipt size={18} />
            <span className="text-[10px] font-medium">Bill</span>
          </button>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowPaymentQR(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-[18px] font-semibold mb-2 mt-4">Scan & Pay</h3>
              <p className="text-[12px] text-slate-500 mb-6 leading-relaxed px-4">Pay instantly using any UPI client. Show confirmation to staff.</p>
              
              <div className="bg-white p-3 rounded mb-6 border border-slate-200">
                 <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=restaurant@upi&pn=Barkat&am=${tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}`)}`} 
                  alt="Payment QR" 
                  className="w-40 h-40"
                />
              </div>
 
              <div className="w-full bg-slate-50 border border-slate-200 rounded p-4 mb-6">
                 <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Due Amount</p>
                 <p className="text-[20px] font-semibold text-slate-800">₹{tableOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0)}</p>
              </div>
 
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Powered by BARKAT</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
