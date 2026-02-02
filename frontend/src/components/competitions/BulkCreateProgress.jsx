import { CheckCircle, Loader, AlertCircle, Trophy, ArrowRight } from 'lucide-react';

/**
 * BulkCreateProgress - แสดง progress และผลลัพธ์การสร้าง Master Competition
 * 
 * Props:
 * - status: 'creating' | 'success' | 'error'
 * - progress: 0-100
 * - created: จำนวนที่สร้างสำเร็จ
 * - total: จำนวนทั้งหมด
 * - errors: Array of error messages
 * - onViewCompetitions: Callback เมื่อกดดูรายการ
 * - onCreateMore: Callback เมื่อกดสร้างเพิ่ม
 */
const BulkCreateProgress = ({
  status = 'creating',
  progress = 0,
  created = 0,
  total = 0,
  errors = [],
  onViewCompetitions,
  onCreateMore
}) => {

  const percentage = total > 0 ? Math.round((created / total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`p-6 border-b border-gray-200 ${
        status === 'creating' ? 'bg-blue-50' :
        status === 'success' ? 'bg-green-50' :
        'bg-red-50'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              status === 'creating' ? 'bg-blue-100' :
              status === 'success' ? 'bg-green-100' :
              'bg-red-100'
            }`}>
              {status === 'creating' && (
                <Loader className="h-6 w-6 text-blue-600 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className={`text-xl font-bold ${
              status === 'creating' ? 'text-blue-900' :
              status === 'success' ? 'text-green-900' :
              'text-red-900'
            }`}>
              {status === 'creating' && 'กำลังสร้างการแข่งขัน...'}
              {status === 'success' && '✅ สร้างการแข่งขันสำเร็จ!'}
              {status === 'error' && '❌ เกิดข้อผิดพลาด'}
            </h3>
            <p className={`text-sm mt-1 ${
              status === 'creating' ? 'text-blue-700' :
              status === 'success' ? 'text-green-700' :
              'text-red-700'
            }`}>
              {status === 'creating' && 'กรุณารอสักครู่...'}
              {status === 'success' && 'ดำเนินการเสร็จสิ้น'}
              {status === 'error' && 'ไม่สามารถสร้างการแข่งขันได้'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>ความคืบหน้า</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                status === 'success' ? 'bg-green-500' :
                status === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              {status === 'creating' && (
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>สร้างแล้ว {created} / {total} รายการ</span>
            {status === 'creating' && <span>กำลังดำเนินการ...</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{total}</div>
            <div className="text-xs text-gray-500 mt-1">ทั้งหมด</div>
          </div>

          {/* Success */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{created}</div>
            <div className="text-xs text-green-600 mt-1">สำเร็จ</div>
          </div>

          {/* Failed */}
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{errors.length}</div>
            <div className="text-xs text-red-600 mt-1">ล้มเหลว</div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-red-900 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              รายการที่ล้มเหลว ({errors.length})
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <ul className="space-y-2 text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === 'success' && created > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-green-900 mb-2">
                  🎉 สร้างการแข่งขันสำเร็จ!
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li className="flex items-start">
                    <Trophy className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>สร้างการแข่งขัน {created} รายการสำเร็จ</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 ml-6">•</span>
                    <span>สถานะ: draft (รอ Group Admin เปิดใช้งาน)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 ml-6">•</span>
                    <span>ระบบได้ส่งแจ้งเตือนไปยัง Group Admins แล้ว</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Creating Animation */}
        {status === 'creating' && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm">กำลังสร้างการแข่งขัน...</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⏱️ ใช้เวลาประมาณ 1-2 นาที
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'success' && (
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between gap-3">
          <button
            onClick={onCreateMore}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            สร้างหมวดอื่นต่อ
          </button>
          
          <button
            onClick={onViewCompetitions}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
          >
            ดูรายการที่สร้าง
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onCreateMore}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
};

// Add shimmer animation to your global CSS
const shimmerAnimation = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

export default BulkCreateProgress;
