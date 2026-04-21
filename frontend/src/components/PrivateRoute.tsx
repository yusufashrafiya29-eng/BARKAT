import React from 'react';
import { Navigate } from 'react-router-dom';

// Guards protected routes — redirects unauthenticated users to /login.
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
