import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import twoTierCompetitionService from '@/lib/api/twoTierCompetition-service';
import apiClient from '@/lib/api/axios-interceptor';

/**
 * 🎯 สร้าง Master Competition
 * 
 * ไฟล์: frontend/src/pages/competitions/CreateMasterCompetition.jsx
 * 
 * ✅ ใช้ apiClient ที่มี Interceptor:
 * - Auto redirect on 401
 * - Show error toast
 */
export default function CreateMasterCompetition() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    competition_type: 'individual',
    level: '',
    max_students: 1,
    max_teachers: 1,
    max_judges: 3,
    start_date: '',
    end_date: '',
    registration_start_date: '',
    registration_end_date: '',
    advancement_slots: 2,
    venue: '',
    rules: '',
    description: ''
  });

  // โหลดหมวดหมู่
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // ✅ ใช้ apiClient (มี interceptor)
      const response = await apiClient.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      // interceptor จะจัดการ toast และ redirect แล้ว
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.code || !formData.category_id) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      setLoading(true);
      
      await twoTierCompetitionService.createMasterCompetition(formData);
      
      toast.success('สร้าง Master Competition สำเร็จ');
      
      // Navigate back to list
      navigate('/competitions/master');
      
    } catch (error) {
      // interceptor จะจัดการ 401 แล้ว
      // แต่ error อื่นๆ แสดง toast
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้าง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/competitions/master')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          กลับ
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">
          สร้าง Master Competition
        </h1>
        <p className="text-gray-600 mt-1">
          สร้างการแข่งขันระดับเขต (Master) แล้วเปิดให้ทุกกลุ่มในภายหลัง
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        
        {/* ข้อมูลพื้นฐาน */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ข้อมูลพื้นฐาน
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อการแข่งขัน */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อการแข่งขัน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น คัดลายมือสื่อภาษาไทย (ป.1-3)"
                required
              />
            </div>

            {/* รหัสการแข่งขัน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสการแข่งขัน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น COMP-001"
                required
              />
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ประเภท */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท
              </label>
              <select
                name="competition_type"
                value={formData.competition_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="individual">เดี่ยว</option>
                <option value="team">ทีม</option>
              </select>
            </div>

            {/* ระดับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับชั้น
              </label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น ป.1-3, ม.1-3"
              />
            </div>
          </div>
        </div>

        {/* จำนวนผู้เข้าร่วม */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            จำนวนผู้เข้าร่วม
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                นักเรียน (คน)
              </label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ครูผู้ฝึกสอน (คน)
              </label>
              <input
                type="number"
                name="max_teachers"
                value={formData.max_teachers}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กรรมการ (คน)
              </label>
              <input
                type="number"
                name="max_judges"
                value={formData.max_judges}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* วันที่ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            วันที่สำคัญ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเริ่มแข่งขัน
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันสิ้นสุด
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เปิดรับสมัคร
              </label>
              <input
                type="date"
                name="registration_start_date"
                value={formData.registration_start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปิดรับสมัคร
              </label>
              <input
                type="date"
                name="registration_end_date"
                value={formData.registration_end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ข้อมูลเพิ่มเติม
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนคนที่ผ่านรอบกลุ่ม
              </label>
              <input
                type="number"
                name="advancement_slots"
                value={formData.advancement_slots}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                จำนวนคนที่จะผ่านจากแต่ละกลุ่มมาแข่งขันระดับเขต (แนะนำ 2 คน)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานที่แข่งขัน
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น สพม.นครปฐม เขต 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กติกา/เงื่อนไข
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ระบุกติกาและเงื่อนไขการแข่งขัน"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'กำลังสร้าง...' : 'สร้างการแข่งขัน'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/competitions/master')}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
