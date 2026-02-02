import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import api from '@/lib/api';

/**
 * 🔒 Registration Status Banner
 * 
 * แสดงสถานะการรับสมัครสำหรับ School Admin
 * - not_set: ยังไม่ได้กำหนดวันเปิด-ปิด
 * - upcoming: ยังไม่เริ่มรับสมัคร
 * - open: กำลังเปิดรับสมัคร
 * - closed: ปิดรับสมัครแล้ว
 */
const RegistrationStatusBanner = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStatus();
    
    // Refresh ทุก 5 นาที
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchStatus = async () => {
    try {
      const response = await api.get('/registrations/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch registration status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return null;
  if (!status) return null;
  
  // Config สำหรับแต่ละสถานะ
  const statusConfig = {
    not_set: {
      bg: 'bg-gray-100',
      border: 'border-gray-500',
      text: 'text-gray-700',
      icon: AlertCircle,
      iconColor: 'text-gray-500'
    },
    upcoming: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-700',
      icon: Clock,
      iconColor: 'text-blue-500'
    },
    open: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    closed: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      icon: XCircle,
      iconColor: 'text-red-500'
    }
  };
  
  const config = statusConfig[status.status.status] || statusConfig.not_set;
  const Icon = config.icon;
  
  return (
    <div className={`${config.bg} border-l-4 ${config.border} p-4 mb-6 rounded-lg shadow-sm`}>
      <div className="flex items-start">
        <Icon className={`${config.iconColor} w-6 h-6 mr-3 flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1">
          {/* Header */}
          <h3 className={`font-semibold ${config.text} text-lg mb-1`}>
            {status.status.message}
          </h3>
          
          {/* Announcement */}
          {status.announcement && (
            <p className={`${config.text} text-sm mb-3 leading-relaxed`}>
              📢 {status.announcement}
            </p>
          )}
          
          {/* Details */}
          <div className={`text-sm ${config.text} space-y-1`}>
            {/* กำลังเปิดรับสมัคร */}
            {status.status.status === 'open' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    <strong>เหลือเวลา:</strong> {status.status.ends_in_thai || status.status.ends_in}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>ปิดรับสมัคร:</strong>{' '}
                    {new Date(status.end_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {/* Warning ถ้าเหลือเวลาน้อย */}
                {status.status.warning && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-xs">
                    ⚠️ {status.status.warning} กรุณาลงทะเบียนโดยเร็ว!
                  </div>
                )}
              </div>
            )}
            
            {/* ยังไม่เริ่มรับสมัคร */}
            {status.status.status === 'upcoming' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    <strong>เปิดรับสมัครใน:</strong> {status.status.starts_in_thai || status.status.starts_in}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>เริ่มรับสมัคร:</strong>{' '}
                    {new Date(status.start_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
            
            {/* ปิดรับสมัครแล้ว */}
            {status.status.status === 'closed' && (
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>❌ ไม่สามารถลงทะเบียนหรือแก้ไขได้แล้ว</span>
              </div>
            )}
            
            {/* ยังไม่ได้กำหนดวัน */}
            {status.status.status === 'not_set' && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>กรุณารอประกาศจาก Group Admin</span>
              </div>
            )}
          </div>
          
          {/* School Group Info */}
          {status.school_group && (
            <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
              กลุ่มโรงเรียน: <strong>{status.school_group.name}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusBanner;
