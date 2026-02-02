import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Settings,
  Send,
  PlayCircle,
  StopCircle
} from 'lucide-react';

/**
 * 📋 Group Competition List
 * 
 * แสดงรายการแข่งขันของกลุ่มในรูปแบบตาราง
 */
const GroupCompetitionList = ({
  competitions,
  loading,
  onSetSchedule,
  onOpenRegistration,
  onCloseRegistration,
  onSubmitToDistrict,
}) => {
  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format time
   */
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // HH:MM
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'gray', text: 'ร่าง' },
      active: { color: 'green', text: 'เปิดใช้งาน' },
      closed: { color: 'red', text: 'ปิด' },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.text}
      </span>
    );
  };

  /**
   * Get registration status badge
   */
  const getRegistrationBadge = (status) => {
    const badges = {
      upcoming: { color: 'blue', text: 'เร็วๆ นี้', icon: <Clock className="h-3 w-3" /> },
      open: { color: 'green', text: 'เปิดรับสมัคร', icon: <PlayCircle className="h-3 w-3" /> },
      closed: { color: 'red', text: 'ปิดรับสมัคร', icon: <StopCircle className="h-3 w-3" /> },
    };

    const badge = badges[status] || badges.upcoming;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-600">กำลังโหลด...</p>
      </div>
    );
  }

  if (!competitions || competitions.length === 0) {
    return (
      <div className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">ไม่พบรายการแข่งขัน</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              รายการแข่งขัน
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              วัน/เวลา/สถานที่
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              สถานะการรับสมัคร
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              ผู้ลงทะเบียน
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              การจัดการ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {competitions.map((competition) => (
            <tr key={competition.id} className="hover:bg-gray-50">
              {/* Competition Info */}
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {competition.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {competition.category?.name} • {competition.level}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      <Users className="h-3 w-3 inline mr-1" />
                      {competition.max_students} นักเรียน, {competition.max_teachers} ครู
                    </span>
                  </div>
                </div>
              </td>

              {/* Schedule */}
              <td className="px-6 py-4">
                {competition.competition_date ? (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(competition.competition_date)}
                    </div>
                    {competition.competition_start_time && (
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatTime(competition.competition_start_time)} - {formatTime(competition.competition_end_time)}
                      </div>
                    )}
                    {competition.venue && (
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {competition.venue}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onSetSchedule(competition)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    กำหนดวันแข่งขัน
                  </button>
                )}
              </td>

              {/* Registration Status */}
              <td className="px-6 py-4 text-center">
                {getRegistrationBadge(competition.registration_status)}
              </td>

              {/* Registrations Count */}
              <td className="px-6 py-4 text-center">
                <span className="text-sm font-medium text-gray-900">
                  {competition.total_registrations || 0}
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  {/* Set Schedule Button */}
                  {competition.competition_date && (
                    <button
                      onClick={() => onSetSchedule(competition)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="แก้ไขวันแข่งขัน"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}

                  {/* Open/Close Registration */}
                  {competition.registration_status === 'upcoming' && competition.competition_date && (
                    <button
                      onClick={() => onOpenRegistration(competition)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      เปิดรับสมัคร
                    </button>
                  )}

                  {competition.registration_status === 'open' && (
                    <button
                      onClick={() => onCloseRegistration(competition)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      ปิดรับสมัคร
                    </button>
                  )}

                  {/* Submit to District */}
                  {competition.status === 'closed' && !competition.submitted_to_district && (
                    <button
                      onClick={() => onSubmitToDistrict(competition)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      ส่งผล
                    </button>
                  )}

                  {competition.submitted_to_district && (
                    <span className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg">
                      ส่งแล้ว ✓
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupCompetitionList;
