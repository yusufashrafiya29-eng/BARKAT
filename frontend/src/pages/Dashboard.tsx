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
          
          // Store branding info
          if (response.data.restaurant_name) localStorage.setItem('restaurantName', response.data.restaurant_name);
          if (response.data.restaurant_logo) localStorage.setItem('restaurantLogo', response.data.restaurant_logo);
          
          // Update Page UI
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Access constraints
  const canSeeOwner = role === 'OWNER';
  const canSeeWaiter = role === 'OWNER' || role === 'WAITER';
  const canSeeKitchen = role === 'OWNER' || role === 'WAITER' || role === 'KITCHEN';

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        {/* Top Header */}
        <header className="top-header">
          <div className="flex items-center gap-3">
             {localStorage.getItem('restaurantLogo') ? (
               <img 
                 src={localStorage.getItem('restaurantLogo') || ''} 
                 alt="Logo" 
                 className="w-10 h-10 rounded-xl object-cover border border-white/10"
               />
             ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <UtensilsCrossed size={22} className="text-white" />
              </div>
             )}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-gradient truncate max-w-[300px]">
              {localStorage.getItem('restaurantName') || 'BARKAT'}
            </h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Smart Restaurant</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#050505]"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="px-12 pb-12 flex-grow flex flex-col">
          {/* Top Section: Welcome Text */}
          <div className="w-full flex flex-col items-center text-center pt-10 mb-10">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Welcome back, <span className="text-gradient">{userName}</span></h2>
            <p className="text-slate-400 max-w-md mx-auto">Select a module below to begin managing your restaurant operations.</p>
          </div>

          {/* Center Section: Cards */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
              {/* Owner Card */}
              {canSeeOwner && (
                <button
                  onClick={() => navigate('/owner')}
                  className="role-card group glass-panel p-10 flex flex-col items-center text-center hover:-translate-y-2 cursor-pointer transition-all duration-500 border-cyan-400/20 hover:border-cyan-400/50"
                >
                  <div className="w-20 h-20 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 animate-float">
                    <Store size={40} className="text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Owner Panel</h3>
                  <p className="text-sm text-slate-400">Business analytics, settings, and staff management.</p>
                  <div className="mt-8 flex items-center gap-2 text-cyan-400 font-semibold text-sm group-hover:gap-4 transition-all">
                    Access Portal <span className="text-xl">→</span>
                  </div>
                </button>
              )}

              {/* Waiter Card */}
              {canSeeWaiter && (
                <button
                  onClick={() => navigate('/waiter')}
                  className="role-card group glass-panel p-10 flex flex-col items-center text-center hover:-translate-y-2 cursor-pointer transition-all duration-500 border-pink-500/20 hover:border-pink-500/50"
                >
                  <div className="w-20 h-20 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 animate-float" style={{ animationDelay: '0.5s' }}>
                    <ConciergeBell size={40} className="text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Waiter Station</h3>
                  <p className="text-sm text-slate-400">Table management, order taking, and service flow.</p>
                  <div className="mt-8 flex items-center gap-2 text-pink-500 font-semibold text-sm group-hover:gap-4 transition-all">
                    Enter Station <span className="text-xl">→</span>
                  </div>
                </button>
              )}

              {/* Kitchen Card */}
              {canSeeKitchen && (
                <button
                  onClick={() => navigate('/kitchen')}
                  className="role-card group glass-panel p-10 flex flex-col items-center text-center hover:-translate-y-2 cursor-pointer transition-all duration-500 border-slate-400/20 hover:border-slate-400/50"
                >
                  <div className="w-20 h-20 rounded-2xl bg-slate-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 animate-float" style={{ animationDelay: '1s' }}>
                    <ChefHat size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Kitchen KDS</h3>
                  <p className="text-sm text-slate-400">Active orders, preparation tracking, and supply status.</p>
                  <div className="mt-8 flex items-center gap-2 text-slate-300 font-semibold text-sm group-hover:gap-4 transition-all">
                    Open KDS <span className="text-xl">→</span>
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
