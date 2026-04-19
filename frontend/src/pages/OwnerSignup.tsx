import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, Store, UploadCloud, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name:'', email:'', password:'', phone_number:'', restaurant_name:'' });
  const [logoFile, setLogoFile]     = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [showPwd, setShowPwd]       = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (logoFile) data.append('logo', logoFile);
      await authApi.signupOwner(data);
      toast.success('🎉 Restaurant created! Please verify your email.');
      navigate('/verify', { state: { email: formData.email } });
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = "relative";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block";
  const IconWrap = ({ children }: { children: React.ReactNode }) => (
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{children}</span>
  );

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
          Set up your restaurant 🍽️
        </h1>
        <p className="text-[13px] text-slate-500">Create your owner account and start managing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Restaurant Identity */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Restaurant Identity</p>

          {/* Restaurant name */}
          <div>
            <label className={labelClass}>Restaurant Name</label>
            <div className={inputWrap}>
              <IconWrap><Store size={14} /></IconWrap>
              <input name="restaurant_name" type="text" className={inputClass} placeholder="e.g. Barkat Biryani" onChange={handleChange} required />
            </div>
          </div>

          {/* Logo upload */}
          <div>
            <label className={labelClass}>Restaurant Logo <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <div
              className="flex items-center gap-4 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/50 relative"
              style={{ borderColor: logoPreview ? '#6366f1' : '#e2e8f0', background: logoPreview ? '#eef2ff50' : 'white' }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                  : <UploadCloud size={18} className="text-slate-400" />
                }
              </div>
              <div>
                {logoPreview
                  ? <div className="flex items-center gap-1.5 text-indigo-600"><CheckCircle2 size={14} /><span className="text-[13px] font-bold">Logo uploaded!</span></div>
                  : <p className="text-[13px] font-semibold text-slate-700">Click to upload logo</p>
                }
                <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG or WebP · Max 2MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Owner Details */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
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
              <input name="email" type="email" className={inputClass} placeholder="owner@restaurant.com" onChange={handleChange} required />
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
            : <><span>Create Restaurant Account</span><ArrowRight size={16} /></>
          }
        </button>
      </form>

      <div className="text-center mt-5">
        <span className="text-[13px] text-slate-500">Already registered? </span>
        <Link to="/login" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Sign In</Link>
      </div>
    </div>
  );
};

export default OwnerSignup;
