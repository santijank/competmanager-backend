import { useState } from 'react';
import { FileDown, FileSpreadsheet, FilePlus, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

export default function ScoreExportButtons({ competitionId, hasScores = false }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    try {
      setExporting(type);

      let endpoint = '';
      let filename = '';
      let contentType = '';

      switch (type) {
        case 'pdf':
          endpoint = `/competitions/${competitionId}/scores/export/pdf`;
          filename = `ผลคะแนน_${competitionId}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'excel':
          endpoint = `/competitions/${competitionId}/scores/export/excel`;
          filename = `ผลคะแนน_${competitionId}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'blank-sheet':
          endpoint = `/competitions/${competitionId}/scores/export/blank-sheet`;
          filename = `แบบฟอร์มคะแนน_${competitionId}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'leaderboard':
          endpoint = `/competitions/${competitionId}/scores/export/leaderboard`;
          filename = `กระดานคะแนน_${competitionId}.pdf`;
          contentType = 'application/pdf';
          break;

        default:
          throw new Error('Invalid export type');
      }

      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      // ตรวจสอบว่า response เป็น JSON error หรือไม่ (blob ที่เป็น application/json)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'เกิดข้อผิดพลาด');
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`ดาวน์โหลด${getTypeLabel(type)}สำเร็จ`);

    } catch (error) {
      console.error('Export error:', error);

      // Handle blob error response (when server returns JSON error with blob responseType)
      let message = `ไม่สามารถดาวน์โหลด${getTypeLabel(type)}ได้`;
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch (e) {
          // ignore parse error
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setExporting(null);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'pdf':
        return 'ผลคะแนน (PDF)';
      case 'excel':
        return 'ผลคะแนน (Excel)';
      case 'blank-sheet':
        return 'แบบฟอร์มว่าง';
      case 'leaderboard':
        return 'กระดานคะแนน';
      default:
        return 'ไฟล์';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Export PDF */}
      <button
        onClick={() => handleExport('pdf')}
        disabled={exporting === 'pdf'}
        className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="ดาวน์โหลดผลคะแนน PDF"
      >
        <FileDown className="h-4 w-4 mr-1.5" />
        {exporting === 'pdf' ? 'กำลังสร้าง...' : 'PDF'}
      </button>

      {/* Export Excel */}
      <button
        onClick={() => handleExport('excel')}
        disabled={exporting === 'excel'}
        className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="ดาวน์โหลดผลคะแนน Excel"
      >
        <FileSpreadsheet className="h-4 w-4 mr-1.5" />
        {exporting === 'excel' ? 'กำลังสร้าง...' : 'Excel'}
      </button>

      {/* Export Blank Sheet */}
      <button
        onClick={() => handleExport('blank-sheet')}
        disabled={exporting === 'blank-sheet'}
        className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="ดาวน์โหลดแบบฟอร์มว่าง"
      >
        <FilePlus className="h-4 w-4 mr-1.5" />
        {exporting === 'blank-sheet' ? 'กำลังสร้าง...' : 'แบบฟอร์มว่าง'}
      </button>

      {/* Export Leaderboard */}
      {hasScores && (
        <button
          onClick={() => handleExport('leaderboard')}
          disabled={exporting === 'leaderboard'}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="ดาวน์โหลดกระดานคะแนน"
        >
          <Trophy className="h-4 w-4 mr-1.5" />
          {exporting === 'leaderboard' ? 'กำลังสร้าง...' : 'กระดานคะแนน'}
        </button>
      )}
    </div>
  );
}
