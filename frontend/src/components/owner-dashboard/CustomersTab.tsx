import { Trophy, Users, IndianRupee, Search, TrendingUp } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';
import { useState } from 'react';

export default function CustomersTab() {
  const { customers } = useOwnerStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!customers) return null;

  const filteredCustomers = customers.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number.includes(searchTerm)
  );

  const topCustomers = [...customers].sort((a, b) => b.loyalty_points - a.loyalty_points).slice(0, 3);
  const totalCustomers = customers.length;
  const totalLoyaltyIssued = customers.reduce((sum: number, c: any) => sum + c.loyalty_points, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Customers</p>
              <p className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-none">{totalCustomers}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card border border-rose-200 bg-rose-50/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-1">Points Issued</p>
              <p className="text-[32px] font-extrabold tracking-tight text-rose-900 leading-none">{totalLoyaltyIssued}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Trophy size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Top Spender</p>
              <p className="text-[20px] font-extrabold tracking-tight text-emerald-900 leading-tight mt-1 truncate">
                {topCustomers[0]?.name || 'N/A'}
              </p>
              <p className="text-[13px] font-semibold text-emerald-700">₹{topCustomers[0]?.total_spent || 0}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={18} />
            Customer Directory
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider">Customer Info</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-center">Visits</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-center">Lifetime Spend</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-right">Loyalty Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <p className="font-semibold mb-1">No customers found</p>
                    <p className="text-[13px]">Try a different search query or wait for orders.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[14px] text-slate-900">{c.name}</div>
                      <div className="text-[12px] text-slate-500 font-medium">{c.phone_number}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[30px] h-[30px] bg-slate-100 rounded-full font-bold text-[13px] text-slate-700">
                        {c.total_visits}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-[14px] text-slate-800">
                        <IndianRupee size={14} className="text-slate-400" />
                        {c.total_spent}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 font-bold text-[13px] rounded-full">
                        <Trophy size={14} />
                        {c.loyalty_points} pts
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
