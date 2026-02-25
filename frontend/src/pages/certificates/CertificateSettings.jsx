import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Upload, Trash2, Image, PenLine, Building2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const INITIAL_SIGNERS = [
  { name: '', position: '', has_signature: false, signatureFile: null, signaturePreview: null, removeSignature: false },
  { name: '', position: '', has_signature: false, signatureFile: null, signaturePreview: null, removeSignature: false },
];

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

  // Signers
  const [signers, setSigners] = useState(INITIAL_SIGNERS.map(s => ({ ...s })));

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
        if (data.has_background) {
          setBackgroundPreview('existing');
        }
        if (data.signers) {
          setSigners(data.signers.map(s => ({
            name: s.name || '',
            position: s.position || '',
            has_signature: s.has_signature || false,
            signatureFile: null,
            signaturePreview: null,
            removeSignature: false,
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch certificate settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedGroupId, getQueryParams]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const resetForm = () => {
    setBackgroundPreview(null);
    setBackgroundFile(null);
    setRemoveBackground(false);
    setSigners(INITIAL_SIGNERS.map(s => ({ ...s })));
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      setBackgroundFile(file);
      setRemoveBackground(false);
      const reader = new FileReader();
      reader.onload = (ev) => setBackgroundPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('ไฟล์ลายเซ็นต้องไม่เกิน 2MB');
        return;
      }
      const updated = [...signers];
      updated[index].signatureFile = file;
      updated[index].removeSignature = false;
      const reader = new FileReader();
      reader.onload = (ev) => {
        updated[index].signaturePreview = ev.target.result;
        setSigners([...updated]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignerChange = (index, field, value) => {
    const updated = [...signers];
    updated[index][field] = value;
    setSigners(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();

      // ส่ง level/group_id
      formData.append('level', activeTab);
      if (activeTab === 'group') {
        formData.append('group_id', selectedGroupId);
      }

      // Background
      if (backgroundFile) {
        formData.append('background_image', backgroundFile);
      }
      if (removeBackground) {
        formData.append('remove_background', '1');
      }

      // Signers
      signers.forEach((signer, idx) => {
        const i = idx + 1;
        formData.append(`signer_name_${i}`, signer.name);
        formData.append(`signer_position_${i}`, signer.position);
        if (signer.signatureFile) {
          formData.append(`signer_signature_${i}`, signer.signatureFile);
        }
        if (signer.removeSignature) {
          formData.append(`remove_signature_${i}`, '1');
        }
      });

      await api.post('/system-settings/certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('บันทึกการตั้งค่าเกียรติบัตรสำเร็จ');
      setBackgroundFile(null);
      setRemoveBackground(false);
      const resetSigners = signers.map(s => ({ ...s, signatureFile: null, removeSignature: false }));
      setSigners(resetSigners);
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
        <p className="text-gray-600 mt-1">กำหนดภาพพื้นหลัง ชื่อผู้บริหาร และลายเซ็นสำหรับเกียรติบัตร แยกตามระดับ</p>
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
          {/* ส่วน 1: ภาพพื้นหลัง */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-blue-600" />
              ภาพพื้นหลังเกียรติบัตร
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              อัปโหลดภาพพื้นหลัง A4 แนวนอน (297 x 210 mm) — แนะนำ PNG หรือ JPG ขนาดไม่เกิน 5MB
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
                <p className="text-sm text-gray-400 mt-1">PNG, JPG ขนาดไม่เกิน 5MB</p>
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

          {/* ส่วน 2: ผู้ลงนาม */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <PenLine className="w-5 h-5 text-amber-600" />
              ผู้ลงนามในเกียรติบัตร
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              กำหนดชื่อและลายเซ็นผู้บริหารที่จะแสดงในเกียรติบัตร (สูงสุด 2 ท่าน)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {signers.map((signer, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">ผู้ลงนามท่านที่ {idx + 1}</h3>

                  {/* ชื่อ */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => handleSignerChange(idx, 'name', e.target.value)}
                      placeholder="เช่น นายสมชาย ใจดี"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* ตำแหน่ง */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={signer.position}
                      onChange={(e) => handleSignerChange(idx, 'position', e.target.value)}
                      placeholder="เช่น ผอ.สพป.นครปฐม เขต 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* ลายเซ็น */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลายเซ็น</label>
                    {(signer.signaturePreview || (signer.has_signature && !signer.removeSignature)) ? (
                      <div>
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-center" style={{ height: '80px' }}>
                          {signer.signaturePreview ? (
                            <img src={signer.signaturePreview} alt="Signature" className="max-h-full" />
                          ) : (
                            <p className="text-sm text-green-600 font-medium">มีลายเซ็นแล้ว</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <label className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                            <Upload className="w-3 h-3" />
                            เปลี่ยน
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              className="hidden"
                              onChange={(e) => handleSignatureChange(idx, e)}
                            />
                          </label>
                          <button
                            onClick={() => {
                              const updated = [...signers];
                              updated[idx].signaturePreview = null;
                              updated[idx].signatureFile = null;
                              updated[idx].removeSignature = true;
                              updated[idx].has_signature = false;
                              setSigners(updated);
                            }}
                            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">อัปโหลดลายเซ็น (PNG/JPG, ไม่เกิน 2MB)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={(e) => handleSignatureChange(idx, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                บันทึกการตั้งค่าเกียรติบัตร
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
