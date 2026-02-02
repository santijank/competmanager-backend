import { useState } from 'react';
import { X, FileText, Download, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { certificateService } from '@/lib/api';

export default function CertificateBulkGenerate({ resultIds, templates, onClose, onSuccess }) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    templates.find(t => t.code === 'default')?.id || templates[0]?.id || 1
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setProgress({ current: 0, total: resultIds.length });

      // Get competition ID from first result (assuming all same competition)
      const competitionId = resultIds[0]; // Adjust this based on your data structure

      const response = await certificateService.bulkGenerate(competitionId, {
        result_ids: resultIds,
        template_id: selectedTemplate,
      });

      if (response.data.success) {
        const { created, failed } = response.data.data.summary;
        
        if (created > 0) {
          toast.success(`สร้างเกียรติบัตรสำเร็จ ${created} รายการ`);
        }
        
        if (failed > 0) {
          toast.warning(`สร้างไม่สำเร็จ ${failed} รายการ`);
        }

        onSuccess();
      } else {
        toast.error('ไม่สามารถสร้างเกียรติบัตรได้');
      }

    } catch (error) {
      console.error('Bulk generate error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างเกียรติบัตร');
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">สร้างเกียรติบัตรหลายรายการ</h2>
            <p className="text-sm text-gray-600 mt-1">
              เลือก {resultIds.length} รายการ
            </p>
          </div>
          {!generating && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกเทมเพลตเกียรติบัตร
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={generating}
              className="input w-full"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.code === 'default' && ' (เริ่มต้น)'}
                </option>
              ))}
            </select>
            {templates.find(t => t.id === parseInt(selectedTemplate))?.description && (
              <p className="mt-2 text-sm text-gray-500">
                {templates.find(t => t.id === parseInt(selectedTemplate)).description}
              </p>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>กำลังสร้าง...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">ข้อมูลการสร้าง</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• จำนวนเกียรติบัตร: {resultIds.length} ฉบับ</li>
              <li>• เทมเพลต: {templates.find(t => t.id === parseInt(selectedTemplate))?.name}</li>
              <li>• ประมาณการเวลา: {Math.ceil(resultIds.length / 10)} นาที</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>คำเตือน:</strong> การสร้างเกียรติบัตรจำนวนมากอาจใช้เวลาสักครู่ 
              กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={generating}
            className="btn btn-outline"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
          >
            {generating ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                สร้างเกียรติบัตร
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
