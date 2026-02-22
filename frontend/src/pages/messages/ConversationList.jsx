import { Users, MessageCircle, Megaphone, Search } from 'lucide-react';
import { useState } from 'react';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  district_admin: 'bg-purple-100 text-purple-700',
  group_admin: 'bg-blue-100 text-blue-700',
  school_admin: 'bg-green-100 text-green-700',
  teacher: 'bg-gray-100 text-gray-700',
};

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  broadcastId,
  loading,
}) {
  const [filter, setFilter] = useState('');

  const filtered = conversations.filter((c) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.latest_message?.content?.toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'เมื่อวาน';
    }

    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'broadcast':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      case 'group':
        return <Users className="w-5 h-5 text-blue-600" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหาสนทนา..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            {filter ? 'ไม่พบสนทนาที่ค้นหา' : 'ยังไม่มีสนทนา'}
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-50 hover:bg-blue-50 transition ${
                activeId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                conv.type === 'broadcast'
                  ? 'bg-purple-100'
                  : conv.type === 'group'
                  ? 'bg-blue-100'
                  : 'bg-gray-200'
              }`}>
                {conv.type === 'private' ? (
                  <span className="text-sm font-bold text-gray-600">{getInitials(conv.name)}</span>
                ) : (
                  getIcon(conv.type)
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {conv.name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatTime(conv.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {conv.latest_message ? (
                      <>
                        <span className="text-gray-400">{conv.latest_message.sender_name}: </span>
                        {conv.latest_message.content}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">ยังไม่มีข้อความ</span>
                    )}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {conv.unread_count > 99 ? '99+' : conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.type !== 'private' && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {conv.participant_count} สมาชิก
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
