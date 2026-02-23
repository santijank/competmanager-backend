import { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, CheckCircle2, Globe, Lock, Unlock, Edit3, UserMinus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * 🔒 Registration Settings Page
 *
 * สำหรับ Group Admin ตั้งค่าช่วงเวลารับสมัคร
 * สำหรับ District Admin เปิด/ปิดรับสมัครระดับเขต
 */
export default function RegistrationSettings() {
  const { user, isDistrictAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(null);

  const [formData, setFormData] = useState({
    registration_start_date: '',
    registration_end_date: '',
    registration_announcement: '',
  });

  // State สำหรับตั้งค่าช่วงเวลาแก้ไขรายชื่อ
  const [editNameSettings, setEditNameSettings] = useState(null);
  const [editNameForm, setEditNameForm] = useState({
    edit_name_start_date: '',
    edit_name_end_date: '',
  });
  const [savingEditName, setSavingEditName] = useState(false);

  // State สำหรับเปิด/ปิดเมนูเปลี่ยนตัว
  const [participantChangeEnabled, setParticipantChangeEnabled] = useState(false);
  const [savingParticipantChange, setSavingParticipantChange] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (isDistrictAdmin || user?.role === 'admin') {
      fetchEditNameSettings();
      fetchParticipantChangeSetting();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/registrations/settings');

      setCurrentSettings(response.data.data);

      // Set form data for group admin
      if (!response.data.data.is_district_admin && response.data.data.registration_start_date) {
        setFormData({
          registration_start_date: formatDateForInput(response.data.data.registration_start_date),
          registration_end_date: formatDateForInput(response.data.data.registration_end_date),
          registration_announcement: response.data.data.registration_announcement || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchEditNameSettings = async () => {
    try {
      const response = await api.get('/system-settings/edit-name');
      setEditNameSettings(response.data.data);
      if (response.data.data.edit_name_start_date) {
        setEditNameForm({
          edit_name_start_date: formatDateForInput(response.data.data.edit_name_start_date),
          edit_name_end_date: formatDateForInput(response.data.data.edit_name_end_date),
        });
      }
    } catch (error) {
      console.error('Failed to fetch edit name settings:', error);
    }
  };

  const fetchParticipantChangeSetting = async () => {
    try {
      const response = await api.get('/system-settings/participant-change');
      setParticipantChangeEnabled(response.data.data?.enable_participant_change || false);
    } catch (error) {
      console.error('Failed to fetch participant change setting:', error);
    }
  };

  const handleToggleParticipantChange = async () => {
    try {
      setSavingParticipantChange(true);
      const newValue = !participantChangeEnabled;
      await api.put('/system-settings/participant-change', {
        enable_participant_change: newValue,
      });
      setParticipantChangeEnabled(newValue);
      toast.success(newValue ? 'เปิดเมนูเปลี่ยนตัวแล้ว' : 'ปิดเมนูเปลี่ยนตัวแล้ว');
    } catch (error) {
      console.error('Failed to toggle participant change:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingParticipantChange(false);
    }
  };

  const handleSaveEditName = async (e) => {
    e.preventDefault();

    const start = new Date(editNameForm.edit_name_start_date);
    const end = new Date(editNameForm.edit_name_end_date);

    if (end <= start) {
      toast.error('วันสิ้นสุดต้องหลังวันเริ่มต้น');
      return;
    }

    try {
      setSavingEditName(true);
      await api.put('/system-settings/edit-name', editNameForm);
      toast.success('บันทึกช่วงเวลาแก้ไขรายชื่อสำเร็จ');
      fetchEditNameSettings();
    } catch (error) {
      console.error('Failed to save edit name settings:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setSavingEditName(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // สำหรับ Group Admin
  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDate = new Date(formData.registration_start_date);
    const endDate = new Date(formData.registration_end_date);

    if (endDate <= startDate) {
      toast.error('วันสิ้นสุดต้องหลังวันเริ่มต้น');
      return;
    }

    try {
      setSaving(true);
      await api.put('/registrations/settings', formData);
      toast.success('บันทึกการตั้งค่าสำเร็จ');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
    }
  };

  // สำหรับ District Admin - เปิด/ปิดรับสมัครระดับเขต
  const handleDistrictAction = async (action) => {
    const actionText = action === 'open' ? 'เปิด' : 'ปิด';

    if (!confirm(`ต้องการ${actionText}รับสมัครระดับเขตทั้งหมดหรือไม่?`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/registrations/district-bulk-update', { action });
      toast.success(response.data.message);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update district registration:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถอัพเดทได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    not_set: 'bg-gray-100 text-gray-700',
    upcoming: 'bg-blue-100 text-blue-700',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
  };

  // ✅ UI สำหรับ District Admin
  if (currentSettings?.is_district_admin) {
    const stats = currentSettings.district_stats || { total: 0, open: 0, closed: 0 };
    const isOpen = stats.open > 0;

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Globe className="w-7 h-7 mr-3 text-purple-600" />
            กำหนดการลงทะเบียนระดับเขต
          </h1>
          <p className="text-gray-600 mt-2">
            เปิด/ปิดรับสมัครสำหรับกิจกรรมระดับเขตทั้งหมด
          </p>
        </div>

        {/* Current Status */}
        <div className={`p-6 rounded-lg mb-6 ${isOpen ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isOpen ? (
                <Unlock className="w-8 h-8 text-green-600 mr-4" />
              ) : (
                <Lock className="w-8 h-8 text-gray-500 mr-4" />
              )}
              <div>
                <p className={`text-xl font-bold ${isOpen ? 'text-green-700' : 'text-gray-700'}`}>
                  {currentSettings.status?.message}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  รวมทั้งหมด {stats.total} กิจกรรม
                </p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.open}</p>
            <p className="text-sm text-gray-600">เปิดรับสมัคร</p>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.closed}</p>
            <p className="text-sm text-gray-600">ปิดรับสมัคร</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">เปลี่ยนสถานะการรับสมัคร</h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleDistrictAction('open')}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Unlock className="w-5 h-5" />
              <span className="font-semibold">เปิดรับสมัครทั้งหมด</span>
            </button>

            <button
              onClick={() => handleDistrictAction('close')}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Lock className="w-5 h-5" />
              <span className="font-semibold">ปิดรับสมัครทั้งหมด</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            การเปลี่ยนสถานะจะมีผลกับกิจกรรมระดับเขตทั้งหมด ({stats.total} กิจกรรม)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-semibold mb-1">หมายเหตุ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>การเปิด/ปิดรับสมัครจะมีผลทันทีกับทุกกิจกรรมระดับเขต</li>
                <li>เมื่อเปิดรับสมัคร คุณสามารถลงทะเบียนให้โรงเรียนต่างๆ ได้</li>
                <li>การลงทะเบียนโดย District Admin จะได้รับการอนุมัติอัตโนมัติ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* เปิด/ปิดเมนูเปลี่ยนตัว */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserMinus className="w-5 h-5 mr-2 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">เมนูเปลี่ยนตัวผู้เข้าแข่งขัน</h3>
                <p className="text-sm text-gray-600">เปิด/ปิดให้โรงเรียนสามารถเปลี่ยนตัวนักเรียน/ครูผู้ฝึกสอนได้</p>
              </div>
            </div>
            <button
              onClick={handleToggleParticipantChange}
              disabled={savingParticipantChange}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                participantChangeEnabled ? 'bg-orange-600' : 'bg-gray-300'
              } ${savingParticipantChange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                  participantChangeEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
            participantChangeEnabled
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-gray-50 border border-gray-200 text-gray-600'
          }`}>
            {participantChangeEnabled ? 'เปิดใช้งาน — โรงเรียนสามารถเปลี่ยนตัวได้' : 'ปิดใช้งาน — โรงเรียนไม่สามารถเปลี่ยนตัวได้'}
          </div>
        </div>

        {/* ตั้งค่าช่วงเวลาเปิดแก้ไขรายชื่อ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-orange-600" />
            ตั้งค่าช่วงเวลาเปิดแก้ไขรายชื่อ
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            กำหนดช่วงเวลาที่โรงเรียนสามารถแก้ไขตัวสะกดรายชื่อนักเรียน/ครูผู้ฝึกสอนได้
          </p>

          {/* Current status */}
          {editNameSettings && (
            <div className={`p-3 rounded-lg mb-4 ${editNameSettings.is_edit_allowed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className={`text-sm font-medium ${editNameSettings.is_edit_allowed ? 'text-green-700' : 'text-gray-600'}`}>
                {editNameSettings.is_edit_allowed
                  ? 'กำลังเปิดให้แก้ไขรายชื่อ'
                  : editNameSettings.edit_name_start_date
                    ? 'ปิดให้แก้ไขรายชื่อ'
                    : 'ยังไม่ได้ตั้งค่าช่วงเวลา'
                }
              </p>
              {editNameSettings.edit_name_start_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(editNameSettings.edit_name_start_date).toLocaleString('th-TH')} — {new Date(editNameSettings.edit_name_end_date).toLocaleString('th-TH')}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSaveEditName} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันเริ่มเปิดแก้ไข <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editNameForm.edit_name_start_date}
                  onChange={(e) => setEditNameForm({ ...editNameForm, edit_name_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันปิดแก้ไข <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editNameForm.edit_name_end_date}
                  onChange={(e) => setEditNameForm({ ...editNameForm, edit_name_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex">
                <AlertCircle className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-orange-700">
                  <p>โรงเรียนจะสามารถแก้ไขได้เฉพาะตัวสะกดที่ผิดเท่านั้น ไม่สามารถเปลี่ยนชื่อ-นามสกุลหรือเพิ่ม/ลบรายชื่อได้</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingEditName}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {savingEditName ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกช่วงเวลาแก้ไขรายชื่อ
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ✅ UI สำหรับ Group Admin (เหมือนเดิม)
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-7 h-7 mr-3 text-blue-600" />
          ตั้งค่าการรับสมัคร
        </h1>
        <p className="text-gray-600 mt-2">
          กำหนดช่วงเวลาเปิด-ปิดรับสมัครสำหรับ{' '}
          <strong>{currentSettings?.school_group?.name}</strong>
        </p>
      </div>

      {/* Current Status */}
      {currentSettings?.status && (
        <div className={`p-4 rounded-lg mb-6 ${statusColors[currentSettings.status.status] || 'bg-gray-100'}`}>
          <div className="flex items-center">
            {currentSettings.status.is_open ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <div>
              <p className="font-semibold">สถานะปัจจุบัน: {currentSettings.status.message}</p>
              {currentSettings.status.ends_in_thai && (
                <p className="text-sm mt-1">{currentSettings.status.ends_in_thai}</p>
              )}
              {currentSettings.status.starts_in_thai && (
                <p className="text-sm mt-1">{currentSettings.status.starts_in_thai}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันเริ่มรับสมัคร <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.registration_start_date}
            onChange={(e) => setFormData({
              ...formData,
              registration_start_date: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            ตัวอย่าง: 04/01/2569 เวลา 00:00 น.
          </p>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันปิดรับสมัคร <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.registration_end_date}
            onChange={(e) => setFormData({
              ...formData,
              registration_end_date: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            ตัวอย่าง: 08/01/2569 เวลา 23:59 น.
          </p>
        </div>

        {/* Announcement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประกาศ (ถ้ามี)
          </label>
          <textarea
            value={formData.registration_announcement}
            onChange={(e) => setFormData({
              ...formData,
              registration_announcement: e.target.value
            })}
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="เช่น: เปิดรับสมัครแข่งขันทักษะ ปีการศึกษา 2568 กรุณาตรวจสอบรายการแข่งขันก่อนลงทะเบียน"
          />
          <p className="text-xs text-gray-500 mt-1">
            ข้อความนี้จะแสดงให้ School Admin เห็นในหน้าลงทะเบียน ({formData.registration_announcement.length}/1000)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">หมายเหตุ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>การตั้งค่านี้จะใช้กับการแข่งขันทุกรายการในกลุ่ม</li>
                <li>School Admin จะสามารถลงทะเบียนได้เฉพาะในช่วงเวลาที่กำหนด</li>
                <li>เมื่อปิดรับสมัครแล้ว School Admin จะไม่สามารถแก้ไขรายการได้</li>
                <li>คุณสามารถเปลี่ยนแปลงวันเปิด-ปิดได้ตลอดเวลา</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </form>

      {/* Last Updated */}
      {currentSettings?.configured_at && (
        <p className="text-xs text-gray-500 text-center mt-4">
          อัพเดตล่าสุด:{' '}
          {new Date(currentSettings.configured_at).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
    </div>
  );
}
