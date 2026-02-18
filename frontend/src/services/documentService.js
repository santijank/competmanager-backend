import api from './api';

/**
 * Document Service - สำหรับ Generate PDF Documents
 */
const documentService = {
  /**
   * Generate Student Check-in Document (DOC1)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateStudentCheckin(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/student-checkin`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating student checkin:', error);
      throw new Error('ไม่สามารถสร้างเอกสารลงทะเบียนนักเรียนได้');
    }
  },

  /**
   * Generate Teacher Check-in Document (DOC2)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateTeacherCheckin(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/teacher-checkin`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating teacher checkin:', error);
      throw new Error('ไม่สามารถสร้างเอกสารลงทะเบียนครูได้');
    }
  },

  /**
   * Generate Competition Summary
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateSummary(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/summary`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('ไม่สามารถสร้างเอกสารสรุปผู้เข้าแข่งขันได้');
    }
  },

  /**
   * Generate Committee Check-in Document (DOC.03)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateCommitteeSignin(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/committee-checkin`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating committee checkin:', error);
      throw new Error('ไม่สามารถสร้างเอกสารลงทะเบียนกรรมการได้');
    }
  },

  /**
   * Generate Staff Check-in Document (DC.05 - คณะกรรมการดำเนินงาน)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateStaffCheckin(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/staff-checkin`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating staff checkin:', error);
      throw new Error('ไม่สามารถสร้างเอกสารลงทะเบียนคณะกรรมการดำเนินงานได้');
    }
  },

  /**
   * Download PDF file
   * @param {Blob} blob - PDF blob
   * @param {string} filename - ชื่อไฟล์
   */
  downloadPDF(blob, filename) {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('ไม่สามารถดาวน์โหลดไฟล์ PDF ได้');
    }
  },

  /**
   * Open PDF in new tab
   * @param {Blob} blob - PDF blob
   */
  openPDFInNewTab(blob) {
    try {
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('โปรดอนุญาตให้เปิด popup window');
      }
      
      // Revoke URL after window is loaded
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error opening PDF:', error);
      throw new Error('ไม่สามารถเปิดไฟล์ PDF ได้');
    }
  },

  /**
   * Generate and Download Student Check-in (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadStudentCheckin(competitionId, competitionCode) {
    const blob = await this.generateStudentCheckin(competitionId);
    const filename = `ลงทะเบียนนักเรียน_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate and Download Teacher Check-in (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadTeacherCheckin(competitionId, competitionCode) {
    const blob = await this.generateTeacherCheckin(competitionId);
    const filename = `ลงทะเบียนครู_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate and Download Summary (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadSummary(competitionId, competitionCode) {
    const blob = await this.generateSummary(competitionId);
    const filename = `สรุปผู้เข้าแข่งขัน_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate and Download Committee Sign-in (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadCommitteeSignin(competitionId, competitionCode) {
    const blob = await this.generateCommitteeSignin(competitionId);
    const filename = `ลงทะเบียนกรรมการ_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate Score Sheet Document (DOC4)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateScoreSheet(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/score-sheet`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating score sheet:', error);
      throw new Error('ไม่สามารถสร้างใบลงคะแนนได้');
    }
  },

  /**
   * Generate and Download Score Sheet (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadScoreSheet(competitionId, competitionCode) {
    const blob = await this.generateScoreSheet(competitionId);
    const filename = `ใบลงคะแนน_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate Cover Sheet Document (ใบปะหน้าซองเอกสาร)
   * @param {number} competitionId - ID ของกิจกรรม
   * @returns {Promise<Blob>} - PDF file
   */
  async generateCoverSheet(competitionId) {
    try {
      const response = await api.get(
        `/documents/competitions/${competitionId}/cover-sheet`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating cover sheet:', error);
      throw new Error('ไม่สามารถสร้างใบปะหน้าซองเอกสารได้');
    }
  },

  /**
   * Generate and Download Cover Sheet (ทางลัด)
   * @param {number} competitionId - ID ของกิจกรรม
   * @param {string} competitionCode - รหัสการแข่งขัน
   */
  async downloadCoverSheet(competitionId, competitionCode) {
    const blob = await this.generateCoverSheet(competitionId);
    const filename = `ใบปะหน้าซอง_${competitionCode}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Generate School Registrations Document
   * @param {string} status - 'approved' or 'pending'
   * @returns {Promise<Blob>} - PDF file
   */
  async generateSchoolRegistrations(status) {
    try {
      const response = await api.get(
        `/documents/school-registrations`,
        {
          params: { status },
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating school registrations:', error);
      throw new Error('ไม่สามารถสร้างเอกสารรายการลงทะเบียนได้');
    }
  },

  /**
   * Generate and Download School Registrations (ทางลัด)
   * @param {string} status - 'approved' or 'pending'
   */
  async downloadSchoolRegistrations(status) {
    const blob = await this.generateSchoolRegistrations(status);
    const statusLabel = status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ';
    const filename = `รายการลงทะเบียน_${statusLabel}.pdf`;
    this.downloadPDF(blob, filename);
  },

  /**
   * Batch Export - ออกเอกสารทุกกิจกรรมในหมวดหมู่รวมเป็น 1 PDF
   * @param {number} categoryId - ID ของหมวดหมู่
   * @param {string} type - ประเภทเอกสาร (student-checkin, teacher-checkin, summary, committee-checkin, score-sheet, cover-sheet)
   * @returns {Promise<Blob>} - PDF file
   */
  async batchExport(categoryId, type) {
    try {
      const response = await api.post(
        '/documents/batch-export',
        { category_id: categoryId, type: type },
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error batch exporting:', error);
      throw new Error('ไม่สามารถสร้างเอกสารแบบรวมได้');
    }
  },

  /**
   * Generate Category Overview PDF - สรุปหมวดหมู่การแข่งขันทั้งหมด
   * @returns {Promise<Blob>} - PDF file
   */
  async generateCategoryOverview() {
    try {
      const response = await api.get(
        '/documents/category-overview',
        {
          responseType: 'blob',
        }
      );
      // Check if response is actually JSON error (not PDF)
      if (response.data.type && response.data.type.includes('json')) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || errorData.error || 'Unknown error');
      }
      return response.data;
    } catch (error) {
      console.error('Error generating category overview:', error);
      // Try to read error from blob response
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างเอกสารสรุปหมวดหมู่ได้');
        } catch (parseError) {
          // If we can't parse the blob, throw original error
        }
      }
      throw new Error(error.message || 'ไม่สามารถสร้างเอกสารสรุปหมวดหมู่ได้');
    }
  },
};

export default documentService;
