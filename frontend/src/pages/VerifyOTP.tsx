import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await authApi.verifyOtp({ email, otp_code: otpCode });
      toast.success(resp.message || 'Verification successful! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const resp = await authApi.sendOtp({ email });
      toast.success(resp.message || 'OTP sent successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="auth-header">
        <h1 className="text-gradient">Security Check</h1>
        <p>We've sent a 6-digit code to <strong>{email}</strong>.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Authentication Code</label>
          <div style={{ position: 'relative' }}>
            <ShieldCheck size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--primary)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ 
                paddingLeft: '44px', 
                fontSize: '1.5rem', 
                letterSpacing: '8px', 
                textAlign: 'center',
                fontWeight: 600
              }} 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required 
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading || otpCode.length !== 6}>
          {loading ? 'Verifying...' : 'Verify My Account'} <ArrowRight size={18} />
        </button>
      </form>

      <div className="auth-footer">
        <p>Didn't receive the code?</p>
        <button 
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            background: 'none', border: 'none', color: 'var(--primary)', 
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
            marginTop: '8px', fontSize: '0.95rem'
          }}
        >
          <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
