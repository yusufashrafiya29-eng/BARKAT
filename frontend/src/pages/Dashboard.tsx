import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, ConciergeBell, ChefHat, Loader2,
  UtensilsCrossed, Bell
} from 'lucide-react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [loading, setLoading] = useState(true);

  const updateBrandingUI = (name?: string, logo?: string) => {
    if (name) document.title = `${name} | BARKAT`;
    if (logo) {
      const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = logo;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await authApi.getMe();
        if (response.data && response.data.role) {
          setRole(response.data.role);
          setUserName(response.data.full_name || response.data.email.split('@')[0]);
          
          if (response.data.restaurant_name) localStorage.setItem('restaurantName', response.data.restaurant_name);
          if (response.data.restaurant_logo) localStorage.setItem('restaurantLogo', response.data.restaurant_logo);
          
          updateBrandingUI(response.data.restaurant_name, response.data.restaurant_logo);
        } else {
          toast.error("Failed to fetch user role.");
        }
      } catch (err) {
        toast.error("Authentication failed. Please log in again.");
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-6 h-6 text-muted animate-spin" />
      </div>
    );
  }

  const canSeeOwner = role === 'OWNER';
  const canSeeWaiter = role === 'OWNER' || role === 'WAITER';
  const canSeeKitchen = role === 'OWNER' || role === 'WAITER' || role === 'KITCHEN';

  return (
    <div className="flex min-h-screen bg-main">
      <main className="flex-grow flex flex-col">
        {/* Sleek Vercel-like Header */}
        <header className="h-[60px] flex items-center justify-between px-6 border-b border-subtle bg-main sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full flex items-center justify-center border border-subtle bg-surface shrink-0 overflow-hidden">
               {localStorage.getItem('restaurantLogo') ? (
                 <img 
                   src={localStorage.getItem('restaurantLogo') || ''} 
                   alt="Logo" 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <UtensilsCrossed size={14} className="text-muted" />
               )}
             </div>
             <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
               <span>{localStorage.getItem('restaurantName') || 'BARKAT'}</span>
               <span className="text-muted font-normal">/</span>
               <span className="text-muted">Workspaces</span>
             </div>
          </div>
 
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-muted">{userName}</span>
              <div className="w-6 h-6 rounded-full bg-surface border border-subtle flex items-center justify-center text-[10px] font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <button className="text-muted hover:text-main transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full border border-main"></span>
            </button>
          </div>
        </header>
 
        {/* Minimal Content */}
        <div className="px-6 py-24 flex-grow flex flex-col items-center">
          <div className="w-full max-w-5xl">
            <div className="mb-12 text-center md:text-left">
              <h2 className="text-3xl font-semibold mb-3 tracking-tight">Select your workspace</h2>
              <p className="text-[14px] text-muted max-w-md">Connect to an operational module to begin your shift.</p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {canSeeOwner && (
                <button
                  onClick={() => navigate('/owner')}
                  className="surface p-6 text-left hover:border-active transition-all group flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface border border-subtle flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                    <Store size={18} className="text-main" />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2">Executive Portal</h3>
                  <p className="text-[13px] text-muted leading-relaxed flex-grow">Advanced analytics, catalog management, and team oversight.</p>
                  <div className="mt-8 text-[13px] font-medium text-muted group-hover:text-main transition-colors flex items-center justify-between">
                    Enter workspace →
                  </div>
                </button>
              )}
 
              {canSeeWaiter && (
                <button
                  onClick={() => navigate('/waiter')}
                  className="surface p-6 text-left hover:border-active transition-all group flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface border border-subtle flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                    <ConciergeBell size={18} className="text-main" />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2">Service Terminal</h3>
                  <p className="text-[13px] text-muted leading-relaxed flex-grow">Manage ongoing tables, submit kitchen orders, and process bills.</p>
                  <div className="mt-8 text-[13px] font-medium text-muted group-hover:text-main transition-colors flex items-center justify-between">
                    Enter workspace →
                  </div>
                </button>
              )}
 
              {canSeeKitchen && (
                <button
                  onClick={() => navigate('/kitchen')}
                  className="surface p-6 text-left hover:border-active transition-all group flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface border border-subtle flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                    <ChefHat size={18} className="text-main" />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2">Kitchen Display (KDS)</h3>
                  <p className="text-[13px] text-muted leading-relaxed flex-grow">Live ticket management, preparation queues, and dispatching.</p>
                  <div className="mt-8 text-[13px] font-medium text-muted group-hover:text-main transition-colors flex items-center justify-between">
                    Enter workspace →
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
