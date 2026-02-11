import { useEffect } from 'react';
import useOnlineUsersStore from '@/stores/onlineUsersStore';

/**
 * OnlineUsersIndicator - แสดงจำนวนผู้ใช้งานออนไลน์
 * ใช้ข้อมูลร่วมจาก onlineUsersStore (poll ทุก 30 วินาที)
 */
const OnlineUsersIndicator = ({ variant = 'compact' }) => {
  const { data, loading, subscribe, unsubscribe } = useOnlineUsersStore();

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-sm text-green-700 font-medium">
          ออนไลน์ {data?.total_online || 0} คน
        </span>
      </div>
    );
  }

  return null;
};

export default OnlineUsersIndicator;
