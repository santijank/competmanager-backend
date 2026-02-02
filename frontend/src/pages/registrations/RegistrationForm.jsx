import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Building
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

// ✅ Import StudentTeacherForm Component
import StudentTeacherForm from '@/components/registrations/StudentTeacherForm';

/**
 * 📝 Registration Form - Phase 2: Multi-Participant Support
 * 
 * ✅ Features:
 * - Multi-participant (students + teachers)
 * - Duplicate registration check
 * - Dynamic min/max validation
 * - Enhanced UI/UX
 * 
 * Version: 2.2 (Phase 2)
 */
const RegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const competition = location.state?.competition;
  const { user, isDistrictAdmin, isGroupAdmin } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(true);
  const [existingRegistration, setExistingRegistration] = useState(null);
  const [errors, setErrors] = useState({});

  // ✅ State สำหรับโรงเรียน (ใช้สำหรับ district_admin)
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [loadingSchools, setLoadingSchools] = useState(false);
  
  // ✅ UPDATED: เพิ่ม teacher_names
  const [formData, setFormData] = useState({
    team_name: '',
    student_names: [{ name: '', student_id: '' }],
    teacher_names: [{ name: '', teacher_id: '' }],  // ✅ เพิ่ม
    notes: '',
  });

  useEffect(() => {
    if (!competition) {
      toast.error('ไม่พบข้อมูลการแข่งขัน');
      navigate('/registrations/browse');
      return;
    }

    // ✅ Set initial values based on min requirements
    const minStudents = competition.min_students || 1;
    const minTeachers = competition.min_teachers || 1;

    setFormData(prev => ({
      ...prev,
      student_names: Array(minStudents).fill(null).map(() => ({ name: '', student_id: '' })),
      teacher_names: Array(minTeachers).fill(null).map(() => ({ name: '', teacher_id: '' })),
    }));

    // ✅ โหลดรายชื่อโรงเรียนสำหรับ district_admin/group_admin
    if (isDistrictAdmin() || isGroupAdmin()) {
      fetchSchools();
    }

    // Check for duplicate registration
    checkDuplicateRegistration();
  }, [competition, navigate]);

  /**
   * ✅ โหลดรายชื่อโรงเรียนสำหรับ district_admin/group_admin
   */
  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const params = { all: true };

      // ถ้าเป็น group_admin ให้กรองเฉพาะโรงเรียนในกลุ่มตัวเอง
      if (isGroupAdmin() && user?.school_group_id) {
        params.school_group_id = user.school_group_id;
      }

      const response = await api.get('/schools', { params });

      if (response.data.success) {
        setSchools(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      toast.error('ไม่สามารถโหลดรายชื่อโรงเรียนได้');
    } finally {
      setLoadingSchools(false);
    }
  };

  /**
   * ✅ Check if already registered for this competition
   */
  const checkDuplicateRegistration = async () => {
    try {
      setCheckingDuplicate(true);
      
      const response = await api.get('/registrations', {
        params: {
          competition_id: competition.id,
          paginate: false
        }
      });

      console.log('📋 Checking duplicate registration:', response.data);

      // Extract data
      let registrations = [];
      if (response.data.data?.data) {
        registrations = response.data.data.data;
      } else if (response.data.data) {
        registrations = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
      } else if (Array.isArray(response.data)) {
        registrations = response.data;
      }

      // Find existing registration for this competition (exclude cancelled)
      const existing = registrations.find(
        reg => reg.competition_id === competition.id && 
               reg.status !== 'cancelled'
      );

      if (existing) {
        console.log('⚠️ Found existing registration:', existing);
        setExistingRegistration(existing);
      } else {
        console.log('✅ No existing registration found');
        setExistingRegistration(null);
      }

    } catch (error) {
      console.error('❌ Error checking duplicate:', error);
      // Don't block if check fails - let user proceed
      setExistingRegistration(null);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const updateTeamName = (value) => {
    setFormData({ ...formData, team_name: value });
    
    if (value.trim()) {
      const newErrors = { ...errors };
      delete newErrors.team_name;
      setErrors(newErrors);
    }
  };

  /**
   * ✅ UPDATED: Comprehensive validation
   */
  const validateForm = () => {
    const newErrors = {};

    // Team name
    if (!formData.team_name || !formData.team_name.trim()) {
      newErrors.team_name = 'กรุณากรอกชื่อทีม';
    }

    // ✅ ตรวจสอบโรงเรียน (สำหรับ district_admin/group_admin)
    if ((isDistrictAdmin() || isGroupAdmin()) && !selectedSchoolId) {
      newErrors.school_id = 'กรุณาเลือกโรงเรียน';
    }

    // Students - check all have names
    const hasEmptyStudent = formData.student_names.some(s => !s.name || !s.name.trim());
    if (hasEmptyStudent) {
      newErrors.students = 'กรุณากรอกชื่อนักเรียนให้ครบทุกคน';
    }

    // Check student count
    const studentCount = formData.student_names.length;
    const minStudents = competition.min_students || 1;
    const maxStudents = competition.max_students || 10;
    
    if (studentCount < minStudents) {
      newErrors.students = `ต้องมีนักเรียนอย่างน้อย ${minStudents} คน`;
    } else if (studentCount > maxStudents) {
      newErrors.students = `มีนักเรียนได้สูงสุด ${maxStudents} คน`;
    }

    // ✅ Teachers - check all have names
    const hasEmptyTeacher = formData.teacher_names.some(t => !t.name || !t.name.trim());
    if (hasEmptyTeacher) {
      newErrors.teachers = 'กรุณากรอกชื่อครูให้ครบทุกคน';
    }

    // ✅ Check teacher count
    const teacherCount = formData.teacher_names.length;
    const minTeachers = competition.min_teachers || 1;
    const maxTeachers = competition.max_teachers || 5;
    
    if (teacherCount < minTeachers) {
      newErrors.teachers = `ต้องมีครูอย่างน้อย ${minTeachers} คน`;
    } else if (teacherCount > maxTeachers) {
      newErrors.teachers = `มีครูได้สูงสุด ${maxTeachers} คน`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // ✅ UPDATED: Payload with teacher_names and school_id
    const payload = {
      competition_id: competition.id,
      team_name: formData.team_name.trim(),
      student_names: formData.student_names.map(s => ({
        name: s.name.trim(),
        student_id: s.student_id?.trim() || null
      })),
      teacher_names: formData.teacher_names.map(t => ({  // ✅ เพิ่ม
        name: t.name.trim(),
        teacher_id: t.teacher_id?.trim() || null
      })),
      notes: formData.notes?.trim() || null,
    };

    // ✅ เพิ่ม school_id สำหรับ district_admin/group_admin
    if ((isDistrictAdmin() || isGroupAdmin()) && selectedSchoolId) {
      payload.school_id = selectedSchoolId;
    }

    console.log('📤 Sending Payload:', payload);
    setLoading(true);
    try {
      const response = await api.post('/registrations', payload);

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        toast.success('ลงทะเบียนสำเร็จ');
        navigate('/registrations/my');
      }
    } catch (error) {
      console.error('❌ Registration Error:', error);
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const newErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          const messages = backendErrors[key];
          newErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        
        setErrors(newErrors);
        toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
      } else {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Get status badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'รอการอนุมัติ'
      },
      approved: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'อนุมัติแล้ว'
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4" />,
        text: 'ไม่อนุมัติ'
      }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 ${badge.color} text-sm font-medium rounded-full`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  if (!competition) {
    return null;
  }

  // ✅ Show loading while checking duplicate
  if (checkingDuplicate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังตรวจสอบข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ✅ Show warning if already registered
  if (existingRegistration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/registrations/browse')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              ลงทะเบียนการแข่งขัน
            </h1>
            <p className="text-gray-600 mt-2">
              {competition.name}
            </p>
          </div>

          {/* ✅ Already Registered Warning */}
          <div className="bg-white rounded-lg border-2 border-yellow-300 shadow-lg p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  โรงเรียนของคุณได้ลงทะเบียนการแข่งขันนี้แล้ว
                </h2>
                <p className="text-gray-600">
                  ไม่สามารถลงทะเบียนซ้ำได้ กรุณาตรวจสอบการลงทะเบียนที่มีอยู่
                </p>
              </div>
            </div>

            {/* Existing Registration Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ข้อมูลการลงทะเบียนที่มีอยู่:
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">สถานะ:</span>
                  {getStatusBadge(existingRegistration.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ชื่อทีม:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {existingRegistration.team_name || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">จำนวนนักเรียน:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {existingRegistration.student_count || 0} คน
                  </span>
                </div>

                {/* ✅ แสดงจำนวนครูด้วย */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">จำนวนครู:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {existingRegistration.teacher_count || 0} คน
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ลงทะเบียนเมื่อ:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {existingRegistration.created_at 
                      ? new Date(existingRegistration.created_at).toLocaleDateString('th-TH')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {existingRegistration.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">รอการอนุมัติ</p>
                    <p>การลงทะเบียนของคุณอยู่ระหว่างการพิจารณาจากผู้ดูแลระบบ</p>
                  </div>
                </div>
              </div>
            )}

            {existingRegistration.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">อนุมัติแล้ว</p>
                    <p>การลงทะเบียนของคุณได้รับการอนุมัติแล้ว พร้อมเข้าร่วมการแข่งขัน</p>
                  </div>
                </div>
              </div>
            )}

            {existingRegistration.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">ไม่อนุมัติ</p>
                    <p>การลงทะเบียนของคุณไม่ได้รับการอนุมัติ คุณสามารถแก้ไขและส่งใหม่ได้</p>
                    {existingRegistration.rejection_reason && (
                      <p className="mt-2 p-2 bg-white rounded border border-red-200">
                        <span className="font-medium">เหตุผล: </span>
                        {existingRegistration.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/registrations/my')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>ดูรายละเอียดการลงทะเบียน</span>
              </button>

              <button
                onClick={() => navigate('/registrations/browse')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                กลับไปเลือกการแข่งขันอื่น
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show normal registration form if not registered yet
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/registrations/browse')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            ลงทะเบียนการแข่งขัน
          </h1>
          <p className="text-gray-600 mt-2">
            {competition.name}
          </p>
        </div>

        {/* Competition Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">ข้อมูลการแข่งขัน:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>หมวดหมู่: {competition.category?.name || '-'}</li>
                <li>รหัส: {competition.code || '-'}</li>
                <li>
                  จำนวนนักเรียน: {competition.min_students || 1}-{competition.max_students || 5} คน
                </li>
                <li>
                  จำนวนครู: {competition.min_teachers || 1}-{competition.max_teachers || 3} คน
                </li>
                {competition.venue && <li>สถานที่: {competition.venue}</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ School Selection - สำหรับ District Admin / Group Admin */}
          {(isDistrictAdmin() || isGroupAdmin()) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                เลือกโรงเรียน
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  โรงเรียน <span className="text-red-500">*</span>
                </label>
                {loadingSchools ? (
                  <div className="flex items-center text-gray-500 py-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    กำลังโหลดรายชื่อโรงเรียน...
                  </div>
                ) : (
                  <select
                    value={selectedSchoolId || ''}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null);
                      if (e.target.value) {
                        const newErrors = { ...errors };
                        delete newErrors.school_id;
                        setErrors(newErrors);
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.school_id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value="">-- กรุณาเลือกโรงเรียน --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.school_id && (
                  <div className="flex items-center mt-2 text-sm text-red-600">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.school_id}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  กรุณาเลือกโรงเรียนที่ต้องการลงทะเบียนแทน
                </p>
              </div>
            </div>
          )}

          {/* Team Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ข้อมูลทีม
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อทีม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => updateTeamName(e.target.value)}
                placeholder="ชื่อทีม"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.team_name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {errors.team_name && (
                <div className="flex items-center mt-2 text-sm text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.team_name}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Students - ใช้ StudentTeacherForm Component */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <StudentTeacherForm
              type="student"
              values={formData.student_names}
              onChange={(values) => setFormData({ ...formData, student_names: values })}
              min={competition.min_students || 1}
              max={competition.max_students || 10}
              disabled={loading}
            />
            {errors.students && (
              <div className="flex items-center mt-4 text-sm text-red-600">
                <XCircle className="w-4 h-4 mr-1" />
                {errors.students}
              </div>
            )}
          </div>

          {/* ✅ Teachers - ใช้ StudentTeacherForm Component */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <StudentTeacherForm
              type="teacher"
              values={formData.teacher_names}
              onChange={(values) => setFormData({ ...formData, teacher_names: values })}
              min={competition.min_teachers || 1}
              max={competition.max_teachers || 5}
              disabled={loading}
            />
            {errors.teachers && (
              <div className="flex items-center mt-4 text-sm text-red-600">
                <XCircle className="w-4 h-4 mr-1" />
                {errors.teachers}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              หมายเหตุ
            </h3>
            
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={4}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/registrations/browse')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>ลงทะเบียน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
