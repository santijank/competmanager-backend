import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { competitionService, categoryService, schoolGroupService } from '@/lib/api';

export default function CompetitionCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    competition_type: 'regular',
    level: '',
    description: '',
    rules: '',
    max_students: 1,
    max_teachers: 1,
    max_judges: 3,
    start_date: '',
    end_date: '',
    registration_start_date: '',
    registration_end_date: '',
    venue: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    school_group_id: '',
    registration_status: 'open',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, schoolGroupsRes] = await Promise.all([
        categoryService.getAll(),
        schoolGroupService.getAll(),
      ]);
      setCategories(categoriesRes.data.data || []);
      setSchoolGroups(schoolGroupsRes.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        category_id: parseInt(formData.category_id),
        school_group_id: formData.school_group_id ? parseInt(formData.school_group_id) : null,
        max_students: parseInt(formData.max_students),
        max_teachers: parseInt(formData.max_teachers),
        max_judges: parseInt(formData.max_judges),
      };

      await competitionService.create(data);
      toast.success('สร้างการแข่งขันสำเร็จ');
      navigate('/competitions');
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถสร้างการแข่งขันได้';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/competitions')}
          className="btn btn-outline mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สร้างการแข่งขันใหม่</h1>
          <p className="text-gray-600 mt-1">กรอกข้อมูลการแข่งขัน</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">ชื่อการแข่งขัน *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="เช่น การแข่งขันวาดภาพระบายสี"
              />
            </div>

            <div>
              <label className="label">รหัสการแข่งขัน *</label>
              <input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="input"
                placeholder="เช่น COMP2024001"
              />
            </div>

            <div>
              <label className="label">หมวดหมู่ *</label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">ระดับชั้น *</label>
              <input
                type="text"
                name="level"
                required
                value={formData.level}
                onChange={handleChange}
                className="input"
                placeholder="เช่น ป.1-3"
              />
            </div>

            <div>
              <label className="label">ประเภทการแข่งขัน</label>
              <select
                name="competition_type"
                value={formData.competition_type}
                onChange={handleChange}
                className="input"
              >
                <option value="regular">ปกติ</option>
                <option value="special">พิเศษ</option>
              </select>
            </div>

            <div>
              <label className="label">กลุ่มโรงเรียน (ถ้ามี)</label>
              <select
                name="school_group_id"
                value={formData.school_group_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">ทุกกลุ่ม</option>
                {schoolGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="label">คำอธิบาย</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input"
              placeholder="อธิบายรายละเอียดการแข่งขัน"
            ></textarea>
          </div>

          <div className="mt-6">
            <label className="label">กติกาการแข่งขัน</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              rows="4"
              className="input"
              placeholder="ระบุกติกาและเงื่อนไขการแข่งขัน"
            ></textarea>
          </div>
        </div>

        {/* Limits */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">จำนวนผู้เข้าร่วม</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">จำนวนนักเรียนสูงสุด *</label>
              <input
                type="number"
                name="max_students"
                required
                min="1"
                value={formData.max_students}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">จำนวนครูสูงสุด *</label>
              <input
                type="number"
                name="max_teachers"
                required
                min="1"
                value={formData.max_teachers}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">จำนวนกรรมการสูงสุด *</label>
              <input
                type="number"
                name="max_judges"
                required
                min="1"
                value={formData.max_judges}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">วันที่</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">วันเริ่มการแข่งขัน *</label>
              <input
                type="date"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">วันสิ้นสุดการแข่งขัน *</label>
              <input
                type="date"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">วันเริ่มรับสมัคร *</label>
              <input
                type="date"
                name="registration_start_date"
                required
                value={formData.registration_start_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">วันปิดรับสมัคร *</label>
              <input
                type="date"
                name="registration_end_date"
                required
                value={formData.registration_end_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Contact & Venue */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานที่และผู้ติดต่อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">สถานที่จัดการแข่งขัน</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="input"
                placeholder="เช่น โรงเรียนวัดใหญ่"
              />
            </div>

            <div>
              <label className="label">ชื่อผู้ติดต่อ</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">เบอร์โทรติดต่อ</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">อีเมลติดต่อ</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานะ</h2>
          <div className="space-y-4">
            <div>
              <label className="label">สถานะการรับสมัคร</label>
              <select
                name="registration_status"
                value={formData.registration_status}
                onChange={handleChange}
                className="input"
              >
                <option value="open">เปิดรับสมัคร</option>
                <option value="closed">ปิดรับสมัคร</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                เปิดใช้งาน
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="btn btn-outline"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                บันทึก
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}