
import { Users, FileText, Trophy } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Sidebar() {
  const { isAdmin, isTeacher } = useAuthStore();
  
  return (
    <nav>
      {/* ⭐ Admin Only - User Management */}
      {isAdmin() && (
        <Link to="/users" className="nav-link">
          <Users className="h-5 w-5" />
          <span>จัดการผู้ใช้</span>
        </Link>
      )}
      
      {/* ⭐ All Users - Registrations */}
      <Link to="/registrations" className="nav-link">
        <FileText className="h-5 w-5" />
        <span>การลงทะเบียน</span>
      </Link>
      
      {/* ⭐ All Users - Results */}
      <Link to="/results" className="nav-link">
        <Trophy className="h-5 w-5" />
        <span>ผลการแข่งขัน</span>
      </Link>
    </nav>
  );
}