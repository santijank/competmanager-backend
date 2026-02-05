import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Building2, Phone, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { schoolService, schoolGroupService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function SchoolList() {
  const { isAdmin } = useAuthStore();
  const [schools, setSchools] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    school_group_id: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [filterGroup]);

  const fetchData = async () => {
    try {
      const [schoolGroupsRes] = await Promise.all([
        schoolGroupService.getAll(),
      ]);
      setSchoolGroups(schoolGroupsRes.data.data || []);
      await fetchSchools();
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterGroup) params.school_group_id = filterGroup;

      const response = await schoolService.getAll(params);
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลโรงเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        school_group_id: parseInt(formData.school_group_id),
      };

      if (editingId) {
        await schoolService.update(editingId, data);
        toast.success('แก้ไขโรงเรียนสำเร็จ');
      } else {
        await schoolService.create(data);
        toast.success('เพิ่มโรงเรียนสำเร็จ');
      }
      setShowModal(false);
      resetForm();
      fetchSchools();
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  };

  const handleEdit = (school) => {
    setEditingId(school.id);
    setFormData({
      name: school.name,
      code: school.code,
      school_group_id: school.school_group_id,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ที่จะลบโรงเรียนนี้?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await schoolService.delete(id);
          toast.success('ลบโรงเรียนสำเร็จ');
          fetchSchools();
        } catch (error) {
          toast.error('ไม่สามารถลบโรงเรียนได้');
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      school_group_id: '',
      address: '',
      phone: '',
      email: '',
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">โรงเรียน</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลโรงเรียน</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            เพิ่มโรงเรียน
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาโรงเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Group Filter */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="input"
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

      {/* Schools List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบโรงเรียน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSchools.map((school) => (
            <div key={school.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {school.name}
                  </h3>
                  <p className="text-sm text-gray-500">รหัส: {school.code}</p>
                </div>
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>

              {/* School Group */}
              {school.school_group && (
                <div className="mb-3">
                  <span className="badge badge-primary">{school.school_group.name}</span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {school.address && (
                  <p className="text-sm text-gray-600 line-clamp-1">
                    📍 {school.address}
                  </p>
                )}
                {school.phone && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone className="h-3 w-3 mr-2" />
                    {school.phone}
                  </p>
                )}
                {school.email && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="h-3 w-3 mr-2" />
                    {school.email}
                  </p>
                )}
              </div>

              {isAdmin() && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(school)}
                    className="flex-1 btn btn-outline text-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(school.id)}
                    className="btn btn-danger text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขโรงเรียน' : 'เพิ่มโรงเรียน'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name">
                    ชื่อโรงเรียน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น โรงเรียนวัดใหญ่"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="code">
                    รหัสโรงเรียน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="เช่น SCH001"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="school_group_id">
                    กลุ่มโรงเรียน <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="school_group_id"
                    value={formData.school_group_id}
                    onChange={(e) => setFormData({ ...formData, school_group_id: e.target.value })}
                    required
                  >
                    <option value="">-- เลือกกลุ่มโรงเรียน --</option>
                    {schoolGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address">ที่อยู่</label>
                  <textarea
                    id="address"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="ที่อยู่โรงเรียน"
                  />
                </div>

                <div>
                  <label htmlFor="phone">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="034-123456"
                  />
                </div>

                <div>
                  <label htmlFor="email">อีเมล</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="school@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn btn-outline"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingId ? 'บันทึก' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
