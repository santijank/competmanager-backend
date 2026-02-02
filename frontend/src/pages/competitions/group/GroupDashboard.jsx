import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GroupDashboardBanner from '@/components/group/GroupDashboardBanner';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  Trophy,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import api from '@/services/api';

export default function GroupDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    closed: 0,
    registration_open: 0,
    total_registrations: 0,
  });
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/competitions/group', {
        params: { paginate: false }
      });

      if (response.data.success) {
        setCompetitions(response.data.data.slice(0, 5)); // แสดง 5 รายการล่าสุด
        setStats(response.data.statistics || {});
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎨 Banner Section - เพิ่มตรงนี้ */}
      <GroupDashboardBanner />

      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">การแข่งขันของกลุ่ม</h1>
        <p className="text-gray-600 mt-1">
          จัดการการแข่งขันระดับกลุ่มโรงเรียน {user?.school_group?.name}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/competitions/group/manage"
          className="flex items-center p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Trophy className="h-8 w-8 mr-3" />
          <div>
            <h3 className="font-semibold">เปิดรับสมัครแบบกลุ่ม</h3>
            <p className="text-sm text-primary-100">เปิดรับสมัครทั้งหมดหรือตามหมวดหมู่</p>
          </div>
        </Link>

        <Link
          to="/registrations/manage"
          className="flex items-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileText className="h-8 w-8 mr-3" />
          <div>
            <h3 className="font-semibold">รับลงทะเบียน</h3>
            <p className="text-sm text-green-100">รายการลงทะเบียนที่รอดำเนินการ</p>
          </div>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">กำลังรับสมัคร</p>
              <p className="text-3xl font-bold text-gray-900">{stats.registration_open}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เปิดแข่งขัน</p>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ผู้สมัครทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_registrations}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Competitions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">การแข่งขันล่าสุด</h2>
            <Link
              to="/competitions/group/manage"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ดูทั้งหมด →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">กำลังโหลด...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">ยังไม่มีข้อมูลการแข่งขัน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายการแข่งขัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วัน/เวลาแข่งขัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะการรับสมัคร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การลงทะเบียน
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {competitions.map((competition) => (
                  <tr key={competition.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {competition.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {competition.category?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {competition.competition_date 
                          ? new Date(competition.competition_date).toLocaleDateString('th-TH')
                          : 'ยังไม่กำหนด'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        competition.registration_status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : competition.registration_status === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {competition.registration_status === 'open' ? 'เปิดรับสมัคร' :
                         competition.registration_status === 'upcoming' ? 'เร็วๆ นี้' : 'ปิดรับสมัคร'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      0 คน
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
