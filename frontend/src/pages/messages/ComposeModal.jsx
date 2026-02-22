import { useState } from 'react';
import { X, Send } from 'lucide-react';
import UserSearchSelect from './UserSearchSelect';
import api from '@/lib/api';
import { toast } from 'react-toastify';

export default function ComposeModal({ onClose, onConversationCreated }) {
  const [type, setType] = useState('private');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSelect = (user) => {
    if (type === 'private') {
      setSelectedUsers([user]);
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemove = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('กรุณาเลือกผู้รับข้อความ');
      return;
    }

    if (!message.trim()) {
      toast.warning('กรุณาพิมพ์ข้อความ');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/messages/conversations', {
        type,
        user_ids: selectedUsers.map((u) => u.id),
        name: type === 'group' ? groupName : null,
        message: message.trim(),
      });

      toast.success('ส่งข้อความสำเร็จ');
      onConversationCreated(res.data?.data?.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">สร้างสนทนาใหม่</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => { setType('private'); setSelectedUsers([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                type === 'private'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              แชทส่วนตัว
            </button>
            <button
              onClick={() => { setType('group'); setSelectedUsers([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                type === 'group'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              แชทกลุ่ม
            </button>
          </div>

          {/* Group name */}
          {type === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกลุ่ม</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="ตั้งชื่อกลุ่ม..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          {/* User search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'private' ? 'เลือกผู้รับ' : 'เพิ่มสมาชิก'}
            </label>
            <UserSearchSelect
              selectedUsers={selectedUsers}
              onSelect={handleSelect}
              onRemove={handleRemove}
              multiple={type === 'group'}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="พิมพ์ข้อความ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || selectedUsers.length === 0 || !message.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            {sending ? 'กำลังส่ง...' : 'ส่งข้อความ'}
          </button>
        </div>
      </div>
    </div>
  );
}
