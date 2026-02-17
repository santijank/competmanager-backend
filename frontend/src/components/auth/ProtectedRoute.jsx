import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  // ตรวจสอบ token จาก localStorage ด้วย (เผื่อ state ยังไม่ได้อัพเดท)
  const storedToken = localStorage.getItem('auth_token');

  // ✅ ย้าย setState ไป useEffect เพื่อไม่ให้เกิด side effect ระหว่าง render
  // (ป้องกัน component tree unmount/remount จาก Zustand state flicker)
  useEffect(() => {
    if (!isAuthenticated && storedToken) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          useAuthStore.setState({
            token: storedToken,
            user: JSON.parse(storedUser),
            isAuthenticated: true,
          });
        } catch (e) {
          console.error('Failed to restore auth state:', e);
        }
      }
    }
  }, [isAuthenticated, storedToken]);

  // ถ้าไม่มี token ทั้ง state และ localStorage → Redirect to login
  if (!isAuthenticated && !storedToken) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี authentication หรือกำลัง restore state → แสดงหน้าที่ต้องการ
  return <Outlet />;
}
