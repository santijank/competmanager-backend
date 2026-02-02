import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, token } = useAuthStore();

  // ตรวจสอบ token จาก localStorage ด้วย (เผื่อ state ยังไม่ได้อัพเดท)
  const storedToken = localStorage.getItem('auth_token');

  // ถ้าไม่มี token ทั้ง state และ localStorage → Redirect to login
  if (!isAuthenticated && !storedToken) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี token แต่ state ยังไม่ได้อัพเดท → อัพเดท state
  if (!isAuthenticated && storedToken) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // อัพเดท state จาก localStorage
      const { login } = useAuthStore.getState();
      // ไม่ต้อง login ใหม่ แค่ set state
      useAuthStore.setState({
        token: storedToken,
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
  }

  // ถ้ามี authentication → แสดงหน้าที่ต้องการ
  return <Outlet />;
}
