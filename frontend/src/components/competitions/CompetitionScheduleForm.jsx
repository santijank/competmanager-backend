import { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * CompetitionScheduleForm - ฟอร์มกำหนดวันแข่งขัน (Group Admin)
 * 
 * Props:
 * - competition: ข้อมูลการแข่งขัน
 * - participantsCount: จำนวนผู้เข้าแข่งขัน
 * - onSubmit: Callback เมื่อบันทึก
 * - onCancel: Callback เมื่อยกเลิก
 * - loading: สถานะกำลังบันทึก
 */
const CompetitionScheduleForm = ({
  competition,
  participantsCount = 0,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    competition_date: '',
    competition_start_time: '09:00',
    competition_end_time: '12:00',
    venue: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.competition_date) {
      newErrors.competition_date = 'กรุณาเลือกวันแข่งขัน';
    } else {
      // Check if date is after registration end date
      const competitionDate = new Date(formData.competition_date);
      const registrationEndDate = new Date(competition?.registration_end_date);
      
      if (competitionDate <= registrationEndDate) {
        newErrors.competition_date = 'วันแข่งขันต้องมาหลังวันปิดรับสมัคร';
      }
    }

    if (!formData.venue) {
      newErrors.venue = 'กรุณาระบุสถานที่แข่งขัน';
    }

    if (formData.competition_start_time && formData.competition_end_time) {
      if (formData.competition_start_time >= formData.competition_end_time) {
        newErrors.competition_end_time = 'เวลาสิ้นสุดต้องมาหลังเวลาเริ่ม';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Calculate duration
  const calculateDuration = () => {
    if (!formData.competition_start_time || !formData.competition_end_time) return null;
    
    const start = new Date(`2000-01-01 ${formData.competition_start_time}`);
    const end = new Date(`2000-01-01 ${formData.competition_end_time}`);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs} ชั่วโมง ${diffMins} นาที`;
  };

  const duration = calculateDuration();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              กำหนดวันแข่งขัน
            </h3>
            <p className="text-sm text-gray-600">
              {competition?.name}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>ปิดรับสมัคร: {competition?.registration_end_date}</span>
              <span className="text-green-600 font-medium">
                👥 ผู้เข้าแข่งขัน: {participantsCount} คน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Competition Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-2" />
            วันที่แข่งขัน <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.competition_date}
            onChange={(e) => handleChange('competition_date', e.target.value)}
            min={competition?.registration_end_date}
            disabled={loading}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.competition_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.competition_date && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.competition_date}
            </p>
          )}
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              เวลาเริ่ม
            </label>
            <input
              type="time"
              value={formData.competition_start_time}
              onChange={(e) => handleChange('competition_start_time', e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              เวลาสิ้นสุด
            </label>
            <input
              type="time"
              value={formData.competition_end_time}
              onChange={(e) => handleChange('competition_end_time', e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.competition_end_time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.competition_end_time && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.competition_end_time}
              </p>
            )}
          </div>
        </div>

        {/* Duration Display */}
        {duration && !errors.competition_end_time && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-sm text-blue-700">
              <Clock className="h-4 w-4 mr-2" />
              <span className="font-medium">ระยะเวลาแข่งขัน:</span>
              <span className="ml-2">{duration}</span>
            </div>
          </div>
        )}

        {/* Venue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-2" />
            สถานที่แข่งขัน <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            placeholder="เช่น โรงเรียนวัดใหญ่, หอประชุม, สนามกีฬา"
            disabled={loading}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.venue ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.venue && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.venue}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-2" />
            หมายเหตุ
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows="3"
            placeholder="เช่น โปรดมาก่อนเวลา 30 นาที, นำอุปกรณ์..."
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            ข้อความนี้จะถูกส่งให้ผู้เข้าแข่งขันทราบ
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ หลังกำหนดวันแข่งขันแล้ว
              </p>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>ระบบจะส่งแจ้งเตือนไปยังผู้เข้าแข่งขัน {participantsCount} คนทางอีเมลและ SMS (ถ้ามี)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>ครูและนักเรียนจะเห็นข้อมูลวันแข่งขันในระบบทันที</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>สามารถแก้ไขวันแข่งขันได้ในภายหลัง</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.competition_date && formData.venue && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-2">
                  📋 ตัวอย่างข้อความที่จะส่ง
                </p>
                <div className="text-xs text-green-800 bg-white rounded p-3 border border-green-200">
                  <p className="font-medium mb-2">แจ้งวันแข่งขัน: {competition?.name}</p>
                  <p>📅 วันที่: {new Date(formData.competition_date).toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  {formData.competition_start_time && (
                    <p>⏰ เวลา: {formData.competition_start_time} - {formData.competition_end_time} น.</p>
                  )}
                  <p>📍 สถานที่: {formData.venue}</p>
                  {formData.notes && (
                    <p className="mt-2 border-t border-green-300 pt-2">
                      📝 หมายเหตุ: {formData.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Actions */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ยกเลิก
        </button>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              ✓ บันทึกวันแข่งขัน
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CompetitionScheduleForm;
