/**
 * Auth Layout
 * Path: src/layouts/AuthLayout.jsx
 */

import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
