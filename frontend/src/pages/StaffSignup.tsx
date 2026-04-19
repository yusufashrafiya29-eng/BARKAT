import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'WAITER',
    restaurant_email: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.signupStaff(formData);
      toast.success('Registration successful. Awaiting verification.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Staff registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[450px] animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center rounded-md mb-6">
          <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff Enrollment</h1>
        <p className="text-[14px] text-slate-500 mt-2">Connect to your workspace.</p>
      </div>
 
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">Full Name</label>
            <input name="full_name" type="text" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" onChange={handleChange} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">Email Component</label>
            <input name="email" type="email" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="john@company.com" onChange={handleChange} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">Contact Line</label>
            <input name="phone_number" type="tel" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+1..." onChange={handleChange} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-800">Security Key</label>
            <input name="password" type="password" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" onChange={handleChange} required />
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-800">Target Workspace Email</label>
              <input name="restaurant_email" type="email" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin@acmecorp.com" onChange={handleChange} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-800">Requested Role</label>
              <select name="role" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" onChange={handleChange}>
                <option value="WAITER">Service (Waiter)</option>
                <option value="KITCHEN">Preparation (Kitchen)</option>
              </select>
            </div>
          </div>
 
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full mt-2" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (
              <>Request Access <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>
 
      <div className="text-center mt-6">
        <Link to="/signup" className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
          Not a staff member? Go back
        </Link>
      </div>
    </div>
  );
};

export default StaffSignup;
