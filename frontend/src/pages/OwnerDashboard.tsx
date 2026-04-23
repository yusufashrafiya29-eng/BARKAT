import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, LogOut, Loader2,
  LayoutGrid, Package, BarChart3,
  Plus, Trash2, IndianRupee, ClipboardList,
  ShoppingBag, Users, Clock, QrCode, CreditCard,
  TrendingUp, Activity, Flame, ImagePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../api/owner';
import { waiterApi } from '../api/waiter';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Interfaces
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id: string;
  is_veg: boolean;
  is_available: boolean;
  image_url?: string;
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
  is_approved: boolean;
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

type TabType = 'analytics' | 'orders' | 'staff' | 'menu' | 'tables' | 'inventory' | 'settings';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [isUploadingImage, setIsUploadingImage] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Data States
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'total_orders' | 'active_orders' | 'completed'>('revenue');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [upiId, setUpiId] = useState('');
  const [razorpayKeys, setRazorpayKeys] = useState({ razorpay_key_id: '', razorpay_key_secret: '' });
  const [showAddModal, setShowAddModal] = useState<TabType | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [menuAddType, setMenuAddType] = useState('item');

  // Subscription State
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'OWNER') {
      toast.error("Unauthorized");
      navigate('/login');
    } else {
      // Fetch subscription info once on mount
      import('../api/auth').then(({ authApi }) => {
        authApi.getMe().then(({ data }) => {
          if (data) {
            const status = data.subscription_status;
            const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
            const subEnd = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null;
            const now = new Date();
            const endDate = status === 'active' ? subEnd : trialEnd;
            if (endDate) {
              const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setDaysRemaining(Math.max(0, diff));
            }
            setSubscriptionStatus(status || 'trial');
          }
        }).catch(() => {});
      });

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
          const [silAnalyticRes, silHistoryRes] = await Promise.all([
            ownerApi.getDailyAnalytics(),
            ownerApi.getHistoryAnalytics()
          ]);
          setAnalytics(silAnalyticRes);
          setHistoryData(silHistoryRes);
          break;
        case 'orders':
          const ordersResSil = await ownerApi.getOwnerOrders();
          setHistoricalOrders(ordersResSil);
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
        case 'settings':
          const [payRes, rzpRes] = await Promise.all([
            ownerApi.getUpiId(),
            ownerApi.getRazorpayKeys()
          ]);
          setUpiId(payRes.upi_id || '');
          setRazorpayKeys(rzpRes);
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
          const [analyticRes, historyRes] = await Promise.all([
            ownerApi.getDailyAnalytics(),
            ownerApi.getHistoryAnalytics()
          ]);
          setAnalytics(analyticRes);
          setHistoryData(historyRes);
          break;
        case 'orders':
          const ordersRes = await ownerApi.getOwnerOrders();
          setHistoricalOrders(ordersRes);
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
        case 'settings':
          const [payResData, rzpResData] = await Promise.all([
            ownerApi.getUpiId(),
            ownerApi.getRazorpayKeys()
          ]);
          setUpiId(payResData.upi_id || '');
          setRazorpayKeys(rzpResData);
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
      toast.success(`✅ ${name || 'Staff'} approved! They can now log in.`);
      fetchData();
    } catch { toast.error("Approval failed"); }
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    
    setIsUploadingImage(prev => ({ ...prev, [itemId]: true }));
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      await ownerApi.uploadMenuItemImage(itemId, formData);
      toast.success("Image uploaded successfully");
      fetchData(); // refresh menu to get new image URL
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to upload image");
    } finally {
      setIsUploadingImage(prev => ({ ...prev, [itemId]: false }));
    }
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

  const handleDeleteMenuItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from the menu?`)) return;
    try {
      await ownerApi.deleteMenuItem(itemId);
      toast.success(`${name} deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleDeleteTable = async (id: string, num: number) => {
    if (!window.confirm(`Delete Table ${num}?`)) return;
    try {
      await ownerApi.deleteTable(id);
      toast.success("Table deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const handleSaveUpi = async (e: FormEvent<HTMLFormElement>) => {
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

  const handleSaveRazorpay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const keyId = formData.get('razorpay_key_id') as string;
    const keySecret = formData.get('razorpay_key_secret') as string;

    try {
      await ownerApi.updateRazorpayKeys({ razorpay_key_id: keyId, razorpay_key_secret: keySecret });
      toast.success("Razorpay Configuration Saved");
      fetchData();
    } catch {
      toast.error("Failed to save Razorpay settings");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await ownerApi.updateProfile(formData);
      toast.success(res.message);
      if (res.name) localStorage.setItem('restaurantName', res.name);
      if (res.logo_url) {
        localStorage.setItem('restaurantLogo', res.logo_url);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const current_password = formData.get('current_password') as string;
    const new_password = formData.get('new_password') as string;
    
    try {
      await ownerApi.changePassword({ current_password, new_password });
      toast.success("Password changed successfully");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Form Submission Handlers
  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      {/* Fixed Dark Indigo Sidebar */}
      <aside
        className="w-64 flex flex-col sticky top-0 h-screen z-50"
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
          borderRight: '1px solid #3730a3',
        }}
      >
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #3730a340' }}>
          <div className="flex items-center gap-3">
            {/* Logo */}
            {localStorage.getItem('restaurantLogo') ? (
              <img
                src={localStorage.getItem('restaurantLogo')!}
                alt="Logo"
                className="w-14 h-14 shrink-0 object-contain rounded-xl"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)', boxShadow: '0 4px 15px #6366f140' }}>
                <span className="text-white font-extrabold text-[20px]">
                  {(localStorage.getItem('restaurantName') || 'R').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Name + badge */}
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" style={{boxShadow:'0 0 6px #34d399'}} />
                <h1 className="text-[14px] font-extrabold tracking-tight truncate leading-none text-white">
                  {localStorage.getItem('restaurantName') || 'My Restaurant'}
                </h1>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: '#ffffff15', color: '#a5b4fc', border: '1px solid #6366f140' }}
              >
                Owner Portal
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366f1aa' }}>
          Overview
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {[
            { id: 'analytics', label: 'Performance', icon: BarChart3 },
            { id: 'orders', label: 'Order History', icon: ClipboardList },
            { id: 'menu', label: 'Menu Catalog', icon: Package },
            { id: 'tables', label: 'Floor Plan', icon: LayoutGrid },
            { id: 'staff', label: 'Staff Roster', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: ShoppingBag },
            { id: 'settings', label: 'Settings', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all"
              style={activeTab === tab.id
                ? { background: '#6366f1', color: '#fff', fontWeight: 600, boxShadow: '0 4px 12px #6366f150' }
                : { color: '#a5b4fc', background: 'transparent', fontWeight: 400 }
              }
              onMouseEnter={e => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLElement).style.background = '#ffffff12';
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <tab.icon size={15} style={{ color: activeTab === tab.id ? '#fff' : '#6366f1' }} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Subscription Widget */}
        <div className="mx-3 mb-3 p-3 rounded-xl"
          style={{ border: '1px solid #6366f130', background: '#ffffff0a' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              subscriptionStatus === 'active' ? 'bg-emerald-400' :
              daysRemaining && daysRemaining > 3 ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              {subscriptionStatus === 'active' ? 'Subscription Active' : 'Free Trial'}
            </span>
          </div>
          {daysRemaining !== null && (
            <p className="text-[12px] mb-2" style={{ color: '#64748b' }}>
              <span className={`font-extrabold ${daysRemaining > 3 ? 'text-amber-400' : 'text-red-400'}`}>
                {daysRemaining} days
              </span> remaining
            </p>
          )}
          {subscriptionStatus !== 'active' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}
            >
              🚀 Upgrade Now
            </button>
          )}
        </div>

        <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid #3730a340' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors"
            style={{ color: '#a5b4fc' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff12'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LayoutGrid size={15} />
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors"
            style={{ color: '#a5b4fc' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef444420'; (e.currentTarget as HTMLElement).style.color = '#fca5a5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; }}
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
                </div>
              )}
 
              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="surface overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-subtle bg-subtle/50">
                        <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Date & Time</th>
                        <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Customer</th>
                        <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Order Details</th>
                        <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider text-right">Bill Expected</th>
                        <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {historicalOrders.map(order => (
                        <tr key={order.id} className="hover:bg-subtle/30 transition-colors">
                          <td className="px-5 py-4 align-top">
                            <div className="text-[13px] font-medium text-main">{order.date}</div>
                            <div className="text-[11px] text-muted">{order.day} at {order.time}</div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-[13px] font-bold text-slate-700 capitalize">{order.customer_name || 'No Name'}</div>
                            <div className="text-[12px] font-medium text-slate-500 mt-0.5">{order.customer_phone}</div>
                            {order.customer_phone === "Walk-in" && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1.5 inline-block">POS SYSTEM</span>}
                          </td>
                          <td className="px-5 py-4 align-top max-w-[280px]">
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((item: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                  <span className="font-bold text-indigo-500 mr-1">{item.quantity}x</span> {item.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            <div className="text-[15px] font-extrabold text-indigo-600">₹{order.total_amount}</div>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            {order.status === 'SERVED' && <span className="text-[11px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Completed</span>}
                            {order.status === 'CANCELLED' && <span className="text-[11px] font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Cancelled</span>}
                            {['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status) && <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Currently Active</span>}
                          </td>
                        </tr>
                      ))}
                      {historicalOrders.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-[13px] text-muted">No orders found in history.</td></tr>
                      )}
                    </tbody>
                  </table>
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
                            
                            {/* Image Section */}
                            <div className="w-full h-32 rounded-xl bg-subtle/30 overflow-hidden mb-4 relative group/image">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                                  <ImagePlus size={24} className="mb-2 opacity-50" />
                                  <span className="text-[10px] font-medium uppercase tracking-wider">No Photo</span>
                                </div>
                              )}
                              
                              {/* Hover Upload Overlay */}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                                {isUploadingImage[item.id] ? (
                                  <Loader2 size={24} className="animate-spin text-white" />
                                ) : (
                                  <>
                                    <ImagePlus size={20} className="text-white mb-1" />
                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">{item.image_url ? 'Change Photo' : 'Upload Photo'}</span>
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/jpeg, image/png, image/webp" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleImageUpload(item.id, e.target.files[0]);
                                        }
                                      }}
                                    />
                                  </>
                                )}
                              </label>
                            </div>

                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-[14px] font-medium pr-4 text-main">{item.name}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[13px] text-muted">₹{item.price}</span>
                                <button 
                                  onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                  className="text-muted hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
                                  title="Delete Item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
              {activeTab === 'staff' && (() => {
                const pendingStaff = staff.filter(u => !u.is_approved);
                const activeStaff  = staff.filter(u => u.is_approved);
                return (
                  <div className="space-y-6">

                    {/* Pending Approval Section */}
                    {pendingStaff.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                            {pendingStaff.length} Awaiting Approval
                          </span>
                          <div className="flex-1 h-px bg-amber-200/60" />
                        </div>
                        <div className="surface overflow-hidden border-amber-200">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-amber-100 bg-amber-50/60">
                                <th className="px-5 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-wider">Team Member</th>
                                <th className="px-5 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-wider">Role</th>
                                <th className="px-5 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-wider">OTP Status</th>
                                <th className="px-5 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-wider text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                              {pendingStaff.map(user => (
                                <tr key={user.id} className="hover:bg-amber-50/40 transition-colors">
                                  <td className="px-5 py-3">
                                    <div className="text-[14px] font-semibold text-slate-800">{user.full_name || 'Unknown'}</div>
                                    <div className="text-[12px] text-slate-500">{user.email}</div>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="text-[11px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">{user.role}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    {user.is_verified
                                      ? <span className="text-[11px] font-medium text-emerald-600">✅ Email Verified</span>
                                      : <span className="text-[11px] font-medium text-slate-400">⏳ OTP Pending</span>
                                    }
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleVerifyStaff(user.id, user.full_name)}
                                        className="text-[12px] font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 8px #10b98130' }}
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStaff(user.id)}
                                        className="text-muted hover:text-rose-500 transition-colors p-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Active Staff Section */}
                    <div>
                      {pendingStaff.length > 0 && (
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            {activeStaff.length} Active Staff
                          </span>
                          <div className="flex-1 h-px bg-emerald-200/60" />
                        </div>
                      )}
                      <div className="surface overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-subtle bg-subtle/50">
                              <th className="px-5 py-3 text-[12px] font-medium text-muted">Team Member</th>
                              <th className="px-5 py-3 text-[12px] font-medium text-muted">Role</th>
                              <th className="px-5 py-3 text-[12px] font-medium text-muted">Status</th>
                              <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-subtle">
                            {activeStaff.map(user => (
                              <tr key={user.id} className="hover:bg-subtle/30 transition-colors">
                                <td className="px-5 py-3">
                                  <div className="text-[14px] font-medium text-main">{user.full_name || 'System User'}</div>
                                  <div className="text-[12px] text-muted">{user.email}</div>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-[11px] font-medium bg-subtle px-2 py-1 rounded border border-subtle">{user.role}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-[12px] text-emerald-600 font-medium">✅ Active</span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteStaff(user.id)}
                                    className="text-muted hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {activeStaff.length === 0 && (
                              <tr><td colSpan={4} className="p-8 text-center text-[13px] text-muted">No active staff yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                );
              })()}
 
              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="max-w-xl">
                
                  {/* PROFILE SETTINGS */}
                  <div className="surface p-6 mb-6">
                    <h3 className="text-[15px] font-medium mb-1">Restaurant Profile</h3>
                    <p className="text-[13px] text-muted mb-6">Update your restaurant's brand identity.</p>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Restaurant Name</label>
                        <input
                          name="name"
                          defaultValue={localStorage.getItem('restaurantName') || ''}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Restaurant Logo (Optional)</label>
                        <input
                          name="logo"
                          type="file"
                          accept="image/*"
                          className="w-full text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[12px] file:font-medium file:bg-main file:text-surface hover:file:bg-main/90"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button type="submit" disabled={formLoading} className="btn">
                          {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Update Profile'}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {/* SECURITY SETTINGS */}
                  <div className="surface p-6 mb-6">
                    <h3 className="text-[15px] font-medium mb-1">Security</h3>
                    <p className="text-[13px] text-muted mb-6">Update your owner account password.</p>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Current Password</label>
                        <input
                          name="current_password"
                          type="password"
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">New Password</label>
                        <input
                          name="new_password"
                          type="password"
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button type="submit" disabled={formLoading} className="btn-secondary">
                          {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  </div>

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
                     <div className="surface p-6 text-center border-dashed mb-6">
                        <p className="text-[12px] text-muted mb-4">Payment QR Preview</p>
                        <div className="bg-white p-2 inline-block rounded-md mx-auto">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Dine_Flow&cu=INR`)}`}
                            alt="UPI QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <p className="mt-4 text-[13px] text-muted font-mono">{upiId}</p>
                     </div>
                  )}

                  <div className="surface p-6 mb-6">
                    <h3 className="text-[15px] font-medium mb-1">Razorpay Integration</h3>
                    <p className="text-[13px] text-muted mb-6">Configure Razorpay keys for online card, netbanking, and wallet payments.</p>
 
                    <form onSubmit={handleSaveRazorpay} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Razorpay Key ID</label>
                        <input
                          name="razorpay_key_id"
                          defaultValue={razorpayKeys.razorpay_key_id}
                          placeholder="rzp_live_..."
                          className="form-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Razorpay Key Secret</label>
                        <input
                          name="razorpay_key_secret"
                          type="password"
                          defaultValue={razorpayKeys.razorpay_key_secret}
                          placeholder="Secret Key"
                          className="form-input"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={formLoading} className="btn">
                          {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Keys'}
                        </button>
                      </div>
                    </form>
                  </div>
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
                    <p className="text-gray-500 text-[12px] mt-1 uppercase tracking-widest">{localStorage.getItem('restaurantName') || 'Dine Flow'}</p>
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

      {/* ── Upgrade / Pricing Modal ─────────────────────────── */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-7 text-center" style={{ background: 'linear-gradient(135deg,#1e1b4b,#4338ca,#6366f1)' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors text-[18px] font-bold"
              >×</button>
              <img src="/dineflow-logo.png" alt="Dine Flow" className="h-12 w-auto object-contain mx-auto mb-3 brightness-0 invert" />
              <h2 className="text-[22px] font-black text-white tracking-tight">Upgrade to Premium</h2>
              <p className="text-indigo-200 text-[13px] mt-1">Full access to all Dine Flow features</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Plans */}
              <div className="grid grid-cols-2 gap-3">
                {/* Monthly */}
                <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-4 text-center">
                  <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-1">Monthly</p>
                  <p className="text-[28px] font-black text-slate-900 leading-none">₹999</p>
                  <p className="text-[11px] text-slate-500 mt-1">per month</p>
                </div>
                {/* Yearly */}
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center relative overflow-hidden">
                  <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">SAVE 17%</div>
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1">Yearly</p>
                  <p className="text-[28px] font-black text-slate-900 leading-none">₹9,999</p>
                  <p className="text-[11px] text-slate-500 mt-1">per year</p>
                </div>
              </div>

              {/* Features */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                {['Complete Owner Dashboard','Waiter Console & KDS Station','QR Code Ordering','Real-time Analytics','Priority Support'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[13px] text-slate-700">
                    <span className="text-emerald-500 font-bold text-[15px]">✓</span> {f}
                  </div>
                ))}
              </div>

              {/* Payment Instructions */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[12px] font-bold text-orange-700 uppercase tracking-wider mb-2">📲 How to Pay</p>
                <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
                  Pay via UPI to the ID below, then send payment screenshot on WhatsApp to activate instantly.
                </p>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-orange-200 px-3 py-2">
                  <span className="text-[13px] font-extrabold text-slate-900 flex-1">9979114665@kotak811</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText('9979114665@kotak811'); toast.success('UPI ID copied!'); }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >Copy</button>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <button
                onClick={() => {
                  const restaurantName = localStorage.getItem('restaurantName') || 'my restaurant';
                  const msg = encodeURIComponent(`Hi Dine Flow! I've paid for the subscription for ${restaurantName}. Please activate my account. 🙏`);
                  window.open(`https://wa.me/919979114665?text=${msg}`, '_blank');
                }}
                className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.4)' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Paid? Notify on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
