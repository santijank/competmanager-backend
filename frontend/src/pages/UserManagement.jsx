import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    school_id: '',
    school_group_id: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'teacher',
    school_id: '',
    school_group_id: '',
    category_id: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Roles
  const roles = [
    { value: 'admin', label: 'Admin (ผู้ดูแลระบบ)' },
    { value: 'district_admin', label: 'District Admin (ผู้ดูแลระดับเขต)' },
    { value: 'category_admin', label: 'Category Admin (ผู้ดูแลหมวดหมู่)' },
    { value: 'data_entry', label: 'Data Entry (ทีมบันทึกข้อมูล)' },
    { value: 'committee', label: 'Committee (คณะกรรมการ)' },
    { value: 'group_admin', label: 'Group Admin (ผู้ดูแลกลุ่ม)' },
    { value: 'school_admin', label: 'School Admin (ผู้ดูแลโรงเรียน)' },
    { value: 'teacher', label: 'Teacher (ครู)' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchSchools();
    fetchSchoolGroups();
    fetchCategories();
  }, [pagination.current_page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await api.get('/users', { params });
      
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get('/schools?all=true');
      if (response.data.success) {
        setSchools(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      if (response.data.success) {
        setSchoolGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching school groups:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    
    if (mode === 'edit' && user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.role,
        school_id: user.school_id || '',
        school_group_id: user.school_group_id || '',
        category_id: user.category_id || '',
        is_active: user.is_active
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'teacher',
        school_id: '',
        school_group_id: '',
        is_active: true
      });
    }
    
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'teacher',
      school_id: '',
      school_group_id: '',
      is_active: true
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const dataToSubmit = { ...formData };
      
      // Remove password fields if empty (for edit mode)
      if (modalMode === 'edit' && !dataToSubmit.password) {
        delete dataToSubmit.password;
        delete dataToSubmit.password_confirmation;
      }

      // Convert empty strings to null
      if (!dataToSubmit.school_id) dataToSubmit.school_id = null;
      if (!dataToSubmit.school_group_id) dataToSubmit.school_group_id = null;
      if (!dataToSubmit.category_id) dataToSubmit.category_id = null;

      let response;
      if (modalMode === 'create') {
        response = await api.post('/users', dataToSubmit);
      } else {
        response = await api.put(`/users/${selectedUser.id}`, dataToSubmit);
      }

      if (response.data.success) {
        alert(modalMode === 'create' ? 'เพิ่มผู้ใช้สำเร็จ' : 'แก้ไขผู้ใช้สำเร็จ');
        handleCloseModal();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await api.delete(`/users/${userToDelete.id}`);
      
      if (response.data.success) {
        alert('ลบผู้ใช้สำเร็จ');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetPassword = async (user) => {
    if (!confirm(`ต้องการ Reset รหัสผ่านของ ${user.name} หรือไม่?`)) return;

    try {
      const response = await api.post(`/users/${user.id}/reset-password`);
      
      if (response.data.success) {
        alert(`Reset รหัสผ่านสำเร็จ\nรหัสผ่านใหม่: ${response.data.data.new_password}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('เกิดข้อผิดพลาดในการ Reset รหัสผ่าน');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      district_admin: 'bg-blue-100 text-blue-800',
      category_admin: 'bg-teal-100 text-teal-800',
      data_entry: 'bg-cyan-100 text-cyan-800',
      committee: 'bg-indigo-100 text-indigo-800',
      group_admin: 'bg-green-100 text-green-800',
      school_admin: 'bg-yellow-100 text-yellow-800',
      teacher: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="mt-2 text-sm text-gray-600">
            จัดการผู้ใช้งานในระบบ เพิ่ม แก้ไข ลบ และ Reset รหัสผ่าน
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="ชื่อ หรือ อีเมล"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {/* School Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กลุ่มโรงเรียน
              </label>
              <select
                value={filters.school_group_id}
                onChange={(e) => setFilters({ ...filters, school_group_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {schoolGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            {/* School Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โรงเรียน
              </label>
              <select
                value={filters.school_id}
                onChange={(e) => setFilters({ ...filters, school_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => {
                setFilters({ search: '', role: '', school_id: '', school_group_id: '' });
                setPagination({ ...pagination, current_page: 1 });
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ล้างตัวกรอง
            </button>
            
            <button
              onClick={() => handleOpenModal('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + เพิ่มผู้ใช้ใหม่
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        อีเมล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        บทบาท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        โรงเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        กลุ่ม
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หมวดหมู่
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.school?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.school_group?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'ใช้งาน' : 'ระงับ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenModal('edit', user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                          >
                            Reset PW
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                    disabled={pagination.current_page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                    disabled={pagination.current_page === pagination.last_page}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      แสดง <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> ถึง{' '}
                      <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> จาก{' '}
                      <span className="font-medium">{pagination.total}</span> รายการ
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                        disabled={pagination.current_page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ก่อนหน้า
                      </button>
                      
                      {[...Array(pagination.last_page)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === pagination.last_page ||
                          (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setPagination({ ...pagination, current_page: page })}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.current_page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                          return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                        disabled={pagination.current_page === pagination.last_page}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ถัดไป
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {modalMode === 'create' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            อีเมล <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสผ่าน {modalMode === 'create' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={modalMode === 'create'}
                            placeholder={modalMode === 'edit' ? 'เว้นว่างไว้หากไม่ต้องการเปลี่ยน' : ''}
                          />
                          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>}
                        </div>

                        {/* Password Confirmation */}
                        {formData.password && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={formData.password_confirmation}
                              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation[0]}</p>}
                          </div>
                        )}

                        {/* Role */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            บทบาท <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {roles.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role[0]}</p>}
                        </div>

                        {/* School Group (for group_admin) */}
                        {(formData.role === 'group_admin' || formData.role === 'committee') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              กลุ่มโรงเรียน
                            </label>
                            <select
                              value={formData.school_group_id}
                              onChange={(e) => setFormData({ ...formData, school_group_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกกลุ่มโรงเรียน</option>
                              {schoolGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                              ))}
                            </select>
                            {errors.school_group_id && <p className="mt-1 text-sm text-red-600">{errors.school_group_id[0]}</p>}
                          </div>
                        )}

                        {/* Category (for category_admin and data_entry) */}
                        {(formData.role === 'category_admin' || formData.role === 'data_entry') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              หมวดหมู่ <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.category_id}
                              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">เลือกหมวดหมู่</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id[0]}</p>}
                          </div>
                        )}

                        {/* School (for school_admin and teacher) */}
                        {(formData.role === 'school_admin' || formData.role === 'teacher') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              โรงเรียน <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.school_id}
                              onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">เลือกโรงเรียน</option>
                              {schools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                              ))}
                            </select>
                            {errors.school_id && <p className="mt-1 text-sm text-red-600">{errors.school_id[0]}</p>}
                          </div>
                        )}

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            เปิดใช้งาน
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'กำลังบันทึก...' : (modalMode === 'create' ? 'เพิ่มผู้ใช้' : 'บันทึก')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      ยืนยันการลบผู้ใช้
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <strong>{userToDelete.name}</strong>?
                        การดำเนินการนี้ไม่สามารถย้อนกลับได้
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  ลบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
