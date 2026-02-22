import { create } from 'zustand';
import api from '@/lib/api';

let pollingInterval = null;
let subscriberCount = 0;

const useMessageStore = create((set, get) => ({
  unreadCount: 0,
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.get('/messages/unread-count');
      set({ unreadCount: response.data?.unread_count || 0 });
    } catch (error) {
      console.debug('Unread count fetch error:', error);
    }
  },

  subscribe: () => {
    subscriberCount++;
    if (subscriberCount === 1) {
      const { fetchUnreadCount } = get();
      fetchUnreadCount();
      pollingInterval = setInterval(fetchUnreadCount, 30000);
    }
  },

  unsubscribe: () => {
    subscriberCount--;
    if (subscriberCount <= 0) {
      subscriberCount = 0;
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }
  },

  decrementUnread: (count = 1) => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - count) }));
  },
}));

export default useMessageStore;
