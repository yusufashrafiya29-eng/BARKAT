import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-container">
      <div className="glass-panel auth-card animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
