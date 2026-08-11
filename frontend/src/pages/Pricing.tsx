import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import {
  Check, X, ArrowRight, MessageCircle, Zap, Shield, Crown,
  ChevronDown, ChevronUp
} from 'lucide-react';

const WHATSAPP_NUMBER = '919979114665';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For new restaurants getting started',
    icon: Zap,
    color: 'slate',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    yearlyMonthly: 416,
    cta: 'Start Free Trial',
    highlight: false,
    badge: null,
    limits: '10 Tables • 3 Staff Accounts',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Complete restaurant OS. Most restaurants choose this.',
    icon: Shield,
    color: 'indigo',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    yearlyMonthly: 833,
    cta: 'Start Free Trial',
    highlight: true,
    badge: '⭐ Most Popular',
    limits: 'Unlimited Tables • Unlimited Staff',
  },
  {
    id: 'max',
    name: 'Max',
    tagline: 'For chains & growing restaurant brands',
    icon: Crown,
    color: 'amber',
    monthlyPrice: 1399,
    yearlyPrice: 13990,
    yearlyMonthly: 1166,
    cta: 'Start Free Trial',
    highlight: false,
    badge: '🏆 For Chains',
    limits: 'Multi-Branch • 3D AR • Priority',
  },
];

interface Feature {
  label: string;
  basic: boolean | string;
  pro: boolean | string;
  max: boolean | string;
  highlight?: boolean;
}

const FEATURES: { section: string; items: Feature[] }[] = [
  {
    section: 'Core Operations',
    items: [
      { label: 'QR Digital Menu (Unlimited Scans)', basic: true, pro: true, max: true },
      { label: 'Waiter POS / Service Terminal', basic: true, pro: true, max: true },
      { label: 'Kitchen Display System (KDS)', basic: true, pro: true, max: true },
      { label: 'Real-time Order Updates (WebSocket)', basic: true, pro: true, max: true },
      { label: 'Table Management', basic: 'Up to 10', pro: 'Unlimited', max: 'Unlimited', highlight: true },
      { label: 'Staff Accounts', basic: 'Owner + 2', pro: 'Unlimited', max: 'Unlimited', highlight: true },
      { label: 'GST Billing & Multi-tender Payments', basic: true, pro: true, max: true },
      { label: 'WhatsApp Order Confirmation', basic: true, pro: true, max: true },
      { label: 'Online Table Reservations', basic: true, pro: true, max: true },
    ],
  },
  {
    section: 'Management & Analytics',
    items: [
      { label: 'Menu Management (Items, Images, Categories)', basic: true, pro: true, max: true },
      { label: 'Basic Today\'s Analytics', basic: true, pro: true, max: true },
      { label: '7-Day Revenue Charts & History', basic: false, pro: true, max: true, highlight: true },
      { label: 'AI-Powered Business Insights', basic: false, pro: true, max: true, highlight: true },
      { label: 'Staff Performance Leaderboard', basic: false, pro: true, max: true },
      { label: 'Inventory Tracking (Stock Items)', basic: true, pro: true, max: true },
      { label: 'Recipe / Bill of Materials (BOM)', basic: false, pro: true, max: true },
      { label: 'Cash Register & Shift Management', basic: true, pro: true, max: true },
      { label: 'Expense Voucher Tracker', basic: false, pro: true, max: true, highlight: true },
    ],
  },
  {
    section: 'Growth & Marketing',
    items: [
      { label: 'CRM — Customer Database', basic: false, pro: true, max: true, highlight: true },
      { label: 'Customer Loyalty Points', basic: false, pro: true, max: true, highlight: true },
      { label: 'WhatsApp Digital Receipts', basic: false, pro: true, max: true },
      { label: 'Discount Coupons & Promo Codes', basic: false, pro: true, max: true, highlight: true },
      { label: 'Happy Hours Scheduling', basic: false, pro: true, max: true },
      { label: 'Buy One Get One (BOGO) Rules', basic: false, pro: true, max: true },
      { label: 'Zomato / Swiggy Aggregator Hub', basic: false, pro: true, max: true, highlight: true },
    ],
  },
  {
    section: 'Reports & Compliance',
    items: [
      { label: 'Sales CSV Export (for CA/Accountant)', basic: false, pro: true, max: true, highlight: true },
      { label: 'Item-wise Sales Report', basic: false, pro: true, max: true },
      { label: 'Shift History Report', basic: false, pro: true, max: true },
      { label: 'GST-ready Billing', basic: true, pro: true, max: true },
      { label: 'Day-End Closing Summary', basic: false, pro: true, max: true },
    ],
  },
  {
    section: 'Enterprise (Max Only)',
    items: [
      { label: '3D AR Dish Viewer for Customers', basic: false, pro: false, max: true, highlight: true },
      { label: 'Multi-Branch / Franchise Management', basic: false, pro: false, max: true, highlight: true },
      { label: 'Central Commissary Stock Transfers', basic: false, pro: false, max: true },
      { label: 'Branch Health Score Dashboard', basic: false, pro: false, max: true },
      { label: 'Priority WhatsApp Support (1-hr SLA)', basic: false, pro: false, max: true, highlight: true },
      { label: 'Dedicated Account Manager', basic: false, pro: false, max: true },
    ],
  },
  {
    section: 'Support',
    items: [
      { label: '14-Day Free Trial (Full Pro Access)', basic: true, pro: true, max: true },
      { label: 'Email Support', basic: true, pro: true, max: true },
      { label: 'WhatsApp Support', basic: false, pro: 'Within 4 hrs', max: 'Within 1 hr', highlight: true },
      { label: 'Dedicated Account Manager', basic: false, pro: false, max: true },
    ],
  },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every new restaurant gets a full 14-day free trial with complete Pro-level access. No credit card required. Just sign up and start using immediately.',
  },
  {
    q: 'How do I pay after the trial ends?',
    a: 'Simply WhatsApp us at +91-9979114665 and pay via UPI or bank transfer. We\'ll activate your plan within minutes of receiving payment confirmation.',
  },
  {
    q: 'Can I upgrade from Basic to Pro later?',
    a: 'Absolutely. You can upgrade anytime by messaging us on WhatsApp. We\'ll pro-rate your remaining days and activate Pro features instantly.',
  },
  {
    q: 'What happens if I exceed the Basic plan limits?',
    a: 'If you try to add an 11th table or 3rd staff account on Basic, the system will notify you to upgrade. Your existing data is never lost.',
  },
  {
    q: 'Do you offer yearly billing discounts?',
    a: 'Yes! Yearly plans include 2 months free — saving you ₹998 on Basic, ₹1,998 on Pro, and ₹2,798 on Max compared to monthly billing.',
  },
  {
    q: 'Is my restaurant data safe?',
    a: 'Yes. All data is stored securely on Supabase (PostgreSQL), hosted on enterprise-grade infrastructure. Your data is yours — we never share or sell it.',
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={18} className="text-emerald-500 mx-auto" />;
  if (value === false) return <X size={16} className="text-slate-300 mx-auto" />;
  return <span className="text-[12px] font-semibold text-slate-700">{value}</span>;
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hi MyRestro! I want to know more about your pricing plans.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a101d] font-sans text-slate-300 overflow-x-hidden">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-36 pb-16 text-center px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[12px] font-black tracking-widest uppercase mb-6">
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            One price.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">
              Zero surprises.
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Start free for 14 days with full Pro access. No credit card needed.
            Upgrade when you're ready — cancel anytime.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-full p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${!yearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${yearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Yearly
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = yearly ? plan.yearlyMonthly : plan.monthlyPrice;
            const billedAs = yearly ? `₹${plan.yearlyPrice.toLocaleString('en-IN')}/year` : null;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.3)] scale-[1.03] md:scale-105'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-lg ${
                    plan.highlight ? 'bg-white text-indigo-700' : 'bg-amber-500 text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-7 flex-grow">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    plan.highlight ? 'bg-white/20' : 'bg-slate-700'
                  }`}>
                    <Icon size={22} className={plan.highlight ? 'text-white' : plan.id === 'max' ? 'text-amber-400' : 'text-slate-300'} />
                  </div>

                  <h2 className={`text-2xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-white'}`}>
                    {plan.name}
                  </h2>
                  <p className={`text-[13px] mb-6 leading-relaxed ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-2">
                    <div className="flex items-end gap-1">
                      <span className={`text-5xl font-black leading-none tracking-tight ${plan.highlight ? 'text-white' : 'text-white'}`}>
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-[14px] font-semibold mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                        /mo
                      </span>
                    </div>
                    {billedAs ? (
                      <p className={`text-[12px] mt-1 font-medium ${plan.highlight ? 'text-indigo-300' : 'text-slate-500'}`}>
                        Billed as {billedAs}
                      </p>
                    ) : (
                      <p className={`text-[12px] mt-1 font-medium ${plan.highlight ? 'text-indigo-300' : 'text-slate-500'}`}>
                        Billed monthly
                      </p>
                    )}
                  </div>

                  <p className={`text-[11px] font-bold uppercase tracking-wider mt-3 mb-6 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {plan.limits}
                  </p>

                  <Link
                    to="/signup"
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-[14px] transition-all shadow-lg ${
                      plan.highlight
                        ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-white/20'
                        : plan.id === 'max'
                        ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-amber-500/20'
                        : 'bg-slate-700 text-white hover:bg-slate-600 shadow-slate-900/30'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight size={16} />
                  </Link>

                  <p className={`text-center text-[11px] mt-3 ${plan.highlight ? 'text-indigo-300' : 'text-slate-500'}`}>
                    14-day free trial · No credit card
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Compare all features</h2>
            <p className="text-slate-400">See exactly what you get with each plan</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 border-b border-slate-700 bg-slate-800/60">
              <div className="p-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Feature</div>
              {PLANS.map(p => (
                <div key={p.id} className={`p-5 text-center ${p.highlight ? 'bg-indigo-600/20' : ''}`}>
                  <p className={`text-[14px] font-black ${p.highlight ? 'text-indigo-400' : 'text-white'}`}>{p.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ₹{(yearly ? p.yearlyMonthly : p.monthlyPrice).toLocaleString('en-IN')}/mo
                  </p>
                </div>
              ))}
            </div>

            {FEATURES.map((section, si) => (
              <div key={si}>
                {/* Section Header */}
                <div className="grid grid-cols-4 bg-slate-900/50 border-b border-slate-700/50">
                  <div className="col-span-4 px-5 py-3">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{section.section}</span>
                  </div>
                </div>

                {section.items.map((feat, fi) => (
                  <div
                    key={fi}
                    className={`grid grid-cols-4 border-b border-slate-700/30 transition-colors ${feat.highlight ? 'bg-indigo-500/5' : 'hover:bg-slate-800/40'}`}
                  >
                    <div className="p-4 pl-5 flex items-center">
                      <span className={`text-[13px] font-medium ${feat.highlight ? 'text-white' : 'text-slate-300'}`}>
                        {feat.highlight && <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2 mb-0.5 align-middle"></span>}
                        {feat.label}
                      </span>
                    </div>
                    <div className={`p-4 flex items-center justify-center ${PLANS[0].highlight ? 'bg-indigo-600/5' : ''}`}>
                      <FeatureCell value={feat.basic} />
                    </div>
                    <div className="p-4 flex items-center justify-center bg-indigo-600/10">
                      <FeatureCell value={feat.pro} />
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <FeatureCell value={feat.max} />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Row */}
            <div className="grid grid-cols-4 p-4 gap-3 bg-slate-800/80">
              <div className="flex items-center">
                <p className="text-[12px] font-bold text-slate-400">Start with any plan — 14 days free</p>
              </div>
              {PLANS.map(p => (
                <div key={p.id} className={`flex justify-center ${p.highlight ? 'bg-indigo-600/20 rounded-xl' : ''}`}>
                  <Link
                    to="/signup"
                    className={`w-full mx-2 py-2.5 rounded-xl font-bold text-[13px] text-center transition-all ${
                      p.highlight
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : p.id === 'max'
                        ? 'bg-amber-500 text-white hover:bg-amber-400'
                        : 'bg-slate-600 text-white hover:bg-slate-500'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-[15px] font-bold text-white pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={18} className="text-indigo-400 shrink-0" />
                    : <ChevronDown size={18} className="text-slate-400 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[14px] text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Banner */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-violet-600/5" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mx-auto mb-5">
                <MessageCircle size={26} className="text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Still have questions?</h3>
              <p className="text-slate-400 mb-6 text-[15px]">
                Talk to us directly on WhatsApp. Our team replies within minutes.<br />
                <span className="text-slate-300 font-semibold">+91-9979114665</span>
              </p>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-[15px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={20} />
                Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#05080f] py-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src="/logo.png" alt="MyRestro" className="h-9 w-auto" />
          <p className="text-[13px] text-slate-500">© {new Date().getFullYear()} MyRestro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[13px] text-slate-500 hover:text-white transition-colors">Home</Link>
            <Link to="/login" className="text-[13px] text-slate-500 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="text-[13px] text-slate-500 hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
