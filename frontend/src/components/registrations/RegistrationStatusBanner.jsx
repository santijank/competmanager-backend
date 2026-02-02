import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api';

/**
 * ✅ RegistrationStatusBanner - Phase 1
 * 
 * แสดงสถานะการเปิด-ปิดรับสมัคร
 * - Fixed: Added proper error handling
 * - Fixed: Added loading state
 * - Fixed: Handle undefined status
 */
const RegistrationStatusBanner = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/registrations/status');
      
      console.log('📊 Registration Status Response:', response.data);
      
      // ✅ ตรวจสอบ response structure
      if (response.data && response.data.success && response.data.data) {
        setStatus(response.data.data);
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setStatus(null);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch registration status:', error);
      setError(error.response?.data?.message || 'ไม่สามารถโหลดสถานะการรับสมัครได้');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">กำลังตรวจสอบสถานะการรับสมัคร...</p>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">ไม่สามารถโหลดสถานะการรับสมัคร</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ No Status Set
  if (!status || !status.status || status.status === 'not_set') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              ยังไม่ได้กำหนดช่วงเวลารับสมัคร
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              กรุณาติดต่อผู้ดูแลกลุ่มโรงเรียนเพื่อตั้งค่าช่วงเวลารับสมัคร
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Status Display
  const getStatusConfig = (statusValue) => {
    const configs = {
      open: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        titleColor: 'text-green-800',
        textColor: 'text-green-600',
        title: 'เปิดรับสมัครแล้ว',
      },
      upcoming: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        titleColor: 'text-blue-800',
        textColor: 'text-blue-600',
        title: 'กำลังจะเปิดรับสมัคร',
      },
      closed: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: <XCircle className="w-5 h-5 text-gray-600" />,
        titleColor: 'text-gray-800',
        textColor: 'text-gray-600',
        title: 'ปิดรับสมัครแล้ว',
      },
    };

    return configs[statusValue] || configs.closed;
  };

  const config = getStatusConfig(status.status);

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${config.titleColor} mb-2`}>
            {config.title}
          </h3>
          
          <div className={`text-sm ${config.textColor} space-y-1`}>
            {status.registration_start_date && status.registration_end_date && (
              <p>
                <strong>ช่วงเวลา:</strong>{' '}
                {new Date(status.registration_start_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(status.registration_end_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            
            {status.school_group?.name && (
              <p>
                <strong>กลุ่มโรงเรียน:</strong> {status.school_group.name}
              </p>
            )}
            
            {status.registration_announcement && (
              <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
                <p className="font-medium mb-1">ประกาศ:</p>
                <p className="whitespace-pre-wrap">{status.registration_announcement}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusBanner;
