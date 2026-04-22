import React from 'react';
import { ShieldAlert, CheckCircle2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionLock: React.FC = () => {
  const navigate = useNavigate();
  const restaurantName = localStorage.getItem('restaurantName') || 'Your Restaurant';
  
  const WHATSAPP_NUMBER = "919979114665";
  const UPI_ID = "9979114665@kotak811";
  
  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(`Hi Dine Flow! I'd like to renew the subscription for ${restaurantName}.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-50 p-8 text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-red-600" />
          </div>
          <h1 className="text-[24px] font-black text-slate-900 tracking-tight mb-2">Subscription Expired</h1>
          <p className="text-[14px] text-slate-600">
            Your free trial or subscription for <strong>{restaurantName}</strong> has ended.
          </p>
        </div>

        {/* Pricing */}
        <div className="p-8">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 text-center">
            <p className="text-[12px] font-extrabold text-indigo-600 uppercase tracking-widest mb-2">Premium SaaS Plan</p>
            <div className="flex items-end justify-center gap-1 mb-4">
              <span className="text-[36px] font-black leading-none tracking-tight text-slate-900">₹999</span>
              <span className="text-[14px] font-bold text-slate-500 mb-1">/ month</span>
            </div>
            
            <ul className="text-[13px] text-slate-600 space-y-2 text-left w-max mx-auto">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Complete Owner Dashboard</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Waiter Console & KDS Station</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> QR Code Ordering & Payments</li>
            </ul>
          </div>

          {/* Payment Instructions */}
          <div className="text-center">
            <h3 className="text-[15px] font-bold text-slate-900 mb-2">How to renew?</h3>
            <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
              Scan our UPI QR or pay via UPI ID <strong>{UPI_ID}</strong>. After payment, send us a screenshot on WhatsApp to instantly activate your account.
            </p>
            
            <button 
              onClick={handleWhatsAppClick}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={18} />
              Contact on WhatsApp
            </button>
            
            <div className="mt-4">
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }}
                className="text-[13px] font-bold text-slate-500 hover:text-slate-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLock;
