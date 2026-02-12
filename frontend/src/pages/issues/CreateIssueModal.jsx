import { useState } from 'react';
import { X, Upload, Image, File, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { issueService } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'system_bug', label: 'แจ้งปัญหาระบบ' },
  { value: 'data_issue', label: 'แก้ไขข้อมูล' },
  { value: 'feature_request', label: 'เสนอแนะ' },
  { value: 'inquiry', label: 'สอบถาม' },
  { value: 'complaint', label: 'ร้องเรียน' },
  { value: 'other', label: 'อื่นๆ' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'ต่ำ', color: 'text-gray-600' },
  { value: 'normal', label: 'ปกติ', color: 'text-blue-600' },
  { value: 'high', label: 'สำคัญ', color: 'text-orange-600' },
  { value: 'urgent', label: 'ด่วนมาก', color: 'text-red-600' },
];

const CreateIssueModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'inquiry',
    priority: 'normal',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 5) {
      toast.warning('แนบได้สูงสุด 5 ไฟล์');
      return;
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('กรุณากรอกหัวข้อและรายละเอียด');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('type', formData.type);
      fd.append('priority', formData.priority);
      fd.append('description', formData.description);
      files.forEach(file => fd.append('attachments[]', file));

      await issueService.create(fd);
      toast.success('แจ้งปัญหาสำเร็จ');
      onSuccess?.();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'เกิดข้อผิดพลาด';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = (file) => file.type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">แจ้งปัญหาใหม่</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="ระบุหัวข้อปัญหา..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="อธิบายปัญหาที่พบ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              required
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แนบไฟล์ (สูงสุด 5 ไฟล์, ไม่เกิน 10MB/ไฟล์)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
                <p className="text-xs text-gray-400 mt-1">รองรับ: รูปภาพ, PDF, Word, Excel, ZIP</p>
              </label>
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      {isImage(file) ? (
                        <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <span>ส่งแจ้งปัญหา</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
