import { Trophy, Users, IndianRupee, Search, TrendingUp, Sparkles, Send, Tag, Gift, Calendar, Award, Phone, CheckCircle2, UserCheck, Download } from 'lucide-react';
import { useOwnerStore } from '../../store/ownerStore';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CustomersTab() {
  const { customers } = useOwnerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<any | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(50);
  const [customerTags, setCustomerTags] = useState<{ [id: string]: string }>({
    // Store custom tag assignments in state
  });

  if (!customers) return null;

  const getTag = (c: any) => {
    if (customerTags[c.id]) return customerTags[c.id];
    if (c.total_spent > 1200 || c.loyalty_points > 200) return 'VIP';
    if (c.total_visits > 3) return 'Regular';
    if (c.name.toLowerCase().includes('ltd') || c.name.toLowerCase().includes('tech')) return 'Corporate';
    return 'Student';
  };

  const setTag = (id: string, tag: string) => {
    setCustomerTags(prev => ({ ...prev, [id]: tag }));
    toast.success(`Updated customer tier tag to ${tag}!`);
  };

  const handleSendWhatsApp = (phone: string, name: string, points: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `🎉 Dear ${name}, Greetings from MyRestro! 🥂 You currently have an impressive *${points} Loyalty Points* in your rewards wallet. Visit us today and show this message to redeem a special VIP discount on your meal! 🍽️✨`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success(`Opened WhatsApp greeting for ${name}`);
  };

  const handleAddBonusPoints = () => {
    if (!selectedCustomerForModal) return;
    selectedCustomerForModal.loyalty_points += Number(bonusPoints);
    toast.success(`Successfully awarded +${bonusPoints} bonus loyalty points!`);
    setSelectedCustomerForModal({ ...selectedCustomerForModal });
  };

  const filteredCustomers = customers.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone_number.includes(searchTerm);
    const matchesTag = selectedTagFilter === 'all' || getTag(c) === selectedTagFilter;
    return matchesSearch && matchesTag;
  });

  const topCustomers = [...customers].sort((a, b) => b.loyalty_points - a.loyalty_points).slice(0, 3);
  const totalCustomers = customers.length;
  const totalLoyaltyIssued = customers.reduce((sum: number, c: any) => sum + c.loyalty_points, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border border-slate-200 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Total Registered CRM</p>
              <p className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-none">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Users size={22} />
            </div>
          </div>
          <span className="mt-4 text-[12px] font-bold text-indigo-700 block flex items-center gap-1">
            <Sparkles size={14} /> Automatic profiling active
          </span>
        </div>

        <div className="stat-card border border-rose-200 bg-gradient-to-br from-rose-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-1">Points Issued Wallet</p>
              <p className="text-[32px] font-extrabold tracking-tight text-rose-950 leading-none">{totalLoyaltyIssued}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <Trophy size={22} />
            </div>
          </div>
          <span className="mt-4 text-[12px] font-bold text-rose-700 block flex items-center gap-1">
            <Gift size={14} /> ≈ ₹{(totalLoyaltyIssued * 0.1).toFixed(0)} in customer reward value
          </span>
        </div>

        <div className="stat-card border border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Top Lifetime Spender</p>
              <p className="text-[22px] font-extrabold tracking-tight text-emerald-950 leading-tight mt-1 truncate max-w-[180px]">
                {topCustomers[0]?.name || 'N/A'}
              </p>
              <p className="text-[13px] font-black text-emerald-700">₹{topCustomers[0]?.total_spent || 0} spend</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
              <Award size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main CRM Controls & Filtering */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="text-indigo-600" size={22} />
              Customer Relationship Management & Loyalty Cards
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Click any card to inspect lifetime order statistics or dispatch automated WhatsApp promotional offers.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Tag filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[12px] font-bold">
              {[
                { id: 'all', label: 'All Tiers' },
                { id: 'VIP', label: '⭐ VIP' },
                { id: 'Regular', label: '🔄 Regular' },
                { id: 'Corporate', label: '🏢 Corporate' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTagFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedTagFilter === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search phone or name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition-all"
              />
            </div>
            
            {/* Export Button */}
            <button
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/crm/csv?token_str=${localStorage.getItem('auth_token')}`)}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-colors whitespace-nowrap shadow-sm"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Customer Profile Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users size={40} className="mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-bold text-slate-600 text-[15px] mb-1">No customers matching filter</p>
              <p className="text-[13px]">Try clearing your search query or switching tier filters.</p>
            </div>
          ) : (
            filteredCustomers.map((c: any) => {
              const tag = getTag(c);
              const initials = c.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerForModal(c)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar + Name + Tag Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-[16px] flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                          {initials || 'VIP'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[16px] text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{c.name}</h4>
                          <p className="text-[13px] text-slate-500 font-semibold flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" /> {c.phone_number}
                          </p>
                        </div>
                      </div>

                      <select
                        onClick={e => e.stopPropagation()}
                        value={tag}
                        onChange={e => setTag(c.id, e.target.value)}
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none shadow-xs ${
                          tag === 'VIP' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          tag === 'Corporate' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          tag === 'Regular' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        <option value="VIP">⭐ VIP</option>
                        <option value="Regular">🔄 Regular</option>
                        <option value="Corporate">🏢 Corporate</option>
                        <option value="Student">🎓 Student</option>
                      </select>
                    </div>

                    {/* Stats Box */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 my-3 text-center">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">Visits</span>
                        <span className="text-[15px] font-black text-slate-900">{c.total_visits}</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Spend</span>
                        <span className="text-[15px] font-black text-emerald-700">₹{c.total_spent}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-amber-600 uppercase block">Rewards</span>
                        <span className="text-[14px] font-extrabold text-amber-700 flex items-center justify-center gap-1">
                          <Trophy size={13} /> {c.loyalty_points}
                        </span>
                      </div>
                    </div>

                    {/* DOB / Special Field */}
                    <div className="text-[12px] text-slate-500 font-medium flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> DOB: Nov 15</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Active Member</span>
                    </div>
                  </div>

                  {/* 1-Tap WhatsApp Auto-Greeting Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={(e) => handleSendWhatsApp(c.phone_number, c.name, c.loyalty_points, e)}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-black tracking-wide shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <Send size={14} /> 📲 WhatsApp Offer Greeting
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CUSTOMER PROFILE & BONUS POINTS MODAL */}
      {selectedCustomerForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 font-black text-[20px]">👑</span>
                <h3 className="text-[18px] font-black text-slate-900">{selectedCustomerForModal.name}</h3>
              </div>
              <button onClick={() => setSelectedCustomerForModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase font-mono tracking-widest text-indigo-300 block">Rewards Wallet Balance</span>
                  <span className="text-[28px] font-black text-amber-400 flex items-center gap-1.5 mt-1">
                    <Trophy size={22} /> {selectedCustomerForModal.loyalty_points} <span className="text-[14px] font-normal text-slate-300">points</span>
                  </span>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-[12px] font-bold border border-white/20">
                  ≈ ₹{(selectedCustomerForModal.loyalty_points * 0.1).toFixed(0)} Off
                </span>
              </div>

              <div className="space-y-2 py-1">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Registered Contact Phone:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedCustomerForModal.phone_number}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Total Lifetime Visits:</span>
                  <span className="font-bold text-indigo-600">{selectedCustomerForModal.total_visits} completed dines</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Average Spend per Dine:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{Math.round((selectedCustomerForModal.total_spent || 0) / (selectedCustomerForModal.total_visits || 1))}
                  </span>
                </div>
              </div>

              {/* Add Manual Bonus Points Box */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <label className="text-[12px] font-extrabold text-amber-900 block mb-2 flex items-center gap-1.5">
                  <Gift size={15} className="text-amber-600" /> Award Manager Bonus Loyalty Points
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bonusPoints}
                    onChange={e => setBonusPoints(Number(e.target.value))}
                    className="w-28 px-3 py-2 bg-white rounded-xl border border-amber-300 font-bold text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleAddBonusPoints}
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] shadow-sm transition-all"
                  >
                    + Award Points
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerForModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors mt-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
