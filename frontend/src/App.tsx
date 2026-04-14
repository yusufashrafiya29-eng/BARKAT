import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AuthLayout from './components/AuthLayout';

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer QR Route (Public) */}
        <Route path="/order/table/:tableId" element={<CustomerMenu />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupChoice />} />
          <Route path="/signup/owner" element={<OwnerSignup />} />
          <Route path="/signup/staff" element={<StaffSignup />} />
          <Route path="/verify" element={<VerifyOTP />} />
        </Route>
        
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Placeholder routes for the dashboard links */}
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/waiter" element={<WaiterDashboard />} />
        <Route path="/kitchen" element={<KitchenKDS />} />
        
        {/* Default redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
