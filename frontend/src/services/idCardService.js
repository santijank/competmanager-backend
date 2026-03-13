import api from './api';
import documentService from './documentService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Normalize รูปภาพ: แก้ EXIF orientation + resize ให้เหมาะกับบัตร
 * createImageBitmap จัดการ EXIF orientation อัตโนมัติใน browser สมัยใหม่
 */
async function normalizePhoto(file) {
  const bitmap = await createImageBitmap(file);
  const MAX_W = 800, MAX_H = 1000;
  let w = bitmap.width, h = bitmap.height;
  if (w > MAX_W || h > MAX_H) {
    const scale = Math.min(MAX_W / w, MAX_H / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

const idCardService = {
  /**
   * ดึงรูปถ่ายทั้งหมดของ registration
   */
  async getPhotos(registrationId) {
    const response = await api.get(`/id-cards/registrations/${registrationId}/photos`);
    return response.data.data;
  },

  /**
   * อัพโหลดรูปถ่าย — upload ไป Firebase Storage แล้วส่ง URL ให้ backend
   */
  async uploadPhoto(registrationId, personType, personIndex, file) {
    // 1. Normalize (EXIF fix + resize)
    const blob = await normalizePhoto(file);

    // 2. Upload ไป Firebase Storage
    const path = `id-cards/${registrationId}/${personType}_${personIndex}.jpg`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const photoUrl = await getDownloadURL(snapshot.ref);

    // 3. ส่ง URL ให้ backend เก็บใน DB
    const response = await api.post(
      `/id-cards/registrations/${registrationId}/photos`,
      {
        person_type: personType,
        person_index: personIndex,
        photo_url: photoUrl,
      }
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
      timeout: 300000,
    });
    return response.data;
  },

  /**
   * เปิด PDF ของ 1 กิจกรรมใน tab ใหม่
   */
  async openPdf(registrationId, preOpenedWindow) {
    const blob = await this.generatePdf(registrationId);
    documentService.openPDFInNewTab(blob, preOpenedWindow);
  },

  /**
   * สร้าง PDF บัตรประจำตัวทั้งหมดของโรงเรียน
   * level: 'district' | 'group' | undefined (ทั้งหมด)
   */
  async generateAllPdf(level) {
    const params = {};
    if (level) params.level = level;
    const response = await api.get('/id-cards/school/pdf', {
      params,
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' },
      timeout: 600000,
    });
    return response.data;
  },

  /**
   * เปิด PDF ใน tab ใหม่
   */
  async openAllPdf(level, preOpenedWindow) {
    const blob = await this.generateAllPdf(level);
    documentService.openPDFInNewTab(blob, preOpenedWindow);
  },
};

export default idCardService;
