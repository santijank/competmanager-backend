import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  School,
  BarChart3,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import OnlineUsersCard from '@/components/common/OnlineUsersCard';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user?.role]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // ✅ เรียก API endpoint เดียว - backend แยกตาม role
      const endpoint = '/dashboard/stats';

      const response = await api.get(endpoint);
      // รองรับทั้งกรณีที่ backend ส่ง { data: {...} } หรือส่งตรงๆ
      const data = response.data?.data || response.data;

      console.log('Dashboard data:', data); // Debug

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, onClick, subtitle }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {loading ? '...' : (value ?? 0)}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );

  // ===============================================
  // DISTRICT ADMIN DASHBOARD
  // ===============================================
  if (user?.role === 'district_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-600 mt-2">
              ภาพรวมระบบจัดการการแข่งขัน - ระดับเขต
            </p>
          </div>

          {/* Stats Grid - Row 1: Competitions */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">การแข่งขัน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Trophy}
                title="การแข่งขันทั้งหมด"
                value={stats?.competitions?.total}
                color="bg-blue-500"
                onClick={() => navigate('/competitions')}
              />
              
              <StatCard
                icon={BarChart3}
                title="ระดับเขต"
                value={stats?.competitions?.district}
                color="bg-indigo-500"
              />
              
              <StatCard
                icon={Users}
                title="ระดับกลุ่ม"
                value={stats?.competitions?.group}
                color="bg-purple-500"
              />
              
              <StatCard
                icon={Calendar}
                title="เปิดรับสมัคร"
                value={stats?.competitions?.open}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Stats Grid - Row 2: Registrations */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">การลงทะเบียน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={TrendingUp}
                title="ลงทะเบียนทั้งหมด"
                value={stats?.registrations?.total}
                color="bg-blue-500"
              />
              
              <StatCard
                icon={Clock}
                title="รอการอนุมัติ"
                value={stats?.registrations?.pending}
                color="bg-yellow-500"
              />
              
              <StatCard
                icon={CheckCircle}
                title="อนุมัติแล้ว"
                value={stats?.registrations?.approved}
                color="bg-green-500"
              />
              
              <StatCard
                icon={School}
                title="โรงเรียนที่มีการลงทะเบียน"
                value={stats?.schools?.active}
                color="bg-purple-500"
              />
            </div>
          </div>

          {/* Stats Grid - Row 3: Participants */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">ผู้เข้าแข่งขัน (ที่อนุมัติแล้ว)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">รวมทั้งหมด</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.total_students?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-400">ครู</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.total_teachers?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm font-medium text-indigo-600 mb-3">ระดับเขต</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.district_students?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-400">ครู</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.district_teachers?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm font-medium text-purple-600 mb-3">ระดับกลุ่ม</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-400">นักเรียน</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.group_students?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-400">ครู</p>
                      <p className="text-xl font-bold text-gray-800">{stats?.participants?.group_teachers?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medal Standings by Group */}
          {stats?.medals_by_group?.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">🏅 ตารางเหรียญระดับเขต แยกตามกลุ่มโรงเรียน</h2>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">กลุ่มโรงเรียน</th>
                      <th className="text-center px-4 py-3 font-semibold text-yellow-600">
                        <span className="inline-flex items-center gap-1">🥇 ทอง</span>
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-500">
                        <span className="inline-flex items-center gap-1">🥈 เงิน</span>
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-orange-600">
                        <span className="inline-flex items-center gap-1">🥉 ทองแดง</span>
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-blue-500">
                        <span className="inline-flex items-center gap-1">🎖️ เข้าร่วม</span>
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.medals_by_group.map((group, idx) => {
                      const total = (group.gold || 0) + (group.silver || 0) + (group.bronze || 0) + (group.participant || 0);
                      return (
                        <tr key={group.id} className={`border-b last:border-0 hover:bg-gray-50 ${idx === 0 ? 'bg-yellow-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{group.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                              {group.gold || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                              {group.silver || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                              {group.bronze || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                              {group.participant || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Grid - Row 4: System */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">ระบบ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={School}
                title="โรงเรียนทั้งหมด"
                value={stats?.schools?.total}
                color="bg-blue-500"
              />
              
              <StatCard
                icon={Users}
                title="กลุ่มโรงเรียน"
                value={stats?.groups}
                color="bg-indigo-500"
              />
              
              <StatCard
                icon={Users}
                title="ผู้ดูแลโรงเรียน"
                value={stats?.users?.school_admins}
                color="bg-purple-500"
              />
              
              <StatCard
                icon={Users}
                title="ผู้ดูแลกลุ่ม"
                value={stats?.users?.group_admins}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Online Users */}
          <div className="mb-8">
            <OnlineUsersCard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              เมนูด่วน
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/competitions')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-5 h-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    จัดการการแข่งขัน
                  </div>
                  <div className="text-sm text-gray-600">
                    สร้างและจัดการการแข่งขัน
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/schools')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <School className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    จัดการโรงเรียน
                  </div>
                  <div className="text-sm text-gray-600">
                    ดูข้อมูลโรงเรียน
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/results')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">ผลการแข่งขัน</div>
                  <div className="text-sm text-gray-600">ดูผลคะแนน</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // GROUP ADMIN DASHBOARD
  // ===============================================
  if (user?.role === 'group_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-600 mt-2">
              ภาพรวมระบบจัดการการแข่งขัน กลุ่มโรงเรียน คณที่ {user?.school_group_id || '-'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Trophy}
              title="การแข่งขันทั้งหมด"
              value={stats?.competitions?.total}
              color="bg-blue-500"
              onClick={() => navigate('/competitions/group/dashboard')}
              subtitle={`เปิดรับสมัคร ${stats?.competitions?.open || 0} รายการ`}
            />
            
            <StatCard
              icon={TrendingUp}
              title="การลงทะเบียน"
              value={stats?.registrations?.total}
              color="bg-indigo-500"
              subtitle={`อนุมัติแล้ว ${stats?.registrations?.approved || 0}`}
            />
            
            <StatCard
              icon={Clock}
              title="รอการอนุมัติ"
              value={stats?.registrations?.pending}
              color="bg-yellow-500"
              onClick={() => navigate('/registrations/manage')}
            />
            
            <StatCard
              icon={Users}
              title="นักเรียนที่ลงทะเบียน"
              value={stats?.students}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatCard
              icon={School}
              title="โรงเรียนในกลุ่ม"
              value={stats?.schools}
              color="bg-green-500"
            />
            
            <StatCard
              icon={Calendar}
              title="กำลังดำเนินการ"
              value={stats?.competitions?.ongoing}
              color="bg-orange-500"
            />
          </div>

          {/* Online Users */}
          <div className="mb-8">
            <OnlineUsersCard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              เมนูด่วน
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/registrations/manage')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    จัดการการลงทะเบียน
                  </div>
                  <div className="text-sm text-gray-600">
                    อนุมัติ/ปฏิเสธ
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/competitions/group/dashboard')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-5 h-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    การแข่งขันของกลุ่ม
                  </div>
                  <div className="text-sm text-gray-600">
                    จัดการการแข่งขัน
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/results')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">ผลการแข่งขัน</div>
                  <div className="text-sm text-gray-600">ดูผลคะแนน</div>
                </div>
              </button>
            </div>
          </div>

          {/* Alert for pending registrations */}
          {stats?.registrations?.pending > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    มีการลงทะเบียนรอการอนุมัติ
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    มีการลงทะเบียน {stats.registrations.pending} รายการ
                    รอการอนุมัติจากคุณ
                  </p>
                  <button
                    onClick={() => navigate('/registrations/manage')}
                    className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    ไปที่หน้าจัดการ →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===============================================
  // SCHOOL ADMIN DASHBOARD
  // ===============================================
  if (user?.role === 'school_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-600 mt-2">
              ภาพรวมระบบจัดการการแข่งขัน
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={TrendingUp}
              title="การลงทะเบียนทั้งหมด"
              value={stats?.registrations?.total}
              color="bg-blue-500"
              onClick={() => navigate('/registrations/my')}
            />
            
            <StatCard
              icon={Clock}
              title="รอการอนุมัติ"
              value={stats?.registrations?.pending}
              color="bg-yellow-500"
            />
            
            <StatCard
              icon={CheckCircle}
              title="อนุมัติแล้ว"
              value={stats?.registrations?.approved}
              color="bg-green-500"
            />
            
            <StatCard
              icon={Users}
              title="นักเรียนที่เข้าแข่งขัน"
              value={stats?.students}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              title="การแข่งขันที่เปิดรับสมัคร"
              value={stats?.competitions?.available}
              color="bg-green-500"
              onClick={() => navigate('/registrations/browse')}
            />

            <StatCard
              icon={Trophy}
              title="การแข่งขันที่เข้าร่วม"
              value={stats?.competitions?.participating}
              color="bg-indigo-500"
            />
          </div>

          {/* Online Users */}
          <div className="mb-8">
            <OnlineUsersCard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              เมนูด่วน
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/registrations/browse')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-5 h-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    เลือกการแข่งขัน
                  </div>
                  <div className="text-sm text-gray-600">
                    ลงทะเบียนการแข่งขัน
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/registrations/my')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    การลงทะเบียนของฉัน
                  </div>
                  <div className="text-sm text-gray-600">
                    ดูการลงทะเบียนทั้งหมด
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/school/results')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">ประกาศผล</div>
                  <div className="text-sm text-gray-600">ดูผลการแข่งขัน</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/school/schedules')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-orange-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">ประกาศสถานที่แข่งขัน</div>
                  <div className="text-sm text-gray-600">ดูสถานที่แข่งขัน</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // CATEGORY ADMIN / DATA ENTRY DASHBOARD
  // ===============================================
  if (user?.role === 'category_admin' || user?.role === 'data_entry') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-600 mt-2">
              {stats?.category?.name || 'หมวดหมู่'} - {user?.role === 'category_admin' ? 'ผู้ดูแลหมวดหมู่' : 'ทีมบันทึกข้อมูล'}
            </p>
          </div>

          {/* Stats Grid - Competitions */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">การแข่งขัน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Trophy}
                title="การแข่งขันทั้งหมด"
                value={stats?.competitions?.total}
                color="bg-blue-500"
                onClick={() => navigate('/scores')}
              />
              <StatCard
                icon={BarChart3}
                title="ระดับเขต"
                value={stats?.competitions?.district}
                color="bg-indigo-500"
              />
              <StatCard
                icon={CheckCircle}
                title="ใส่คะแนนแล้ว"
                value={stats?.competitions?.scored}
                color="bg-green-500"
              />
              <StatCard
                icon={TrendingUp}
                title="ยืนยันคะแนนแล้ว"
                value={stats?.competitions?.finalized}
                color="bg-purple-500"
              />
            </div>
          </div>

          {/* Stats Grid - Registrations */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">การลงทะเบียน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                icon={TrendingUp}
                title="ลงทะเบียนทั้งหมด"
                value={stats?.registrations?.total}
                color="bg-blue-500"
                onClick={() => navigate('/registrations/manage')}
              />
              <StatCard
                icon={Clock}
                title="รอการอนุมัติ"
                value={stats?.registrations?.pending}
                color="bg-yellow-500"
                onClick={() => navigate('/registrations/manage')}
              />
              <StatCard
                icon={CheckCircle}
                title="อนุมัติแล้ว"
                value={stats?.registrations?.approved}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              เมนูด่วน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/scores')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">ผลการแข่งขัน</div>
                  <div className="text-sm text-gray-600">ใส่คะแนนการแข่งขัน</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/registrations/manage')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">จัดการการลงทะเบียน</div>
                  <div className="text-sm text-gray-600">ดูรายการลงทะเบียน</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/certificates')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-5 h-5 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">เกียรติบัตร</div>
                  <div className="text-sm text-gray-600">ออกเกียรติบัตร</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // DEFAULT (No specific role or loading)
  // ===============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">กำลังโหลด...</h1>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
