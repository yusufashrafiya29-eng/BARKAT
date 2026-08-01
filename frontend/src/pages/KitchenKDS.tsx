import { useState, useEffect, useCallback, useRef } from 'react';
import { ChefHat, Clock, AlertCircle, Loader2, Flame, CheckCircle2, ArrowLeft, ShoppingCart, Shield, CheckSquare, Sparkles, Bell, Wine, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import { kitchenApi } from '../api/kitchen';
import { waiterApi } from '../api/waiter';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  notes?: string;
  status: string;
  is_parcel?: boolean;
}

interface Order {
  id: string;
  table_id: string | null;
  order_type?: string;
  status: string;
  items: OrderItem[];
  created_at: string;
  finished_at?: string;
}

export default function KitchenKDS() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentlyDone, setRecentlyDone] = useState<Order[]>([]);
  const [menuMap, setMenuMap] = useState<Record<string, string>>({});
  const [stationMap, setStationMap] = useState<Record<string, string>>({});
  const [tableMap, setTableMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  
  // Real-time 1-second ticker for MM:SS digital stopwatch & SLA alerts
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const [selectedStation, setSelectedStation] = useState<string>('Kitchen');
  const processingOrdersRef = useRef<Set<string>>(new Set());
  const processingItemsRef = useRef<Set<string>>(new Set());

  const fetchMetadata = useCallback(async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([waiterApi.getMenu(), waiterApi.getTables()]);
      const nm: Record<string, string> = {};
      const sm: Record<string, string> = {};
      menuRes.forEach((c: any) => c.menu_items?.forEach((i: any) => { 
        nm[i.id] = i.name; 
        sm[i.id] = c.station || 'Kitchen';
      }));
      setMenuMap(nm);
      setStationMap(sm);
      const tm: Record<string, number> = {};
      tablesRes.forEach((t: any) => { tm[t.id] = t.table_number; });
      setTableMap(tm);
    } catch { toast.error('Failed to load metadata.'); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const active: Order[] = await kitchenApi.getActiveOrders();
      setOrders(prev => {
        const next = [...active];
        for (let i = 0; i < next.length; i++) {
          if (processingOrdersRef.current.has(next[i].id)) {
            const localOrder = prev.find(o => o.id === next[i].id);
            if (localOrder) next[i] = localOrder;
          } else {
            const localOrder = prev.find(o => o.id === next[i].id);
            if (localOrder) {
              for (let j = 0; j < next[i].items.length; j++) {
                if (processingItemsRef.current.has(next[i].items[j].id)) {
                  const localItem = localOrder.items.find(item => item.id === next[i].items[j].id);
                  if (localItem) next[i].items[j] = localItem;
                }
              }
            }
          }
        }
        return next.filter(o => o.status !== 'READY');
      });

      const readyActive = active.filter((o: Order) => o.status === 'READY');
      if (readyActive.length > 0) {
        setRecentlyDone(prev => {
          const combined = [...readyActive, ...prev];
          const seen = new Set<string>();
          return combined.filter(o => {
            if (seen.has(o.id)) return false;
            seen.add(o.id);
            return true;
          }).slice(0, 10);
        });
      }

      setLastSync(new Date());
    } catch { toast.error('Failed to fetch orders.'); }
    finally { if (loading) setLoading(false); }
  }, [loading]);

  useEffect(() => {
    fetchMetadata().then(() => fetchOrders());
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchMetadata, fetchOrders]);

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    if (processingOrdersRef.current.has(orderId)) return;
    processingOrdersRef.current.add(orderId);
    
    if (newStatus === 'READY') {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setRecentlyDone(prev => [{ ...targetOrder, status: 'READY', finished_at: timeStr }, ...prev].slice(0, 10));
      }
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Ticket FIRED — Ready for Service!');
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Moved ticket to ${newStatus}`);
    }

    try {
      await kitchenApi.updateOrderStatus(orderId, newStatus);
    } catch {
      toast.error('Failed to update status on server');
      fetchOrders();
    } finally {
      setTimeout(() => { processingOrdersRef.current.delete(orderId); }, 3000);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: string) => {
    if (processingItemsRef.current.has(itemId)) return;
    processingItemsRef.current.add(itemId);
    
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, items: o.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i) };
    }));
    
    try {
      await kitchenApi.updateItemStatus(itemId, newStatus);
      toast.success(newStatus === 'READY' ? 'Item marked ready!' : `Item ${newStatus}`);
    } catch {
      toast.error('Failed to update item status');
      fetchOrders();
    } finally {
      setTimeout(() => { processingItemsRef.current.delete(itemId); fetchOrders(); }, 3000);
    }
  };

  const formatLiveMMSS = (createdAt: string) => {
    const ms = Math.max(0, now - new Date(createdAt).getTime());
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMinsElapsed = (createdAt: string) => {
    return Math.floor((now - new Date(createdAt).getTime()) / 60000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0d1117]">
        <div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <p className="text-[12px] font-extrabold text-slate-400 uppercase tracking-[.25em]">Initializing KDS 2.0...</p>
      </div>
    );
  }

  const stationOrders = orders.filter(o => o.items.some(i => stationMap[i.menu_item_id] === selectedStation));
  const incoming = stationOrders.filter(o => o.status === 'ACCEPTED' || o.status === 'PENDING');
  const preparing = stationOrders.filter(o => o.status === 'PREPARING');
  const doneTickets = recentlyDone
    .filter(o => o.items.some(i => stationMap[i.menu_item_id] === selectedStation))
    .slice(0, 10);

  const OrderCard = ({ order, type }: { order: Order; type: 'incoming' | 'preparing' | 'done' }) => {
    const mins = getMinsElapsed(order.created_at);
    const mmss = formatLiveMMSS(order.created_at);
    const isDanger = type !== 'done' && mins >= 25;
    const isWarning = type !== 'done' && mins >= 15 && !isDanger;
    
    const accentColor = isDanger ? '#f43f5e' : isWarning ? '#f59e0b' : type === 'incoming' ? '#6366f1' : type === 'preparing' ? '#f59e0b' : '#10b981';

    const itemsForStation = order.items.filter(i => stationMap[i.menu_item_id] === selectedStation);
    if (itemsForStation.length === 0) return null;

    return (
      <div
        className="rounded-2xl overflow-hidden relative transition-all duration-300 transform hover:-translate-y-1"
        style={{
          background: 'linear-gradient(145deg, #1e2433 0%, #171d2b 100%)',
          border: `1.5px solid ${accentColor}40`,
          boxShadow: isDanger 
            ? `0 0 24px ${accentColor}40, 0 4px 12px rgb(0 0 0 / .3)` 
            : isWarning 
            ? `0 0 16px ${accentColor}30, 0 4px 12px rgb(0 0 0 / .2)` 
            : `0 4px 16px ${accentColor}15`,
        }}
      >
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}90)` }} />

        <div className="p-4 sm:p-5">
          {/* Ticket Header */}
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-[16px] shadow-sm shrink-0"
                style={{ background: `${accentColor}25`, color: accentColor, border: `1.5px solid ${accentColor}50` }}
              >
                {order.order_type === 'TAKEAWAY' ? 'PKG' : `T${tableMap[order.table_id || ''] ?? '?'}`}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-black text-white tracking-tight">KOT #{order.id.slice(0, 5)}</span>
                  {order.order_type === 'TAKEAWAY' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      PARCEL
                    </span>
                  )}
                </div>
                {type !== 'done' ? (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold mt-1 tracking-wider shadow-inner"
                    style={{ 
                      background: isDanger ? '#fff1f2' : isWarning ? '#fffbeb' : `${accentColor}20`, 
                      color: isDanger ? '#e11d48' : isWarning ? '#b45309' : accentColor,
                      border: isDanger ? '1px solid #f43f5e' : isWarning ? '1px solid #f59e0b' : 'none'
                    }}
                  >
                    <Clock size={11} className={isDanger || isWarning ? 'animate-spin' : ''} />
                    {mmss}
                    {isDanger && <span className="text-[9px] uppercase tracking-tighter font-sans">(! LATE)</span>}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={11} /> Ready at {order.finished_at || 'Done'}
                  </div>
                )}
              </div>
            </div>

            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0"
              style={{ background: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
            >
              {type === 'incoming' ? 'NEW' : type === 'preparing' ? 'COOKING' : 'READY'}
            </span>
          </div>

          {/* Ticket Items Breakdown */}
          <div className="space-y-3 mb-5">
            {itemsForStation.map((item, idx) => {
              const isItemReady = item.status === 'READY' || type === 'done';
              return (
                <div key={idx} className="flex gap-3 py-2 border-b border-white/5 last:border-0 items-start">
                  <span className="text-amber-400 font-black text-[15px] min-w-[32px] bg-amber-400/10 px-1.5 py-0.5 rounded text-center shrink-0">
                    {item.quantity}×
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[14px] font-extrabold tracking-tight transition-all ${isItemReady && type !== 'done' ? 'text-emerald-400 line-through opacity-70' : 'text-slate-100'}`}>
                        {menuMap[item.menu_item_id] || 'Item'}
                      </p>
                      {item.is_parcel && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
                          PARCEL
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-400/25 border-2 border-amber-400/70 flex items-center gap-2 text-amber-300 shadow-md transform hover:scale-[1.01]">
                        <Bell size={15} className="text-amber-400 shrink-0 animate-bounce" />
                        <span className="text-[12px] font-black uppercase tracking-wider text-amber-200 leading-tight">
                          NOTE: {item.notes}
                        </span>
                      </div>
                    )}
                  </div>

                  {type === 'preparing' && !isItemReady && (
                    <button 
                      onClick={() => handleItemStatusChange(order.id, item.id, 'READY')}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-400/10 transition-all shrink-0"
                      title="Mark Item Ready"
                    >
                      <CheckSquare size={18} />
                    </button>
                  )}
                  {isItemReady && type === 'preparing' && (
                    <span className="p-2 text-emerald-400 shrink-0" title="Item Ready">
                      <CheckCircle2 size={18} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action CTA Buttons (Fast Touch 1-Tap) */}
          {type === 'incoming' && (
            <button
              onClick={() => handleOrderStatusChange(order.id, 'PREPARING')}
              className="w-full py-3.5 rounded-xl font-black text-[13px] uppercase tracking-wider transition-all duration-200 hover:brightness-110 active:scale-[0.97] flex items-center justify-center gap-2 shadow-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, #e85d04, #ff6d00)', color: '#fff', boxShadow: '0 6px 25px rgba(232, 93, 4, 0.55)' }}
            >
              <Flame size={18} className="animate-bounce" /> 🔥 FIRE & START COOKING (1-TAP)
            </button>
          )}

          {type === 'preparing' && (
            <button
              onClick={() => handleOrderStatusChange(order.id, 'READY')}
              className="w-full py-3.5 rounded-xl font-black text-[13px] uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 6px 20px rgb(16 185 129 / .4)' }}
            >
              <CheckCircle2 size={17} /> FIRE ENTIRE TICKET!
            </button>
          )}

          {type === 'done' && (
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center font-extrabold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles size={14} /> Ready & Handed to Waiter
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ background: '#090d16' }}>
      
      {/* Top Header Bar */}
      <header className="h-[72px] flex justify-between items-center px-6 shrink-0 z-40"
        style={{ background: '#131824', borderBottom: '1px solid #ffffff15' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 16px rgb(245 158 11 / .3)',
            }}
          >
            <ChefHat size={24} className="text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[17px] font-black text-white tracking-tight leading-none">
                {localStorage.getItem('restaurantName') || 'MyRestro'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                KDS 2.0
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-md shadow-emerald-400/80" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">LIVE SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Center Station Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#1b2233] p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {[
              { label: 'Kitchen', icon: ChefHat, value: 'Kitchen', color: '#f59e0b' },
              { label: 'Bar / Drinks', icon: Wine, value: 'Bar', color: '#6366f1' },
              { label: 'Dessert', icon: Utensils, value: 'Dessert', color: '#ec4899' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  onClick={() => setSelectedStation(s.value)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all duration-200"
                  style={selectedStation === s.value
                    ? { background: s.color, color: '#fff', boxShadow: `0 2px 12px ${s.color}80` }
                    : { color: '#94a3b8', background: 'transparent' }
                  }
                >
                  <Icon size={15} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          <span className="hidden xl:inline text-[11px] font-mono font-semibold text-slate-500 border-l border-white/10 pl-3">
            Sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-white/15 ml-2"
          >
            <ArrowLeft size={15} />
            <span>Exit KDS</span>
          </button>
        </div>
      </header>

      {/* ── Sprint 2: 3-Column KDS Touch Boards ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden" style={{ gap: '2px', background: '#ffffff10' }}>

        {/* Column 1: INCOMING TICKETS */}
        <div className="flex flex-col overflow-hidden bg-[#0d111c]">
          <div className="h-[56px] flex justify-between items-center px-5 shrink-0 bg-[#131a2b] border-b border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={17} className="text-indigo-400" />
              <h2 className="text-[13px] font-black text-indigo-300 uppercase tracking-widest">Incoming Tickets</h2>
            </div>
            <span className="text-[12px] font-black text-indigo-300 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40">
              {incoming.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 scrollbar-thin">
            {incoming.map(o => <OrderCard key={o.id} order={o} type="incoming" />)}
            {incoming.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 rounded-2xl m-2 border-2 border-dashed border-white/5">
                <Clock size={36} className="mb-3 opacity-30 text-indigo-400" />
                <p className="text-[13px] font-bold tracking-wide">No new incoming tickets</p>
                <span className="text-[11px] text-slate-700 mt-1">Orders punched by waiter appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: COOKING / PREPARING */}
        <div className="flex flex-col overflow-hidden bg-[#10131d]">
          <div className="h-[56px] flex justify-between items-center px-5 shrink-0 bg-[#191b29] border-b border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <Flame size={17} className="text-amber-400 animate-bounce" />
              <h2 className="text-[13px] font-black text-amber-300 uppercase tracking-widest">Cooking in Kitchen</h2>
            </div>
            <span className="text-[12px] font-black text-amber-300 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
              {preparing.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 scrollbar-thin">
            {preparing.map(o => <OrderCard key={o.id} order={o} type="preparing" />)}
            {preparing.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 rounded-2xl m-2 border-2 border-dashed border-white/5">
                <Flame size={36} className="mb-3 opacity-30 text-amber-400" />
                <p className="text-[13px] font-bold tracking-wide">Kitchen is currently clear</p>
                <span className="text-[11px] text-slate-700 mt-1">Tap start on incoming tickets to prepare</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: DONE / FIRED READY (Last 10) */}
        <div className="flex flex-col overflow-hidden bg-[#0c131c]">
          <div className="h-[56px] flex justify-between items-center px-5 shrink-0 bg-[#121c29] border-b border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={17} className="text-emerald-400" />
              <h2 className="text-[13px] font-black text-emerald-300 uppercase tracking-widest">Ready / Fired (Last 10)</h2>
            </div>
            <span className="text-[12px] font-black text-emerald-300 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              {doneTickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 scrollbar-thin opacity-90">
            {doneTickets.map(o => <OrderCard key={o.id} order={o} type="done" />)}
            {doneTickets.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 rounded-2xl m-2 border-2 border-dashed border-white/5">
                <CheckCircle2 size={36} className="mb-3 opacity-30 text-emerald-400" />
                <p className="text-[13px] font-bold tracking-wide">No completed tickets yet</p>
                <span className="text-[11px] text-slate-700 mt-1">Fired orders move here for service</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating View Switcher at Bottom Left with high Z-index */}
      <div className="fixed bottom-5 left-5 z-[99] flex items-center gap-2 bg-[#131a28]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
        <button
          onClick={() => navigate('/waiter')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 16px rgb(99 102 241 / .4)' }}
        >
          <ShoppingCart size={15} />
          <span>Waiter View</span>
        </button>
        <button
          onClick={() => navigate('/owner')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 16px rgb(16 185 129 / .4)' }}
        >
          <Shield size={15} />
          <span>Owner View</span>
        </button>
      </div>

    </div>
  );
}
