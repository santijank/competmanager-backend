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

export default function UserSearchSelect({ selectedUsers, onSelect, onRemove, multiple = false }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!search.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/messages/users/search', { params: { q: search } });
        const data = res.data?.data || [];
        // Filter out already selected
        const selectedIds = selectedUsers.map(u => u.id);
        setResults(data.filter(u => !selectedIds.includes(u.id)));
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, selectedUsers]);

  const handleSelect = (user) => {
    onSelect(user);
    setSearch('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.trim() && results.length > 0 && setShowDropdown(true)}
          placeholder="ค้นหาชื่อหรืออีเมล..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <div className="bg-gray-200 rounded-full p-1.5">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-800 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {roleLabels[user.role] || user.role}
                  {user.school_name && ` - ${user.school_name}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && search.trim() && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          ไม่พบผู้ใช้
        </div>
      )}
    </div>
  );
}
