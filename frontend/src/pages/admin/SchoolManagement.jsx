import { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Filter,
  AlertCircle,
  CheckCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * 🏫 หน้าจัดการโรงเรียน - CRUD เต็มรูปแบบ
 */
export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    school_group_id: '',
    code: '',
    name: '',
    school_type: 'government',
    address: '',
    phone: '',
    email: '',
    director_name: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSchoolGroups();
    fetchSchools();
  }, [searchQuery, filterGroup, filterType, filterActive, currentPage]);

  const fetchSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups?all=true');
      setSchoolGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching school groups:', error);
      toast.error('ไม่สามารถโหลดข้อมูลกลุ่มโรงเรียนได้');
    }
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterGroup) params.append('school_group_id', filterGroup);
      if (filterType) params.append('school_type', filterType);
      if (filterActive !== '') params.append('is_active', filterActive);
      params.append('page', currentPage);
      params.append('per_page', 15);

      const response = await api.get(`/schools?${params.toString()}`);
      
      setSchools(response.data.data || []);
      setTotal(response.data.meta?.total || 0);
      setTotalPages(response.data.meta?.last_page || 1);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโรงเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_group_id: school.school_group_id || '',
        code: school.code || '',
        name: school.name || '',
        school_type: school.school_type || 'government',
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        director_name: school.director_name || '',
        is_active: school.is_active !== undefined ? school.is_active : true
      });
    } else {
      setEditingSchool(null);
      setFormData({
        school_group_id: '',
        code: '',
        name: '',
        school_type: 'government',
        address: '',
        phone: '',
        email: '',
        director_name: '',
        is_active: true
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
    setFormData({
      school_group_id: '',
      code: '',
      name: '',
      school_type: 'government',
      address: '',
      phone: '',
      email: '',
      director_name: '',
      is_active: true
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.school_group_id) {
      newErrors.school_group_id = 'กรุณาเลือกกลุ่มโรงเรียน';
    }
    if (!formData.code) {
      newErrors.code = 'กรุณากรอกรหัสโรงเรียน';
    }
    if (!formData.name) {
      newErrors.name = 'กรุณากรอกชื่อโรงเรียน';
    }
    if (!formData.school_type) {
      newErrors.school_type = 'กรุณาเลือกประเภทโรงเรียน';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setSaving(true);

      if (editingSchool) {
        // Update
        await api.put(`/schools/${editingSchool.id}`, formData);
        toast.success('แก้ไขข้อมูลโรงเรียนสำเร็จ');
      } else {
        // Create
        await api.post('/schools', formData);
        toast.success('เพิ่มโรงเรียนสำเร็จ');
      }

      handleCloseModal();
      fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (school) => {
    try {
      await api.delete(`/schools/${school.id}`);
      toast.success('ลบโรงเรียนสำเร็จ');
      setDeleteConfirm(null);
      fetchSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
      const message = error.response?.data?.message || 'ไม่สามารถลบโรงเรียนได้';
      toast.error(message);
    }
  };

  const getSchoolGroupName = (groupId) => {
    const group = schoolGroups.find(g => g.id === groupId);
    return group?.name || '-';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterGroup('');
    setFilterType('');
    setFilterActive('');
    setCurrentPage(1);
  };

  if (loading && schools.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <School className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการโรงเรียน</h1>
              <p className="text-gray-600">เพิ่ม แก้ไข และจัดการข้อมูลโรงเรียน</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่มโรงเรียน</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{total}</div>
            <div className="text-sm text-gray-600">โรงเรียนทั้งหมด</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-600">
              {schools.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">ใช้งานอยู่</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">
              {schoolGroups.length}
            </div>
            <div className="text-sm text-gray-600">กลุ่มโรงเรียน</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-600">
              {schools.filter(s => s.school_type === 'government').length}
            </div>
            <div className="text-sm text-gray-600">โรงเรียนรัฐบาล</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ชื่อหรือรหัสโรงเรียน..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              กลุ่มโรงเรียน
            </label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทั้งหมด</option>
              {schoolGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภท
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทั้งหมด</option>
              <option value="government">รัฐบาล</option>
              <option value="private">เอกชน</option>
            </select>
          </div>

          {/* Active Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทั้งหมด</option>
              <option value="true">ใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchQuery || filterGroup || filterType || filterActive) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัส
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อโรงเรียน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  กลุ่ม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>ไม่พบข้อมูลโรงเรียน</p>
                  </td>
                </tr>
              ) : (
                schools.map(school => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {school.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {school.name}
                        </div>
                        {school.director_name && (
                          <div className="text-xs text-gray-500">
                            ผอ. {school.director_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {getSchoolGroupName(school.school_group_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        school.school_type === 'government'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {school.school_type === 'government' ? 'รัฐบาล' : 'เอกชน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        school.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {school.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(school)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(school)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                แสดง {schools.length} จาก {total} รายการ
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <span className="text-sm text-gray-700">
                  หน้า {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSchool ? 'แก้ไขข้อมูลโรงเรียน' : 'เพิ่มโรงเรียนใหม่'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                
                {/* Required Fields */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-4">ข้อมูลพื้นฐาน (บังคับ)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* School Group */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        กลุ่มโรงเรียน <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="school_group_id"
                        value={formData.school_group_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.school_group_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">เลือกกลุ่ม</option>
                        {schoolGroups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      {errors.school_group_id && (
                        <p className="mt-1 text-xs text-red-500">{errors.school_group_id}</p>
                      )}
                    </div>

                    {/* Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสโรงเรียน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="เช่น 001, SCH001"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.code && (
                        <p className="mt-1 text-xs text-red-500">
                          {typeof errors.code === 'object' ? errors.code[0] : errors.code}
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อโรงเรียน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="โรงเรียน..."
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* School Type */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภทโรงเรียน <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="school_type"
                            value="government"
                            checked={formData.school_type === 'government'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">รัฐบาล</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="school_type"
                            value="private"
                            checked={formData.school_type === 'private'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">เอกชน</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">ข้อมูลเพิ่มเติม (ไม่บังคับ)</h3>
                  
                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>ที่อยู่</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="ที่อยู่โรงเรียน..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>เบอร์โทรศัพท์</span>
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="034-xxxxxx"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>อีเมล</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="school@example.com"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Director Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>ชื่อผู้อำนวยการ</span>
                      </label>
                      <input
                        type="text"
                        name="director_name"
                        value={formData.director_name}
                        onChange={handleInputChange}
                        placeholder="นาย/นาง..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        เปิดใช้งานโรงเรียน
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบ</h3>
                <p className="text-sm text-gray-600">คุณแน่ใจหรือไม่?</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ต้องการลบโรงเรียน <span className="font-semibold">{deleteConfirm.name}</span> หรือไม่?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
