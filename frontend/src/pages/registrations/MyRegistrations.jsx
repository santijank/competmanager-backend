import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FileText,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  Edit2,
  Download,
  Building2,
  Globe,
  UserMinus
} from 'lucide-react';
import api from '@/lib/api';
import documentService from '@/services/documentService';
import EditRegistrationModal from '@/components/registrations/EditRegistrationModal';
import ChangeParticipantModal from '@/components/registrations/ChangeParticipantModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import useAuthStore from '@/stores/authStore';

/**
 * 📋 My Registrations
 * 
 * รายการลงทะเบียนของครู
 */
const MyRegistrations = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ State สำหรับ Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  // ✅ State สำหรับ เปลี่ยนตัว Modal
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeRegistration, setChangeRegistration] = useState(null);

  // ✅ State สำหรับ ConfirmModal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // ✅ State สำหรับ PDF Export
  const [exportingPending, setExportingPending] = useState(false);
  const [exportingApproved, setExportingApproved] = useState(false);

  // ✅ State สำหรับช่วงเวลาเปิดแก้ไขรายชื่อ
  const [editNameAllowed, setEditNameAllowed] = useState(false);

  // ✅ State สำหรับเปิด/ปิดเมนูเปลี่ยนตัว
  const [participantChangeEnabled, setParticipantChangeEnabled] = useState(false);

  // ✅ State สำหรับ Tab แยกระดับ (กลุ่ม/เขต)
  const [activeLevel, setActiveLevel] = useState('group');

  // ✅ State สำหรับ Filter สถานะ
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
    fetchEditNameStatus();
    fetchParticipantChangeSetting();
  }, []);

  const fetchEditNameStatus = async () => {
    try {
      const response = await api.get('/system-settings/edit-name');
      setEditNameAllowed(response.data.data?.is_edit_allowed || false);
    } catch (error) {
      console.error('Failed to fetch edit name status:', error);
      setEditNameAllowed(false);
    }
  };

  const fetchParticipantChangeSetting = async () => {
    try {
      const response = await api.get('/system-settings/participant-change');
      setParticipantChangeEnabled(response.data.data?.enable_participant_change || false);
    } catch (error) {
      console.error('Failed to fetch participant change setting:', error);
      setParticipantChangeEnabled(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load registrations
      const regResponse = await api.get('/registrations', {
        params: { paginate: false }
      });
      
      console.log('📥 Registrations Response:', regResponse.data);
      
      // ✅ Handle different response formats
      let regData = [];
      if (regResponse.data.data?.data) {
        regData = regResponse.data.data.data;
      } else if (regResponse.data.data) {
        regData = regResponse.data.data;
      } else if (Array.isArray(regResponse.data)) {
        regData = regResponse.data;
      }

      // ✅ Ensure array
      if (!Array.isArray(regData)) {
        console.error('❌ Registration data is not an array:', regData);
        regData = [];
      }

      // ✅ Parse student_names if it's a string
      const parsedData = regData.map(reg => ({
        ...reg,
        student_names: parseStudentNames(reg.student_names)
      }));

      console.log('✅ Registrations loaded:', parsedData.length);
      setRegistrations(parsedData);

      // Load statistics
      const statsResponse = await api.get('/registrations/statistics');
      setStatistics(statsResponse.data.data);

    } catch (error) {
      console.error('❌ Load data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Parse student_names - รองรับทุกรูปแบบ
   */
  const parseStudentNames = (studentNames) => {
    // Already an array
    if (Array.isArray(studentNames)) {
      return studentNames;
    }

    // String JSON
    if (typeof studentNames === 'string') {
      try {
        const parsed = JSON.parse(studentNames);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('⚠️ Failed to parse student_names:', studentNames);
        return [];
      }
    }

    // Null or undefined
    return [];
  };

  const handleCancelRegistration = (registration) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการยกเลิก',
      message: `คุณต้องการยกเลิกการลงทะเบียน "${registration.competition?.name}" หรือไม่?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await api.delete(`/registrations/${registration.id}`);
          if (response.data.success) {
            toast.success('ยกเลิกการลงทะเบียนสำเร็จ');
            loadData();
          } else {
            toast.error(response.data.message || 'ไม่สามารถยกเลิกได้');
          }
        } catch (error) {
          console.error('Cancel registration error:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก');
        }
      },
    });
  };

  // ✅ Handle Edit
  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadData();
  };

  // ✅ Export PDF handlers
  const handleExportPending = async () => {
    try {
      setExportingPending(true);
      await documentService.downloadSchoolRegistrations('pending');
      toast.success('ดาวน์โหลดเอกสารสำเร็จ');
    } catch (error) {
      console.error('Export pending error:', error);
      toast.error('ไม่สามารถสร้างเอกสารได้');
    } finally {
      setExportingPending(false);
    }
  };

  const handleExportApproved = async () => {
    try {
      setExportingApproved(true);
      await documentService.downloadSchoolRegistrations('approved');
      toast.success('ดาวน์โหลดเอกสารสำเร็จ');
    } catch (error) {
      console.error('Export approved error:', error);
      toast.error('ไม่สามารถสร้างเอกสารได้');
    } finally {
      setExportingApproved(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
        text: 'รอการอนุมัติ'
      },
      approved: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'อนุมัติแล้ว'
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4" />,
        text: 'ไม่อนุมัติ'
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-4 h-4" />,
        text: 'ยกเลิกแล้ว'
      }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 ${badge.color} text-sm font-medium rounded-full`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLevelBadge = (level) => {
    if (level === 'district') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          <Globe className="w-3 h-3" />
          <span>ระดับเขต</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
        <Building2 className="w-3 h-3" />
        <span>ระดับกลุ่ม</span>
      </span>
    );
  };

  // ✅ Filter registrations ตาม activeLevel + statusFilter
  const filteredRegistrations = registrations.filter(reg => {
    const level = reg.competition?.competition_level || 'group';
    if (level !== activeLevel) return false;
    if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
    return true;
  });

  // ✅ คำนวณ statistics ตาม activeLevel
  const filteredStats = (() => {
    if (!registrations.length) return null;
    const filtered = registrations.filter(
      reg => (reg.competition?.competition_level || 'group') === activeLevel
    );
    return {
      total: filtered.length,
      pending: filtered.filter(r => r.status === 'pending').length,
      approved: filtered.filter(r => r.status === 'approved').length,
      rejected: filtered.filter(r => r.status === 'rejected').length,
    };
  })();

  // ✅ นับจำนวนต่อ level สำหรับแสดงบน tab
  const groupCount = registrations.filter(r => (r.competition?.competition_level || 'group') === 'group').length;
  const districtCount = registrations.filter(r => (r.competition?.competition_level || 'group') === 'district').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                การลงทะเบียนของฉัน
              </h1>
              <p className="text-gray-600 mt-2">
                รายการลงทะเบียนการแข่งขันทั้งหมด
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportPending}
                disabled={exportingPending || !statistics?.pending}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>ออกเอกสารที่รออนุมัติ</span>
              </button>

              <button
                onClick={handleExportApproved}
                disabled={exportingApproved || !statistics?.approved}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingApproved ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>ออกเอกสารที่อนุมัติแล้ว</span>
              </button>

              <button
                onClick={() => navigate('/registrations/browse')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>ลงทะเบียนใหม่</span>
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Level Tabs - ปุ่มใหญ่ สีชัดเจน */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setActiveLevel('group'); setStatusFilter('all'); }}
            className={`flex items-center justify-center space-x-3 px-6 py-5 rounded-xl text-lg font-bold transition-all border-3 ${
              activeLevel === 'group'
                ? 'bg-purple-700 text-white border-purple-700 shadow-xl shadow-purple-300 ring-2 ring-purple-400 ring-offset-2'
                : 'bg-purple-100 text-purple-800 border-purple-400 hover:bg-purple-200'
            }`}
          >
            <Building2 className="w-6 h-6" />
            <span>ระดับกลุ่ม</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              activeLevel === 'group' ? 'bg-white text-purple-700' : 'bg-purple-300 text-purple-900'
            }`}>
              {groupCount}
            </span>
          </button>
          <button
            onClick={() => { setActiveLevel('district'); setStatusFilter('all'); }}
            className={`flex items-center justify-center space-x-3 px-6 py-5 rounded-xl text-lg font-bold transition-all border-3 ${
              activeLevel === 'district'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xl shadow-blue-300 ring-2 ring-blue-400 ring-offset-2'
                : 'bg-blue-100 text-blue-800 border-blue-400 hover:bg-blue-200'
            }`}
          >
            <Globe className="w-6 h-6" />
            <span>ระดับเขตพื้นที่</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              activeLevel === 'district' ? 'bg-white text-blue-700' : 'bg-blue-300 text-blue-900'
            }`}>
              {districtCount}
            </span>
          </button>
        </div>

        {/* ✅ Status Filter - ปุ่มสีชัดเจน */}
        {filteredStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ทั้งหมด</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'all' ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-700'
              }`}>{filteredStats.total}</span>
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200'
                  : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>ตัวแทน</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'approved' ? 'bg-white text-green-700' : 'bg-green-100 text-green-700'
              }`}>{filteredStats.approved}</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>รออนุมัติ</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'pending' ? 'bg-white text-yellow-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{filteredStats.pending}</span>
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200'
                  : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>ไม่อนุมัติ</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'rejected' ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
              }`}>{filteredStats.rejected}</span>
            </button>
          </div>
        )}

        {/* Statistics (ตาม level ที่เลือก) */}
        {filteredStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {filteredStats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">รอการอนุมัติ</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {filteredStats.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {filteredStats.approved}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ไม่อนุมัติ</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {filteredStats.rejected}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registrations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ยังไม่มีการลงทะเบียน
            </h3>
            <p className="text-gray-600 mb-6">
              คุณยังไม่ได้ลงทะเบียนการแข่งขันใดๆ
            </p>
            <button
              onClick={() => navigate('/registrations/browse')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>ลงทะเบียนเลย</span>
            </button>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter === 'approved'
                ? `ไม่มีตัวแทน${activeLevel === 'group' ? 'ระดับกลุ่ม' : 'ระดับเขต'}`
                : `ไม่มีรายการ${activeLevel === 'group' ? 'ระดับกลุ่ม' : 'ระดับเขต'}`
              }
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'approved'
                ? `ยังไม่มีรายการที่ได้รับอนุมัติเป็นตัวแทน${activeLevel === 'group' ? 'ระดับกลุ่ม' : 'ระดับเขต'}`
                : statusFilter === 'pending'
                  ? 'ไม่มีรายการที่รอการอนุมัติ'
                  : statusFilter === 'rejected'
                    ? 'ไม่มีรายการที่ไม่อนุมัติ'
                    : `ยังไม่มีการลงทะเบียน${activeLevel === 'group' ? 'ระดับกลุ่ม' : 'ระดับเขต'}`
              }
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                ดูทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => {
              // ✅ Safely get student_names as array
              const students = Array.isArray(registration.student_names) 
                ? registration.student_names 
                : [];

              return (
                <div
                  key={registration.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {registration.competition?.name || '-'}
                        </h3>
                        {getLevelBadge(registration.competition?.competition_level)}
                        {getStatusBadge(registration.status)}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          หมวดหมู่: {registration.competition?.category?.name || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          ชื่อทีม: {registration.team_name || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          โรงเรียน: {registration.school?.name || '-'}
                        </p>
                      </div>
                    </div>

                    {/* ✅ ปุ่มแก้ไข - สถานะ pending */}
                    {registration.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(registration)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(registration)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>ยกเลิก</span>
                        </button>
                      </div>
                    )}

                    {/* ✅ ปุ่มแก้ไขตัวสะกด - สถานะ approved + ช่วงเวลาเปิดแก้ไข */}
                    {registration.status === 'approved' && (
                      <div className="flex items-center space-x-2 ml-4">
                        {/* ปุ่มเปลี่ยนตัว - เฉพาะระดับเขต + เปิดใช้งาน */}
                        {participantChangeEnabled && registration.competition?.competition_level === 'district' && (
                          <button
                            onClick={() => {
                              setChangeRegistration(registration);
                              setShowChangeModal(true);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>เปลี่ยนตัว</span>
                            {registration.max_changes_allowed > 0 && (
                              <span className="px-1.5 py-0.5 bg-orange-800 text-white text-xs rounded-full">
                                {registration.change_count || 0}/{registration.max_changes_allowed}
                              </span>
                            )}
                          </button>
                        )}
                        {/* ปุ่มแก้ไขตัวสะกด */}
                        {editNameAllowed && (
                          <button
                            onClick={() => handleEdit(registration)}
                            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>แก้ไขตัวสะกด</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Students */}
                  {students.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        รายชื่อนักเรียน:
                      </h4>
                      <div className="space-y-1">
                        {students.map((student, index) => {
                          // รองรับทั้ง string และ object
                          const studentName = typeof student === 'string'
                            ? student
                            : (student?.name || '-');
                          const studentId = typeof student === 'object' ? student?.student_id : null;

                          return (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>
                                {index + 1}. {studentName}
                                {studentId && ` (${studentId})`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>ลงทะเบียนเมื่อ: {formatDate(registration.registration_date || registration.created_at)}</span>
                        </div>
                        
                        {registration.approved_at && (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span>อนุมัติเมื่อ: {formatDate(registration.approved_at)}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {registration.status === 'rejected' && registration.rejection_reason && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          เหตุผลที่ไม่อนุมัติ:
                        </p>
                        <p className="text-sm text-red-700">
                          {registration.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ Edit Registration Modal */}
      {showEditModal && (
        <EditRegistrationModal
          isOpen={showEditModal}
          registration={selectedRegistration}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRegistration(null);
          }}
          onSuccess={handleEditSuccess}
          userRole={user?.role}
        />
      )}

      {/* ✅ Change Participant Modal */}
      {showChangeModal && (
        <ChangeParticipantModal
          isOpen={showChangeModal}
          registration={changeRegistration}
          onClose={() => {
            setShowChangeModal(false);
            setChangeRegistration(null);
          }}
          onSuccess={() => loadData()}
        />
      )}

      {/* Confirm Modal */}
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

export default MyRegistrations;
