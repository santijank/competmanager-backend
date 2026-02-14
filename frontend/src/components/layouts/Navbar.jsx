import { Menu, Bell, User, LogOut } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
