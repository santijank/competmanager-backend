import { Menu, Globe, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import useMessageStore from '@/stores/messageStore';
import { useEffect } from 'react';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const { unreadCount, subscribe, unsubscribe } = useMessageStore();
  const navigate = useNavigate();

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  return (
    <nav className="relative z-40 w-full">
      {/* Banner Image - แสดงภาพเต็มขนาดปกติ */}
      <img
        src="/images/1header-banner.png?v=20260214"
        alt="งานศิลปหัตถกรรมนักเรียน"
        className="w-full h-auto block"
      />

      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Top Right Buttons */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
        {/* Message notification */}
        <button
          onClick={() => navigate('/messages')}
          className="relative flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg transition-all font-medium shadow-lg"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">ข้อความ</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Public Page Button */}
        <a
          href="https://competmanager.web.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all font-medium shadow-lg"
        >
          <Globe className="w-5 h-5" />
          <span className="hidden sm:inline">หน้าแสดงผล</span>
        </a>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-2 text-white">
        <h1 className="text-xl md:text-2xl font-bold drop-shadow-lg">
          CompetManager
        </h1>
        <p className="text-xs md:text-sm opacity-90 drop-shadow-md">
          ระบบบริหารจัดการแข่งขันระดับเขต
        </p>
      </div>
    </nav>
  );
}
