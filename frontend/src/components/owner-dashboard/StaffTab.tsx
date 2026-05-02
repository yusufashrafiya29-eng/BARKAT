import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function StaffTab() {
  const { staff, fetchData } = useOwnerStore();

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
                <th className="px-5 py-3 text-[12px] font-medium text-muted">Status</th>
                <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {activeStaff.map((user: any) => (
                <tr key={user.id} className="hover:bg-subtle/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[14px] font-medium text-main">{user.full_name || 'System User'}</div>
                    <div className="text-[12px] text-muted">{user.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <select 
                      className="bg-subtle border border-subtle text-[11px] font-medium px-2 py-1 rounded text-main focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={user.role}
                      onChange={(e) => handleUpdateStaffRole(user.id, e.target.value)}
                    >
                      <option value="WAITER">WAITER</option>
                      <option value="KITCHEN">KITCHEN</option>
                      <option value="MANAGER">MANAGER</option>
                    </select>
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
}
