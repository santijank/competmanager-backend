// ไฟล์: src/lib/api/twoTierCompetition-service.js
import apiClient from './axios-interceptor';

/**
 * 🎯 Two-Tier Competition Service
 * 
 * ใช้ apiClient ที่มี Interceptor แล้ว:
 * - Auto add token
 * - Auto redirect on 401
 * - Show error toast
 */

// ========================================
// District Admin APIs
// ========================================

/**
 * Create Master Competition
 */
export const createMasterCompetition = async (data) => {
  const response = await apiClient.post('/competitions/two-tier/master', data);
  return response.data;
};

/**
 * Activate for all groups
 */
export const activateForAllGroups = async (competitionId) => {
  const response = await apiClient.post(
    `/competitions/two-tier/${competitionId}/activate-all-groups`
  );
  return response.data;
};

/**
 * Get Master Competition Overview
 */
export const getMasterOverview = async (competitionId) => {
  const response = await apiClient.get(
    `/competitions/two-tier/${competitionId}/overview`
  );
  return response.data;
};

// ========================================
// Group Admin APIs
// ========================================

/**
 * Get Group Competitions
 */
export const getGroupCompetitions = async (params = {}) => {
  const response = await apiClient.get('/competitions/group', { params });
  return response.data;
};

/**
 * Update Group Schedule
 */
export const updateGroupSchedule = async (competitionId, data) => {
  const response = await apiClient.put(
    `/competitions/group/${competitionId}/schedule`,
    data
  );
  return response.data;
};

/**
 * Open Registration
 */
export const openRegistration = async (competitionId) => {
  const response = await apiClient.post(
    `/competitions/group/${competitionId}/open-registration`
  );
  return response.data;
};

/**
 * Submit to District
 */
export const submitToDistrict = async (competitionId) => {
  const response = await apiClient.post(
    `/competitions/group/${competitionId}/submit-to-district`
  );
  return response.data;
};

// ========================================
// Export all as default
// ========================================

const twoTierCompetitionService = {
  createMasterCompetition,
  activateForAllGroups,
  getMasterOverview,
  getGroupCompetitions,
  updateGroupSchedule,
  openRegistration,
  submitToDistrict,
};

export default twoTierCompetitionService;
