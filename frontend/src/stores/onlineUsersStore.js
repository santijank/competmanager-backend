import { create } from 'zustand';
import api from '@/lib/api';

let pollingInterval = null;
let subscriberCount = 0;

const useOnlineUsersStore = create((set) => ({
  data: null,
  loading: true,

  fetchOnlineUsers: async () => {
    try {
      const response = await api.get('/online-users');
      set({ data: response.data?.data || null, loading: false });
    } catch (error) {
      console.debug('Online users fetch error:', error);
      set({ loading: false });
    }
  },

  subscribe: () => {
    subscriberCount++;
    if (subscriberCount === 1) {
      // เริ่ม polling เมื่อมี subscriber คนแรก
      const { fetchOnlineUsers } = useOnlineUsersStore.getState();
      fetchOnlineUsers();
      pollingInterval = setInterval(fetchOnlineUsers, 30000);
    }
  },

  unsubscribe: () => {
    subscriberCount--;
    if (subscriberCount <= 0) {
      subscriberCount = 0;
      // หยุด polling เมื่อไม่มี subscriber แล้ว
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }
  },
}));

export default useOnlineUsersStore;
