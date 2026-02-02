import { Calendar, AlertCircle } from 'lucide-react';

/**
 * RegistrationPeriodForm - ฟอร์มกำหนดช่วงเวลารับสมัคร
 * 
 * Props:
 * - startDate: วันเปิดรับสมัคร
 * - endDate: วันปิดรับสมัคร
 * - onStartDateChange: Callback เมื่อเปลี่ยนวันเปิดรับสมัคร
 * - onEndDateChange: Callback เมื่อเปลี่ยนวันปิดรับสมัคร
 * - disabled: ปิดการใช้งาน
 * - errors: Object ของ error messages
 */
const RegistrationPeriodForm = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  errors = {}
}) => {
  
  // คำนวณจำนวนวันรับสมัคร
  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // +1 เพราะนับวันแรกด้วย
  };

  const days = calculateDays();

  // Validate dates
  const isEndBeforeStart = startDate && endDate && new Date(endDate) < new Date(startDate);
  const isStartInPast = startDate && new Date(startDate) < new Date().setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-500" />
          ช่วงเวลารับสมัคร
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          กำหนดวันเปิดและปิดรับสมัครการแข่งขัน
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* วันเปิดรับสมัคร */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 วันเปิดรับสมัคร <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            disabled={disabled}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.startDate || isStartInPast
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.startDate}
            </p>
          )}
          {isStartInPast && !errors.startDate && (
            <p className="mt-1 text-sm text-yellow-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              วันที่เลือกเป็นอดีต
            </p>
          )}
        </div>

        {/* วันปิดรับสมัคร */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔒 วันปิดรับสมัคร <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            disabled={disabled}
            min={startDate || new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.endDate || isEndBeforeStart
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.endDate}
            </p>
          )}
          {isEndBeforeStart && !errors.endDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              วันปิดรับสมัครต้องมาหลังวันเปิดรับสมัคร
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      {startDate && endDate && !isEndBeforeStart && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {/* ช่วงเวลา */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-blue-600 font-medium mb-1">
                ช่วงรับสมัคร
              </div>
              <div className="text-sm text-blue-900">
                {new Date(startDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs text-blue-600 my-1">ถึง</div>
              <div className="text-sm text-blue-900">
                {new Date(endDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* จำนวนวัน */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-xs text-green-600 font-medium mb-1">
                ระยะเวลา
              </div>
              <div className="text-3xl font-bold text-green-700">
                {days}
              </div>
              <div className="text-xs text-green-600 mt-1">
                วัน
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">หมายเหตุสำคัญ:</p>
                <ul className="mt-1 space-y-1 text-xs list-disc list-inside">
                  <li>ระบบจะเปิดรับสมัครอัตโนมัติในวันที่กำหนด (00:00:00)</li>
                  <li>ระบบจะปิดรับสมัครอัตโนมัติในวันที่กำหนด (23:59:59)</li>
                  <li>Group Admin จะกำหนดวันแข่งขันหลังจากปิดรับสมัครแล้ว</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!startDate || !endDate) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center py-4 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">กรุณาเลือกวันที่เพื่อดูสรุป</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPeriodForm;
