import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, FolderOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { categoryService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';

export default function CategoryList() {
  const { isAdmin } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await categoryService.update(editingId, formData);
        toast.success('แก้ไขหมวดหมู่สำเร็จ');
      } else {
        await categoryService.create(formData);
        toast.success('เพิ่มหมวดหมู่สำเร็จ');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?')) return;

    try {
      await categoryService.delete(id);
      toast.success('ลบหมวดหมู่สำเร็จ');
      fetchCategories();
    } catch (error) {
      toast.error('ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">หมวดหมู่การแข่งขัน</h1>
          <p className="text-gray-600 mt-1">จัดการหมวดหมู่การแข่งขัน</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            เพิ่มหมวดหมู่
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบหมวดหมู่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">รหัส: {category.code}</p>
                </div>
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              {isAdmin() && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 btn btn-outline text-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ศิลปะ-ดนตรี"
                  required
                />
              </div>

              <div>
                <label htmlFor="code">
                  รหัสหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="เช่น ART001"
                  required
                />
              </div>

              <div>
                <label htmlFor="description">คำอธิบาย</label>
                <textarea
                  id="description"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                />
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
    </div>
  );
}
