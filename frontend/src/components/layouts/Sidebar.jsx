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
  Megaphone,
  School,
  LogOut,
  Activity,
  MapPin,
  Ban,
  ClipboardList,
  CalendarCheck,
  MessageCircle,
  SkipForward,
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useEffect } from 'react';
import OnlineUsersIndicator from '@/components/common/OnlineUsersIndicator';

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasRole, logout } = useAuthStore();

  useEffect(() => {
    onClose();
  }, [window.location.pathname]);

  const getMenuItems = () => {
    const items = [];

    // ===== แดชบอร์ด - ทุก Role =====
    items.push({
      label: 'แดชบอร์ด',
      icon: Home,
      path: '/dashboard',
      roles: ['admin', 'committee', 'group_admin', 'school_admin', 'district_admin', 'teacher', 'judge'],
    });

    // ===== เมนูสำหรับ District Admin =====
    if (hasRole(['admin', 'district_admin'])) {
      items.push(
        {
          label: 'รายการการแข่งขัน',
          icon: Trophy,
          path: '/competitions',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'จัดการโรงเรียน',
          icon: School,
          path: '/schools',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'ประกาศสถานที่แข่งขัน',
          icon: MapPin,
          path: '/schedules/manage',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'ยกเว้นกลุ่มโรงเรียน',
          icon: Ban,
          path: '/competitions/exclusions',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'กำหนดกิจกรรมแต่ละกลุ่ม',
          icon: Layers,
          path: '/competitions/group-view',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'ข้ามระดับกลุ่ม',
          icon: SkipForward,
          path: '/competitions/skip-group',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'กำหนดการลงทะเบียน',
          icon: CalendarCheck,
          path: '/registrations/settings',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'ลงทะเบียนระดับเขต',
          icon: PlusCircle,
          path: '/registrations/browse',
          roles: ['admin', 'district_admin'],
        },
        {
          label: 'จัดการการลงทะเบียน',
          icon: ClipboardList,
          path: '/registrations/manage',
          roles: ['admin', 'district_admin'],
        }
      );
    }
    // ===== เมนูสำหรับ Group Admin =====
    else if (hasRole(['group_admin'])) {
      items.push(
        {
          label: 'กำหนดการแข่งขัน',
          icon: CalendarCheck,
          path: '/registrations/settings',
          roles: ['group_admin'],
        },
        {
          label: 'ลงทะเบียนการแข่งขัน',
          icon: PlusCircle,
          path: '/registrations/browse',
          roles: ['group_admin'],
        },
        {
          label: 'ประกาศสถานที่แข่งขัน',
          icon: MapPin,
          path: '/schedules/manage',
          roles: ['group_admin'],
        },
        {
          label: 'จัดการการลงทะเบียน',
          icon: ClipboardList,
          path: '/registrations/manage',
          roles: ['group_admin'],
        },
        {
          label: 'รายชื่อตัวแทนระดับเขต',
          icon: Award,
          path: '/school/district-competitions',
          roles: ['group_admin'],
        }
      );
    }
    // ===== เมนูสำหรับ Teacher / School Admin =====
    else if (hasRole(['teacher', 'school_admin'])) {
      items.push(
        {
          label: 'ข้อมูลโรงเรียน',
          icon: Building2,
          path: '/school/profile',
          roles: ['school_admin'],
        },
        {
          label: 'เลือกการแข่งขัน',
          icon: PlusCircle,
          path: '/registrations/browse',
          roles: ['teacher', 'school_admin'],
        },
        {
          label: 'การลงทะเบียนของฉัน',
          icon: FileText,
          path: '/registrations/my',
          roles: ['teacher', 'school_admin'],
        },
        {
          label: 'กิจกรรมแข่งขันของกลุ่ม',
          icon: Layers,
          path: '/school/group-competitions',
          roles: ['teacher', 'school_admin'],
        },
        {
          label: 'รายชื่อตัวแทนระดับเขต',
          icon: Award,
          path: '/school/district-competitions',
          roles: ['teacher', 'school_admin'],
        },
        {
          label: 'ประกาศสถานที่แข่งขัน',
          icon: MapPin,
          path: '/school/schedules',
          roles: ['teacher', 'school_admin'],
        },
        {
          label: 'ประกาศผล',
          icon: BarChart3,
          path: '/school/results',
          roles: ['teacher', 'school_admin'],
        }
      );
    }
    // ===== เมนูสำหรับ Committee =====
    else if (hasRole(['committee'])) {
      items.push(
        {
          label: 'การแข่งขัน',
          icon: Trophy,
          path: '/competitions',
          roles: ['committee'],
        },
        {
          label: 'การลงทะเบียน',
          icon: FileText,
          path: '/registrations',
          roles: ['committee'],
        }
      );
    }

    // ===== ผลการแข่งขัน =====
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

    // ===== เกียรติบัตร =====
    items.push({
      label: 'เกียรติบัตร',
      icon: Award,
      path: '/certificates',
      roles: ['admin', 'committee', 'district_admin'],
    });

    // ===== จัดการประกาศ =====
    if (hasRole(['admin', 'district_admin', 'group_admin'])) {
      items.push({
        label: 'จัดการประกาศ',
        icon: Megaphone,
        path: '/announcements',
        roles: ['admin', 'district_admin', 'group_admin'],
      });
    }

    // ===== แจ้งปัญหา (ทุก Role) =====
    items.push({
      label: 'แจ้งปัญหา',
      icon: MessageCircle,
      path: '/issues',
    });

    // ===== ผู้ใช้งาน =====
    if (hasRole(['admin', 'district_admin'])) {
      items.push({
        label: 'ผู้ใช้งาน',
        icon: Users,
        path: '/users',
        roles: ['admin', 'district_admin'],
      });
    }

    // ===== Activity Logs =====
    if (hasRole(['district_admin'])) {
      items.push({
        label: 'Activity Logs',
        icon: Activity,
        path: '/activity-logs',
        roles: ['district_admin'],
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
      roles: ['admin', 'district_admin', 'group_admin', 'school_admin'],
    },
  ];

  const renderMenuItem = (item, index) => {
    if (!hasRole(item.roles)) return null;

    return (
      <NavLink
        key={index}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar - อยู่ในระดับเดียวกับ content */}
      <aside
        className={`
          w-64 bg-white border-r flex-shrink-0
          fixed inset-y-0 left-0 z-50
          lg:relative lg:z-0
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:transform-none
        `}
      >
        <div className="flex flex-col h-full lg:sticky lg:top-0 lg:h-screen">
          {/* Mobile Header - แสดงเฉพาะบน mobile */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-600 text-white">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-gray-900">CompetManager</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item, index) => renderMenuItem(item, index))}
            </div>

            {/* Settings Section */}
            {settingsMenuItems.some(item => hasRole(item.roles)) && (
              <>
                <div className="mt-4 mb-2 px-3">
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
                          `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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

          {/* User Info */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            {/* Online Users Indicator */}
            <div className="mb-2">
              <OnlineUsersIndicator variant="compact" />
            </div>

            <div className="flex items-center space-x-3 mb-3">
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

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
