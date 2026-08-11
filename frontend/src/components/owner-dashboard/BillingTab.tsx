import React, { useState } from 'react';
import { useOwnerStore } from '../../store/ownerStore';
import { Crown, Zap, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { ownerApi } from '../../api/owner';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  { id: 'basic', name: 'Basic', monthly: 499, yearly: 4990, icon: Zap, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'pro', name: 'Pro', monthly: 999, yearly: 9990, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'max', name: 'Max', monthly: 1399, yearly: 13990, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
];

export default function BillingTab() {
  const navigate = useNavigate();
  const { subscriptionStatus, subscriptionPlan, daysRemaining, initSubscription } = useOwnerStore();
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (planId: string, isYearly: boolean) => {
    setLoadingPlan(planId);
    try {
      const orderData = await ownerApi.createSubscriptionOrder(planId, isYearly);
      
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
            await ownerApi.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful! Your plan is upgraded.');
            // Refresh store
            await initSubscription();
          } catch (error) {
            alert('Payment verification failed.');
          }
        },
        theme: { color: "#4f46e5" }
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

  const currentPlanDetails = PLANS.find(p => p.id === subscriptionPlan);
  const CurrentIcon = currentPlanDetails?.icon || Zap;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="surface p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between border-2 border-indigo-100 bg-indigo-50/30">
        <div className="flex items-center gap-5 mb-4 md:mb-0">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${currentPlanDetails?.bg || 'bg-slate-100'}`}>
            <CurrentIcon size={32} className={currentPlanDetails?.color || 'text-slate-500'} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Current Plan: {subscriptionPlan.toUpperCase()}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {subscriptionStatus}
              </span>
              {daysRemaining !== null && (
                <span className="text-[13px] text-slate-500 font-medium">
                  {daysRemaining} days remaining
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Upgrade / Renew Plan</h3>
      
      {/* Toggle */}
      <div className="flex mb-6">
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
            Yearly <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SAVE 2 MONTHS</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const price = yearly ? plan.yearly : plan.monthly;
          const isCurrent = subscriptionPlan === plan.id;
          
          return (
            <div key={plan.id} className={`relative rounded-2xl border-2 p-5 flex flex-col ${isCurrent ? 'border-indigo-500 bg-white' : 'border-slate-200 bg-white'}`}>
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase bg-indigo-600 text-white shadow-md">
                  Current Plan
                </div>
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.bg}`}>
                <Icon size={20} className={plan.color} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">{plan.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-black text-slate-900">₹{price.toLocaleString()}</span>
                <span className="text-[13px] text-slate-500">/{yearly ? 'yr' : 'mo'}</span>
              </div>
              
              <div className="mt-auto pt-4">
                <button
                  onClick={() => handlePayment(plan.id, yearly)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
                    isCurrent 
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isCurrent ? (
                    'Renew / Extend'
                  ) : (
                    'Upgrade Plan'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
