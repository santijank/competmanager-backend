import { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Users,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const SchoolProfile = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({
    director_name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      const schoolId = user?.school_id;
      if (!schoolId) {
        toast.error('ไม่พบข้อมูลโรงเรียน');
        return;
      }

      const response = await api.get(`/schools/${schoolId}`);
      if (response.data.success) {
        const data = response.data.data;
        setSchool(data);
        setForm({
          director_name: data.director_name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
        });
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error fetching school:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโรงเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!form.director_name.trim()) {
        toast.error('กรุณากรอกชื่อผู้อำนวยการ');
        return;
      }
      if (!form.phone.trim()) {
        toast.error('กรุณากรอกเบอร์โทรศัพท์');
        return;
      }

      const response = await api.put(`/schools/${school.id}`, {
        director_name: form.director_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      });

      if (response.data.success) {
        setSchool(response.data.data);
        setHasChanges(false);
        toast.success('บันทึกข้อมูลสำเร็จ');
      }
    } catch (error) {
      console.error('Error saving school:', error);
      const message = error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (school) {
      setForm({
        director_name: school.director_name || '',
        phone: school.phone || '',
        email: school.email || '',
        address: school.address || '',
      });
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">ไม่พบข้อมูลโรงเรียน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ข้อมูลโรงเรียน</h1>
                <p className="text-gray-600 mt-1">จัดการข้อมูลโรงเรียนของท่าน</p>
              </div>
            </div>
            <button
              onClick={fetchSchool}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* School Info Card (Read-only) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2 text-gray-500" />
            ข้อมูลทั่วไป
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">รหัสโรงเรียน</p>
              <p className="text-base font-medium text-gray-900">{school.code || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ชื่อโรงเรียน</p>
              <p className="text-base font-medium text-gray-900">{school.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ประเภท</p>
              <p className="text-base font-medium text-gray-900">
                {school.school_type === 'government' ? 'รัฐบาล' : 'เอกชน'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">กลุ่มโรงเรียน</p>
              <p className="text-base font-medium text-gray-900">
                {school.school_group?.name || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-500" />
            ข้อมูลติดต่อ
            <span className="text-sm font-normal text-red-500 ml-2">* จำเป็น</span>
          </h2>

          <div className="space-y-5">
            {/* Director Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-gray-400" />
                  ชื่อผู้อำนวยการ <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <input
                type="text"
                value={form.director_name}
                onChange={(e) => handleChange('director_name', e.target.value)}
                placeholder="เช่น นายสมชาย รักเรียน"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1.5 text-gray-400" />
                  เบอร์โทรศัพท์ <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="เช่น 089-xxx-xxxx"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                  อีเมล
                </span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="เช่น school@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                  ที่อยู่
                </span>
              </label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="ที่อยู่โรงเรียน"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            {hasChanges && (
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        {school.director_name && school.phone && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">ข้อมูลโรงเรียนครบถ้วน</span>
          </div>
        )}
        {(!school.director_name || !school.phone) && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium">กรุณากรอกชื่อผู้อำนวยการและเบอร์โทรศัพท์ให้ครบถ้วน</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolProfile;
