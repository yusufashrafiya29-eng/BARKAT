import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee, CheckCircle2,
  ShieldAlert, LogOut, Loader2,
  LayoutGrid, Package, BarChart3,
  Plus, Trash2, IndianRupee,
  ShoppingBag, Users, Clock, QrCode, Printer, CreditCard
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
      toast.error(err.response?.data?.detail || `Failed to fetch data for ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleVerifyStaff = async (id: string, name: string | null) => {
    try {
      await ownerApi.verifyStaff(id);
      toast.success(`${name || 'User'} verified!`);
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
      toast.success(`${name} is now ${!currentAvail ? 'In Stock' : 'Sold Out'}`);
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
      toast.success("UPI ID Saved!");
      fetchData();
    } catch {
      toast.error("Failed to save UPI ID");
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
          capacity: parseInt(data.capacity as string)
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
          restaurant_email: 'admin@barkat.local' // Placeholder
        });
      } else if (showAddModal === 'menu') {
        // Logic for adding category or item based on form fields
        if (data.type === 'category') {
          await ownerApi.addCategory({ name: data.name });
        } else {
          await ownerApi.addMenuItem({
            name: data.item_name,
            description: data.description,
            price: parseFloat(data.price as string),
            category_id: data.category_id,
            is_available: true
          });
        }
      }

      toast.success("Added successfully!");
      setShowAddModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col hidden md:flex backdrop-blur-xl">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 tracking-tighter">
            BARKAT
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { id: 'analytics', label: 'Dashboard', icon: BarChart3 },
            { id: 'menu', label: 'Menu Builder', icon: Coffee },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'tables', label: 'Floor Plan', icon: LayoutGrid },
            { id: 'staff', label: 'Team', icon: Users },
            { id: 'payments', label: 'Payments', icon: CreditCard },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-white/5 border border-transparent'
                }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-rose-500 font-bold hover:bg-rose-500/10 w-full p-4 rounded-xl transition-all">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-4xl font-black capitalize tracking-tight">{activeTab}</h2>
              <p className="text-slate-500 font-medium mt-1">Manage your restaurant operations and data.</p>
            </div>

            {activeTab !== 'analytics' && activeTab !== 'payments' && (
              <button
                onClick={() => setShowAddModal(activeTab)}
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white flex items-center gap-2 px-6 py-3 rounded-2xl font-black shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105"
              >
                <Plus size={20} strokeWidth={3} /> ADD NEW
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-32 text-cyan-400 gap-4">
              <Loader2 className="animate-spin" size={48} />
              <p className="font-bold animate-pulse">Syncing data...</p>
            </div>
          ) : (
            <div className="animate-fade-in pb-20">

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-8">
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/50 transition-colors">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-4">
                        <IndianRupee size={24} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Today's Revenue</p>
                      <h3 className="text-3xl font-black mt-1">₹{analytics.today_revenue.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-emerald-500/50 transition-colors">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
                        <ShoppingBag size={24} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Orders</p>
                      <h3 className="text-3xl font-black mt-1">{analytics.total_orders}</h3>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-orange-500/50 transition-colors">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-4">
                        <Clock size={24} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Active Now</p>
                      <h3 className="text-3xl font-black mt-1">{analytics.active_orders}</h3>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-purple-500/50 transition-colors">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Completed</p>
                      <h3 className="text-3xl font-black mt-1">{analytics.served_orders}</h3>
                    </div>
                  </div>

                  {/* RECENT STATUS PLACEHOLDER */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                      <ShieldAlert size={20} className="text-cyan-400" />
                      Operational Overview
                    </h4>
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                      <BarChart3 size={48} className="mb-4 opacity-20" />
                      <p className="font-bold">Full Activity Chart Coming Soon</p>
                    </div>
                  </div>
                </div>
              )}

              {/* MENU TAB */}
              {activeTab === 'menu' && (
                <div className="space-y-12">
                  {menuCategories.map(cat => (
                    <div key={cat.id} className="relative">
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-2xl font-black text-cyan-400">{cat.name}</h3>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cat.menu_items?.map(item => (
                          <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="text-lg font-black">{item.name}</h4>
                              <span className="text-cyan-400 font-black">₹{item.price}</span>
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">{item.description || 'No description provided.'}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded ${item.is_veg ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {item.is_veg ? 'VEG' : 'NON-VEG'}
                              </span>
                              <button
                                onClick={() => handleToggleMenu(item.id, item.is_available, item.name)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${item.is_available
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}
                              >
                                {item.is_available ? 'IN STOCK' : 'SOLD OUT'}
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
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                  <table className="w-full text-left">
                    <thead className="bg-black/60 text-slate-400">
                      <tr>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Ingredient</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Stock Level</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Threshold</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-6 font-bold">{item.name}</td>
                          <td className="p-6 font-black text-cyan-400">{item.quantity} <span className="text-slate-500 font-bold ml-1">{item.unit}</span></td>
                          <td className="p-6 text-slate-400 font-bold">{item.minimum_threshold} {item.unit}</td>
                          <td className="p-6">
                            {item.quantity <= item.minimum_threshold ? (
                              <span className="bg-rose-500/20 text-rose-500 text-[10px] font-black px-3 py-1.5 rounded-full ring-1 ring-rose-500/30">LOW STOCK</span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full ring-1 ring-emerald-500/30">OPTIMAL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {inventory.length === 0 && (
                        <tr><td colSpan={4} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Stock is empty</td></tr>
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
                      className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all"
                    >
                      <QrCode size={20} /> PRINT QR CODES
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tables.map(table => (
                      <div key={table.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center group hover:border-cyan-500/50 transition-all">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <LayoutGrid className="text-slate-500 group-hover:text-cyan-400" size={32} />
                        </div>
                        <h4 className="text-xl font-black mb-1">T-{table.table_number}</h4>
                        <p className="text-slate-500 text-xs font-bold mb-4">{table.capacity} Seats</p>
                        <button onClick={() => handleDeleteTable(table.id, table.table_number)} className="text-rose-500 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAFF TAB */}
              {activeTab === 'staff' && (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                  <table className="w-full text-left">
                    <thead className="bg-black/60 text-slate-400">
                      <tr>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Member</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Role</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em]">Status</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {staff.map(user => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="font-black text-lg">{user.full_name || 'System User'}</div>
                            <div className="text-xs text-slate-500 font-bold">{user.email}</div>
                          </td>
                          <td className="p-6">
                            <span className="bg-slate-800 text-slate-300 text-[10px] px-3 py-1 rounded-lg font-black tracking-widest">{user.role}</span>
                          </td>
                          <td className="p-6">
                            {user.is_verified ? (
                              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                ACTIVE
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-orange-400 text-xs font-black">
                                <ShieldAlert size={14} />
                                PENDING
                              </div>
                            )}
                          </td>
                          <td className="p-6 text-right space-x-3">
                            {!user.is_verified && (
                              <button onClick={() => handleVerifyStaff(user.id, user.full_name)} className="bg-cyan-500 text-black hover:bg-cyan-400 px-4 py-2 rounded-xl text-xs font-black transition-all">
                                VERIFY
                              </button>
                            )}
                            <button onClick={() => handleDeleteStaff(user.id)} className="text-rose-500 hover:text-rose-400 transition-all">
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="max-w-2xl">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                      <CreditCard className="text-cyan-400" size={28} />
                      UPI Receive Setup
                    </h3>
                    <p className="text-slate-400 mb-8 font-medium font-bold text-sm">
                      Configure your restaurant's UPI ID. This will automatically generate a dynamic QR code on the Waiter's tablet when a customer chooses to pay via UPI.
                    </p>

                    <form onSubmit={handleSaveUpi} className="space-y-6">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Restaurant UPI ID</label>
                        <input
                          name="upi_id"
                          defaultValue={upiId}
                          placeholder="e.g. 9876543210@paytm or shop@ybl"
                          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black text-xl hover:border-white/20 focus:border-cyan-500 transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black p-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        {formLoading ? <Loader2 className="animate-spin" /> : 'SAVE CONFIGURATION'}
                      </button>
                    </form>

                    {upiId && (
                      <div className="mt-12 pt-12 border-t border-white/10 text-center animate-fade-in">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Generated Waiter QR Preview</h4>
                        <div className="inline-block bg-white p-6 rounded-[2rem] shadow-2xl">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=BARKAT_RESTAURANT&cu=INR`)}`}
                            alt="UPI QR Code Preset"
                            className="w-48 h-48 rounded-xl shrink-0"
                          />
                        </div>
                        <p className="mt-4 font-black tracking-widest">{upiId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !formLoading && setShowAddModal(null)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-10">
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Add New {showAddModal.slice(0, -1)}</h3>
              <p className="text-slate-500 font-bold mb-8 italic">Filling out the details for {showAddModal}...</p>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                {showAddModal === 'tables' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Table Number</label>
                      <input name="number" type="number" required placeholder="E.g. 10" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-cyan-500 outline-none transition-all font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Seating Capacity</label>
                      <input name="capacity" type="number" required placeholder="E.g. 4" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-cyan-500 outline-none transition-all font-black" />
                    </div>
                  </>
                )}

                {showAddModal === 'inventory' && (
                  <>
                    <input name="name" required placeholder="Ingredient Name (e.g. Rice)" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="quantity" type="number" step="0.01" required placeholder="Initial Qty" className="bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                      <input name="unit" required placeholder="Unit (Kg, Ltr, Pc)" className="bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    </div>
                    <input name="threshold" type="number" step="0.01" required placeholder="Low Stock Threshold" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                  </>
                )}

                {showAddModal === 'menu' && (
                  <>
                    <select name="type" value={menuAddType} onChange={e => setMenuAddType(e.target.value)} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl outline-none font-black text-cyan-400">
                      <option value="item">Add New Food Item</option>
                      <option value="category">Add New Category</option>
                    </select>

                    {menuAddType === 'category' && (
                      <input name="name" required placeholder="Category Name (e.g. Desserts)" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black focus:border-cyan-500 mt-6" />
                    )}

                    {menuAddType === 'item' && (
                      <div className="space-y-6 mt-6">
                        <input name="item_name" required placeholder="Dish Name" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                        <input name="description" placeholder="Description (Optional)" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-medium text-sm" />
                        <input name="price" type="number" step="0.01" required placeholder="Price (INR)" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                        <select name="category_id" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black">
                          <option value="">-- Select Category --</option>
                          {menuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {showAddModal === 'staff' && (
                  <>
                    <input name="name" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    <input name="email" type="email" required placeholder="Email Address" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    <input name="phone" required placeholder="Phone Number" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    <input name="password" type="password" required placeholder="Secure Password" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black" />
                    <select name="role" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-black">
                      <option value="WAITER">WAITER</option>
                      <option value="KITCHEN">KITCHEN</option>
                    </select>
                  </>
                )}

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setShowAddModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black p-5 rounded-2xl transition-all">CANCEL</button>
                  <button type="submit" disabled={formLoading} className="flex-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black p-5 rounded-2xl transition-all flex items-center justify-center gap-2">
                    {formLoading ? <Loader2 className="animate-spin" /> : 'CONFIRM & ADD'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR PRINT MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in overflow-y-auto">
          <div className="p-6 py-8 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-950 z-10 print:hidden">
            <div>
              <h2 className="text-3xl font-black">Table QR Codes</h2>
              <p className="text-slate-400">Print these and leave them on the respective tables.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">
                <Printer size={20} /> Print All
              </button>
              <button onClick={() => setShowQRModal(false)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
          <div className="p-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 print:grid-cols-3 print:gap-4 print:p-0">
            {tables.map(table => {
              // Create the exact URL pointing to the customer ordering route
              const orderUrl = `${window.location.origin}/order/table/${table.id}`;
              return (
                <div key={table.id} className="bg-white p-6 pb-8 rounded-[40px] flex flex-col items-center justify-center border-4 border-slate-900 print:break-inside-avoid print:border-black print:rounded-2xl">
                  <h3 className="text-4xl font-black text-black mb-4 tracking-tighter">TABLE {table.table_number}</h3>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}`}
                    alt={`QR for Table ${table.table_number}`}
                    className="w-full aspect-square mb-4 shadow border border-slate-200 rounded-xl"
                  />
                  <p className="text-black font-bold text-center text-xl mt-2">Scan to Order & Pay</p>
                  <p className="text-slate-500 font-bold tracking-widest text-xs text-center mt-2">BARKAT SMART MENU</p>
                </div>
              );
            })}

            {tables.length === 0 && (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
                <QrCode size={48} className="mb-4 opacity-50" />
                <p className="text-xl font-bold">No tables added yet.</p>
                <p>Add tables in the Floor Plan section first!</p>
              </div>
            )}
          </div>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #root > div > div.fixed.inset-0.z-\\[100\\] { position: fixed; left: 0; top: 0; width: 100%; height: auto; overflow: visible; font-family: sans-serif; display: block; }
              #root > div > div.fixed.inset-0.z-\\[100\\] * { visibility: visible; }
              button { display: none !important; }
              .p-12 { padding: 0 !important; }
              .gap-12 { gap: 1rem !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
