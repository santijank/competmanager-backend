import { CheckCircle, AlertTriangle, Calendar, School, BookOpen, Trophy } from 'lucide-react';

/**
 * BulkCreateConfirmation - แสดงสรุปข้อมูลและยืนยันก่อนสร้าง Master Competition
 * 
 * Props:
 * - method: 'category' | 'single'
 * - category: หมวดหมู่ที่เลือก
 * - startDate: วันเปิดรับสมัคร
 * - endDate: วันปิดรับสมัคร
 * - selectedGroups: Array ของ school_group_ids
 * - schoolGroups: Array ของ school groups ทั้งหมด
 * - competitionsCount: จำนวนรายการแข่งขันในหมวด
 * - onConfirm: Callback เมื่อยืนยัน
 * - onCancel: Callback เมื่อยกเลิก
 * - loading: สถานะกำลังสร้าง
 */
const BulkCreateConfirmation = ({
  method = 'category',
  category,
  startDate,
  endDate,
  selectedGroups = [],
  schoolGroups = [],
  competitionsCount = 0,
  onConfirm,
  onCancel,
  loading = false
}) => {
  
  // คำนวณจำนวนการแข่งขันที่จะสร้าง
  const totalCompetitions = method === 'category' 
    ? competitionsCount * selectedGroups.length 
    : selectedGroups.length;

  // Get selected group names
  const selectedGroupNames = schoolGroups
    .filter(g => selectedGroups.includes(g.id))
    .map(g => g.name);

  // คำนวณจำนวนวัน
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calculateDays();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              ยืนยันการสร้างการแข่งขัน
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              กรุณาตรวจสอบข้อมูลก่อนดำเนินการ
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 space-y-4">
        {/* Category Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-blue-900 mb-1">หมวดหมู่</div>
              <div className="text-sm text-blue-700">
                {category?.name || '-'}
              </div>
              {category?.code && (
                <div className="text-xs text-blue-600 mt-1">
                  รหัส: {category.code}
                </div>
              )}
              {method === 'category' && competitionsCount > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  📋 {competitionsCount} รายการแข่งขันในหมวด
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Period */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-green-900 mb-2">ช่วงรับสมัคร</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-green-600 mb-1">เปิดรับสมัคร</div>
                  <div className="text-sm text-green-700 font-medium">
                    {startDate ? new Date(startDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-600 mb-1">ปิดรับสมัคร</div>
                  <div className="text-sm text-green-700 font-medium">
                    {endDate ? new Date(endDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </div>
                </div>
              </div>
              {days > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  ⏱️ รับสมัครรวม {days} วัน
                </div>
              )}
            </div>
          </div>
        </div>

        {/* School Groups */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start">
            <School className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-purple-900 mb-2">
                กลุ่มโรงเรียน ({selectedGroups.length} กลุ่ม)
              </div>
              {selectedGroupNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedGroupNames.slice(0, 10).map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-xs text-purple-700"
                    >
                      {name}
                    </span>
                  ))}
                  {selectedGroupNames.length > 10 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-xs text-purple-700">
                      +{selectedGroupNames.length - 10} อื่นๆ
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border-2 border-orange-200">
          <div className="flex items-start">
            <Trophy className="h-6 w-6 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-orange-900 text-lg mb-2">
                ระบบจะสร้าง
              </div>
              <div className="flex items-baseline">
                <div className="text-5xl font-bold text-orange-600">
                  {totalCompetitions}
                </div>
                <div className="text-lg text-orange-700 ml-2">
                  การแข่งขัน
                </div>
              </div>
              <div className="mt-3 text-sm text-orange-700">
                {method === 'category' && (
                  <div>
                    = {competitionsCount} รายการ × {selectedGroups.length} กลุ่ม
                  </div>
                )}
                <div className="text-xs text-orange-600 mt-1">
                  สถานะเริ่มต้น: draft (รอ Group Admin เปิดใช้งาน)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-yellow-900 mb-2">
                ⚠️ สิ่งที่จะเกิดขึ้น
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>สร้างการแข่งขัน {totalCompetitions} รายการ (สถานะ: draft)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>ส่งแจ้งเตือนให้ Group Admins ทั้ง {selectedGroups.length} กลุ่ม</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Group Admins เปิดใช้งานการแข่งขัน (draft → active)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>ระบบเปิดรับสมัครอัตโนมัติในวันที่กำหนด</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">5.</span>
                  <span>ระบบปิดรับสมัครอัตโนมัติเมื่อครบกำหนด</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← แก้ไข
        </button>
        
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              กำลังสร้าง...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              ✓ ยืนยันสร้าง ({totalCompetitions} รายการ)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkCreateConfirmation;
