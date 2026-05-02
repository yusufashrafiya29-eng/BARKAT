import { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, Users, RefreshCw, Crown, Store, Settings, Search, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { superadminApi } from '../api/superadmin';
import toast from 'react-hot-toast';

interface Stats {
  total_restaurants: number;
  pending_approvals: number;
  active_subscriptions: number;
  total_users: number;
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
  subscription_ends_at: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  role: string;
  restaurant_name: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'users' | 'settings'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSubModal, setShowSubModal] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState({ plan: 'basic', status: 'trial', expiry_date: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, restData, usersData] = await Promise.all([
        superadminApi.getStats(),
        superadminApi.getRestaurants(),
        superadminApi.getUsers()
      ]);
      setStats(statsData);
      setRestaurants(restData);
      setUsers(usersData);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await superadminApi.approveRestaurant(id);
      toast.success('Restaurant approved successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleUpdateSubscription = async () => {
    if (!showSubModal) return;
    try {
      const expiry = editingSub.expiry_date ? new Date(editingSub.expiry_date).toISOString() : undefined;
      await superadminApi.updateSubscription(showSubModal, editingSub.plan, editingSub.status, expiry);
      toast.success('Subscription updated successfully');
      setShowSubModal(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update subscription');
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!window.confirm("WARNING: This will permanently delete the restaurant and ALL its data (users, menus, orders). Are you sure?")) {
      return;
    }
    if (!window.confirm("FINAL WARNING: This action cannot be undone!")) {
      return;
    }
    try {
      await superadminApi.deleteRestaurant(id);
      toast.success('Restaurant deleted permanently');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete restaurant');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-indigo-600 w-8 h-8" />
          <p className="text-slate-500 font-semibold tracking-wide">Loading System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight leading-none text-slate-900">Platform Admin</h1>
            <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Superuser</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          {[
            { id: 'overview', label: 'Overview', icon: Crown },
            { id: 'restaurants', label: 'Restaurants', icon: Store },
            { id: 'users', label: 'Global Users', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] transition-all font-semibold ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h2>
              <p className="text-sm text-slate-500 font-medium">Manage platform data and configurations</p>
            </div>
            <button 
              onClick={fetchData} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
            </button>
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Store size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Restros</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats?.total_restaurants || 0}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Apprvl</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats?.pending_approvals || 0}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Crown size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Subs</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats?.active_subscriptions || 0}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Users</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{stats?.total_users || 0}</h3>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Restaurants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Owner</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {restaurants.slice(0, 5).map(r => (
                        <tr key={r.id}>
                          <td className="py-3 font-bold text-slate-800">{r.name}</td>
                          <td className="py-3 text-slate-600">{r.owner_email}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${r.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {r.is_approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESTAURANTS */}
          {activeTab === 'restaurants' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-4">Restaurant & Owner</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {restaurants.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-[15px]">{r.name}</p>
                          <p className="text-slate-500 text-[12px]">{r.owner_name} • {r.owner_email}</p>
                          <p className="text-slate-400 text-[11px] font-mono mt-0.5">{r.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${r.is_approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {r.is_approved ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                            {r.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-indigo-700 uppercase text-[12px]">{r.subscription_plan}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{r.subscription_status}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] text-slate-700 font-medium">
                            {r.subscription_ends_at ? new Date(r.subscription_ends_at).toLocaleDateString() : 'Lifetime'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {!r.is_approved && (
                            <button onClick={() => handleApprove(r.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-[12px] font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                              Approve
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setEditingSub({ 
                                plan: r.subscription_plan, 
                                status: r.subscription_status, 
                                expiry_date: r.subscription_ends_at ? new Date(r.subscription_ends_at).toISOString().split('T')[0] : '' 
                              });
                              setShowSubModal(r.id);
                            }} 
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Edit2 size={13}/> Edit Plan
                          </button>
                          <button onClick={() => handleDeleteRestaurant(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex opacity-0 group-hover:opacity-100">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-[14px]">{u.full_name || 'N/A'}</p>
                          <p className="text-slate-500 text-[12px]">{u.email}</p>
                          {u.phone_number && <p className="text-slate-400 text-[11px] mt-0.5">{u.phone_number}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-semibold text-indigo-700">{u.restaurant_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {u.is_approved ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[12px] text-slate-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl text-center">
              <Settings size={48} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Global Settings</h3>
              <p className="text-sm text-slate-500 mb-6">Platform configuration (e.g. trial periods, payment gateway API keys) will be managed here in future updates.</p>
              <button className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm" disabled>
                Coming Soon
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Manage Subscription</h3>
              <p className="text-xs text-slate-500 mt-1">Update plan and validity for the restaurant.</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Plan Tier</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={editingSub.plan}
                  onChange={e => setEditingSub({...editingSub, plan: e.target.value})}
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="max">Max</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={editingSub.status}
                  onChange={e => setEditingSub({...editingSub, status: e.target.value})}
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Expiry Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={editingSub.expiry_date}
                  onChange={e => setEditingSub({...editingSub, expiry_date: e.target.value})}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 italic">Leave empty to keep current or make lifetime.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setShowSubModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSubscription}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
