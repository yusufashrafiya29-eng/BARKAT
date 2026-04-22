import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AuthLayout from './components/AuthLayout';
import PrivateRoute from './components/PrivateRoute';

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page (Public) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Customer QR Route (Public — no auth needed) */}
        <Route path="/order/table/:tableId" element={<CustomerMenu />} />

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
        
        {/* Subscription Expired — accessible when logged in but subscription lapsed */}
        <Route path="/subscription-expired" element={<PrivateRoute><SubscriptionLock /></PrivateRoute>} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

