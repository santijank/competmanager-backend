import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalBanner from '@/components/common/GlobalBanner';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar - อยู่ด้านบนสุดเต็มความกว้าง */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Banner - อยู่ใต้ Navbar เต็มความกว้าง */}
      <GlobalBanner />

      {/* Flex Layout - Sidebar และ Content อยู่ในระดับเดียวกัน */}
      <div className="lg:flex">
        {/* Sidebar - อยู่ในระดับเดียวกับ Content */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 sm:px-8 lg:px-10 py-8 bg-gray-100">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
