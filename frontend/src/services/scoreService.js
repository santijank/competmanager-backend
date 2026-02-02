// ไฟล์: frontend/src/services/scoreService.js

import apiClient from '@/lib/api/axios-interceptor';

/**
 * 🎯 Score Service
 * 
 * จัดการ API calls ทั้งหมดเกี่ยวกับระบบคะแนน
 */

export const scoreService = {
  /**
   * ดึงรายการที่สามารถใส่คะแนนได้ (Group/District Admin only)
   */
  getScorable: async (competitionId) => {
    const response = await apiClient.get(`/competitions/${competitionId}/scorable`);
    return response.data;
  },

  /**
   * ดึงคะแนนทั้งหมดของการแข่งขัน (ทุกคนดูได้)
   */
  getScores: async (competitionId) => {
    const response = await apiClient.get(`/competitions/${competitionId}/scores`);
    return response.data;
  },

  /**
   * ดึงสถิติคะแนน (ทุกคนดูได้)
   */
  getStatistics: async (competitionId) => {
    const response = await apiClient.get(`/competitions/${competitionId}/score-statistics`);
    return response.data;
  },

  /**
   * บันทึกคะแนน (Bulk save)
   */
  saveScores: async (competitionId, scores) => {
    const response = await apiClient.post(`/competitions/${competitionId}/scores`, {
      scores
    });
    return response.data;
  },

  /**
   * ล็อคคะแนน (Finalize)
   */
  finalizeScores: async (competitionId) => {
    const response = await apiClient.post(`/competitions/${competitionId}/finalize`);
    return response.data;
  },
};

export default scoreService;
