import { Menu, Bell, User, LogOut } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'ผู้ดูแลระบบ',
      committee: 'กรรมการ',
      group_admin: 'ผู้ดูแลกลุ่ม',
      school_admin: 'ผู้ดูแลโรงเรียน',
      district_admin: 'ผู้ดูแลเขต',
      teacher: 'ครู',
      judge: 'ผู้ตัดสิน',
    };
    return badges[role] || role;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="เปิดเมนู"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* App Title - Desktop Only */}
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              CompetManager
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications Button */}
            <button 
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 relative"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white"></span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="เมนูผู้ใช้"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleBadge(user?.role)}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{getRoleBadge(user?.role)}</p>
                    </div>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
