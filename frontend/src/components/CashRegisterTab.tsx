import { useState, useEffect, useCallback } from 'react';
import {
  Banknote, TrendingUp, TrendingDown, Lock, Unlock, AlertTriangle,
  CheckCircle2, Plus, Minus, Clock, ChevronDown, ChevronUp, Loader2, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cashApi } from '../api/cashRegister';

interface CashTransaction {
  id: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  description?: string;
  created_at: string;
}

interface CashShift {
  id: string;
  opening_balance: number;
  closing_balance?: number;
  expected_balance?: number;
  net_sales: number;
  total_cash_in: number;
  total_cash_out: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  opened_at: string;
  closed_at?: string;
  transactions: CashTransaction[];
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CashRegisterTab() {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [history, setHistory] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Open Shift
  const [openingBalance, setOpeningBalance] = useState('');

  // Transaction
  const [txType, setTxType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  // Close Shift
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [physicalCount, setPhysicalCount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // History
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [shiftRes, histRes] = await Promise.allSettled([
        cashApi.getCurrentShift(),
        cashApi.getHistory(),
      ]);
      setCurrentShift(shiftRes.status === 'fulfilled' ? shiftRes.value : null);
      setHistory(histRes.status === 'fulfilled' ? histRes.value : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenShift = async () => {
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) return toast.error('Enter a valid opening balance.');
    setActionLoading(true);
    try {
      const shift = await cashApi.openShift(bal);
      setCurrentShift(shift);
      setOpeningBalance('');
      toast.success(`Shift opened with ${fmt(bal)}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to open shift.');
    } finally { setActionLoading(false); }
  };

  const handleAddTransaction = async () => {
    if (!currentShift) return;
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return toast.error('Enter a valid amount.');
    setActionLoading(true);
    try {
      await cashApi.addTransaction(currentShift.id, txType, amt, txDesc || undefined);
      setTxAmount(''); setTxDesc('');
      toast.success(`${txType === 'CASH_IN' ? 'Cash In' : 'Cash Out'} recorded: ${fmt(amt)}`);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to record transaction.');
    } finally { setActionLoading(false); }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    const counted = parseFloat(physicalCount);
    if (isNaN(counted) || counted < 0) return toast.error('Enter the physical cash count.');
    setActionLoading(true);
    try {
      const closed = await cashApi.closeShift(currentShift.id, counted, closeNotes || undefined);
      setCurrentShift(null);
      setShowCloseModal(false);
      toast.success('Shift closed successfully!');
      fetchData();
      // Show result summary
      const diff = counted - (closed.expected_balance ?? 0);
      if (Math.abs(diff) < 0.01) toast.success('✅ Perfect balance — no discrepancy!');
      else if (diff < 0) toast.error(`🚨 Shortage of ${fmt(Math.abs(diff))}!`);
      else toast.success(`💰 Surplus of ${fmt(diff)}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to close shift.');
    } finally { setActionLoading(false); }
  };

  const runningExpected = currentShift
    ? currentShift.opening_balance + currentShift.net_sales + currentShift.total_cash_in - currentShift.total_cash_out
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin w-6 h-6 text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── NO SHIFT OPEN ──────────────────────────────────────────────────── */}
      {!currentShift && (
        <div className="surface p-8 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
            <Lock size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-[18px] font-bold mb-1">No Shift Open</h3>
          <p className="text-[13px] text-muted mb-6">Enter the opening cash in the drawer to begin tracking this shift.</p>
          <div className="w-full space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-muted">₹</span>
              <input
                type="number"
                placeholder="Opening Balance (e.g. 5000)"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                className="form-input pl-8 text-[15px] font-semibold"
              />
            </div>
            <button
              onClick={handleOpenShift}
              disabled={actionLoading || !openingBalance}
              className="btn w-full flex items-center justify-center gap-2 py-3 text-[14px]"
            >
              {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Unlock size={16} />}
              Open Shift
            </button>
          </div>
        </div>
      )}

      {/* ── ACTIVE SHIFT ───────────────────────────────────────────────────── */}
      {currentShift && (
        <div className="space-y-5">

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Opening Balance', value: currentShift.opening_balance, icon: Banknote, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Cash Sales', value: currentShift.net_sales, icon: TrendingUp, color: '#10b981', bg: '#f0fdf4' },
              { label: 'Cash In / Out', value: currentShift.total_cash_in - currentShift.total_cash_out, icon: currentShift.total_cash_in >= currentShift.total_cash_out ? TrendingUp : TrendingDown, color: currentShift.total_cash_in >= currentShift.total_cash_out ? '#10b981' : '#f43f5e', bg: '#f8fafc' },
              { label: 'Expected in Drawer', value: runningExpected, icon: Banknote, color: '#f59e0b', bg: '#fffbeb', highlight: true },
            ].map(stat => (
              <div
                key={stat.label}
                className="surface p-4 flex flex-col gap-2"
                style={stat.highlight ? { border: '1.5px solid #f59e0b40', background: '#fffbeb' } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{stat.label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                    <stat.icon size={14} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-[22px] font-extrabold tracking-tight" style={{ color: stat.color }}>
                  {fmt(stat.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Shift meta */}
          <div className="surface px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-600">SHIFT OPEN</span>
              <span className="text-slate-400">·</span>
              <Clock size={11} />
              <span>Started {new Date(currentShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              <Lock size={13} /> Close Shift
            </button>
          </div>

          {/* Cash In / Out Entry */}
          <div className="surface p-5">
            <h4 className="text-[13px] font-bold mb-4 uppercase tracking-wider text-muted">Manual Cash Entry</h4>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex rounded-lg overflow-hidden border border-subtle">
                {(['CASH_IN', 'CASH_OUT'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTxType(t)}
                    className="px-4 py-2 text-[12px] font-bold transition-colors"
                    style={txType === t
                      ? { background: t === 'CASH_IN' ? '#10b981' : '#f43f5e', color: '#fff' }
                      : { background: '#f8fafc', color: '#94a3b8' }
                    }
                  >
                    {t === 'CASH_IN' ? <><Plus size={11} className="inline mr-1" />Cash In</> : <><Minus size={11} className="inline mr-1" />Cash Out</>}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[120px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted text-[13px]">₹</span>
                <input type="number" placeholder="Amount" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="form-input pl-7 text-[13px]" />
              </div>
              <input type="text" placeholder="Description (optional)" value={txDesc} onChange={e => setTxDesc(e.target.value)} className="form-input flex-1 min-w-[160px] text-[13px]" />
              <button onClick={handleAddTransaction} disabled={actionLoading || !txAmount} className="btn px-5 py-2 text-[13px]">
                {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Record'}
              </button>
            </div>
          </div>

          {/* Transaction Log */}
          {currentShift.transactions.length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-5 py-3 border-b border-subtle">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted">Transaction Log</h4>
              </div>
              <div className="divide-y divide-subtle max-h-48 overflow-y-auto">
                {[...currentShift.transactions].reverse().map(tx => (
                  <div key={tx.id} className="px-5 py-3 flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === 'CASH_IN' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      {tx.type === 'CASH_IN' ? <Plus size={13} className="text-emerald-600" /> : <Minus size={13} className="text-rose-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">{tx.description || (tx.type === 'CASH_IN' ? 'Cash In' : 'Cash Out')}</p>
                      <p className="text-[11px] text-muted">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`text-[14px] font-bold ${tx.type === 'CASH_IN' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {tx.type === 'CASH_IN' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SHIFT HISTORY ──────────────────────────────────────────────────── */}
      <div className="surface overflow-hidden">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-subtle/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History size={15} className="text-muted" />
            <span className="text-[13px] font-bold">Shift History</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-muted">{history.length}</span>
          </div>
          {showHistory ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
        </button>

        {showHistory && (
          <div className="border-t border-subtle divide-y divide-subtle">
            {history.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-muted">No closed shifts yet.</p>
            )}
            {history.map(shift => {
              const diff = shift.closing_balance != null && shift.expected_balance != null
                ? shift.closing_balance - shift.expected_balance
                : null;
              const isShortage = diff !== null && diff < -0.01;
              const isSurplus = diff !== null && diff > 0.01;

              return (
                <div key={shift.id} className="px-5 py-4 flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-[13px] font-semibold">
                      {new Date(shift.opened_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {shift.closed_at && ` – ${new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">Opening: {fmt(shift.opening_balance)} · Sales: {fmt(shift.net_sales)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-muted">Expected</p>
                    <p className="text-[14px] font-bold">{fmt(shift.expected_balance ?? 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-muted">Counted</p>
                    <p className="text-[14px] font-bold">{fmt(shift.closing_balance ?? 0)}</p>
                  </div>
                  <div className="flex items-center gap-2 min-w-[130px] justify-end">
                    {diff === null ? null : isShortage ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                        <AlertTriangle size={11} /> Shortage {fmt(Math.abs(diff))}
                      </span>
                    ) : isSurplus ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        <TrendingUp size={11} /> Surplus {fmt(diff)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 size={11} /> Balanced
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CLOSE SHIFT MODAL ──────────────────────────────────────────────── */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !actionLoading && setShowCloseModal(false)} />
          <div className="relative w-full max-w-md surface p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <h3 className="text-[20px] font-bold mb-1">Close Shift</h3>
            <p className="text-[13px] text-muted mb-6">Count the physical cash in the drawer and enter the total below.</p>

            {/* Expected breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 border border-slate-200">
              {[
                ['Opening Balance', currentShift.opening_balance, 'text-slate-700'],
                ['+ Cash Sales', currentShift.net_sales, 'text-emerald-600'],
                ['+ Cash In', currentShift.total_cash_in, 'text-emerald-600'],
                ['– Cash Out', currentShift.total_cash_out, 'text-rose-500'],
              ].map(([label, val, cls]) => (
                <div key={label as string} className="flex justify-between text-[13px]">
                  <span className="text-muted">{label}</span>
                  <span className={`font-semibold ${cls}`}>{fmt(val as number)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-[14px] font-extrabold">
                <span>Expected in Drawer</span>
                <span className="text-amber-600">{fmt(runningExpected)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-slate-600">Physical Cash Count (₹)</label>
                <input type="number" value={physicalCount} onChange={e => setPhysicalCount(e.target.value)} className="form-input text-[16px] font-bold" placeholder="Enter actual amount in drawer..." autoFocus />
              </div>
              {physicalCount && !isNaN(parseFloat(physicalCount)) && (() => {
                const diff = parseFloat(physicalCount) - runningExpected;
                return (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-[13px] font-bold ${Math.abs(diff) < 0.01 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : diff < 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                    {Math.abs(diff) < 0.01 ? <CheckCircle2 size={15} /> : diff < 0 ? <AlertTriangle size={15} /> : <TrendingUp size={15} />}
                    {Math.abs(diff) < 0.01 ? 'Perfect balance!' : diff < 0 ? `Shortage: ${fmt(Math.abs(diff))}` : `Surplus: ${fmt(diff)}`}
                  </div>
                );
              })()}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-slate-600">Notes (optional)</label>
                <input type="text" value={closeNotes} onChange={e => setCloseNotes(e.target.value)} className="form-input text-[13px]" placeholder="e.g. Change given to vendor..." />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCloseShift} disabled={actionLoading || !physicalCount} className="btn flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0">
                {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Confirm & Close Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
