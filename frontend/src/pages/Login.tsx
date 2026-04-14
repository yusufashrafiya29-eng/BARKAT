import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, Lock, Mail } from 'lucide-react';
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
      
      // If we hit the early return for OTP in the backend
      if (response.data && response.data.is_verified === false || response.message === "OTP verification required") {
        toast.error('Please verify your OTP first');
        navigate('/verify', { state: { email } });
      } else {
        // Success
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('userRole', response.data.role);
        toast.success(response.message || 'Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="auth-header">
        <h1 className="text-gradient">Welcome Back</h1>
        <p>Log in to access your smart restaurant backend.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              className="form-input" 
              style={{ paddingLeft: '44px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              className="form-input" 
              style={{ paddingLeft: '44px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
        </div>

        <button type="submit" className="btn" style={{ marginTop: '20px' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
        </button>
      </form>

      <div className="auth-footer">
        <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
      </div>
    </div>
  );
};

export default Login;
