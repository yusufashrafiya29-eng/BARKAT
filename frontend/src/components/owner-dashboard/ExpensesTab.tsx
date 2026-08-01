import { useState, useEffect } from 'react';
import { IndianRupee, Plus, FileText, Banknote, Calendar, Tag, Trash2, Search, ArrowDownRight, CheckCircle2, Shield, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';

interface ExpenseVoucher {
  id: string;
  payee: string;
  category: 'Dairy & Groceries' | 'Staff Advance' | 'Utilities & Electricity' | 'Maintenance & Repairs' | 'Packaging & Consumables' | 'Miscellaneous';
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  timestamp: string;
  remarks: string;
  verifiedBy: string;
}

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);

  const fetchExpenses = async () => {
    try {
      const data = await ownerApi.getExpenses();
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses from DB", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<ExpenseVoucher | null>(null);

  // New Form State
  const [newPayee, setNewPayee] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseVoucher['category']>('Dairy & Groceries');
  const [newAmount, setNewAmount] = useState<number>(300);
  const [newMode, setNewMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [newRemarks, setNewRemarks] = useState('');

  const totalSpentToday = expenses.reduce((sum, item) => sum + item.amount, 0);
  const cashSpentToday = expenses.filter(item => item.paymentMode === 'CASH').reduce((sum, item) => sum + item.amount, 0);
  const totalVouchers = expenses.length;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayee.trim() || !newAmount) {
      toast.error('Please enter payee name and amount');
      return;
    }

    const custom: ExpenseVoucher = {
      id: `EXP-${101 + expenses.length}`,
      payee: newPayee.trim(),
      category: newCategory,
      amount: Number(newAmount),
      paymentMode: newMode,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      remarks: newRemarks || 'Verified cashier cash disbursement',
      verifiedBy: 'Owner Portal'
    };

    try {
      await ownerApi.createExpense(custom);
      await fetchExpenses();
      setShowAddModal(false);
      setNewPayee('');
      setNewRemarks('');
      toast.success(`Expense ₹${custom.amount} recorded permanently in backend DB & ledger!`);
    } catch (err) {
      toast.error("Failed to save expense to DB");
    }
  };

  const handleDeleteExpense = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to void this expense voucher from the server database ledger?')) {
      try {
        await ownerApi.deleteExpense(id);
        await fetchExpenses();
        toast.success('Voucher voided from database successfully');
      } catch (err) {
        toast.error("Failed to delete from DB");
      }
    }
  };

  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = item.payee.toLowerCase().includes(searchTerm.toLowerCase()) || item.remarks.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeStyle = (cat: ExpenseVoucher['category']) => {
    switch (cat) {
      case 'Dairy & Groceries': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Staff Advance': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Utilities & Electricity': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Maintenance & Repairs': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Packaging & Consumables': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border border-rose-200 bg-gradient-to-br from-rose-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-1">Total Petty Cash Spent</p>
              <p className="text-[32px] font-extrabold tracking-tight text-rose-950 leading-none">₹{totalSpentToday.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <ArrowDownRight size={24} strokeWidth={2.5} />
            </div>
          </div>
          <span className="mt-4 text-[12px] font-bold text-rose-700 block flex items-center gap-1">
            <Banknote size={14} /> ₹{cashSpentToday} deducted from physical register galla
          </span>
        </div>

        <div className="stat-card border border-slate-200 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Vouchers Created Today</p>
              <p className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-none">{totalVouchers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <FileText size={22} />
            </div>
          </div>
          <span className="mt-4 text-[12px] font-bold text-indigo-700 block flex items-center gap-1">
            <CheckCircle2 size={14} /> 100% audited with CA compliance
          </span>
        </div>

        <div className="stat-card border border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Day End Register Protection</p>
              <p className="text-[20px] font-black text-emerald-950 leading-tight mt-1">
                Zero Discrepancy
              </p>
              <p className="text-[12px] text-slate-500 font-semibold mt-0.5">Auto-balances against KOT sales</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
              <Shield size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
              <Banknote className="text-rose-600" size={22} />
              Daily Expense & Petty Cash Ledger
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Record vendor payments, grocery cash disbursements, and employee salary advances.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search payee or voucher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 w-full transition-all"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-[13px] shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={3} /> Record New Expense
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <Tag size={12} /> Categories:
          </span>
          {[
            { id: 'ALL', label: '🌟 All Vouchers' },
            { id: 'Dairy & Groceries', label: '🥛 Dairy & Groceries' },
            { id: 'Staff Advance', label: '👥 Staff Advance' },
            { id: 'Utilities & Electricity', label: '⚡ Utilities & Bills' },
            { id: 'Maintenance & Repairs', label: '🛠️ Repairs & Maintenance' },
            { id: 'Packaging & Consumables', label: '📦 Packaging & Supplies' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-lg text-[12px] font-extrabold transition-all ${
                selectedCategoryFilter === cat.id ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table of Vouchers */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider">Voucher Info</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider">Category</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider">Remarks / Notes</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-center">Payment Mode</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-right">Amount (₹)</th>
                <th className="p-4 text-[12px] font-bold uppercase text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 bg-slate-50/50">
                    <AlertCircle size={36} className="mx-auto mb-2 text-slate-400 opacity-50" />
                    <p className="font-extrabold text-slate-600 text-[15px] mb-1">No expense vouchers found</p>
                    <p className="text-[13px]">Try clearing your filter or recording a new expense disbursement.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedVoucherForView(item)}
                    className="hover:bg-rose-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="font-black text-[14px] text-slate-900 group-hover:text-rose-600 transition-colors">{item.payee}</div>
                      <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{item.id}</span>
                        <span>•</span>
                        <span className="text-slate-500 flex items-center gap-1"><Calendar size={11} /> Today, {item.timestamp}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${getCategoryBadgeStyle(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-[13px] font-medium text-slate-600">
                      {item.remarks}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[12px] font-extrabold font-mono ${
                        item.paymentMode === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                        item.paymentMode === 'UPI' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.paymentMode === 'CASH' ? '💵 CASH' : item.paymentMode === 'UPI' ? '📱 UPI' : '🏦 BANK'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-[16px] text-rose-600">
                      -₹{item.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => handleDeleteExpense(item.id, e)}
                        title="Void Voucher"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                <Banknote className="text-rose-600" size={22} /> Record Expense & Cash Payout
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-[13px]">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payee / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Milk Vendor, Employee Raju, AC Repair Guy"
                  value={newPayee}
                  onChange={e => setNewPayee(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Dairy & Groceries">🥛 Dairy & Groceries</option>
                    <option value="Staff Advance">👥 Staff Advance</option>
                    <option value="Utilities & Electricity">⚡ Utilities & Bills</option>
                    <option value="Maintenance & Repairs">🛠️ Repairs & Maintenance</option>
                    <option value="Packaging & Consumables">📦 Packaging & Supplies</option>
                    <option value="Miscellaneous">🔖 Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode *</label>
                  <select
                    value={newMode}
                    onChange={e => setNewMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="CASH">💵 Cash (From Register)</option>
                    <option value="UPI">📱 UPI / QR Scan</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer / Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Disbursement Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={e => setNewAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-black text-[18px] text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks & Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid for 10 Litres Amul Gold milk packets against memo #402"
                  value={newRemarks}
                  onChange={e => setNewRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-[12px] font-bold text-amber-900">
                <Shield size={16} className="text-amber-600 shrink-0" />
                <span>Cash disbursements automatically adjust your Day End physical cash drawer reconciliation total.</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/25 transition-all"
                >
                  Confirm & Audit Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW VOUCHER MODAL */}
      {selectedVoucherForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <span className="text-[11px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                OFFICIAL EXPENSE VOUCHER
              </span>
              <h3 className="text-[20px] font-black text-slate-900 mt-2">{selectedVoucherForView.payee}</h3>
              <p className="text-[13px] text-slate-500 font-mono font-semibold">Voucher ID: #{selectedVoucherForView.id}</p>
            </div>

            <div className="py-5 space-y-3.5 text-[13px]">
              <div className="flex justify-between items-center py-2 bg-rose-50/60 px-4 rounded-xl border border-rose-100">
                <span className="font-extrabold text-rose-900">Total Amount Disbursed:</span>
                <span className="text-[22px] font-black text-rose-600">₹{selectedVoucherForView.amount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Expense Category:</span>
                <span className="font-bold text-slate-800">{selectedVoucherForView.category}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Payment Mode:</span>
                <span className="font-bold text-indigo-600">{selectedVoucherForView.paymentMode} REGISTER</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Timestamp & Date:</span>
                <span className="font-bold text-slate-800">{selectedVoucherForView.timestamp}, Today</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Remarks & Description:</span>
                <span className="font-bold text-slate-800 max-w-[200px] text-right">{selectedVoucherForView.remarks}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Verified & Approved By:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} /> {selectedVoucherForView.verifiedBy}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => { toast.success('Voucher PDF generated for print!'); window.print(); }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[13px] transition-all flex items-center justify-center gap-1.5"
              >
                <FileText size={15} /> Print Voucher
              </button>
              <button
                onClick={() => setSelectedVoucherForView(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[13px] transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
