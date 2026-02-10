import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import api from '@/lib/api';

/**
 * OnlineUsersIndicator - แสดงจำนวนผู้ใช้งานออนไลน์
 * ใช้ Polling ทุก 30 วินาที
 */
const OnlineUsersIndicator = ({ variant = 'compact' }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get('/online-users');
      const data = response.data?.data;
      if (data) {
        setOnlineCount(data.total_online || 0);
      }
    } catch (error) {
      // Silent fail - ไม่แสดง error เพราะเป็น background polling
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

  if (loading) {
    return null; // ไม่แสดงอะไรขณะโหลดครั้งแรก
  }

  // แบบย่อสำหรับ Sidebar
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-sm text-green-700 font-medium">
          ออนไลน์ {onlineCount} คน
        </span>
      </div>
    );
  }

  return null;
};

export default OnlineUsersIndicator;
