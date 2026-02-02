import { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * CategoryBulkSelector - เลือกหมวดหมู่สำหรับการสร้าง Master Competition
 * 
 * Props:
 * - selectedCategory: หมวดหมู่ที่เลือก
 * - onSelectCategory: Callback เมื่อเลือกหมวดหมู่
 * - disabled: ปิดการใช้งาน
 */
const CategoryBulkSelector = ({ selectedCategory, onSelectCategory, disabled = false }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
            เลือกหมวดหมู่
          </h3>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={disabled}
            >
              ยกเลิกการเลือก
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Categories List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>ไม่พบหมวดหมู่</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => !disabled && onSelectCategory(category)}
                disabled={disabled}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedCategory?.id === category.id
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`font-medium ${
                      selectedCategory?.id === category.id 
                        ? 'text-blue-700' 
                        : 'text-gray-900'
                    }`}>
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.code}
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                  {selectedCategory?.id === category.id && (
                    <ChevronRight className="h-5 w-5 text-blue-500 ml-2 flex-shrink-0" />
                  )}
                </div>

                {/* Competition count (if available) */}
                {category.competitions_count !== undefined && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600">
                      📋 {category.competitions_count} รายการแข่งขัน
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Info */}
      {selectedCategory && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-blue-900">
                หมวดที่เลือก
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {selectedCategory.name}
              </p>
              {selectedCategory.description && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedCategory.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBulkSelector;
