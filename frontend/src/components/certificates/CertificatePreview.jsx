import { useState } from 'react';
import { X, FileText } from 'lucide-react';

export default function CertificatePreview({ data, templates, onClose, onGenerate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    templates.find(t => t.code === 'default')?.id || templates[0]?.id || 1
  );

  const getMedalLabel = (medal) => {
    const labels = {
      gold: 'เหรียญทอง',
      silver: 'เหรียญเงิน',
      bronze: 'เหรียญทองแดง',
    };
    return labels[medal] || medal;
  };

  const getLevelLabel = (level) => {
    const labels = {
      group: 'ระดับกลุ่มโรงเรียน',
      district: 'ระดับเขตพื้นที่',
    };
    return labels[level] || level;
  };

  const currentTemplate = templates.find(t => t.id === parseInt(selectedTemplate));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ดูตัวอย่างเกียรติบัตร</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data?.student_name} - {data?.school_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Template Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกเทมเพลต
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="input w-full"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="border-2 border-gray-200 rounded-lg p-8 bg-gray-50">
            {/* Certificate Preview - Simulated */}
            <div
              className="bg-white shadow-lg mx-auto"
              style={{
                width: '100%',
                maxWidth: '842px',
                aspectRatio: '842/595',
                position: 'relative',
                backgroundImage: currentTemplate?.background_image
                  ? `url(${currentTemplate.background_url})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Preview Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {data?.student_name || 'ชื่อนักเรียน'}
                  </h1>
                  <p className="text-xl text-gray-700">
                    โรงเรียน{data?.school_name || 'ชื่อโรงเรียน'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {data?.competition_name || 'ชื่อการแข่งขัน'}
                  </p>
                  {data?.medal && data.medal !== 'none' && (
                    <p className="text-3xl font-bold text-yellow-600">
                      ได้รับรางวัล {getMedalLabel(data.medal)}
                    </p>
                  )}
                  {data?.rank && (
                    <p className="text-xl text-gray-700">
                      อันดับที่ {data.rank}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-8">
                    {getLevelLabel(data?.level)}
                  </p>
                </div>
              </div>

              {/* Preview Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-gray-300 opacity-20 rotate-[-30deg]">
                  PREVIEW
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>หมายเหตุ:</strong> นี่เป็นเพียงการแสดงตัวอย่างเบื้องต้น 
                เกียรติบัตรจริงจะมีรูปแบบและรายละเอียดตามเทมเพลตที่เลือก
              </p>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">รหัสเกียรติบัตร</p>
              <p className="font-medium text-gray-900">
                {data?.certificate_code || 'จะสร้างอัตโนมัติ'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">การแข่งขัน</p>
              <p className="font-medium text-gray-900">
                {data?.competition_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">เหรียญ</p>
              <p className="font-medium text-gray-900">
                {getMedalLabel(data?.medal)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">อันดับ</p>
              <p className="font-medium text-gray-900">
                {data?.rank ? `อันดับที่ ${data.rank}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onGenerate(selectedTemplate)}
            className="btn btn-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            สร้างเกียรติบัตร
          </button>
        </div>
      </div>
    </div>
  );
}
