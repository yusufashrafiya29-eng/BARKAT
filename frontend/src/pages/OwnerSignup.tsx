import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Loader2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    restaurant_name: '',
    logo_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
      data.append('full_name', formData.full_name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('phone_number', formData.phone_number);
      data.append('restaurant_name', formData.restaurant_name);
      if (logoFile) {
        data.append('logo', logoFile);
      }

      await authApi.signupOwner(data);
      toast.success('Registration successful. Please secure your account.');
      navigate('/verify', { state: { email: formData.email } });
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errMsg = 'Registration failed';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[600px] animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center rounded-md mb-6">
          <div className="w-4 h-4 bg-slate-50 border border-slate-200"></div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="text-[14px] text-slate-500 mt-2">Set up your brand and executive account.</p>
      </div>
 
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[13px] font-medium text-slate-800 border-b border-slate-200 pb-2">Workspace Identity</h3>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-800">Organization Name</label>
              <input name="restaurant_name" type="text" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Acme Corp" onChange={handleChange} required />
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-800">Brand Logo</label>
              <div className="flex items-center gap-4 p-3 border border-dashed border-slate-200 rounded-md group hover:border-text-slate-500 transition-colors relative">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                   {logoPreview ? (
                     <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <UploadCloud size={16} className="text-slate-500" />
                   )}
                </div>
                <div className="flex-1">
                   <p className="text-[13px] font-medium text-slate-800">Upload Avatar</p>
                   <p className="text-[12px] text-slate-500">JPG, PNG or WebP</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
 
          <div className="space-y-4">
            <h3 className="text-[13px] font-medium text-slate-800 border-b border-slate-200 pb-2">Executive Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-800">Full Name</label>
                <input name="full_name" type="text" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Jane Doe" onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-800">Work Email</label>
                <input name="email" type="email" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="jane@acme.com" onChange={handleChange} required />
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-800">Contact Number</label>
                <input name="phone_number" type="tel" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+1..." onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-800">Password</label>
                <input name="password" type="password" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" onChange={handleChange} required />
              </div>
            </div>
          </div>
 
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (
              <>Continue <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>
 
      <div className="text-center mt-6">
        <Link to="/login" className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
          Already have an account? Sign In
        </Link>
      </div>
    </div>
  );
};

export default OwnerSignup;
