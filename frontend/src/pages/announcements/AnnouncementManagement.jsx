import { useState, useEffect } from 'react';
import { Plus, Pin, Edit, Trash2, AlertCircle, Link as LinkIcon, ExternalLink, X, ImageIcon, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    api.get('/auth/me').then(res => {
      const u = res.data?.data || res.data;
      setUserRole(u?.role);
    }).catch(() => {});
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      const data = response.data;
      const announcementsList = data.data || data;
      setAnnouncements(Array.isArray(announcementsList) ? announcementsList : []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('ไม่สามารถโหลดประกาศได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบประกาศนี้?')) return;

    try {
      await api.delete(`/announcements/${id}`);
      toast.success('ลบประกาศสำเร็จ');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถลบประกาศได้');
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await api.post(`/announcements/${id}/toggle-pin`);
      toast.success('อัปเดตสถานะปักหมุดสำเร็จ');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถอัปเดตได้');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการประกาศ</h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการประกาศพร้อมลิงก์ไฟล์</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          สร้างประกาศใหม่
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcementId={editingId}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingId(null);
            fetchAnnouncements();
          }}
        />
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            userRole={userRole}
            onEdit={(id) => {
              setEditingId(id);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
          />
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">ยังไม่มีประกาศในระบบ</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              สร้างประกาศแรก
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AnnouncementCard = ({ announcement, onEdit, onDelete, onTogglePin, userRole }) => {
  const priorityColors = {
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const typeLabels = {
    general: 'ทั่วไป',
    competition: 'การแข่งขัน',
    result: 'ผลการแข่งขัน',
    urgent: 'ด่วน',
  };

  const scopeLabels = {
    district: 'ระดับเขต',
    group: 'ระดับกลุ่ม',
  };

  // ตรวจสอบว่าเป็น Google Drive link หรือไม่
  const isGoogleDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
            {announcement.is_pinned ? (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                <Pin className="w-3 h-3 mr-1" />
                ปักหมุด
              </span>
            ) : null}
            <span className={`px-2 py-1 rounded text-xs ${priorityColors[announcement.priority]}`}>
              {announcement.priority === 'urgent' ? '🚨 ด่วน' :
               announcement.priority === 'high' ? '⚠️ สำคัญ' : 'ปกติ'}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
              {typeLabels[announcement.type]}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800">
              {scopeLabels[announcement.scope]}
            </span>
            {announcement.school_group_name && (
              <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                {announcement.school_group_name}
              </span>
            )}
            {announcement.link_url && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                <LinkIcon className="w-3 h-3 mr-1" />
                {isGoogleDriveLink(announcement.link_url) ? 'Google Drive' : 'ลิงก์'}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {announcement.title}
          </h3>
          <p className="text-gray-600 mb-3 line-clamp-2 whitespace-pre-wrap">
            {announcement.content}
          </p>

          {/* แสดงรูปภาพ */}
          {announcement.image_url && (
            <div className="mb-3">
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${announcement.image_url}`}
                alt={announcement.title}
                className="max-w-md max-h-48 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-90"
                onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '')}${announcement.image_url}`, '_blank')}
              />
            </div>
          )}

          {/* แสดงลิงก์ Google Drive หรือลิงก์อื่นๆ */}
          {announcement.link_url && (
            <div className="mb-3">
              <a
                href={announcement.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {isGoogleDriveLink(announcement.link_url) ? (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zM8.72 5h6.56l3.29 5.4H5.43l3.29-5.4zm-3.56 6.9h13.68l-3.43 5.6H8.59l-3.43-5.6zM5.86 18l1.72-2.8h8.84l1.72 2.8H5.86z"/>
                    </svg>
                    {announcement.link_title || 'เปิดไฟล์ใน Google Drive'}
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {announcement.link_title || 'เปิดลิงก์'}
                  </>
                )}
              </a>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>
              เผยแพร่: {new Date(announcement.published_at).toLocaleDateString('th-TH')}
            </span>
            {announcement.expired_at && (
              <span>
                หมดอายุ: {new Date(announcement.expired_at).toLocaleDateString('th-TH')}
              </span>
            )}
            <span>
              โดย: {announcement.created_by_name || 'ไม่ระบุ'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onTogglePin(announcement.id)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            title={announcement.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}
          >
            <Pin className={`w-5 h-5 ${announcement.is_pinned ? 'fill-current text-yellow-600' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(announcement.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit className="w-5 h-5" />
          </button>
          {userRole !== 'data_entry' && (
            <button
              onClick={() => onDelete(announcement.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AnnouncementForm = ({ announcementId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    scope: 'district',
    school_group_id: '',
    priority: 'normal',
    is_pinned: false,
    published_at: new Date().toISOString().slice(0, 16),
    expired_at: '',
    link_url: '',
    link_title: '',
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchSchoolGroups();
    if (announcementId) {
      fetchAnnouncement();
    }
  }, [announcementId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data || response.data;
      setCurrentUser(user);

      // ถ้าเป็น Group Admin และเป็นการสร้างใหม่ → ตั้งค่า scope และ group อัตโนมัติ
      if (user.role === 'group_admin' && !announcementId) {
        setFormData(prev => ({
          ...prev,
          scope: 'group',
          school_group_id: user.school_group_id || ''
        }));
      }

      // Category Admin / Data Entry → ตั้งค่า scope=district อัตโนมัติ
      if (['category_admin', 'data_entry'].includes(user.role) && !announcementId) {
        setFormData(prev => ({
          ...prev,
          scope: 'district',
          school_group_id: ''
        }));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      const groups = response.data.data || response.data || [];
      setSchoolGroups(Array.isArray(groups) ? groups : []);
    } catch (error) {
      console.error('Error fetching school groups:', error);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const response = await api.get(`/announcements/${announcementId}`);
      const data = response.data.data || response.data;
      setFormData({
        title: data.title || '',
        content: data.content || '',
        type: data.type || 'general',
        scope: data.scope || 'district',
        school_group_id: data.school_group_id || '',
        priority: data.priority || 'normal',
        is_pinned: data.is_pinned || false,
        published_at: data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : '',
        expired_at: data.expired_at ? new Date(data.expired_at).toISOString().slice(0, 16) : '',
        link_url: data.link_url || '',
        link_title: data.link_title || '',
      });
      if (data.image_url) {
        setExistingImage(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องไม่เกิน 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ใช้ FormData เพื่อรองรับ file upload
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      fd.append('type', formData.type);
      fd.append('scope', formData.scope);
      fd.append('priority', formData.priority);
      fd.append('is_pinned', formData.is_pinned ? 1 : 0);
      if (formData.published_at) fd.append('published_at', formData.published_at);
      if (formData.expired_at) fd.append('expired_at', formData.expired_at);
      if (formData.link_url) fd.append('link_url', formData.link_url);
      if (formData.link_title) fd.append('link_title', formData.link_title);
      if (formData.school_group_id) fd.append('school_group_id', formData.school_group_id);
      if (imageFile) fd.append('image', imageFile);
      if (removeImage) fd.append('remove_image', 1);

      if (announcementId) {
        // แก้ไข - ใช้ POST + _method=PUT เพราะ FormData ไม่รองรับ PUT
        fd.append('_method', 'PUT');
        await api.post(`/announcements/${announcementId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('แก้ไขประกาศสำเร็จ');
      } else {
        // สร้างใหม่
        const isAll = formData.school_group_id === 'all';
        await api.post('/announcements', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (isAll) {
          toast.success(`สร้างประกาศไปยังทุกกลุ่มโรงเรียนสำเร็จ (${schoolGroups.length} กลุ่ม)`);
        } else {
          toast.success('สร้างประกาศสำเร็จ');
        }
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving announcement:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors || 'เกิดข้อผิดพลาด';
      if (typeof errorMsg === 'object') {
        Object.values(errorMsg).forEach(msgs => {
          if (Array.isArray(msgs)) {
            msgs.forEach(msg => toast.error(msg));
          }
        });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isGroupAdmin = currentUser?.role === 'group_admin';
  const isCategoryOrDataEntry = ['category_admin', 'data_entry'].includes(currentUser?.role);

  // ตรวจสอบว่าเป็น Google Drive link หรือไม่
  const isGoogleDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {announcementId ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">หัวข้อประกาศ *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">เนื้อหา *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="5"
                required
              />
            </div>

            {/* ลิงก์ Google Drive / URL */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">ลิงก์ไฟล์ (Google Drive / URL อื่นๆ)</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-800">URL ลิงก์</label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.link_url && isGoogleDriveLink(formData.link_url) && (
                    <p className="text-xs text-green-600 mt-1">✓ ตรวจพบลิงก์ Google Drive</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-800">ชื่อลิงก์ (ไม่บังคับ)</label>
                  <input
                    type="text"
                    value={formData.link_title}
                    onChange={(e) => setFormData({ ...formData, link_title: e.target.value })}
                    placeholder="เช่น ดาวน์โหลดเอกสารแนบ, ดูรายละเอียดเพิ่มเติม"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-xs text-blue-700 mt-2">
                💡 วิธีใช้งาน: คัดลอกลิงก์จาก Google Drive แล้ววางที่นี่
                (ตรวจสอบว่าได้แชร์ไฟล์เป็น "ทุกคนที่มีลิงก์" แล้ว)
              </p>
            </div>

            {/* รูปภาพ */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">รูปภาพประกอบ (ไม่บังคับ)</h3>
              </div>

              {/* แสดง preview รูปภาพ */}
              {(imagePreview || (existingImage && !removeImage)) && (
                <div className="relative inline-block mb-3">
                  <img
                    src={imagePreview || `${import.meta.env.VITE_API_URL?.replace('/api', '')}${existingImage}`}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                    title="ลบรูปภาพ"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
              />
              <p className="text-xs text-green-700 mt-1">รองรับ JPG, PNG, GIF, WebP ขนาดไม่เกิน 5MB</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ประเภท *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">ทั่วไป</option>
                  <option value="competition">การแข่งขัน</option>
                  <option value="result">ผลการแข่งขัน</option>
                  <option value="urgent">ด่วน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ขอบเขต *</label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value, school_group_id: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isGroupAdmin || isCategoryOrDataEntry}
                >
                  <option value="district">ระดับเขต</option>
                  <option value="group">ระดับกลุ่ม</option>
                </select>
                {isGroupAdmin && (
                  <p className="text-xs text-blue-600 mt-1">
                    📌 คุณสร้างประกาศได้เฉพาะกลุ่มของคุณเท่านั้น
                  </p>
                )}
                {isCategoryOrDataEntry && (
                  <p className="text-xs text-blue-600 mt-1">
                    📌 ประกาศจะแสดงในระดับเขตอัตโนมัติ
                  </p>
                )}
              </div>
            </div>

            {/* แสดง dropdown เลือกกลุ่มเฉพาะ District Admin */}
            {formData.scope === 'group' && !isGroupAdmin && (
              <div>
                <label className="block text-sm font-medium mb-2">กลุ่มโรงเรียน *</label>
                <select
                  value={formData.school_group_id}
                  onChange={(e) => setFormData({ ...formData, school_group_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- เลือกกลุ่มโรงเรียน --</option>
                  <option value="all">📢 ทุกกลุ่มโรงเรียน (ส่งประกาศไปทุกกลุ่ม)</option>
                  {schoolGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {formData.school_group_id === 'all' && (
                  <p className="text-xs text-blue-600 mt-1">
                    📢 ระบบจะสร้างประกาศไปยังทุกกลุ่มโรงเรียน ({schoolGroups.length} กลุ่ม) ในครั้งเดียว
                  </p>
                )}
              </div>
            )}

            {/* แสดงชื่อกลุ่มสำหรับ Group Admin (read-only) */}
            {formData.scope === 'group' && isGroupAdmin && currentUser && (
              <div>
                <label className="block text-sm font-medium mb-2">กลุ่มโรงเรียน</label>
                <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-700">
                  {schoolGroups.find(g => g.id == currentUser.school_group_id)?.name || 'กลุ่มของคุณ'}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">ระดับความสำคัญ *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">ปกติ</option>
                <option value="high">สำคัญ</option>
                <option value="urgent">ด่วน</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">วันที่เผยแพร่</label>
                <input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">วันหมดอายุ</label>
                <input
                  type="datetime-local"
                  value={formData.expired_at}
                  onChange={(e) => setFormData({ ...formData, expired_at: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_pinned" className="text-sm font-medium">
                📌 ปักหมุดประกาศนี้
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
