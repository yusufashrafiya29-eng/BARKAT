import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Users, ArrowRight, Sparkles } from 'lucide-react';

const CHOICES = [
  {
    id: 'owner',
    path: '/signup/owner',
    Icon: Store,
    label: 'Restaurant Owner',
    desc: 'Set up your restaurant, manage the full menu, staff, billing, and analytics.',
    gradient: 'linear-gradient(135deg,#4338ca,#6366f1)',
    glow: 'rgb(99 102 241 / .25)',
    bg: '#eef2ff',
    color: '#4338ca',
    border: '#c7d2fe',
    badge: 'Most Popular',
  },
  {
    id: 'staff',
    path: '/signup/staff',
    Icon: Users,
    label: 'Kitchen / Waiter Staff',
    desc: 'Join your restaurant as a waiter or kitchen display operator.',
    gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
    glow: 'rgb(6 182 212 / .20)',
    bg: '#ecfeff',
    color: '#0e7490',
    border: '#a5f3fc',
    badge: null,
  },
];

const SignupChoice: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-4">
          <Sparkles size={10} />
          Get Started Free
        </div>
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none mb-2">
          Create your account
        </h1>
        <p className="text-[14px] text-slate-500">Choose your role to get started.</p>
      </div>

      {/* Role cards */}
      <div className="space-y-4 mb-8">
        {CHOICES.map(({ id, path, Icon, label, desc, gradient, glow, bg, color, border, badge }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="w-full text-left group relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'white',
              borderColor: border,
              boxShadow: `0 2px 12px ${glow}`,
            }}
          >
            {badge && (
              <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white"
                style={{ background: gradient, boxShadow: `0 2px 8px ${glow}` }}>
                {badge}
              </span>
            )}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[15px] text-slate-900">{label}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5"
                    style={{ background: bg }}>
                    <ArrowRight size={13} style={{ color }} />
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Login link */}
      <div className="text-center">
        <span className="text-[13px] text-slate-500">Already have an account? </span>
        <Link to="/login" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default SignupChoice;
