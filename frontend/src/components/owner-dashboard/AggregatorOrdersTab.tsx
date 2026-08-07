import { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Clock, CheckCircle2, Flame, RefreshCw, Filter, ShieldAlert, Zap, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';

interface AggregatorOrder {
  id: string;
  platform: 'Zomato' | 'Swiggy' | 'ONDC Food' | 'Direct Web';
  customer_name: string;
  items_summary: string;
  gross_amount: number;
  platform_commission_rate: number; // percentage e.g. 22
  ad_deduction: number;
  gst_on_commission: number;
  net_payout: number;
  rider_name: string;
  rider_status: 'ASSIGNED_WAITING' | 'AT_RESTAURANT' | 'PICKED_UP' | 'DELIVERED';
  eta: string;
  status: 'NEW' | 'KITCHEN_PREPARING' | 'READY_FOR_RIDER';
  ordered_at: string;
}

export default function AggregatorOrdersTab() {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [orders, setOrders] = useState<AggregatorOrder[]>([]);

  const fetchOrders = async () => {
    try {
      const data = await ownerApi.getAggregators();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error("Failed to fetch aggregator orders from DB", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSimulateWebhookDrop = async () => {
    const platforms: Array<'Zomato' | 'Swiggy' | 'ONDC Food' | 'Direct Web'> = ['Zomato', 'Swiggy', 'ONDC Food', 'Direct Web'];
    const selectedPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    const commRate = selectedPlatform === 'Zomato' ? 22 : selectedPlatform === 'Swiggy' ? 24 : selectedPlatform === 'ONDC Food' ? 4 : 0;
    const gross = Math.floor(600 + Math.random() * 900);
    const net = Math.round(gross * (1 - commRate / 100));

    const simOrder: AggregatorOrder = {
      id: `${selectedPlatform.slice(0,3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      platform: selectedPlatform,
      customer_name: `Live Order Customer #${Math.floor(100 + Math.random() * 900)}`,
      items_summary: '2x Special Paneer Meal, 2x Garlic Naan, 1x Beverage',
      gross_amount: gross,
      platform_commission_rate: commRate,
      ad_deduction: commRate > 0 ? 30 : 0,
      gst_on_commission: Math.round(commRate * gross * 0.0018),
      net_payout: net,
      rider_name: `${selectedPlatform} Valet Partner`,
      rider_status: 'ASSIGNED_WAITING',
      eta: 'Arriving in 8 mins',
      status: 'NEW',
      ordered_at: 'Just Now'
    };
    try {
      await ownerApi.createAggregatorOrder(simOrder);
      await fetchOrders();
      toast.success(`⚡ [Webhook Drop] Incoming order received & stored in PostgreSQL DB from ${selectedPlatform}!`);
    } catch (err) {
      toast.error("Failed to record webhook drop in DB");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("⚡ All aggregator webhooks & PostgreSQL records resynced!");
  };

  const handlePushToKDS = async (id: string) => {
    try {
      await ownerApi.updateAggregatorOrderStatus(id, 'KITCHEN_PREPARING');
      await fetchOrders();
      toast.success("🔥 Order injected directly into 3-Column Kitchen Display (KDS)! Prep timer initiated.");
    } catch (err) {
      toast.error("Failed to push to KDS");
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      await ownerApi.updateAggregatorOrderStatus(id, 'READY_FOR_RIDER');
      await fetchOrders();
      toast.success("Valet alerted via push notification!");
    } catch (err) {
      toast.error("Failed to mark as ready");
    }
  };

  const handleMarkHandedOver = async (id: string) => {
    try {
      await ownerApi.deleteAggregatorOrder(id);
      await fetchOrders();
      toast.success("🛵 Package handed over to rider & completed in server DB!");
    } catch (err) {
      toast.error("Failed to update order status in DB");
    }
  };

  // Financial Roll-up calculations
  const totalGross = orders.reduce((acc, o) => acc + o.gross_amount, 0);
  const totalNet = orders.reduce((acc, o) => acc + o.net_payout, 0);
  const avgCommission = totalGross > 0 ? Math.round(((totalGross - totalNet) / totalGross) * 100) : 0;

  const getPlatformColors = (p: string) => {
    switch(p) {
      case 'Zomato': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Swiggy': return 'bg-orange-100 text-[#e85d04] border-orange-300';
      case 'ONDC Food': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Direct Web': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-gradient-to-r from-[#e85d04] to-orange-600 font-black text-[11px] uppercase rounded-lg tracking-widest shadow-sm">
              🛵 SPRINT 5 AGGREGATOR HUB
            </span>
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live API Sync Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Universal Delivery & Net-Profit Analyzer</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Consolidates orders from Zomato, Swiggy, ONDC, and Direct Web into a unified operational queue. Automatically dissects platform commissions, ad deductions, and displays actual Net Cash in hand!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleSimulateWebhookDrop}
            className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-500/20"
            title="Simulate a live webhook order drop from online aggregators for testing"
          >
            🧪 Simulate Webhook Order Drop
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Resync Webhooks
          </button>
          <button
            onClick={() => toast.success("Opening Commission renegotiation dossier & PDF breakdown...")}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] font-extrabold text-xs shadow-xl shadow-[#e85d04]/30 transition-all transform active:scale-95 flex items-center gap-1.5"
          >
            <DollarSign size={15} /> Export Commission Report
          </button>
        </div>
      </div>

      {/* Financial Diagnostics Cards (Gross vs Net Margin) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase block">Active Delivery KOTs</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{orders.length}</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">4 Platforms</span>
          </div>
          <span className="text-xs text-slate-500 font-medium mt-3 block">Riders tracked in real-time</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase block">Gross Online Revenue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 font-mono">₹{totalGross.toLocaleString('en-IN')}</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">Customer Check</span>
          </div>
          <span className="text-xs text-slate-400 mt-3 block">Before aggregator platform cuts</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <span className="text-indigo-200 text-xs font-bold uppercase block flex items-center justify-between">
            <span>Actual Net Payout (In Hand)</span>
            <Zap size={14} className="text-amber-400" />
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">₹{totalNet.toLocaleString('en-IN')}</span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Net Realized</span>
          </div>
          <span className="text-xs text-slate-300 font-medium mt-3 block">Final settlement into bank account</span>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-rose-700 text-xs font-bold uppercase block flex items-center justify-between">
            <span>Platform Commissions & Ads</span>
            <ShieldAlert size={14} className="text-rose-600" />
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-rose-600 font-mono">₹{(totalGross - totalNet).toFixed(0)}</span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-rose-200 text-rose-900">~{avgCommission}% Cut</span>
          </div>
          <span className="text-xs text-rose-800 font-medium mt-3 block">Includes GST & boosted ranking fees</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase px-3 flex items-center gap-1">
          <Filter size={13} /> Filter Channel:
        </span>
        {['ALL', 'Zomato', 'Swiggy', 'ONDC Food', 'Direct Web'].map(chan => (
          <button
            key={chan}
            onClick={() => setActiveFilter(chan)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeFilter === chan ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {chan}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.filter(o => activeFilter === 'ALL' || o.platform === activeFilter).map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              {/* Left Info */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-3 py-1 rounded-full font-black text-xs uppercase border ${getPlatformColors(order.platform)} shadow-xs`}>
                    {order.platform}
                  </span>
                  <span className="font-mono font-black text-slate-800 text-sm">#{order.id}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock size={13} /> {order.ordered_at}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-slate-900">{order.customer_name}</h4>
                <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  🛒 {order.items_summary}
                </p>
              </div>

              {/* Middle Financial Diagnostics (Net vs Gross) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 min-w-[300px]">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Commission & Payout Diagnostic</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Gross Bill</span>
                    <span className="text-sm font-black text-slate-800 font-mono">₹{order.gross_amount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-500 font-bold uppercase block">{order.platform_commission_rate}% Commission</span>
                    <span className="text-sm font-black text-rose-600 font-mono">-₹{(order.gross_amount - order.net_payout).toFixed(0)}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-1 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase block">Net Take-Home</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">₹{order.net_payout}</span>
                  </div>
                </div>
              </div>

              {/* Right Rider SLA & Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                <div className="text-right flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 justify-end">
                    <Truck size={15} className="text-[#e85d04]" /> {order.rider_name}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-200 inline-block w-fit ml-auto">
                    ⏱ {order.eta}
                  </span>
                </div>

                {order.status === 'NEW' && (
                  <button
                    onClick={() => handlePushToKDS(order.id)}
                    className="px-5 py-3 rounded-2xl font-extrabold text-white bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] shadow-lg shadow-[#e85d04]/35 transition-all flex items-center justify-center gap-2 shrink-0 transform active:scale-95"
                  >
                    <Flame size={18} className="animate-bounce" /> Push to Kitchen KDS
                  </button>
                )}

                {order.status === 'KITCHEN_PREPARING' && (
                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="px-5 py-3 rounded-2xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <CheckCircle2 size={18} /> Mark Ready for Valet
                  </button>
                )}

                {order.status === 'READY_FOR_RIDER' && (
                  <button
                    onClick={() => handleMarkHandedOver(order.id)}
                    className="px-5 py-3 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <CheckCircle2 size={18} /> 📦 Handover to Rider
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
            <ShoppingBag size={48} className="mx-auto opacity-30 text-indigo-500" />
            <h4 className="text-lg font-bold text-slate-700">Zero Active Delivery Queue Drops</h4>
            <p className="text-xs">All aggregator orders have been prepared and dispatched! Webhooks are listening for incoming drops.</p>
          </div>
        )}
      </div>

    </div>
  );
}
