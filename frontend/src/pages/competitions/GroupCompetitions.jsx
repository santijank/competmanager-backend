import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import twoTierCompetitionService from '@/lib/api/twoTierCompetition-service';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';

/**
 * 🎯 Group Admin - Competition Management
 * 
 * ไฟล์: frontend/src/pages/competitions/GroupCompetitions.jsx
 * 
 * หน้านี้สำหรับ Admin กลุ่ม:
 * - ดูรายการแข่งขันที่ถูกเปิดให้
 * - กำหนดวัน/เวลา
 * - เปิดรับสมัคร
 * - ส่งผู้ชนะไปเขต
 */
export default function GroupCompetitions() {
  const { user } = useAuthStore();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const response = await twoTierCompetitionService.getGroupCompetitions();
      setCompetitions(response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (competition) => {
    if (competition.submitted_to_district) {
      return <span className="badge badge-success">ส่งข้อมูลแล้ว</span>;
    }
    if (competition.registration_status === 'open') {
      return <span className="badge badge-primary">เปิดรับสมัคร</span>;
    }
    if (competition.group_registration_start) {
      return <span className="badge badge-warning">รอเปิดรับสมัคร</span>;
    }
    return <span className="badge badge-gray">รอกำหนดวัน/เวลา</span>;
  };

  const getActionButtons = (competition) => {
    // ✅ ส่งข้อมูลแล้ว → ไม่มีปุ่ม
    if (competition.submitted_to_district) {
      return null;
    }

    // ✅ เปิดรับสมัครแล้ว → ปุ่มส่งข้อมูล
    if (competition.registration_status === 'open' && competition.registrations_count > 0) {
      return (
        <button
          onClick={() => handleSubmitToDistrict(competition)}
          className="btn btn-success btn-sm"
        >
          <Send className="h-4 w-4 mr-2" />
          ส่งผู้ชนะไปเขต
        </button>
      );
    }

    // ✅ กำหนดวันแล้ว → ปุ่มเปิดรับสมัคร
    if (competition.group_registration_start) {
      return (
        <button
          onClick={() => handleOpenRegistration(competition)}
          className="btn btn-primary btn-sm"
        >
          เปิดรับสมัคร
        </button>
      );
    }

    // ✅ ยังไม่กำหนดวัน → ปุ่มกำหนดวัน/เวลา
    return (
      <button
        onClick={() => {
          setSelectedCompetition(competition);
          setShowScheduleModal(true);
        }}
        className="btn btn-warning btn-sm"
      >
        <Calendar className="h-4 w-4 mr-2" />
        กำหนดวัน/เวลา
      </button>
    );
  };

  const handleOpenRegistration = (competition) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการเปิดรับสมัคร',
      message: 'คุณแน่ใจหรือไม่ที่จะเปิดรับสมัคร?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await twoTierCompetitionService.openRegistration(competition.id);
          toast.success('เปิดรับสมัครสำเร็จ');
          fetchCompetitions();
        } catch (error) {
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const handleSubmitToDistrict = (competition) => {
    setConfirmModal({
      isOpen: true,
      title: 'ส่งผู้ชนะไปยังระดับเขต',
      message: 'คุณแน่ใจหรือไม่ที่จะส่งผู้ชนะไปยังระดับเขต?\n(จะส่งอันดับ 1 และ 2 ไปแข่งต่อที่เขต)',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await twoTierCompetitionService.submitToDistrict(competition.id);
          toast.success(`ส่งผู้ชนะ ${response.data.total_advanced} คน ไปยังระดับเขตสำเร็จ`);
          fetchCompetitions();
        } catch (error) {
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          การแข่งขันของกลุ่ม
        </h1>
        <p className="text-gray-600 mt-1">
          กลุ่มโรงเรียน: {user?.school_group?.name}
        </p>
      </div>

      {/* Competitions */}
      {competitions.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            ยังไม่มีการแข่งขันที่เปิดให้กลุ่มของคุณ
          </p>
          <p className="text-gray-500 text-sm mt-2">
            รอ Admin ใหญ่สร้างและเปิดการแข่งขันให้
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map((competition) => (
            <div key={competition.id} className="card">
              <div className="flex items-start justify-between">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {competition.name}
                    </h3>
                    {getStatusBadge(competition)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">รหัส:</span>
                      {competition.code}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">หมวด:</span>
                      {competition.category?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">ระดับ:</span>
                      {competition.level}
                    </div>

                    {/* วัน/เวลาที่กำหนด */}
                    {competition.group_registration_start && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-green-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">รับสมัคร:</span>
                          {new Date(competition.group_registration_start).toLocaleDateString('th-TH')}
                          {' - '}
                          {new Date(competition.group_registration_end).toLocaleDateString('th-TH')}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">แข่งขัน:</span>
                          {new Date(competition.group_competition_date).toLocaleDateString('th-TH')}
                          {competition.competition_start_time && (
                            <span className="ml-2">
                              ({competition.competition_start_time} - {competition.competition_end_time})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-orange-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">สถานที่:</span>
                          {competition.venue}
                        </div>
                      </div>
                    )}

                    {/* จำนวนผู้สมัคร */}
                    {competition.registration_status === 'open' && (
                      <div className="mt-2 text-purple-600 font-medium">
                        ผู้สมัคร: {competition.registrations_count || 0} คน
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4">
                  {getActionButtons(competition)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          competition={selectedCompetition}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedCompetition(null);
          }}
          onSuccess={() => {
            setShowScheduleModal(false);
            setSelectedCompetition(null);
            fetchCompetitions();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


/**
 * 🎯 Schedule Modal - กำหนดวัน/เวลา
 */
function ScheduleModal({ competition, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    group_registration_start: '',
    group_registration_end: '',
    group_competition_date: '',
    venue: competition.venue || '',
    competition_start_time: '',
    competition_end_time: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await twoTierCompetitionService.updateSchedule(competition.id, formData);
      toast.success('กำหนดวัน/เวลาสำเร็จ');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          กำหนดวัน/เวลา: {competition.name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* วันรับสมัคร */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันเริ่มรับสมัคร *
            </label>
            <input
              type="date"
              value={formData.group_registration_start}
              onChange={(e) => setFormData({...formData, group_registration_start: e.target.value})}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันปิดรับสมัคร *
            </label>
            <input
              type="date"
              value={formData.group_registration_end}
              onChange={(e) => setFormData({...formData, group_registration_end: e.target.value})}
              className="input"
              required
            />
          </div>

          {/* วันแข่งขัน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันแข่งขัน *
            </label>
            <input
              type="date"
              value={formData.group_competition_date}
              onChange={(e) => setFormData({...formData, group_competition_date: e.target.value})}
              className="input"
              required
            />
          </div>

          {/* เวลา */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เวลาเริ่ม
              </label>
              <input
                type="time"
                value={formData.competition_start_time}
                onChange={(e) => setFormData({...formData, competition_start_time: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เวลาจบ
              </label>
              <input
                type="time"
                value={formData.competition_end_time}
                onChange={(e) => setFormData({...formData, competition_end_time: e.target.value})}
                className="input"
              />
            </div>
          </div>

          {/* สถานที่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานที่จัดการแข่งขัน *
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({...formData, venue: e.target.value})}
              className="input"
              placeholder="เช่น โรงเรียนในกลุ่มที่ 1"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
