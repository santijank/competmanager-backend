import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const EditRegistrationModal = ({ isOpen, onClose, registration, onSuccess }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    student_names: [],
    teacher_names: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [competition, setCompetition] = useState(null);

  useEffect(() => {
    if (isOpen && registration) {
      console.log('📝 EditModal - Registration Data:', registration);
      console.log('📝 EditModal - student_names:', registration.student_names);
      console.log('📝 EditModal - teacher_names:', registration.teacher_names);

      // โหลดข้อมูล registration
      setCompetition(registration.competition);

      // แปลง student_names และ teacher_names จาก JSON string เป็น array
      let students = [];
      let teachers = [];

      try {
        // Handle student_names
        if (typeof registration.student_names === 'string') {
          students = JSON.parse(registration.student_names);
        } else if (Array.isArray(registration.student_names)) {
          students = registration.student_names;
        }

        // Handle teacher_names
        if (typeof registration.teacher_names === 'string') {
          teachers = JSON.parse(registration.teacher_names);
        } else if (Array.isArray(registration.teacher_names)) {
          teachers = registration.teacher_names;
        }

        // ✅ ถ้า students เป็น array ของ string ให้แปลงเป็น object { name: '' }
        if (students.length > 0 && typeof students[0] === 'string') {
          students = students.map(name => ({ name }));
        }

        // ✅ ถ้า teachers เป็น array ของ string ให้แปลงเป็น object { name: '' }
        if (teachers.length > 0 && typeof teachers[0] === 'string') {
          teachers = teachers.map(name => ({ name }));
        }

        console.log('📝 EditModal - Parsed students:', students);
        console.log('📝 EditModal - Parsed teachers:', teachers);
      } catch (e) {
        console.error('Parse error:', e);
      }

      setFormData({
        team_name: registration.team_name || '',
        student_names: students.length > 0 ? students : [{ name: '' }],
        teacher_names: teachers.length > 0 ? teachers : [{ name: '' }],
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
    onClose();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
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

    setLoading(true);
    try {
      // ✅ แปลง objects กลับเป็น array of strings สำหรับ Backend
      const submitData = {
        team_name: formData.team_name,
        student_names: formData.student_names.map(s => s.name.trim()),
        teacher_names: formData.teacher_names.map(t => t.name.trim()),
        notes: formData.notes
      };

      console.log('📝 Submitting data:', submitData);

      await api.put(`/registrations/${registration.id}`, submitData);
      toast.success('แก้ไขข้อมูลสำเร็จ');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Update error:', error);
      const message = error.response?.data?.message || 'ไม่สามารถแก้ไขข้อมูลได้';
      toast.error(message);
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
                <button
                  type="button"
                  onClick={addStudent}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่ม
                </button>
              </div>
              <div className="space-y-2">
                {formData.student_names.map((student, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => handleStudentChange(index, e.target.value)}
                      placeholder="ชื่อ-นามสกุล นักเรียน"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.student_names.length > (competition?.min_students || 1) && (
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Teachers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  รายชื่อครูผู้ฝึกสอน ({formData.teacher_names.length}/{competition?.max_teachers || 0})
                </label>
                <button
                  type="button"
                  onClick={addTeacher}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่ม
                </button>
              </div>
              <div className="space-y-2">
                {formData.teacher_names.map((teacher, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={teacher.name}
                      onChange={(e) => handleTeacherChange(index, e.target.value)}
                      placeholder="ชื่อ-นามสกุล ครู"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.teacher_names.length > (competition?.min_teachers || 1) && (
                      <button
                        type="button"
                        onClick={() => removeTeacher(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
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
              disabled={loading}
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
