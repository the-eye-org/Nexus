import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isValidating } = useAuth();
  const location = useLocation();

  // Wait for auth validation (localStorage restore, optional server check)
  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-20 text-white/70">
        <span className="font-general text-xs uppercase tracking-[0.2em]">Validating session…</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
