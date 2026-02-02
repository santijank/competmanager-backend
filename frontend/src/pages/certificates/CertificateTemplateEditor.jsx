import { useState, useEffect } from 'react';
import { Upload, Save, X, Image as ImageIcon, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { certificateTemplateService } from '@/lib/api';

export default function CertificateTemplateEditor() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layout: {},
    settings: {
      width: 842,
      height: 595,
      orientation: 'landscape',
      font_family: 'THSarabunNew',
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await certificateTemplateService.getAll();
      setTemplates(response?.data?.data || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
      toast.error('ไม่สามารถโหลดเทมเพลตได้');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackground = async (e, templateId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('template_id', templateId);
      formData.append('background', file);

      await certificateTemplateService.uploadBackground(formData);
      toast.success('อัพโหลดรูปพื้นหลังสำเร็จ');
      fetchTemplates();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('ไม่สามารถอัพโหลดรูปพื้นหลังได้');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!formData.name) {
        toast.warning('กรุณากรอกชื่อเทมเพลต');
        return;
      }

      await certificateTemplateService.create(formData);
      toast.success('สร้างเทมเพลตสำเร็จ');
      fetchTemplates();
      setEditMode(false);
      setFormData({
        name: '',
        description: '',
        layout: {},
        settings: {
          width: 842,
          height: 595,
          orientation: 'landscape',
          font_family: 'THSarabunNew',
        },
      });
    } catch (error) {
      console.error('Create template error:', error);
      toast.error('ไม่สามารถสร้างเทมเพลตได้');
    }
  };

  const handleUpdateTemplate = async (templateId, updates) => {
    try {
      await certificateTemplateService.update(templateId, updates);
      toast.success('แก้ไขเทมเพลตสำเร็จ');
      fetchTemplates();
    } catch (error) {
      console.error('Update template error:', error);
      toast.error('ไม่สามารถแก้ไขเทมเพลตได้');
    }
  };

  const handleDeleteTemplate = async (templateId, templateCode) => {
    if (templateCode === 'default') {
      toast.error('ไม่สามารถลบเทมเพลตเริ่มต้นได้');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?')) {
      return;
    }

    try {
      await certificateTemplateService.delete(templateId);
      toast.success('ลบเทมเพลตสำเร็จ');
      fetchTemplates();
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('ไม่สามารถลบเทมเพลตได้');
    }
  };

  const handleToggleActive = async (templateId, currentStatus) => {
    try {
      await certificateTemplateService.update(templateId, { is_active: !currentStatus });
      toast.success(currentStatus ? 'ปิดการใช้งานเทมเพลต' : 'เปิดการใช้งานเทมเพลต');
      fetchTemplates();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเทมเพลตเกียรติบัตร</h1>
          <p className="text-gray-600 mt-1">สร้างและแก้ไขเทมเพลตเกียรติบัตร</p>
        </div>
        <button
          onClick={() => setEditMode(true)}
          className="btn btn-primary"
        >
          <Upload className="h-4 w-4 mr-2" />
          สร้างเทมเพลตใหม่
        </button>
      </div>

      {/* Create/Edit Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">สร้างเทมเพลตใหม่</h2>
              <button
                onClick={() => setEditMode(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเทมเพลต *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="เช่น เทมเพลตทอง, เทมเพลตพิเศษ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows="3"
                  placeholder="คำอธิบายเทมเพลต"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>หมายเหตุ:</strong> หลังจากสร้างเทมเพลตแล้ว 
                  คุณสามารถอัพโหลดรูปพื้นหลังและปรับแต่ง layout ได้ในรายการเทมเพลต
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setEditMode(false)}
                className="btn btn-outline"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateTemplate}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                สร้างเทมเพลต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-shadow">
              {/* Background Preview */}
              <div
                className="h-48 rounded-lg mb-4 bg-gray-100 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: template.background_image
                    ? `url(${template.background_url})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!template.background_image && (
                  <ImageIcon className="h-12 w-12 text-white opacity-50" />
                )}
              </div>

              {/* Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  รหัส: {template.code}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {/* Upload Background */}
                <label className="btn btn-outline w-full cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  อัพโหลดพื้นหลัง
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadBackground(e, template.id)}
                    className="hidden"
                  />
                </label>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleActive(template.id, template.is_active)}
                  className="btn btn-outline w-full"
                >
                  {template.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                </button>

                {/* Delete */}
                {template.code !== 'default' && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.code)}
                    className="btn btn-outline w-full text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    ลบเทมเพลต
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="card text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ยังไม่มีเทมเพลต</p>
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-primary mt-4"
          >
            สร้างเทมเพลตแรก
          </button>
        </div>
      )}
    </div>
  );
}
