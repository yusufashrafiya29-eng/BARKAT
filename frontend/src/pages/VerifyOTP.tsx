import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { ArrowRight, RefreshCw, Loader2, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || '';

  const [otp, setOtp]           = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (!email) navigate('/login'); }, [email, navigate]);
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text   = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = text.split('');
    const next   = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const otpCode     = otp.join('');
  const isComplete  = otpCode.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setLoading(true);
    try {
      const resp = await authApi.verifyOtp({ email, otp_code: otpCode });
      toast.success(resp.message || '✅ Verified! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid code. Please try again.');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const resp = await authApi.sendOtp({ email });
      toast.success(resp.message || '📬 New code sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      {/* Icon + heading */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #6ee7b7', boxShadow: '0 4px 20px rgb(16 185 129 / .18)' }}>
          <ShieldCheck size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-2">
          Verify your email
        </h1>
        <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed">
          We sent a 6-digit code to
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <Mail size={13} className="text-indigo-500" />
          <span className="text-[13px] font-bold text-indigo-600">{email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* OTP boxes */}
        <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="w-12 h-14 text-center text-[22px] font-extrabold rounded-2xl border-2 transition-all duration-150 focus:outline-none"
              style={{
                borderColor: digit ? '#6366f1' : '#e2e8f0',
                background: digit ? '#eef2ff' : '#f8fafc',
                color: digit ? '#4338ca' : '#94a3b8',
                boxShadow: digit ? '0 0 0 3px rgb(99 102 241 / .15)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isComplete}
          className="w-full py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            boxShadow: isComplete ? '0 4px 20px rgb(16 185 129 / .40)' : 'none',
          }}
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <><ShieldCheck size={16} /><span>Verify Account</span><ArrowRight size={16} /></>
          }
        </button>
      </form>

      {/* Resend */}
      <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col items-center gap-2">
        <p className="text-[12px] text-slate-400">Didn't receive the code?</p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1.5 text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
        >
          {resending
            ? <><Loader2 size={13} className="animate-spin" />Sending...</>
            : <><RefreshCw size={13} />Resend Code</>
          }
        </button>
      </div>

      <div className="text-center mt-4">
        <Link to="/login" className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;
