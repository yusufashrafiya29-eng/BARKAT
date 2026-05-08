import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  UtensilsCrossed, Plus, Minus, 
  ShoppingCart, AlertCircle, CheckCircle2, ChevronRight,
  Receipt, QrCode, X, Loader2, Zap, Sparkles, Box
} from 'lucide-react';

import { customerApi } from '../api/customer';
import toast from 'react-hot-toast';

const ModelViewer = 'model-viewer' as any;

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id: string;
  is_veg: boolean;
  is_available: boolean;
  image_url?: string;
  model_3d_url?: string;
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
  payment_status: 'PENDING' | 'PAID' | 'VERIFYING' | 'FAILED';
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

const CustomerMenu: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  
  const [tableInfo, setTableInfo] = useState<{ id: string, table_number: number, restaurant_id: string, restaurant_name: string, restaurant_logo: string | null, restaurant_upi_id: string | null, restaurant_gstin: string | null, restaurant_fssai: string | null } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [showUpsell, setShowUpsell] = useState<MenuItem | null>(null);

  const [customerView, setCustomerView] = useState<'menu' | 'bill'>('menu');
  const [arModelUrl, setArModelUrl] = useState<string | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRazorpayVerifying, setIsRazorpayVerifying] = useState(false);

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

    // Set up 3s polling for active orders and sync payment
    const interval = setInterval(async () => {
      try {
        const ordersData = await customerApi.getTableOrders(tableId);
        setTableOrders(ordersData);
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [tableId, isSuccess]);

  // Watch for changes in order statuses
  useEffect(() => {
    // If we are currently resolving a payment and it goes through successfully:
    const hasUnpaid = tableOrders.some(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING'));
    if (!hasUnpaid && isVerifying) {
      setIsVerifying(false);
      setIsRazorpayVerifying(false);
      setShowPaymentQR(false);
      toast.success('Payment Confirmed! 🎉');
    }
  }, [tableOrders, isVerifying]);

  const handleNotifyPayment = async () => {
    setIsVerifying(true);
    try {
        await customerApi.notifyPayment(tableId as string);
    } catch (e) {
        toast.error('Could not ping waiter. Keep screen open.');
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const { razorpay_order_id, razorpay_key_id, amount, currency } = await customerApi.createRazorpayOrder(tableId as string);
      
      const options = {
        key: razorpay_key_id,
        amount: amount,
        currency: currency,
        name: tableInfo?.restaurant_name || "MyRestro",
        description: `Payment for Table ${tableInfo?.table_number}`,
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          toast.success("Payment successful! Updating your bill...");
          setIsVerifying(true);
          setIsRazorpayVerifying(true);
          // PRIMARY: Directly confirm with backend — instant, no webhook needed
          try {
            await customerApi.confirmRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            // Immediately refresh orders to show PAID status
            const updatedOrders = await customerApi.getTableOrders(tableId as string);
            setTableOrders(updatedOrders);
          } catch (err) {
            // Fallback: polling will pick it up from webhook
            console.warn("Direct confirm failed, webhook will handle it:", err);
          }
        },
        prefill: {
          name: customerName,
          contact: customerPhone
        },
        theme: {
          color: "#4f46e5"
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (_response: any) {
        toast.error("Payment failed. Please try again or pay by cash.");
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to initialize payment.");
    }
  };

  const addToCart = (item: MenuItem, skipUpsell: boolean = false) => {
    if (!item.is_available) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    toast.success(`${item.name} added`, { position: 'top-center' });
    
    if (!skipUpsell) {
      const lowerName = item.name.toLowerCase();
      if ((lowerName.includes('burger') || lowerName.includes('pizza') || lowerName.includes('sandwich')) && !showUpsell) {
        let suggestion = null;
        for (const cat of categories) {
           suggestion = cat.menu_items.find(mi => mi.name.toLowerCase().includes('fries') || mi.name.toLowerCase().includes('coke') || mi.name.toLowerCase().includes('drink') || mi.name.toLowerCase().includes('shake'));
           if (suggestion) break;
        }
        if (suggestion) {
           setShowUpsell(suggestion);
        }
      }
    }
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
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + tipAmount;

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
        customer_phone: customerPhone ? `+${customerPhone.replace(/\D/g, '')}` : undefined,
        customer_name: customerName || undefined,
        tip_amount: tipAmount
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
            setTipAmount(0);
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
      {/* Hero Banner Header */}
      <header className="relative bg-white pb-6 rounded-b-[2rem] shadow-sm mb-2">
        {/* Cover Photo / Gradient Banner */}
        <div className="h-36 w-full overflow-hidden relative bg-slate-900">
          {(tableInfo?.restaurant_logo && !imageError) ? (
            <>
               <img 
                 src={tableInfo.restaurant_logo} 
                 alt="Cover" 
                 className="w-full h-full object-cover opacity-50 blur-[6px] scale-110"
                 onError={() => setImageError(true)}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-900 opacity-95"></div>
          )}
        </div>

        {/* Floating Avatar & Details */}
        <div className="px-5 relative -mt-12 flex flex-col items-center">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-xl flex items-center justify-center overflow-hidden mb-4 z-10 rotate-3 transform hover:rotate-0 transition-transform">
            {(tableInfo?.restaurant_logo && !imageError) ? (
              <img 
                src={tableInfo.restaurant_logo} 
                alt="Logo" 
                className="w-full h-full object-cover -rotate-3 hover:rotate-0 transition-transform"
              />
            ) : (
              <span className="text-indigo-600 font-black text-4xl -rotate-3">
                {(tableInfo?.restaurant_name || 'D').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h1 className="text-[22px] font-black tracking-tight text-slate-800 text-center leading-tight mb-2">
            {tableInfo?.restaurant_name || 'MyRestro Select'}
          </h1>
          
          <div className="flex items-center gap-2.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span>Table {tableInfo?.table_number}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-emerald-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live Menu</span>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      {customerView === 'menu' && (
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-slate-100 py-3 pl-5 transition-all">
        <div className="flex gap-2.5 overflow-x-auto pr-5 scrollbar-hide items-center pb-1">
          <button
            onClick={() => { setSelectedCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCategory === 'all' 
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-2' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
             <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-2' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
                      <div key={item.id} className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100 p-4 pb-5 flex flex-col gap-3 transition-colors group relative overflow-hidden">
                         <div className="flex justify-between items-start gap-4">
                           <div className="flex-grow min-w-0 pr-2">
                              <div className={`w-3.5 h-3.5 border p-[2px] rounded-sm flex items-center justify-center mb-1.5 ${item.is_veg ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                                <div className={`w-1.5 h-1.5 rounded flex-grow ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              </div>
                              <h3 className="font-bold text-[15px] leading-snug text-slate-800 mb-1">{item.name}</h3>
                              <span className="font-bold text-[14px] text-slate-700 block mb-2">₹{item.price}</span>
                              <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                           </div>
                           
                           {/* Right floating "Image" slot & Add button */}
                           <div className="shrink-0 w-[110px] flex flex-col items-center justify-end relative">
                              <div className="w-full h-[95px] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center overflow-hidden">
                                 {item.image_url ? (
                                   <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                 ) : (
                                   <span className="text-slate-300 font-bold text-4xl">{item.name.charAt(0)}</span>
                                 )}
                                 {item.model_3d_url && (
                                    <button 
                                      onClick={() => setArModelUrl(item.model_3d_url || null)}
                                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm shadow-lg border border-white/20 animate-pulse hover:bg-black/80"
                                      title="View in AR"
                                    >
                                      <Box size={14} className="text-emerald-400" />
                                    </button>
                                 )}
                              </div>
                              
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] z-10 shadow-lg rounded-xl">
                                {!item.is_available ? (
                                  <span className="flex w-full text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-2 rounded-xl justify-center shadow-sm">SOLDOUT</span>
                                ) : cartItem ? (
                                  <div className="flex items-center justify-between bg-white px-1.5 py-1.5 rounded-xl border border-indigo-100 shadow-md">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100"><Minus size={12} /></button>
                                    <span className="text-[13px] font-black w-6 text-center text-slate-800">{cartItem.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100"><Plus size={12} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => addToCart(item)} className="w-full bg-white border border-indigo-100 text-indigo-600 font-black tracking-wide rounded-xl px-2 py-1.5 text-[13px] shadow-md hover:bg-indigo-50 transition-colors uppercase">
                                    ADD
                                  </button>
                                )}
                              </div>
                           </div>
                         </div>
                      </div>
                    );
                   })}
                </div>
              </div>
            );
          })}
        <div className="mt-12 text-center pb-8 opacity-50 flex items-center justify-center gap-2">
           <Zap size={14} className="text-slate-400" />
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Powered by MyRestro</p>
        </div>
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
                <div className="mb-6 space-y-2 pb-4 border-b border-dashed border-slate-300">
                  <div className="flex justify-between text-[13px] text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span>₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + (o.subtotal_amount || o.total_amount), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-slate-500 font-medium">
                    <span>Taxes (GST)</span>
                    <span>₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + (o.tax_amount || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Cumulative Total</p>
                  <p className="text-3xl font-semibold tracking-tight">
                    ₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                  </p>
                  {tableInfo?.restaurant_gstin && (
                    <p className="text-[10px] text-slate-400 mt-2">GSTIN: {tableInfo.restaurant_gstin}</p>
                  )}
                  {tableInfo?.restaurant_fssai && (
                    <p className="text-[10px] text-slate-400">FSSAI: {tableInfo.restaurant_fssai}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowPaymentQR(true)}
                  disabled={tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0) === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full"
                >
                  <QrCode size={16} className="mr-2" /> {tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0) === 0 ? 'All Settled' : 'Pay Electronically'}
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
 
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 mb-1">
                  {[10, 20, 50].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setTipAmount(tipAmount === tip ? 0 : tip)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${tipAmount === tip ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                    >
                      +₹{tip} Tip
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="Your Name (optional)"
                  className="w-full bg-white border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[12px] border-slate-200 focus:border-indigo-400 shadow-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <div className="flex gap-2">
                  <input 
                    type="tel"
                    placeholder="WhatsApp number (optional)"
                    className="w-full bg-white border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[12px] border-slate-200 focus:border-indigo-400 shadow-sm flex-grow"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <button 
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center text-[12px] whitespace-nowrap min-w-[120px]"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : <>Place Order <ChevronRight size={14} className="ml-1" /></>}
                  </button>
                </div>
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

      {/* Payment QR / UPI Deep Link Modal */}
      {showPaymentQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowPaymentQR(false); setIsVerifying(false); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
            >
              <X size={18} />
            </button>

            {isVerifying ? (
              <div className="flex flex-col items-center text-center py-8">
                 <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                   {isRazorpayVerifying
                     ? <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                     : <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                   }
                 </div>
                 <h3 className="text-[18px] font-semibold mb-2">
                   {isRazorpayVerifying ? 'Payment Successful! ✅' : 'Waiting for Confirmation'}
                 </h3>
                 <p className="text-[13px] text-slate-500 leading-relaxed max-w-[220px]">
                   {isRazorpayVerifying
                     ? 'Your payment was received. Your bill is being updated automatically. This will refresh in a few seconds.'
                     : 'Please ask your waiter to confirm the payment on their screen.'
                   }
                 </p>
                 {isRazorpayVerifying && (
                   <div className="mt-4 flex items-center gap-2 text-[12px] text-indigo-500">
                     <Loader2 className="w-3 h-3 animate-spin" />
                     Syncing with server...
                   </div>
                 )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <h3 className="text-[18px] font-semibold mb-2 mt-4">Pay & Settle</h3>
                <p className="text-[12px] text-slate-500 mb-6 leading-relaxed px-4">Choose your preferred payment method.</p>
                
                <div className="w-full bg-slate-50 border border-slate-200 rounded p-4 mb-6">
                   <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Due Amount</p>
                   <p className="text-[20px] font-semibold text-slate-800">
                     ₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0)}
                   </p>
                </div>
   
                <button 
                  onClick={handleRazorpayPayment}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-[14px] text-center mb-3 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Pay Online (Razorpay)
                </button>
  
                <button 
                  onClick={handleNotifyPayment}
                  className="w-full bg-white border border-indigo-200 text-indigo-700 font-bold py-3 px-4 rounded-xl text-[14px] text-center mb-6 hover:bg-indigo-50 transition-colors"
                >
                  Pay by Cash
                </button>
   
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Powered by MyRestro</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Upselling Modal */}
      {showUpsell && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
            <button onClick={() => setShowUpsell(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"><X size={16} /></button>
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-indigo-100">
              <Sparkles size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-800 mb-2">Want to add {showUpsell.name}?</h3>
            <p className="text-[13px] text-slate-500 mb-6">Complete your meal for just ₹{showUpsell.price} more!</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpsell(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">No, thanks</button>
              <button 
                onClick={() => {
                  addToCart(showUpsell, true);
                  setShowUpsell(null);
                }} 
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AR Model Viewer Modal */}
      {arModelUrl && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <button 
            onClick={() => setArModelUrl(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-2 rounded-full z-10"
          >
            <X size={24} />
          </button>
          
          <div className="w-full h-full max-w-lg mx-auto relative flex flex-col items-center justify-center">
            <ModelViewer
              src={arModelUrl}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              environment-image="neutral"
              exposure="1"
              style={{ width: '100%', height: '70vh' }}
            >
              <div slot="poster" className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
              </div>
            </ModelViewer>
            
            <div className="absolute bottom-10 left-0 w-full text-center px-6">
              <p className="text-white/70 text-sm mb-4">Swipe to rotate. Pinch to zoom.</p>
              <button 
                onClick={() => {
                   const mv = document.querySelector('model-viewer') as any;
                   if (mv && mv.activateAR) mv.activateAR();
                }}
                className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 mx-auto transition-transform active:scale-95"
              >
                <Box size={18} /> View on your table
              </button>
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
