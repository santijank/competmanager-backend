import { NavLink } from 'react-router-dom';
import { 
  X, 
  Home, 
  Trophy, 
  FileText, 
  BarChart3, 
  Award, 
  Settings, 
  Users, 
  Building2, 
  Layers,
  PlusCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Megaphone,
  School
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasRole } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [window.location.pathname]);

  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // เมนูหลัก
  const getMenuItems = () => {
    const items = [
      {
        label: 'แดชบอร์ด',
        icon: Home,
        path: '/dashboard',
        roles: ['admin', 'committee', 'group_admin', 'school_admin', 'district_admin', 'teacher', 'judge'],
      },
    ];

    // ✅ การแข่งขัน - แยกตาม role
    if (hasRole(['admin', 'district_admin'])) {
      items.push({
        label: 'การแข่งขัน',
        icon: Trophy,
        roles: ['admin', 'district_admin'],
        children: [
          {
            label: 'สร้างการแข่งขันหลัก',
            path: '/competitions/two-tier/create',
            icon: PlusCircle,
          },
          {
            label: 'รายการการแข่งขัน',
            path: '/competitions',
            icon: Trophy,
          },
          {
            label: 'จัดการโรงเรียน',
            path: '/schools',
            icon: School,
          }
        ]
      });
    } else if (hasRole(['group_admin'])) {
      items.push({
        label: 'การแข่งขันของกลุ่ม',
        icon: Trophy,
        roles: ['group_admin'],
        children: [
          {
            label: 'แดชบอร์ด',
            path: '/competitions/group/dashboard',
            icon: Home,
          },
       
          {
            label: 'กำหนดการแข่งขัน',
            path: '/registrations/settings',
            icon: CheckCircle,
          }
        ]
      });
    } else {
      items.push({
        label: 'การแข่งขัน',
        icon: Trophy,
        path: '/competitions',
        roles: ['committee', 'school_admin', 'teacher'],
      });
    }

    // ✅ การลงทะเบียน - แยกตาม role
    if (hasRole(['teacher', 'school_admin'])) {
      items.push({
        label: 'การลงทะเบียน',
        icon: FileText,
        roles: ['teacher', 'school_admin'],
        children: [
          {
            label: 'เลือกการแข่งขัน',
            path: '/registrations/browse',
            icon: PlusCircle,
          },
          {
            label: 'การลงทะเบียนของฉัน',
            path: '/registrations/my',
            icon: FileText,
          }
        ]
      });
    } else if (hasRole(['group_admin', 'district_admin'])) {
      items.push({
        label: 'การลงทะเบียน',
        icon: FileText,
        roles: ['group_admin', 'district_admin'],
        children: [
          {
            label: 'จัดการการลงทะเบียน',
            path: '/registrations/manage',
            icon: CheckCircle,
          }
        ]
      });
    } else if (hasRole(['admin', 'committee'])) {
      items.push({
        label: 'การลงทะเบียน',
        icon: FileText,
        path: '/registrations',
        roles: ['admin', 'committee'],
      });
    }

    // ✅ ผลการแข่งขัน - แยกตาม role
    if (hasRole(['admin', 'district_admin', 'group_admin', 'judge'])) {
      items.push({
        label: 'ผลการแข่งขัน',
        icon: BarChart3,
        path: '/scores',
        roles: ['admin', 'district_admin', 'group_admin', 'judge'],
      });
    } else if (hasRole(['teacher'])) {
      items.push({
        label: 'ผลการแข่งขัน',
        icon: BarChart3,
        path: '/results',
        roles: ['teacher'],
      });
    }

    // เกียรติบัตร
    items.push({
      label: 'เกียรติบัตร',
      icon: Award,
      path: '/certificates',
      roles: ['admin', 'committee', 'district_admin'],
    });

    // ✅ ประกาศ (Admin + District Admin + Group Admin)
    if (hasRole(['admin', 'district_admin', 'group_admin'])) {
      items.push({
        label: 'จัดการประกาศ',
        icon: Megaphone,
        path: '/announcements',
        roles: ['admin', 'district_admin', 'group_admin'],
      });
    }

    // ✅ ผู้ใช้งาน (Admin + District Admin)
    if (hasRole(['admin', 'district_admin'])) {
      items.push({
        label: 'ผู้ใช้งาน',
        icon: Users,
        path: '/users',
        roles: ['admin', 'district_admin'],
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const settingsMenuItems = [
    {
      label: 'หมวดหมู่',
      icon: Layers,
      path: '/settings/categories',
      roles: ['admin'],
    },
    {
      label: 'กลุ่มโรงเรียน',
      icon: Users,
      path: '/settings/school-groups',
      roles: ['admin'],
    },
    {
      label: 'โรงเรียน',
      icon: Building2,
      path: '/settings/schools',
      roles: ['admin'],
    },
    {
      label: 'คณะทำงาน',
      icon: Users,
      path: '/settings/committee',
      roles: ['admin', 'district_admin', 'group_admin'],
    },
  ];

  const renderMenuItem = (item, index) => {
    if (!hasRole(item.roles)) return null;

    // Menu with children (sub-menu)
    if (item.children) {
      return (
        <div key={index}>
          <button
            onClick={() => toggleMenu(index)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center">
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {expandedMenus[index] ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
          </button>

          {/* Sub-menu */}
          {expandedMenus[index] && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child, childIndex) => (
                <NavLink
                  key={childIndex}
                  to={child.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <child.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Regular menu (no children)
    return (
      <NavLink
        key={index}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`
        }
      >
        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 🎨 Logo Header - เท่ากับความสูงของ Navbar (h-16) */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-600 text-white flex-shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">CompetManager</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 📋 Navigation - เริ่มต้นหลัง Logo พอดี */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item, index) => renderMenuItem(item, index))}
            </div>

            {/* Settings Section */}
            {settingsMenuItems.some(item => hasRole(item.roles)) && (
              <>
                <div className="mt-6 mb-2 px-3">
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      ตั้งค่า
                    </h3>
                  </div>
                </div>
                <div className="space-y-1">
                  {settingsMenuItems.map((item) => {
                    if (!hasRole(item.roles)) return null;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* 👤 User Info - ติดด้านล่าง */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white flex-shrink-0">
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
