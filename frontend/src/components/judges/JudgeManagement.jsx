import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import JudgeList from './JudgeList';
import AddJudgeModal from './AddJudgeModal';

/**
 * JudgeManagement Component
 * 
 * หน้าจัดการกรรมการตัดสิน
 * - แสดงเฉพาะเมื่อมีทีมลงทะเบียน
 * - Group Admin เท่านั้นที่เข้าถึงได้
 */
export default function JudgeManagement({ competitionId }) {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasRegistrations, setHasRegistrations] = useState(true);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [minJudges, setMinJudges] = useState(3);
  const [maxJudges, setMaxJudges] = useState(3);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลกรรมการ
  useEffect(() => {
    fetchJudges();
  }, [competitionId]);

  const fetchJudges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/competitions/${competitionId}/judges`);
      const data = response.data;

      // เช็คว่ามีผู้สมัครหรือไม่
      if (!data.has_registrations) {
        setHasRegistrations(false);
        setRegistrationsCount(0);
        setLoading(false);
        return;
      }

      // มีผู้สมัครแล้ว
      setJudges(data.judges || []);
      setHasRegistrations(true);
      setRegistrationsCount(data.registrations_count);
      setMinJudges(data.min_judges);
      setMaxJudges(data.max_judges);
      
    } catch (err) {
      console.error('Error fetching judges:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJudge = async (judgeData) => {
    try {
      const response = await api.post(
        `/competitions/${competitionId}/judges`,
        judgeData
      );

      if (response.data.success) {
        // เพิ่มกรรมการใหม่ใน state
        setJudges([...judges, response.data.judge]);
        setIsAddModalOpen(false);
        
        // แสดงข้อความสำเร็จ (optional - ใช้ toast library)
        alert('เพิ่มกรรมการสำเร็จ');
      }
    } catch (err) {
      console.error('Error adding judge:', err);
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มกรรมการ';
      alert(errorMessage);
      throw err; // ส่งต่อ error ให้ modal จัดการ
    }
  };

  const handleEditJudge = async (judgeId, judgeData) => {
    try {
      const response = await api.put(
        `/competitions/${competitionId}/judges/${judgeId}`,
        judgeData
      );

      if (response.data.success) {
        // อัปเดตข้อมูลใน state
        setJudges(judges.map(j => 
          j.id === judgeId ? response.data.judge : j
        ));
        
        alert('แก้ไขข้อมูลกรรมการสำเร็จ');
      }
    } catch (err) {
      console.error('Error editing judge:', err);
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
      alert(errorMessage);
      throw err;
    }
  };

  const handleDeleteJudge = async (judgeId) => {
    if (!confirm('ต้องการลบกรรมการคนนี้ใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await api.delete(
        `/competitions/${competitionId}/judges/${judgeId}`
      );

      if (response.data.success) {
        // ลบออกจาก state
        setJudges(judges.filter(j => j.id !== judgeId));
        alert('ลบกรรมการสำเร็จ');
      }
    } catch (err) {
      console.error('Error deleting judge:', err);
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบกรรมการ';
      alert(errorMessage);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ไม่มีผู้สมัคร - แสดงข้อความเตือน
  if (!hasRegistrations) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              ยังไม่มีทีมลงทะเบียน
            </h3>
            <p className="text-yellow-800">
              ระบบจะเปิดให้เพิ่มกรรมการตัดสินเมื่อมีโรงเรียนส่งทีมเข้าแข่งขันแล้ว
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              กรุณาตรวจสอบใน Tab "ทีมที่ลงทะเบียน"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchJudges}
              className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
            >
              ลองอีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // มีผู้สมัครแล้ว - แสดงหน้าจัดการกรรมการ
  const currentCount = judges.length;
  const isComplete = currentCount >= minJudges;
  const isFull = currentCount >= maxJudges;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              กรรมการตัดสิน
            </h2>
          </div>
          {isComplete && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">กรรมการครบแล้ว</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">ทีมที่ลงทะเบียน</p>
            <p className="text-2xl font-bold text-blue-900">{registrationsCount} ทีม</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">จำนวนที่ต้องการ</p>
            <p className="text-2xl font-bold text-purple-900">{minJudges}-{maxJudges} คน</p>
          </div>
          <div className={`rounded-lg p-4 ${
            isComplete ? 'bg-green-50' : 'bg-orange-50'
          }`}>
            <p className={`text-sm mb-1 ${
              isComplete ? 'text-green-600' : 'text-orange-600'
            }`}>
              กรรมการที่เพิ่มแล้ว
            </p>
            <p className={`text-2xl font-bold ${
              isComplete ? 'text-green-900' : 'text-orange-900'
            }`}>
              {currentCount} / {maxJudges} คน
            </p>
          </div>
        </div>

        {/* Status Message */}
        {!isComplete && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-orange-800">
              ⚠️ ยังขาดกรรมการอีก <strong>{minJudges - currentCount}</strong> คน
            </p>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={isFull}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isFull
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isFull ? 'กรรมการครบแล้ว' : '+ เพิ่มกรรมการ'}
        </button>
      </div>

      {/* Judge List */}
      <JudgeList
        judges={judges}
        onEdit={handleEditJudge}
        onDelete={handleDeleteJudge}
      />

      {/* Add Judge Modal */}
      <AddJudgeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddJudge}
      />
    </div>
  );
}
