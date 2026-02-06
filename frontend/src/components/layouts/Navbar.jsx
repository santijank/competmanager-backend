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
    <nav
      className="relative z-40 min-h-[350px] h-[56vh] max-h-[700px] bg-cover md:min-h-[450px] lg:min-h-[500px]"
      style={{
        backgroundImage: "url('/images/header-banner.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/10" />

      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex items-end h-full px-6 pb-6 text-white">
        <div>
          <h1 className="text-3xl font-bold">
            CompetManager
          </h1>
          <p className="text-base opacity-90">
            ระบบบริหารจัดการแข่งขันระดับเขต
          </p>
        </div>
      </div>
    </nav>
  );
}
