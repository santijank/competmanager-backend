import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, X, Calendar, Users, Trophy, Loader } from 'lucide-react';
import api from '@/lib/api';

export default function CompetitionBulkCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Common fields (ใช้ร่วมกันทั้งหมด)
  const [commonData, setCommonData] = useState({
    competition_type: 'regular',
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
    registration_status: 'open',
    is_active: true,
  });

  // Individual competitions
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    }
  };

  /**
   * ⭐ โหลด Templates จาก Backend เมื่อเลือกหมวดหมู่
   */
  const handleSelectCategory = async (category) => {
    setSelectedCategory(category);
    setLoadingTemplates(true);

    try {
      const response = await api.get(`/categories/${category.id}/templates`);
      const templates = response.data.data.templates;

      if (templates && templates.length > 0) {
        // โหลด templates มาเป็นรายการแข่งขัน
        setCompetitions(templates.map(t => ({
          ...t,
          description: '',
          rules: '',
        })));
        toast.success(`โหลดกิจกรรม ${templates.length} รายการสำเร็จ`);
      } else {
        // ถ้าไม่มี template ให้เริ่มต้น 1 รายการเปล่า
        setCompetitions([
          { name: '', code: '', level: 'ป.1-3', description: '', rules: '' }
        ]);
        toast.info('ไม่พบ Template กิจกรรม กรุณากรอกรายการเอง');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setCompetitions([
        { name: '', code: '', level: 'ป.1-3', description: '', rules: '' }
      ]);
      toast.warning('ไม่สามารถโหลด Template ได้ กรุณากรอกรายการเอง');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCompetitionChange = (index, field, value) => {
    const newCompetitions = [...competitions];
    newCompetitions[index][field] = value;
    setCompetitions(newCompetitions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!selectedCategory) {
      toast.error('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (competitions.length === 0) {
      toast.error('กรุณาเพิ่มรายการแข่งขันอย่างน้อย 1 รายการ');
      return;
    }

    if (competitions.some(c => !c.name || !c.code || !c.level)) {
      toast.error('กรุณากรอกข้อมูลการแข่งขันให้ครบถ้วน');
      return;
    }

    if (!commonData.start_date || !commonData.end_date || 
        !commonData.registration_start_date || !commonData.registration_end_date) {
      toast.error('กรุณากรอกวันที่ให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/competitions/bulk', {
        category_id: selectedCategory.id,
        common: commonData,
        competitions: competitions,
      });

      const { created, failed } = response.data.data.summary;
      
      if (failed > 0) {
        toast.warning(`สร้างสำเร็จ ${created} รายการ, ล้มเหลว ${failed} รายการ`);
      } else {
        toast.success(`สร้างการแข่งขันสำเร็จ ${created} รายการ`);
      }

      navigate('/competitions');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างการแข่งขันได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Categories */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">หมวดหมู่</h2>
          <p className="text-sm text-gray-600">เลือกหมวดหมู่การแข่งขัน</p>
        </div>

        <div className="p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelectCategory(category)}
              disabled={loadingTemplates}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors disabled:opacity-50 ${
                selectedCategory?.id === category.id
                  ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{category.name}</div>
              <div className="text-xs text-gray-500">{category.code}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">สร้างการแข่งขันทั้งหมวดหมู่</h1>
            <p className="text-gray-600 mt-1">กรอกข้อมูลรวมและรายการแข่งขันทั้งหมด</p>
          </div>

          {!selectedCategory && (
            <div className="card bg-yellow-50 border-yellow-200 mb-6">
              <p className="text-yellow-800">⚠️ กรุณาเลือกหมวดหมู่จากด้านซ้ายก่อน</p>
            </div>
          )}

          {loadingTemplates && (
            <div className="card bg-blue-50 border-blue-200 mb-6">
              <div className="flex items-center">
                <Loader className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                <p className="text-blue-800">กำลังโหลดกิจกรรม...</p>
              </div>
            </div>
          )}

          {selectedCategory && !loadingTemplates && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  ข้อมูลรวม (ใช้ร่วมกันทุกรายการ)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dates */}
                  <div>
                    <label className="label">วันเริ่มรับสมัคร *</label>
                    <input
                      type="date"
                      value={commonData.registration_start_date}
                      onChange={(e) => setCommonData({ ...commonData, registration_start_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">วันสิ้นสุดการรับสมัคร *</label>
                    <input
                      type="date"
                      value={commonData.registration_end_date}
                      onChange={(e) => setCommonData({ ...commonData, registration_end_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">วันเริ่มแข่งขัน *</label>
                    <input
                      type="date"
                      value={commonData.start_date}
                      onChange={(e) => setCommonData({ ...commonData, start_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">วันสิ้นสุดการแข่งขัน *</label>
                    <input
                      type="date"
                      value={commonData.end_date}
                      onChange={(e) => setCommonData({ ...commonData, end_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="label">จำนวนนักเรียน *</label>
                    <input
                      type="number"
                      value={commonData.max_students}
                      onChange={(e) => setCommonData({ ...commonData, max_students: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">จำนวนครู *</label>
                    <input
                      type="number"
                      value={commonData.max_teachers}
                      onChange={(e) => setCommonData({ ...commonData, max_teachers: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">จำนวนกรรมการ *</label>
                    <input
                      type="number"
                      value={commonData.max_judges}
                      onChange={(e) => setCommonData({ ...commonData, max_judges: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">สถานที่แข่งขัน</label>
                    <input
                      type="text"
                      value={commonData.venue}
                      onChange={(e) => setCommonData({ ...commonData, venue: e.target.value })}
                      className="input"
                      placeholder="โรงเรียน..."
                    />
                  </div>

                  <div>
                    <label className="label">สถานะการรับสมัคร *</label>
                    <select
                      value={commonData.registration_status}
                      onChange={(e) => setCommonData({ ...commonData, registration_status: e.target.value })}
                      className="input"
                    >
                      <option value="open">เปิดรับสมัคร</option>
                      <option value="closed">ปิดรับสมัคร</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">สถานะการใช้งาน *</label>
                    <select
                      value={commonData.is_active ? 'true' : 'false'}
                      onChange={(e) => setCommonData({ ...commonData, is_active: e.target.value === 'true' })}
                      className="input"
                    >
                      <option value="true">เปิดใช้งาน</option>
                      <option value="false">ปิดใช้งาน</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Individual Competitions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    รายการแข่งขัน ({competitions.length} รายการ)
                  </h2>
                </div>

                {competitions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่พบรายการแข่งขัน</p>
                    <p className="text-sm">เลือกหมวดหมู่ใหม่เพื่อโหลดกิจกรรม</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {competitions.map((comp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">รายการที่ {index + 1}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="label">ชื่อการแข่งขัน *</label>
                            <input
                              type="text"
                              value={comp.name}
                              onChange={(e) => handleCompetitionChange(index, 'name', e.target.value)}
                              className="input"
                              placeholder="วาดภาพระบายสี"
                              required
                            />
                          </div>

                          <div>
                            <label className="label">รหัส *</label>
                            <input
                              type="text"
                              value={comp.code}
                              onChange={(e) => handleCompetitionChange(index, 'code', e.target.value)}
                              className="input"
                              placeholder="COMP-001"
                              required
                            />
                          </div>

                          <div>
                            <label className="label">ระดับชั้น *</label>
                            <select
                              value={comp.level}
                              onChange={(e) => handleCompetitionChange(index, 'level', e.target.value)}
                              className="input"
                              required
                            >
                              <option value="ป.1-3">ป.1-3</option>
                              <option value="ป.4-6">ป.4-6</option>
                              <option value="ม.1-3">ม.1-3</option>
                              <option value="ทุกระดับ">ทุกระดับ</option>
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="label">คำอธิบาย</label>
                            <textarea
                              value={comp.description}
                              onChange={(e) => handleCompetitionChange(index, 'description', e.target.value)}
                              className="input"
                              rows="2"
                              placeholder="รายละเอียดการแข่งขัน..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/competitions')}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  <X className="h-5 w-5 mr-2" />
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || competitions.length === 0}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {loading ? 'กำลังสร้าง...' : `บันทึก (${competitions.length} รายการ)`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}