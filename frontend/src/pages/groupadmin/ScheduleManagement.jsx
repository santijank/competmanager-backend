// ไฟล์: frontend/src/pages/groupadmin/ScheduleManagement.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar,
  MapPin,
  Clock,
  Save,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';
import apiClient from '@/lib/api/axios-interceptor';
import useAuthStore from '@/stores/authStore';

/**
 * หน้าจัดการตารางสถานที่แข่งขัน
 * สำหรับ Group Admin และ District Admin
 */
const ScheduleManagement = () => {
  const { user } = useAuthStore();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Schedule data - keyed by competition_id
  const [scheduleData, setScheduleData] = useState({});

  useEffect(() => {
    // รอให้ token พร้อมก่อนโหลดข้อมูล (รองรับทั้ง auth_token และ token)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      loadData();
    } else {
      // ถ้าไม่มี token รอสักครู่แล้วลองอีกครั้ง (กรณี redirect หลัง login)
      const timer = setTimeout(() => {
        const retryToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (retryToken) {
          loadData();
        } else {
          setLoading(false);
          // ไม่มี token จริงๆ - interceptor จะ handle redirect
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories first (this should work if auth is valid)
      let catRes;
      try {
        catRes = await apiClient.get('/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data || []);
        }
      } catch (catError) {
        console.error('Categories error:', catError);
        // If categories fail with 401, the interceptor will handle redirect
        if (catError.response?.status === 401) {
          return; // Let interceptor handle
        }
      }

      // Then load competitions with approved registrations
      try {
        const compRes = await apiClient.get('/schedules/approved-competitions');
        console.log('Competitions response:', compRes.data);

        if (compRes.data.success) {
          const comps = compRes.data.data || [];
          setCompetitions(comps);

          // Initialize schedule data
          const initialData = {};
          comps.forEach(comp => {
            if (comp.schedule) {
              initialData[comp.id] = {
                venue: comp.schedule.venue || '',
                room: comp.schedule.room || '',
                competition_date: comp.schedule.competition_date?.split('T')[0] || '',
                start_time: comp.schedule.start_time?.substring(0, 5) || '',
                end_time: comp.schedule.end_time?.substring(0, 5) || '',
                notes: comp.schedule.notes || '',
                is_published: comp.schedule.is_published || false,
              };
            } else {
              initialData[comp.id] = {
                venue: '',
                room: '',
                competition_date: '',
                start_time: '',
                end_time: '',
                notes: '',
                is_published: false,
              };
            }
          });
          setScheduleData(initialData);
        } else {
          console.log('No success in response:', compRes.data);
          setCompetitions([]);
        }
      } catch (compError) {
        console.error('Competitions error:', compError);
        if (compError.response?.status !== 401) {
          // Only show error if not 401 (interceptor handles 401)
          toast.error(compError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการแข่งขันได้');
        }
        setCompetitions([]);
      }
    } catch (error) {
      console.error('Load data error:', error);
      if (error.response?.status !== 401) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (competitionId, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [competitionId]: {
        ...prev[competitionId],
        [field]: value
      }
    }));
  };

  const handleSave = async (competitionId) => {
    try {
      setSaving(true);
      const data = scheduleData[competitionId];

      const response = await apiClient.post('/schedules', {
        competition_id: competitionId,
        ...data
      });

      if (response.data.success) {
        toast.success('บันทึกตารางแข่งขันสำเร็จ');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (competitionId) => {
    try {
      // Save first
      await handleSave(competitionId);

      // Then toggle is_published
      setScheduleData(prev => ({
        ...prev,
        [competitionId]: {
          ...prev[competitionId],
          is_published: !prev[competitionId].is_published
        }
      }));

      // Save again with new publish status
      const data = scheduleData[competitionId];
      await apiClient.post('/schedules', {
        competition_id: competitionId,
        ...data,
        is_published: !data.is_published
      });

      toast.success(data.is_published ? 'ยกเลิกการเผยแพร่แล้ว' : 'เผยแพร่ตารางแข่งขันแล้ว');
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleBulkSave = async () => {
    try {
      setSaving(true);

      const schedulesToSave = Object.entries(scheduleData)
        .filter(([_, data]) => data.venue || data.competition_date)
        .map(([compId, data]) => ({
          competition_id: parseInt(compId),
          ...data
        }));

      if (schedulesToSave.length === 0) {
        toast.warning('ไม่มีข้อมูลที่ต้องบันทึก');
        return;
      }

      const response = await apiClient.post('/schedules/bulk', {
        schedules: schedulesToSave
      });

      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Bulk save error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Filter competitions
  const filteredCompetitions = competitions.filter(comp => {
    const matchSearch = !searchTerm ||
      comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = !filterCategory ||
      comp.category_id?.toString() === filterCategory;

    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">ประกาศสถานที่แข่งขัน</h1>
        </div>
        <p className="text-gray-600">กำหนดสถานที่และเวลาแข่งขันสำหรับกิจกรรมที่มีผู้ลงทะเบียนอนุมัติแล้ว</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหากิจกรรม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="min-w-[200px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleBulkSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Competition List */}
      {filteredCompetitions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบกิจกรรมที่ต้องกำหนดสถานที่</h3>
          <p className="text-gray-600">กิจกรรมจะปรากฏที่นี่เมื่อมีผู้ลงทะเบียนและอนุมัติแล้ว</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCompetitions.map(competition => (
            <div
              key={competition.id}
              className={`bg-white rounded-lg shadow-sm border p-6 ${
                scheduleData[competition.id]?.is_published ? 'border-green-300 bg-green-50/30' : ''
              }`}
            >
              {/* Competition Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">{competition.name}</h3>
                    {scheduleData[competition.id]?.is_published && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        เผยแพร่แล้ว
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {competition.category?.name || '-'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {competition.approved_count || 0} ทีมอนุมัติ
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {competition.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(competition.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      scheduleData[competition.id]?.is_published
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {scheduleData[competition.id]?.is_published ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        ยกเลิกเผยแพร่
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        เผยแพร่
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Schedule Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* สถานที่ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    สถานที่แข่งขัน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น โรงเรียนวัดดอนตูม"
                    value={scheduleData[competition.id]?.venue || ''}
                    onChange={(e) => handleInputChange(competition.id, 'venue', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ห้อง/อาคาร */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    ห้อง/อาคาร
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ห้องประชุม 1"
                    value={scheduleData[competition.id]?.room || ''}
                    onChange={(e) => handleInputChange(competition.id, 'room', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* วันที่แข่งขัน */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    วันที่แข่งขัน
                  </label>
                  <input
                    type="date"
                    value={scheduleData[competition.id]?.competition_date || ''}
                    onChange={(e) => handleInputChange(competition.id, 'competition_date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* เวลาเริ่ม */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
                    เวลาเริ่ม
                  </label>
                  <input
                    type="time"
                    value={scheduleData[competition.id]?.start_time || ''}
                    onChange={(e) => handleInputChange(competition.id, 'start_time', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* เวลาจบ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
                    เวลาจบ
                  </label>
                  <input
                    type="time"
                    value={scheduleData[competition.id]?.end_time || ''}
                    onChange={(e) => handleInputChange(competition.id, 'end_time', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* หมายเหตุ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={scheduleData[competition.id]?.notes || ''}
                    onChange={(e) => handleInputChange(competition.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave(competition.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  บันทึก
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600 text-center">
        แสดง {filteredCompetitions.length} กิจกรรม
        {filteredCompetitions.filter(c => scheduleData[c.id]?.is_published).length > 0 && (
          <span className="ml-2 text-green-600">
            (เผยแพร่แล้ว {filteredCompetitions.filter(c => scheduleData[c.id]?.is_published).length} รายการ)
          </span>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;
