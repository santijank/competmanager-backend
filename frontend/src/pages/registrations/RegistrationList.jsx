// ไฟล์: frontend/src/pages/registrations/RegistrationList.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RegistrationExportButtons from '@/components/registrations/RegistrationExportButtons';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  List,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import apiClient from '@/lib/api/axios-interceptor';
import useAuthStore from '@/stores/authStore';

/**
 * 📋 Registration List Page
 * 
 * แสดงรายการลงทะเบียนทั้งหมด
 * พร้อม filter และ search
 */
const RegistrationList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isGroupAdmin, isSchoolAdmin } = useAuthStore();

  const [registrations, setRegistrations] = useState([]); // ✅ Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    competition_id: searchParams.get('competition_id') || '', // ✅ เพิ่ม competition filter
  });

  /**
   * โหลดข้อมูล
   */
  useEffect(() => {
    loadRegistrations();
  }, [filters.competition_id]); // ✅ Reload when competition changes

  /**
   * โหลดรายการลงทะเบียน
   */
  const loadRegistrations = async () => {
    try {
      setLoading(true);
      
      // ✅ Build query params
      const params = new URLSearchParams();
      if (filters.competition_id) {
        params.append('competition_id', filters.competition_id);
      }
      
      const response = await apiClient.get(`/registrations?${params.toString()}`);
      
      console.log('📥 Registration Response:', response.data);

      // ✅ Handle different response formats
      let data = [];
      
      if (response.data.data) {
        // Format: { data: [...] }
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        data = response.data;
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
      }

      // ✅ Ensure data is array
      if (!Array.isArray(data)) {
        console.error('❌ Data is not an array:', data);
        data = [];
      }

      console.log('✅ Registrations loaded:', data.length);
      setRegistrations(data);

    } catch (error) {
      console.error('❌ Error loading registrations:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการลงทะเบียนได้');
      setRegistrations([]); // ✅ Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete registration
   */
  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: 'ยืนยันการลบการลงทะเบียนนี้?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/registrations/${id}`);
          toast.success('ลบการลงทะเบียนสำเร็จ');
          loadRegistrations();
        } catch (error) {
          console.error('Error deleting registration:', error);
          toast.error('ไม่สามารถลบการลงทะเบียนได้');
        }
      },
    });
  };

  /**
   * Filter registrations
   */
  const filteredRegistrations = registrations.filter((reg) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchTeam = reg.team_name?.toLowerCase().includes(searchLower);
      const matchSchool = reg.school?.name?.toLowerCase().includes(searchLower);
      const matchCompetition = reg.competition?.name?.toLowerCase().includes(searchLower);
      
      if (!matchTeam && !matchSchool && !matchCompetition) return false;
    }

    // Status filter
    if (filters.status !== 'all' && reg.status !== filters.status) {
      return false;
    }

    return true;
  });

  /**
   * Get status badge
   */
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'yellow', 
        text: 'รอดำเนินการ', 
        icon: Clock 
      },
      approved: { 
        color: 'green', 
        text: 'อนุมัติ', 
        icon: CheckCircle 
      },
      rejected: { 
        color: 'red', 
        text: 'ปฏิเสธ', 
        icon: XCircle 
      },
      cancelled: { 
        color: 'gray', 
        text: 'ยกเลิก', 
        icon: XCircle 
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <List className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">รายการลงทะเบียน</h1>
            </div>
            <p className="text-gray-600">จัดการการลงทะเบียนเข้าร่วมการแข่งขัน</p>
          </div>

          {isSchoolAdmin() && (
            <button
              onClick={() => navigate('/registrations/browse')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              ลงทะเบียนใหม่
            </button>
          )}
        </div>
      </div>

      {/* ✅✅✅ Export Buttons - เพิ่มส่วนนี้ ✅✅✅ */}
      {filters.competition_id && !loading && filteredRegistrations.length > 0 && (
        <div className="mb-6">
          <RegistrationExportButtons 
            competitionId={filters.competition_id}
            registrationsCount={filteredRegistrations.length}
            currentStatus={filters.status}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาทีม, โรงเรียน, การแข่งขัน..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <List className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการลงทะเบียน</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.status !== 'all'
              ? 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา'
              : 'ยังไม่มีการลงทะเบียน'}
          </p>
          {isSchoolAdmin() && (
            <button
              onClick={() => navigate('/registrations/browse')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              ลงทะเบียนใหม่
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การแข่งขัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ทีม / โรงเรียน
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่ลงทะเบียน
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    {/* Competition */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {registration.competition?.name || '-'}
                        </div>
                        <div className="text-gray-500">
                          {registration.competition?.category?.name || '-'}
                        </div>
                      </div>
                    </td>

                    {/* Team / School */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {registration.team_name || '-'}
                        </div>
                        <div className="text-gray-500">
                          {registration.school?.name || '-'}
                        </div>
                        {registration.student_count > 0 && (
                          <div className="flex items-center gap-1 text-gray-500 mt-1">
                            <Users className="h-3 w-3" />
                            {registration.student_count} คน
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(registration.registration_date || registration.created_at)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(registration.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/registrations/${registration.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit (if allowed) */}
                        {registration.status === 'pending' && (
                          <button
                            onClick={() => navigate(`/registrations/${registration.id}/edit`)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete (if allowed) */}
                        {(isGroupAdmin() || (isSchoolAdmin() && registration.status === 'pending')) && (
                          <button
                            onClick={() => handleDelete(registration.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && filteredRegistrations.length > 0 && (
        <div className="mt-6 text-sm text-gray-600 text-center">
          แสดง {filteredRegistrations.length} รายการ
          {filters.search || filters.status !== 'all'
            ? ` จากทั้งหมด ${registrations.length} รายการ`
            : ''}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default RegistrationList;
