import React, { useState } from 'react';
import { X, User, School } from 'lucide-react';

/**
 * AddJudgeModal Component
 * 
 * Form เพิ่มกรรมการใหม่
 * - ชื่อ-นามสกุล (required)
 * - โรงเรียน/หน่วยงาน (optional)
 */
export default function AddJudgeModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    school_name: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', school_name: '' });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อ-นามสกุลกรรมการ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        name: formData.name.trim(),
        school_name: formData.school_name.trim() || null
      });
      
      // Modal will close via parent component
    } catch (error) {
      // Error handled by parent
      console.error('Error in AddJudgeModal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            เพิ่มกรรมการตัดสิน
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ชื่อ-นามสกุล */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="เช่น นายสมชาย ใจดี"
                autoFocus
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* โรงเรียน/หน่วยงาน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              โรงเรียน/หน่วยงาน
            </label>
            <div className="relative">
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น โรงเรียนวัดใหญ่ หรือ สพท.นครปฐม เขต 1"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              สามารถระบุโรงเรียน มหาวิทยาลัย หรือหน่วยงานที่สังกัด
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
