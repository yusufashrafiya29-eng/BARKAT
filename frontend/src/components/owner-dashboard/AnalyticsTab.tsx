import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { IndianRupee, ShoppingBag, Flame, CheckCircle2, TrendingUp, Activity, Clock, Loader2, Users, Package, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';

export default function AnalyticsTab() {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'total_orders' | 'active_orders' | 'completed'>('revenue');
  const { analytics, historyData, inventoryVelocity, staffPerformance, aiInsights } = useOwnerStore();
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      {aiInsights && aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[15px] p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Sparkles className="text-purple-500" size={20} />
              <h3 className="text-[15px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AI-Powered Insights
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Revenue */}
        <div 
          onClick={() => setSelectedMetric('revenue')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'revenue' ? 'border-indigo-400 shadow-sm shadow-indigo-100 bg-indigo-50/40 relative transform scale-[1.02]' : 'border-transparent stat-indigo opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'revenue' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-indigo-500/20 pointer-events-none"></div>}
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${selectedMetric === 'revenue' ? 'text-indigo-600' : 'text-indigo-500'}`}>Daily Revenue</p>
              <p className={`text-[32px] font-extrabold tracking-tight leading-none ${selectedMetric === 'revenue' ? 'text-indigo-950' : 'text-indigo-900'}`}>₹{analytics.today_revenue}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${selectedMetric === 'revenue' ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-indigo-500 shadow-indigo-500/20'}`}>
              <IndianRupee size={20} className="text-white" strokeWidth={2.5}/>
            </div>
          </div>
          <p className={`text-[12px] font-medium flex items-center gap-1 mt-4 ${selectedMetric === 'revenue' ? 'text-indigo-700' : 'text-indigo-600/70'}`}><TrendingUp size={12}/>Today's earnings</p>
        </div>

        {/* Total Orders */}
        <div 
          onClick={() => setSelectedMetric('total_orders')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'total_orders' ? 'border-amber-400 shadow-sm shadow-amber-100 bg-amber-50/40 relative transform scale-[1.02]' : 'border-transparent stat-amber opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'total_orders' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-amber-500/20 pointer-events-none"></div>}
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${selectedMetric === 'total_orders' ? 'text-amber-600' : 'text-amber-500'}`}>Total Orders</p>
              <p className={`text-[32px] font-extrabold tracking-tight leading-none ${selectedMetric === 'total_orders' ? 'text-amber-950' : 'text-amber-900'}`}>{analytics.total_orders}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${selectedMetric === 'total_orders' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-amber-400 shadow-amber-500/20'}`}>
              <ShoppingBag size={20} className="text-white" strokeWidth={2.5}/>
            </div>
          </div>
          <p className={`text-[12px] font-medium flex items-center gap-1 mt-4 ${selectedMetric === 'total_orders' ? 'text-amber-700' : 'text-amber-700/70'}`}><Activity size={12}/>All time tickets</p>
        </div>

        {/* Active Orders */}
        <div 
          onClick={() => setSelectedMetric('active_orders')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'active_orders' ? 'border-violet-400 shadow-sm shadow-violet-100 bg-violet-50/40 relative transform scale-[1.02]' : 'border-transparent stat-violet opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'active_orders' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-violet-500/20 pointer-events-none"></div>}
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${selectedMetric === 'active_orders' ? 'text-violet-600' : 'text-violet-500'}`}>Active Orders</p>
              <p className={`text-[32px] font-extrabold tracking-tight leading-none ${selectedMetric === 'active_orders' ? 'text-violet-950' : 'text-violet-900'}`}>{analytics.active_orders}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${selectedMetric === 'active_orders' ? 'bg-violet-600 shadow-violet-500/40' : 'bg-violet-500 shadow-violet-500/20'}`}>
              <Flame size={20} className="text-white" strokeWidth={2.5}/>
            </div>
          </div>
          <p className={`text-[12px] font-medium flex items-center gap-1 mt-4 ${selectedMetric === 'active_orders' ? 'text-violet-700' : 'text-violet-700/70'}`}><Clock size={12}/>Currently in kitchen</p>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setSelectedMetric('completed')}
          className={`stat-card cursor-pointer transition-all duration-200 border-2 ${selectedMetric === 'completed' ? 'border-emerald-400 shadow-sm shadow-emerald-100 bg-emerald-50/40 relative transform scale-[1.02]' : 'border-transparent stat-emerald opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
        >
          {selectedMetric === 'completed' && <div className="absolute inset-0 rounded-[14px] ring-2 ring-emerald-500/20 pointer-events-none"></div>}
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${selectedMetric === 'completed' ? 'text-emerald-600' : 'text-emerald-500'}`}>Completed</p>
              <p className={`text-[32px] font-extrabold tracking-tight leading-none ${selectedMetric === 'completed' ? 'text-emerald-950' : 'text-emerald-900'}`}>{analytics.served_orders}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${selectedMetric === 'completed' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-emerald-400 shadow-emerald-500/20'}`}>
              <CheckCircle2 size={20} className="text-white" strokeWidth={2.5}/>
            </div>
          </div>
          <p className={`text-[12px] font-medium flex items-center gap-1 mt-4 ${selectedMetric === 'completed' ? 'text-emerald-700' : 'text-emerald-700/70'}`}><TrendingUp size={12}/>Orders served today</p>
        </div>

      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 h-[340px] shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[15px] font-bold text-slate-800 capitalize flex items-center gap-2">
            {selectedMetric === 'revenue' && <IndianRupee size={16} className="text-indigo-500"/>}
            {selectedMetric === 'total_orders' && <ShoppingBag size={16} className="text-amber-500"/>}
            {selectedMetric === 'active_orders' && <Flame size={16} className="text-violet-500"/>}
            {selectedMetric === 'completed' && <CheckCircle2 size={16} className="text-emerald-500"/>}
            {selectedMetric.replace('_', ' ')} History
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
                  tickFormatter={(value) => selectedMetric === 'revenue' ? `₹${value}` : value} 
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '13px' }}
                  formatter={(value: any) => [selectedMetric === 'revenue' ? `₹${value}` : value, selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())]}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke={selectedMetric === 'revenue' ? '#6366f1' : selectedMetric === 'total_orders' ? '#f59e0b' : selectedMetric === 'active_orders' ? '#8b5cf6' : '#10b981'} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                  animationDuration={700}
                  activeDot={{ r: 6, strokeWidth: 0, fill: selectedMetric === 'revenue' ? '#6366f1' : selectedMetric === 'total_orders' ? '#f59e0b' : selectedMetric === 'active_orders' ? '#8b5cf6' : '#10b981' }}
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
      
      {/* Advanced Analytics Grid */}
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
    </div>
  );
}
