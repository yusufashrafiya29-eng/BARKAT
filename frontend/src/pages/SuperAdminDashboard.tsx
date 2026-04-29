import { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, Users, RefreshCw, Crown } from 'lucide-react';

interface Stats {
  total_restaurants: number;
  pending_approvals: number;
  active_subscriptions: number;
}

interface Restaurant {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  is_approved: boolean;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/superadmin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const restaurantsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/superadmin/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.ok && restaurantsRes.ok) {
        setStats(await statsRes.json());
        setRestaurants(await restaurantsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch superadmin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/superadmin/restaurants/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubscriptionChange = async (id: string, plan: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/superadmin/restaurants/${id}/subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan, status })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Topbar */}
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight">Yusuf's Portal</h1>
            <p className="text-xs text-indigo-300 font-medium uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Users size={28}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Restros</p>
              <h3 className="text-4xl font-black text-slate-900">{stats?.total_restaurants || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Approval</p>
              <h3 className="text-4xl font-black text-slate-900">{stats?.pending_approvals || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Crown size={28}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Subs</p>
              <h3 className="text-4xl font-black text-slate-900">{stats?.active_subscriptions || 0}</h3>
            </div>
          </div>
        </div>

        {/* Restaurant List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-2xl font-black text-slate-800">Restaurant Directory</h2>
            <button onClick={fetchDashboardData} className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors"><RefreshCw size={20}/></button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                  <th className="px-8 py-4">Restaurant</th>
                  <th className="px-8 py-4">Owner Contact</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Plan & Subscription</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900 text-lg mb-1">{r.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.id.split('-')[0]}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-semibold text-slate-700">{r.owner_name}</p>
                      <p className="text-sm text-slate-500">{r.owner_email}</p>
                      <p className="text-sm text-slate-500">{r.owner_phone}</p>
                    </td>
                    <td className="px-8 py-5">
                      {r.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={14}/> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <select 
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 font-semibold"
                          value={r.subscription_plan}
                          onChange={(e) => handleSubscriptionChange(r.id, e.target.value, r.subscription_status)}
                        >
                          <option value="basic">Basic Plan</option>
                          <option value="pro">Pro Plan</option>
                          <option value="max">Max Plan</option>
                        </select>
                        <select 
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                          value={r.subscription_status}
                          onChange={(e) => handleSubscriptionChange(r.id, r.subscription_plan, e.target.value)}
                        >
                          <option value="trial">Trial</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {!r.is_approved && (
                        <button 
                          onClick={() => handleApprove(r.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all hover:-translate-y-0.5 text-sm"
                        >
                          Approve Platform
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
