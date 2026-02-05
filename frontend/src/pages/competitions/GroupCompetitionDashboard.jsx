import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Filter,
  Search,
  RefreshCw,
  CalendarCheck // ⭐ เพิ่ม
} from 'lucide-react';
import api from '@/lib/api';
import GroupCompetitionList from '@/components/competitions/GroupCompetitionList';
import CompetitionScheduleModal from '@/components/competitions/CompetitionScheduleModal';
import CompetitionStatsCard from '@/components/competitions/CompetitionStatsCard';
import GroupCompetitionFilters from '@/components/competitions/GroupCompetitionFilters';
import BulkOpenRegistrationModal from '@/components/competitions/BulkOpenRegistrationModal';
import ConfirmModal from '@/components/common/ConfirmModal';

/**
 * 📊 Group Competition Dashboard
 * 
 * หน้า Dashboard สำหรับ Group Admin จัดการการแข่งขันของกลุ่ม
 */
const GroupCompetitionDashboard = () => {
  // State
  const [competitions, setCompetitions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBulkOpenModal, setShowBulkOpenModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    registration_status: '',
    category_id: '',
    search: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchCompetitions();
  }, [filters, currentPage]);

  /**
   * ดึงรายการแข่งขัน
   */
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/competitions/group', {
        params: {
          ...filters,
          page: currentPage,
          per_page: 20,
        }
      });

      if (response.data.success) {
        setCompetitions(response.data.data.data || response.data.data);
        setStatistics(response.data.statistics);
        
        // Handle pagination
        if (response.data.data.last_page) {
          setTotalPages(response.data.data.last_page);
        }
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      toast.error('ไม่สามารถโหลดรายการแข่งขันได้');
    } finally {
      setLoading(false);
    }
  };

  /**
   * เปิด Modal กำหนดวันแข่งขัน
   */
  const handleSetSchedule = (competition) => {
    setSelectedCompetition(competition);
    setShowScheduleModal(true);
  };

  /**
   * บันทึกวันแข่งขัน
   */
  const handleSaveSchedule = async (scheduleData) => {
    try {
      const response = await api.put(
        `/competitions/group/${selectedCompetition.id}/schedule`,
        scheduleData
      );

      if (response.data.success) {
        toast.success('กำหนดวันแข่งขันสำเร็จ');
        setShowScheduleModal(false);
        setSelectedCompetition(null);
        fetchCompetitions(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      const message = error.response?.data?.message || 'ไม่สามารถบันทึกวันแข่งขันได้';
      toast.error(message);
    }
  };

  /**
   * เปิดรับสมัคร
   */
  const handleOpenRegistration = async (competition) => {
    if (!competition.competition_date) {
      toast.error('กรุณากำหนดวันแข่งขันก่อนเปิดรับสมัคร');
      return;
    }

    try {
      const response = await api.post(
        `/competitions/group/${competition.id}/open-registration`
      );

      if (response.data.success) {
        toast.success('เปิดรับสมัครสำเร็จ');
        fetchCompetitions(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to open registration:', error);
      const message = error.response?.data?.message || 'ไม่สามารถเปิดรับสมัครได้';
      toast.error(message);
    }
  };

  /**
   * ปิดรับสมัคร
   */
  const handleCloseRegistration = async (competition) => {
    try {
      const response = await api.post(
        `/competitions/group/${competition.id}/close-registration`
      );

      if (response.data.success) {
        toast.success('ปิดรับสมัครสำเร็จ');
        fetchCompetitions(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to close registration:', error);
      const message = error.response?.data?.message || 'ไม่สามารถปิดรับสมัครได้';
      toast.error(message);
    }
  };

  /**
   * ส่งผลไปยังระดับเขต
   */
  const handleSubmitToDistrict = (competition) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการส่งผล',
      message: 'ยืนยันการส่งผลการแข่งขันไปยังระดับเขต?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await api.post(
            `/competitions/group/${competition.id}/submit-to-district`
          );
          if (response.data.success) {
            toast.success('ส่งผลการแข่งขันไปยังระดับเขตสำเร็จ');
            fetchCompetitions();
          }
        } catch (error) {
          console.error('Failed to submit to district:', error);
          const message = error.response?.data?.message || 'ไม่สามารถส่งผลการแข่งขันได้';
          toast.error(message);
        }
      },
    });
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    fetchCompetitions();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                การแข่งขันของกลุ่ม
              </h1>
              <p className="text-gray-600 mt-2">
                จัดการการแข่งขันระดับกลุ่มโรงเรียน
              </p>
            </div>
            
            {/* ⭐ ปุ่มต่างๆ */}
            <div className="flex items-center space-x-3">
              {/* ปุ่มเปิดรับสมัครทั้งหมด */}
              <button
                onClick={() => setShowBulkOpenModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>เปิดรับสมัครทั้งหมด</span>
              </button>

              {/* ปุ่มรีเฟรช */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <CompetitionStatsCard
              title="ทั้งหมด"
              value={statistics.total}
              icon={<Users className="h-6 w-6" />}
              color="blue"
            />
            <CompetitionStatsCard
              title="ยังไม่กำหนดวัน"
              value={statistics.not_scheduled}
              icon={<Calendar className="h-6 w-6" />}
              color="yellow"
            />
            <CompetitionStatsCard
              title="เปิดรับสมัคร"
              value={statistics.registration_open}
              icon={<Clock className="h-6 w-6" />}
              color="green"
            />
            <CompetitionStatsCard
              title="ผู้ลงทะเบียน"
              value={statistics.total_registrations}
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <GroupCompetitionFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Competition List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <GroupCompetitionList
            competitions={competitions}
            loading={loading}
            onSetSchedule={handleSetSchedule}
            onOpenRegistration={handleOpenRegistration}
            onCloseRegistration={handleCloseRegistration}
            onSubmitToDistrict={handleSubmitToDistrict}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              
              <span className="px-4 py-2">
                หน้า {currentPage} จาก {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <CompetitionScheduleModal
          competition={selectedCompetition}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedCompetition(null);
          }}
          onSave={handleSaveSchedule}
        />
      )}

      {/* Bulk Open Registration Modal */}
      <BulkOpenRegistrationModal
        isOpen={showBulkOpenModal}
        onClose={() => setShowBulkOpenModal(false)}
        onSuccess={() => {
          setShowBulkOpenModal(false);
          fetchCompetitions();
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="warning"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default GroupCompetitionDashboard;
