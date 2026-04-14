import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, User, Mail, Lock, Phone, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    restaurant_name: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.signupOwner(formData);
      toast.success('Registration successful. Please verify OTP.');
      navigate('/verify', { state: { email: formData.email } });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
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
