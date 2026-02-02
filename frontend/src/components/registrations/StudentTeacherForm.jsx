import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

/**
 * ✅ StudentTeacherForm Component
 * 
 * Dynamic form สำหรับเพิ่ม/ลบนักเรียนหรือครู
 */
const StudentTeacherForm = ({ 
  type = 'student',
  values = [], 
  onChange, 
  min = 1, 
  max = 5,
  disabled = false 
}) => {
  const label = type === 'student' ? 'นักเรียน' : 'ครูผู้ฝึกสอน';
  const idLabel = type === 'student' ? 'เลขประจำตัวนักเรียน' : 'เลขประจำตัวครู';
  const placeholder = type === 'student' ? 'ชื่อ-นามสกุล นักเรียน' : 'ชื่อ-นามสกุล ครู';
  
  // เพิ่มคน
  const addPerson = () => {
    if (values.length < max) {
      const newPerson = { name: '', [type === 'student' ? 'student_id' : 'teacher_id']: '' };
      onChange([...values, newPerson]);
    }
  };
  
  // ลบคน
  const removePerson = (index) => {
    if (values.length > min) {
      const newValues = values.filter((_, i) => i !== index);
      onChange(newValues);
    }
  };
  
  // อัพเดทข้อมูล
  const updatePerson = (index, field, value) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    onChange(newValues);
  };

  // Check if at min/max
  const isAtMin = values.length <= min;
  const isAtMax = values.length >= max;
  const canAdd = !isAtMax && !disabled;
  const canRemove = !isAtMin && !disabled;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          {label}
        </h3>
        
        <button
          type="button"
          onClick={addPerson}
          disabled={!canAdd}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canAdd
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม{label}</span>
        </button>
      </div>

      {/* Info */}
      <div className={`text-sm mb-4 p-3 rounded-lg ${
        values.length < min
          ? 'bg-red-50 text-red-700 border border-red-200'
          : values.length > max
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-gray-50 text-gray-600 border border-gray-200'
      }`}>
        {min === max ? (
          <span>ต้องมี <strong>{min}</strong> คน</span>
        ) : (
          <span>ต้องมีอย่างน้อย <strong>{min}</strong> คน และมากที่สุด <strong>{max}</strong> คน (ปัจจุบัน: <strong>{values.length}</strong> คน)</span>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {values.map((person, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Number Badge */}
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mt-6">
              {index + 1}
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-3">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updatePerson(index, 'name', e.target.value)}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {idLabel} <span className="text-gray-400">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={person[type === 'student' ? 'student_id' : 'teacher_id'] || ''}
                  onChange={(e) => updatePerson(index, type === 'student' ? 'student_id' : 'teacher_id', e.target.value)}
                  placeholder="เลขประจำตัว"
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removePerson(index)}
              disabled={!canRemove}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors mt-6 ${
                canRemove
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              title={canRemove ? `ลบ${label}` : `ต้องมีอย่างน้อย ${min} คน`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Warning if no entries */}
      {values.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            กรุณาเพิ่ม{label}อย่างน้อย {min} คน
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTeacherForm;