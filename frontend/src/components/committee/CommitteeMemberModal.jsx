import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import TwoStepCompetitionSelect from '@/components/committee/TwoStepCompetitionSelect';

const CommitteeMemberModal = ({ isOpen, member, defaultLevel = 'group', onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    organization: '',
    member_type: 'committee',
    level: 'group',           // ระดับกลุ่ม หรือ เขต
    competition_id: '',
    note: '',
    is_active: true,
  });
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load competitions
      loadCompetitions();
      
      if (member) {
        setFormData({
          name: member.name || '',
          position: member.position || '',
          organization: member.organization || '',
          member_type: member.member_type || 'committee',
          level: member.level || 'group',
          competition_id: member.competition_id || '',
          note: member.note || '',
          is_active: member.is_active !== undefined ? member.is_active : true,
        });
      } else {
        setFormData({
          name: '',
          position: '',
          organization: '',
          member_type: 'committee',
          level: defaultLevel, // ใช้ค่าจาก prop
          competition_id: '',
          note: '',
          is_active: true,
        });
      }
    }
  }, [isOpen, member]);

  const loadCompetitions = async () => {
    try {
      // ใช้ endpoint ใหม่ที่ไม่มี role-based filtering
      const response = await api.get('/committee-members/competitions');
      const comps = response.data.data || [];

      // จัดกลุ่มตาม category
      const grouped = {};
      comps.forEach(comp => {
        const categoryName = comp.category?.name || 'อื่นๆ';
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(comp);
      });

      setCompetitions(grouped);
    } catch (error) {
      console.error('Load competitions error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (member) {
        // Update
        await api.put(`/committee-members/${member.id}`, formData);
        toast.success('แก้ไขข้อมูลสำเร็จ');
      } else {
        // Create
        await api.post('/committee-members', formData);
        toast.success('เพิ่มคณะทำงานสำเร็จ');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {member ? 'แก้ไขคณะทำงาน' : 'เพิ่มคณะทำงาน'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น นายสมชาย ใจดี"
                required
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตำแหน่ง
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น ประธานคณะกรรมการ, กรรมการ"
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สังกัด
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น สพป.นครปฐม เขต 1, โรงเรียนวัดดอนยายหอม"
              />
            </div>

            {/* Member Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.member_type}
                onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="committee">คณะกรรมการ</option>
                <option value="staff">เจ้าหน้าที่</option>
                <option value="volunteer">อาสาสมัคร</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.level === 'group'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${user?.role === 'group_admin' ? 'opacity-100' : ''}`}>
                  <input
                    type="radio"
                    name="level"
                    value="group"
                    checked={formData.level === 'group'}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={user?.role === 'group_admin'}
                  />
                  <div>
                    <span className="font-medium text-blue-700">ระดับกลุ่ม</span>
                    <p className="text-xs text-gray-500">คณะทำงานในระดับกลุ่มโรงเรียน</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.level === 'district'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${user?.role === 'group_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="level"
                    value="district"
                    checked={formData.level === 'district'}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-4 h-4 text-purple-600"
                    disabled={user?.role === 'group_admin'}
                  />
                  <div>
                    <span className="font-medium text-purple-700">ระดับเขตพื้นที่</span>
                    <p className="text-xs text-gray-500">คณะทำงานในระดับเขตพื้นที่</p>
                  </div>
                </label>
              </div>
              {user?.role === 'group_admin' && (
                <p className="mt-2 text-xs text-amber-600">
                  * ผู้ดูแลกลุ่มสามารถเพิ่มคณะทำงานได้เฉพาะระดับกลุ่มเท่านั้น
                </p>
              )}
            </div>

            {/* Competition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การแข่งขัน (ถ้ามี)
              </label>
              <TwoStepCompetitionSelect
                value={formData.competition_id}
                onChange={(value) => setFormData({ ...formData, competition_id: value })}
                competitions={competitions}
              />
              <p className="mt-2 text-xs text-gray-500">
                เลือกหมวดหมู่ก่อน แล้วค่อยเลือกการแข่งขัน หรือเว้นว่างสำหรับคณะทำงานทั่วไป
              </p>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                ใช้งาน (แสดงในระบบ)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
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

export default CommitteeMemberModal;
