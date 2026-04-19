import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff, UtensilsCrossed, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'WAITER',  label: 'Waiter / Service',  icon: UtensilsCrossed, desc: 'Take orders, manage floor plan', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  { value: 'KITCHEN', label: 'Kitchen Staff / KDS', icon: ChefHat,         desc: 'Prepare orders, manage tickets', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
];

const StaffSignup: React.FC = () => {
  const navigate  = useNavigate();
  const [formData, setFormData] = useState({ full_name:'', email:'', password:'', phone_number:'', role:'WAITER', restaurant_email:'' });
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.signupStaff(formData);
      toast.success('🎉 Registration successful! Check your email for the OTP.');
      navigate('/verify', { state: { email: formData.email } });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputWrap  = "relative";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block";
  const IconWrap   = ({ children }: { children: React.ReactNode }) => (
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{children}</span>
  );

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
          Join your restaurant 👋
        </h1>
        <p className="text-[13px] text-slate-500">Register as staff and connect to your workplace.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role selector */}
        <div>
          <label className={labelClass}>Your Role</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, icon: Icon, desc, color, bg, border }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(f => ({ ...f, role: value }))}
                className="p-3 rounded-2xl border-2 text-left transition-all duration-150"
                style={{
                  borderColor: formData.role === value ? color : border,
                  background: formData.role === value ? bg : 'white',
                  boxShadow: formData.role === value ? `0 0 0 3px ${color}18` : 'none',
                }}
              >
                <Icon size={16} style={{ color: formData.role === value ? color : '#94a3b8' }} className="mb-1.5" />
                <p className="text-[12px] font-bold" style={{ color: formData.role === value ? color : '#64748b' }}>{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Personal info */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Your Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className={inputWrap}>
                <IconWrap><User size={14} /></IconWrap>
                <input name="full_name" type="text" className={inputClass} placeholder="Your name" onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <div className={inputWrap}>
                <IconWrap><Phone size={14} /></IconWrap>
                <input name="phone_number" type="tel" className={inputClass} placeholder="+91..." onChange={handleChange} required />
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className={inputWrap}>
              <IconWrap><Mail size={14} /></IconWrap>
              <input name="email" type="email" className={inputClass} placeholder="your@email.com" onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className={inputWrap}>
              <IconWrap><Lock size={14} /></IconWrap>
              <input name="password" type={showPwd ? 'text' : 'password'} className={`${inputClass} pr-10`} placeholder="Min. 8 characters" onChange={handleChange} required />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant linking */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">!</div>
            <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-widest">Link to Restaurant</p>
          </div>
          <div>
            <label className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 block">Owner's Email Address</label>
            <div className={inputWrap}>
              <IconWrap><Mail size={14} /></IconWrap>
              <input name="restaurant_email" type="email" className="w-full bg-white border border-amber-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="owner@restaurant.com" onChange={handleChange} required />
            </div>
            <p className="text-[11px] text-amber-600 mt-1.5">Enter your restaurant owner's registered email to link your account.</p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgb(99 102 241 / .40)',
          }}
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <><span>Join Restaurant</span><ArrowRight size={16} /></>
          }
        </button>
      </form>

      <div className="text-center mt-4">
        <Link to="/signup" className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
          ← Back to role selection
        </Link>
      </div>
    </div>
  );
};

export default StaffSignup;
