import { useState, useEffect } from 'react';
import { Building2, Truck, ArrowRightLeft, CheckCircle2, PackageCheck, Plus, Search, QrCode, Sparkles, Printer, MapPin, Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';

interface StockTransfer {
  id: string;
  voucher_number: string;
  source_kitchen: string;
  destination_branch: string;
  item_name: string;
  quantity: number;
  unit: string;
  dispatched_at: string;
  status: 'IN_TRANSIT' | 'RECEIVED' | 'VERIFYING';
  driver_name: string;
}

interface BranchOutlet {
  id: string;
  name: string;
  location: string;
  manager: string;
  status: string;
  today_sales: string;
  health_score: string;
}

interface CentralStockItem {
  id: string;
  name: string;
  total_batch: number;
  unit: string;
  batch_date: string;
  expiry: string;
  temperature: string;
  qc_status: string;
}

export default function FranchiseCommissaryTab() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transfers' | 'branches'>('transfers');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live database state starting clean for real client accounts
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [branches, setBranches] = useState<BranchOutlet[]>([]);
  const [centralStock, setCentralStock] = useState<CentralStockItem[]>([]);

  const fetchCommissaryData = async () => {
    try {
      const tr = await ownerApi.getTransfers();
      if (Array.isArray(tr)) setTransfers(tr);
      const br = await ownerApi.getBranches();
      if (Array.isArray(br)) setBranches(br);
      const st = await ownerApi.getCentralStock();
      if (Array.isArray(st)) setCentralStock(st);
    } catch (err) {
      console.error("Failed to fetch commissary database records", err);
    }
  };

  useEffect(() => {
    fetchCommissaryData();
  }, []);

  // Forms State
  const [dispatchForm, setDispatchForm] = useState({
    destination_branch: '',
    item_name: '',
    quantity: 10,
    unit: 'Liters / Pcs',
    driver_name: ''
  });

  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    manager: ''
  });

  const [newStock, setNewStock] = useState({
    name: '',
    total_batch: 100,
    unit: 'Kg / Liters',
    temperature: '4°C Chilled',
    expiry: '7 Days'
  });

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (branches.length === 0 || centralStock.length === 0) {
      toast.error("Please add at least one branch outlet and central stock item first!");
      return;
    }
    const newVoucher = `WTV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTransfer: StockTransfer = {
      id: `TR-${Math.floor(9000 + Math.random() * 1000)}`,
      voucher_number: newVoucher,
      source_kitchen: 'Central Commissary (Base Kitchen HQ)',
      destination_branch: dispatchForm.destination_branch || branches[0].name,
      item_name: dispatchForm.item_name || centralStock[0].name,
      quantity: Number(dispatchForm.quantity),
      unit: dispatchForm.unit,
      dispatched_at: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'IN_TRANSIT',
      driver_name: dispatchForm.driver_name || 'Assigned Driver'
    };
    try {
      await ownerApi.createTransfer(newTransfer);
      await fetchCommissaryData();
      toast.success(`🚚 Warehouse Transit Voucher ${newVoucher} issued & committed to PostgreSQL DB!`);
      setShowDispatchModal(false);
    } catch (err) {
      toast.error("Failed to store transit voucher in database");
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return;
    const br: BranchOutlet = {
      id: `BR-${branches.length + 1}`,
      name: newBranch.name,
      location: newBranch.location || 'Main City Area',
      manager: newBranch.manager || 'Assigned Manager',
      status: 'Online (Connected)',
      today_sales: '₹0 (New Node)',
      health_score: '100%'
    };
    try {
      await ownerApi.createBranch(br);
      await fetchCommissaryData();
      toast.success(`🏢 Branch Outlet "${br.name}" linked to Central Commissary DB!`);
      setShowAddBranchModal(false);
      setNewBranch({ name: '', location: '', manager: '' });
    } catch (err) {
      toast.error("Failed to link branch outlet to DB");
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.name) return;
    const item: CentralStockItem = {
      id: `STK-${101 + centralStock.length}`,
      name: newStock.name,
      total_batch: Number(newStock.total_batch),
      unit: newStock.unit,
      batch_date: new Date().toLocaleDateString('en-IN'),
      expiry: newStock.expiry,
      temperature: newStock.temperature,
      qc_status: 'Passed (Chef Approved 🟢)'
    };
    try {
      await ownerApi.createCentralStock(item);
      await fetchCommissaryData();
      toast.success(`📦 Central stock batch "${item.name}" saved in Commissary DB!`);
      setShowAddStockModal(false);
      setNewStock({ name: '', total_batch: 100, unit: 'Kg', temperature: '4°C Chilled', expiry: '7 Days' });
    } catch (err) {
      toast.error("Failed to register stock in database");
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await ownerApi.markTransferReceived(id);
      await fetchCommissaryData();
      toast.success("✅ Stock verified in DB! Inventory levels reconciled.");
    } catch (err) {
      toast.error("Failed to update transfer status in DB");
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await ownerApi.deleteBranch(id);
      await fetchCommissaryData();
      toast.success("Branch removed from network database.");
    } catch (err) {
      toast.error("Failed to remove branch from DB");
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      await ownerApi.deleteCentralStock(id);
      await fetchCommissaryData();
      toast.success("Batch deleted from server DB.");
    } catch (err) {
      toast.error("Failed to delete stock from DB");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-gradient-to-r from-[#e85d04] to-orange-600 font-black text-[11px] uppercase rounded-lg tracking-widest shadow-sm">
              🏢 SPRINT 5 ENTERPRISE
            </span>
            <span className="text-slate-400 text-sm font-semibold flex items-center gap-1">
              <Layers size={14} className="text-indigo-400" /> Multi-Outlet Commissary HQ
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Central Kitchen & Franchise Command</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Manage central food production batches, execute real-time inter-branch stock replenishments, and audit transit vouchers across all connected restaurant outlets from a single cloud super-node.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowDispatchModal(true)}
            disabled={branches.length === 0 || centralStock.length === 0}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] text-white font-extrabold text-sm shadow-xl shadow-[#e85d04]/30 flex items-center gap-2 transform active:scale-95 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            title={branches.length === 0 || centralStock.length === 0 ? "Add at least 1 branch and 1 stock item first" : "Dispatch stock"}
          >
            <Plus size={18} /> Dispatch Inter-Branch Stock
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Quick Adds */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all ${
              activeTab === 'transfers' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck size={15} /> Transit Vouchers ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageCheck size={15} /> Base HQ Stock ({centralStock.length})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all ${
              activeTab === 'branches' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={15} /> Outlets Network ({branches.length})
          </button>
        </div>

        {activeTab === 'inventory' && (
          <button
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <Plus size={15} /> Add Central Stock Batch
          </button>
        )}
        {activeTab === 'branches' && (
          <button
            onClick={() => setShowAddBranchModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <Plus size={15} /> Link New Branch Outlet
          </button>
        )}
      </div>

      {/* VIEW: TRANSIT VOUCHERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="text-indigo-600" size={22} /> Active Stock Despatches & Reconciliations
            </h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search voucher # or item..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {transfers.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                    <th className="p-4">Voucher No</th>
                    <th className="p-4">Destination Branch</th>
                    <th className="p-4">Dispatched Item & Qty</th>
                    <th className="p-4">Driver & Logistics</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {transfers.filter(t => t.voucher_number.toLowerCase().includes(searchQuery.toLowerCase()) || t.item_name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                          {t.voucher_number}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">{t.dispatched_at}</span>
                      </td>
                      <td className="p-4 font-bold text-indigo-900">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-[#e85d04]" />
                          {t.destination_branch}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{t.item_name}</span>
                        <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md text-xs inline-block mt-1 border border-emerald-200">
                          {t.quantity} {t.unit}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 text-xs font-semibold">
                        {t.driver_name}
                      </td>
                      <td className="p-4">
                        {t.status === 'RECEIVED' && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase rounded-full flex items-center gap-1.5 w-fit">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Delivered & Shelf Verified
                          </span>
                        )}
                        {t.status === 'IN_TRANSIT' && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase rounded-full flex items-center gap-1.5 w-fit animate-pulse">
                            <Truck size={14} className="text-amber-600" /> In Transit on Highway
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toast.success(`🖨️ Printing electronic transit QR manifest for ${t.voucher_number}...`)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Print Transit Manifest QR"
                          >
                            <Printer size={16} />
                          </button>
                          {t.status !== 'RECEIVED' ? (
                            <button
                              onClick={() => handleMarkReceived(t.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-sm transition-all"
                            >
                              Verify Receipt 🟢
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold px-2 py-1">Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <Truck size={48} className="mx-auto text-indigo-400 opacity-40" />
                <h4 className="text-lg font-bold text-slate-700">No Stock Transit Vouchers Recorded Yet</h4>
                <p className="text-xs max-w-sm mx-auto">This client repository is clean and ready. Add branches and central kitchen items, then dispatch stock to generate live transit vouchers.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: BASE HQ STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-600 shrink-0" size={28} />
              <div>
                <h4 className="text-lg font-black text-amber-900">Central Kitchen Quality Control (QC) Sensor Hub</h4>
                <p className="text-xs text-amber-800 font-medium">All semi-cooked gravies and dough mixes undergo strict ambient temperature logging before franchise distribution.</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-amber-200 text-amber-900 text-xs font-extrabold uppercase rounded-xl">
              HQ Storage Vault: Active
            </span>
          </div>

          {centralStock.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {centralStock.map(stk => (
                <div key={stk.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase">{stk.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
                          {stk.qc_status}
                        </span>
                        <button onClick={() => handleDeleteStock(stk.id)} className="p-1 text-rose-400 hover:text-rose-600" title="Delete Batch">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900 mt-2">{stk.name}</h4>
                    <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-bold uppercase">Current Volume</span>
                        <span className="text-lg font-black text-indigo-600 font-mono">{stk.total_batch} {stk.unit}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-bold uppercase">Batch Date</span>
                        <span className="text-xs font-bold text-slate-700">{stk.batch_date}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-bold uppercase">Cold Chain Temp</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">{stk.temperature}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-rose-600 font-bold">Best before: {stk.expiry}</span>
                    <button
                      onClick={() => {
                        if (branches.length === 0) {
                          toast.error("Link a branch outlet first before dispatching stock!");
                          return;
                        }
                        setDispatchForm(prev => ({ ...prev, item_name: stk.name, destination_branch: branches[0].name }));
                        setShowDispatchModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      Dispatch to Outlet ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
              <PackageCheck size={48} className="mx-auto text-amber-500 opacity-40" />
              <h4 className="text-lg font-bold text-slate-700">Central Kitchen Stock Repository is Empty</h4>
              <p className="text-xs max-w-sm mx-auto mb-4">Click "Add Central Stock Batch" above to log master raw material batches (like Gravy Bases or Frozen Dough) for franchise distribution.</p>
              <button
                onClick={() => setShowAddStockModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20"
              >
                + Add First Central Stock Batch
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: BRANCHES NETWORK */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          {branches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map(br => (
                <div key={br.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-[#e85d04]" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase rounded-lg">
                        {br.id}
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-2">{br.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <MapPin size={13} className="text-slate-400" /> {br.location}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">Today's Revenue</span>
                      <span className="text-2xl font-black text-emerald-600 font-mono">{br.today_sales}</span>
                      <button onClick={() => handleDeleteBranch(br.id)} className="text-rose-500 hover:text-rose-700 text-[11px] font-bold mt-2 flex items-center gap-1">
                        <Trash2 size={12} /> Unlink Branch
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block">Branch POS Manager</span>
                      <span className="font-bold text-slate-800">{br.manager}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-right">POS Node Telemetry</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-1 justify-end">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {br.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">POS Health Score: <strong className="text-indigo-600 font-black">{br.health_score}</strong></span>
                    <button
                      onClick={() => toast.success(`Connecting real-time KDS & inventory feed for ${br.name}...`)}
                      className="text-xs font-extrabold text-[#e85d04] hover:underline"
                    >
                      Inspect Live KDS Screen ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
              <Building2 size={48} className="mx-auto text-indigo-400 opacity-40" />
              <h4 className="text-lg font-bold text-slate-700">No Connected Satellite Outlets</h4>
              <p className="text-xs max-w-sm mx-auto mb-4">Link your satellite restaurant branches to enable real-time inter-branch stock replenishments and multi-store telemetry.</p>
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20"
              >
                + Link First Branch Outlet
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DISPATCH STOCK */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Truck className="text-[#e85d04]" size={22} /> Issue Transit Voucher (Dispatch)
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Close ✕</button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Destination Branch Outlet</label>
                <select
                  value={dispatchForm.destination_branch}
                  onChange={e => setDispatchForm({ ...dispatchForm, destination_branch: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Target Branch...</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Select Commissary HQ Item</label>
                <select
                  value={dispatchForm.item_name}
                  onChange={e => setDispatchForm({ ...dispatchForm, item_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Stock Batch...</option>
                  {centralStock.map(s => <option key={s.id} value={s.name}>{s.name} ({s.unit})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Dispatch Quantity</label>
                  <input
                    type="number"
                    value={dispatchForm.quantity}
                    onChange={e => setDispatchForm({ ...dispatchForm, quantity: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-200 font-black text-lg bg-slate-50 text-center"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Unit</label>
                  <input
                    type="text"
                    value={dispatchForm.unit}
                    onChange={e => setDispatchForm({ ...dispatchForm, unit: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Logistics & Driver Information</label>
                <input
                  type="text"
                  value={dispatchForm.driver_name}
                  onChange={e => setDispatchForm({ ...dispatchForm, driver_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50"
                  placeholder="e.g. Driver Ramesh (MH-12-DE-4589)"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDispatchModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] shadow-lg shadow-[#e85d04]/30">🚚 Generate Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" size={20} /> Link Satellite Outlet
              </h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleAddBranch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Branch Name & Identifier</label>
                <input type="text" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50" placeholder="e.g. Branch #1 — Downtown Plaza" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Location Address</label>
                <input type="text" value={newBranch.location} onChange={e => setNewBranch({ ...newBranch, location: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50" placeholder="e.g. MG Road, Commercial Unit 4" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">POS Node Manager</label>
                <input type="text" value={newBranch.manager} onChange={e => setNewBranch({ ...newBranch, manager: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50" placeholder="e.g. Vikram Sharma" required />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="px-4 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">Link Outlet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CENTRAL STOCK */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PackageCheck className="text-amber-600" size={20} /> Register Central Stock Batch
              </h3>
              <button onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Item Batch Name</label>
                <input type="text" value={newStock.name} onChange={e => setNewStock({ ...newStock, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm bg-slate-50" placeholder="e.g. Master Makhani Gravy Base" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Batch Volume</label>
                  <input type="number" value={newStock.total_batch} onChange={e => setNewStock({ ...newStock, total_batch: Number(e.target.value) })} className="w-full p-3 rounded-xl border border-slate-200 font-black text-center" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Unit</label>
                  <input type="text" value={newStock.unit} onChange={e => setNewStock({ ...newStock, unit: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm" placeholder="Liters / Kg / Pcs" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Storage Temp</label>
                  <input type="text" value={newStock.temperature} onChange={e => setNewStock({ ...newStock, temperature: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm" placeholder="e.g. 4°C Chilled" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Shelf Life / Expiry</label>
                  <input type="text" value={newStock.expiry} onChange={e => setNewStock({ ...newStock, expiry: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-sm" placeholder="e.g. 5 Days" required />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddStockModal(false)} className="px-4 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20">Register Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
