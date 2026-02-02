import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ถ้า login แล้วให้ redirect ไป dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
