import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, ConciergeBell, ChefHat, Loader2,
  ArrowRight, LogOut, Sparkles, Zap, ShieldCheck
} from 'lucide-react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
  const [loading, setLoading] = useState(!localStorage.getItem('userRole'));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authApi.getMe();
        if (data?.role) {
          setRole(data.role);
          localStorage.setItem('userRole', data.role);

          // SuperAdmin goes directly to admin portal
          if (data.role === 'SUPERADMIN') {
            navigate('/superadmin', { replace: true });
            return;
          }

          if (data.full_name) {
            setUserName(data.full_name);
            localStorage.setItem('userName', data.full_name);
          } else {
            setUserName(data.email.split('@')[0]);
            localStorage.setItem('userName', data.email.split('@')[0]);
          }
          localStorage.setItem('restaurantName', data.restaurant_name || '');
          if (data.restaurant_name) {
            document.title = `${data.restaurant_name} | MyRestro`;
          }
          localStorage.setItem('restaurantLogo', data.restaurant_logo || '');
          localStorage.setItem('subscriptionStatus', data.subscription_status || '');

          // ── Subscription Guard ──────────────────────────────
          const status = data.subscription_status;
          const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
          const subEndsAt = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null;
          const now = new Date();

          const isExpired =
            (status === 'trial' && trialEndsAt && trialEndsAt < now) ||
            (status === 'expired') ||
            (status === 'active' && subEndsAt && subEndsAt < now);

          if (isExpired) {
            navigate('/subscription-expired');
            return;
          }
          // ───────────────────────────────────────────────────
        }
      } catch (error: any) {
        console.error("Dashboard auth error:", error);
        if (error.response && [401, 403].includes(error.response.status)) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          toast.error('Server is restarting. Please wait a moment.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Intercept browser back button on Dashboard to show logout confirmation
  useEffect(() => {
    // Push a duplicate entry so the first "back" press stays here
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      const confirmed = window.confirm(
        'Are you sure you want to log out?\n\nYou will be redirected to the login page.'
      );
      if (confirmed) {
        localStorage.clear();
        window.location.replace('/login');
      } else {
        // Stay on Dashboard — push state again to block the back
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Loading</p>
        </div>
      </div>
    );
  }

  const canSeeOwner = role === 'OWNER';
  const canSeeWaiter = role === 'OWNER' || role === 'WAITER';
  const subscriptionPlan = localStorage.getItem('subscriptionPlan') || 'basic';
  const canSeeKitchen = (role === 'OWNER' || role === 'WAITER' || role === 'KITCHEN') && subscriptionPlan !== 'basic';
  const canSeeSuperAdmin = role === 'SUPERADMIN';

  const restaurantName = localStorage.getItem('restaurantName') || 'MyRestro';
  const restaurantLogo = localStorage.getItem('restaurantLogo');

  const workspaces = [
    canSeeOwner && {
      label: 'Executive Portal',
      sub: 'Owner Dashboard',
      desc: 'Analytics, menu catalog, staff management, and full system control.',
      Icon: Store,
      path: '/owner',
      gradA: '#4f46e5', gradB: '#7c3aed',
      accent: 'indigo',
      ring: 'ring-indigo-500/20',
      iconBg: 'bg-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    canSeeWaiter && {
      label: 'Service Terminal',
      sub: 'Waiter Console',
      desc: 'Manage tables, place orders, track live tickets, and process checkouts.',
      Icon: ConciergeBell,
      path: '/waiter',
      gradA: '#f59e0b', gradB: '#f97316',
      accent: 'amber',
      ring: 'ring-amber-500/20',
      iconBg: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    canSeeKitchen && {
      label: 'Kitchen Display',
      sub: 'KDS Station',
      desc: 'Real-time ticket queue, preparation tracking, and dispatch management.',
      Icon: ChefHat,
      path: '/kitchen',
      gradA: '#10b981', gradB: '#059669',
      accent: 'emerald',
      ring: 'ring-emerald-500/20',
      iconBg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    canSeeSuperAdmin && {
      label: 'Super Admin Portal',
      sub: 'Platform Admin',
      desc: 'Approve new restaurants, manage subscription plans, and view platform analytics.',
      Icon: ShieldCheck,
      path: '/superadmin',
      gradA: '#e11d48', gradB: '#be123c',
      accent: 'rose',
      ring: 'ring-rose-500/20',
      iconBg: 'bg-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ].filter(Boolean) as any[];

  return (
    <div className="min-h-screen flex flex-col mesh-bg">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="h-[72px] flex items-center justify-between px-6 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3.5">
          {/* Restaurant Logo — borderless, bigger */}
          {(restaurantLogo && !imageError)
            ? <img
                src={restaurantLogo}
                alt="Logo"
                className="w-16 h-16 shrink-0 object-contain"
                onError={() => setImageError(true)}
              />
            : <span
                className="text-[28px] font-black leading-none shrink-0"
                style={{ color: '#4338ca' }}
              >
                {restaurantName.charAt(0).toUpperCase()}
              </span>
          }
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none">{restaurantName}</h2>
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ boxShadow: '0 0 6px #10b981' }} />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 hidden sm:block">Restaurant Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] font-medium text-slate-700">{userName}</span>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center border border-transparent hover:border-slate-200 transition-colors"
            title="Sign Out"
          >
            <LogOut size={14} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main className="flex-grow flex flex-col items-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-5xl">

          {/* Restaurant brand hero */}
          <div className="text-center mb-12">

            {/* Big restaurant logo or monogram */}
            <div className="flex flex-col items-center gap-4 mb-8">
              {(restaurantLogo && !imageError)
                ? <img
                    src={restaurantLogo}
                    alt="Logo"
                    className="w-44 h-44 object-contain"
                    onError={() => setImageError(true)}
                  />
                : <div
                    className="w-44 h-44 rounded-3xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg,#4338ca 0%,#6366f1 50%,#7c3aed 100%)',
                      boxShadow: '0 8px 32px rgb(79 70 229 / .25)',
                    }}
                  >
                    <span className="text-white font-black text-[72px] leading-none">{restaurantName.charAt(0).toUpperCase()}</span>
                  </div>
              }

              <div>
                <h1
                  className="text-[30px] sm:text-[40px] font-black tracking-tight leading-none mb-1"
                  style={{
                    background: 'linear-gradient(135deg,#f59e0b 0%,#d97706 40%,#b45309 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {restaurantName}
                </h1>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Smart Restaurant OS</p>
              </div>
            </div>

            {/* Select workspace label */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Sparkles size={11} />
              Select your workspace
            </div>

            <p className="text-[14px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Connect to your operational module and begin your shift.
            </p>
          </div>

          {/* Workspace Cards */}
          <div className={`grid gap-5 ${workspaces.length === 1 ? 'max-w-sm mx-auto' :
              workspaces.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
            {workspaces.map((ws: any) => (
              <button
                key={ws.path}
                onClick={() => navigate(ws.path)}
                className="group relative bg-white rounded-2xl border border-slate-200 p-7 text-left flex flex-col
                           transition-all duration-200 shadow-sm
                           hover:shadow-xl hover:shadow-slate-200/60
                           hover:-translate-y-1 hover:border-slate-300"
              >

                {/* Gradient glow blob on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 60% 50% at 30% 0%, ${ws.gradA}12 0%, transparent 70%)`,
                  }}
                />

                {/* Top row: icon + badge */}
                <div className="flex items-start justify-between mb-7 relative">
                  <div
                    className={`w-14 h-14 rounded-2xl ${ws.iconBg} flex items-center justify-center shadow-lg
                                transition-transform duration-200 group-hover:scale-110`}
                    style={{ boxShadow: `0 6px 20px ${ws.gradA}55` }}
                  >
                    <ws.Icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ws.badgeBg}`}>
                    {ws.sub}
                  </span>
                </div>

                {/* Text */}
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight mb-2 relative">
                  {ws.label}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed flex-grow relative">{ws.desc}</p>

                {/* CTA */}
                <div className="mt-7 flex items-center justify-between relative">
                  <span
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200"
                    style={{ color: ws.gradA }}
                  >
                    Enter workspace
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>

                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                    style={{ background: `${ws.gradA}18` }}
                  >
                    <Zap size={13} style={{ color: ws.gradA }} />
                  </div>
                </div>

                {/* Bottom gradient line */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${ws.gradA}, ${ws.gradB})` }}
                />
              </button>
            ))}
          </div>


        </div>
      </main>
    </div>
  );
};

export default Dashboard;
