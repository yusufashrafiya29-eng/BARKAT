import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, AlertCircle, Loader2, Flame } from 'lucide-react';
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
    fetchMetadata().then(() => fetchOrders());

    const interval = setInterval(() => {
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchMetadata, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await kitchenApi.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'READY') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast.success('Ticket marked as READY');
      } else {
        toast.success(`Ticket moved to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update ticket status');
      fetchOrders(); 
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-main">
        <Loader2 className="animate-spin w-5 h-5 text-muted" />
        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Syncing KDS...</p>
      </div>
    );
  }

  const incomingOrders = orders.filter(o => o.status === 'ACCEPTED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  const OrderCard = ({ order, type }: { order: Order; type: 'incoming' | 'preparing' }) => {
    const elapsedMinutes = getElapsedTime(order.created_at);
    const isWarning = elapsedMinutes > 15;
    const isDanger = elapsedMinutes > 25;

    return (
      <div className={`surface p-5 transition-colors relative overflow-hidden group border ${
        isDanger ? 'border-rose-500/50' : 
        isWarning ? 'border-amber-500/50' : 
        type === 'incoming' ? 'border-primary/30' : 'border-emerald-500/30'
      }`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          isDanger ? 'bg-rose-500' : 
          isWarning ? 'bg-amber-500' : 
          type === 'incoming' ? 'bg-primary' : 'bg-emerald-500'
        }`}></div>
        
        <div className="flex justify-between items-start mb-5 pl-2">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-main border border-subtle rounded flex items-center justify-center font-semibold text-[15px]">
               T{tableMap[order.table_id] || '?'}
             </div>
             <div>
               <p className="text-[14px] font-semibold text-main mb-0.5">#{order.id.slice(0, 5)}</p>
               <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                 isDanger ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                 isWarning ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                 'bg-surface text-muted border-subtle'
               }`}>
                 <Clock size={10} />
                 {elapsedMinutes}m elapsed
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-1 mb-6 pl-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 py-1.5 border-b border-dashed border-subtle last:border-0 items-start">
              <span className="text-main font-semibold text-[13px] shrink-0 min-w-[20px]">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-[13px] text-muted">{menuMap[item.menu_item_id] || 'Item'}</p>
                {item.notes && (
                  <p className="text-[11px] text-amber-500 mt-0.5 flex items-start gap-1">
                     <AlertCircle size={12} className="shrink-0 mt-[1px]" /> 
                     <span>{item.notes}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pl-2">
          {type === 'incoming' && (
             <button 
               onClick={() => handleStatusChange(order.id, 'PREPARING')}
               className="btn flex-1 py-2 text-[12px]"
             >
               Start Preparation
             </button>
          )}
          {type === 'preparing' && (
             <button 
               onClick={() => handleStatusChange(order.id, 'READY')}
               className="flex-1 py-2 text-[12px] rounded-md font-semibold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors"
             >
               Fire to Pass (Ready)
             </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-main">
      {/* Header */}
      <header className="h-[60px] border-b border-subtle flex justify-between items-center px-6 shrink-0 bg-main">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface border border-subtle flex items-center justify-center text-muted">
            <ChefHat size={16} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-main tracking-tight">Kitchen Display</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-[11px] uppercase tracking-wider">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live
             </div>
             <p className="text-[11px] text-muted font-medium border-l border-subtle pl-3 border-dashed">
               Sync: {lastSync.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
             </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn-secondary px-3 py-1.5 text-[12px]"
          >
            Exit KDS
          </button>
        </div>
      </header>

      {/* BOARDS */}
      <div className="flex-1 grid grid-cols-2 gap-px bg-subtle overflow-hidden">
        
        {/* Incoming Column */}
        <div className="flex flex-col bg-main overflow-hidden">
          <div className="h-[50px] border-b border-subtle flex justify-between items-center px-5 shrink-0 bg-surface">
            <h2 className="text-primary font-semibold text-[13px] flex items-center gap-2">
              <AlertCircle size={14} /> New Tickets
            </h2>
            <span className="bg-main text-primary px-2 py-0.5 rounded text-[11px] font-semibold border border-subtle">
               {incomingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
             {incomingOrders.map(order => (
               <OrderCard key={order.id} order={order} type="incoming" />
             ))}
             {incomingOrders.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-muted border border-dashed border-subtle rounded m-2">
                  <p className="font-medium text-[12px]">No incoming tickets</p>
                </div>
             )}
          </div>
        </div>
 
        {/* Preparing Column */}
        <div className="flex flex-col bg-main overflow-hidden">
          <div className="h-[50px] border-b border-subtle flex justify-between items-center px-5 shrink-0 bg-surface">
             <h2 className="text-emerald-500 font-semibold text-[13px] flex items-center gap-2">
               <Flame size={14} /> Preparing
             </h2>
             <span className="bg-main text-emerald-500 px-2 py-0.5 rounded text-[11px] font-semibold border border-subtle">
                {preparingOrders.length}
             </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
             {preparingOrders.map(order => (
               <OrderCard key={order.id} order={order} type="preparing" />
             ))}
             {preparingOrders.length === 0 && (
               <div className="h-40 flex flex-col items-center justify-center text-muted border border-dashed border-subtle rounded m-2">
                  <p className="font-medium text-[12px]">Kitchen is clear</p>
                </div>
             )}
          </div>
        </div>
 
      </div>
    </div>
  );
}
