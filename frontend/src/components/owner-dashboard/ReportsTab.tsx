import { useState } from 'react';
import { FileText, TrendingUp, Banknote, Calendar, Download, Activity } from 'lucide-react';

export default function ReportsTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  return (
    <div className="surface p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-[20px] font-bold text-slate-800">Advanced Reports</h3>
          <p className="text-[13px] text-slate-500 mt-1">Export detailed CSV reports for your CA and accounting software.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              className="text-[12px] font-medium outline-none bg-transparent"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
            />
          </div>
          <span className="text-slate-400 text-[12px] font-medium">to</span>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              className="text-[12px] font-medium outline-none bg-transparent"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales & GST */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText size={80} />
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 relative z-10">
            <FileText size={22} className="text-indigo-600" />
          </div>
          <h4 className="font-bold text-slate-800 text-[15px] mb-2 relative z-10">Sales & GST Report</h4>
          <p className="text-[12px] text-slate-500 mb-6 min-h-[48px] relative z-10">
            Comprehensive daily sales breakdown including subtotal, collected GST, and payment methods. Ideal for monthly tax filing.
          </p>
          <button 
            onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/sales/csv?start_date=${reportStartDate}&end_date=${reportEndDate}&token_str=${localStorage.getItem('auth_token')}`)}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Item-wise Performance */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 relative z-10">
            <TrendingUp size={22} className="text-emerald-600" />
          </div>
          <h4 className="font-bold text-slate-800 text-[15px] mb-2 relative z-10">Item-wise Sales Report</h4>
          <p className="text-[12px] text-slate-500 mb-6 min-h-[48px] relative z-10">
            Analyze which menu items perform best. Shows total quantity sold and revenue generated per item over the period.
          </p>
          <button 
            onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/items/csv?start_date=${reportStartDate}&end_date=${reportEndDate}&token_str=${localStorage.getItem('auth_token')}`)}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Shift Z-Report */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Banknote size={80} />
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 relative z-10">
            <Banknote size={22} className="text-amber-600" />
          </div>
          <h4 className="font-bold text-slate-800 text-[15px] mb-2 relative z-10">Shift Z-Report</h4>
          <p className="text-[12px] text-slate-500 mb-6 min-h-[48px] relative z-10">
            Complete cash register logs showing opening balances, net sales, cash handling, and final closing discrepancies.
          </p>
          <button 
            onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/shifts/csv?start_date=${reportStartDate}&end_date=${reportEndDate}&token_str=${localStorage.getItem('auth_token')}`)}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Activity size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-slate-500 leading-relaxed">
          <strong>Note:</strong> Reports are generated based on the selected date range. Ensure your restaurant's GSTIN and FSSAI numbers are updated in the <button onClick={() => setActiveTab('settings')} className="text-indigo-600 font-medium hover:underline">Settings</button> tab, as they are printed directly on the headers of the generated CSV files for accounting compliance.
        </p>
      </div>
    </div>
  );
}
