import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import TwoStepCompetitionSelect from '@/components/committee/TwoStepCompetitionSelect';

const emptyRow = () => ({
  name: '',
  position: '',
  organization: '',
  responsibility: '',
});

const CommitteeMemberModal = ({ isOpen, member, defaultLevel = 'group', onClose, onSuccess }) => {
  const { user } = useAuthStore();

  // Shared fields (apply to all members in batch mode)
  const [sharedData, setSharedData] = useState({
    member_type: 'committee',
    level: 'group',
    competition_id: '',
    note: '',
    is_active: true,
  });

  // Single mode fields (for editing)
  const [singleData, setSingleData] = useState({
    name: '',
    position: '',
    organization: '',
    responsibility: '',
  });

  // Batch mode rows
  const [rows, setRows] = useState([emptyRow()]);

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!member;
  // Batch mode: เฉพาะตอนสร้างใหม่ + ประเภทคณะกรรมการ
  const isBatchMode = !isEditMode && sharedData.member_type === 'committee';

  useEffect(() => {
    if (isOpen) {
      loadCompetitions();

      if (member) {
        // Edit mode - single entry
        setSingleData({
          name: member.name || '',
          position: member.position || '',
          organization: member.organization || '',
          responsibility: member.responsibility || '',
        });
        setSharedData({
          member_type: member.member_type || 'committee',
          level: member.level || 'group',
          competition_id: member.competition_id || '',
          note: member.note || '',
          is_active: member.is_active !== undefined ? member.is_active : true,
        });
      } else {
        // Create mode
        setSingleData({
          name: '',
          position: '',
          organization: '',
          responsibility: '',
        });
        setSharedData({
          member_type: 'committee',
          level: defaultLevel,
          competition_id: '',
          note: '',
          is_active: true,
        });
        setRows([emptyRow(), emptyRow(), emptyRow()]);
      }
    }
  }, [isOpen, member]);

  const loadCompetitions = async () => {
    try {
      const response = await api.get('/committee-members/competitions');
      const comps = response.data.data || [];

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

  // Batch row handlers
  const addRow = () => {
    setRows([...rows, emptyRow()]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // Update single member
        const payload = { ...sharedData, ...singleData };
        await api.put(`/committee-members/${member.id}`, payload);
        toast.success('แก้ไขข้อมูลสำเร็จ');
      } else if (isBatchMode) {
        // Batch create
        const validRows = rows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) {
          toast.error('กรุณากรอกชื่ออย่างน้อย 1 คน');
          setLoading(false);
          return;
        }
        await api.post('/committee-members/batch', {
          members: validRows,
          member_type: sharedData.member_type,
          level: sharedData.level,
          competition_id: sharedData.competition_id || null,
          note: sharedData.note || null,
        });
        toast.success(`เพิ่มคณะกรรมการ ${validRows.length} คนสำเร็จ`);
      } else {
        // Single create (staff, volunteer)
        const payload = { ...sharedData, ...singleData };
        await api.post('/committee-members', payload);
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
      <div className={`bg-white rounded-lg shadow-xl w-full ${isBatchMode ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'แก้ไขคณะทำงาน' : 'เพิ่มคณะทำงาน'}
            </h2>
            {isBatchMode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                <Users className="w-3 h-3" />
                เพิ่มหลายคน
              </span>
            )}
          </div>
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

            {/* Member Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                value={sharedData.member_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setSharedData({
                    ...sharedData,
                    member_type: newType,
                    competition_id: newType === 'staff' ? '' : sharedData.competition_id,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="committee">คณะกรรมการ</option>
                <option value="staff">คณะกรรมการดำเนินงาน</option>
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
                  sharedData.level === 'group'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${user?.role === 'group_admin' ? 'opacity-100' : ''}`}>
                  <input
                    type="radio"
                    name="level"
                    value="group"
                    checked={sharedData.level === 'group'}
                    onChange={(e) => setSharedData({ ...sharedData, level: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={user?.role === 'group_admin'}
                  />
                  <div>
                    <span className="font-medium text-blue-700">ระดับกลุ่ม</span>
                    <p className="text-xs text-gray-500">คณะทำงานในระดับกลุ่มโรงเรียน</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  sharedData.level === 'district'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${user?.role === 'group_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="level"
                    value="district"
                    checked={sharedData.level === 'district'}
                    onChange={(e) => setSharedData({ ...sharedData, level: e.target.value })}
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

            {/* Competition - ซ่อนเมื่อเป็นคณะกรรมการดำเนินงาน */}
            {sharedData.member_type !== 'staff' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การแข่งขัน (ถ้ามี)
                </label>
                <TwoStepCompetitionSelect
                  value={sharedData.competition_id}
                  onChange={(value) => setSharedData({ ...sharedData, competition_id: value })}
                  competitions={competitions}
                />
                <p className="mt-2 text-xs text-gray-500">
                  เลือกหมวดหมู่ก่อน แล้วค่อยเลือกการแข่งขัน หรือเว้นว่างสำหรับคณะทำงานทั่วไป
                </p>
              </div>
            )}

            {/* ========== BATCH MODE: Multiple Rows ========== */}
            {isBatchMode && !isEditMode && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    รายชื่อคณะกรรมการ <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มแถว
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Header row */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-3">ชื่อ-นามสกุล *</div>
                    <div className="col-span-3">ตำแหน่ง</div>
                    <div className="col-span-2">สังกัด</div>
                    <div className="col-span-2">หน้าที่</div>
                    <div className="col-span-1"></div>
                  </div>

                  {rows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg">
                      <div className="col-span-1 flex items-center justify-center pt-2">
                        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(index, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="ชื่อ-นามสกุล"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={row.position}
                          onChange={(e) => updateRow(index, 'position', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="เช่น ประธาน, กรรมการ"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={row.organization}
                          onChange={(e) => updateRow(index, 'organization', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="สังกัด"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={row.responsibility}
                          onChange={(e) => updateRow(index, 'responsibility', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="หน้าที่"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={rows.length <= 1}
                          className="p-1 text-red-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                          title="ลบแถว"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  กรอกเฉพาะแถวที่ต้องการ แถวที่ชื่อว่างจะถูกข้ามอัตโนมัติ
                </p>
              </div>
            )}

            {/* ========== SINGLE MODE: One Entry ========== */}
            {(!isBatchMode || isEditMode) && (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={singleData.name}
                    onChange={(e) => setSingleData({ ...singleData, name: e.target.value })}
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
                    value={singleData.position}
                    onChange={(e) => setSingleData({ ...singleData, position: e.target.value })}
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
                    value={singleData.organization}
                    onChange={(e) => setSingleData({ ...singleData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น สพป.นครปฐม เขต 1, โรงเรียนวัดดอนยายหอม"
                  />
                </div>

                {/* Responsibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หน้าที่รับผิดชอบ
                  </label>
                  <input
                    type="text"
                    value={singleData.responsibility}
                    onChange={(e) => setSingleData({ ...singleData, responsibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น ตัดสินกิจกรรม, ประสานงาน, ดูแลสถานที่"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    ข้อมูลนี้จะถูกใช้ในการออกเกียรติบัตร
                  </p>
                </div>
              </>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={sharedData.note}
                onChange={(e) => setSharedData({ ...sharedData, note: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            {/* Is Active - เฉพาะ edit mode */}
            {isEditMode && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={sharedData.is_active}
                  onChange={(e) => setSharedData({ ...sharedData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  ใช้งาน (แสดงในระบบ)
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {isBatchMode && (
                <span>จำนวนที่จะเพิ่ม: <strong className="text-blue-600">{rows.filter(r => r.name.trim() !== '').length}</strong> คน</span>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                {loading ? 'กำลังบันทึก...' : isBatchMode ? 'บันทึกทั้งหมด' : 'บันทึก'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommitteeMemberModal;
