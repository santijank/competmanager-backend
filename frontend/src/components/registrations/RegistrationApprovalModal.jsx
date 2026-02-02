import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * ✅ Registration Approval Modal
 * 
 * Modal สำหรับอนุมัติ/ปฏิเสธการลงทะเบียน
 */
const RegistrationApprovalModal = ({ registration, actionType, onClose, onSubmit }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('กรุณากรอกเหตุผลที่ไม่อนุมัติ');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ rejection_reason: rejectionReason });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              actionType === 'approve' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {actionType === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'อนุมัติการลงทะเบียน' : 'ปฏิเสธการลงทะเบียน'}
              </h3>
              <p className="text-sm text-gray-500">
                {registration.team_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {actionType === 'approve' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">
                    คุณต้องการอนุมัติการลงทะเบียนนี้หรือไม่?
                  </p>
                  <p>
                    ทีม "{registration.team_name}" จะได้รับอนุมัติให้เข้าแข่งขัน "{registration.competition?.name}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">
                      คุณต้องการปฏิเสธการลงทะเบียนนี้หรือไม่?
                    </p>
                    <p>
                      ทีม "{registration.team_name}" จะไม่สามารถเข้าแข่งขัน "{registration.competition?.name}" ได้
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลที่ไม่อนุมัติ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="กรอกเหตุผล..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  เหตุผลนี้จะแสดงให้ครูผู้ลงทะเบียนเห็น
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                actionType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังดำเนินการ...</span>
                </div>
              ) : (
                actionType === 'approve' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationApprovalModal;
