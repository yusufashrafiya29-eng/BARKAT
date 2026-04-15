import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, AlertCircle, Loader2, CheckCircle2, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { kitchenApi } from '../api/kitchen';
import { waiterApi } from '../api/waiter'; // Reusing for menu and tables
import { useNavigate } from 'react-router-dom';

// Interfaces
interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  table_id: string;
  status: string;
  items: OrderItem[];
  created_at: string;
}

export default function KitchenKDS() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuMap, setMenuMap] = useState<Record<string, string>>({});
  const [tableMap, setTableMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  
  const fetchMetadata = useCallback(async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([
        waiterApi.getMenu(),
        waiterApi.getTables()
      ]);
      
      const newMenuMap: Record<string, string> = {};
      menuRes.forEach((category: any) => {
        category.menu_items?.forEach((item: any) => {
          newMenuMap[item.id] = item.name;
        });
      });
      setMenuMap(newMenuMap);

      const newTableMap: Record<string, number> = {};
      tablesRes.forEach((table: any) => {
        newTableMap[table.id] = table.table_number;
      });
      setTableMap(newTableMap);
    } catch (err) {
      toast.error('Failed to load menu/table metadata.');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const activeOrders = await kitchenApi.getActiveOrders();
      setOrders(activeOrders);
      setLastSync(new Date());
    } catch (err) {
      toast.error('Failed to fetch active orders.');
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    // Initial fetch
    fetchMetadata().then(() => fetchOrders());

    // Polling interval
    const interval = setInterval(() => {
      fetchOrders();
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [fetchMetadata, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await kitchenApi.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'READY') {
        // Completely remove READY orders from view since KDS only fetches ACCEPTED/PREPARING
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast.success('Order marked as READY!', { icon: '🍽️' });
      } else {
        toast.success(`Order moved to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update order status');
      fetchOrders(); // Revert on failure
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const minutes = Math.floor((now - start) / 60000);
    return minutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-orange-400 gap-4">
        <Loader2 className="animate-spin w-16 h-16" />
        <p className="text-xl font-bold font-mono tracking-widest animate-pulse">WARMING UP OVENS...</p>
      </div>
    );
  }

  const incomingOrders = orders.filter(o => o.status === 'ACCEPTED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  const OrderCard = ({ order, type }: { order: Order; type: 'incoming' | 'preparing' }) => {
    const elapsedMinutes = getElapsedTime(order.created_at);
    // Visual alerts for orders taking too long
    const isWarning = elapsedMinutes > 15;
    const isDanger = elapsedMinutes > 25;

    return (
      <div className={`relative bg-slate-800 rounded-3xl p-6 border-b-8 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
        isDanger ? 'border-b-rose-500 bg-rose-500/10 shadow-rose-500/20' : 
        isWarning ? 'border-b-yellow-500 bg-yellow-500/10 shadow-yellow-500/20' : 
        type === 'incoming' ? 'border-b-orange-500 shadow-orange-500/10' : 'border-b-cyan-500 shadow-cyan-500/10'
      }`}>
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10 text-white">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl text-white">
               {tableMap[order.table_id] || '?'}
             </div>
             <div>
               <p className="text-xs font-black text-slate-400 tracking-widest uppercase">TABLE DINE-IN</p>
               <p className="font-mono text-xs text-slate-500">#{order.id.split('-')[0]}</p>
             </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-black text-xs tracking-widest uppercase ${
            isDanger ? 'bg-rose-500 text-white animate-pulse' : 
            isWarning ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-slate-700 text-slate-300'
          }`}>
            <Clock size={16} />
            {elapsedMinutes}m
          </div>
        </div>

        <ul className="space-y-4 mb-8">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
              <span className="w-10 h-10 bg-slate-700 text-white rounded-xl flex items-center justify-center font-black shadow-inner shrink-0">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-white leading-tight mb-1">{menuMap[item.menu_item_id] || 'Unknown Item'}</p>
                {item.notes && (
                  <p className="text-xs text-rose-400 font-bold flex items-start gap-1">
                     <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                     <span>{item.notes}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          {type === 'incoming' && (
             <button 
               onClick={() => handleStatusChange(order.id, 'PREPARING')}
               className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-slate-950 font-black py-4 rounded-2xl tracking-widest uppercase flex justify-center items-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
             >
               <Flame size={20} /> Start Cooking
             </button>
          )}
          {type === 'preparing' && (
             <button 
               onClick={() => handleStatusChange(order.id, 'READY')}
               className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black py-4 rounded-2xl tracking-widest uppercase flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
             >
               <CheckCircle2 size={20} /> Mark Ready
             </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-8 overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 tracking-tighter flex items-center gap-4">
            <ChefHat size={48} className="text-orange-400 drop-shadow-lg" /> Kitchen KDS
          </h1>
          <p className="text-slate-500 font-bold tracking-widest mt-2 ml-1 text-sm uppercase">Smart Display System</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> Live Sync
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Last seen: {lastSync.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black tracking-widest uppercase transition-all shadow-xl hover:-translate-y-0.5 active:scale-95"
          >
            Leave Line
          </button>
        </div>
      </header>

      {/* BOARDS */}
      <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
        
        {/* INCOMING COLUMN */}
        <div className="flex flex-col bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/5 p-6 border-b border-orange-500/20 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-orange-400 font-black tracking-widest text-lg uppercase flex items-center gap-2">
                <AlertCircle size={24} /> New Tickets
              </h2>
            </div>
            <span className="bg-orange-500 text-orange-950 px-4 py-1.5 rounded-xl text-sm font-black ring-1 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
               {incomingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
             {incomingOrders.map(order => (
               <OrderCard key={order.id} order={order} type="incoming" />
             ))}
             {incomingOrders.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                 <ChefHat size={64} className="opacity-20" />
                 <p className="font-black uppercase tracking-widest">No incoming tickets</p>
               </div>
             )}
          </div>
        </div>

        {/* PREPARING COLUMN */}
        <div className="flex flex-col bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 p-6 border-b border-cyan-500/20 flex justify-between items-center shrink-0">
            <div>
               <h2 className="text-cyan-400 font-black tracking-widest text-lg uppercase flex items-center gap-2">
                 <Flame size={24} /> Firing Now
               </h2>
            </div>
            <span className="bg-cyan-500 text-cyan-950 px-4 py-1.5 rounded-xl text-sm font-black ring-1 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
               {preparingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
             {preparingOrders.map(order => (
               <OrderCard key={order.id} order={order} type="preparing" />
             ))}
             {preparingOrders.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                 <Clock size={64} className="opacity-20" />
                 <p className="font-black uppercase tracking-widest">Nothing on the stoves</p>
               </div>
             )}
          </div>
        </div>

      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
