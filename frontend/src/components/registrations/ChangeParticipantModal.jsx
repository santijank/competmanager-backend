import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  X,
  UserMinus,
  UserPlus,
  CheckCircle,
  Info,
  Users,
  GraduationCap,
} from 'lucide-react';
import api from '@/lib/api';

/**
 * Modal เปลี่ยนตัวผู้เข้าแข่งขัน + ครูผู้ฝึกสอน (ระดับเขต)
 * - นักเรียน: มีโควตาตามเกณฑ์
 * - ครู: เปลี่ยนได้ไม่จำกัด
 */
const ChangeParticipantModal = ({ isOpen, registration, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'teacher'
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [newName, setNewName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !registration) return null;

  const students = Array.isArray(registration.student_names)
    ? registration.student_names
    : [];

  const teachers = Array.isArray(registration.teacher_names)
    ? registration.teacher_names
    : [];

  // คำนวณโควตานักเรียน
  const studentCount = students.length;
  const hasBeenInitialized = registration.original_student_names && registration.original_student_names.length > 0;
  const maxChanges = hasBeenInitialized ? (registration.max_changes_allowed || 0) : calculateMaxChanges(studentCount);
  const changeCount = registration.change_count ?? 0;
  const remaining = Math.max(0, maxChanges - changeCount);

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

  const getName = (person) => {
    return typeof person === 'string' ? person : (person?.name || '-');
  };

  const isStudentChanged = (student, index) => {
    if (!originalNames.length) return false;
    const origName = getName(originalNames[index]);
    const currName = getName(student);
    return origName !== currName;
  };

  const resetForm = () => {
    setSelectedIndex(null);
    setNewName('');
    setReason('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const currentList = activeTab === 'student' ? students : teachers;

  const handleSubmit = async () => {
    if (selectedIndex === null) {
      toast.warning(`กรุณาเลือก${activeTab === 'student' ? 'ผู้เข้าแข่งขัน' : 'ครูผู้ฝึกสอน'}ที่ต้องการเปลี่ยน`);
      return;
    }
    if (!newName.trim()) {
      toast.warning('กรุณาใส่ชื่อใหม่');
      return;
    }

    const oldName = getName(currentList[selectedIndex]);

    try {
      setSubmitting(true);
      const response = await api.post(`/registrations/${registration.id}/change-participant`, {
        old_name: oldName,
        new_name: newName.trim(),
        reason: reason.trim() || null,
        change_type: activeTab,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data.message || 'ไม่สามารถเปลี่ยนได้');
      }
    } catch (error) {
      console.error('Change error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
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
                <h2 className="text-lg font-bold">เปลี่ยนตัว</h2>
                <p className="text-orange-100 text-sm">{registration.competition?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-orange-400 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab: นักเรียน / ครู */}
        <div className="grid grid-cols-2 gap-2 mx-5 mt-4">
          <button
            onClick={() => handleTabChange('student')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
              activeTab === 'student'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>นักเรียน ({students.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('teacher')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
              activeTab === 'teacher'
                ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                : 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>ครูผู้ฝึกสอน ({teachers.length})</span>
          </button>
        </div>

        {/* โควตา (เฉพาะ tab นักเรียน) */}
        {activeTab === 'student' && (
          <div className={`mx-5 mt-4 p-4 rounded-xl border-2 ${
            remaining > 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Info className={`w-5 h-5 ${remaining > 0 ? 'text-blue-600' : 'text-red-600'}`} />
              <span className={`font-bold ${remaining > 0 ? 'text-blue-800' : 'text-red-800'}`}>
                โควตาเปลี่ยนตัวนักเรียน
              </span>
            </div>
            <div className="text-sm text-gray-600">
              ผู้เข้าแข่งขัน {studentCount} คน เปลี่ยนได้สูงสุด {maxChanges} คน
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
        )}

        {/* ข้อความสำหรับ tab ครู */}
        {activeTab === 'teacher' && (
          <div className="mx-5 mt-4 p-4 rounded-xl border-2 bg-teal-50 border-teal-200">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-teal-600" />
              <span className="font-bold text-teal-800">เปลี่ยนครูผู้ฝึกสอน</span>
            </div>
            <p className="text-sm text-teal-700 mt-1">สามารถเปลี่ยนได้ไม่จำกัดจำนวน</p>
          </div>
        )}

        {/* ถ้าเป็นนักเรียนและโควตาหมด */}
        {activeTab === 'student' && remaining <= 0 ? (
          <div className="p-5 text-center text-gray-500">
            <p>ไม่สามารถเปลี่ยนตัวนักเรียนได้อีก</p>
            <p className="text-sm mt-1">ลองเปลี่ยนครูผู้ฝึกสอนแทนได้</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-5 text-center text-gray-500">
            <p>ไม่มีรายชื่อ{activeTab === 'student' ? 'นักเรียน' : 'ครูผู้ฝึกสอน'}</p>
          </div>
        ) : (
          <>
            {/* รายชื่อ */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                เลือก{activeTab === 'student' ? 'นักเรียน' : 'ครูผู้ฝึกสอน'}ที่ต้องการเปลี่ยน:
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {currentList.map((person, index) => {
                  const name = getName(person);
                  const changed = activeTab === 'student' ? isStudentChanged(person, index) : false;
                  const accentColor = activeTab === 'student' ? 'orange' : 'teal';
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                        selectedIndex === index
                          ? `border-${accentColor}-500 bg-${accentColor}-50`
                          : changed
                            ? 'border-green-300 bg-green-50 hover:border-green-400'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      style={selectedIndex === index ? {
                        borderColor: activeTab === 'student' ? '#f97316' : '#14b8a6',
                        backgroundColor: activeTab === 'student' ? '#fff7ed' : '#f0fdfa',
                      } : {}}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={selectedIndex === index ? {
                            backgroundColor: activeTab === 'student' ? '#f97316' : '#14b8a6',
                            color: 'white',
                          } : {
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                          }}
                        >
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
                <div
                  className="border rounded-xl p-3"
                  style={{
                    backgroundColor: activeTab === 'student' ? '#fff7ed' : '#f0fdfa',
                    borderColor: activeTab === 'student' ? '#fed7aa' : '#99f6e4',
                  }}
                >
                  <p className="text-sm" style={{ color: activeTab === 'student' ? '#9a3412' : '#134e4a' }}>
                    <span className="font-bold">เปลี่ยนจาก:</span> {getName(currentList[selectedIndex])}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    ชื่อ{activeTab === 'student' ? 'นักเรียน' : 'ครูผู้ฝึกสอน'}คนใหม่ *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={activeTab === 'student' ? 'เช่น ด.ช.สมชาย ใจดี' : 'เช่น นายสมศักดิ์ รักเรียน'}
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
                    placeholder="เช่น ป่วย, ติดธุระ, ย้ายโรงเรียน"
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
                className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: activeTab === 'student' ? '#ea580c' : '#0d9488',
                }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>ยืนยันเปลี่ยน{activeTab === 'student' ? 'ตัว' : 'ครู'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangeParticipantModal;
