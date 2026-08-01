import { useState, useEffect } from 'react';
import { Tag, Clock, Gift, Plus, Check, Sparkles, AlertCircle, Copy, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrder: number;
  active: boolean;
  expiry: string;
  usageCount: number;
}

interface HappyHour {
  id: string;
  title: string;
  days: string[];
  startTime: string;
  endTime: string;
  discountPercent: number;
  category: string;
  active: boolean;
}

interface BogoRule {
  id: string;
  buyItem: string;
  buyQty: number;
  getItem: string;
  getQty: number;
  active: boolean;
}

export default function DiscountsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [happyHours, setHappyHours] = useState<HappyHour[]>([]);
  const [bogoRules, setBogoRules] = useState<BogoRule[]>([]);

  const fetchData = async () => {
    try {
      const c = await ownerApi.getCoupons();
      if (Array.isArray(c)) setCoupons(c);
      const h = await ownerApi.getHappyHours();
      if (Array.isArray(h)) setHappyHours(h);
      const b = await ownerApi.getBogoRules();
      if (Array.isArray(b)) setBogoRules(b);
    } catch (err) {
      console.error("Failed to fetch discounts from DB", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'happy_hours' | 'bogo'>('coupons');
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  
  // New Coupon Form State
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newValue, setNewValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(250);
  const [newExpiry, setNewExpiry] = useState('2026-12-31');

  const toggleCoupon = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    toast.success('Coupon status updated');
  };

  const toggleHappyHour = (id: string) => {
    setHappyHours(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));
    toast.success('Happy Hour schedule updated');
  };

  const toggleBogo = (id: string) => {
    setBogoRules(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    toast.success('BOGO promotion updated');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return toast.error('Coupon code is required');
    const custom: Coupon = {
      id: Date.now().toString(),
      code: newCode.toUpperCase().trim(),
      type: newType,
      value: Number(newValue),
      minOrder: Number(newMinOrder),
      active: true,
      expiry: newExpiry,
      usageCount: 0
    };
    try {
      await ownerApi.createCoupon(custom);
      await fetchData();
      setShowAddCoupon(false);
      setNewCode('');
      toast.success(`Coupon ${custom.code} generated & saved permanently in backend DB!`);
    } catch (err) {
      toast.error("Failed to save promo code to database");
    }
  };

  const generateAutoCode = () => {
    const prefixes = ['MYRESTRO', 'FEAST', 'SPECIAL', 'SAVOR', 'BONUS'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 40);
    setNewCode(`${randomPrefix}${randomNum}`);
    toast.success('Generated suggested promo code!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-[1px] shadow-sm">
        <div className="bg-white rounded-[15px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Discounts & Promotions Engine</h3>
              <p className="text-[13px] text-slate-500 font-medium">Drive repeat orders with smart coupon codes, scheduled Happy Hours, and BOGO deals.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('coupons')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeSubTab === 'coupons' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag size={15} /> Coupon Codes ({coupons.length})
            </button>
            <button
              onClick={() => setActiveSubTab('happy_hours')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeSubTab === 'happy_hours' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={15} /> Happy Hours ({happyHours.length})
            </button>
            <button
              onClick={() => setActiveSubTab('bogo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeSubTab === 'bogo' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift size={15} /> BOGO Deals ({bogoRules.length})
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: COUPONS */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[16px] font-bold text-slate-800">Active Promo Codes</h4>
            <button
              onClick={() => setShowAddCoupon(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Generate Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <div key={coupon.id} className={`bg-white rounded-2xl border transition-all p-5 ${
                coupon.active ? 'border-indigo-200 shadow-sm hover:shadow-md' : 'border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[16px] tracking-wider flex items-center gap-1.5">
                      {coupon.code}
                      <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Code copied!'); }} title="Copy Code">
                        <Copy size={13} className="text-indigo-400 hover:text-indigo-600" />
                      </button>
                    </div>
                  </div>
                  
                  <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                    coupon.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {coupon.active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-[13px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Benefit:</span>
                    <span className="font-extrabold text-slate-900">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Min Order Value:</span>
                    <span className="font-bold text-slate-900">₹{coupon.minOrder}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Redemptions:</span>
                    <span className="font-bold text-indigo-600">{coupon.usageCount} orders</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[12px]">
                    <span className="flex items-center gap-1"><Calendar size={13} /> Valid Till:</span>
                    <span>{coupon.expiry}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-400">Status Control:</span>
                  <button
                    onClick={() => toggleCoupon(coupon.id)}
                    className={`px-3 py-1 rounded-lg font-bold text-[12px] transition-colors ${
                      coupon.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {coupon.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HAPPY HOURS */}
      {activeSubTab === 'happy_hours' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[16px] font-bold text-slate-800">Automated Happy Hour Schedules</h4>
              <p className="text-[12px] text-slate-500">Discounts apply automatically during specified hours on matching items.</p>
            </div>
            <button 
              onClick={() => toast.success('New schedule wizard coming soon!')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[13px] shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Clock size={16} /> New Happy Hour
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {happyHours.map(hh => (
              <div key={hh.id} className={`bg-white rounded-2xl border p-6 transition-all ${
                hh.active ? 'border-amber-300 shadow-sm bg-gradient-to-br from-amber-50/20 via-white to-white' : 'border-slate-200 opacity-60'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h5 className="text-[16px] font-black text-slate-900">{hh.title}</h5>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[12px] font-black bg-amber-100 text-amber-800">
                    {hh.discountPercent}% OFF
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-3 flex flex-wrap gap-2 text-[12px]">
                  <span className="font-bold text-slate-700">Days:</span>
                  {hh.days.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-white rounded border border-slate-200 font-extrabold text-slate-800">{d}</span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[13px] py-1">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium"><Clock size={15} /> Active Window:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">{hh.startTime} - {hh.endTime}</span>
                </div>

                <div className="flex justify-between items-center text-[13px] py-1">
                  <span className="text-slate-500 font-medium">Target Category:</span>
                  <span className="font-bold text-indigo-600">{hh.category}</span>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[12px] font-bold ${hh.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hh.active ? '● Running on schedule' : '○ Paused'}
                  </span>
                  <button
                    onClick={() => toggleHappyHour(hh.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-[12px] transition-colors ${
                      hh.active ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {hh.active ? 'Pause Schedule' : 'Resume Schedule'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BOGO DEALS */}
      {activeSubTab === 'bogo' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[16px] font-bold text-slate-800">Buy One Get One (BOGO) Rules</h4>
              <p className="text-[12px] text-slate-500">Pair popular items with high-margin appetizers to boost average check size.</p>
            </div>
            <button 
              onClick={() => toast.success('BOGO rule creator coming soon!')}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[13px] shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
            >
              <Gift size={16} /> Create BOGO Rule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bogoRules.map(bg => (
              <div key={bg.id} className={`bg-white rounded-2xl border p-5 transition-all ${
                bg.active ? 'border-rose-300 shadow-sm' : 'border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-[12px] tracking-wider mb-3">
                  <Gift size={16} /> Bundle Deal Rule
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between font-bold text-slate-800 text-[14px]">
                  <span className="text-slate-900">Buy {bg.buyQty}× {bg.buyItem}</span>
                  <span className="text-rose-600 font-black">➔ GET {bg.getQty}× {bg.getItem} FREE</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">Auto-applies when items added to KOT</span>
                  <button
                    onClick={() => toggleBogo(bg.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[12px] ${
                      bg.active ? 'bg-slate-100 text-slate-700' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {bg.active ? 'Disable Rule' : 'Enable Rule'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showAddCoupon && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-[17px] font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="text-indigo-600" size={18} /> Generate Coupon Code
              </h3>
              <button onClick={() => setShowAddCoupon(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI20"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 font-mono uppercase font-black text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={generateAutoCode}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-[12px] text-slate-700 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Sparkles size={14} className="text-indigo-500" /> Suggest
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={e => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMinOrder}
                    onChange={e => setNewMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-[13px]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCoupon(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[13px] shadow-md shadow-indigo-500/20"
                >
                  Confirm & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
