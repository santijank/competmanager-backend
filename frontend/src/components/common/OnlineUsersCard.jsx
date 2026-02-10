import { useState, useEffect, useRef } from 'react';
import { Users, Wifi } from 'lucide-react';
import api from '@/lib/api';

/**
 * OnlineUsersCard - แสดงรายละเอียดผู้ใช้งานออนไลน์ สำหรับหน้า Dashboard
 */
const OnlineUsersCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get('/online-users');
      setData(response.data?.data || null);
    } catch (error) {
      console.debug('Online users fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();

    // Polling ทุก 30 วินาที
    intervalRef.current = setInterval(fetchOnlineUsers, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      district_admin: 'bg-indigo-100 text-indigo-700',
      group_admin: 'bg-blue-100 text-blue-700',
      school_admin: 'bg-green-100 text-green-700',
      teacher: 'bg-yellow-100 text-yellow-700',
      committee: 'bg-purple-100 text-purple-700',
      judge: 'bg-orange-100 text-orange-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <Wifi className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              ผู้ใช้งานออนไลน์
            </h2>
            <p className="text-sm text-gray-500">อัพเดททุก 30 วินาที</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-3xl font-bold text-green-600">
            {loading ? '...' : (data?.total_online || 0)}
          </span>
          <span className="text-sm text-gray-500">คน</span>
        </div>
      </div>

      {/* แสดงจำนวนแยกตาม Role */}
      {data?.by_role && Object.keys(data.by_role).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">แยกตามบทบาท</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.by_role).map(([role, count]) => {
              const roleLabels = {
                admin: 'ผู้ดูแลระบบ',
                district_admin: 'ผู้ดูแลเขต',
                group_admin: 'ผู้ดูแลกลุ่ม',
                school_admin: 'ผู้ดูแลโรงเรียน',
                teacher: 'ครู',
                committee: 'คณะกรรมการ',
                judge: 'กรรมการตัดสิน',
              };
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getRoleBadgeColor(role)}`}
                >
                  {roleLabels[role] || role}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* รายชื่อผู้ใช้งานออนไลน์ */}
      {data?.users && data.users.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">รายชื่อผู้ใช้งาน</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-gray-800 font-medium">{user.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role_label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersCard;
