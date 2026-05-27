import { useEffect, useState } from "react";
import { School, Trophy, Award, Megaphone } from "lucide-react";
import api from "../services/api";

// ===== Components =====
const MiniStat = ({ label, value }) => (
  <div className="bg-gray-50 rounded-2xl p-4 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);

const MedalCard = ({ type, count }) => {
  const map = {
    gold: { e: "🥇", c: "bg-yellow-100 text-yellow-800" },
    silver: { e: "🥈", c: "bg-gray-100 text-gray-700" },
    bronze: { e: "🥉", c: "bg-orange-100 text-orange-700" },
    participant: { e: "🎖️", c: "bg-blue-100 text-blue-700" },
  };

  return (
    <div className={`rounded-2xl p-6 text-center ${map[type].c}`}>
      <div className="text-5xl mb-2">{map[type].e}</div>
      <div className="text-4xl font-extrabold">{count}</div>
    </div>
  );
};

const AnnouncementCard = ({ announcement }) => (
  <div className="border rounded-xl p-4 bg-white shadow-sm">
    <div className="font-semibold">{announcement.title}</div>
    <div className="text-sm text-gray-500 mt-1">
      📅 {new Date(announcement.published_at).toLocaleDateString('th-TH')}
    </div>
  </div>
);

// Overview Dashboard Component
const OverviewDashboard = ({ overview, announcements = [] }) => (
  <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
    <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-8">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl">
          <Trophy className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold">ภาพรวมทั้งเขต</h2>
          <p className="text-purple-100 mt-1">สรุปข้อมูลการแข่งขันทั้งหมด</p>
        </div>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* Total Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-purple-600" />
          <h4 className="text-xl font-bold">สถิติรวม</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="การแข่งขันทั้งหมด" value={overview.total_competitions || 0} />
          <MiniStat label="ลงทะเบียนทั้งหมด" value={overview.total_registrations || 0} />
          <MiniStat label="เสร็จสิ้นแล้ว" value={overview.completed_competitions || 0} />
          <MiniStat label="กลุ่มโรงเรียน" value={overview.total_groups || 0} />
        </div>
      </div>

      {/* Total Medals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h4 className="text-xl font-bold">เหรียญรางวัลทั้งหมด</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MedalCard type="gold" count={overview.total_gold || 0} />
          <MedalCard type="silver" count={overview.total_silver || 0} />
          <MedalCard type="bronze" count={overview.total_bronze || 0} />
          <MedalCard type="participant" count={overview.total_participant || 0} />
        </div>
      </div>

      {/* District Announcements */}
      {announcements && announcements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-purple-600" />
            <h4 className="text-xl font-bold">ประกาศระดับเขต</h4>
          </div>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const GroupDashboard = ({ group, allAnnouncements = [] }) => {
  // Filter ประกาศของกลุ่มนี้ (รวมประกาศระดับเขตด้วย)
  const groupAnnouncements = allAnnouncements.filter(a => 
    a.scope === 'district' || 
    (a.scope === 'group' && a.school_group_id === group.id)
  );

  return (
  <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-8">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl">
          <School className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold">{group.name}</h3>
          <p className="text-blue-100 mt-1">ID: {group.id}</p>
        </div>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-indigo-600" />
          <h4 className="text-xl font-bold">สถิติการแข่งขัน</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="การแข่งขัน" value={group.stats.competitions} />
          <MiniStat label="ลงทะเบียน" value={group.stats.registrations} />
          <MiniStat label="เสร็จสิ้น" value={group.stats.completed} />
          <MiniStat label="โรงเรียน" value={group.stats.schools} />
        </div>
      </div>

      {/* Medals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h4 className="text-xl font-bold">เหรียญรางวัล</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MedalCard type="gold" count={group.medals.gold} />
          <MedalCard type="silver" count={group.medals.silver} />
          <MedalCard type="bronze" count={group.medals.bronze} />
          <MedalCard type="participant" count={group.medals.participant} />
        </div>
      </div>

      {/* Announcements */}
      {groupAnnouncements && groupAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <h4 className="text-xl font-bold">ประกาศล่าสุด</h4>
          </div>
          <div className="space-y-3">
            {groupAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)};


// ===== Main Component =====
export default function PublicDashboard() {
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState(null);
  const [districtAnnouncements, setDistrictAnnouncements] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch overview, groups, and all announcements
      const [overviewRes, groupsRes, announcementsRes] = await Promise.all([
        api.get("/public/dashboard/overview"),
        api.get("/public/dashboard/groups"),
        api.get("/announcements", { params: { active_only: true, limit: 50 } })
      ]);
      
      setOverview(overviewRes.data);
      setGroups(groupsRes.data);
      
      // โหลดประกาศทั้งหมด
      const allAnnouncementsList = announcementsRes.data.data || announcementsRes.data;
      const announcementsArray = Array.isArray(allAnnouncementsList) ? allAnnouncementsList : [];
      
      setAllAnnouncements(announcementsArray);
      
      // Filter ประกาศระดับเขต
      const districtOnly = announcementsArray.filter(a => a.scope === 'district');
      setDistrictAnnouncements(districtOnly);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-extrabold mb-4">
            🏆 การแข่งขันศิลปหัตถกรรม ครั้งที่ 74 
          </h1>
          <p className="text-blue-200 text-xl">
            ระบบจัดการแข่งขันทักษะ สพป.นครปฐม เขต 1
          </p>
          <p className="text-blue-300 mt-2">
            อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Overview Section */}
        {overview && <OverviewDashboard overview={overview} announcements={districtAnnouncements} />}

        {/* Divider */}
        <div className="flex items-center gap-4 py-6">
          <div className="flex-1 border-t-2 border-gray-300"></div>
          <div className="flex items-center gap-2 text-gray-600">
            <School className="w-6 h-6" />
            <span className="text-xl font-bold">รายละเอียดแต่ละกลุ่มโรงเรียน</span>
          </div>
          <div className="flex-1 border-t-2 border-gray-300"></div>
        </div>

        {/* Groups Section */}
        <div className="space-y-8">
          {groups && groups.length > 0 ? (
            groups.map((group) => (
              <GroupDashboard 
                key={group.id} 
                group={group} 
                allAnnouncements={allAnnouncements}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-xl">ไม่มีข้อมูลกลุ่มโรงเรียน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
