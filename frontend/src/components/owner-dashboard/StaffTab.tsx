import { useState } from 'react';
import { Trash2, Settings2, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function StaffTab() {
  const { staff, menuCategories, fetchData } = useOwnerStore();

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const handleVerifyStaff = async (id: string, name: string | null) => {
    try {
      await ownerApi.verifyStaff(id);
      toast.success(`✅ ${name || 'Staff'} approved! They can now log in.`);
      fetchData();
    } catch { toast.error("Approval failed"); }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Delete staff permanently?")) return;
    try {
      await ownerApi.deleteStaff(id);
      toast.success("Staff removed");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const handleUpdateStaffRole = async (id: string, role: string) => {
    try {
      await ownerApi.updateStaffRole(id, role);
      toast.success("Staff role updated");
      fetchData();
    } catch { toast.error("Update failed"); }
  };

  const openAccessModal = (user: any) => {
    setSelectedStaff(user);
    setSelectedCategories(user.allowed_categories || []);
    setAccessModalOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleSaveAccess = async () => {
    if (!selectedStaff) return;
    setIsSavingAccess(true);
    try {
      await ownerApi.updateStaffAccess(selectedStaff.id, selectedCategories);
      toast.success("Menu access updated successfully!");
      setAccessModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to update menu access");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const pendingStaff = staff.filter((u: any) => !u.is_approved);
  const activeStaff  = staff.filter((u: any) => u.is_approved);

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
                {pendingStaff.map((user: any) => (
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
                <th className="px-5 py-3 text-[12px] font-medium text-muted">Menu Access</th>
                <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {activeStaff.map((user: any) => (
                <tr key={user.id} className="hover:bg-subtle/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[14px] font-medium text-main flex items-center gap-2">
                      {user.full_name || 'System User'}
                      {user.role === 'OWNER' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">OWNER</span>}
                    </div>
                    <div className="text-[12px] text-muted">{user.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <select 
                      className="bg-subtle border border-subtle text-[11px] font-medium px-2 py-1 rounded text-main focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={user.role}
                      onChange={(e) => handleUpdateStaffRole(user.id, e.target.value)}
                      disabled={user.role === 'OWNER'}
                    >
                      <option value="WAITER">WAITER</option>
                      <option value="RUNNER">RUNNER</option>
                      <option value="KITCHEN">KITCHEN</option>
                      <option value="MANAGER">MANAGER</option>
                      {user.role === 'OWNER' && <option value="OWNER">OWNER</option>}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    {user.role === 'RUNNER' ? (
                      <div className="flex items-center gap-2">
                        {(!user.allowed_categories || user.allowed_categories.length === 0) ? (
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Setup Required</span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{user.allowed_categories.length} Categories Only</span>
                        )}
                        <button 
                          onClick={() => openAccessModal(user)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit Menu Access"
                        >
                          <Settings2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.role !== 'OWNER' && (
                      <button
                        onClick={() => handleDeleteStaff(user.id)}
                        className="text-muted hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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

      {/* Menu Access Modal */}
      {accessModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-[16px]">Menu Access Configuration</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Restrict what {selectedStaff.full_name || 'this waiter'} can see.</p>
              </div>
              <button onClick={() => setAccessModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[12px] text-indigo-800 leading-relaxed">
                <strong>Tip:</strong> Leave all categories unchecked to grant <strong>full access</strong>. Check specific categories to restrict the waiter to only those categories (e.g. for a Beverage Waiter or Runner).
              </div>

              <div className="space-y-2">
                {menuCategories.map((cat: any) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-slate-50'}`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span className={`text-[14px] font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setAccessModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAccess}
                disabled={isSavingAccess}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSavingAccess ? <Loader2 size={16} className="animate-spin" /> : 'Save Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
