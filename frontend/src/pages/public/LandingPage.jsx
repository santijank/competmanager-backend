import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Public Landing Page - Classic Soft Pastel Design
 * 12 กลุ่มโรงเรียน สพป. นครปฐม เขต 1
 * สถิติ 5 ตัว: โรงเรียน, นักเรียน, เปิด, ลงทะเบียน, แข่งขัน
 */
export default function PublicLandingPageClassic() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/public/groups`);
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <header className="bg-blue-100 border-b border-blue-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <span className="text-3xl">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CompetManager</h1>
                <p className="text-sm text-gray-600">
                  ระบบจัดการแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 74
                </p>
              </div>
            </div>
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1
          </p>
          <p className="text-lg text-gray-500">
            ครอบคลุม 121 โรงเรียน 12 กลุ่มโรงเรียน
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          กลุ่มโรงเรียนทั้ง {groups.length} กลุ่ม
        </h2>

        {/* Group Cards */}
        <div className="space-y-6">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Group Header */}
              <div className="bg-blue-50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-5xl">{group.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {group.code} • กลุ่มที่ {index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">ลำดับที่</div>
                    <div className="text-4xl font-bold text-blue-500">
                      {index + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {/* Total Schools */}
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                    <div className="text-3xl mb-2">🏫</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {group.total_schools || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">โรงเรียน</div>
                  </div>

                  {/* Total Students */}
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-2xl font-bold text-green-600">
                      {group.total_students || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">นักเรียน</div>
                  </div>

                  {/* Open Competitions */}
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {group.open_competitions || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">กิจกรรมเปิด</div>
                  </div>

                  {/* Registered */}
                  <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {group.registered_competitions || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">ลงทะเบียนแล้ว</div>
                  </div>

                  {/* Completed */}
                  <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-100">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {group.completed_competitions || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">แข่งขันแล้ว</div>
                  </div>
                </div>

                {/* Latest Announcement */}
                {group.latest_announcement ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">📢</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            {group.latest_announcement.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {group.latest_announcement.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {group.latest_announcement.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 border border-gray-100">
                    <div className="text-2xl mb-2">📭</div>
                    <div className="text-sm">ยังไม่มีประกาศล่าสุด</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    📊 ดูสถิติเต็ม
                  </button>
                  <button className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">
                    📢 ประกาศข่าวสาร
                  </button>
                  <button className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium">
                    🏆 ดูผลการแข่งขัน
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-600">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">เกี่ยวกับ</h3>
              <p className="text-sm">
                ระบบจัดการการแข่งขันศิลปหัตถกรรมนักเรียน<br />
                สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">ลิงค์ด่วน</h3>
              <ul className="space-y-2 text-sm">
                <li>• ประกาศผลการแข่งขัน</li>
                <li>• คู่มือการใช้งาน</li>
                <li>• ติดต่อเรา</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">ติดต่อ</h3>
              <p className="text-sm">
                สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1<br />
                โทร: 034-xxx-xxx
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2026 CompetManager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
