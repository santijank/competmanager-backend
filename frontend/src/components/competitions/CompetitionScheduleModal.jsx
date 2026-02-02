import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Save } from 'lucide-react';

/**
 * 📅 Competition Schedule Modal
 * 
 * Modal สำหรับกำหนดวัน/เวลา/สถานที่แข่งขัน
 */
const CompetitionScheduleModal = ({ competition, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    competition_date: '',
    competition_start_time: '',
    competition_end_time: '',
    venue: '',
    group_registration_start: '',
    group_registration_end: '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing data
  useEffect(() => {
    if (competition) {
      setFormData({
        competition_date: competition.competition_date || '',
        competition_start_time: competition.competition_start_time?.substring(0, 5) || '',
        competition_end_time: competition.competition_end_time?.substring(0, 5) || '',
        venue: competition.venue || '',
        group_registration_start: competition.group_registration_start || '',
        group_registration_end: competition.group_registration_end || '',
      });
    }
  }, [competition]);

  /**
   * Handle form change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.competition_date) {
      newErrors.competition_date = 'กรุณาเลือกวันแข่งขัน';
    }

    if (!formData.competition_start_time) {
      newErrors.competition_start_time = 'กรุณาเลือกเวลาเริ่ม';
    }

    if (!formData.competition_end_time) {
      newErrors.competition_end_time = 'กรุณาเลือกเวลาสิ้นสุด';
    }

    if (formData.competition_start_time && formData.competition_end_time) {
      if (formData.competition_end_time <= formData.competition_start_time) {
        newErrors.competition_end_time = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
      }
    }

    // Registration dates (optional but must be valid if provided)
    if (formData.group_registration_start && formData.group_registration_end) {
      if (formData.group_registration_end < formData.group_registration_start) {
        newErrors.group_registration_end = 'วันปิดรับสมัครต้องมาหลังวันเปิดรับสมัคร';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Save schedule error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                กำหนดวัน/เวลาแข่งขัน
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {competition?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Competition Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                วันและเวลาแข่งขัน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันแข่งขัน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="competition_date"
                    value={formData.competition_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.competition_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.competition_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.competition_date}</p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาเริ่ม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="competition_start_time"
                    value={formData.competition_start_time}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.competition_start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.competition_start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.competition_start_time}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาสิ้นสุด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="competition_end_time"
                    value={formData.competition_end_time}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.competition_end_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.competition_end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.competition_end_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                สถานที่แข่งขัน
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="เช่น ห้องประชุม อาคาร 1 ชั้น 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Registration Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                ช่วงรับสมัคร (ไม่บังคับ)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เปิดรับสมัคร
                  </label>
                  <input
                    type="date"
                    name="group_registration_start"
                    value={formData.group_registration_start}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Registration End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ปิดรับสมัคร
                  </label>
                  <input
                    type="date"
                    name="group_registration_end"
                    value={formData.group_registration_end}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.group_registration_end ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.group_registration_end && (
                    <p className="mt-1 text-sm text-red-600">{errors.group_registration_end}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600">
                💡 หากไม่ระบุ ระบบจะตั้งค่าวันรับสมัครอัตโนมัติเมื่อเปิดรับสมัคร
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompetitionScheduleModal;
