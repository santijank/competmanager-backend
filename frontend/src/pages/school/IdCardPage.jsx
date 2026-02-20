import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  CreditCard,
  Upload,
  Trash2,
  Printer,
  Users,
  User,
  RefreshCw,
  Image,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import idCardService from '@/services/idCardService';
import useAuthStore from '@/stores/authStore';

const IdCardPage = () => {
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printingReg, setPrintingReg] = useState(null); // regId ที่กำลังพิมพ์
  const [photos, setPhotos] = useState({}); // { regId: { student_0: {photo_url}, ... } }
  const [uploading, setUploading] = useState({}); // { "regId_student_0": true }
  const fileInputRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // ดึง approved registrations ของโรงเรียน
      const response = await api.get('/registrations', {
        params: { paginate: false, status: 'approved' },
      });

      let regData = [];
      if (response.data.data?.data) {
        regData = response.data.data.data;
      } else if (response.data.data) {
        regData = response.data.data;
      } else if (Array.isArray(response.data)) {
        regData = response.data;
      }
      if (!Array.isArray(regData)) regData = [];

      // กรองเฉพาะ approved
      regData = regData.filter((r) => r.status === 'approved');

      // Parse student_names / teacher_names
      const parsed = regData.map((reg) => ({
        ...reg,
        student_names: parseNames(reg.student_names),
        teacher_names: parseNames(reg.teacher_names),
      }));

      setRegistrations(parsed);

      // โหลดรูปถ่ายของทุก registration
      const photoData = {};
      await Promise.all(
        parsed.map(async (reg) => {
          try {
            const data = await idCardService.getPhotos(reg.id);
            photoData[reg.id] = data;
          } catch {
            photoData[reg.id] = {};
          }
        })
      );
      setPhotos(photoData);
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const parseNames = (names) => {
    if (Array.isArray(names)) {
      return names.map((n) => (typeof n === 'object' && n.name ? n.name : n));
    }
    if (typeof names === 'string') {
      try {
        const parsed = JSON.parse(names);
        if (Array.isArray(parsed)) {
          return parsed.map((n) => (typeof n === 'object' && n.name ? n.name : n));
        }
      } catch {}
    }
    return [];
  };

  const handleUpload = async (regId, personType, personIndex, file) => {
    const key = `${regId}_${personType}_${personIndex}`;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await idCardService.uploadPhoto(regId, personType, personIndex, file);
      setPhotos((prev) => ({
        ...prev,
        [regId]: {
          ...prev[regId],
          [`${personType}_${personIndex}`]: {
            photo_url: result.data.photo_url,
          },
        },
      }));
      toast.success('อัพโหลดรูปสำเร็จ');
    } catch (error) {
      console.error('Upload error:', error);
      const errMsg = error.response?.data?.message || error.response?.data?.errors?.photo?.[0] || 'อัพโหลดรูปไม่สำเร็จ';
      toast.error(errMsg);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDelete = async (regId, personType, personIndex) => {
    try {
      await idCardService.deletePhoto(regId, personType, personIndex);
      setPhotos((prev) => {
        const regPhotos = { ...prev[regId] };
        delete regPhotos[`${personType}_${personIndex}`];
        return { ...prev, [regId]: regPhotos };
      });
      toast.success('ลบรูปสำเร็จ');
    } catch {
      toast.error('ลบรูปไม่สำเร็จ');
    }
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    try {
      await idCardService.openAllPdf();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('ไม่สามารถสร้าง PDF ได้');
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintOne = async (regId) => {
    setPrintingReg(regId);
    try {
      await idCardService.openPdf(regId);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('ไม่สามารถสร้าง PDF ได้');
    } finally {
      setPrintingReg(null);
    }
  };

  const triggerFileInput = (refKey) => {
    fileInputRefs.current[refKey]?.click();
  };

  const totalPeople = registrations.reduce(
    (acc, reg) => acc + (reg.student_names?.length || 0) + (reg.teacher_names?.length || 0),
    0
  );

  const totalPhotos = Object.values(photos).reduce(
    (acc, regPhotos) => acc + Object.keys(regPhotos).length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">บัตรประจำตัวผู้เข้าแข่งขัน</h1>
              <p className="text-sm text-gray-500">
                อัพโหลดรูปถ่ายและพิมพ์บัตรประจำตัวสำหรับทุกกิจกรรม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalPhotos}</span>/{totalPeople} รูป
            </div>
            <button
              onClick={loadData}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </button>
            <button
              onClick={handlePrintAll}
              disabled={printing || registrations.length === 0}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {printing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {printing ? 'กำลังสร้าง PDF...' : 'พิมพ์บัตรทั้งหมด'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {registrations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">ไม่มีรายการลงทะเบียนที่อนุมัติแล้ว</h3>
          <p className="text-sm text-gray-400 mt-1">
            กรุณารอให้รายการลงทะเบียนได้รับการอนุมัติก่อน
          </p>
        </div>
      )}

      {/* Registration cards */}
      {registrations.map((reg) => (
        <div key={reg.id} className="bg-white rounded-lg shadow">
          {/* Competition header */}
          <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {reg.competition?.code || '-'}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {reg.competition?.name || 'ไม่ทราบกิจกรรม'}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  ระดับชั้น: {reg.competition?.level || '-'} |
                  สถานที่: {reg.competition?.venue || '-'}
                </p>
              </div>
              <button
                onClick={() => handlePrintOne(reg.id)}
                disabled={printingReg === reg.id}
                className="px-3 py-2 text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {printingReg === reg.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {printingReg === reg.id ? 'กำลังสร้าง...' : 'พิมพ์บัตรกิจกรรมนี้'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* นักเรียน */}
            {reg.student_names?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-1 mb-3">
                  <Users className="w-4 h-4" />
                  นักเรียน ({reg.student_names.length} คน)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reg.student_names.map((name, idx) => {
                    const photoKey = `student_${idx}`;
                    const photo = photos[reg.id]?.[photoKey];
                    const uploadKey = `${reg.id}_student_${idx}`;
                    const isUploading = uploading[uploadKey];
                    const refKey = `${reg.id}_student_${idx}`;

                    return (
                      <PersonCard
                        key={refKey}
                        name={name}
                        photo={photo}
                        isUploading={isUploading}
                        onUpload={(file) => handleUpload(reg.id, 'student', idx, file)}
                        onDelete={() => handleDelete(reg.id, 'student', idx)}
                        triggerFileInput={() => triggerFileInput(refKey)}
                        fileInputRef={(el) => (fileInputRefs.current[refKey] = el)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ครู */}
            {reg.teacher_names?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-3">
                  <User className="w-4 h-4" />
                  ครูผู้ฝึกสอน ({reg.teacher_names.length} คน)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reg.teacher_names.map((name, idx) => {
                    const photoKey = `teacher_${idx}`;
                    const photo = photos[reg.id]?.[photoKey];
                    const uploadKey = `${reg.id}_teacher_${idx}`;
                    const isUploading = uploading[uploadKey];
                    const refKey = `${reg.id}_teacher_${idx}`;

                    return (
                      <PersonCard
                        key={refKey}
                        name={name}
                        photo={photo}
                        isUploading={isUploading}
                        onUpload={(file) => handleUpload(reg.id, 'teacher', idx, file)}
                        onDelete={() => handleDelete(reg.id, 'teacher', idx)}
                        triggerFileInput={() => triggerFileInput(refKey)}
                        fileInputRef={(el) => (fileInputRefs.current[refKey] = el)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * PersonCard - แสดงชื่อ + รูป + ปุ่ม upload/delete
 */
const PersonCard = ({ name, photo, isUploading, onUpload, onDelete, triggerFileInput, fileInputRef }) => {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {photo?.photo_url ? (
          <img
            src={photo.photo_url}
            alt={name}
            className="w-14 h-14 rounded-lg object-cover border"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center border border-dashed border-gray-300">
            <Image className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Name + actions */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files[0]) {
                onUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center gap-1 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            {photo?.photo_url ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}
          </button>
          {photo?.photo_url && (
            <button
              onClick={onDelete}
              className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              ลบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdCardPage;
