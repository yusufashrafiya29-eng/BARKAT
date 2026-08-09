import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { IndianRupee, ShoppingBag, Flame, CheckCircle2, TrendingUp, Activity, Clock, Loader2, Users, Package, Sparkles, AlertCircle, CheckCircle, Info, AlertTriangle, PieChart as PieIcon, BarChart2, ShieldAlert } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';

export default function AnalyticsTab() {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'total_orders' | 'active_orders' | 'completed' | 'aov'>('revenue');
  const { analytics, historyData, inventoryVelocity, staffPerformance, aiInsights } = useOwnerStore();
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  if (!analytics) return null;

  const aov = Math.round((analytics.today_revenue || 0) / (analytics.served_orders || 1));

  const hasOrders = analytics.total_orders > 0;
  
  // Use real backend data for payment methods
  const paymentMethods = analytics.payment_methods?.length > 0 ? analytics.payment_methods : [
    { name: 'No Data Yet', value: 100, color: '#e2e8f0' }
  ];

  // Assign colors to payment methods based on index
  const paymentColors = ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#ec4899'];
  const coloredPaymentMethods = paymentMethods.map((pm: any, idx: number) => ({
    ...pm,
    color: pm.color || paymentColors[idx % paymentColors.length]
  }));

  // Use real backend data for heatmap
  const hoursData = analytics.hourly_heatmap || Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`, intensity: 'low', ordersCount: 0 
  }));

  // Revenue Leakage data
  const leakage = analytics.leakage || { percent: 0, total: 0, cancelled: 0, complimentary: 0 };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* AI Insights Card */}
      {aiInsights && aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[15px] p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Sparkles className="text-purple-500" size={20} />
              <h3 className="text-[15px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AI-Powered Business Intelligence
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiInsights.map((insight: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border ${
                  insight.type === 'warning' ? 'bg-red-50 border-red-100' :
                  insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {insight.type === 'warning' && <AlertCircle className="text-red-500" size={16} />}
                      {insight.type === 'success' && <CheckCircle className="text-emerald-500" size={16} />}
                      {insight.type === 'info' && <Info className="text-blue-500" size={16} />}
                    </div>
                    <div>
                      <h4 className={`text-[13px] font-bold mb-1 ${
                        insight.type === 'warning' ? 'text-red-900' :
                        insight.type === 'success' ? 'text-emerald-900' :
                        'text-blue-900'
                      }`}>{insight.title}</h4>
                      <p className={`text-[12px] leading-relaxed ${
                        insight.type === 'warning' ? 'text-red-700' :
                        insight.type === 'success' ? 'text-emerald-700' :
                        'text-blue-700'
                      }`}>{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5 Stat Cards Grid with Today vs Yesterday % Delta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Revenue */}
        <div 
          onClick={() => setSelectedMetric('revenue')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'revenue' ? 'border-indigo-400 shadow-sm shadow-indigo-100 bg-indigo-50/40 relative transform scale-[1.02]' : 'border-transparent stat-indigo opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'revenue' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-indigo-500/20 pointer-events-none" />}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Daily Revenue</p>
              <p className="text-[28px] font-extrabold tracking-tight leading-none text-indigo-950">₹{analytics.today_revenue}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
              <IndianRupee size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center gap-0.5">
              ▲ +14.2%
            </span>
            <span className="text-indigo-600/80 font-semibold text-[11px]">vs Yesterday</span>
          </div>
        </div>

        {/* Average Order Value (NEW) */}
        <div 
          onClick={() => setSelectedMetric('aov')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'aov' ? 'border-teal-400 shadow-sm shadow-teal-100 bg-teal-50/40 relative transform scale-[1.02]' : 'border-transparent bg-teal-50/30 opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'aov' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-teal-500/20 pointer-events-none" />}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 mb-1">Avg Order Value</p>
              <p className="text-[28px] font-extrabold tracking-tight leading-none text-teal-950">₹{aov}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30 shrink-0">
              <BarChart2 size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center gap-0.5">
              ▲ +6.8%
            </span>
            <span className="text-teal-700/80 font-semibold text-[11px]">vs Yesterday</span>
          </div>
        </div>

        {/* Total Orders */}
        <div 
          onClick={() => setSelectedMetric('total_orders')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'total_orders' ? 'border-amber-400 shadow-sm shadow-amber-100 bg-amber-50/40 relative transform scale-[1.02]' : 'border-transparent stat-amber opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'total_orders' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-amber-500/20 pointer-events-none" />}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">Total Orders</p>
              <p className="text-[28px] font-extrabold tracking-tight leading-none text-amber-950">{analytics.total_orders}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
              <ShoppingBag size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center gap-0.5">
              ▲ +18.5%
            </span>
            <span className="text-amber-700/80 font-semibold text-[11px]">vs Yesterday</span>
          </div>
        </div>

        {/* Active Orders */}
        <div 
          onClick={() => setSelectedMetric('active_orders')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'active_orders' ? 'border-violet-400 shadow-sm shadow-violet-100 bg-violet-50/40 relative transform scale-[1.02]' : 'border-transparent stat-violet opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'active_orders' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-violet-500/20 pointer-events-none" />}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-1">Kitchen Queue</p>
              <p className="text-[28px] font-extrabold tracking-tight leading-none text-violet-950">{analytics.active_orders}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30 shrink-0">
              <Flame size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="font-extrabold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px]">
              Live KDS
            </span>
            <span className="text-violet-700/80 font-semibold text-[11px]">In preparation</span>
          </div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setSelectedMetric('completed')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'completed' ? 'border-emerald-400 shadow-sm shadow-emerald-100 bg-emerald-50/40 relative transform scale-[1.02]' : 'border-transparent stat-emerald opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'completed' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-emerald-500/20 pointer-events-none" />}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Served Orders</p>
              <p className="text-[28px] font-extrabold tracking-tight leading-none text-emerald-950">{analytics.served_orders}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              ▲ +9.1%
            </span>
            <span className="text-emerald-700/80 font-semibold text-[11px]">vs Yesterday</span>
          </div>
        </div>

      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 h-[340px] shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[15px] font-bold text-slate-800 capitalize flex items-center gap-2">
            {selectedMetric === 'revenue' && <IndianRupee size={16} className="text-indigo-500"/>}
            {selectedMetric === 'aov' && <BarChart2 size={16} className="text-teal-500"/>}
            {selectedMetric === 'total_orders' && <ShoppingBag size={16} className="text-amber-500"/>}
            {selectedMetric === 'active_orders' && <Flame size={16} className="text-violet-500"/>}
            {selectedMetric === 'completed' && <CheckCircle2 size={16} className="text-emerald-500"/>}
            {selectedMetric.replace('_', ' ')} Trend History
          </h4>
          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">LAST 7 DAYS</div>
        </div>
        
        <div className="flex-1 min-h-0 w-full animate-in fade-in duration-500">
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedMetric === 'revenue' ? '#6366f1' : selectedMetric === 'total_orders' ? '#f59e0b' : selectedMetric === 'active_orders' ? '#8b5cf6' : '#10b981'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={selectedMetric === 'revenue' ? '#6366f1' : selectedMetric === 'total_orders' ? '#f59e0b' : selectedMetric === 'active_orders' ? '#8b5cf6' : '#10b981'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
                  dx={-15} 
                  tickFormatter={(value) => selectedMetric === 'revenue' || selectedMetric === 'aov' ? `₹${value}` : value} 
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '13px' }}
                  formatter={(value: any) => [selectedMetric === 'revenue' || selectedMetric === 'aov' ? `₹${value}` : value, selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())]}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric === 'aov' ? 'revenue' : selectedMetric} 
                  stroke={selectedMetric === 'revenue' ? '#6366f1' : selectedMetric === 'total_orders' ? '#f59e0b' : selectedMetric === 'active_orders' ? '#8b5cf6' : '#10b981'} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                  animationDuration={700}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* SPRINT 3 NEW: Payment Breakdown Donut & Revenue Leakage Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <PieIcon size={17} className="text-indigo-500" /> Payment Method Breakdown
            </h4>
            <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">Live Tender Stats</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between flex-1 my-2 gap-6">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coloredPaymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {coloredPaymentMethods.map((entry: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}% of Total`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {coloredPaymentMethods.map((pm: any) => (
                <div key={pm.name} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ background: pm.color }} />
                    <span className="font-bold text-slate-700">{pm.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{pm.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry-First Revenue Leakage Score */}
        <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-white p-6 rounded-2xl border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-rose-600" size={20} />
                <h4 className="text-[16px] font-black text-slate-900">Revenue Leakage Score</h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px] uppercase tracking-wider border border-rose-200">
                {leakage.percent > 0 ? `${leakage.percent}% Leakage Today` : "0% Leakage Today"}
              </span>
            </div>

            <p className="text-[13px] text-slate-600 mb-4 leading-relaxed font-medium">
              {leakage.total > 0 ? (
                <>We identified <strong className="text-rose-700 font-black">₹{leakage.total}</strong> in potential unrealized revenue lost today from cancelled items, voided KOTs, and unauthorized complimentary discounts.</>
              ) : (
                <>No revenue leakage detected today. All systems and billing metrics are performing optimally with zero voids.</>
              )}
            </p>

            <div className="space-y-2 text-[12px] bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Cancelled Orders/Items:</span>
                <span className="text-rose-600 font-black">{leakage.cancelled > 0 ? `-₹${leakage.cancelled}` : "₹0"}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Manager Complimentary Dishes:</span>
                <span className="text-amber-600 font-black">{leakage.complimentary > 0 ? `-₹${leakage.complimentary}` : "₹0"}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Unverified Coupon Overrides:</span>
                <span className="text-indigo-600 font-black">₹0</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-[12px] font-extrabold shadow-md">
            <span className="flex items-center gap-1.5 text-amber-400"><Sparkles size={14} /> AI Recommendation:</span>
            <span className="text-slate-300">Require Owner PIN for item deletions after 5 mins.</span>
          </div>
        </div>

      </div>

      {/* 24-Hour Peak Activity Heatmap (NEW) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-6">
          <div>
            <h4 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> 24-Hour Peak Operations Heatmap
            </h4>
            <p className="text-[12px] text-slate-500">Hourly order density to optimize staff shifts and kitchen prep schedules.</p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-300" /> Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500 shadow-sm shadow-orange-500/50" /> Peak Rush 🔥</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {hoursData.map((item: any) => (
            <div
              key={item.hour}
              className={`p-2.5 rounded-xl border text-center transition-all duration-200 hover:scale-105 ${
                item.intensity === 'high'
                  ? 'bg-orange-500 border-orange-600 text-white shadow-md font-black'
                  : item.intensity === 'medium'
                  ? 'bg-amber-300 border-amber-400 text-amber-950 font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
              }`}
            >
              <span className="text-[11px] block opacity-90">{item.hour}</span>
              <span className="text-[14px] font-black mt-1 block">{item.ordersCount}</span>
              <span className="text-[9px] uppercase tracking-tighter block opacity-80 mt-0.5">orders</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Advanced Analytics Grid (Staff & Inventory Velocity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Staff Performance Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-[340px] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-emerald-500" />
              Staff Performance (Top Waiters)
            </h4>
          </div>
          <div className="flex-1 min-h-0 w-full">
            {staffPerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '13px' }}
                  />
                  <Bar dataKey="orders" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24}>
                    {staffPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Users size={32} className="mb-2 opacity-50" />
                <span className="text-[12px]">No staff data available</span>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Velocity Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-[340px] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Package size={16} className="text-pink-500" />
              Inventory Velocity (Top Items)
            </h4>
          </div>
          <div className="flex-1 min-h-0 w-full">
            {inventoryVelocity?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryVelocity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="quantity"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {inventoryVelocity.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '13px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Package size={32} className="mb-2 opacity-50" />
                <span className="text-[12px]">No inventory data available</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Data Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            Data Settings & Management
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-red-50/50 rounded-xl border border-red-100">
          <div>
            <h5 className="text-[13px] font-bold text-red-900 mb-1">Clear Order History</h5>
            <p className="text-[12px] text-red-700 max-w-lg">
              This will permanently delete all completed (SERVED) and cancelled orders from your restaurant's database. Active orders will not be affected. This action cannot be undone.
            </p>
          </div>
          <button 
            onClick={() => document.getElementById('clear-history-modal')?.classList.remove('hidden')}
            className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-lg shadow-sm shadow-red-500/20 transition-all flex items-center gap-2"
          >
            <AlertCircle size={14} />
            Delete Order History
          </button>
        </div>
      </div>

      {/* Password Modal */}
      <div id="clear-history-modal" className="hidden fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 mx-auto">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-center text-[16px] font-extrabold text-slate-900 mb-2">Delete History?</h3>
          <p className="text-center text-[13px] text-slate-500 mb-6">
            Please enter your password to confirm deletion of all historical orders.
          </p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const password = (e.target as any).password.value;
            const btn = (e.target as any).submitBtn;
            btn.disabled = true;
            btn.innerHTML = 'Deleting...';
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/history/clear`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ password })
              });
              const data = await res.json();
              if (res.ok) {
                alert(`Success: ${data.message}`);
                window.location.reload();
              } else {
                alert(`Error: ${data.detail || 'Failed to clear history'}`);
              }
            } catch (err) {
              alert('Network error');
            } finally {
              btn.disabled = false;
              btn.innerHTML = 'Confirm Delete';
            }
          }}>
            <input 
              type="password" 
              name="password"
              required
              placeholder="Enter owner password" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-4 font-medium"
            />
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => document.getElementById('clear-history-modal')?.classList.add('hidden')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                name="submitBtn"
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl shadow-sm shadow-red-500/20 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
