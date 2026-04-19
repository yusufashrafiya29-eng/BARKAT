import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, LogOut, Loader2,
  LayoutGrid, Package, BarChart3,
  Plus, Trash2, IndianRupee,
  ShoppingBag, Users, Clock, QrCode, CreditCard,
  TrendingUp, Activity, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../api/owner';
import { waiterApi } from '../api/waiter';

// Interfaces
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id: string;
  is_veg: boolean;
  is_available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

interface StaffUser {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string;
  role: string;
  is_verified: boolean;
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  category: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minimum_threshold: number;
}

interface Analytics {
  today_revenue: number;
  total_orders: number;
  active_orders: number;
  served_orders: number;
}

type TabType = 'analytics' | 'staff' | 'menu' | 'tables' | 'inventory' | 'payments';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [loading, setLoading] = useState(true);

  // Data States
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [upiId, setUpiId] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState<TabType | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [menuAddType, setMenuAddType] = useState('item');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'OWNER') {
      toast.error("Unauthorized");
      navigate('/login');
    } else {
      fetchData();
      const interval = setInterval(() => {
        silentlyFetchData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [navigate, activeTab]);

  const silentlyFetchData = async () => {
    try {
      switch (activeTab) {
        case 'analytics':
          const analyticRes = await ownerApi.getDailyAnalytics();
          setAnalytics(analyticRes);
          break;
        case 'staff':
          const staffRes = await ownerApi.getStaff();
          setStaff(staffRes);
          break;
        case 'menu':
          const menuRes = await waiterApi.getMenu();
          setMenuCategories(menuRes);
          break;
        case 'tables':
          const tableRes = await waiterApi.getTables();
          setTables(tableRes);
          break;
        case 'inventory':
          const invRes = await ownerApi.getInventory();
          setInventory(invRes);
          break;
        case 'payments':
          const payRes = await ownerApi.getUpiId();
          setUpiId(payRes.upi_id || '');
          break;
      }
    } catch (err) {
      // silent poll fail
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'analytics':
          const analyticRes = await ownerApi.getDailyAnalytics();
          setAnalytics(analyticRes);
          break;
        case 'staff':
          const staffRes = await ownerApi.getStaff();
          setStaff(staffRes);
          break;
        case 'menu':
          const menuRes = await waiterApi.getMenu();
          setMenuCategories(menuRes);
          break;
        case 'tables':
          const tableRes = await waiterApi.getTables();
          setTables(tableRes);
          break;
        case 'inventory':
          const invRes = await ownerApi.getInventory();
          setInventory(invRes);
          break;
        case 'payments':
          const payRes = await ownerApi.getUpiId();
          setUpiId(payRes.upi_id || '');
          break;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to fetch data`);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleVerifyStaff = async (id: string, name: string | null) => {
    try {
      await ownerApi.verifyStaff(id);
      toast.success(`${name || 'User'} verified`);
      fetchData();
    } catch { toast.error("Verification failed"); }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Delete staff permanently?")) return;
    try {
      await ownerApi.deleteStaff(id);
      toast.success("Staff removed");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const handleToggleMenu = async (itemId: string, currentAvail: boolean, name: string) => {
    try {
      await ownerApi.toggleMenuItemAvailability(itemId, !currentAvail);
      toast.success(`${name} updated`);
      fetchData();
    } catch { toast.error("Update failed"); }
  };

  const handleDeleteTable = async (id: string, num: number) => {
    if (!window.confirm(`Delete Table ${num}?`)) return;
    try {
      await ownerApi.deleteTable(id);
      toast.success("Table deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const handleSaveUpi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedUpi = formData.get('upi_id') as string;

    try {
      await ownerApi.updateUpiId(updatedUpi);
      toast.success("UPI Configuration Saved");
      fetchData();
    } catch {
      toast.error("Failed to save UPI settings");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Form Submission Handlers
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (showAddModal === 'tables') {
        await ownerApi.addTable({
          table_number: parseInt(data.number as string),
          capacity: parseInt(data.capacity as string),
          category: data.category as string
        });
      } else if (showAddModal === 'inventory') {
        await ownerApi.addInventoryItem({
          name: data.name,
          quantity: parseFloat(data.quantity as string),
          unit: data.unit,
          minimum_threshold: parseFloat(data.threshold as string)
        });
      } else if (showAddModal === 'staff') {
        await ownerApi.createVerifiedStaff({
          full_name: data.name,
          email: data.email,
          phone_number: data.phone,
          password: data.password,
          role: data.role,
          restaurant_email: 'admin@barkat.local'
        });
      } else if (showAddModal === 'menu') {
        if (menuAddType === 'category') {
          await ownerApi.addCategory({ name: data.name as string });
        } else {
          await ownerApi.addMenuItem({
            name: data.item_name as string,
            description: (data.description as string) || undefined,
            price: parseFloat(data.price as string),
            category_id: data.category_id as string,
            is_veg: data.is_veg === 'true',
            is_available: true
          });
        }
      }

      toast.success("Entity created");
      setShowAddModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sleek Vercel-like Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0F172A] text-slate-300 flex flex-col sticky top-0 h-screen z-50">
        {/* ── Brand Header ─────────────────────────────────── */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#312e81,#4f46e5)', boxShadow: '0 0 0 2px #6366f130, 0 4px 16px rgb(99 102 241 / .35)' }}
            >
              {localStorage.getItem('restaurantLogo') ? (
                <img src={localStorage.getItem('restaurantLogo') || ''} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-extrabold text-[20px]">
                  {(localStorage.getItem('restaurantName') || 'R').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Name + badge */}
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" style={{boxShadow:'0 0 6px #10b981'}} />
                <h1 className="text-[15px] font-extrabold text-white tracking-tight truncate leading-none">
                  {localStorage.getItem('restaurantName') || 'My Restaurant'}
                </h1>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: '#4f46e520', color: '#818cf8', border: '1px solid #4f46e530' }}
              >
                Owner Portal
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Overview
        </div>
 
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {[
            { id: 'analytics', label: 'Performance', icon: BarChart3 },
            { id: 'menu', label: 'Menu Catalog', icon: Package },
            { id: 'tables', label: 'Floor Plan', icon: LayoutGrid },
            { id: 'staff', label: 'Staff Roster', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: ShoppingBag },
            { id: 'payments', label: 'Settings & UPI', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                activeTab === tab.id ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800 font-normal'
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </nav>
 
        <div className="p-3 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
 
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Sleek Sub-Header */}
        <header className="h-[60px] border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-muted">Dashboard</span>
            <span className="text-muted">/</span>
            <span className="text-main font-medium capitalize">{activeTab.replace('_', ' ')}</span>
          </div>
 
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-[12px] text-muted">System Active</span>
          </div>
        </header>
 
        <div className="p-8 max-w-6xl mx-auto w-full flex-grow">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold tracking-tight capitalize">{activeTab.replace('_', ' ')}</h2>
            
            {['menu', 'tables', 'staff', 'inventory'].includes(activeTab) && (
              <button
                onClick={() => setShowAddModal(activeTab)}
                className="btn"
              >
                <Plus size={14} className="mr-1.5" /> Add {activeTab === 'inventory' ? 'Item' : activeTab.slice(0, -1).replace('ie', 'y')}
              </button>
            )}
          </div>
 
          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center border border-subtle rounded-md bg-surface border-dashed">
                <Loader2 className="w-5 h-5 text-muted animate-spin mb-3" />
                <span className="text-[13px] text-muted">Loading data...</span>
             </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                    {/* Revenue */}
                    <div className="stat-card stat-indigo">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Daily Revenue</p>
                          <p className="text-[32px] font-extrabold text-indigo-900 tracking-tight leading-none">₹{analytics.today_revenue}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                          <IndianRupee size={20} className="text-white" strokeWidth={2.5}/>
                        </div>
                      </div>
                      <p className="text-[12px] text-indigo-600/70 font-medium flex items-center gap-1"><TrendingUp size={12}/>Today's earnings</p>
                    </div>

                    {/* Total Orders */}
                    <div className="stat-card stat-amber">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1">Total Orders</p>
                          <p className="text-[32px] font-extrabold text-amber-900 tracking-tight leading-none">{analytics.total_orders}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                          <ShoppingBag size={20} className="text-white" strokeWidth={2.5}/>
                        </div>
                      </div>
                      <p className="text-[12px] text-amber-700/70 font-medium flex items-center gap-1"><Activity size={12}/>All time tickets</p>
                    </div>

                    {/* Active Orders */}
                    <div className="stat-card stat-violet">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-1">Active Orders</p>
                          <p className="text-[32px] font-extrabold text-violet-900 tracking-tight leading-none">{analytics.active_orders}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                          <Flame size={20} className="text-white" strokeWidth={2.5}/>
                        </div>
                      </div>
                      <p className="text-[12px] text-violet-700/70 font-medium flex items-center gap-1"><Clock size={12}/>Currently in kitchen</p>
                    </div>

                    {/* Completed */}
                    <div className="stat-card stat-emerald">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Completed</p>
                          <p className="text-[32px] font-extrabold text-emerald-900 tracking-tight leading-none">{analytics.served_orders}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                          <CheckCircle2 size={20} className="text-white" strokeWidth={2.5}/>
                        </div>
                      </div>
                      <p className="text-[12px] text-emerald-700/70 font-medium flex items-center gap-1"><TrendingUp size={12}/>Orders served today</p>
                    </div>

                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 h-[280px] flex flex-col items-center justify-center shadow-sm" style={{background:'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)'}}>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                      <BarChart3 size={28} className="text-indigo-400" />
                    </div>
                    <h4 className="text-[15px] font-bold text-slate-700 mb-1">Advanced Analytics</h4>
                    <p className="text-[13px] text-slate-400 text-center max-w-xs">Revenue charts and item performance graphs are being provisioned for your account.</p>
                  </div>
                </div>
              )}
 
              {/* MENU TAB */}
              {activeTab === 'menu' && (
                <div className="space-y-12">
                  {menuCategories.length === 0 ? (
                     <div className="surface p-12 text-center border-dashed border-subtle">
                        <p className="text-[13px] text-muted">No items found in catalog.</p>
                     </div>
                  ) : menuCategories.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-[14px] font-medium">{cat.name}</h3>
                        <div className="flex-1 h-px bg-subtle"></div>
                        <span className="text-[12px] text-muted">{cat.menu_items?.length} items</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.menu_items?.map(item => (
                          <div key={item.id} className="surface p-4 flex flex-col relative group">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-[14px] font-medium pr-4 text-main">{item.name}</h4>
                              <span className="text-[13px] text-muted">₹{item.price}</span>
                            </div>
                            <p className="text-[13px] text-muted line-clamp-2 mb-4 leading-normal h-[40px]">{item.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-subtle border-dashed">
                               <div className={`w-3 h-3 flex items-center justify-center border rounded-sm ${item.is_veg ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-sm ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                               </div>
                               <button
                                 onClick={() => handleToggleMenu(item.id, item.is_available, item.name)}
                                 className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${item.is_available 
                                   ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                   : 'bg-surface border border-subtle text-muted hover:text-main'
                                 }`}
                               >
                                 {item.is_available ? 'Available' : 'Out of Stock'}
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
 
              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <div className="surface overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-subtle bg-subtle/50">
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Asset Name</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Current Stock</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Threshold Min</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-subtle/30 transition-colors">
                          <td className="px-5 py-3 text-[14px] font-medium">{item.name}</td>
                          <td className="px-5 py-3 text-[13px] text-muted">
                            {item.quantity} <span className="text-[11px] uppercase ml-1">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-muted">
                            {item.minimum_threshold} {item.unit}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {item.quantity <= item.minimum_threshold ? (
                              <span className="text-[11px] font-medium px-2 py-1 rounded bg-rose-500/10 text-rose-500">Low Stock</span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">Optimal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {inventory.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-[13px] text-muted">No inventory tracked.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
 
              {/* TABLES TAB */}
              {activeTab === 'tables' && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="btn-secondary text-[12px]"
                    >
                      <QrCode size={14} className="mr-2" /> Generate QR Assets
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tables.map(table => (
                      <div key={table.id} className="surface p-5 flex flex-col relative group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[18px] font-semibold">T{table.table_number}</span>
                          <button 
                            onClick={() => handleDeleteTable(table.id, table.table_number)} 
                            className="text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-auto">
                          <p className="text-[12px] text-muted mb-1">{table.capacity} Seats</p>
                          <span className="text-[10px] font-medium text-muted bg-subtle px-1.5 py-0.5 rounded border border-subtle">
                            {table.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
 
              {/* STAFF TAB */}
              {activeTab === 'staff' && (
                <div className="surface overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-subtle bg-subtle/50">
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Team Member</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Role</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted">Account Status</th>
                        <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {staff.map(user => (
                        <tr key={user.id} className="hover:bg-subtle/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="text-[14px] font-medium text-main">{user.full_name || 'System User'}</div>
                            <div className="text-[12px] text-muted">{user.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[11px] font-medium bg-subtle px-2 py-1 rounded border border-subtle">{user.role}</span>
                          </td>
                          <td className="px-5 py-3">
                            {user.is_verified ? (
                              <span className="text-[12px] text-emerald-500 font-medium">Active</span>
                            ) : (
                              <span className="text-[12px] text-amber-500 font-medium">Pending Verification</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {!user.is_verified && (
                                <button 
                                  onClick={() => handleVerifyStaff(user.id, user.full_name)} 
                                  className="text-[12px] font-medium text-main hover:underline"
                                >
                                  Verify
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteStaff(user.id)} 
                                className="text-muted hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {staff.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-[13px] text-muted">No registered operators.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
 
              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="max-w-xl">
                  <div className="surface p-6 mb-6">
                    <h3 className="text-[15px] font-medium mb-1">UPI Integration</h3>
                    <p className="text-[13px] text-muted mb-6">Configure the automated UPI ID for customer QR checkout.</p>
 
                    <form onSubmit={handleSaveUpi} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Receiving UPI ID</label>
                        <input
                          name="upi_id"
                          defaultValue={upiId}
                          placeholder="e.g. business@bank"
                          className="form-input"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={formLoading} className="btn">
                          {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Configuration'}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {upiId && (
                     <div className="surface p-6 text-center border-dashed">
                        <p className="text-[12px] text-muted mb-4">Payment QR Preview</p>
                        <div className="bg-white p-2 inline-block rounded-md mx-auto">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=BARKAT_RESTAURANT&cu=INR`)}`}
                            alt="UPI QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <p className="mt-4 text-[13px] text-muted font-mono">{upiId}</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
 
      {/* ADD ENTITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-main/80 backdrop-blur-sm" onClick={() => !formLoading && setShowAddModal(null)}></div>
          <div className="relative w-full max-w-md surface p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-semibold mb-6">Add New {showAddModal.replace('ie', 'y').slice(0, -1)}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {showAddModal === 'tables' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Identifier No.</label>
                      <input name="number" type="number" required className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Capacity</label>
                      <input name="capacity" type="number" required className="form-input" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-main">Category</label>
                    <select name="category" required className="form-input">
                      <option value="Non-AC">Standard Non-AC</option>
                      <option value="AC">Premium AC</option>
                    </select>
                  </div>
                </>
              )}
 
              {showAddModal === 'inventory' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-main">Item Name</label>
                    <input name="name" required className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Current Stock</label>
                      <input name="quantity" type="number" step="0.01" required className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Metric Unit</label>
                      <input name="unit" required placeholder="kg, liters..." className="form-input" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-main">Restock Threshold</label>
                    <input name="threshold" type="number" step="0.01" required className="form-input" />
                  </div>
                </>
              )}

              {showAddModal === 'menu' && (

                <>
                  <div className="space-y-1.5 mb-4">
                    <label className="text-[12px] font-medium text-main">Entity Type</label>
                    <select
                      name="type"
                      value={menuAddType}
                      onChange={(e) => setMenuAddType(e.target.value)}
                      className="form-input"
                    >
                      <option value="item">Menu Item</option>
                      <option value="category">Menu Category</option>
                    </select>
                  </div>

                  {menuAddType === 'category' && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Category Name</label>
                      <input name="name" required className="form-input" />
                    </div>
                  )}

                  {menuAddType === 'item' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Display Name</label>
                        <input name="item_name" required className="form-input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Description</label>
                        <input name="description" className="form-input" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Price (₹)</label>
                          <input name="price" type="number" step="0.01" required className="form-input" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Category</label>
                          <select name="category_id" required className="form-input">
                            <option value="">Select...</option>
                            {menuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Item Type</label>
                        <select name="is_veg" className="form-input">
                          <option value="true">Vegetarian 🟢</option>
                          <option value="false">Non-Vegetarian 🔴</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}

 
              {showAddModal === 'staff' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-main">Full Name</label>
                    <input name="name" required className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Email Address</label>
                      <input name="email" type="email" required className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Phone No.</label>
                      <input name="phone" required className="form-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Initial Password</label>
                      <input name="password" type="password" required className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-main">Assigned Role</label>
                      <select name="role" className="form-input">
                        <option value="WAITER">Waiter</option>
                        <option value="KITCHEN">Kitchen Staff</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
 
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn flex-1">
                  {formLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : `Create`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {/* QR PRINT MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] bg-white text-black flex flex-col overflow-y-auto print:bg-white">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-10 print:hidden">
            <h2 className="text-[18px] font-semibold">Print QR Layout</h2>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="px-4 py-2 border border-black bg-black text-white text-[13px] rounded-md font-medium">
                Print Document
              </button>
              <button onClick={() => setShowQRModal(false)} className="px-4 py-2 border border-gray-300 text-black text-[13px] rounded-md font-medium">
                Close
              </button>
            </div>
          </div>
 
          <div className="p-10 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8 print:grid-cols-2 print:gap-6 print:p-0">
            {tables.map(table => {
              const orderUrl = `${window.location.origin}/order/table/${table.id}`;
              return (
                <div key={table.id} className="p-8 border border-gray-300 rounded-xl flex flex-col items-center justify-center print:break-inside-avoid">
                  <h3 className="text-3xl font-bold mb-6">Table {table.table_number}</h3>
                  <div className="bg-white p-2 border border-gray-200 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}`}
                      alt={`QR for Table ${table.table_number}`}
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="mt-6 text-center">
                    <p className="font-semibold text-[15px]">Scan to Order</p>
                    <p className="text-gray-500 text-[12px] mt-1 uppercase tracking-widest">{localStorage.getItem('restaurantName') || 'BARKAT'}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #root > div > div.fixed.inset-0.z-\\[100\\] { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; display: block; }
              #root > div > div.fixed.inset-0.z-\\[100\\] * { visibility: visible; }
              .print\\:hidden { display: none !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
