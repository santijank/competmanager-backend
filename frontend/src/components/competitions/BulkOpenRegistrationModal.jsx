import { useState, useEffect } from 'react';
import { X, Calendar, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import ConfirmModal from '@/components/common/ConfirmModal';

/**
 * 🎯 Bulk Open Registration Modal
 * 
 * Modal สำหรับเปิดรับสมัครแบบ Bulk (ทั้งหมดหรือตามหมวดหมู่)
 */
const BulkOpenRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    registration_start_date: '',
    registration_end_date: '',
    category_id: '', // ถ้าเป็นค่าว่าง = เปิดทั้งหมด
  });

  // Load categories
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      // ตั้งค่าเริ่มต้น: วันพรุ่งนี้ - 7 วันถัดไป
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);

      setFormData({
        registration_start_date: tomorrow.toISOString().split('T')[0],
        registration_end_date: nextWeek.toISOString().split('T')[0],
        category_id: '',
      });
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      
      // ✅ แก้ไข: รองรับหลาย response structure
      let categoriesData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // กรณี response.data เป็น array โดยตรง
          categoriesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // กรณี response.data.data เป็น array
          categoriesData = response.data.data;
        } else if (response.data.categories && Array.isArray(response.data.categories)) {
          // กรณี response.data.categories เป็น array
          categoriesData = response.data.categories;
        }
      }
      
      setCategories(categoriesData);
      console.log('Loaded categories:', categoriesData); // Debug
    } catch (error) {
      console.error('Load categories error:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
      setCategories([]); // ตั้งเป็น empty array เพื่อป้องกัน error
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.registration_start_date || !formData.registration_end_date) {
      toast.error('กรุณากรอกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }

    const startDate = new Date(formData.registration_start_date);
    const endDate = new Date(formData.registration_end_date);

    if (endDate <= startDate) {
      toast.error('วันสิ้นสุดต้องมากกว่าวันเริ่มต้น');
      return;
    }

    // Confirm
    const categoryText = formData.category_id
      ? categories.find(c => c.id == formData.category_id)?.name
      : 'ทั้งหมด';

    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการเปิดรับสมัคร',
      message: `คุณต้องการเปิดรับสมัครหรือไม่?\n\n` +
        `หมวดหมู่: ${categoryText}\n` +
        `วันเริ่มต้น: ${formatDate(formData.registration_start_date)}\n` +
        `วันสิ้นสุด: ${formatDate(formData.registration_end_date)}`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const payload = {
            registration_start_date: formData.registration_start_date,
            registration_end_date: formData.registration_end_date,
          };

          // เพิ่ม category_id ถ้าเลือก
          if (formData.category_id) {
            payload.category_id = formData.category_id;
          }

          const response = await api.post('/competitions/group/bulk-open-registration', payload);

          toast.success(response.data.message || 'เปิดรับสมัครสำเร็จ');
          onSuccess();
          onClose();
        } catch (error) {
          console.error('Bulk open registration error:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                เปิดรับสมัครแบบ Bulk
              </h3>
              <p className="text-sm text-gray-500">
                เปิดรับสมัครหลายรายการพร้อมกัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">คำแนะนำ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>เลือกหมวดหมู่ หรือเว้นว่างเพื่อเปิดทั้งหมด</li>
                <li>กำหนดวันเริ่มต้นและสิ้นสุดการรับสมัคร</li>
                <li>ระบบจะไม่เปิดรายการที่ปิดไปแล้ว</li>
              </ul>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ (เลือกหรือเว้นว่างเพื่อเปิดทั้งหมด)
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">ทั้งหมด</option>
              {Array.isArray(categories) && categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                กำลังโหลดหมวดหมู่...
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันเริ่มต้นรับสมัคร <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.registration_start_date}
              onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันสิ้นสุดรับสมัคร <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.registration_end_date}
              onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
              min={formData.registration_start_date}
            />
          </div>

          {/* Summary */}
          {formData.registration_start_date && formData.registration_end_date && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">หมวดหมู่:</span>
                <span className="font-medium text-gray-900">
                  {formData.category_id 
                    ? categories.find(c => c.id == formData.category_id)?.name 
                    : 'ทั้งหมด'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">วันเริ่มต้น:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(formData.registration_start_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">วันสิ้นสุด:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(formData.registration_end_date)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเปิดรับสมัคร...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>เปิดรับสมัคร</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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

export default BulkOpenRegistrationModal;
