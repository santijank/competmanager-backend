import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  competitionService, 
  registrationService,
  categoryService 
} from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { CategorySelector, CompetitionList } from '@/components/registrations';

const RegistrationCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State Management
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionsCount, setCompetitionsCount] = useState({});

  // Form State
  const [students, setStudents] = useState([{ name: '', grade: '', class: '' }]);
  const [teachers, setTeachers] = useState([{ name: '', email: '' }]);
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch Categories & Competitions on mount
  useEffect(() => {
    fetchCategoriesAndCompetitions();
  }, []);

  // Filter competitions when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = competitions.filter(
        comp => comp.category_id === selectedCategory.id
      );
      setFilteredCompetitions(filtered);
    } else {
      setFilteredCompetitions([]);
    }
  }, [selectedCategory, competitions]);

  const fetchCategoriesAndCompetitions = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await categoryService.getAll();
      const categoriesData = categoriesResponse.data.data || categoriesResponse.data;
      setCategories(categoriesData);

      // Fetch open competitions
      const competitionsResponse = await competitionService.getAll({
        registration_status: 'open',
        is_active: true
      });
      const competitionsData = competitionsResponse.data.data || competitionsResponse.data;
      setCompetitions(competitionsData);

      // Count competitions per category
      const counts = {};
      competitionsData.forEach(comp => {
        counts[comp.category_id] = (counts[comp.category_id] || 0) + 1;
      });
      setCompetitionsCount(counts);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Category Selection Handler
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedCompetition(null); // Reset competition when category changes
  };

  // Competition Selection Handler
  const handleCompetitionSelect = (competition) => {
    setSelectedCompetition(competition);
    
    // Reset form based on competition limits
    setStudents([{ name: '', grade: '', class: '' }]);
    setTeachers([{ name: '', email: '' }]);
    setContactPhone('');
    setNotes('');
    setErrors({});
  };

  // Student Handlers
  const handleAddStudent = () => {
    if (students.length >= (selectedCompetition?.max_students || 999)) {
      toast.warning(`จำนวนนักเรียนเต็มแล้ว (สูงสุด ${selectedCompetition.max_students} คน)`);
      return;
    }
    setStudents([...students, { name: '', grade: '', class: '' }]);
  };

  const handleRemoveStudent = (index) => {
    if (students.length <= 1) {
      toast.warning('ต้องมีนักเรียนอย่างน้อย 1 คน');
      return;
    }
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleStudentChange = (index, field, value) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
    
    // Clear error for this field
    if (errors[`students.${index}.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`students.${index}.${field}`];
      setErrors(newErrors);
    }
  };

  // Teacher Handlers
  const handleAddTeacher = () => {
    if (teachers.length >= (selectedCompetition?.max_teachers || 999)) {
      toast.warning(`จำนวนครูเต็มแล้ว (สูงสุด ${selectedCompetition.max_teachers} คน)`);
      return;
    }
    setTeachers([...teachers, { name: '', email: '' }]);
  };

  const handleRemoveTeacher = (index) => {
    if (teachers.length <= 1) {
      toast.warning('ต้องมีครูอย่างน้อย 1 คน');
      return;
    }
    setTeachers(teachers.filter((_, i) => i !== index));
  };

  const handleTeacherChange = (index, field, value) => {
    const newTeachers = [...teachers];
    newTeachers[index][field] = value;
    setTeachers(newTeachers);
    
    // Clear error for this field
    if (errors[`teachers.${index}.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`teachers.${index}.${field}`];
      setErrors(newErrors);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Check competition selected
    if (!selectedCompetition) {
      newErrors.competition = 'กรุณาเลือกรายการแข่งขัน';
    }

    // Validate students
    students.forEach((student, index) => {
      if (!student.name.trim()) {
        newErrors[`students.${index}.name`] = 'กรุณากรอกชื่อนักเรียน';
      }
      if (!student.grade.trim()) {
        newErrors[`students.${index}.grade`] = 'กรุณาเลือกระดับชั้น';
      }
      if (!student.class.trim()) {
        newErrors[`students.${index}.class`] = 'กรุณากรอกห้อง';
      }
    });

    // Validate teachers
    teachers.forEach((teacher, index) => {
      if (!teacher.name.trim()) {
        newErrors[`teachers.${index}.name`] = 'กรุณากรอกชื่อครู';
      }
      // Email is optional
      if (teacher.email && !isValidEmail(teacher.email)) {
        newErrors[`teachers.${index}.email`] = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    });

    // Validate contact phone (Required)
    if (!contactPhone.trim()) {
      newErrors.contactPhone = 'กรุณากรอกเบอร์โทรศัพท์ติดต่อ';
    } else if (!isValidPhone(contactPhone)) {
      newErrors.contactPhone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone) => {
    return /^0\d{9}$/.test(phone.replace(/[-\s]/g, ''));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        competition_id: selectedCompetition.id,
        school_id: user.school_id,
        students: students.map(s => ({
          name: s.name.trim(),
          grade: s.grade.trim(),
          class: s.class.trim()
        })),
        teachers: teachers.map(t => ({
          name: t.name.trim(),
          email: t.email.trim() || null
        })),
        contact_phone: contactPhone.trim(),
        notes: notes.trim() || null
      };

      console.log('Submitting registration:', payload);
      
      const response = await registrationService.create(payload);
      
      toast.success('ลงทะเบียนสำเร็จ! รอการอนุมัติจากเจ้าหนาที่');
      navigate('/registrations');
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      toast.error(errorMessage);
      
      // Set field errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Grade options
  const gradeOptions = [
    'อนุบาล 1', 'อนุบาล 2', 'อนุบาล 3',
    'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
    'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
    'ปวช.1', 'ปวช.2', 'ปวช.3',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ลงทะเบียนแข่งขัน</h1>
        <p className="text-gray-600">กรอกข้อมูลนักเรียนและครูผู้ฝึกสอนเพื่อลงทะเบียนเข้าแข่งขัน</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Step 1: Category Selection */}
        {!selectedCategory && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              competitionsCount={competitionsCount}
            />
          </div>
        )}

        {/* Step 2: Competition Selection */}
        {selectedCategory && !selectedCompetition && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CompetitionList
              competitions={filteredCompetitions}
              selectedCompetition={selectedCompetition}
              onSelectCompetition={handleCompetitionSelect}
              categoryName={selectedCategory.name}
            />
          </div>
        )}

        {/* Step 3: Registration Form */}
        {selectedCompetition && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Competition Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    ✓ รายการที่เลือก
                  </h3>
                  <p className="text-sm text-blue-800">{selectedCompetition.name}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedCategory.name} • {selectedCompetition.level}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompetition(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  เปลี่ยน
                </button>
              </div>
            </div>

            {/* Students Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  👨‍🎓 ข้อมูลนักเรียน
                </h3>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={students.length >= selectedCompetition.max_students}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>+</span>
                  <span>เพิ่มนักเรียน</span>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                จำนวน: {students.length} / {selectedCompetition.max_students} คน
              </p>

              <div className="space-y-4">
                {students.map((student, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-700">นักเรียนคนที่ {index + 1}</h4>
                      {students.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ✕ ลบ
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                          placeholder="เช่น เด็กชายสมชาย ใจดี"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`students.${index}.name`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`students.${index}.name`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`students.${index}.name`]}</p>
                        )}
                      </div>

                      {/* Grade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ระดับชั้น <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={student.grade}
                          onChange={(e) => handleStudentChange(index, 'grade', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`students.${index}.grade`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">-- เลือกชั้น --</option>
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                        {errors[`students.${index}.grade`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`students.${index}.grade`]}</p>
                        )}
                      </div>

                      {/* Class */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ห้อง <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={student.class}
                          onChange={(e) => handleStudentChange(index, 'class', e.target.value)}
                          placeholder="เช่น 1, 2, 3"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`students.${index}.class`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`students.${index}.class`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`students.${index}.class`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teachers Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  👨‍🏫 ข้อมูลครูผู้ฝึกสอน
                </h3>
                <button
                  type="button"
                  onClick={handleAddTeacher}
                  disabled={teachers.length >= selectedCompetition.max_teachers}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>+</span>
                  <span>เพิ่มครู</span>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                จำนวน: {teachers.length} / {selectedCompetition.max_teachers} คน
              </p>

              <div className="space-y-4">
                {teachers.map((teacher, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-700">ครูคนที่ {index + 1}</h4>
                      {teachers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacher(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ✕ ลบ
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={teacher.name}
                          onChange={(e) => handleTeacherChange(index, 'name', e.target.value)}
                          placeholder="เช่น นางสาวสมหญิง ใจดี"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`teachers.${index}.name`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`teachers.${index}.name`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`teachers.${index}.name`]}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          อีเมล
                        </label>
                        <input
                          type="email"
                          value={teacher.email}
                          onChange={(e) => handleTeacherChange(index, 'email', e.target.value)}
                          placeholder="teacher@school.ac.th"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`teachers.${index}.email`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`teachers.${index}.email`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`teachers.${index}.email`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📞 ข้อมูลติดต่อ
              </h3>

              <div className="space-y-4">
                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.contactPhone) {
                        const newErrors = { ...errors };
                        delete newErrors.contactPhone;
                        setErrors(newErrors);
                      }
                    }}
                    placeholder="0812345678"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    เบอร์โทรศัพท์สำหรับติดต่อประสานงาน
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ (ถ้ามี)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ข้อมูลเพิ่มเติม หรือคำขอพิเศษ..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/registrations')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกการลงทะเบียน</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistrationCreate;