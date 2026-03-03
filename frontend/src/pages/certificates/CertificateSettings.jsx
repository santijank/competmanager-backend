import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Upload, Trash2, Image, PenLine, Building2, Users, Hash, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import api, { certificateService } from '@/lib/api';

/** Sub-component: แถวตั้งค่าเลขรัน */
function NumberSettingRow({ setting, onChange, onSave, saving }) {
  const typeLabels = {
    student: 'นักเรียน',
    teacher: 'ครูผู้ฝึกสอน',
    committee: 'กก.ตัดสิน',
    staff: 'กก.ดำเนินการ',
  };
  const typeColors = {
    student: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    committee: 'bg-purple-100 text-purple-700',
    staff: 'bg-teal-100 text-teal-700',
  };
  const typeLabel = typeLabels[setting.type] || setting.type;
  const typeColor = typeColors[setting.type] || 'bg-gray-100 text-gray-700';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
        {typeLabel}
      </span>
      <div className="flex-1 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Prefix</label>
          <input
            type="text"
            value={setting.prefix}
            onChange={(e) => onChange(setting.id, 'prefix', e.target.value)}
            className="w-40 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">ปี พ.ศ.</label>
          <input
            type="text"
            value={setting.year}
            onChange={(e) => onChange(setting.id, 'year', e.target.value)}
            className="w-24 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">เลขรันล่าสุด</label>
          <input
            type="number"
            value={setting.last_number}
            onChange={(e) => onChange(setting.id, 'last_number', e.target.value)}
            className="w-24 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            min="0"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 mr-2">
        ถัดไป: <span className="font-mono font-medium text-gray-800">{setting.prefix}{String(parseInt(setting.last_number || 0) + 1).padStart(4, '0')}/{setting.year}</span>
      </div>
      <button
        onClick={() => onSave(setting)}
        disabled={saving}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
      >
        <Save className="w-3 h-3" />
        บันทึก
      </button>
    </div>
  );
}

/** Upload ไฟล์ไป Firebase Storage แล้ว return download URL */
async function uploadToFirebaseStorage(file, path) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export default function CertificateSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tab: 'district' หรือ 'group'
  const [activeTab, setActiveTab] = useState('district');
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Background
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  const bgInputRef = useRef(null);

  // Number settings (district)
  const [numberSettings, setNumberSettings] = useState([]);
  const [numberSettingsLoading, setNumberSettingsLoading] = useState(false);
  const [savingNumber, setSavingNumber] = useState(false);

  // Group-specific settings
  const [groupSettings, setGroupSettings] = useState([]);
  const [groupSettingsLoading, setGroupSettingsLoading] = useState(false);
  const [groupDateText, setGroupDateText] = useState('');
  const [savingGroupDate, setSavingGroupDate] = useState(false);

  // โหลด school groups ครั้งเดียว
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/school-groups');
        const groups = res.data.data || res.data || [];
        setSchoolGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId(groups[0].id);
        }
      } catch (err) {
        console.error('Failed to load school groups:', err);
      }
    };
    loadGroups();
  }, []);

  // สร้าง query params ตาม tab
  const getQueryParams = useCallback(() => {
    if (activeTab === 'district') {
      return '?level=district';
    }
    return `?level=group&group_id=${selectedGroupId}`;
  }, [activeTab, selectedGroupId]);

  // โหลดตั้งค่าเมื่อ tab หรือ group เปลี่ยน
  const fetchSettings = useCallback(async () => {
    if (activeTab === 'group' && !selectedGroupId) return;
    try {
      setLoading(true);
      resetForm();
      const response = await api.get(`/system-settings/certificate${getQueryParams()}`);
      if (response.data.success) {
        const data = response.data.data;
        if (data.background_url) {
          setBackgroundPreview(data.background_url);
        } else if (data.has_background) {
          setBackgroundPreview('existing');
        }
      }
    } catch (error) {
      console.error('Failed to fetch certificate settings:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedGroupId, getQueryParams]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // โหลดการตั้งค่าเลขรัน (district only - ไม่มี school_group_id)
  const fetchNumberSettings = useCallback(async () => {
    try {
      setNumberSettingsLoading(true);
      const res = await certificateService.getNumberSettings();
      if (res.data?.success) {
        // กรองเฉพาะ district + group ที่ไม่มี school_group_id (legacy)
        const allSettings = res.data.data || [];
        setNumberSettings(allSettings.filter(s => !s.school_group_id));
      }
    } catch (err) {
      console.error('Failed to fetch number settings:', err);
    } finally {
      setNumberSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNumberSettings();
  }, [fetchNumberSettings]);

  // โหลดตั้งค่าเฉพาะกลุ่ม
  const fetchGroupSettings = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      setGroupSettingsLoading(true);
      const res = await certificateService.getGroupCertSettings(selectedGroupId);
      if (res.data?.success) {
        setGroupSettings(res.data.data.settings || []);
        setGroupDateText(res.data.data.group?.competition_date_text || '');
      }
    } catch (err) {
      console.error('Failed to fetch group settings:', err);
    } finally {
      setGroupSettingsLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (activeTab === 'group' && selectedGroupId) {
      fetchGroupSettings();
    }
  }, [activeTab, selectedGroupId, fetchGroupSettings]);

  const handleNumberSettingChange = (id, field, value) => {
    setNumberSettings(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleGroupSettingChange = (id, field, value) => {
    setGroupSettings(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleSaveNumberSetting = async (setting) => {
    try {
      setSavingNumber(true);
      await certificateService.updateNumberSetting({
        id: setting.id,
        prefix: setting.prefix,
        year: setting.year,
        last_number: parseInt(setting.last_number) || 0,
      });
      toast.success('บันทึกการตั้งค่าเลขรันสำเร็จ');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingNumber(false);
    }
  };

  const handleSaveGroupDate = async () => {
    try {
      setSavingGroupDate(true);
      await certificateService.updateGroupDate({
        school_group_id: selectedGroupId,
        competition_date_text: groupDateText,
      });
      toast.success('บันทึกวันแข่งขันสำเร็จ');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingGroupDate(false);
    }
  };

  const handleResetNumbers = async (level) => {
    if (!confirm(`ต้องการรีเซ็ตเลขรัน${level === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'}?`)) return;
    try {
      await certificateService.resetNumberSettings({ level });
      toast.success('รีเซ็ตเลขรันสำเร็จ');
      fetchNumberSettings();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const resetForm = () => {
    setBackgroundPreview(null);
    setBackgroundFile(null);
    setRemoveBackground(false);
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        toast.error('ไฟล์ต้องไม่เกิน 30MB');
        return;
      }
      setBackgroundFile(file);
      setRemoveBackground(false);
      const reader = new FileReader();
      reader.onload = (ev) => setBackgroundPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const storagePrefix = activeTab === 'district'
        ? 'certificates/district'
        : `certificates/group_${selectedGroupId}`;

      const payload = {
        level: activeTab,
        ...(activeTab === 'group' && { group_id: selectedGroupId }),
      };

      // Upload background ไป Firebase Storage
      if (backgroundFile) {
        const ext = backgroundFile.name.split('.').pop();
        const path = `${storagePrefix}/background_${Date.now()}.${ext}`;
        const url = await uploadToFirebaseStorage(backgroundFile, path);
        payload.background_image_url = url;
      }
      if (removeBackground) {
        payload.remove_background = true;
      }

      // ส่ง JSON พร้อม URL ไป backend
      await api.post('/system-settings/certificate', payload);

      toast.success('บันทึกการตั้งค่าเกียรติบัตรสำเร็จ');
      setBackgroundFile(null);
      setRemoveBackground(false);
      fetchSettings();
    } catch (error) {
      console.error('Failed to save certificate settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const currentGroupName = schoolGroups.find(g => g.id === selectedGroupId)?.name || '';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PenLine className="w-7 h-7 text-amber-600" />
          ตั้งค่าเกียรติบัตร
        </h1>
        <p className="text-gray-600 mt-1">กำหนดภาพพื้นหลังและเลขที่เกียรติบัตร แยกตามระดับ</p>
      </div>

      {/* Tabs: ระดับเขต / ระดับกลุ่ม */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('district')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'district'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            ระดับเขตพื้นที่
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'group'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            ระดับกลุ่มโรงเรียน
          </button>
        </div>

        {/* เลือกกลุ่มโรงเรียน (เฉพาะ tab กลุ่ม) */}
        {activeTab === 'group' && (
          <div className="p-4 bg-green-50 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกกลุ่มโรงเรียน</label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {schoolGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Badge แสดงว่ากำลังตั้งค่าอะไร */}
        <div className="p-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            activeTab === 'district'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {activeTab === 'district' ? (
              <>
                <Building2 className="w-4 h-4" />
                กำลังตั้งค่า: ระดับเขตพื้นที่
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                กำลังตั้งค่า: {currentGroupName}
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* ภาพพื้นหลัง */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-blue-600" />
              ภาพพื้นหลังเกียรติบัตร
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              อัปโหลดภาพพื้นหลัง A4 แนวนอน (297 x 210 mm) — แนะนำ PNG หรือ JPG ขนาดไม่เกิน 30MB
            </p>

            {/* Preview */}
            {backgroundPreview && !removeBackground ? (
              <div className="mb-4">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden" style={{ aspectRatio: '297/210', maxWidth: '600px' }}>
                  {backgroundPreview === 'existing' ? (
                    <div className="flex items-center justify-center h-full bg-green-50 text-green-700">
                      <div className="text-center">
                        <Image className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p className="font-medium">มีภาพพื้นหลังแล้ว</p>
                        <p className="text-sm text-green-600">อัปโหลดใหม่เพื่อเปลี่ยน</p>
                      </div>
                    </div>
                  ) : backgroundPreview?.startsWith('http') ? (
                    <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-contain" />
                  )}
                </div>
                <button
                  onClick={() => {
                    setBackgroundPreview(null);
                    setBackgroundFile(null);
                    setRemoveBackground(true);
                  }}
                  className="mt-2 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบภาพพื้นหลัง
                </button>
              </div>
            ) : (
              <div
                onClick={() => bgInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                style={{ aspectRatio: '297/210', maxWidth: '600px' }}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">คลิกเพื่ออัปโหลดภาพพื้นหลัง</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG ขนาดไม่เกิน 30MB</p>
              </div>
            )}

            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleBackgroundChange}
            />

            {backgroundPreview && !removeBackground && (
              <button
                onClick={() => bgInputRef.current?.click()}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Upload className="w-4 h-4" />
                เปลี่ยนภาพพื้นหลัง
              </button>
            )}
          </div>

          {/* ปุ่มบันทึกพื้นหลัง */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg mb-6"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                บันทึกการตั้งค่าพื้นหลัง
              </>
            )}
          </button>

          {/* ============================================ */}
          {/* ตั้งค่าเลขที่เกียรติบัตร                      */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Hash className="w-5 h-5 text-purple-600" />
              ตั้งค่าเลขที่เกียรติบัตร (เลขรัน)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              กำหนด Prefix, ปี พ.ศ., และเลขรันล่าสุดสำหรับเกียรติบัตรแต่ละประเภท
              <br />
              <span className="text-gray-500">ตัวอย่าง: สพป.นฐ.๑-นร.๐๐๐๑/๒๕๖๙</span>
            </p>

            {activeTab === 'district' ? (
              /* ==================== ระดับเขต ==================== */
              numberSettingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-blue-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> ระดับเขตพื้นที่
                    </h3>
                    <button
                      onClick={() => handleResetNumbers('district')}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      <RotateCcw className="w-3 h-3" /> รีเซ็ตเลขรัน
                    </button>
                  </div>
                  <div className="space-y-3">
                    {numberSettings.filter(s => s.level === 'district').map(setting => (
                      <NumberSettingRow
                        key={setting.id}
                        setting={setting}
                        onChange={handleNumberSettingChange}
                        onSave={handleSaveNumberSetting}
                        saving={savingNumber}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* ==================== ระดับกลุ่ม ==================== */
              groupSettingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div>
                  {/* วันแข่งขัน */}
                  <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" /> วันที่จัดการแข่งขัน — {currentGroupName}
                    </h3>
                    <p className="text-xs text-amber-600 mb-2">
                      กรอกเป็นภาษาไทย เช่น "๒๐ กุมภาพันธ์ ๒๕๖๙" — จะแสดงบนเกียรติบัตรระดับกลุ่ม
                    </p>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={groupDateText}
                          onChange={(e) => setGroupDateText(e.target.value)}
                          placeholder="เช่น ๒๐ กุมภาพันธ์ ๒๕๖๙"
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSaveGroupDate}
                        disabled={savingGroupDate}
                        className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingGroupDate ? 'กำลังบันทึก...' : 'บันทึกวันแข่ง'}
                      </button>
                    </div>
                  </div>

                  {/* เลขรันเฉพาะกลุ่ม */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-green-700 flex items-center gap-2">
                      <Users className="w-4 h-4" /> เลขรัน — {currentGroupName}
                    </h3>
                  </div>
                  {groupSettings.length > 0 ? (
                    <div className="space-y-3">
                      {groupSettings.map(setting => (
                        <NumberSettingRow
                          key={setting.id}
                          setting={setting}
                          onChange={handleGroupSettingChange}
                          onSave={handleSaveNumberSetting}
                          saving={savingNumber}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>ยังไม่มีการตั้งค่าเลขรันสำหรับกลุ่มนี้</p>
                      <p className="text-sm">ระบบจะสร้างอัตโนมัติเมื่อ deploy migration ใหม่</p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
