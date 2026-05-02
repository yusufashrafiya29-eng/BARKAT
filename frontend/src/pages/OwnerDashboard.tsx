import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Loader2, LayoutGrid, Package, BarChart3,
  Plus, Trash2, ClipboardList, ShoppingBag, Users, Clock, CreditCard, Banknote, FileText, Lock, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../api/owner';
import { useOwnerStore } from '../store/ownerStore';

import AnalyticsTab from '../components/owner-dashboard/AnalyticsTab';
import OrdersTab from '../components/owner-dashboard/OrdersTab';
import MenuTab from '../components/owner-dashboard/MenuTab';
import InventoryTab from '../components/owner-dashboard/InventoryTab';
import TablesTab from '../components/owner-dashboard/TablesTab';
import StaffTab from '../components/owner-dashboard/StaffTab';
import ReportsTab from '../components/owner-dashboard/ReportsTab';
import ReservationsTab from '../components/owner-dashboard/ReservationsTab';
import SettingsTab from '../components/owner-dashboard/SettingsTab';
import CashRegisterTab from '../components/CashRegisterTab';
import CustomersTab from '../components/owner-dashboard/CustomersTab';

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
  recipe_ingredients?: {id: string, stock_item_id: string, quantity: number, unit: string}[];
}



type TabType = 'analytics' | 'orders' | 'staff' | 'menu' | 'tables' | 'inventory' | 'settings' | 'reports' | 'reservations' | 'cash_register' | 'crm';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  
  const { 
    activeTab, setActiveTab, loading, formLoading, setFormLoading,
    subscriptionStatus, subscriptionPlan, daysRemaining, initSubscription,
    fetchData, tables, reservations, inventory, menuCategories
  } = useOwnerStore();

  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [acceptingReservationId, setAcceptingReservationId] = useState<string | null>(null);
  const [selectedTableIdForReservation, setSelectedTableIdForReservation] = useState<string | null>(null);
  const [menuAddType, setMenuAddType] = useState('item');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'basic' | 'pro' | 'max'>('pro');
  const [editingRecipeItemId, setEditingRecipeItemId] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{stock_item_id: string, quantity: number, unit: string}[]>([]);

  const isFeatureLocked = (tabName: string) => {
    if (subscriptionPlan === 'max') return false;
    if (subscriptionPlan === 'pro' && ['reports', 'staff'].includes(tabName)) return true;
    if (subscriptionPlan === 'basic' && ['inventory', 'cash_register', 'reports', 'staff'].includes(tabName)) return true;
    return false;
  };

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'OWNER') {
      toast.error("Unauthorized");
      navigate('/login');
    } else {
      initSubscription();
      fetchData();
      const interval = setInterval(() => {
        const { activeTab } = useOwnerStore.getState();
        if (['analytics', 'reservations'].includes(activeTab)) {
          useOwnerStore.getState().silentlyFetchData();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [navigate]);

  // Actions
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleOpenRecipeEditor = (item: MenuItem) => {
    setEditingRecipeItemId(item.id);
    setRecipeIngredients(item.recipe_ingredients?.map(r => ({
      stock_item_id: r.stock_item_id,
      quantity: r.quantity,
      unit: r.unit
    })) || []);
  };

  const handleSaveRecipe = async () => {
    if (!editingRecipeItemId) return;
    setFormLoading(true);
    try {
      await ownerApi.updateMenuItemRecipe(editingRecipeItemId, recipeIngredients);
      toast.success("Recipe saved successfully!");
      setEditingRecipeItemId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save recipe");
    } finally {
      setFormLoading(false);
    }
  };

  const addIngredientRow = () => {
    setRecipeIngredients([...recipeIngredients, { stock_item_id: '', quantity: 0, unit: '' }]);
  };
  
  const updateIngredientRow = (index: number, field: string, value: any) => {
    const newRows = [...recipeIngredients];
    newRows[index] = { ...newRows[index], [field]: value };
    if (field === 'stock_item_id') {
      const stockItem = inventory.find(i => i.id === value);
      if (stockItem) newRows[index].unit = stockItem.unit;
    }
    setRecipeIngredients(newRows);
  };
  
  const removeIngredientRow = (index: number) => {
    const newRows = [...recipeIngredients];
    newRows.splice(index, 1);
    setRecipeIngredients(newRows);
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
          restaurant_email: 'admin@MyRestro.local'
        });
      } else if (showAddModal === 'menu') {
        if (menuAddType === 'category') {
          await ownerApi.addCategory({ name: data.name as string, station: (data.station as string) || 'Kitchen' });
        } else {
          await ownerApi.addMenuItem({
            name: data.item_name as string,
            description: (data.description as string) || undefined,
            price: parseFloat(data.price as string),
            category_id: data.category_id as string,
            is_veg: data.is_veg === 'true',
            is_available: true,
            tax_rate: parseFloat((data.tax_rate as string) || "5.0")
          });
        }
      } else if (showAddModal === 'reservations') {
        await ownerApi.addManualReservation({
          customer_name: formData.get('customer_name'),
          customer_phone: formData.get('customer_phone'),
          reservation_date: formData.get('reservation_date'),
          reservation_time: formData.get('reservation_time') + ":00",
          guest_count: parseInt(formData.get('guest_count') as string),
        });
        toast.success("Reservation added");
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

  const handleAcceptReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptingReservationId || !selectedTableIdForReservation) {
      toast.error('Please select a table');
      return;
    }
    setFormLoading(true);
    try {
      await ownerApi.updateReservationStatus(acceptingReservationId, 'CONFIRMED', selectedTableIdForReservation);
      toast.success('Reservation accepted and table assigned!');
      setAcceptingReservationId(null);
      setSelectedTableIdForReservation(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to accept reservation');
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
            { id: 'crm', label: 'CRM & Loyalty', icon: Heart },
            { id: 'orders', label: 'Order History', icon: ClipboardList },
            { id: 'reservations', label: 'Bookings', icon: Clock },
            { id: 'reports', label: 'CA Reports', icon: FileText },
            { id: 'cash_register', label: 'Cash Register', icon: Banknote },
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
          ) : isFeatureLocked(activeTab) ? (
            <div className="h-64 flex flex-col items-center justify-center border border-slate-200 rounded-2xl bg-white shadow-sm mt-8 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Feature Locked</h3>
              <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
                This feature is not available on your current <strong>{subscriptionPlan.toUpperCase()}</strong> plan. 
                Upgrade your subscription to unlock {activeTab.replace('_', ' ')} and grow your business!
              </p>
              <button
                onClick={() => {
                  setSelectedUpgradePlan(subscriptionPlan === 'basic' ? 'pro' : 'max');
                  setShowUpgradeModal(true);
                }}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}
              >
                Upgrade to {subscriptionPlan === 'basic' ? 'PRO' : 'MAX'}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              
              
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'menu' && <MenuTab handleOpenRecipeEditor={handleOpenRecipeEditor} />}
              {activeTab === 'inventory' && <InventoryTab />}
              {activeTab === 'cash_register' && <CashRegisterTab />}
              {activeTab === 'tables' && <TablesTab setShowQRModal={setShowQRModal} />}
              {activeTab === 'staff' && <StaffTab />}
              {activeTab === 'reports' && <ReportsTab setActiveTab={setActiveTab} />}
              {activeTab === 'reservations' && <ReservationsTab setShowAddModal={setShowAddModal} />}
              {activeTab === 'crm' && <CustomersTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          )}
        </div>
      </main>
 
      {/* ACCEPT RESERVATION MODAL */}
      {acceptingReservationId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !formLoading && setAcceptingReservationId(null)}></div>
          <div className="relative w-full max-w-4xl surface p-6 sm:p-8 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <h3 className="text-[20px] font-bold mb-1">Assign Table to Booking</h3>
            <p className="text-[13px] text-slate-500 mb-6">Select an available table for the customer</p>
            
            <form onSubmit={handleAcceptReservation} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-8">
                {['AC', 'Non-AC'].map(section => {
                  const sectionTables = tables.filter((t: any) => (t.category || t.section || 'Non-AC') === section);
                  if (sectionTables.length === 0) return null;
                  return (
                    <div key={section}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                          style={section === 'AC'
                            ? { background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }
                            : { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                          }
                        >
                          {section === 'AC' ? '❄️ AC Section' : '🌿 Non-AC Section'}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {sectionTables.map(table => {
                          const today = new Date().toISOString().split('T')[0];
                          const tableReservations = reservations.filter(r => 
                            r.table_id === table.id && 
                            (r.status === 'CONFIRMED' || r.payment_status === 'PAID') && 
                            r.reservation_date.startsWith(today)
                          );
                          const isReserved = tableReservations.length > 0;
                          const isSelected = selectedTableIdForReservation === table.id;
                          
                          return (
                            <button
                              key={table.id}
                              type="button"
                              onClick={() => setSelectedTableIdForReservation(table.id)}
                              className={`relative group bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200`}
                              style={{
                                border: `2px solid ${isSelected ? '#4f46e5' : isReserved ? '#fcd34d' : '#e2e8f0'}`,
                                boxShadow: isSelected ? '0 4px 15px rgba(79, 70, 229, 0.2)' : '0 1px 4px rgb(0 0 0 / .04)',
                                background: isSelected ? '#eef2ff' : isReserved ? '#fffbeb' : '#ffffff',
                              }}
                            >
                              {isSelected && (
                                <span className="absolute -top-2.5 right-[-5px] w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[12px] font-bold z-10 shadow-md">✓</span>
                              )}
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-[16px] transition-transform duration-200"
                                style={{
                                  background: isSelected ? '#4338ca' : isReserved ? '#fef3c7' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                                  color: isSelected ? '#ffffff' : isReserved ? '#b45309' : '#94a3b8',
                                  border: `1.5px solid ${isSelected ? '#4338ca' : isReserved ? '#fde68a' : '#e2e8f0'}`,
                                }}
                              >
                                {table.table_number}
                              </div>
                              <div className="text-center">
                                <p className={`text-[10px] font-bold mb-1 uppercase tracking-wide ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{table.capacity} seats</p>
                                <div
                                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                                  style={{
                                    background: isSelected ? '#c7d2fe' : isReserved ? '#fef3c7' : '#f8fafc',
                                    color: isSelected ? '#4338ca' : isReserved ? '#b45309' : '#94a3b8',
                                  }}
                                >
                                  {isReserved ? `Rsrv ${tableReservations[0].reservation_time.substring(0,5)}` : 'FREE'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-5 mt-auto border-t border-slate-200 flex gap-3">
                <button type="button" onClick={() => { setAcceptingReservationId(null); setSelectedTableIdForReservation(null); }} className="btn-secondary flex-1 py-3 text-[14px]">Cancel</button>
                <button type="submit" disabled={formLoading || !selectedTableIdForReservation} className="btn flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0 py-3 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">
                  {formLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ENTITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-main/80 backdrop-blur-sm" onClick={() => !formLoading && setShowAddModal(null)}></div>
          <div className="relative w-full max-w-md surface p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-semibold mb-6">
              Add New {showAddModal === 'inventory' ? 'Inventory Item' : showAddModal.replace('ie', 'y').slice(0, -1)}
            </h3>
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
                      <select name="unit" required className="form-input" defaultValue="">
                        <option value="" disabled>Select Unit</option>
                        <option value="kg">kg</option>
                        <option value="gm">gm</option>
                        <option value="ltr">ltr</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                        <option value="pkt">pkt</option>
                        <option value="box">box</option>
                      </select>
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
                    <>
                      <div className="space-y-1.5 mb-4">
                        <label className="text-[12px] font-medium text-main">Category Name</label>
                        <input name="name" required className="form-input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Routing Station (KDS)</label>
                        <select name="station" required className="form-input">
                          <option value="Kitchen">Kitchen</option>
                          <option value="Bar">Bar</option>
                          <option value="Dessert">Dessert Station</option>
                        </select>
                      </div>
                    </>
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
                            {menuCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Item Type</label>
                          <select name="is_veg" className="form-input">
                            <option value="true">Vegetarian 🟢</option>
                            <option value="false">Non-Vegetarian 🔴</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Tax Rate (%)</label>
                          <select name="tax_rate" className="form-input">
                            <option value="5.0">5% GST (Standard)</option>
                            <option value="12.0">12% GST</option>
                            <option value="18.0">18% GST (AC/Liquor)</option>
                            <option value="0.0">0% GST (Exempt)</option>
                          </select>
                        </div>
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
                        <option value="MANAGER">Manager</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
 
                  {showAddModal === 'reservations' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Customer Name</label>
                        <input name="customer_name" required className="form-input" placeholder="e.g. John Doe" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Phone Number</label>
                        <input name="customer_phone" required className="form-input" placeholder="e.g. +919876543210" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Date</label>
                          <input name="reservation_date" type="date" required className="form-input" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-main">Time</label>
                          <input name="reservation_time" type="time" required className="form-input" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-main">Number of Guests</label>
                        <input name="guest_count" type="number" min="1" required className="form-input" defaultValue="2" />
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
 
      {/* RECIPE BOM EDITOR MODAL */}
      {editingRecipeItemId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !formLoading && setEditingRecipeItemId(null)}></div>
          <div className="relative w-full max-w-2xl surface p-6 sm:p-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <h3 className="text-[20px] font-bold mb-1">Recipe / BOM Editor</h3>
            <p className="text-[13px] text-slate-500 mb-6">Manage raw inventory deducted when this item is sold.</p>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
              {recipeIngredients.map((ing, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Raw Material</label>
                    <select 
                      value={ing.stock_item_id}
                      onChange={e => {
                        const newArr = [...recipeIngredients];
                        newArr[idx].stock_item_id = e.target.value;
                        setRecipeIngredients(newArr);
                      }}
                      className="form-input text-[13px]"
                    >
                      <option value="">Select Item...</option>
                      {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (in {inv.unit})</option>)}
                    </select>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Qty</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={ing.quantity}
                      onChange={e => {
                        const newArr = [...recipeIngredients];
                        newArr[idx].quantity = parseFloat(e.target.value);
                        setRecipeIngredients(newArr);
                      }}
                      className="form-input text-[13px]"
                    />
                  </div>
                  <div className="w-20 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unit</label>
                    <input 
                      type="text" 
                      value={ing.unit}
                      onChange={e => {
                        const newArr = [...recipeIngredients];
                        newArr[idx].unit = e.target.value;
                        setRecipeIngredients(newArr);
                      }}
                      className="form-input text-[13px]"
                      placeholder="e.g. g, ml"
                    />
                  </div>
                  <button 
                    onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                    className="p-2.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => setRecipeIngredients([...recipeIngredients, { stock_item_id: '', quantity: 1, unit: 'g' }])}
                className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold text-[13px] hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Ingredient
              </button>
            </div>
            
            <div className="pt-4 border-t border-slate-200 flex gap-3 mt-auto">
              <button onClick={() => setEditingRecipeItemId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveRecipe} disabled={formLoading} className="btn flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                {formLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Save Recipe'}
              </button>
            </div>
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
                    <p className="text-gray-500 text-[12px] mt-1 uppercase tracking-widest">{localStorage.getItem('restaurantName') || 'MyRestro'}</p>
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
              {localStorage.getItem('restaurantLogo') ? (
                <img src={localStorage.getItem('restaurantLogo')!} alt="Logo" className="h-16 w-16 object-contain bg-white rounded-2xl p-1.5 mx-auto mb-3 shadow-lg" />
              ) : (
                <img src="/logo.png" alt="MyRestro" className="h-12 w-auto object-contain bg-white rounded-xl p-1.5 mx-auto mb-3 shadow-lg" />
              )}
              <h2 className="text-[22px] font-black text-white tracking-tight">Upgrade to Premium</h2>
              <p className="text-indigo-200 text-[13px] mt-1">Full access to all MyRestro features</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Plans */}
              <div className="grid grid-cols-3 gap-2">
                {/* Basic */}
                <button
                  onClick={() => setSelectedUpgradePlan('basic')}
                  className={`rounded-2xl border-2 p-2.5 text-center transition-all ${selectedUpgradePlan === 'basic' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}
                >
                  <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest mb-1">Basic</p>
                  <p className="text-[20px] font-black text-slate-900 leading-none">₹499</p>
                  <p className="text-[9px] text-slate-500 mt-1">/ mo</p>
                </button>
                {/* Pro */}
                <button
                  onClick={() => setSelectedUpgradePlan('pro')}
                  className={`rounded-2xl border-2 p-2.5 text-center relative overflow-hidden transition-all ${selectedUpgradePlan === 'pro' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-100 bg-slate-50 hover:border-emerald-200'}`}
                >
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider">POPULAR</div>
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1">Pro</p>
                  <p className="text-[20px] font-black text-slate-900 leading-none">₹999</p>
                  <p className="text-[9px] text-slate-500 mt-1">/ mo</p>
                </button>
                {/* Max */}
                <button
                  onClick={() => setSelectedUpgradePlan('max')}
                  className={`rounded-2xl border-2 p-2.5 text-center transition-all ${selectedUpgradePlan === 'max' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-slate-100 bg-slate-50 hover:border-purple-200'}`}
                >
                  <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest mb-1">Max</p>
                  <p className="text-[20px] font-black text-slate-900 leading-none">₹1399</p>
                  <p className="text-[9px] text-slate-500 mt-1">/ mo</p>
                </button>
              </div>

              {/* Features */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Features Included</p>
                {selectedUpgradePlan === 'basic' && ['POS Billing & Waiter Dashboard', 'Menu & Category Management', 'Table & Floorplan Management', 'Customer QR Menu & Ordering', 'Basic Daily Analytics'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px] text-slate-700 font-medium">
                    <span className="text-indigo-500 font-bold text-[14px]">✓</span> {f}
                  </div>
                ))}
                {selectedUpgradePlan === 'pro' && ['Everything in Basic Plan', 'Kitchen Display System (KDS)', 'Inventory & Recipes (BOM)', 'Cash Register & Shift Tracking', 'Thermal Receipt Printing'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px] text-slate-700 font-medium">
                    <span className="text-emerald-500 font-bold text-[14px]">✓</span> {f}
                  </div>
                ))}
                {selectedUpgradePlan === 'max' && ['Everything in Pro Plan', 'Advanced GST & CA Reports', 'Staff Mgmt & Approvals', 'Zomato/Swiggy Sync (Upcoming)', 'WhatsApp CRM (Upcoming)'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px] text-slate-700 font-medium">
                    <span className="text-purple-500 font-bold text-[14px]">✓</span> {f}
                  </div>
                ))}
              </div>

              {/* Payment Instructions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-[12px] font-bold text-slate-800 mb-3">Scan to Pay via UPI</p>
                <div className="inline-block p-2 bg-white border border-slate-200 rounded-xl mb-3 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=9979114665@kotak811&pn=MyRestro&am=${selectedUpgradePlan === 'basic' ? '499' : selectedUpgradePlan === 'pro' ? '999' : '1399'}&cu=INR`)}`}
                    alt="UPI QR"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Amount: <strong className="text-slate-800">₹{selectedUpgradePlan === 'basic' ? '499' : selectedUpgradePlan === 'pro' ? '999' : '1399'}</strong></p>
                <p className="text-[11px] text-slate-500 mt-1">UPI ID: <strong>9979114665@kotak811</strong></p>
              </div>

              {/* WhatsApp CTA */}
              <button
                onClick={() => {
                  const restaurantName = localStorage.getItem('restaurantName') || 'my restaurant';
                  const msg = encodeURIComponent(`Hi MyRestro! I've paid for the *${selectedUpgradePlan.toUpperCase()}* subscription for ${restaurantName}. Please activate my account. 🙏`);
                  window.open(`https://wa.me/919979114665?text=${msg}`, '_blank');
                }}
                className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_20px_rgba(37,211,102,0.4)] bg-[#25D366]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Paid? Notify on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RECIPE EDITOR MODAL */}
      {editingRecipeItemId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !formLoading && setEditingRecipeItemId(null)}></div>
          <div className="relative w-full max-w-2xl surface p-6 sm:p-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <h3 className="text-[20px] font-bold mb-1">Recipe Editor (BOM)</h3>
            <p className="text-[13px] text-slate-500 mb-6">Define the raw materials required for this menu item. Inventory will auto-deduct upon sale.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
              {recipeIngredients.map((ing, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <select
                    value={ing.stock_item_id}
                    onChange={(e) => updateIngredientRow(idx, 'stock_item_id', e.target.value)}
                    className="form-input flex-1 py-2 text-[13px]"
                    required
                  >
                    <option value="" disabled>Select Raw Material</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                    value={ing.quantity || ''}
                    onChange={(e) => updateIngredientRow(idx, 'quantity', parseFloat(e.target.value))}
                    className="form-input w-24 py-2 text-[13px]"
                    required
                  />
                  <div className="w-12 text-[11px] font-bold uppercase text-slate-400">{ing.unit || '-'}</div>
                  <button type="button" onClick={() => removeIngredientRow(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addIngredientRow} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl text-[13px] font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Add Ingredient
              </button>
            </div>
            
            <div className="pt-5 border-t border-slate-200 flex gap-3 mt-auto">
              <button type="button" onClick={() => setEditingRecipeItemId(null)} className="btn-secondary flex-1 py-3 text-[14px]">Cancel</button>
              <button type="button" onClick={handleSaveRecipe} disabled={formLoading} className="btn flex-1 py-3 text-[14px]">
                {formLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Save Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
