import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, User, Mail, Lock, Phone, Store, Image } from 'lucide-react';
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
      toast.success('Registration successful. Please verify OTP.');
      navigate('/verify', { state: { email: formData.email } });
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message);
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
    <div className="animate-fade-in">
      <div className="auth-header">
        <h1 className="text-gradient">Owner Setup</h1>
        <p>Register your new restaurant.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input name="full_name" type="text" className="form-input" style={{ paddingLeft: '44px' }} placeholder="Jane Doe" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Restaurant Name</label>
          <div style={{ position: 'relative' }}>
            <Store size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input name="restaurant_name" type="text" className="form-input" style={{ paddingLeft: '44px' }} placeholder="The Great Grill" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Restaurant Logo</label>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
               {logoPreview ? (
                 <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <Image size={24} className="text-slate-500" />
               )}
            </div>
            <div className="flex-grow">
               <label className="block">
                 <span className="sr-only">Choose logo</span>
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleFileChange}
                   className="block w-full text-sm text-slate-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-cyan-400/10 file:text-cyan-400
                     hover:file:bg-cyan-400/20
                     cursor-pointer"
                 />
               </label>
               <p className="text-[10px] text-slate-500 mt-2">JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input name="email" type="email" className="form-input" style={{ paddingLeft: '44px' }} placeholder="you@restaurant.com" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input name="phone_number" type="tel" className="form-input" style={{ paddingLeft: '44px' }} placeholder="+1234567890" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input name="password" type="password" className="form-input" style={{ paddingLeft: '44px' }} placeholder="••••••••" onChange={handleChange} required />
          </div>
        </div>

        <button type="submit" className="btn" style={{ marginTop: '20px' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Continue'} <ArrowRight size={18} />
        </button>
      </form>

      <div className="auth-footer">
        <p><Link to="/signup">Back to choices</Link></p>
      </div>
    </div>
  );
};

export default OwnerSignup;
