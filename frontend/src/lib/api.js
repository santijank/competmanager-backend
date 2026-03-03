import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // ✅ เช็ค auth_token ก่อน (ที่มีอยู่จริง)
    let token = localStorage.getItem('auth_token');
    
    // ถ้าไม่เจอ ลอง authStore (Zustand)
    if (!token) {
      const authStore = localStorage.getItem('authStore');
      if (authStore) {
        try {
          const parsed = JSON.parse(authStore);
          token = parsed.state?.token || parsed.token;
        } catch (e) {
          console.error('Failed to parse authStore:', e);
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request:', config.url);
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor with AUTO-LOGOUT DISABLED for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // 🔴 DETAILED ERROR LOGGING
    console.group('🔴 API ERROR DETAILS');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    console.error('Response Data:', error.response?.data);
    console.error('Request Headers:', error.config?.headers);
    console.error('Request Data:', error.config?.data);
    console.groupEnd();
    
    // ⚠️ Show toast notification
    if (typeof window !== 'undefined' && window.alert) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error('🚨 ERROR:', errorMsg);
      // Uncomment to show alert:
      // alert(`API Error: ${errorMsg}`);
    }
    
    // ✅ AUTO-LOGOUT DISABLED FOR DEBUGGING
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized:', error.config?.url);
      console.warn('⚠️ Auto-logout is DISABLED for debugging - you will NOT be logged out');
      // The auto-logout code is commented out below:
      /*
      if (error.config?.url?.includes('/auth/')) {
        console.error('🔴 LOGGING OUT due to auth endpoint 401');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      */
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// API Services
// ============================================

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getUser: () => api.get('/auth/user'),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const schoolGroupService = {
  getAll: () => api.get('/school-groups'),
  getById: (id) => api.get(`/school-groups/${id}`),
  create: (data) => api.post('/school-groups', data),
  update: (id, data) => api.put(`/school-groups/${id}`, data),
  delete: (id) => api.delete(`/school-groups/${id}`),
};

export const schoolService = {
  getAll: (params) => api.get('/schools', { params }),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  delete: (id) => api.delete(`/schools/${id}`),
};

export const competitionService = {
  getAll: (params) => api.get('/competitions', { params }),
  getById: (id) => api.get(`/competitions/${id}`),
  create: (data) => api.post('/competitions', data),
  update: (id, data) => api.put(`/competitions/${id}`, data),
  delete: (id) => api.delete(`/competitions/${id}`),
};

export const registrationService = {
  getAll: (params) => api.get('/registrations', { params }),
  getById: (id) => api.get(`/registrations/${id}`),
  create: (data) => api.post('/registrations', data),
  approve: (id) => api.post(`/registrations/${id}/approve`),
  reject: (id, data) => api.post(`/registrations/${id}/reject`, data),
  bulkApprove: (data) => api.post('/registrations/bulk-approve', data),
};

export const resultService = {
  getAll: (params) => api.get('/results', { params }),
  getById: (id) => api.get(`/results/${id}`),
  create: (data) => api.post('/results', data),
  update: (id, data) => api.put(`/results/${id}`, data),
  calculateRanks: (competitionId, data) => api.post(`/results/competitions/${competitionId}/calculate-ranks`, data),
  assignMedals: (competitionId, data) => api.post(`/results/competitions/${competitionId}/assign-medals`, data),
  getLeaderboard: (competitionId, params) => api.get(`/results/competitions/${competitionId}/leaderboard`, { params }),
};

// ============================================
// Certificate Services
// ============================================

export const certificateService = {
  getAll: (params = {}) => api.get('/certificates', { params }),
  getEligible: (params = {}) => api.get('/certificates/eligible', { params }),
  generate: (data) => api.post('/certificates/generate', data),
  destroy: (id) => api.delete(`/certificates/${id}`),
  destroyAll: () => api.delete('/certificates/all'),

  download: async (id) => {
    const response = await api.get(`/certificates/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  batchDownload: async (ids) => {
    const response = await api.get('/certificates/batch-download', {
      params: { ids },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificates_batch.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  previewUrl: (params) => {
    const baseUrl = api.defaults.baseURL || '';
    const qs = new URLSearchParams(params).toString();
    return `${baseUrl}/certificates/preview?${qs}`;
  },

  // Committee certificates
  getEligibleCommittee: (params = {}) => api.get('/certificates/eligible-committee', { params }),
  generateCommittee: (data) => api.post('/certificates/generate-committee', data),

  // Number settings
  getNumberSettings: () => api.get('/certificates/number-settings'),
  updateNumberSetting: (data) => api.post('/certificates/number-settings', data),
  resetNumberSettings: (data = {}) => api.post('/certificates/number-settings/reset', data),
};

// ============================================
// Certificate Template Services (✅ เพิ่มใหม่)
// ============================================

export const certificateTemplateService = {
  // Get all templates
  getAll: (params = {}) => {
    return api.get('/certificate-templates', { params });
  },

  // Get single template
  getById: (id) => {
    return api.get(`/certificate-templates/${id}`);
  },

  // Create new template
  create: (data) => {
    return api.post('/certificate-templates', data);
  },

  // Update template
  update: (id, data) => {
    return api.put(`/certificate-templates/${id}`, data);
  },

  // Delete template
  delete: (id) => {
    return api.delete(`/certificate-templates/${id}`);
  },

  // Upload background image
  uploadBackground: (formData) => {
    return api.post('/certificate-templates/upload-background', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ============================================
// Issue / Ticket Service - ระบบแจ้งปัญหา
// ============================================

export const issueService = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (formData) => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/issues/${id}`, data),
  updateStatus: (id, data) => api.patch(`/issues/${id}/status`, data),
  assign: (id, data) => api.patch(`/issues/${id}/assign`, data),
  addReply: (id, formData) => api.post(`/issues/${id}/replies`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatistics: () => api.get('/issues/statistics'),
};