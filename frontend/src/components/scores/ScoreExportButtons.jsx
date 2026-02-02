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
          filename = `คะแนนการแข่งขัน_${competitionId}.pdf`;
          contentType = 'application/pdf';
          break;
          
        case 'excel':
          endpoint = `/competitions/${competitionId}/scores/export/excel`;
          filename = `คะแนนการแข่งขัน_${competitionId}.xlsx`;
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
      const message = error.response?.data?.message || `ไม่สามารถดาวน์โหลด${getTypeLabel(type)}ได้`;
      toast.error(message);
    } finally {
      setExporting(null);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'pdf':
        return 'คะแนน (PDF)';
      case 'excel':
        return 'คะแนน (Excel)';
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
        className="btn btn-outline btn-sm"
        title="ดาวน์โหลดคะแนน PDF"
      >
        <FileDown className="h-4 w-4 mr-2" />
        {exporting === 'pdf' ? 'กำลังสร้าง...' : 'PDF'}
      </button>

      {/* Export Excel */}
      <button
        onClick={() => handleExport('excel')}
        disabled={exporting === 'excel'}
        className="btn btn-outline btn-sm"
        title="ดาวน์โหลดคะแนน Excel"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {exporting === 'excel' ? 'กำลังสร้าง...' : 'Excel'}
      </button>

      {/* Export Blank Sheet */}
      <button
        onClick={() => handleExport('blank-sheet')}
        disabled={exporting === 'blank-sheet'}
        className="btn btn-outline btn-sm"
        title="ดาวน์โหลดแบบฟอร์มว่าง"
      >
        <FilePlus className="h-4 w-4 mr-2" />
        {exporting === 'blank-sheet' ? 'กำลังสร้าง...' : 'แบบฟอร์มว่าง'}
      </button>

      {/* Export Leaderboard */}
      {hasScores && (
        <button
          onClick={() => handleExport('leaderboard')}
          disabled={exporting === 'leaderboard'}
          className="btn btn-primary btn-sm"
          title="ดาวน์โหลดกระดานคะแนน"
        >
          <Trophy className="h-4 w-4 mr-2" />
          {exporting === 'leaderboard' ? 'กำลังสร้าง...' : 'กระดานคะแนน'}
        </button>
      )}
    </div>
  );
}
