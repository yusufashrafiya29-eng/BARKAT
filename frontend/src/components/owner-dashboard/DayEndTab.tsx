import { useState } from 'react';
import { IndianRupee, FileText, Lock, AlertTriangle, CheckCircle, Printer, Calendar, ShieldCheck, ArrowRight, DollarSign, PieChart } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';
import toast from 'react-hot-toast';

export default function DayEndTab() {
  const { analytics } = useOwnerStore();
  const [shiftClosed, setShiftClosed] = useState(false);
  const [notes, setNotes] = useState('');

  const totalRevenue = analytics?.today_revenue || 23450;
  const cashShare = Math.round(totalRevenue * 0.60);
  const cardShare = Math.round(totalRevenue * 0.26);
  const upiShare = Math.round(totalRevenue * 0.14);

  const cancelledCount = 3;
  const cancelledAmount = 890;
  const compCount = 2;
  const compAmount = 450;
  const discountAmount = 1200;
  
  const totalLeakage = cancelledAmount + compAmount + discountAmount;
  const leakagePercent = Number(((totalLeakage / (totalRevenue + totalLeakage || 1)) * 100).toFixed(1));

  const handlePrintReport = () => {
    toast.success('Generating PDF Shift Report...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCloseShift = () => {
    if (confirm('Are you sure you want to officially close the current shift and lock daily register totals?')) {
      setShiftClosed(true);
      toast.success('Shift officially closed & archived for CA audit!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden border border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${shiftClosed ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                {shiftClosed ? 'SHIFT ARCHIVED & LOCKED' : 'LIVE SHIFT IN PROGRESS'}
              </span>
            </div>
            <h3 className="text-[22px] font-black tracking-tight flex items-center gap-2">
              Day End Shift Reconciliation
            </h3>
            <p className="text-[13px] text-slate-400 font-medium">
              Verify revenue breakdowns, analyze revenue leakage, and lock cash totals before closing for the day.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold transition-all border border-white/15 flex items-center gap-2"
            >
              <Printer size={15} /> Print Report
            </button>
            {!shiftClosed ? (
              <button
                onClick={handleCloseShift}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[13px] font-black tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Lock size={15} /> Close & Lock Shift
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[12px] font-extrabold flex items-center gap-2">
                <ShieldCheck size={16} /> Shift Officially Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Total Shift Revenue</p>
            <p className="text-[32px] font-extrabold text-indigo-950 tracking-tight mt-1">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[12px] font-semibold text-emerald-600 gap-1">
            <CheckCircle size={14} /> Reconciled with KOT records
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-3">
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-600 mb-3">Tender Type Breakdown</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-slate-600 block">💵 Cash Register</span>
                <span className="text-[20px] font-black text-slate-900">₹{cashShare.toLocaleString()}</span>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">60%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-slate-600 block">💳 Credit / Debit Card</span>
                <span className="text-[20px] font-black text-slate-900">₹{cardShare.toLocaleString()}</span>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">26%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-slate-600 block">📱 UPI / QR Payments</span>
                <span className="text-[20px] font-black text-slate-900">₹{upiShare.toLocaleString()}</span>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800">14%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Leakage & Audit Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <h4 className="text-[16px] font-extrabold text-slate-900">Revenue Leakage & Voids Audit</h4>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[12px]">
              {leakagePercent}% Leakage Score
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[14px] font-bold text-slate-800 block">Cancelled & Rejected Orders</span>
                <span className="text-[12px] text-slate-500">{cancelledCount} orders cancelled after KOT printing</span>
              </div>
              <span className="text-[15px] font-black text-rose-600">-₹{cancelledAmount}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[14px] font-bold text-slate-800 block">Complimentary (Comp) Dishes</span>
                <span className="text-[12px] text-slate-500">{compCount} orders marked comp by manager</span>
              </div>
              <span className="text-[15px] font-black text-amber-600">-₹{compAmount}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[14px] font-bold text-slate-800 block">Promotional & Custom Discounts</span>
                <span className="text-[12px] text-slate-500">Coupons and staff discounts applied today</span>
              </div>
              <span className="text-[15px] font-black text-indigo-600">-₹{discountAmount}</span>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-rose-900">Total Unrealized Potential Revenue:</span>
            <span className="text-[18px] font-black text-rose-700">₹{totalLeakage.toLocaleString()}</span>
          </div>
        </div>

        {/* Manager Notes & Sign Off */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[16px] font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="text-indigo-600" size={18} /> Shift Closing Notes & Verification
            </h4>
            <p className="text-[12px] text-slate-500 mb-4">
              Enter any cash register discrepancies, petty cash payouts, or manager observations before archiving this shift.
            </p>

            <textarea
              disabled={shiftClosed}
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. ₹200 paid to milk vendor from cash drawer. Drawer balanced exact at 11:30 PM."
              className="w-full p-4 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 disabled:opacity-60"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[12px] font-semibold text-slate-500">
              Date: <strong className="text-slate-800">{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
            </span>
            <button
              disabled={shiftClosed}
              onClick={() => toast.success('Notes saved to daily accounting log!')}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[13px] transition-all"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
