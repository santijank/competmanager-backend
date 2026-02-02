import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '@/lib/api';

/**
 * 🔍 Group Competition Filters
 * 
 * Component สำหรับ filter และ search การแข่งขัน
 */
const GroupCompetitionFilters = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleChange = (name, value) => {
    onFilterChange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    onFilterChange({
      status: '',
      registration_status: '',
      category_id: '',
      search: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        <Filter className="h-5 w-5" />
        <span>ตัวกรอง</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ค้นหา
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="ชื่อ หรือ รหัส..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หมวดหมู่
          </label>
          <select
            value={filters.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะ
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            <option value="draft">ร่าง</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="closed">ปิด</option>
          </select>
        </div>

        {/* Registration Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะการรับสมัคร
          </label>
          <select
            value={filters.registration_status}
            onChange={(e) => handleChange('registration_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            <option value="upcoming">เร็วๆ นี้</option>
            <option value="open">เปิดรับสมัคร</option>
            <option value="closed">ปิดรับสมัคร</option>
          </select>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  );
};

export default GroupCompetitionFilters;
