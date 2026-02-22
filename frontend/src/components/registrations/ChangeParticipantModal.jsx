import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  X,
  UserMinus,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

/**
 * Modal เปลี่ยนตัวผู้เข้าแข่งขัน (ระดับเขต)
 */
const ChangeParticipantModal = ({ isOpen, registration, onClose, onSuccess }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [newName, setNewName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !registration) return null;

  const students = Array.isArray(registration.student_names)
    ? registration.student_names
    : [];

  // คำนวณโควตา
  const studentCount = students.length;
  const maxChanges = registration.max_changes_allowed ?? calculateMaxChanges(studentCount);
  const changeCount = registration.change_count ?? 0;
  const remaining = Math.max(0, maxChanges - changeCount);

  // Original names สำหรับเทียบ
  const originalNames = Array.isArray(registration.original_student_names)
    ? registration.original_student_names
    : [];

  function calculateMaxChanges(count) {
    if (count <= 1) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 10) return 3;
    if (count <= 20) return 4;
    return 5;
  }

  const getStudentName = (student) => {
    return typeof student === 'string' ? student : (student?.name || '-');
  };

  const isChanged = (student, index) => {
    if (!originalNames.length) return false;
    const origName = getStudentName(originalNames[index]);
    const currName = getStudentName(student);
    return origName !== currName;
  };

  const handleSubmit = async () => {
    if (selectedIndex === null) {
      toast.warning('กรุณาเลือกผู้เข้าแข่งขันที่ต้องการเปลี่ยนตัว');
      return;
    }
    if (!newName.trim()) {
      toast.warning('กรุณาใส่ชื่อผู้เข้าแข่งขันคนใหม่');
      return;
    }

    const oldName = getStudentName(students[selectedIndex]);

    try {
      setSubmitting(true);
      const response = await api.post(`/registrations/${registration.id}/change-participant`, {
        old_name: oldName,
        new_name: newName.trim(),
        reason: reason.trim() || null,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data.message || 'ไม่สามารถเปลี่ยนตัวได้');
      }
    } catch (error) {
      console.error('Change participant error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนตัว');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserMinus className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">เปลี่ยนตัวผู้เข้าแข่งขัน</h2>
                <p className="text-orange-100 text-sm">{registration.competition?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-orange-400 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* โควตาเปลี่ยนตัว */}
        <div className={`mx-5 mt-4 p-4 rounded-xl border-2 ${
          remaining > 0
            ? 'bg-blue-50 border-blue-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Info className={`w-5 h-5 ${remaining > 0 ? 'text-blue-600' : 'text-red-600'}`} />
            <span className={`font-bold ${remaining > 0 ? 'text-blue-800' : 'text-red-800'}`}>
              โควตาเปลี่ยนตัว
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              ผู้เข้าแข่งขัน {studentCount} คน เปลี่ยนได้สูงสุด {maxChanges} คน
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  remaining > 0 ? 'bg-blue-500' : 'bg-red-500'
                }`}
                style={{ width: `${maxChanges > 0 ? (changeCount / maxChanges) * 100 : 100}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${remaining > 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {changeCount}/{maxChanges}
            </span>
          </div>
          {remaining > 0 ? (
            <p className="text-sm text-blue-600 mt-1">เปลี่ยนได้อีก {remaining} คน</p>
          ) : (
            <p className="text-sm text-red-600 mt-1 font-bold">เปลี่ยนครบโควตาแล้ว</p>
          )}
        </div>

        {remaining <= 0 ? (
          <div className="p-5 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600">ไม่สามารถเปลี่ยนตัวได้อีก เนื่องจากใช้โควตาครบแล้ว</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ปิด
            </button>
          </div>
        ) : (
          <>
            {/* รายชื่อผู้เข้าแข่งขัน */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">เลือกผู้เข้าแข่งขันที่ต้องการเปลี่ยนตัว:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map((student, index) => {
                  const name = getStudentName(student);
                  const changed = isChanged(student, index);
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                        selectedIndex === index
                          ? 'border-orange-500 bg-orange-50'
                          : changed
                            ? 'border-green-300 bg-green-50 hover:border-green-400'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedIndex === index
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{name}</span>
                      </div>
                      {changed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          เปลี่ยนแล้ว
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ฟอร์มใส่ชื่อใหม่ */}
            {selectedIndex !== null && (
              <div className="px-5 pb-5 space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-sm text-orange-800">
                    <span className="font-bold">เปลี่ยนจาก:</span> {getStudentName(students[selectedIndex])}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    ชื่อผู้เข้าแข่งขันคนใหม่ *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น ด.ช.สมชาย ใจดี"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    เหตุผล (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="เช่น ป่วย, ติดธุระ"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 p-5 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedIndex === null || !newName.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>ยืนยันเปลี่ยนตัว</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangeParticipantModal;
