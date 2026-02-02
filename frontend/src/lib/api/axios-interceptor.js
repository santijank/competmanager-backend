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

// Flag to prevent multiple 401 toasts and redirects
let isHandling401 = false;

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
    // 401 Unauthorized - handle only once
    if (error.response?.status === 401) {
      if (!isHandling401) {
        isHandling401 = true;

        // Clear token (ทั้งสอง keys)
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Show toast only once
        toast.error('Session หมดอายุ กรุณา Login ใหม่', {
          autoClose: 3000,
          toastId: 'session-expired', // Prevent duplicate toasts
        });

        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);

        // Reset flag after redirect timeout
        setTimeout(() => {
          isHandling401 = false;
        }, 3000);
      }
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
