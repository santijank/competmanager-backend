import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { checkNameChange } from '@/lib/levenshtein';

const MAX_EDIT_DISTANCE = 5;

const EditRegistrationModal = ({ isOpen, onClose, registration, onSuccess, userRole }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    student_names: [],
    teacher_names: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [competition, setCompetition] = useState(null);

  // เก็บชื่อเดิมเพื่อเปรียบเทียบ
  const [originalStudentNames, setOriginalStudentNames] = useState([]);
  const [originalTeacherNames, setOriginalTeacherNames] = useState([]);

  const isAdmin = ['admin', 'district_admin'].includes(userRole);

  useEffect(() => {
    if (isOpen && registration) {
      setCompetition(registration.competition);

      let students = [];
      let teachers = [];

      try {
        if (typeof registration.student_names === 'string') {
          students = JSON.parse(registration.student_names);
        } else if (Array.isArray(registration.student_names)) {
          students = registration.student_names;
        }

        if (typeof registration.teacher_names === 'string') {
          teachers = JSON.parse(registration.teacher_names);
        } else if (Array.isArray(registration.teacher_names)) {
          teachers = registration.teacher_names;
        }

        if (students.length > 0 && typeof students[0] === 'string') {
          students = students.map(name => ({ name }));
        }
        if (teachers.length > 0 && typeof teachers[0] === 'string') {
          teachers = teachers.map(name => ({ name }));
        }
      } catch (e) {
        console.error('Parse error:', e);
      }

      const parsedStudents = students.length > 0 ? students : [{ name: '' }];
      const parsedTeachers = teachers.length > 0 ? teachers : [{ name: '' }];

      // เก็บชื่อเดิม
      setOriginalStudentNames(parsedStudents.map(s => s.name));
      setOriginalTeacherNames(parsedTeachers.map(t => t.name));

      setFormData({
        team_name: registration.team_name || '',
        student_names: parsedStudents,
        teacher_names: parsedTeachers,
        notes: registration.notes || ''
      });
    }
  }, [isOpen, registration]);

  const handleClose = () => {
    setFormData({
      team_name: '',
      student_names: [],
      teacher_names: [],
      notes: ''
    });
    setOriginalStudentNames([]);
    setOriginalTeacherNames([]);
    onClose();
  };

  // ตรวจสอบ name change warnings
  const nameWarnings = useMemo(() => {
    if (isAdmin) return { students: [], teachers: [] };

    const studentWarnings = formData.student_names.map((s, i) => {
      if (i >= originalStudentNames.length) return null;
      const original = originalStudentNames[i];
      if (!original || !s.name || original === s.name) return null;
      const result = checkNameChange(original, s.name, MAX_EDIT_DISTANCE);
      return result.isValid ? null : { index: i, original, current: s.name, distance: result.distance };
    }).filter(Boolean);

    const teacherWarnings = formData.teacher_names.map((t, i) => {
      if (i >= originalTeacherNames.length) return null;
      const original = originalTeacherNames[i];
      if (!original || !t.name || original === t.name) return null;
      const result = checkNameChange(original, t.name, MAX_EDIT_DISTANCE);
      return result.isValid ? null : { index: i, original, current: t.name, distance: result.distance };
    }).filter(Boolean);

    return { students: studentWarnings, teachers: teacherWarnings };
  }, [formData.student_names, formData.teacher_names, originalStudentNames, originalTeacherNames, isAdmin]);

  const hasWarnings = nameWarnings.students.length > 0 || nameWarnings.teachers.length > 0;

  // จัดการนักเรียน
  const handleStudentChange = (index, value) => {
    const newStudents = [...formData.student_names];
    newStudents[index] = { ...newStudents[index], name: value };
    setFormData({ ...formData, student_names: newStudents });
  };

  const addStudent = () => {
    if (competition && formData.student_names.length >= competition.max_students) {
      toast.warning(`สามารถเพิ่มนักเรียนได้สูงสุด ${competition.max_students} คน`);
      return;
    }
    setFormData({
      ...formData,
      student_names: [...formData.student_names, { name: '' }]
    });
  };

  const removeStudent = (index) => {
    if (competition && formData.student_names.length <= competition.min_students) {
      toast.warning(`ต้องมีนักเรียนอย่างน้อย ${competition.min_students} คน`);
      return;
    }
    const newStudents = formData.student_names.filter((_, i) => i !== index);
    setFormData({ ...formData, student_names: newStudents });
  };

  // จัดการครู
  const handleTeacherChange = (index, value) => {
    const newTeachers = [...formData.teacher_names];
    newTeachers[index] = { ...newTeachers[index], name: value };
    setFormData({ ...formData, teacher_names: newTeachers });
  };

  const addTeacher = () => {
    if (competition && formData.teacher_names.length >= competition.max_teachers) {
      toast.warning(`สามารถเพิ่มครูได้สูงสุด ${competition.max_teachers} คน`);
      return;
    }
    setFormData({
      ...formData,
      teacher_names: [...formData.teacher_names, { name: '' }]
    });
  };

  const removeTeacher = (index) => {
    if (competition && formData.teacher_names.length <= competition.min_teachers) {
      toast.warning(`ต้องมีครูอย่างน้อย ${competition.min_teachers} คน`);
      return;
    }
    const newTeachers = formData.teacher_names.filter((_, i) => i !== index);
    setFormData({ ...formData, teacher_names: newTeachers });
  };

  // ตรวจว่าชื่อตำแหน่งนี้มี warning ไหม
  const getStudentWarning = (index) =>
    nameWarnings.students.find(w => w.index === index);
  const getTeacherWarning = (index) =>
    nameWarnings.teachers.find(w => w.index === index);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate empty names
    const emptyStudents = formData.student_names.filter(s => !s.name || !s.name.trim());
    if (emptyStudents.length > 0) {
      toast.error('กรุณากรอกชื่อนักเรียนให้ครบทุกคน');
      return;
    }

    const emptyTeachers = formData.teacher_names.filter(t => !t.name || !t.name.trim());
    if (emptyTeachers.length > 0) {
      toast.error('กรุณากรอกชื่อครูให้ครบทุกคน');
      return;
    }

    // Client-side check: name change too large
    if (!isAdmin && hasWarnings) {
      toast.error('ชื่อเปลี่ยนแปลงมากเกินไป กรุณาแก้เฉพาะตัวสะกด หากต้องการเปลี่ยนชื่อ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        team_name: formData.team_name,
        student_names: formData.student_names.map(s => s.name.trim()),
        teacher_names: formData.teacher_names.map(t => t.name.trim()),
        notes: formData.notes
      };

      await api.put(`/registrations/${registration.id}`, submitData);
      toast.success('แก้ไขข้อมูลสำเร็จ');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Update error:', error);
      const data = error.response?.data;

      // แสดง error จาก name_changes validation
      if (data?.errors?.name_changes) {
        data.errors.name_changes.forEach(msg => toast.error(msg));
      } else {
        toast.error(data?.message || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">แก้ไขรายชื่อผู้เข้าแข่งขัน</h2>
            <p className="text-sm text-gray-600 mt-1">
              {competition?.name} ({competition?.code})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info banner สำหรับ non-admin */}
        {!isAdmin && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">แก้ไขได้เฉพาะตัวสะกดที่ผิดเท่านั้น</p>
              <p className="mt-1">ไม่สามารถเปลี่ยนชื่อ-นามสกุล หรือเพิ่ม/ลบรายชื่อได้ หากต้องการเปลี่ยนแปลงมาก กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อทีม
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Students */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  รายชื่อนักเรียน ({formData.student_names.length}/{competition?.max_students || 0})
                </label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={addStudent}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {formData.student_names.map((student, index) => {
                  const warning = getStudentWarning(index);
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-8">{index + 1}.</span>
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => handleStudentChange(index, e.target.value)}
                          placeholder="ชื่อ-นามสกุล นักเรียน"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            warning ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        />
                        {isAdmin && formData.student_names.length > (competition?.min_students || 1) && (
                          <button
                            type="button"
                            onClick={() => removeStudent(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {warning && (
                        <div className="flex items-center gap-1 ml-8 mt-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ชื่อเปลี่ยนมากเกินไป (จาก "{warning.original}") กรุณาแก้เฉพาะตัวสะกด</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Teachers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  รายชื่อครูผู้ฝึกสอน ({formData.teacher_names.length}/{competition?.max_teachers || 0})
                </label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={addTeacher}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {formData.teacher_names.map((teacher, index) => {
                  const warning = getTeacherWarning(index);
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-8">{index + 1}.</span>
                        <input
                          type="text"
                          value={teacher.name}
                          onChange={(e) => handleTeacherChange(index, e.target.value)}
                          placeholder="ชื่อ-นามสกุล ครู"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            warning ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        />
                        {isAdmin && formData.teacher_names.length > (competition?.min_teachers || 1) && (
                          <button
                            type="button"
                            onClick={() => removeTeacher(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {warning && (
                        <div className="flex items-center gap-1 ml-8 mt-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ชื่อเปลี่ยนมากเกินไป (จาก "{warning.original}") กรุณาแก้เฉพาะตัวสะกด</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ (ถ้ามี)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ระบุหมายเหตุเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || (!isAdmin && hasWarnings)}
            >
              <Save className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRegistrationModal;
