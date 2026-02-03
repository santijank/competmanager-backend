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
  Edit2
} from 'lucide-react';
import api from '@/lib/api';
import EditRegistrationModal from '@/components/registrations/EditRegistrationModal';

/**
 * 📋 My Registrations
 * 
 * รายการลงทะเบียนของครู
 */
const MyRegistrations = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ State สำหรับ Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCancelRegistration = async (registration) => {
    if (!window.confirm('คุณต้องการยกเลิกการลงทะเบียนนี้หรือไม่?')) {
      return;
    }

    try {
      const response = await api.delete(`/registrations/${registration.id}`);

      if (response.data.success) {
        toast.success('ยกเลิกการลงทะเบียนสำเร็จ');
        loadData();
      }
    } catch (error) {
      console.error('Cancel registration error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // ✅ Handle Edit
  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadData();
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

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statistics.total}
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
                    {statistics.pending}
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
                    {statistics.approved}
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
                    {statistics.rejected}
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
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => {
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
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {registration.competition?.name || '-'}
                        </h3>
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

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {/* ✅ ปุ่มแก้ไข - เฉพาะสถานะ pending หรือ rejected เท่านั้น */}
                        {(registration.status === 'pending' || registration.status === 'rejected') && (
                          <button
                            onClick={() => handleEdit(registration)}
                            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>แก้ไข</span>
                          </button>
                        )}

                        {/* ปุ่มยกเลิก - เฉพาะสถานะ pending */}
                        {registration.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRegistration(registration)}
                            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>ยกเลิก</span>
                          </button>
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
        />
      )}
    </div>
  );
};

export default MyRegistrations;
