import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      if (response.data && response.data.is_verified === false || response.message === "OTP verification required") {
        toast.error('Verification code required.');
        navigate('/verify', { state: { email } });
      } else {
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('userRole', response.data.role);
        toast.success(response.message || 'Authentication successful.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] animate-in fade-in duration-500 mx-auto">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center rounded-md mb-6">
          <div className="w-4 h-4 bg-slate-50 border border-indigo-500"></div>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">Access Workspace</h1>
        <p className="text-[14px] text-slate-500 mt-2">Enter credentials to authenticate.</p>
      </div>
 
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">Work Email</label>
            <input 
              type="email" 
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required 
            />
          </div>
 
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">API / Passkey</label>
            <input 
              type="password" 
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
 
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full mt-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
              <>Authenticate <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>
 
      <div className="text-center mt-6">
        <Link to="/signup" className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
          Initialize new workspace
        </Link>
      </div>
    </div>
  );
};

export default Login;
