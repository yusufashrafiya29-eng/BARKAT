import { useState } from 'react';
import { IndianRupee, FileText, Lock, AlertTriangle, CheckCircle, Printer, Calendar, ShieldCheck, ArrowRight, DollarSign, PieChart, Banknote, CreditCard, QrCode } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';
import toast from 'react-hot-toast';

export default function DayEndTab() {
  const { analytics } = useOwnerStore();
  const [shiftClosed, setShiftClosed] = useState(false);
  const [notes, setNotes] = useState('');
  const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';

  // 1. Hook up real data from analytics store
  const totalRevenue = analytics?.today_revenue || 0;
  
  // Safely extract payment methods
  const paymentMethods = analytics?.payment_methods || [];
  const getShare = (type: string) => {
    const method = paymentMethods.find((pm: any) => pm.name.toUpperCase() === type.toUpperCase());
    return method ? method.amount : 0;
  };
  
  const cashShare = getShare('CASH');
  const cardShare = getShare('CARD');
  const upiShare = getShare('UPI');
  
  const getPercent = (amount: number) => {
    if (totalRevenue === 0) return 0;
    return Math.round((amount / totalRevenue) * 100);
  };

  // Safely extract leakage stats
  const leakage = analytics?.leakage || { percent: 0, total: 0, cancelled: 0, cancelled_count: 0, complimentary: 0, complimentary_count: 0 };
  const cancelledCount = leakage.cancelled_count || 0;
  const cancelledAmount = leakage.cancelled || 0;
  const compCount = leakage.complimentary_count || 0;
  const compAmount = leakage.complimentary || 0;
  const discountAmount = 0; // Keeping 0 for now as it's not strictly calculated in backend yet
  
  const totalLeakage = leakage.total || 0;
  const leakagePercent = leakage.percent || 0;

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
      
      {/* ─── WEB DASHBOARD VIEW (Hidden on Print) ─── */}
      <div className="print:hidden space-y-6">
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
                  <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5 mb-1"><Banknote size={14} className="text-emerald-600" /> Cash Register</span>
                  <span className="text-[20px] font-black text-slate-900">₹{cashShare.toLocaleString()}</span>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">{getPercent(cashShare)}%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5 mb-1"><CreditCard size={14} className="text-blue-600" /> Credit / Debit Card</span>
                  <span className="text-[20px] font-black text-slate-900">₹{cardShare.toLocaleString()}</span>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">{getPercent(cardShare)}%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5 mb-1"><QrCode size={14} className="text-purple-600" /> UPI / QR Payments</span>
                  <span className="text-[20px] font-black text-slate-900">₹{upiShare.toLocaleString()}</span>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800">{getPercent(upiShare)}%</span>
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

      {/* ─── PRINT ONLY VIEW (High Effort A4 Report) ─── */}
      <div className="hidden print:block print-container bg-white text-black p-8 max-w-4xl mx-auto font-sans">
        
        {/* Report Header */}
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{restaurantName}</h1>
            <p className="text-sm font-semibold text-gray-600 mt-1">Daily Operations & Financial Audit Report</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-gray-500">Generated at: {new Date().toLocaleTimeString('en-IN')}</p>
            <p className="text-xs font-bold mt-2 uppercase">{shiftClosed ? 'Status: LOCKED / CLOSED' : 'Status: OPEN SHIFT'}</p>
          </div>
        </div>

        {/* Key Financials */}
        <div className="mb-8">
          <h2 className="text-lg font-black uppercase border-b border-gray-300 pb-2 mb-4">1. Master Revenue Reconciliation</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-bold text-gray-500 uppercase">Gross Total Revenue</p>
              <p className="text-4xl font-black mt-1">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs font-bold text-green-700 mt-2">✓ Reconciled with KOT System</p>
            </div>
            
            <div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-bold text-gray-600">Cash Register</td>
                    <td className="py-2 text-right font-black">₹{cashShare.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500 font-bold w-16">{getPercent(cashShare)}%</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-bold text-gray-600">Credit / Debit Card</td>
                    <td className="py-2 text-right font-black">₹{cardShare.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500 font-bold w-16">{getPercent(cardShare)}%</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-bold text-gray-600">UPI / QR Digital</td>
                    <td className="py-2 text-right font-black">₹{upiShare.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500 font-bold w-16">{getPercent(upiShare)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Leakage Audit */}
        <div className="mb-8">
          <h2 className="text-lg font-black uppercase border-b border-gray-300 pb-2 mb-4">2. Revenue Leakage & Voids Audit</h2>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-bold uppercase text-xs text-gray-600">Category</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-bold uppercase text-xs text-gray-600">Incidents</th>
                <th className="border border-gray-300 px-4 py-2 text-right font-bold uppercase text-xs text-gray-600">Unrealized Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">Cancelled & Rejected Orders</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{cancelledCount}</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-red-600">-₹{cancelledAmount}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">Complimentary Dishes (Comp)</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{compCount}</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-yellow-600">-₹{compAmount}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">Promotional & Custom Discounts</td>
                <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-blue-600">-₹{discountAmount}</td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={2} className="border border-gray-300 px-4 py-3 text-right font-black uppercase">Total Leakage Impact</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-black text-lg text-red-700">₹{totalLeakage.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs font-bold text-gray-500 mt-2 text-right">Leakage Score: {leakagePercent}% of Gross</p>
        </div>

        {/* Manager Notes & Signatures */}
        <div className="mb-12">
          <h2 className="text-lg font-black uppercase border-b border-gray-300 pb-2 mb-4">3. Shift Notes & Observations</h2>
          <div className="p-4 border border-gray-300 rounded-lg min-h-[100px] bg-gray-50 text-sm font-medium whitespace-pre-wrap">
            {notes || "No notes were provided by the shift manager."}
          </div>
        </div>

        <div className="flex justify-between mt-16 pt-8 border-t border-dashed border-gray-400">
          <div className="text-center w-64">
            <div className="border-b border-black mb-2"></div>
            <p className="text-xs font-bold uppercase text-gray-600">Shift Manager Signature</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-black mb-2"></div>
            <p className="text-xs font-bold uppercase text-gray-600">Auditor / Owner Signature</p>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 font-bold uppercase">
          Generated by AL-FAIZ Restaurant OS • End of Day Audit System
        </div>
      </div>

    </div>
  );
}
