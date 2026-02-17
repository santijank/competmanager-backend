import axios from 'axios';

// สร้าง axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - เพิ่ม token ทุกครั้งที่ส่ง request
api.interceptors.request.use(
  (config) => {
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

// Response interceptor - จัดการ error ทั่วไป
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // จัดการ error
    if (error.response) {
      // Server ตอบกลับมาแต่เป็น error
      switch (error.response.status) {
        case 401:
          // ✅ แค่ log warning - ไม่ redirect/ลบ token (ป้องกันหน้า reload เอง)
          // การ logout ควรทำผ่าน authStore เท่านั้น
          console.warn('⚠️ 401 Unauthorized:', error.config?.url);
          break;
        case 403:
          // Forbidden
          console.error('คุณไม่มีสิทธิ์เข้าถึง');
          break;
        case 404:
          // Not Found
          console.error('ไม่พบข้อมูลที่ต้องการ');
          break;
        case 422:
          // Validation Error
          console.error('ข้อมูลไม่ถูกต้อง:', error.response.data);
          break;
        case 500:
          // Server Error
          console.error('เกิดข้อผิดพลาดจาก Server');
          break;
        default:
          console.error('เกิดข้อผิดพลาด:', error.response.data);
      }
    } else if (error.request) {
      // Request ถูกส่งแต่ไม่ได้รับ response
      console.error('ไม่สามารถเชื่อมต่อกับ Server ได้');
    } else {
      // เกิดข้อผิดพลาดอื่นๆ
      console.error('เกิดข้อผิดพลาด:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;