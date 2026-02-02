import { useState } from 'react';
import { FileDown, FileSpreadsheet, FileBarChart, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

export default function RegistrationExportButtons({ 
  competitionId, 
  registrationsCount = 0,
  currentStatus = 'all' 
}) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    try {
      setExporting(type);
      
      let endpoint = '';
      let filename = '';
      let contentType = '';
      
      // Add status parameter
      const statusParam = currentStatus !== 'all' ? `?status=${currentStatus}` : '';
      
      switch (type) {
        case 'pdf':
          endpoint = `/competitions/${competitionId}/registrations/export/pdf${statusParam}`;
          filename = `รายการลงทะเบียน_${competitionId}.pdf`;
          contentType = 'application/pdf';
          break;
          
        case 'excel':
          endpoint = `/competitions/${competitionId}/registrations/export/excel${statusParam}`;
          filename = `รายการลงทะเบียน_${competitionId}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        case 'summary':
          endpoint = `/competitions/${competitionId}/registrations/export/summary`;
          filename = `สรุปการลงทะเบียน_${competitionId}.pdf`;
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
        return 'รายการลงทะเบียน (PDF)';
      case 'excel':
        return 'รายการลงทะเบียน (Excel)';
      case 'summary':
        return 'สรุปสถิติ';
      default:
        return 'ไฟล์';
    }
  };

  const getStatusLabel = () => {
    switch (currentStatus) {
      case 'approved':
        return 'อนุมัติ';
      case 'pending':
        return 'รอพิจารณา';
      case 'rejected':
        return 'ไม่อนุมัติ';
      default:
        return 'ทั้งหมด';
    }
  };

  return (
    <div className="space-y-2">
      {/* Status indicator */}
      {currentStatus !== 'all' && (
        <div className="text-sm text-gray-600">
          กำลัง Export: <span className="font-medium">สถานะ {getStatusLabel()}</span>
        </div>
      )}
      
      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Export PDF */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={exporting === 'pdf' || registrationsCount === 0}
          className={`btn btn-outline btn-sm ${
            registrationsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={registrationsCount === 0 ? 'ยังไม่มีการลงทะเบียน' : 'ดาวน์โหลด PDF'}
        >
          <FileDown className="h-4 w-4 mr-2" />
          {exporting === 'pdf' ? 'กำลังสร้าง...' : 'PDF'}
        </button>

        {/* Export Excel */}
        <button
          onClick={() => handleExport('excel')}
          disabled={exporting === 'excel' || registrationsCount === 0}
          className={`btn btn-outline btn-sm ${
            registrationsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={registrationsCount === 0 ? 'ยังไม่มีการลงทะเบียน' : 'ดาวน์โหลด Excel'}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {exporting === 'excel' ? 'กำลังสร้าง...' : 'Excel'}
        </button>

        {/* Export Summary */}
        <button
          onClick={() => handleExport('summary')}
          disabled={exporting === 'summary' || registrationsCount === 0}
          className={`btn btn-outline btn-sm ${
            registrationsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={registrationsCount === 0 ? 'ยังไม่มีการลงทะเบียน' : 'ดาวน์โหลดสรุปสถิติ'}
        >
          <FileBarChart className="h-4 w-4 mr-2" />
          {exporting === 'summary' ? 'กำลังสร้าง...' : 'สรุปสถิติ'}
        </button>
      </div>
    </div>
  );
}

// Export button for individual registration certificate
export function RegistrationCertificateButton({ 
  competitionId, 
  registration, 
  className = '' 
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    // Check if has result
    if (!registration.result) {
      toast.warning('ทีมนี้ยังไม่มีผลคะแนน');
      return;
    }

    try {
      setExporting(true);
      
      const response = await api.get(
        `/competitions/${competitionId}/registrations/${registration.id}/export/certificate`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `เกียรติบัตร_${registration.school?.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('ดาวน์โหลดเกียรติบัตรสำเร็จ');
      
    } catch (error) {
      console.error('Certificate export error:', error);
      const message = error.response?.data?.message || 'ไม่สามารถดาวน์โหลดเกียรติบัตรได้';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !registration.result}
      className={`btn btn-sm ${className} ${
        !registration.result ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={!registration.result ? 'ยังไม่มีผลคะแนน' : 'ดาวน์โหลดเกียรติบัตร'}
    >
      <Award className="h-4 w-4 mr-1" />
      {exporting ? 'กำลังสร้าง...' : 'เกียรติบัตร'}
    </button>
  );
}
