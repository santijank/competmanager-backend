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
};

export default documentService;
