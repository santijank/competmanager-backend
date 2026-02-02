import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { competitionService, categoryService } from '@/lib/api';

export default function CompetitionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
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
    registration_status: 'draft',
    is_active: false,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [competitionRes, categoriesRes] = await Promise.all([
        competitionService.getById(id),
        categoryService.getAll(),
      ]);
      
      const competition = competitionRes.data.data;
      setFormData({
        name: competition.name || '',
        code: competition.code || '',
        category_id: competition.category_id || '',
        competition_type: competition.competition_type || 'regular',
        level: competition.level || '',
        description: competition.description || '',
        rules: competition.rules || '',
        max_students: competition.max_students || 1,
        max_teachers: competition.max_teachers || 1,
        max_judges: competition.max_judges || 3,
        start_date: competition.start_date || '',
        end_date: competition.end_date || '',
        registration_start_date: competition.registration_start_date || '',
        registration_end_date: competition.registration_end_date || '',
        venue: competition.venue || '',
        contact_person: competition.contact_person || '',
        contact_phone: competition.contact_phone || '',
        contact_email: competition.contact_email || '',
        registration_status: competition.registration_status || 'draft',
        is_active: competition.is_active || false,
      });
      
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      navigate('/competitions');
    } finally {
      setLoading(false);
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
    setSaving(true);

    try {
      const data = {
        ...formData,
        category_id: parseInt(formData.category_id),
        max_students: parseInt(formData.max_students),
        max_teachers: parseInt(formData.max_teachers),
        max_judges: parseInt(formData.max_judges),
      };

      await competitionService.update(id, data);
      toast.success('แก้ไขการแข่งขันสำเร็จ');
      navigate(`/competitions/${id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถแก้ไขการแข่งขันได้';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/competitions/${id}`)}
          className="btn btn-outline mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขการแข่งขัน</h1>
          <p className="text-gray-600 mt-1">{formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลพื้นฐาน */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อการแข่งขัน */}
            <div className="md:col-span-2">
              <label htmlFor="name">ชื่อการแข่งขัน <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* รหัส */}
            <div>
              <label htmlFor="code">รหัส <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label htmlFor="category_id">หมวดหมู่ <span className="text-red-500">*</span></label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ประเภท */}
            <div>
              <label htmlFor="competition_type">ประเภทการแข่งขัน</label>
              <select
                id="competition_type"
                name="competition_type"
                value={formData.competition_type}
                onChange={handleChange}
              >
                <option value="regular">ทั่วไป</option>
                <option value="special">พิเศษ</option>
              </select>
            </div>

            {/* ระดับ */}
            <div>
              <label htmlFor="level">ระดับชั้น</label>
              <input
                type="text"
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder="เช่น ป.1-3"
              />
            </div>
          </div>
        </div>

        {/* สถานะการแข่งขัน */}
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">🎯 สถานะการแข่งขัน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* สถานะการลงทะเบียน */}
            <div>
              <label htmlFor="registration_status">
                สถานะการลงทะเบียน <span className="text-red-500">*</span>
              </label>
              <select
                id="registration_status"
                name="registration_status"
                value={formData.registration_status}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="draft">ร่าง (Draft)</option>
                <option value="open">เปิดลงทะเบียน (Open)</option>
                <option value="closed">ปิดลงทะเบียน (Closed)</option>
              </select>
              <p className="text-sm text-blue-600 mt-1">
                {formData.registration_status === 'open' && '✅ ครูสามารถลงทะเบียนได้'}
                {formData.registration_status === 'closed' && '🔒 ปิดรับสมัครแล้ว'}
                {formData.registration_status === 'draft' && '📝 ยังไม่เปิดรับสมัคร'}
              </p>
            </div>

            {/* สถานะการใช้งาน */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  เปิดใช้งานการแข่งขัน
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">
                {formData.is_active ? '✅ กิจกรรมเปิดใช้งาน' : '⚠️ กิจกรรมปิดใช้งาน'}
              </p>
            </div>
          </div>
        </div>

        {/* จำนวนผู้เข้าร่วม */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">จำนวนผู้เข้าร่วม</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="max_students">นักเรียนสูงสุด</label>
              <input
                type="number"
                id="max_students"
                name="max_students"
                min="1"
                value={formData.max_students}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="max_teachers">ครูสูงสุด</label>
              <input
                type="number"
                id="max_teachers"
                name="max_teachers"
                min="1"
                value={formData.max_teachers}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="max_judges">กรรมการสูงสุด</label>
              <input
                type="number"
                id="max_judges"
                name="max_judges"
                min="1"
                value={formData.max_judges}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* วันที่ */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">วันที่จัดการแข่งขัน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date">วันที่เริ่ม</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="end_date">วันที่สิ้นสุด</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="registration_start_date">เปิดรับสมัคร</label>
              <input
                type="date"
                id="registration_start_date"
                name="registration_start_date"
                value={formData.registration_start_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="registration_end_date">ปิดรับสมัคร</label>
              <input
                type="date"
                id="registration_end_date"
                name="registration_end_date"
                value={formData.registration_end_date}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* รายละเอียด */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">รายละเอียด</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="description">คำอธิบาย</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="คำอธิบายการแข่งขัน"
              />
            </div>

            <div>
              <label htmlFor="rules">กติกา/ระเบียบ</label>
              <textarea
                id="rules"
                name="rules"
                rows="4"
                value={formData.rules}
                onChange={handleChange}
                placeholder="กติกาและระเบียบการแข่งขัน"
              />
            </div>
          </div>
        </div>

        {/* สถานที่และผู้ติดต่อ */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">สถานที่และผู้ติดต่อ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="venue">สถานที่จัด</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="ชื่อสถานที่"
              />
            </div>

            <div>
              <label htmlFor="contact_person">ผู้ติดต่อ</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="contact_phone">เบอร์โทร</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="contact_email">อีเมล</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/competitions/${id}`)}
            className="btn btn-outline"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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