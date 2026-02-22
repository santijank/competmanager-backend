import { Reply, CornerDownRight } from 'lucide-react';

const roleLabels = {
  admin: 'ผู้ดูแลระบบ',
  district_admin: 'ผู้ดูแลเขต',
  group_admin: 'ผู้ดูแลกลุ่ม',
  school_admin: 'ผู้ดูแลโรงเรียน',
  teacher: 'ครู',
  committee: 'กรรมการ',
  category_admin: 'ผู้ดูแลหมวด',
  data_entry: 'ผู้กรอกข้อมูล',
  judge: 'กรรมการตัดสิน',
};

export default function MessageBubble({ message, isOwn, onReply }) {
  const sender = message.sender || {};
  const replyTo = message.reply_to;

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
        {/* Sender name (not for own messages) */}
        {!isOwn && (
          <div className="text-xs text-gray-500 mb-1 ml-1">
            <span className="font-semibold">{sender.name || 'ไม่ทราบ'}</span>
            {sender.role && (
              <span className="ml-1 text-gray-400">({roleLabels[sender.role] || sender.role})</span>
            )}
          </div>
        )}

        {/* Reply quote */}
        {replyTo && (
          <div className={`flex items-start gap-1 mb-1 ${isOwn ? 'justify-end' : ''}`}>
            <CornerDownRight className="w-3 h-3 text-gray-400 mt-1 shrink-0" />
            <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg max-w-full truncate">
              <span className="font-medium">{replyTo.sender?.name || 'ไม่ทราบ'}:</span>{' '}
              {replyTo.content?.substring(0, 80)}{replyTo.content?.length > 80 ? '...' : ''}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl break-words whitespace-pre-wrap ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
          }`}
        >
          {message.content}

          {/* Time */}
          <div
            className={`text-[10px] mt-1 ${
              isOwn ? 'text-blue-200' : 'text-gray-400'
            }`}
          >
            {formatTime(message.created_at)}
          </div>
        </div>

        {/* Reply button */}
        <div className={`flex ${isOwn ? 'justify-end' : ''} mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button
            onClick={() => onReply(message)}
            className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 px-2 py-0.5"
          >
            <Reply className="w-3 h-3" />
            ตอบกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
