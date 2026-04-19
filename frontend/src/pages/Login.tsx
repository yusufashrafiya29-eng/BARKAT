import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.data?.is_verified === false || response.message === 'OTP verification required') {
        toast.error('Verification required.');
        navigate('/verify', { state: { email } });
      } else {
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('userRole', response.data.role);
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 transition-all";

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-2">
          Welcome back 👋
        </h1>
        <p className="text-[14px] text-slate-500">Sign in to your restaurant dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@restaurant.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              className={`${inputClass} pr-10`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPwd(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-2"
          style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgb(99 102 241 / .40)',
          }}
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <><span>Sign In</span><ArrowRight size={16} /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Signup link */}
      <Link
        to="/signup"
        className="w-full py-3 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        Create a new restaurant account
      </Link>
    </div>
  );
};

export default Login;
