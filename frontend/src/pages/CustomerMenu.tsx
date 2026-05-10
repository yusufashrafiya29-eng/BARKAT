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
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'veg' | 'nonveg'>('all');

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
    <div className="min-h-screen bg-[#0f0f11] text-gray-200 pb-32 font-sans selection:bg-[#e6c27a]/30">
      {/* Hero Banner Header */}
      <header className="relative pb-6 mb-2">
        {/* Cover Photo / Gradient Banner */}
        <div className="h-40 w-full overflow-hidden relative bg-black">
          {(tableInfo?.restaurant_logo && !imageError) ? (
            <>
               <img 
                 src={tableInfo.restaurant_logo} 
                 alt="Cover" 
                 className="w-full h-full object-cover opacity-40 blur-[4px] scale-110"
                 onError={() => setImageError(true)}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] to-transparent"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1d] to-[#0f0f11]"></div>
          )}
        </div>

        {/* Brand details */}
        <div className="px-5 relative -mt-20 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#e6c27a] mb-2 font-medium">4D Smart Menu</p>
          <div className="w-20 h-20 rounded-full border border-[#e6c27a]/30 bg-[#1a1a1d] shadow-2xl flex items-center justify-center overflow-hidden mb-4 z-10">
            {(tableInfo?.restaurant_logo && !imageError) ? (
              <img 
                src={tableInfo.restaurant_logo} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#e6c27a] font-serif text-3xl">
                {(tableInfo?.restaurant_name || 'D').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h1 className="text-[26px] font-serif text-white text-center leading-tight mb-3">
            {tableInfo?.restaurant_name || 'The Golden Oak'}
          </h1>
          
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-widest text-gray-400 uppercase">
            <span>Table {tableInfo?.table_number}</span>
            <span className="w-1 h-1 rounded-full bg-[#e6c27a]"></span>
            <span className="text-[#e6c27a] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#e6c27a] animate-pulse"></div> Live</span>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      {customerView === 'menu' && (
      <div className="sticky top-0 z-50 bg-[#0f0f11]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-b border-white/5 py-3 pl-5 transition-all">
        <div className="flex gap-3 overflow-x-auto pr-5 scrollbar-hide items-center pb-2">
          <button
            onClick={() => { setSelectedCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-5 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
              selectedCategory === 'all' 
                ? 'bg-[#e6c27a] text-black shadow-[0_0_15px_rgba(230,194,122,0.3)]' 
                : 'bg-[#1a1a1d] text-gray-400 border border-white/5'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
             <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-5 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.id 
                  ? 'bg-[#e6c27a] text-black shadow-[0_0_15px_rgba(230,194,122,0.3)]' 
                  : 'bg-[#1a1a1d] text-gray-400 border border-white/5'
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
        
        {/* Diet Filters */}
        <div className="flex gap-2 mb-2 px-1">
           <button 
             onClick={() => setFilterType('all')} 
             className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${filterType === 'all' ? 'border-[#e6c27a] text-[#e6c27a]' : 'border-white/10 text-gray-500'}`}
           >
             All
           </button>
           <button 
             onClick={() => setFilterType('veg')} 
             className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${filterType === 'veg' ? 'border-emerald-500 text-emerald-500' : 'border-white/10 text-gray-500'}`}
           >
             <div className={`w-1.5 h-1.5 rounded-full ${filterType === 'veg' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div> Veg
           </button>
           <button 
             onClick={() => setFilterType('nonveg')} 
             className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${filterType === 'nonveg' ? 'border-rose-500 text-rose-500' : 'border-white/10 text-gray-500'}`}
           >
             <div className={`w-1.5 h-1.5 rounded-full ${filterType === 'nonveg' ? 'bg-rose-500' : 'bg-gray-500'}`}></div> Non-Veg
           </button>
        </div>

        {categories
          .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
          .map(category => {
            const items = category.menu_items.filter(item => {
               if (filterType === 'veg') return item.is_veg;
               if (filterType === 'nonveg') return !item.is_veg;
               return true;
            });
            if (items.length === 0) return null;
 
            return (
              <div key={category.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-[16px] font-serif text-white mb-4 px-1 flex items-center gap-3">
                  {category.name}
                  <div className="h-px bg-white/10 flex-grow"></div>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => {
                    const cartItem = cart.find(i => i.id === item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#1a1a1d] rounded-[24px] border border-white/5 p-3 flex gap-4 transition-colors relative overflow-hidden active:scale-[0.98] cursor-pointer"
                      >
                         {/* Left side circular image */}
                         <div className="shrink-0 w-24 h-24 rounded-full bg-black border border-white/5 flex items-center justify-center overflow-hidden relative">
                           {item.image_url ? (
                             <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-gray-700 font-serif text-3xl">{item.name.charAt(0)}</span>
                           )}
                           {item.model_3d_url && (
                              <div className="absolute bottom-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                                <span className="text-[8px] font-bold text-[#e6c27a] tracking-widest uppercase">3D/AR</span>
                              </div>
                           )}
                         </div>

                         {/* Right side details */}
                         <div className="flex-grow min-w-0 py-1 flex flex-col justify-center">
                            <div className="flex items-start justify-between mb-1">
                               <h3 className="font-semibold text-[15px] leading-tight text-white pr-2">{item.name}</h3>
                               <div className={`shrink-0 w-3.5 h-3.5 border p-[2px] rounded-sm flex items-center justify-center mt-0.5 ${item.is_veg ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-sm flex-grow ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                               </div>
                            </div>
                            
                            <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">{item.description || 'Delicious freshly prepared dish.'}</p>
                            
                            <div className="flex items-center gap-2 mb-2">
                               <span className="font-bold text-[14px] text-[#e6c27a]">₹{item.price}</span>
                               <span className="text-[11px] text-gray-600 line-through">₹{(item.price * 1.15).toFixed(0)}</span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                               <span className="flex items-center gap-1"><span className="text-rose-500">🌶️</span> Medium</span>
                               <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                               <span>~320 Cal</span>
                            </div>
                         </div>
                         
                         {/* Quick Add Button / Controls overlay */}
                         <div className="absolute right-3 bottom-3" onClick={(e) => e.stopPropagation()}>
                            {!item.is_available ? (
                              <span className="flex text-[10px] uppercase font-bold text-gray-600 bg-white/5 px-3 py-1.5 rounded-full">SOLDOUT</span>
                            ) : cartItem ? (
                              <div className="flex items-center justify-between bg-[#e6c27a] px-1 py-1 rounded-full w-24">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 text-black hover:bg-black/30"><Minus size={12} /></button>
                                <span className="text-[13px] font-black text-black">{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 text-black hover:bg-black/30"><Plus size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} className="bg-[#e6c27a] text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            )}
                         </div>
                      </div>
                    );
                   })}
                </div>
              </div>
            );
          })}
        <div className="mt-12 text-center pb-8 opacity-50 flex items-center justify-center gap-2">
           <Zap size={14} className="text-[#e6c27a]" />
           <p className="text-[10px] text-[#e6c27a] font-bold uppercase tracking-[0.2em]">Powered by MyRestro</p>
        </div>
      </div>
      ) : (
        <div className="p-5 pb-40 animate-in fade-in duration-300 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <h2 className="text-[18px] font-serif tracking-tight text-white">Active Bills</h2>
          </div>
          
          {tableOrders.length === 0 ? (
            <div className="bg-[#1a1a1d] rounded-2xl border border-white/5 p-8 text-center border-dashed">
              <p className="text-[13px] text-gray-500 mb-4">No active billing history.</p>
              <button 
                onClick={() => setCustomerView('menu')}
                className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-full px-6 py-2 text-[12px] font-bold tracking-wider uppercase transition-colors"
              >
                Return to Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                {tableOrders.map(order => (
                  <div key={order.id} className="bg-[#1a1a1d] rounded-2xl border border-white/5 p-5">
                    <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[14px] text-white">#{order.id.slice(0, 5)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            ['PENDING', 'CANCELLED'].includes(order.status) ? 'bg-white/5 text-gray-400 border-white/10' :
                            ['SERVED', 'COMPLETED'].includes(order.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-[#e6c27a]/10 text-[#e6c27a] border-[#e6c27a]/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <span className="font-bold text-[15px] text-[#e6c27a]">₹{order.total_amount}</span>
                    </div>
 
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[13px] text-gray-400">
                          <span className="flex items-center gap-3">
                            <span className="font-bold text-white w-5">{item.quantity}x</span> 
                            {item.menu_item?.name || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
 
              <div className="bg-gradient-to-br from-[#1a1a1d] to-[#0f0f11] rounded-2xl border border-[#e6c27a]/30 p-6 shadow-[0_0_20px_rgba(230,194,122,0.05)]">
                <div className="mb-6 space-y-3 pb-5 border-b border-white/10">
                  <div className="flex justify-between text-[13px] text-gray-400 font-medium">
                    <span>Subtotal</span>
                    <span className="text-white">₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + (o.subtotal_amount || o.total_amount), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-400 font-medium">
                    <span>Taxes (GST)</span>
                    <span className="text-white">₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + (o.tax_amount || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cumulative Total</p>
                  <p className="text-4xl font-serif text-[#e6c27a] tracking-tight">
                    ₹{tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                  </p>
                  {tableInfo?.restaurant_gstin && (
                    <p className="text-[10px] text-gray-600 mt-3">GSTIN: {tableInfo.restaurant_gstin}</p>
                  )}
                  {tableInfo?.restaurant_fssai && (
                    <p className="text-[10px] text-gray-600">FSSAI: {tableInfo.restaurant_fssai}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowPaymentQR(true)}
                  disabled={tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0) === 0}
                  className="bg-[#e6c27a] hover:bg-[#d4b068] disabled:bg-gray-700 disabled:text-gray-500 text-black rounded-full py-4 text-sm font-bold tracking-wider uppercase transition-colors shadow-[0_0_15px_rgba(230,194,122,0.2)] w-full flex items-center justify-center gap-2"
                >
                  <QrCode size={18} /> {tableOrders.filter(o => o.status !== 'CANCELLED' && (o.payment_status === 'PENDING' || o.payment_status === 'VERIFYING')).reduce((sum, o) => sum + o.total_amount, 0) === 0 ? 'All Settled' : 'Pay Electronically'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && customerView === 'menu' && !selectedItem && (
        <div className="fixed bottom-[80px] left-0 w-full p-4 z-40 animate-in slide-in-from-bottom-2 duration-300 pointer-events-none">
           <div className="max-w-md mx-auto bg-[#1a1a1d]/95 backdrop-blur-md rounded-[20px] border border-[#e6c27a]/30 p-4 pointer-events-auto flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
              
              <div className="flex justify-between items-center px-1 border-b border-white/10 pb-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/5 flex items-center justify-center relative">
                      <ShoppingCart size={16} className="text-[#e6c27a]" />
                      <span className="absolute -top-1 -right-1 bg-[#e6c27a] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-[#1a1a1d]">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Ticket Total</p>
                      <p className="text-[18px] font-bold text-white leading-none">₹{totalAmount}</p>
                    </div>
                 </div>
              </div>
 
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 mb-1">
                  {[10, 20, 50].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setTipAmount(tipAmount === tip ? 0 : tip)}
                      className={`flex-1 py-2 rounded-full text-[11px] font-bold border transition-colors ${tipAmount === tip ? 'bg-[#e6c27a] text-black border-[#e6c27a]' : 'bg-black/30 text-gray-400 border-white/5 hover:bg-white/5'}`}
                    >
                      +₹{tip} Tip
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="Your Name (optional)"
                  className="w-full bg-black/50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#e6c27a] text-[13px] border-white/10 text-white placeholder-gray-600"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <div className="flex gap-2">
                  <input 
                    type="tel"
                    placeholder="WhatsApp number"
                    className="w-full bg-black/50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#e6c27a] text-[13px] border-white/10 text-white placeholder-gray-600 flex-grow"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <button 
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="bg-[#e6c27a] hover:bg-[#d4b068] text-black rounded-xl px-5 py-3 text-sm font-bold transition-colors shadow-lg inline-flex items-center justify-center text-[12px] whitespace-nowrap uppercase tracking-wider disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Order <ChevronRight size={16} /></>}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full h-[70px] bg-[#0f0f11]/95 backdrop-blur-md border-t border-white/5 z-50 px-5 flex pb-safe">
        <div className="max-w-md w-full mx-auto flex items-center justify-around h-full">
          <button 
            onClick={() => setCustomerView('menu')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-colors ${customerView === 'menu' ? 'text-[#e6c27a]' : 'text-gray-500 hover:text-white'}`}
          >
            <UtensilsCrossed size={20} strokeWidth={customerView === 'menu' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
          </button>
          <button 
            onClick={() => setCustomerView('bill')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-colors relative ${customerView === 'bill' ? 'text-[#e6c27a]' : 'text-gray-500 hover:text-white'}`}
          >
            {tableOrders.length > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-[#e6c27a] rounded-full animate-pulse border border-[#0f0f11]"></span>}
            <Receipt size={20} strokeWidth={customerView === 'bill' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Bill</span>
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

      {/* Item Detail Bottom Sheet */}
      {selectedItem && (
        <div className="fixed inset-0 z-[115] flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div 
            className="bg-[#0f0f11] w-full max-h-[90vh] rounded-t-[2rem] border-t border-white/10 flex flex-col animate-in slide-in-from-bottom-full duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Dragger */}
            <div className="w-full flex justify-center py-4">
               <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
            </div>
            
            <div className="px-6 pb-6 overflow-y-auto scrollbar-hide">
               {/* Large Hero Media */}
               <div className="w-full aspect-square rounded-[2rem] bg-[#1a1a1d] mb-6 flex items-center justify-center relative overflow-hidden border border-white/5">
                 {selectedItem.image_url ? (
                   <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-gray-700 font-serif text-6xl">{selectedItem.name.charAt(0)}</span>
                 )}
               </div>

               <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-serif text-white">{selectedItem.name}</h2>
                  <div className={`shrink-0 w-4 h-4 border p-[2px] rounded-sm flex items-center justify-center mt-1 ${selectedItem.is_veg ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                    <div className={`w-2 h-2 rounded-sm flex-grow ${selectedItem.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  </div>
               </div>

               <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl font-bold text-[#e6c27a]">₹{selectedItem.price}</span>
                  <span className="text-sm font-medium text-gray-500 line-through pb-1">₹{(selectedItem.price * 1.15).toFixed(0)}</span>
               </div>
               
               <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
                 {selectedItem.description || "A delectable dish prepared with the finest ingredients and culinary expertise. Perfect to satisfy your cravings."}
               </p>

               {/* Ingredients / Tags */}
               <div className="mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Highlights</p>
                  <div className="flex flex-wrap gap-2">
                    {['Fresh', 'Spicy', 'Chef Special', 'Organic'].map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                 {selectedItem.model_3d_url && (
                   <button 
                     onClick={() => {
                       setArModelUrl(selectedItem.model_3d_url || null);
                     }}
                     className="w-full py-4 rounded-full bg-[#1a1a1d] text-[#4dd0e1] border border-[#4dd0e1]/30 font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(77,208,225,0.1)] active:scale-95 transition-transform"
                   >
                     <Box size={18} /> VIEW ON YOUR TABLE
                   </button>
                 )}
                 
                 <button 
                   onClick={() => {
                     addToCart(selectedItem);
                     setSelectedItem(null);
                   }}
                   disabled={!selectedItem.is_available}
                   className="w-full py-4 rounded-full bg-[#e6c27a] text-black font-bold text-[14px] active:scale-95 transition-transform disabled:opacity-50 disabled:bg-gray-500"
                 >
                   {selectedItem.is_available ? 'ADD TO ORDER' : 'CURRENTLY UNAVAILABLE'}
                 </button>
               </div>
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
              ar-modes="scene-viewer quick-look webxr"
              ar-scale="auto"
              ar-placement="floor"
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
