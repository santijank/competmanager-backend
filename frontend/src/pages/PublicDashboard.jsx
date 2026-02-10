import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, Trophy, Award, Megaphone, ExternalLink, Link as LinkIcon, MapPin, Calendar, Clock, ChevronDown, ChevronRight, Layers, Download, FileText, Building2, Users, Medal, LogIn, LogOut, User, LayoutDashboard, List, BookOpen, GraduationCap, Globe } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../stores/authStore";

// PDF Download Button Component
const PdfDownloadButton = ({ level = 'all', groupId = null, groupName = null }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      // สร้าง URL สำหรับดาวน์โหลด
      let url = `/api/results/pdf?level=${level}`;
      if (groupId) {
        url += `&school_group_id=${groupId}`;
      }

      // เปิดลิงก์ดาวน์โหลดในแท็บใหม่
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
      window.open(`${baseUrl}${url}`, '_blank');

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (level === 'group' && groupName) {
      return `ดาวน์โหลด PDF (${groupName})`;
    } else if (level === 'district') {
      return 'ดาวน์โหลด PDF ระดับเขต';
    } else if (level === 'group') {
      return 'ดาวน์โหลด PDF ระดับกลุ่ม';
    }
    return 'ดาวน์โหลด PDF ทั้งหมด';
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
      }`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>กำลังสร้าง PDF...</span>
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          <span>{getButtonText()}</span>
        </>
      )}
    </button>
  );
};

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

// Schedule Item Row Component - แสดงเป็นแถวในตาราง
const ScheduleItemRow = ({ schedule, index }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (start, end) => {
    if (!start) return '-';
    const startTime = start?.substring(0, 5) || '';
    const endTime = end?.substring(0, 5) || '';
    return endTime ? `${startTime} - ${endTime}` : `${startTime} น.`;
  };

  return (
    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-gray-900">{schedule.competition?.name || '-'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          {schedule.venue || '-'}
          {schedule.room && <span className="text-gray-400">({schedule.room})</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(schedule.competition_date)}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          {formatTime(schedule.start_time, schedule.end_time)}
        </div>
      </td>
      {schedule.notes && (
        <td className="px-4 py-3 text-xs text-gray-500 italic">
          {schedule.notes}
        </td>
      )}
    </tr>
  );
};

// Category Accordion Component - หมวดหมู่ที่ย่อ/ขยายได้
const CategoryAccordion = ({ categoryName, schedules, isExpanded, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      {/* Header - คลิกเพื่อย่อ/ขยาย */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-semibold text-gray-800">{categoryName}</span>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {schedules.length} กิจกรรม
          </span>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>

      {/* Content - ตารางรายการกิจกรรม */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">กิจกรรม</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">สถานที่</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">วันที่</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule, index) => (
                <ScheduleItemRow key={schedule.id} schedule={schedule} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Schedule Section Component - จัดกลุ่มตามหมวดหมู่
const ScheduleSection = ({ schedules, groupId, level = 'group' }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  // กรอง schedules ตาม level
  const filteredSchedules = level === 'district'
    ? schedules.filter(s => s.level === 'district')
    : schedules.filter(s => s.level === 'group' && s.school_group_id === groupId);

  if (!filteredSchedules || filteredSchedules.length === 0) return null;

  // จัดกลุ่มตามหมวดหมู่
  const groupedByCategory = filteredSchedules.reduce((acc, schedule) => {
    const categoryName = schedule.competition?.category?.name || 'อื่นๆ';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(schedule);
    return acc;
  }, {});

  // เรียงตามชื่อหมวดหมู่
  const sortedCategories = Object.keys(groupedByCategory).sort();

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    sortedCategories.forEach(cat => allExpanded[cat] = true);
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          <h4 className="text-xl font-bold">ตารางสถานที่แข่งขัน</h4>
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-medium">
            {filteredSchedules.length} กิจกรรม
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ขยายทั้งหมด
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ย่อทั้งหมด
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedCategories.map((categoryName) => (
          <CategoryAccordion
            key={categoryName}
            categoryName={categoryName}
            schedules={groupedByCategory[categoryName]}
            isExpanded={expandedCategories[categoryName] || false}
            onToggle={() => toggleCategory(categoryName)}
          />
        ))}
      </div>
    </div>
  );
};

// Medal Badge Component
const MedalBadge = ({ medal }) => {
  const medals = {
    gold: { emoji: '🥇', text: 'ทอง', bg: 'bg-yellow-100', color: 'text-yellow-800' },
    silver: { emoji: '🥈', text: 'เงิน', bg: 'bg-gray-100', color: 'text-gray-700' },
    bronze: { emoji: '🥉', text: 'ทองแดง', bg: 'bg-orange-100', color: 'text-orange-700' },
    participant: { emoji: '🎖️', text: 'เข้าร่วม', bg: 'bg-blue-100', color: 'text-blue-700' },
  };
  const m = medals[medal] || medals.participant;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.color}`}>
      {m.emoji} {m.text}
    </span>
  );
};

// Competition PDF Download Button - ปุ่มดาวน์โหลด PDF สำหรับแต่ละกิจกรรม
const CompetitionPdfButton = ({ competitionId, competitionName }) => {
  const handleDownload = () => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
    const url = `${baseUrl}/api/results/pdf/competition/${competitionId}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleDownload}
      title={`ดาวน์โหลด PDF - ${competitionName}`}
      className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
    >
      <FileText className="w-4 h-4" />
      <span className="text-xs font-medium">PDF</span>
    </button>
  );
};

// Results Accordion Component - แสดงผลการแข่งขันแบบย่อ/ขยาย
const ResultsAccordion = ({ categoryName, competitions, isExpanded, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-white p-1.5 rounded-lg">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-semibold text-gray-800">{categoryName}</span>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {competitions.length} กิจกรรม
          </span>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {competitions.map((comp) => (
            <div key={comp.id} className="bg-white border border-gray-100 rounded-lg p-4">
              {/* Header กิจกรรม พร้อมปุ่ม PDF */}
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">{comp.name}</h5>
                {comp.results && comp.results.length > 0 && (
                  <CompetitionPdfButton competitionId={comp.id} competitionName={comp.name} />
                )}
              </div>
              {comp.results && comp.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">อันดับ</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">โรงเรียน</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">คะแนน</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">เหรียญ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comp.results.map((result, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-medium">
                            {result.rank === 1 && '🥇'}
                            {result.rank === 2 && '🥈'}
                            {result.rank === 3 && '🥉'}
                            {result.rank > 3 && result.rank}
                          </td>
                          <td className="px-3 py-2">{result.school_name}</td>
                          <td className="px-3 py-2">{result.score}</td>
                          <td className="px-3 py-2"><MedalBadge medal={result.medal} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">ยังไม่มีผลการแข่งขัน</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Results Section Component - แสดงผลการแข่งขันที่เผยแพร่แล้ว
const ResultsSection = ({ results, groupId, groupName = null, level = 'group' }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  if (!results || results.length === 0) return null;

  // กรองผลตาม level
  const filteredResults = results.filter(category => {
    const filteredCompetitions = category.competitions.filter(comp => {
      if (level === 'district') {
        return comp.competition_level === 'district';
      }
      return comp.competition_level === 'group' && comp.school_group?.id === groupId;
    });
    return filteredCompetitions.length > 0;
  }).map(category => ({
    ...category,
    competitions: category.competitions.filter(comp => {
      if (level === 'district') {
        return comp.competition_level === 'district';
      }
      return comp.competition_level === 'group' && comp.school_group?.id === groupId;
    })
  }));

  if (filteredResults.length === 0) return null;

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    filteredResults.forEach(cat => allExpanded[cat.category] = true);
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  const totalCompetitions = filteredResults.reduce((sum, cat) => sum + cat.competitions.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600" />
          <h4 className="text-xl font-bold">ผลการแข่งขัน</h4>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-sm font-medium">
            {totalCompetitions} กิจกรรม
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ขยายทั้งหมด
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ย่อทั้งหมด
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredResults.map((category) => (
          <ResultsAccordion
            key={category.category}
            categoryName={category.category}
            competitions={category.competitions}
            isExpanded={expandedCategories[category.category] || false}
            onToggle={() => toggleCategory(category.category)}
          />
        ))}
      </div>
    </div>
  );
};

// School Ranking Component - แสดงอันดับโรงเรียนตามคะแนนรวม
const SchoolRankingSection = ({ results, schools, title, level = 'group', groupId = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // คำนวณคะแนนรวมแต่ละโรงเรียน
  const calculateSchoolScores = () => {
    const schoolScores = {};

    results.forEach(category => {
      category.competitions.forEach(comp => {
        // กรองตาม level
        if (level === 'district' && comp.competition_level !== 'district') return;
        if (level === 'group' && (comp.competition_level !== 'group' || comp.school_group?.id !== groupId)) return;

        comp.results?.forEach(result => {
          const schoolName = result.school_name;
          if (!schoolScores[schoolName]) {
            schoolScores[schoolName] = {
              name: schoolName,
              totalScore: 0,
              goldCount: 0,
              silverCount: 0,
              bronzeCount: 0,
              participantCount: 0,
              competitionCount: 0
            };
          }

          schoolScores[schoolName].totalScore += parseFloat(result.score) || 0;
          schoolScores[schoolName].competitionCount++;

          if (result.medal === 'gold') schoolScores[schoolName].goldCount++;
          else if (result.medal === 'silver') schoolScores[schoolName].silverCount++;
          else if (result.medal === 'bronze') schoolScores[schoolName].bronzeCount++;
          else schoolScores[schoolName].participantCount++;
        });
      });
    });

    // เรียงตามคะแนนรวม (จากมากไปน้อย)
    return Object.values(schoolScores)
      .sort((a, b) => {
        // เรียงตามเหรียญทอง ก่อน
        if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
        // ตามเหรียญเงิน
        if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
        // ตามเหรียญทองแดง
        if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
        // ตามคะแนนรวม
        return b.totalScore - a.totalScore;
      });
  };

  const rankedSchools = calculateSchoolScores();

  if (rankedSchools.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
            <Medal className="w-4 h-4" />
          </div>
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {rankedSchools.length} โรงเรียน
          </span>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">อันดับ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">โรงเรียน</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">🥇 ทอง</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">🥈 เงิน</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">🥉 ทองแดง</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">🎖️ เข้าร่วม</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">รายการ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">คะแนนรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankedSchools.map((school, index) => (
                <tr key={school.name} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-4 py-3 font-bold">
                    {index === 0 && <span className="text-2xl">🏆</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                    {index > 2 && <span className="text-gray-600">{index + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{school.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 font-bold rounded-full">
                      {school.goldCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 font-bold rounded-full">
                      {school.silverCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 font-bold rounded-full">
                      {school.bronzeCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full">
                      {school.participantCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{school.competitionCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                      {school.totalScore.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);

  // ตรวจสอบว่าเป็น Google Drive link หรือไม่
  const isGoogleDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const hasDetails = announcement.content || announcement.link_url || announcement.image_url;
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '');

  return (
    <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div
        className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{announcement.title}</div>
            {!expanded && announcement.content && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
            )}
            <div className="text-sm text-gray-500 mt-2">
              📅 {new Date(announcement.published_at).toLocaleDateString('th-TH')}
            </div>
          </div>
          <div className="ml-3 flex-shrink-0 flex items-center gap-2">
            {announcement.link_url && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                <LinkIcon className="w-3 h-3 mr-1" />
                ไฟล์แนบ
              </span>
            )}
            {announcement.image_url && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                🖼️ รูปภาพ
              </span>
            )}
            {hasDetails && (
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {announcement.content && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
          )}

          {/* แสดงรูปภาพ */}
          {announcement.image_url && (
            <div>
              <img
                src={`${apiBase}${announcement.image_url}`}
                alt={announcement.title}
                className="max-w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`${apiBase}${announcement.image_url}`, '_blank');
                }}
              />
            </div>
          )}

          {/* แสดงลิงก์ Google Drive หรือลิงก์อื่นๆ */}
          {announcement.link_url && (
            <div>
              <a
                href={announcement.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                {isGoogleDriveLink(announcement.link_url) ? (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zM8.72 5h6.56l3.29 5.4H5.43l3.29-5.4zm-3.56 6.9h13.68l-3.43 5.6H8.59l-3.43-5.6zM5.86 18l1.72-2.8h8.84l1.72 2.8H5.86z"/>
                    </svg>
                    {announcement.link_title || 'เปิดไฟล์ใน Google Drive'}
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {announcement.link_title || 'เปิดลิงก์'}
                  </>
                )}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// District Section Component - แสดงข้อมูลระดับเขต
const DistrictSection = ({ overview, announcements = [], schedules = [], results = [] }) => {
  // Filter ประกาศระดับเขต
  const districtAnnouncements = announcements.filter(a => a.scope === 'district');

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Building2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold">🏆 ระดับเขตพื้นที่</h2>
            <p className="text-purple-100 mt-1">การแข่งขันระดับสำนักงานเขตพื้นที่การศึกษา</p>
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

        {/* ✅ Competition List - รายการกิจกรรมระดับเขต */}
        <CompetitionListSection level="district" />

        {/* District Schedules - ตารางสถานที่แข่งขันระดับเขต */}
        <ScheduleSection schedules={schedules} level="district" />

        {/* District Results - ผลการแข่งขันระดับเขต */}
        <ResultsSection results={results} level="district" />

        {/* School Ranking - อันดับโรงเรียนระดับเขต */}
        <SchoolRankingSection
          results={results}
          title="อันดับโรงเรียน (ระดับเขต)"
          level="district"
        />

        {/* District Announcements */}
        {districtAnnouncements && districtAnnouncements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-6 h-6 text-purple-600" />
              <h4 className="text-xl font-bold">ประกาศระดับเขต</h4>
            </div>
            <div className="space-y-3">
              {districtAnnouncements.slice(0, 5).map((announcement) => (
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
};

const GroupDashboard = ({ group, allAnnouncements = [], schedules = [], results = [] }) => {
  // Filter ประกาศของกลุ่มนี้
  const groupAnnouncements = allAnnouncements.filter(a => {
    return a.scope === 'group' && a.school_group_id === group.id;
  });

  return (
  <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-8">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl">
          <School className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold">{group.name}</h3>
          <p className="text-blue-100 mt-1">{group.stats?.schools || 0} โรงเรียน</p>
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
          <MiniStat label="การแข่งขัน" value={group.stats?.competitions || 0} />
          <MiniStat label="ลงทะเบียน" value={group.stats?.registrations || 0} />
          <MiniStat label="เสร็จสิ้น" value={group.stats?.completed || 0} />
          <MiniStat label="โรงเรียน" value={group.stats?.schools || 0} />
        </div>
      </div>

      {/* Medals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h4 className="text-xl font-bold">เหรียญรางวัล</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MedalCard type="gold" count={group.medals?.gold || 0} />
          <MedalCard type="silver" count={group.medals?.silver || 0} />
          <MedalCard type="bronze" count={group.medals?.bronze || 0} />
          <MedalCard type="participant" count={group.medals?.participant || 0} />
        </div>
      </div>

      {/* ✅ Competition List - รายการกิจกรรมระดับกลุ่ม */}
      <CompetitionListSection level="group" groupId={group.id} groupName={group.name} />

      {/* Schedules - ตารางสถานที่แข่งขัน */}
      <ScheduleSection schedules={schedules} groupId={group.id} level="group" />

      {/* Results - ผลการแข่งขัน */}
      <ResultsSection results={results} groupId={group.id} groupName={group.name} level="group" />

      {/* School Ranking - อันดับโรงเรียนในกลุ่ม */}
      <SchoolRankingSection
        results={results}
        title={`อันดับโรงเรียน (${group.name})`}
        level="group"
        groupId={group.id}
      />

      {/* Announcements */}
      {groupAnnouncements && groupAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <h4 className="text-xl font-bold">ประกาศล่าสุด</h4>
          </div>
          <div className="space-y-3">
            {groupAnnouncements.slice(0, 3).map((announcement) => (
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


// ===== Competition List Section - รายการกิจกรรมที่แข่งขัน =====
const CompetitionListSection = ({ level = 'district', groupId = null, groupName = null }) => {
  const [competitions, setCompetitions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false); // ย่อ section ทั้งหมดเป็นค่าเริ่มต้น

  useEffect(() => {
    fetchCompetitions();
  }, [level, groupId]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const params = { level };
      if (groupId) params.school_group_id = groupId;

      const response = await api.get('/public/competitions', { params });
      if (response.data.success) {
        setCompetitions(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('ไม่สามารถโหลดรายการกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const expandAll = () => {
    if (!competitions?.categories) return;
    const allExpanded = {};
    competitions.categories.forEach(cat => allExpanded[cat.category] = true);
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">กำลังโหลดรายการกิจกรรม...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!competitions || !competitions.categories || competitions.categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <List className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>ไม่พบรายการกิจกรรม</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header - คลิกเพื่อ expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
          level === 'district'
            ? 'bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200'
            : 'bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className={`w-6 h-6 ${level === 'district' ? 'text-purple-600' : 'text-blue-600'}`} />
          <h4 className="text-xl font-bold">รายการกิจกรรมที่แข่งขัน</h4>
          <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
            level === 'district'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {competitions.summary.total_competitions} กิจกรรม
          </span>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content - แสดงเมื่อ isExpanded เป็น true */}
      {isExpanded && (
        <>
          {/* Expand/Collapse All Buttons */}
          <div className="flex items-center justify-end gap-2 mt-4 mb-2">
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ขยายทั้งหมด
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ย่อทั้งหมด
            </button>
          </div>

          {/* Categories Accordion */}
          <div className="space-y-2">
        {competitions.categories.map((category) => (
          <div key={category.category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.category)}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                level === 'district'
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  level === 'district' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-semibold text-gray-800">{category.category}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  level === 'district'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {category.count} กิจกรรม
                </span>
              </div>
              <div className={`transform transition-transform duration-200 ${expandedCategories[category.category] ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </div>
            </button>

            {/* Competition List */}
            {expandedCategories[category.category] && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-20">รหัส</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อกิจกรรม</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-32">ระดับชั้น</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-28">จำนวนคน</th>
                      {level === 'group' && (
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-36">กลุ่ม</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {category.competitions.map((comp, index) => (
                      <tr key={comp.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-4 py-2 text-sm font-mono text-gray-600">{comp.code}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">{comp.name}</div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            <GraduationCap className="w-3 h-3" />
                            {comp.level}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="text-sm text-gray-600">
                            {comp.min_students === comp.max_students
                              ? `${comp.max_students} คน`
                              : `${comp.min_students}-${comp.max_students} คน`}
                          </span>
                        </td>
                        {level === 'group' && (
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">
                              {comp.school_group?.name || '-'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className={`mt-4 p-3 rounded-lg text-sm ${
        level === 'district'
          ? 'bg-purple-50 text-purple-700'
          : 'bg-blue-50 text-blue-700'
      }`}>
        <span className="font-medium">รวมทั้งสิ้น:</span>{' '}
        {competitions.summary.total_categories} หมวดหมู่, {competitions.summary.total_competitions} กิจกรรม
      </div>
        </>
      )}
    </div>
  );
};


// ===== Main Component =====
export default function PublicDashboard() {
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState(null);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch overview, groups, announcements, schedules, and results
      const [overviewRes, groupsRes, announcementsRes, schedulesRes, resultsRes] = await Promise.all([
        api.get("/public/dashboard/overview"),
        api.get("/public/dashboard/groups"),
        api.get("/announcements/public", { params: { active_only: true, limit: 50 } }),
        api.get("/schedules/public").catch(() => ({ data: { data: [] } })),
        api.get("/results/public").catch(() => ({ data: { data: [] } }))
      ]);

      setOverview(overviewRes.data);
      setGroups(groupsRes.data);

      // โหลดตารางสถานที่แข่งขัน
      const schedulesData = schedulesRes.data?.data || [];
      setSchedules(schedulesData);

      // โหลดผลการแข่งขัน
      const resultsData = resultsRes.data?.data || [];
      setResults(resultsData);

      // โหลดประกาศทั้งหมด
      const allAnnouncementsList = announcementsRes.data.data || announcementsRes.data;
      const announcementsArray = Array.isArray(allAnnouncementsList) ? allAnnouncementsList : [];

      setAllAnnouncements(announcementsArray);

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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
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
    <div className="space-y-8">
      {/* District Section - ระดับเขตพื้นที่ */}
      {overview && (
        <DistrictSection
          overview={overview}
          announcements={allAnnouncements}
          schedules={schedules}
          results={results}
        />
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 py-6">
        <div className="flex-1 border-t-2 border-gray-300"></div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-6 h-6" />
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
              schedules={schedules}
              results={results}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">ไม่มีข้อมูลกลุ่มโรงเรียน</p>
          </div>
        )}
      </div>
    </div>
  );
}
