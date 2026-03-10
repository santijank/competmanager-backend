import { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const PERMISSION_GROUPS = [
  {
    label: 'การลงทะเบียน',
    icon: '📝',
    items: [
      { key: 'perm_registration_create', label: 'เปิดให้ลงทะเบียนใหม่' },
      { key: 'perm_registration_edit', label: 'แก้ไขการลงทะเบียน' },
      { key: 'perm_registration_delete', label: 'ลบการลงทะเบียน' },
    ],
  },
  {
    label: 'คะแนน/ผลการแข่งขัน',
    icon: '📊',
    items: [
      { key: 'perm_score_entry', label: 'บันทึกคะแนน' },
      { key: 'perm_score_edit', label: 'แก้ไขคะแนน' },
      { key: 'perm_result_publish', label: 'เผยแพร่ผลการแข่งขัน' },
    ],
  },
  {
    label: 'เกียรติบัตร',
    icon: '🏆',
    items: [
      { key: 'perm_certificate_generate', label: 'สร้างเกียรติบัตร' },
      { key: 'perm_certificate_download', label: 'ดาวน์โหลดเกียรติบัตร' },
    ],
  },
  {
    label: 'การแข่งขัน',
    icon: '🏅',
    items: [
      { key: 'perm_competition_crud', label: 'สร้าง/แก้ไขกิจกรรม' },
    ],
  },
  {
    label: 'ตาราง',
    icon: '📅',
    items: [
      { key: 'perm_schedule_edit', label: 'แก้ไขตาราง' },
    ],
  },
  {
    label: 'การเปลี่ยนตัว',
    icon: '🔄',
    items: [
      { key: 'perm_participant_change', label: 'เปลี่ยนตัวผู้เข้าแข่งขัน' },
    ],
  },
];

export default function PermissionSwitches() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key ที่กำลัง save

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/system-settings/permissions');
      setPermissions(response.data.data || {});
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลสิทธิ์ได้');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (key) => {
    const newValue = !permissions[key];
    setSaving(key);

    // Optimistic update
    setPermissions((prev) => ({ ...prev, [key]: newValue }));

    try {
      await api.put('/system-settings/permissions', {
        permissions: { [key]: newValue },
      });
      toast.success(newValue ? 'เปิดสิทธิ์แล้ว' : 'ปิดสิทธิ์แล้ว');
    } catch (error) {
      // Revert on error
      setPermissions((prev) => ({ ...prev, [key]: !newValue }));
      toast.error('ไม่สามารถบันทึกได้');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" />
          ตั้งค่าสิทธิ์ระบบ
        </h1>
        <p className="text-gray-500 mt-1">เปิด/ปิดระบบการทำงานต่างๆ</p>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          admin / district_admin ไม่ได้รับผลกระทบจากการปิดสิทธิ์
        </div>
      </div>

      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>{group.icon}</span>
                {group.label}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => {
                const isOn = permissions[item.key] !== false;
                const isSaving = saving === item.key;

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-700">{item.label}</span>
                    <button
                      onClick={() => togglePermission(item.key)}
                      disabled={isSaving}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : isOn ? (
                        <ToggleRight className="w-10 h-10 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                      <span
                        className={`text-sm font-medium w-8 ${
                          isOn ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {isOn ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        การตั้งค่านี้มีผลทันที
      </div>
    </div>
  );
}
