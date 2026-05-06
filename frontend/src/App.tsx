import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';

// Layout
import AuthLayout from './components/AuthLayout';
import PrivateRoute from './components/PrivateRoute';
import AnnouncementBanner from './components/AnnouncementBanner';

// Pages
import Login from './pages/Login';
import SignupChoice from './pages/SignupChoice';
import OwnerSignup from './pages/OwnerSignup';
import StaffSignup from './pages/StaffSignup';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CustomerMenu from './pages/CustomerMenu';
import KitchenKDS from './pages/KitchenKDS';
import LandingPage from './pages/LandingPage';
import SubscriptionLock from './pages/SubscriptionLock';
import PublicBooking from './pages/PublicBooking';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminRoute from './components/SuperAdminRoute';

const ImpersonationBanner = () => {
  const isImpersonating = !!localStorage.getItem('superadmin_token');
  if (!isImpersonating) return null;

  const handleReturn = () => {
    const superadminToken = localStorage.getItem('superadmin_token');
    if (superadminToken) {
      localStorage.setItem('auth_token', superadminToken);
      localStorage.setItem('userRole', 'SUPERADMIN');
      localStorage.removeItem('superadmin_token');
      window.location.href = '/superadmin';
    }
  };

  return (
    <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-center gap-6 z-[100] relative shadow-md">
      <div className="flex items-center gap-2">
        <UserCheck size={18} />
        <span className="text-sm font-bold tracking-wide">You are currently impersonating an account. Actions taken will affect this user.</span>
      </div>
      <button 
        onClick={handleReturn}
        className="px-4 py-1.5 bg-white text-rose-700 text-xs font-black uppercase tracking-wider rounded-md hover:bg-rose-50 transition-colors shadow-sm"
      >
        Return to Super Admin
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ImpersonationBanner />
      <AnnouncementBanner />
      <Routes>
        {/* Landing Page (Public) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Customer QR Route (Public — no auth needed) */}
        <Route path="/order/table/:tableId" element={<CustomerMenu />} />
        <Route path="/book/:restaurantId" element={<PublicBooking />} />

        {/* Auth Layout Routes (Login / Signup) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupChoice />} />
          <Route path="/signup/owner" element={<OwnerSignup />} />
          <Route path="/signup/staff" element={<StaffSignup />} />
          <Route path="/verify" element={<VerifyOTP />} />
        </Route>
        
        {/* Protected Routes — require auth_token in localStorage */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/owner" element={<PrivateRoute><OwnerDashboard /></PrivateRoute>} />
        <Route path="/waiter" element={<PrivateRoute><WaiterDashboard /></PrivateRoute>} />
        <Route path="/kitchen" element={<PrivateRoute><KitchenKDS /></PrivateRoute>} />
        
        {/* Super Admin Route */}
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
        
        {/* Subscription Expired — accessible when logged in but subscription lapsed */}
        <Route path="/subscription-expired" element={<PrivateRoute><SubscriptionLock /></PrivateRoute>} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

