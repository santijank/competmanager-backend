import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { resultService, competitionService, registrationService } from '@/lib/api';

export default function ResultCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  const [formData, setFormData] = useState({
    competition_id: '',
    registration_id: '',
    level: 'group',
    score: '',
    comments: '',
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (formData.competition_id) {
      fetchRegistrations(formData.competition_id);
    }
  }, [formData.competition_id]);

  const fetchCompetitions = async () => {
    try {
      const response = await competitionService.getAll({ is_active: true });
      setCompetitions(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลการแข่งขันได้');
    }
  };

  const fetchRegistrations = async (competitionId) => {
    try {
      const response = await registrationService.getAll({
        competition_id: competitionId,
        status: 'approved',
      });
      setRegistrations(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลการลงทะเบียนได้');
    }
  };

  const handleCompetitionChange = (competitionId) => {
    const competition = competitions.find(c => c.id === parseInt(competitionId));
    setSelectedCompetition(competition);
    setFormData({
      ...formData,
      competition_id: competitionId,
      registration_id: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.competition_id) {
      toast.error('กรุณาเลือกการแข่งขัน');
      return false;
    }
    if (!formData.registration_id) {
      toast.error('กรุณาเลือกผู้เข้าแข่งขัน');
      return false;
    }
    if (!formData.score || parseFloat(formData.score) < 0 || parseFloat(formData.score) > 100) {
      toast.error('กรุณากรอกคะแนนให้ถูกต้อง (0-100)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = {
        competition_id: parseInt(formData.competition_id),
        registration_id: parseInt(formData.registration_id),
        level: formData.level,
        score: parseFloat(formData.score),
        comments: formData.comments || '',
      };

      await resultService.create(data);
      toast.success('บันทึกผลการแข่งขันสำเร็จ');
      navigate('/results');
    } catch (error) {
      const message = error.response?.data?.message || 'ไม่สามารถบันทึกผลการแข่งขันได้';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationDisplay = (registration) => {
    const studentName = registration.students?.[0]?.name || 'ไม่ระบุ';
    const schoolName = registration.school?.name || 'ไม่ระบุ';
    return `${studentName} - ${schoolName}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/results')}
          className="btn btn-outline mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">บันทึกผลการแข่งขัน</h1>
          <p className="text-gray-600 mt-1">กรอกคะแนนผลการแข่งขัน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">ข้อมูลผลการแข่งขัน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competition */}
            <div className="md:col-span-2">
              <label htmlFor="competition_id">
                การแข่งขัน <span className="text-red-500">*</span>
              </label>
              <select
                id="competition_id"
                name="competition_id"
                value={formData.competition_id}
                onChange={(e) => handleCompetitionChange(e.target.value)}
                required
              >
                <option value="">-- เลือกการแข่งขัน --</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Registration */}
            <div className="md:col-span-2">
              <label htmlFor="registration_id">
                ผู้เข้าแข่งขัน <span className="text-red-500">*</span>
              </label>
              <select
                id="registration_id"
                name="registration_id"
                value={formData.registration_id}
                onChange={handleChange}
                disabled={!formData.competition_id}
                required
              >
                <option value="">-- เลือกผู้เข้าแข่งขัน --</option>
                {registrations.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {getRegistrationDisplay(reg)}
                  </option>
                ))}
              </select>
              {!formData.competition_id && (
                <p className="text-sm text-gray-500 mt-1">
                  กรุณาเลือกการแข่งขันก่อน
                </p>
              )}
              {formData.competition_id && registrations.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  ไม่พบการลงทะเบียนที่อนุมัติแล้วสำหรับการแข่งขันนี้
                </p>
              )}
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level">
                ระดับ <span className="text-red-500">*</span>
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="group">กลุ่มโรงเรียน</option>
                <option value="district">เขตพื้นที่</option>
              </select>
            </div>

            {/* Score */}
            <div>
              <label htmlFor="score">
                คะแนน (0-100) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="score"
                name="score"
                min="0"
                max="100"
                step="0.01"
                value={formData.score}
                onChange={handleChange}
                placeholder="95.50"
                required
              />
            </div>

            {/* Comments */}
            <div className="md:col-span-2">
              <label htmlFor="comments">ความคิดเห็น</label>
              <textarea
                id="comments"
                name="comments"
                rows="3"
                value={formData.comments}
                onChange={handleChange}
                placeholder="ระบุความคิดเห็นเพิ่มเติม (ถ้ามี)"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📌 หมายเหตุ</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>คะแนนจะถูกใช้ในการคำนวณอันดับอัตโนมัติ</li>
            <li>สามารถมอบเหรียญได้หลังจากคำนวณอันดับแล้ว</li>
            <li>ระดับกลุ่มโรงเรียน: ผู้ชนะจะได้เข้าแข่งขันระดับเขตพื้นที่</li>
            <li>ระดับเขตพื้นที่: จะมีการมอบเหรียญทอง เงิน ทองแดง</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/results')}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                บันทึกผล
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
