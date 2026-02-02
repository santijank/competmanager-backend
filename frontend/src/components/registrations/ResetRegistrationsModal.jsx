import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, RefreshCw, Building2, Globe, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * 🔄 ResetRegistrationsModal
 *
 * Modal สำหรับรีเซ็ตข้อมูลการลงทะเบียน
 * - Group Admin: รีเซ็ตได้เฉพาะกลุ่มตัวเอง
 * - District Admin: เลือกรีเซ็ตตามระดับ หรือ กลุ่ม
 */
export default function ResetRegistrationsModal({ isOpen, onClose, onSuccess }) {
  const { user, isDistrictAdmin, isGroupAdmin } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [preview, setPreview] = useState(null);

  // Options สำหรับ District Admin
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [schoolGroups, setSchoolGroups] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setPreview(null);
      setSelectedLevel('');
      setSelectedGroupId('');

      if (isDistrictAdmin()) {
        loadSchoolGroups();
      } else if (isGroupAdmin()) {
        // Group Admin - โหลด preview ทันที
        loadPreview();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // โหลด preview เมื่อเปลี่ยน filter (สำหรับ District Admin)
    if (isOpen && isDistrictAdmin()) {
      loadPreview();
    }
  }, [selectedLevel, selectedGroupId]);

  const loadSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      if (response.data.success) {
        setSchoolGroups(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load school groups:', error);
    }
  };

  const loadPreview = async () => {
    try {
      setLoadingPreview(true);

      const params = {};
      if (isDistrictAdmin()) {
        if (selectedLevel) params.competition_level = selectedLevel;
        if (selectedGroupId) params.school_group_id = selectedGroupId;
      }

      const response = await api.get('/registrations/reset-preview', { params });

      if (response.data.success) {
        setPreview(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      toast.error('กรุณาพิมพ์ RESET เพื่อยืนยัน');
      return;
    }

    if (preview?.total === 0) {
      toast.warning('ไม่มีข้อมูลที่จะรีเซ็ต');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        confirm_text: confirmText,
      };

      if (isDistrictAdmin()) {
        if (selectedLevel) payload.competition_level = selectedLevel;
        if (selectedGroupId) payload.school_group_id = parseInt(selectedGroupId);
      }

      const response = await api.post('/registrations/reset', payload);

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการรีเซ็ต');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canReset = confirmText === 'RESET' && preview?.total > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">รีเซ็ตข้อมูลการลงทะเบียน</h2>
                <p className="text-red-100 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">คำเตือน!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>ข้อมูลการลงทะเบียนทั้งหมดจะถูกลบอย่างถาวร</li>
                  <li>ไม่สามารถกู้คืนข้อมูลได้หลังจากรีเซ็ต</li>
                  <li>โรงเรียนจะต้องลงทะเบียนใหม่ทั้งหมด</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filter Options สำหรับ District Admin */}
          {isDistrictAdmin() && (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-600" />
                ตัวเลือกการรีเซ็ต
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* เลือกระดับ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับการแข่งขัน
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">ทุกระดับ</option>
                    <option value="group">ระดับกลุ่ม</option>
                    <option value="district">ระดับเขต</option>
                  </select>
                </div>

                {/* เลือกกลุ่ม */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    กลุ่มโรงเรียน
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={selectedLevel === 'district'}
                  >
                    <option value="">ทุกกลุ่ม</option>
                    {schoolGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* แสดง filter ที่เลือก */}
              <div className="flex items-center gap-2 text-sm">
                {selectedLevel === 'group' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    ระดับกลุ่ม
                  </span>
                )}
                {selectedLevel === 'district' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    ระดับเขต
                  </span>
                )}
                {selectedGroupId && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded">
                    กลุ่ม: {schoolGroups.find(g => g.id === parseInt(selectedGroupId))?.name}
                  </span>
                )}
                {!selectedLevel && !selectedGroupId && (
                  <span className="text-red-600 font-medium">
                    ⚠️ จะรีเซ็ตข้อมูลทั้งหมด
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Info สำหรับ Group Admin */}
          {isGroupAdmin() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">คุณกำลังจะรีเซ็ตข้อมูลของกลุ่มตัวเอง</p>
                  <p className="text-blue-600 mt-1">ข้อมูลการลงทะเบียนทุกโรงเรียนในกลุ่มจะถูกลบ</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลที่จะถูกลบ</h3>

            {loadingPreview ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-500">กำลังโหลด...</span>
              </div>
            ) : preview ? (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-gray-900">{preview.total}</p>
                  <p className="text-xs text-gray-500">ทั้งหมด</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-600">{preview.pending}</p>
                  <p className="text-xs text-yellow-600">รอการอนุมัติ</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{preview.approved}</p>
                  <p className="text-xs text-green-600">อนุมัติแล้ว</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-2xl font-bold text-red-600">{preview.rejected}</p>
                  <p className="text-xs text-red-600">ไม่อนุมัติ</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">ไม่สามารถโหลดข้อมูลได้</p>
            )}
          </div>

          {/* Confirm Input */}
          <div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder=""
              className={`w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-bold transition-colors ${
                confirmText === 'RESET'
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600'
              }`}
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleReset}
            disabled={!canReset || loading}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              canReset
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                กำลังรีเซ็ต...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                รีเซ็ตข้อมูล ({preview?.total || 0} รายการ)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
