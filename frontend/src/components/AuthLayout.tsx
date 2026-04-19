import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Star, TrendingUp, Clock } from 'lucide-react';

const FEATURES = [
  { icon: UtensilsCrossed, text: 'Digital Menu & Ordering' },
  { icon: TrendingUp,      text: 'Real-time Sales Analytics' },
  { icon: Clock,           text: 'Live Kitchen Display (KDS)' },
  { icon: Star,            text: 'Multi-tenant SaaS Platform' },
];

const AuthLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>

      {/* ── LEFT PANEL: Branding ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)',
        }}
      >
        {/* Background mesh blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
          <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #c7d2fe, transparent)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(8px)' }}>
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-[20px] tracking-tight">BARKAT</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-indigo-300 font-bold text-[11px] uppercase tracking-[.2em] mb-3">Smart Restaurant OS</p>
            <h2 className="text-white font-black text-[36px] leading-[1.1] tracking-tight">
              Run your restaurant<br />
              <span style={{
                background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>like a pro.</span>
            </h2>
            <p className="text-indigo-200/80 text-[14px] leading-relaxed mt-3 max-w-xs">
              The all-in-one platform for managing orders, staff, inventory, and analytics — from one beautiful dashboard.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)' }}>
                  <Icon size={13} className="text-indigo-200" />
                </div>
                <span className="text-[13px] text-indigo-100 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(8px)' }}>
            <p className="text-[13px] text-indigo-100 leading-relaxed italic">
              "BARKAT transformed how we manage our restaurant. Orders are now seamless and our kitchen efficiency has doubled."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[11px] font-bold text-white">A</div>
              <div>
                <p className="text-[12px] font-bold text-white">Ahmed R.</p>
                <p className="text-[10px] text-indigo-300">Restaurant Owner, Mumbai</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array(5).fill(0).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ───────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header (logo only) */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5 border-b border-slate-200 bg-white">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)' }}>
            <UtensilsCrossed size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-[17px] text-slate-900 tracking-tight">BARKAT</span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-[460px]">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 pb-6 px-6">
          <p className="text-[11px] text-slate-400 font-medium">© 2025 BARKAT</p>
          <span className="text-slate-200">·</span>
          <Link to="/login" className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors font-medium">
            {isLogin ? 'Create account' : 'Sign in'}
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
