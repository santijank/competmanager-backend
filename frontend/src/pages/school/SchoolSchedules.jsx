import { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Building2,
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const SchoolSchedules = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules/public', {
        params: { school_group_id: user?.school_group_id }
      });
      const data = response.data?.data || [];
      setSchedules(data);

      // Auto-expand first category
      const cats = groupByCategory(data);
      if (cats.length > 0) {
        setExpandedCategories(new Set([cats[0].id]));
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (scheduleList) => {
    const groups = {};
    scheduleList.forEach(schedule => {
      const categoryId = schedule.competition?.category?.id || 'other';
      const categoryName = schedule.competition?.category?.name || 'อื่นๆ';
      if (!groups[categoryId]) {
        groups[categoryId] = {
          id: categoryId,
          name: categoryName,
          schedules: [],
        };
      }
      groups[categoryId].schedules.push(schedule);
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAll = (categories) => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5) + ' น.';
  };

  // Filter schedules by search
  const getFilteredSchedules = (categorySchedules) => {
    if (!searchTerm) return categorySchedules;
    return categorySchedules.filter(s =>
      s.competition?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const allCategories = groupByCategory(schedules);
  const filteredCategories = searchTerm
    ? allCategories.map(cat => ({
        ...cat,
        schedules: getFilteredSchedules(cat.schedules)
      })).filter(cat => cat.schedules.length > 0)
    : allCategories;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ประกาศสถานที่แข่งขัน
                </h1>
                <p className="text-gray-600 mt-1">
                  สถานที่แข่งขันที่ประกาศแล้วทั้งหมดของกลุ่ม
                </p>
              </div>
            </div>
            <button
              onClick={fetchSchedules}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">หมวดหมู่</p>
            <p className="text-2xl font-bold text-gray-900">{allCategories.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">ประกาศแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{schedules.filter(s => s.is_published).length}</p>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหากิจกรรม หรือ สถานที่..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => expandAll(filteredCategories)}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ขยายทั้งหมด
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ย่อทั้งหมด
              </button>
            </div>
          </div>
        </div>

        {/* Category Accordion */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีประกาศสถานที่แข่งขัน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              return (
                <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {category.schedules.length} กิจกรรม
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">
                      {category.schedules.map((schedule) => (
                        <div key={schedule.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base font-medium text-gray-900 mb-2">
                                {schedule.competition?.name || '-'}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                {schedule.venue && (
                                  <div className="flex items-center space-x-2">
                                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>สถานที่: {schedule.venue}</span>
                                    {schedule.room && <span>({schedule.room})</span>}
                                  </div>
                                )}
                                {schedule.competition_date && (
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>วันที่: {formatThaiDate(schedule.competition_date)}</span>
                                  </div>
                                )}
                                {(schedule.start_time || schedule.end_time) && (
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>
                                      เวลา: {formatTime(schedule.start_time)}
                                      {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {schedule.notes && (
                                <p className="mt-2 text-sm text-gray-500 italic">
                                  หมายเหตุ: {schedule.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolSchedules;
