import { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Search, FileText, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'category', label: 'Category Summary' },
  { id: 'item', label: 'Item Summary' },
  { id: 'sales', label: 'Sales Summary' },
  { id: 'order_source', label: 'Order Summary' },
  { id: 'employee', label: 'Employee Summary' },
  { id: 'group', label: 'Group Summary' },
  { id: 'variation', label: 'Variation Summary' },
  { id: 'cover', label: 'Cover Size Summary' },
  { id: 'tip', label: 'Tip Summary' },
  { id: 'counter', label: 'Counter Summary' },
  { id: 'locality', label: 'Locality Wise Summary' },
  { id: 'nc', label: 'NC Item Summary' },
  { id: 'assignee', label: 'Assignee Wise Summary' },
  { id: 'due_payments', label: 'Due / Pending Payments' },
];

export default function AdvancedReportsPage() {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState('category');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/advanced`, {
        params: {
          report_type: activeReport,
          start_date: startDate,
          end_date: endDate
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      setData(res.data.data);
      setTotals(res.data.totals);
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const filteredData = data.filter(r => r.label?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Dynamic Columns based on Report Type
  const getColumns = () => {
    if (activeReport === 'due_payments') {
      return ['label', 'total_amount', 'amount_paid', 'due_amount', 'date', 'action'];
    }
    if (activeReport === 'category' || activeReport === 'item') {
      return ['label', 'orders', 'items', 'net_amount', 'discount', 'tax', 'sales', 'percentage'];
    }
    if (activeReport === 'sales') {
      return ['label', 'orders', 'dine_in', 'takeaway', 'delivery', 'net_amount', 'tax', 'sales'];
    }
    return ['label', 'orders', 'net_amount', 'tax', 'sales', 'percentage'];
  };

  const columns = getColumns();
  const formatHeader = (col: string) => {
    const map: any = {
      label: activeReport === 'category' ? 'Category' : activeReport === 'item' ? 'Item' : activeReport === 'sales' ? 'Date' : 'Name',
      orders: 'Orders',
      items: 'Items',
      net_amount: 'Net Amount (₹)',
      discount: 'Total Discount (₹)',
      tax: 'Total Tax (₹)',
      sales: 'Total Sales (₹)',
      percentage: 'Percentage (%)',
      dine_in: 'Dine In (₹)',
      takeaway: 'Takeaway (₹)',
      delivery: 'Delivery (₹)',
      total_amount: 'Total Amount (₹)',
      amount_paid: 'Amount Paid (₹)',
      due_amount: 'Due Amount (₹)',
      date: 'Date',
      action: 'Action',
    };
    return map[col] || col;
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export!");
      return;
    }

    // Create CSV header (exclude action)
    const exportColumns = columns.filter(c => c !== 'action');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += exportColumns.map(formatHeader).join(",") + "\n";

    // Add Total Row
    const totalRow = ["TOTAL!"];
    exportColumns.slice(1).forEach(col => {
      totalRow.push(totals[col] !== undefined ? totals[col] : (col === 'percentage' ? '-' : '0'));
    });
    csvContent += totalRow.join(",") + "\n";

    // Add Data Rows
    data.forEach(row => {
      const rowData = exportColumns.map(col => {
        let val = row[col] !== undefined ? row[col] : '';
        // Escape quotes and wrap in quotes if there's a comma
        if (typeof val === 'string' && val.includes(',')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report'}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel (CSV) exported successfully!");
  };

  const handlePayDue = async (orderId: string, dueAmount: number) => {
    const amountStr = prompt(`Enter amount to pay for order #${orderId.slice(-4)} (Max: ₹${dueAmount}):`, dueAmount.toString());
    if (!amountStr) return;
    const amountToPay = parseFloat(amountStr);
    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > dueAmount) {
      toast.error('Invalid amount entered.');
      return;
    }

    const method = prompt('Enter payment method (CASH, UPI, CARD):', 'CASH');
    if (!method || !['CASH', 'UPI', 'CARD'].includes(method.toUpperCase())) {
      toast.error('Invalid payment method.');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/orders/${orderId}/payment`, {
        amount: amountToPay,
        payment_method: method.toUpperCase(),
        transaction_reference: method.toUpperCase() === 'CASH' ? undefined : `TRX-${Date.now()}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      toast.success('Payment updated successfully!');
      fetchReport();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Payment update failed');
      setLoading(false);
    }
  };

  const handleComingSoon = () => toast("🚧 Feature coming soon in the next update!");

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex p-4 print:p-0 print:h-auto print:bg-white print:block">

      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-slate-800 text-slate-300 flex flex-col h-full border border-slate-700 rounded-l-xl overflow-hidden shrink-0 shadow-lg print:hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900 flex items-center justify-between">
          <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            Reports
          </h3>
          <button onClick={() => navigate('/owner')} className="text-slate-400 hover:text-white transition-colors" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.id}
              onClick={() => setActiveReport(rt.id)}
              className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-all border-l-2 ${activeReport === rt.id
                  ? 'bg-slate-700 text-white border-indigo-400'
                  : 'border-transparent hover:bg-slate-700 hover:text-slate-100'
                }`}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-white border border-l-0 border-slate-300 rounded-r-xl overflow-hidden shadow-lg print:border-none print:shadow-none print:w-full print:block print:overflow-visible">

        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col gap-4 bg-white z-10 print:hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/owner')} className="md:hidden text-slate-400 hover:text-slate-800 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-[20px] font-bold text-slate-800">
                {REPORT_TYPES.find(r => r.id === activeReport)?.label}
              </h2>
            </div>

            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded text-[13px] w-64 outline-none focus:border-indigo-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="text-[12px] font-medium text-slate-500 bg-slate-50 p-2 border border-slate-200 rounded flex items-center gap-3 w-max">
            <span>Report From:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none font-bold text-slate-700" />
            <span>to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none font-bold text-slate-700" />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto bg-slate-50 relative print:overflow-visible print:h-auto">
          {/* Print Header (Only visible when printing) */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">{REPORT_TYPES.find(r => r.id === activeReport)?.label}</h1>
            <p className="text-slate-500 mt-1">Report Period: {startDate} to {endDate}</p>
          </div>

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 print:hidden">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max bg-white border border-slate-200 print:min-w-full">
              <thead className="sticky top-0 bg-slate-100 z-20 shadow-sm border-b-2 border-slate-300 print:static print:shadow-none">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-[13px] font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap bg-slate-100 print:bg-white print:text-black">
                      {formatHeader(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total Row */}
                <tr className="bg-[#fffae6] font-black border-b-2 border-slate-300 sticky top-[45px] z-10 shadow-sm">
                  <td className="px-4 py-3 text-[14px] text-slate-900 border-r border-slate-200 uppercase tracking-wider">Total!</td>
                  {columns.slice(1).map(col => (
                    <td key={col} className="px-4 py-3 text-[14px] text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {col === 'percentage' || col === 'action' ? '-' : totals[col] || '0'}
                    </td>
                  ))}
                </tr>

                {/* Data Rows */}
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="p-10 text-center text-[14px] text-slate-500 font-medium">
                      No data found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-indigo-50/30 transition-colors group">
                      {columns.map(col => (
                        <td key={col} className={`px-4 py-3 text-[14px] whitespace-nowrap border-r border-slate-100 group-hover:border-indigo-100 ${col === 'label' ? 'text-slate-800 font-bold bg-slate-50/50 group-hover:bg-transparent' : 'text-slate-600 font-medium'}`}>
                          {col === 'action' && activeReport === 'due_payments' ? (
                            <button
                              onClick={() => handlePayDue(row.order_id, row.due_amount)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shadow-sm"
                            >
                              Pay Due
                            </button>
                          ) : col === 'label' && activeReport === 'due_payments' && row.customer_phone ? (
                            <div>
                              <span>{row.label}</span>
                              <div className="mt-1">
                                <a href={`tel:${row.customer_phone}`} className="text-indigo-600 hover:underline text-xs font-semibold flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                  {row.customer_phone}
                                </a>
                              </div>
                            </div>
                          ) : (
                            row[col]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
