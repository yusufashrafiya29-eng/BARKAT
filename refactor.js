const fs = require('fs');

const path = 'C:/Users/Preneel/Desktop/raaziya malek/BARKAT/frontend/src/pages/OwnerDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Replace imports
code = code.replace(
  /import \{ useState, useEffect, type FormEvent \} from 'react';[\s\S]*?import CashRegisterTab from '\.\.\/components\/CashRegisterTab';/,
  `import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Loader2, LayoutGrid, Package, BarChart3,
  Plus, Trash2, ClipboardList, ShoppingBag, Users, Clock, QrCode, CreditCard, Banknote, FileText, Lock
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
import CashRegisterTab from '../components/CashRegisterTab';`
);

// 2. Replace everything from export default function down to // Actions
const actionIdx = code.indexOf('// Actions');
const exportIdx = code.indexOf('export default function OwnerDashboard() {');

const replacementState = `export default function OwnerDashboard() {
  const navigate = useNavigate();
  
  const { 
    activeTab, setActiveTab, loading, formLoading, setFormLoading,
    subscriptionStatus, subscriptionPlan, daysRemaining, initSubscription,
    fetchData, silentlyFetchData, tables, reservations, inventory, menuCategories, upiId, razorpayKeys
  } = useOwnerStore();

  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [acceptingReservationId, setAcceptingReservationId] = useState<string | null>(null);
  const [selectedTableIdForReservation, setSelectedTableIdForReservation] = useState<string | null>(null);
  const [menuAddType, setMenuAddType] = useState('item');
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

  `;

code = code.substring(0, exportIdx) + replacementState + code.substring(actionIdx);

// 3. Remove all handle... functions that were moved to components
// Because we already moved things like handleSaveProfile, handleChangePassword, handleSaveUpi, handleSaveRazorpay, handleUpdateStaffRole, handleDeleteStaff, handleVerifyStaff, handleImageUpload, handleToggleMenu, handleDeleteMenuItem, handleDeleteTable to components.
// We only KEEP: handleOpenRecipeEditor, handleSaveRecipe, addIngredientRow, updateIngredientRow, removeIngredientRow, handleAddSubmit, handleAcceptReservation, handleLogout.
code = code.replace(/const handleVerifyStaff[\s\S]*?const handleLogout/g, 'const handleLogout');

// Wait, the regex might match too broadly.
// Let's replace the giant rendering block instead.
const renderStart = code.indexOf("{activeTab === 'analytics' && analytics && (");
const renderEnd = code.indexOf("{/* ACCEPT RESERVATION MODAL */}");

const renderReplacement = `
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'menu' && <MenuTab handleOpenRecipeEditor={handleOpenRecipeEditor} />}
              {activeTab === 'inventory' && <InventoryTab />}
              {activeTab === 'cash_register' && <CashRegisterTab />}
              {activeTab === 'tables' && <TablesTab setShowQRModal={setShowQRModal} />}
              {activeTab === 'staff' && <StaffTab />}
              {activeTab === 'reports' && <ReportsTab setActiveTab={setActiveTab} />}
              {activeTab === 'reservations' && <ReservationsTab setShowAddModal={setShowAddModal} />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          )}
        </div>
      </main>
 
      `;

// We have to be careful with the brace closure.
// Original code had: 
//         ) : (
//           <div className="animate-in fade-in duration-300">
//             {activeTab === 'analytics' && analytics && (
//             ...
//             )}
//             {/* SETTINGS TAB */}
//             ...
//           </div>
//         )}
//       </div>
//     </main>

code = code.substring(0, renderStart) + renderReplacement + code.substring(renderEnd);

fs.writeFileSync(path, code);
console.log('Done refactoring OwnerDashboard.tsx');
