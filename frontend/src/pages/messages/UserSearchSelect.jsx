import { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';
import api from '@/lib/api';

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

const rolePriority = {
  admin: 0,
  district_admin: 1,
  category_admin: 2,
  data_entry: 3,
  group_admin: 4,
  school_admin: 5,
  teacher: 6,
  committee: 7,
  judge: 8,
};

export default function UserSearchSelect({ selectedUsers, onSelect, onRemove, multiple = false }) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');

  // โหลด user ทั้งหมดตอน mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get('/messages/users/search', { params: { q: '' } });
        const data = res.data?.data || [];
        // เรียงตาม role priority แล้วตามชื่อ
        data.sort((a, b) => {
          const rp = (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99);
          if (rp !== 0) return rp;
          return (a.name || '').localeCompare(b.name || '');
        });
        setAllUsers(data);
      } catch {
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  // กรองตาม search + role + selected
  const selectedIds = selectedUsers.map(u => u.id);
  const filtered = allUsers.filter(u => {
    if (selectedIds.includes(u.id)) return false;
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.school_name?.toLowerCase().includes(q)
    );
  });

  // หา roles ที่มีใน user list (สำหรับ filter tabs)
  const availableRoles = [...new Set(allUsers.map(u => u.role))].sort(
    (a, b) => (rolePriority[a] ?? 99) - (rolePriority[b] ?? 99)
  );

  const handleSelect = (user) => {
    onSelect(user);
  };

  return (
    <div>
      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-sm"
            >
              {user.name}
              <button
                onClick={() => onRemove(user.id)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ, อีเมล, โรงเรียน..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-1 mb-2">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
            filterRole === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด ({allUsers.filter(u => !selectedIds.includes(u.id)).length})
        </button>
        {availableRoles.map(role => {
          const count = allUsers.filter(u => u.role === role && !selectedIds.includes(u.id)).length;
          if (count === 0) return null;
          return (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                filterRole === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {roleLabels[role] || role} ({count})
            </button>
          );
        })}
      </div>

      {/* User list */}
      <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-2 text-sm text-gray-500">กำลังโหลดรายชื่อ...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            ไม่พบผู้ใช้
          </div>
        ) : (
          filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition"
            >
              <div className="bg-gray-200 rounded-full p-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-800 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {roleLabels[user.role] || user.role}
                  {user.school_name && ` - ${user.school_name}`}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      {!loading && (
        <div className="text-xs text-gray-400 mt-1 text-right">
          แสดง {filtered.length} จาก {allUsers.length} คน
        </div>
      )}
    </div>
  );
}
