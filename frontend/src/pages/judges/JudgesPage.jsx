import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function JudgesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState(null);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);
  const [hasRegistrations, setHasRegistrations] = useState(false);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch competition data
      const compResponse = await api.get(`/competitions/${id}`);
      const compData = compResponse.data.data || compResponse.data;
      setCompetition(compData);
      
      // Check registrations count
      const regCount = compData.participants_count || 0;
      setRegistrationsCount(regCount);
      setHasRegistrations(regCount > 0);
      
      // Fetch judges if has registrations
      if (regCount > 0) {
        await fetchJudges();
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchJudges = async () => {
    try {
      const response = await api.get(`/competitions/${id}/judges`);
      const data = response.data;
      
      if (data.success) {
        setJudges(data.judges || []);
        setHasRegistrations(data.has_registrations);
        setRegistrationsCount(data.registrations_count || 0);
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast.error('ไม่สามารถโหลดข้อมูลกรรมการได้');
    }
  };

  const handleAddJudge = async (judgeData) => {
    try {
      const response = await api.post(`/competitions/${id}/judges`, judgeData);
      
      if (response.data.success) {
        toast.success('เพิ่มกรรมการสำเร็จ');
        setShowAddModal(false);
        await fetchJudges();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถเพิ่มกรรมการได้';
      toast.error(message);
    }
  };

  const handleEditJudge = async (judgeData) => {
    try {
      const response = await api.put(`/competitions/${id}/judges/${editingJudge.id}`, judgeData);
      
      if (response.data.success) {
        toast.success('แก้ไขข้อมูลกรรมการสำเร็จ');
        setShowEditModal(false);
        setEditingJudge(null);
        await fetchJudges();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถแก้ไขข้อมูลได้';
      toast.error(message);
    }
  };

  const handleDeleteJudge = (judge) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: `คุณต้องการลบกรรมการ "${judge.name}" หรือไม่?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await api.delete(`/competitions/${id}/judges/${judge.id}`);

          if (response.data.success) {
            toast.success('ลบกรรมการสำเร็จ');
            await fetchJudges();
          }
        } catch (error) {
          const message = error.response?.data?.message || 'ไม่สามารถลบกรรมการได้';
          toast.error(message);
        }
      },
    });
  };

  const openEditModal = (judge) => {
    setEditingJudge(judge);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  if (!competition) return null;

  const minJudges = competition.min_judges || 3;
  const maxJudges = competition.max_judges || 3;
  const currentCount = judges.length;
  const isComplete = currentCount >= minJudges;
  const isFull = currentCount >= maxJudges;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/competitions/${id}`)}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">กรรมการตัดสิน</h1>
            <p className="text-gray-600 mt-1">{competition.name}</p>
          </div>
        </div>
      </div>

      {/* No Registrations Warning */}
      {!hasRegistrations && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                ยังไม่สามารถเพิ่มกรรมการได้
              </h3>
              <p className="text-yellow-800 mb-4">
                การแข่งขันนี้ยังไม่มีทีมลงทะเบียน กรุณารอให้มีทีมลงทะเบียนและได้รับการอนุมัติก่อน
              </p>
              <Link
                to={`/competitions/${id}`}
                className="btn btn-outline text-sm"
              >
                กลับไปหน้ารายละเอียด
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {hasRegistrations && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Teams Registered */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">ทีมที่ลงทะเบียน</p>
            <p className="text-2xl font-bold text-gray-900">{registrationsCount}</p>
            <p className="text-xs text-gray-500 mt-1">ทีม</p>
          </div>

          {/* Required Judges */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">จำนวนที่ต้องการ</p>
            <p className="text-2xl font-bold text-gray-900">
              {minJudges === maxJudges ? minJudges : `${minJudges}-${maxJudges}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">คน</p>
          </div>

          {/* Current Judges */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">กรรมการที่เพิ่มแล้ว</p>
            <p className="text-2xl font-bold text-blue-600">{currentCount}</p>
            <p className="text-xs text-gray-500 mt-1">/ {maxJudges} คน</p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">สถานะ</p>
            {isComplete ? (
              <div className="flex items-center text-green-600 mt-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-semibold">ครบแล้ว</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600 mt-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-semibold">ยังขาดอีก {minJudges - currentCount} คน</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Judge Button */}
      {hasRegistrations && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isFull}
            className={`btn ${isFull ? 'btn-gray cursor-not-allowed' : 'btn-primary'}`}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            {isFull ? 'กรรมการครบแล้ว' : 'เพิ่มกรรมการ'}
          </button>
          {isFull && (
            <p className="text-sm text-gray-500 mt-2">
              ครบจำนวนกรรมการสูงสุดแล้ว ({maxJudges} คน)
            </p>
          )}
        </div>
      )}

      {/* Judges List */}
      {hasRegistrations && judges.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    โรงเรียน/หน่วยงาน
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {judges.map((judge, index) => (
                  <tr key={judge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{judge.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {judge.school_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(judge)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteJudge(judge)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasRegistrations && judges.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีกรรมการ</h3>
          <p className="text-gray-600 mb-6">เริ่มต้นโดยเพิ่มกรรมการคนแรก</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            เพิ่มกรรมการ
          </button>
        </div>
      )}

      {/* Add Judge Modal */}
      {showAddModal && (
        <JudgeModal
          title="เพิ่มกรรมการ"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddJudge}
        />
      )}

      {/* Edit Judge Modal */}
      {showEditModal && editingJudge && (
        <JudgeModal
          title="แก้ไขข้อมูลกรรมการ"
          judge={editingJudge}
          onClose={() => {
            setShowEditModal(false);
            setEditingJudge(null);
          }}
          onSubmit={handleEditJudge}
        />
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
}

// Judge Modal Component
function JudgeModal({ title, judge = null, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: judge?.name || '',
    school_name: judge?.school_name || ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อ-นามสกุล';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="นายสมชาย ใจดี"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* School Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                โรงเรียน/หน่วยงาน
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                className="input"
                placeholder="โรงเรียนวัดใหญ่"
              />
              <p className="text-gray-500 text-xs mt-1">ไม่บังคับ</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก...' : judge ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
