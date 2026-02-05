import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus, Key, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function UserManagement() {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    school_id: '',
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('ไม่มีสิทธิ์เข้าถึง');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        toast.success('แก้ไขผู้ใช้สำเร็จ');
      } else {
        await api.post('/users', formData);
        toast.success('สร้างผู้ใช้สำเร็จ');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'teacher',
        school_id: '',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/users/${id}`);
          toast.success('ลบผู้ใช้สำเร็จ');
          fetchUsers();
        } catch (error) {
          toast.error('ไม่สามารถลบได้');
        }
      },
    });
  };

  // ⭐ Reset Password
  const openResetModal = (user) => {
    setResettingUser(user);
    setResetPasswordData({ password: '' });
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/users/${resettingUser.id}/reset-password`, resetPasswordData);
      toast.success(`รีเซ็ตรหัสผ่านของ ${resettingUser.name} สำเร็จ`);
      setShowResetModal(false);
      setResettingUser(null);
      setResetPasswordData({ password: '' });
    } catch (error) {
      toast.error('ไม่สามารถรีเซ็ตรหัสผ่านได้');
    }
  };

  // ⭐ Generate Random Password
  const generatePassword = async () => {
    try {
      const response = await api.get('/users/generate-password');
      setResetPasswordData({ password: response.data.data.password });
      toast.success('สร้างรหัสผ่านอัตโนมัติแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถสร้างรหัสผ่านได้');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      school_id: user.school_id || '',
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels = {
    admin: 'ผู้ดูแลระบบ',
    committee: 'คณะกรรมการ',
    group_admin: 'ผู้ดูแลกลุ่ม',
    teacher: 'ครู',
    judge: 'กรรมการตัดสิน',
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-gray-600 mt-1">จำนวนทั้งหมด {users.length} คน</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'teacher',
              school_id: '',
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-สกุล</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อีเมล</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">โรงเรียน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-danger' :
                      user.role === 'committee' ? 'badge-warning' :
                      user.role === 'group_admin' ? 'badge-info' :
                      'badge-success'
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.school?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    {/* ⭐ Reset Password Button */}
                    <button
                      onClick={() => openResetModal(user)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="รีเซ็ตรหัสผ่าน"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="แก้ไข"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⭐ Reset Password Modal */}
      {showResetModal && resettingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Key className="h-6 w-6 text-yellow-600 mr-2" />
              <h2 className="text-xl font-bold">รีเซ็ตรหัสผ่าน</h2>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">ผู้ใช้:</p>
              <p className="font-medium">{resettingUser.name}</p>
              <p className="text-sm text-gray-500">{resettingUser.email}</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">รหัสผ่านใหม่</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={resetPasswordData.password}
                    onChange={(e) => setResetPasswordData({password: e.target.value})}
                    className="input flex-1"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="btn btn-outline"
                    title="สุ่มรหัสผ่าน"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                {resetPasswordData.password && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 กรุณาบันทึกรหัสผ่านนี้และแจ้งให้ผู้ใช้ทราบ
                  </p>
                )}
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ หลังรีเซ็ตรหัสผ่าน ผู้ใช้จะถูก Logout ออกจากระบบทันที
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResettingUser(null);
                  }}
                  className="flex-1 btn btn-outline"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  รีเซ็ตรหัสผ่าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">ชื่อ-สกุล</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="label">อีเมล</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="label">รหัสผ่าน</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="label">บทบาท</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input"
                >
                  <option value="teacher">ครู</option>
                  <option value="group_admin">ผู้ดูแลกลุ่ม</option>
                  <option value="committee">คณะกรรมการ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  บันทึก
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
