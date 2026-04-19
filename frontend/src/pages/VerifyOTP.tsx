import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
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
      toast.success(resp.message || 'Verification successful. You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid authentication code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const resp = await authApi.sendOtp({ email });
      toast.success(resp.message || 'New code sent.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to dispatch code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter Verification Code</h1>
        <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
          We've sent a 6-digit secure code to<br />
          <span className="text-slate-800 font-medium">{email}</span>.
        </p>
      </div>
 
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <input 
              type="text" 
              className="w-full bg-transparent border-0 border-b border-slate-200 text-center text-3xl font-medium tracking-[0.5em] focus:border-main focus:ring-0 outline-none transition-colors pb-2" 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required 
            />
          </div>
 
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center w-full mt-4" disabled={loading || otpCode.length !== 6}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (
              <>Verify Access <ArrowRight size={14} /></>
            )}
          </button>
        </form>
 
        <div className="mt-8 pt-6 border-t border-slate-200 text-center flex flex-col items-center gap-2">
          <p className="text-[13px] text-slate-500">Didn't receive the code?</p>
          <button 
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-[13px] font-medium text-slate-800 hover:text-slate-500 transition-colors flex items-center gap-2"
          >
            {resending ? (
              <><Loader2 size={13} className="animate-spin" /> Sending...</>
            ) : (
              <><RefreshCw size={13} /> Resend Code</>
            )}
          </button>
        </div>
      </div>
 
      <div className="text-center mt-6">
        <Link to="/login" className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;
