import { Outlet, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, LayoutDashboard } from 'lucide-react';
import useAuthStore from '@/stores/authStore';

// Public Navbar Component with Auth Buttons
function PublicNavbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav
      className="relative z-40 h-[1220px] bg-cover"
      style={{
        backgroundImage: "url('/images/header-banner.png')",
        backgroundPosition: '0 0',
        backgroundSize: 'cover'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/10" />

      {/* Auth Buttons - Top Right */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* User Info */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/30 text-white">
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-white font-medium hidden sm:inline">{user?.name || user?.email}</span>
            </div>

            {/* Dashboard Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all font-medium shadow-lg"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">แดชบอร์ด</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all font-medium shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg transition-all font-medium shadow-lg text-lg"
          >
            <LogIn className="w-5 h-5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}
      </div>

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

export default function PublicDashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar with Auth Buttons */}
      <PublicNavbar />

      {/* Main Content - Full Width */}
      <main className="px-6 sm:px-8 lg:px-10 py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
