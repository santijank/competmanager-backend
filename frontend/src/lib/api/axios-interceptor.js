// ไฟล์: frontend/src/lib/api/axios-interceptor.js

import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * 🔧 Axios Interceptor
 *
 * จัดการ:
 * - เพิ่ม Authorization header อัตโนมัติ
 * - จับ 401 Unauthorized → Redirect to Login
 * - แสดง Error Toast
 */

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - เพิ่ม Token
apiClient.interceptors.request.use(
  (config) => {
    // รองรับทั้ง auth_token และ token (authStore ใช้ auth_token)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - จัดการ Error
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // ✅ 401 Unauthorized - แค่ log warning ไม่ redirect/ลบ token
    // การ logout ควรทำผ่าน authStore เท่านั้น (ป้องกันหน้า reload เอง)
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized:', error.config?.url);
    }

    // 403 Forbidden
    else if (error.response?.status === 403) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', {
        toastId: 'forbidden-' + Date.now(),
      });
    }

    // 404 Not Found - suppress for certain endpoints
    else if (error.response?.status === 404) {
      // Don't show 404 for schedule endpoints (they may not exist yet)
      const url = error.config?.url || '';
      if (!url.includes('/schedules/')) {
        toast.error('ไม่พบข้อมูลที่ต้องการ');
      }
    }

    // 500 Server Error
    else if (error.response?.status === 500) {
      toast.error('เกิดข้อผิดพลาดจาก Server', {
        toastId: 'server-error',
      });
    }

    // Network Error
    else if (error.message === 'Network Error') {
      toast.error('ไม่สามารถเชื่อมต่อ Server ได้', {
        toastId: 'network-error',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
