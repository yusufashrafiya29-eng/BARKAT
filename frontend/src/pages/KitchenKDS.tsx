import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, AlertCircle, Loader2, Flame, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { kitchenApi } from '../api/kitchen';
import { waiterApi } from '../api/waiter';
import { useNavigate } from 'react-router-dom';

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
  const [orders, setOrders]   = useState<Order[]>([]);
  const [menuMap, setMenuMap] = useState<Record<string, string>>({});
  const [tableMap, setTableMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  const fetchMetadata = useCallback(async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([waiterApi.getMenu(), waiterApi.getTables()]);
      const nm: Record<string, string> = {};
      menuRes.forEach((c: any) => c.menu_items?.forEach((i: any) => { nm[i.id] = i.name; }));
      setMenuMap(nm);
      const tm: Record<string, number> = {};
      tablesRes.forEach((t: any) => { tm[t.id] = t.table_number; });
      setTableMap(tm);
    } catch { toast.error('Failed to load metadata.'); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const active = await kitchenApi.getActiveOrders();
      setOrders(active);
      setLastSync(new Date());
    } catch { toast.error('Failed to fetch orders.'); }
    finally { if (loading) setLoading(false); }
  }, [loading]);

  useEffect(() => {
    fetchMetadata().then(() => fetchOrders());
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchMetadata, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await kitchenApi.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'READY') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast.success('🔔 Ticket fired — READY!');
      } else {
        toast.success(`Moved to ${newStatus}`);
      }
    } catch {
      toast.error('Failed to update status');
      fetchOrders();
    }
  };

  const elapsed = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0d1117]">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
          <Loader2 className="animate-spin w-6 h-6 text-white" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[.2em]">Syncing KDS...</p>
      </div>
    );
  }

  const incoming  = orders.filter(o => o.status === 'ACCEPTED');
  const preparing = orders.filter(o => o.status === 'PREPARING');

  const OrderCard = ({ order, type }: { order: Order; type: 'incoming' | 'preparing' }) => {
    const mins      = elapsed(order.created_at);
    const isDanger  = mins > 25;
    const isWarning = mins > 15;
    const accentColor = isDanger ? '#f43f5e' : isWarning ? '#f59e0b' : type === 'incoming' ? '#6366f1' : '#10b981';

    return (
      <div
        className="rounded-2xl overflow-hidden relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1e2433 0%, #1a2035 100%)',
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 4px 20px ${accentColor}15`,
        }}
      >
        {/* accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }} />

        <div className="p-5">
          {/* header row */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px]"
                style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
              >
                T{tableMap[order.table_id] ?? '?'}
              </div>
              <div>
                <p className="text-[14px] font-bold text-white tracking-tight">#{order.id.slice(0, 5)}</p>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1"
                  style={{ background: `${accentColor}20`, color: accentColor }}
                >
                  <Clock size={9} />
                  {mins}m ago
                </div>
              </div>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: `${accentColor}18`, color: accentColor }}
            >
              {type === 'incoming' ? 'NEW' : 'COOKING'}
            </span>
          </div>

          {/* items */}
          <div className="space-y-2 mb-5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 py-1.5 border-b border-white/5 last:border-0 items-start">
                <span className="text-white font-bold text-[13px] min-w-[28px]">{item.quantity}×</span>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-300">{menuMap[item.menu_item_id] || 'Item'}</p>
                  {item.notes && (
                    <p className="text-[11px] text-amber-400 mt-0.5 flex items-start gap-1">
                      <AlertCircle size={10} className="mt-[2px] shrink-0" />
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* action */}
          {type === 'incoming' ? (
            <button
              onClick={() => handleStatusChange(order.id, 'PREPARING')}
              className="w-full py-2.5 rounded-xl font-bold text-[13px] transition-all duration-200 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, #6366f1, #4f46e5)`, color: '#fff', boxShadow: '0 4px 12px rgb(99 102 241 / .4)' }}
            >
              🍳 Start Preparation
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange(order.id, 'READY')}
              className="w-full py-2.5 rounded-xl font-bold text-[13px] transition-all duration-200 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, #10b981, #059669)`, color: '#fff', boxShadow: '0 4px 12px rgb(16 185 129 / .4)' }}
            >
              🔔 Fire — Mark Ready
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>

      {/* Header */}
      <header className="h-[68px] flex justify-between items-center px-6 shrink-0"
        style={{ background: '#161b27', borderBottom: '1px solid #ffffff0d' }}
      >
        <div className="flex items-center gap-3.5">
          {/* Restaurant logo */}
          <div
            className="w-11 h-11 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: localStorage.getItem('restaurantLogo') ? '#1e2433' : 'linear-gradient(135deg,#4338ca,#6366f1)',
              boxShadow: '0 0 0 2px #6366f130, 0 4px 14px rgb(99 102 241 / .3)',
              border: '1px solid #4f46e530',
            }}
          >
            {localStorage.getItem('restaurantLogo')
              ? <img src={localStorage.getItem('restaurantLogo')!} alt="Logo" className="w-full h-full object-cover" />
              : <span className="text-white font-extrabold text-[18px]">{(localStorage.getItem('restaurantName') || 'R').charAt(0).toUpperCase()}</span>
            }
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-extrabold text-white tracking-tight leading-none">
                {localStorage.getItem('restaurantName') || 'Restaurant'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: '#f59e0b20', color: '#fbbf24', border: '1px solid #f59e0b30' }}
              >
                Kitchen
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ChefHat size={10} className="text-slate-500" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Display System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ boxShadow: '0 0 8px #10b981' }} />
            <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">LIVE</span>
          </div>
          <span className="text-[11px] text-slate-600 border-l border-white/5 pl-5">
            Sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-400 hover:text-white transition-colors"
            style={{ border: '1px solid #ffffff10', background: '#1e2433' }}
          >
            <ArrowLeft size={13} /> Exit KDS
          </button>
        </div>
      </header>

      {/* Boards */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden" style={{ gap: '1px', background: '#ffffff08' }}>

        {/* Incoming */}
        <div className="flex flex-col overflow-hidden" style={{ background: '#0d1117' }}>
          <div className="h-[56px] flex justify-between items-center px-5 shrink-0"
            style={{ background: '#0f1623', borderBottom: '1px solid #6366f120' }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-indigo-400" />
              <h2 className="text-[13px] font-bold text-indigo-300 uppercase tracking-widest">New Tickets</h2>
            </div>
            <span className="text-[11px] font-black text-indigo-400 px-2.5 py-1 rounded-full"
              style={{ background: '#6366f120', border: '1px solid #6366f130' }}
            >
              {incoming.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {incoming.map(o => <OrderCard key={o.id} order={o} type="incoming" />)}
            {incoming.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-700 m-2 rounded-2xl"
                style={{ border: '1px dashed #ffffff08' }}
              >
                <CheckCircle2 size={32} className="mb-3 text-slate-800" />
                <p className="text-[12px] font-semibold text-slate-700">No incoming tickets</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing */}
        <div className="flex flex-col overflow-hidden" style={{ background: '#0d1117' }}>
          <div className="h-[56px] flex justify-between items-center px-5 shrink-0"
            style={{ background: '#0f1623', borderBottom: '1px solid #10b98120' }}
          >
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-emerald-400" />
              <h2 className="text-[13px] font-bold text-emerald-300 uppercase tracking-widest">Preparing</h2>
            </div>
            <span className="text-[11px] font-black text-emerald-400 px-2.5 py-1 rounded-full"
              style={{ background: '#10b98120', border: '1px solid #10b98130' }}
            >
              {preparing.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {preparing.map(o => <OrderCard key={o.id} order={o} type="preparing" />)}
            {preparing.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-700 m-2 rounded-2xl"
                style={{ border: '1px dashed #ffffff08' }}
              >
                <Flame size={32} className="mb-3 text-slate-800" />
                <p className="text-[12px] font-semibold text-slate-700">Kitchen is clear</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
