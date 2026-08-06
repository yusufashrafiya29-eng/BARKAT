import React from 'react';
import { ShieldAlert, CheckCircle2, X, MessageCircle, ArrowRight, Zap, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ownerApi } from '../api/owner';
import { Loader2 } from 'lucide-react';

const WHATSAPP_NUMBER = '919979114665';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    monthlyPrice: 800,
    yearlyPrice: 8000,
    color: 'slate',
    highlight: false,
    limits: 'Up to 10 Tables · 2 Staff',
    features: [
      'QR Digital Menu',
      'Waiter POS Terminal',
      'Kitchen Display System (KDS)',
      'Table Management (up to 10)',
      'GST Billing & Payments',
      'Cash Register & Shifts',
      'Basic Analytics',
      'Online Reservations',
    ],
    missing: [
      'CRM & Loyalty Points',
      'CSV Reports for CA',
      'Discount & Coupon Engine',
      'Zomato/Swiggy Hub',
      'AI Business Insights',
      '3D AR Menu',
      'Franchise Management',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Shield,
    monthlyPrice: 1400,
    yearlyPrice: 14000,
    color: 'indigo',
    highlight: true,
    badge: '⭐ Most Popular',
    limits: 'Unlimited Tables · Unlimited Staff',
    features: [
      'Everything in Basic, plus:',
      'Unlimited Tables & Staff',
      'CRM — Customer Database',
      'Customer Loyalty Points',
      'WhatsApp Digital Receipts',
      'Discount Coupons & Promos',
      'Happy Hours & BOGO Rules',
      'Zomato / Swiggy Hub',
      'AI Business Insights',
      '7-Day Revenue Charts',
      'Staff Leaderboard',
      'Expense Voucher Tracker',
      'CSV Reports for CA',
      'Day-End Summary',
      'Priority Support (4 hrs)',
    ],
    missing: [
      '3D AR Dish Viewer',
      'Franchise Management',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    icon: Crown,
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    color: 'amber',
    highlight: false,
    badge: '🏆 For Chains',
    limits: 'Multi-Branch · 3D AR · Priority',
    features: [
      'Everything in Pro, plus:',
      '3D AR Dish Viewer for Customers',
      'Multi-Branch / Franchise Management',
      'Central Commissary Stock Transfers',
      'Branch Health Score Dashboard',
      'Priority WhatsApp Support (1-hr SLA)',
      'Dedicated Account Manager',
    ],
    missing: [],
  },
];

const SubscriptionLock: React.FC = () => {
  const navigate = useNavigate();
  const restaurantName = localStorage.getItem('restaurantName') || 'Your Restaurant';
  const [yearly, setYearly] = React.useState(false);
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

  const handlePayment = async (planId: string, isYearly: boolean) => {
    setLoadingPlan(planId);
    try {
      // 1. Create order on backend
      const orderData = await ownerApi.createSubscriptionOrder(planId, isYearly);
      
      // 2. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MyRestro SaaS",
        description: `${planId.toUpperCase()} Plan Subscription`,
        image: "/logo.png",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await ownerApi.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful! Your subscription is now active.');
            // Clear local storage and redirect to login to refresh token
            localStorage.clear();
            navigate('/login');
          } catch (error) {
            alert('Payment verification failed.');
          }
        },
        theme: {
          color: "#4f46e5"
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error: any) {
      alert(`Failed to initialize payment: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getWhatsAppLink = (plan: string, isYearly: boolean) => {
    const price = PLANS.find(p => p.id === plan);
    if (!price) return '';
    const amount = isYearly ? price.yearlyPrice : price.monthlyPrice;
    const period = isYearly ? 'yearly' : 'monthly';
    const msg = encodeURIComponent(
      `Hi MyRestro! I want to renew/upgrade the subscription for *${restaurantName}*.\n\nPlan: *${price.name}* (${period} - ₹${amount.toLocaleString('en-IN')})\n\nPlease send payment details.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Banner */}
      <div className="bg-rose-600 text-white px-4 py-3 text-center">
        <p className="text-[14px] font-bold">
          ⚠️ Subscription for <strong>{restaurantName}</strong> has expired. Your KDS and ordering system are offline.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <img src="/logo.png" alt="MyRestro" className="h-14 w-auto object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
          </div>
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={30} className="text-rose-600" />
          </div>
          <h1 className="text-[28px] font-black text-slate-900 mb-2">Reactivate Your Subscription</h1>
          <p className="text-slate-500 text-[14px]">Choose a plan below and WhatsApp us to activate instantly.</p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-slate-200 rounded-full p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${!yearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${yearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
            >
              Yearly
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SAVE 2 MONTHS</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const perMonth = yearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  plan.highlight
                    ? 'border-indigo-500 bg-indigo-50 shadow-xl shadow-indigo-100'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase ${
                    plan.highlight ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  plan.highlight ? 'bg-indigo-600' : plan.id === 'max' ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <Icon size={18} className={plan.highlight ? 'text-white' : plan.id === 'max' ? 'text-amber-600' : 'text-slate-600'} />
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mb-4">{plan.limits}</p>

                <div className="mb-4">
                  {yearly && (
                    <p className="text-[12px] text-slate-400 line-through mb-0.5">₹{plan.monthlyPrice}/mo</p>
                  )}
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-900">₹{perMonth.toLocaleString('en-IN')}</span>
                    <span className="text-[13px] text-slate-500 mb-0.5">/mo</span>
                  </div>
                  {yearly && (
                    <p className="text-[12px] text-emerald-600 font-bold mt-0.5">
                      Billed ₹{price.toLocaleString('en-IN')}/year · Save ₹{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px]">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className={`${i === 0 && f.includes('Everything') ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f, i) => (
                    <li key={`m-${i}`} className="flex items-start gap-2 text-[13px]">
                      <X size={14} className="text-slate-300 shrink-0 mt-0.5" />
                      <span className="text-slate-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan.id, yearly)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-3 rounded-xl font-bold text-[14px] text-center flex items-center justify-center gap-2 transition-all ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                      : plan.id === 'max'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {loadingPlan === plan.id ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Pay via Razorpay</>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Instructions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center mb-6">
          <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Secure Online Payments</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Click "Pay via Razorpay" on your chosen plan → Complete payment via UPI, Card, or NetBanking.<br />
            <strong className="text-slate-700">Your account goes live instantly after payment.</strong>
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLock;
