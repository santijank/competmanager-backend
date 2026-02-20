import api from './api';
import documentService from './documentService';

const idCardService = {
  /**
   * ดึงรูปถ่ายทั้งหมดของ registration
   */
  async getPhotos(registrationId) {
    const response = await api.get(`/id-cards/registrations/${registrationId}/photos`);
    return response.data.data;
  },

  /**
   * อัพโหลดรูปถ่าย
   */
  async uploadPhoto(registrationId, personType, personIndex, file) {
    const formData = new FormData();
    formData.append('person_type', personType);
    formData.append('person_index', personIndex);
    formData.append('photo', file);
    const response = await api.post(
      `/id-cards/registrations/${registrationId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * ลบรูปถ่าย
   */
  async deletePhoto(registrationId, personType, personIndex) {
    await api.delete(`/id-cards/registrations/${registrationId}/photos`, {
      params: { person_type: personType, person_index: personIndex },
    });
  },

  /**
   * สร้าง PDF บัตรประจำตัวของ 1 registration (กิจกรรมเดียว)
   */
  async generatePdf(registrationId) {
    const response = await api.get(`/id-cards/registrations/${registrationId}/pdf`, {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' },
      timeout: 120000,
    });
    return response.data;
  },

  /**
   * เปิด PDF ของ 1 กิจกรรมใน tab ใหม่
   */
  async openPdf(registrationId) {
    const blob = await this.generatePdf(registrationId);
    documentService.openPDFInNewTab(blob);
  },

  /**
   * สร้าง PDF บัตรประจำตัวทั้งหมดของโรงเรียน
   */
  async generateAllPdf() {
    const response = await api.get('/id-cards/school/pdf', {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' },
      timeout: 120000,
    });
    return response.data;
  },

  /**
   * เปิด PDF ใน tab ใหม่
   */
  async openAllPdf() {
    const blob = await this.generateAllPdf();
    documentService.openPDFInNewTab(blob);
  },
};

export default idCardService;
