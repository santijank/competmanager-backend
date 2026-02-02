import { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Download, 
  Printer,
  Search,
  Filter,
  Calendar,
  School,
  User
} from 'lucide-react';

/**
 * ParticipantsSummary - สรุปผู้เข้าแข่งขัน (Group Admin)
 * 
 * Props:
 * - competition: ข้อมูลการแข่งขัน
 * - summary: สรุปสถานะการลงทะเบียน
 * - participants: Array ของผู้เข้าแข่งขันที่อนุมัติแล้ว
 * - onScheduleCompetition: Callback เมื่อกดกำหนดวันแข่งขัน
 * - loading: สถานะกำลังโหลด
 */
const ParticipantsSummary = ({
  competition,
  summary = {},
  participants = [],
  onScheduleCompetition,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('all');

  // Get unique schools
  const schools = [...new Set(participants.map(p => p.school_name))].filter(Boolean);

  // Filter participants
  const filteredParticipants = participants.filter(participant => {
    const matchSearch = 
      participant.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.school_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSchool = filterSchool === 'all' || participant.school_name === filterSchool;
    
    return matchSearch && matchSchool;
  });

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = () => {
    // TODO: Implement download as Excel
    console.log('Download participants list');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {competition?.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                รับสมัคร: {competition?.registration_start_date} - {competition?.registration_end_date}
              </span>
              {competition?.competition_date && (
                <span className="flex items-center text-green-600 font-medium">
                  <Calendar className="h-4 w-4 mr-1" />
                  วันแข่งขัน: {competition.competition_date}
                </span>
              )}
            </div>
          </div>

          {/* Schedule Button */}
          {!competition?.competition_date && summary.approved > 0 && (
            <button
              onClick={onScheduleCompetition}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              กำหนดวันแข่งขัน
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.total_registrations || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-lg border border-green-200 p-6 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">อนุมัติแล้ว</p>
              <p className="text-3xl font-bold text-green-700">
                {summary.approved || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-lg border border-yellow-200 p-6 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 mb-1">รอการอนุมัติ</p>
              <p className="text-3xl font-bold text-yellow-700">
                {summary.pending || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-lg border border-red-200 p-6 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 mb-1">ปฏิเสธ</p>
              <p className="text-3xl font-bold text-red-700">
                {summary.rejected || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อนักเรียน, ครู, หรือโรงเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Filter by School */}
          <div className="md:w-64">
            <div className="relative">
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ทุกโรงเรียน</option>
                {schools.map((school, index) => (
                  <option key={index} value={school}>{school}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          แสดง {filteredParticipants.length} จาก {participants.length} ผู้เข้าแข่งขัน
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">กำลังโหลด...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">ไม่พบผู้เข้าแข่งขัน</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลำดับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ข้อมูลนักเรียน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    โรงเรียน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ครูผู้ควบคุม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ติดต่อ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant, index) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {participant.student_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.student_grade} {participant.student_class}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <School className="h-4 w-4 text-gray-400 mr-2" />
                        {participant.school_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {participant.teacher_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {participant.contact_phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      {!competition?.competition_date && summary.approved > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                📌 ยังไม่ได้กำหนดวันแข่งขัน
              </p>
              <p className="text-xs text-yellow-700">
                กรุณากำหนดวันแข่งขัน เวลา และสถานที่ เพื่อแจ้งให้ผู้เข้าแข่งขันทราบ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Competition Scheduled */}
      {competition?.competition_date && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-2">
                ✅ กำหนดวันแข่งขันแล้ว
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-green-700">
                <div>
                  <span className="font-medium">วันที่:</span> {competition.competition_date}
                </div>
                {competition.competition_start_time && (
                  <div>
                    <span className="font-medium">เวลา:</span> {competition.competition_start_time} - {competition.competition_end_time}
                  </div>
                )}
                {competition.venue && (
                  <div>
                    <span className="font-medium">สถานที่:</span> {competition.venue}
                  </div>
                )}
              </div>
              {competition.notes && (
                <div className="mt-2 text-xs text-green-600">
                  <span className="font-medium">หมายเหตุ:</span> {competition.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsSummary;
