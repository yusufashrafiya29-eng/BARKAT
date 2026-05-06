import { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, Users, RefreshCw, Crown, Store, Settings, Edit2, Trash2, AlertCircle, LogIn, Banknote, TrendingUp, DollarSign, Megaphone, Plus, HelpCircle, MessageSquare, Clock } from 'lucide-react';
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

type TabType = 'overview' | 'restaurants' | 'users' | 'financials' | 'announcements' | 'tickets' | 'settings';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Announcement Form State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '', target_role: 'ALL', is_active: true });

  // Modals
  const [showSubModal, setShowSubModal] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState({ plan: 'basic', status: 'trial', expiry_date: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, restData, usersData, finData, annData, settingsData, ticketsData] = await Promise.all([
        superadminApi.getStats(),
        superadminApi.getRestaurants(),
        superadminApi.getUsers(),
        superadminApi.getFinancials(),
        superadminApi.getAnnouncements(),
        superadminApi.getPlatformSettings(),
        superadminApi.getTickets()
      ]);
      setStats(statsData);
      setRestaurants(restData);
      setUsers(usersData);
      setFinancials(finData);
      setAnnouncements(annData);
      setPlatformSettings(settingsData);
      setTickets(ticketsData);
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

  const handleImpersonate = async (type: 'restaurant' | 'user', id: string) => {
    try {
      let response;
      if (type === 'restaurant') {
        response = await superadminApi.impersonateRestaurant(id);
      } else {
        response = await superadminApi.impersonateUser(id);
      }
      
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken) {
        localStorage.setItem('superadmin_token', currentToken);
      }
      
      const { data } = response;
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.full_name || data.email.split('@')[0]);
      localStorage.setItem('restaurantName', data.restaurant_name || '');
      localStorage.setItem('restaurantLogo', data.restaurant_logo || '');
      localStorage.setItem('subscriptionStatus', data.subscription_status || '');
      localStorage.setItem('subscriptionPlan', data.subscription_plan || 'basic');
      
      toast.success(response.message || 'Impersonation successful');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to impersonate');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await superadminApi.deleteAnnouncement(id);
      toast.success("Announcement deleted!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superadminApi.createAnnouncement(announceForm);
      toast.success("Announcement broadcasted successfully!");
      setShowAnnounceModal(false);
      setAnnounceForm({ title: '', message: '', target_role: 'ALL', is_active: true });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create announcement");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await superadminApi.updatePlatformSettings(platformSettings.map(s => ({ key: s.key, value: s.value })));
      toast.success("Platform settings updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingChange = (key: string, newValue: string) => {
    setPlatformSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const notes = window.prompt("Optional: Enter resolution notes or reply message");
      if (notes === null) return; // cancelled
      await superadminApi.updateTicketStatus(ticketId, status, notes);
      toast.success("Ticket updated successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to update ticket");
    }
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
            { id: 'financials', label: 'Financials', icon: Banknote },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'tickets', label: 'Support Tickets', icon: HelpCircle },
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
                          <button 
                            onClick={() => handleImpersonate('restaurant', r.id)}
                            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-bold rounded-lg hover:bg-indigo-100 transition-colors shadow-sm inline-flex items-center gap-1.5"
                            title="Login as Owner"
                          >
                            <LogIn size={13}/> Login As
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
                      <th className="px-6 py-4 text-right">Actions</th>
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
                        <td className="px-6 py-4 text-right">
                          {u.role !== 'SUPERADMIN' && (
                            <button 
                              onClick={() => handleImpersonate('user', u.id)}
                              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-bold rounded-lg hover:bg-indigo-100 transition-colors shadow-sm inline-flex items-center gap-1.5"
                              title="Login as User"
                            >
                              <LogIn size={13}/> Login As
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Support Tickets</h3>
                  <p className="text-sm text-slate-500">Manage issues and feature requests reported by restaurants.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {ticket.status === 'OPEN' && <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider"><AlertCircle size={12}/> OPEN</span>}
                        {ticket.status === 'IN_PROGRESS' && <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider"><Clock size={12}/> IN PROGRESS</span>}
                        {ticket.status === 'RESOLVED' && <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider"><CheckCircle2 size={12}/> RESOLVED</span>}
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{ticket.restaurant_name}</span>
                        <span className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{ticket.subject}</h4>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3 whitespace-pre-wrap">{ticket.description}</p>
                      
                      {ticket.resolution_notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> Super Admin Response / Resolution Notes</p>
                          <p className="text-sm text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{ticket.resolution_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'RESOLVED' && (
                        <button 
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {ticket.status !== 'RESOLVED' && (
                        <button 
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED')}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                          Resolve & Reply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {tickets.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Inbox Zero!</h3>
                    <p className="text-slate-500 max-w-sm">There are no open support tickets at the moment. Good job!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-3xl">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Global Settings</h3>
                  <p className="text-sm text-slate-500">Configure platform-wide variables like pricing, trials, and payments.</p>
                </div>
              </div>

              <div className="space-y-6">
                {platformSettings.map((setting) => (
                  <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="mb-3 sm:mb-0">
                      <p className="font-bold text-slate-800 uppercase text-sm tracking-wide">{setting.key.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{setting.description || 'System setting'}</p>
                    </div>
                    <input 
                      type="text" 
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="w-full sm:w-64 border border-slate-200 rounded-lg px-4 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                ))}

                {platformSettings.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No settings found.
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-colors flex items-center gap-2"
                >
                  {savingSettings ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB: FINANCIALS */}
          {activeTab === 'financials' && financials && (
            <div className="space-y-8">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-indigo-600 p-5 rounded-2xl border border-indigo-500 shadow-lg shadow-indigo-600/20 text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10"><Banknote size={100}/></div>
                  <div className="flex items-center gap-3 mb-3 relative">
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md"><TrendingUp size={20}/></div>
                    <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Platform MRR</span>
                  </div>
                  <h3 className="text-3xl font-black relative">₹{financials.total_mrr.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h3>
                  <p className="text-xs text-indigo-200 font-medium mt-1">Monthly Recurring Revenue</p>
                </div>
                
                <div className="bg-emerald-600 p-5 rounded-2xl border border-emerald-500 shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10"><DollarSign size={100}/></div>
                  <div className="flex items-center gap-3 mb-3 relative">
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md"><Store size={20}/></div>
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest">Total GMV</span>
                  </div>
                  <h3 className="text-3xl font-black relative">₹{financials.total_gmv.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h3>
                  <p className="text-xs text-emerald-200 font-medium mt-1">Gross Merchandise Value across platform</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ARPU</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">₹{financials.arpu.toLocaleString('en-IN', {maximumFractionDigits: 0})}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Avg Revenue Per User</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><CheckCircle2 size={20}/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conversion</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">{financials.conversion_rate.toFixed(1)}%</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Paid / Total Restaurants</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Subscriptions Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Active Subscriptions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Basic Plan</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">₹499/mo</p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{financials.active_subscriptions_by_plan.basic || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Pro Plan</p>
                          <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 text-[9px] font-black uppercase rounded-md">Popular</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">₹999/mo</p>
                      </div>
                      <span className="text-2xl font-black text-emerald-700">{financials.active_subscriptions_by_plan.pro || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div>
                        <p className="text-sm font-bold text-purple-900 uppercase tracking-wide">Max Plan</p>
                        <p className="text-xs text-purple-600 font-medium mt-0.5">₹1399/mo</p>
                      </div>
                      <span className="text-2xl font-black text-purple-700">{financials.active_subscriptions_by_plan.max || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Restaurant Financial Breakdown Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Restaurant Revenue Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="px-6 py-4">Restaurant</th>
                          <th className="px-6 py-4">Plan Status</th>
                          <th className="px-6 py-4 text-right">GMV (Sales)</th>
                          <th className="px-6 py-4 text-right">MRR to Platform</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financials.restaurant_financials
                          .sort((a: any, b: any) => b.gmv - a.gmv)
                          .map((r: any) => (
                          <tr key={r.restaurant_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 text-[14px]">{r.name}</p>
                              <p className="text-slate-500 text-[11px] truncate max-w-[150px]">{r.owner_email || 'No email'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${r.subscription_status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="text-[12px] font-bold uppercase text-slate-700">{r.subscription_plan}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[14px] font-bold text-slate-900">₹{r.gmv.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[14px] font-bold text-indigo-600">₹{r.mrr.toLocaleString('en-IN')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Global Announcements</h3>
                <button 
                  onClick={() => setShowAnnounceModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Create Broadcast
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((ann) => (
                  <div key={ann.id} className={`p-6 rounded-2xl border ${ann.is_active ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'} relative shadow-sm`}>
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {ann.is_active ? (
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-md tracking-wider">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-md tracking-wider">
                          Inactive
                        </span>
                      )}
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-slate-400 hover:text-rose-500 p-1 bg-white rounded-md border border-slate-200 hover:border-rose-200 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 mb-1">Target: <span className="text-indigo-600">{ann.target_role}</span></p>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight pr-20">{ann.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{ann.message}</p>
                    
                    <p className="text-[11px] text-slate-400 font-medium">Broadcasted on {new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Megaphone size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No announcements found. Create one to broadcast to users.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Megaphone size={20} className="text-indigo-600" /> New Broadcast
            </h3>
            
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Announcement Title</label>
                <input 
                  type="text" 
                  value={announceForm.title}
                  onChange={e => setAnnounceForm({...announceForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Scheduled Maintenance"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Message Body</label>
                <textarea 
                  value={announceForm.message}
                  onChange={e => setAnnounceForm({...announceForm, message: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Enter your message here..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Audience</label>
                  <select 
                    value={announceForm.target_role}
                    onChange={e => setAnnounceForm({...announceForm, target_role: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="ALL">All Users (Staff + Owners)</option>
                    <option value="OWNER">Restaurant Owners Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                  <select 
                    value={announceForm.is_active ? "true" : "false"}
                    onChange={e => setAnnounceForm({...announceForm, is_active: e.target.value === "true"})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAnnounceModal(false)} className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-indigo-200">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
