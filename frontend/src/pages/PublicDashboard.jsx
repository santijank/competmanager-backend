import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { School, Trophy, Award, Megaphone, ExternalLink, Link as LinkIcon, MapPin, Calendar, Clock, ChevronDown, ChevronRight, ChevronLeft, Layers, Download, DownloadCloud, FileDown, FileText, Building2, Users, Medal, LogIn, LogOut, User, LayoutDashboard, List, BookOpen, GraduationCap, Globe, Search, Loader, Eye, CheckSquare, Square } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../stores/authStore";
import { exportScheduleToExcel } from "../utils/exportScheduleExcel";

// Animated Counter - ตัวเลขนับขึ้นเมื่อ scroll เข้ามา
function AnimatedCounter({ value, duration = 2.2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!value || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime = null;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const STAT_ITEMS = [
  { key: 'schools', icon: School, label: 'สถานศึกษาเข้าร่วม', suffix: '+', color: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.4)', glowBg: 'rgba(0,191,255,0.06)', accent: '#22d3ee' },
  { key: 'registrations', icon: Users, label: 'ทีมลงทะเบียน', suffix: '+', color: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.4)', glowBg: 'rgba(168,85,247,0.06)', accent: '#a78bfa' },
  { key: 'competitions', icon: Trophy, label: 'รายการแข่งขัน', suffix: '', color: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.4)', glowBg: 'rgba(251,191,36,0.06)', accent: '#fbbf24' },
  { key: 'groups', icon: Globe, label: 'กลุ่มโรงเรียน', suffix: '', color: 'from-emerald-400 to-emerald-600', glow: 'rgba(52,211,153,0.4)', glowBg: 'rgba(52,211,153,0.06)', accent: '#34d399' },
];

// PDF Download Button Component
const PdfDownloadButton = ({ level = 'all', groupId = null, groupName = null }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      // สร้าง URL สำหรับดาวน์โหลด (ใช้ web route เพื่อหลีกเลี่ยง API middleware)
      let url = `/pdf/results?level=${level}`;
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
const ScheduleSection = ({ schedules, groupId, level = 'group', groupName = '' }) => {
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
            onClick={() => exportScheduleToExcel(filteredSchedules, groupName || (level === 'district' ? 'ระดับเขตพื้นที่' : 'ตารางสถานที่'))}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <span className="text-gray-300">|</span>
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
    const url = `${baseUrl}/pdf/results/competition/${competitionId}`;
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

// ===== Certificate Section - ดาวน์โหลดเกียรติบัตร (Public, no auth) =====
const medalLabels = { gold: 'เหรียญทอง', silver: 'เหรียญเงิน', bronze: 'เหรียญทองแดง', participant: 'เข้าร่วม' };
const medalBadgeColors = {
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  participant: 'bg-blue-100 text-blue-800 border-blue-300',
};

const CertificateSection = ({ level = 'district', groupId = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [schools, setSchools] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMedal, setFilterMedal] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const baseUrl = api.defaults?.baseURL || import.meta.env.VITE_API_URL || '';

  // Fetch initial count (for header badge) on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const params = { level, per_page: 1 };
        if (groupId) params.school_group_id = groupId;
        const res = await api.get('/certificates/public', { params });
        setTotalCount(res.data?.summary?.total || 0);
      } catch { setTotalCount(0); }
    };
    fetchCount();
  }, [level, groupId]);

  // Fetch certificates when expanded or filters change
  useEffect(() => {
    if (!isExpanded) return;
    const fetchCerts = async () => {
      setLoading(true);
      try {
        const params = { level, page };
        if (groupId) params.school_group_id = groupId;
        if (filterSchool) params.school_name = filterSchool;
        if (filterType) params.recipient_type = filterType;
        if (filterMedal) params.medal = filterMedal;
        if (search) params.search = search;
        const res = await api.get('/certificates/public', { params });
        if (res.data?.success) {
          setCertificates(res.data.data || []);
          setSummary(res.data.summary || {});
          setSchools(res.data.schools || []);
          setMeta(res.data.meta || {});
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchCerts();
  }, [isExpanded, level, groupId, filterSchool, filterType, filterMedal, search, page]);

  // Reset page + selection on filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [filterSchool, filterType, filterMedal, search]);

  if (totalCount === 0) return null;

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    setSelectedIds(prev => prev.length === certificates.length ? [] : certificates.map(c => c.id));
  };

  const handleDownload = (certId) => {
    window.open(`${baseUrl}/certificates/${certId}/download`, '_blank');
  };
  const handlePreview = (certId) => {
    window.open(`${baseUrl}/certificates/preview?certificate_id=${certId}`, '_blank');
  };
  const handleBatchDownload = (ids) => {
    window.open(`${baseUrl}/certificates/public/batch-download?ids=${ids.join(',')}`, '_blank');
  };
  const handleDownloadAll = async () => {
    const total = summary.total || 0;
    if (total === 0) return;
    setDownloadingAll(true);
    try {
      const params = { level, per_page: 200 };
      if (groupId) params.school_group_id = groupId;
      if (filterSchool) params.school_name = filterSchool;
      if (filterType) params.recipient_type = filterType;
      if (filterMedal) params.medal = filterMedal;
      if (search) params.search = search;
      const res = await api.get('/certificates/public', { params });
      const allIds = (res.data?.data || []).map(c => c.id);
      if (allIds.length > 0) handleBatchDownload(allIds);
    } catch { /* ignore */ }
    finally { setDownloadingAll(false); }
  };

  return (
    <div>
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-600" />
          <h4 className="text-xl font-bold">เกียรติบัตร</h4>
          {totalCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-sm font-medium">
              {totalCount} ฉบับ
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-4">
          {/* Filters */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 max-w-[250px]"
              >
                <option value="">ทุกโรงเรียน</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกประเภท</option>
                <option value="student">นักเรียน</option>
                <option value="teacher">ครูผู้ฝึกสอน</option>
              </select>
              <select
                value={filterMedal}
                onChange={(e) => setFilterMedal(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกเหรียญ</option>
                <option value="gold">เหรียญทอง</option>
                <option value="silver">เหรียญเงิน</option>
                <option value="bronze">เหรียญทองแดง</option>
                <option value="participant">เข้าร่วม</option>
              </select>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, กิจกรรม..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Summary + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {summary.total > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">ทั้งหมด {summary.total}</span>}
              {summary.gold > 0 && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">ทอง {summary.gold}</span>}
              {summary.silver > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">เงิน {summary.silver}</span>}
              {summary.bronze > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">ทองแดง {summary.bronze}</span>}
              {summary.participant > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">เข้าร่วม {summary.participant}</span>}
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => handleBatchDownload(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <FileDown className="w-4 h-4" />
                  ดาวน์โหลดที่เลือก ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleDownloadAll}
                disabled={!summary.total || downloadingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {downloadingAll ? <Loader className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                ดาวน์โหลดทั้งหมด ({summary.total || 0})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">กำลังโหลด...</span>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Award className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>ไม่พบเกียรติบัตร</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-10">
                        <button onClick={selectAll}>
                          {selectedIds.length === certificates.length && certificates.length > 0
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-600">ประเภท</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">ชื่อ-สกุล</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">โรงเรียน</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">กิจกรรม</th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-600">เหรียญ</th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-600 w-20">ดาวน์โหลด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => toggleSelect(cert.id)}>
                            {selectedIds.includes(cert.id)
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {(cert.recipient_type || 'student') === 'teacher' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <Users className="w-3 h-3" /> ครู
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <GraduationCap className="w-3 h-3" /> นร.
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{cert.recipient_name || cert.student_name}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{cert.school_name}</td>
                        <td className="px-3 py-2">
                          <div className="text-gray-900 truncate max-w-[180px]">{cert.competition_name}</div>
                          {cert.category_name && <div className="text-xs text-gray-500">{cert.category_name}</div>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${medalBadgeColors[cert.medal] || 'bg-gray-100'}`}>
                            {medalLabels[cert.medal] || cert.medal}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handlePreview(cert.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="ดูตัวอย่าง">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDownload(cert.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600" title="ดาวน์โหลด">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">หน้า {meta.current_page} จาก {meta.last_page} ({meta.total} รายการ)</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                  let pn;
                  if (meta.last_page <= 5) pn = i + 1;
                  else if (page <= 3) pn = i + 1;
                  else if (page >= meta.last_page - 2) pn = meta.last_page - 4 + i;
                  else pn = page - 2 + i;
                  return (
                    <button key={pn} onClick={() => setPage(pn)} className={`w-8 h-8 rounded text-sm font-medium ${page === pn ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{pn}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page} className="p-2 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

// Category color palette for public announcements
const PUB_CAT_COLORS = [
  { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af' },  // rose
  { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },  // sky
  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },  // emerald
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },  // amber
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },  // violet
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },  // pink
  { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' },  // teal
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },  // indigo
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },  // orange
  { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },  // cyan
  { bg: '#ecfccb', text: '#3f6212', border: '#bef264' },  // lime
  { bg: '#fae8ff', text: '#86198f', border: '#e879f9' },  // fuchsia
  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },  // red
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },  // blue
];
const getPubCatColor = (catId) => catId ? PUB_CAT_COLORS[(catId - 1) % PUB_CAT_COLORS.length] : null;

const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);

  // ตรวจสอบว่าเป็น Google Drive link หรือไม่
  const isGoogleDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const hasDetails = announcement.content || announcement.link_url || announcement.image_url;
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '');
  const catColor = getPubCatColor(announcement.category_id);

  return (
    <div className={`border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
      style={catColor ? { borderLeftWidth: '4px', borderLeftColor: catColor.border } : {}}
    >
      <div
        className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{announcement.title}</span>
              {announcement.category_name && catColor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border"
                  style={{ backgroundColor: catColor.bg, color: catColor.text, borderColor: catColor.border }}
                >
                  {announcement.category_name}
                </span>
              )}
            </div>
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

// Announcements Grouped by Category - ประกาศจัดกลุ่มตามหมวดหมู่
const AnnouncementGroupedList = ({ announcements }) => {
  const [expandedCats, setExpandedCats] = useState(new Set());

  // Group by category
  const grouped = {};
  announcements.forEach((a) => {
    const key = a.category_name || 'ทั่วไป';
    if (!grouped[key]) grouped[key] = { items: [], categoryId: a.category_id || null };
    grouped[key].items.push(a);
  });
  const catNames = Object.keys(grouped);

  // ถ้ามีแค่หมวดเดียว ไม่ต้องจัดกลุ่ม แสดงเรียบๆ
  if (catNames.length <= 1) {
    return (
      <div className="relative space-y-2">
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    );
  }

  const toggleCat = (name) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="relative space-y-3">
      {/* Expand/Collapse All */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setExpandedCats(new Set(catNames))}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          ขยายทั้งหมด
        </button>
        <button
          onClick={() => setExpandedCats(new Set())}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          ย่อทั้งหมด
        </button>
      </div>

      {catNames.map((catName) => {
        const { items, categoryId } = grouped[catName];
        const isOpen = expandedCats.has(catName);
        const catColor = getPubCatColor(categoryId);

        return (
          <div key={catName} className="rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => toggleCat(catName)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-all"
              style={{ borderLeft: `4px solid ${catColor ? catColor.border : '#d1d5db'}` }}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: catColor ? catColor.text : '#6b7280' }} />
                <span className="font-bold" style={{ color: catColor ? catColor.text : '#374151' }}>{catName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={catColor ? { backgroundColor: catColor.bg, color: catColor.text } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {items.length}
                </span>
              </div>
              {isOpen
                ? <ChevronDown className="w-4 h-4" style={{ color: catColor ? catColor.text : '#9ca3af' }} />
                : <ChevronRight className="w-4 h-4" style={{ color: catColor ? catColor.text : '#9ca3af' }} />
              }
            </button>

            {isOpen && (
              <div className="px-4 pb-3 space-y-2 bg-gray-50">
                {items.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Real-Time Dashboard Section - กราฟสถิติกลุ่มโรงเรียน + เหรียญรางวัล
const BAR_COLORS = [
  { bar: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.25)', accent: '#22d3ee' },
  { bar: 'from-blue-400 to-blue-600', glow: 'rgba(59,130,246,0.25)', accent: '#60a5fa' },
  { bar: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.25)', accent: '#a78bfa' },
  { bar: 'from-emerald-400 to-emerald-600', glow: 'rgba(52,211,153,0.25)', accent: '#34d399' },
  { bar: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.25)', accent: '#fbbf24' },
  { bar: 'from-pink-400 to-pink-600', glow: 'rgba(236,72,153,0.25)', accent: '#f472b6' },
  { bar: 'from-indigo-400 to-indigo-600', glow: 'rgba(99,102,241,0.25)', accent: '#818cf8' },
  { bar: 'from-teal-400 to-teal-600', glow: 'rgba(20,184,166,0.25)', accent: '#2dd4bf' },
];

const RealtimeSection = ({ groups = [], overview = {}, results = [], categories = [] }) => {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedDistrictSchool, setSelectedDistrictSchool] = useState(null);
  const [showGroupTop15, setShowGroupTop15] = useState(false);

  if (!groups || groups.length === 0) return null;

  // --- Group bar chart data ---
  const sortedGroups = [...groups]
    .map(g => ({ name: g.name, value: g.stats?.registrations || 0 }))
    .sort((a, b) => b.value - a.value);
  const maxVal = Math.max(...sortedGroups.map(g => g.value), 1);

  // --- Medal donut data ---
  const gold = overview.total_gold || 0;
  const silver = overview.total_silver || 0;
  const bronze = overview.total_bronze || 0;
  const participant = overview.total_participant || 0;
  const totalMedals = gold + silver + bronze + participant;
  const goldDeg = totalMedals > 0 ? (gold / totalMedals) * 360 : 0;
  const silverDeg = goldDeg + (totalMedals > 0 ? (silver / totalMedals) * 360 : 0);
  const bronzeDeg = silverDeg + (totalMedals > 0 ? (bronze / totalMedals) * 360 : 0);
  const medalItems = [
    { label: 'ทอง', emoji: '🥇', count: gold, pct: totalMedals > 0 ? Math.round((gold / totalMedals) * 100) : 0 },
    { label: 'เงิน', emoji: '🥈', count: silver, pct: totalMedals > 0 ? Math.round((silver / totalMedals) * 100) : 0 },
    { label: 'ทองแดง', emoji: '🥉', count: bronze, pct: totalMedals > 0 ? Math.round((bronze / totalMedals) * 100) : 0 },
    { label: 'เข้าร่วม', emoji: '🎖️', count: participant, pct: totalMedals > 0 ? Math.round((participant / totalMedals) * 100) : 0 },
  ];

  // --- Top 15 schools (group level) ---
  const schoolScores = {};
  (results || []).forEach(cat => {
    (cat.competitions || []).forEach(comp => {
      if (comp.competition_level !== 'group') return;
      (comp.results || []).forEach(r => {
        const name = r.school_name;
        if (!name) return;
        if (!schoolScores[name]) {
          schoolScores[name] = { name, totalScore: 0, goldCount: 0, silverCount: 0, bronzeCount: 0, participantCount: 0, competitionCount: 0 };
        }
        schoolScores[name].totalScore += parseFloat(r.score) || 0;
        schoolScores[name].competitionCount++;
        if (r.medal === 'gold') schoolScores[name].goldCount++;
        else if (r.medal === 'silver') schoolScores[name].silverCount++;
        else if (r.medal === 'bronze') schoolScores[name].bronzeCount++;
        else schoolScores[name].participantCount++;
      });
    });
  });
  const top15 = Object.values(schoolScores)
    .sort((a, b) => {
      if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
      if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
      if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
      return b.totalScore - a.totalScore;
    })
    .slice(0, 15);
  const maxGold = Math.max(...top15.map(s => s.goldCount), 1);
  // แสดงโรงเรียนอันดับ 1 เป็นค่าเริ่มต้น
  const displaySchool = selectedSchool || top15[0] || null;

  // --- Top 30 schools (district level) ---
  const districtSchoolScores = {};
  (results || []).forEach(cat => {
    (cat.competitions || []).forEach(comp => {
      if (comp.competition_level !== 'district') return;
      (comp.results || []).forEach(r => {
        const name = r.school_name;
        if (!name) return;
        if (!districtSchoolScores[name]) {
          districtSchoolScores[name] = { name, totalScore: 0, goldCount: 0, silverCount: 0, bronzeCount: 0, participantCount: 0, competitionCount: 0 };
        }
        districtSchoolScores[name].totalScore += parseFloat(r.score) || 0;
        districtSchoolScores[name].competitionCount++;
        if (r.medal === 'gold') districtSchoolScores[name].goldCount++;
        else if (r.medal === 'silver') districtSchoolScores[name].silverCount++;
        else if (r.medal === 'bronze') districtSchoolScores[name].bronzeCount++;
        else districtSchoolScores[name].participantCount++;
      });
    });
  });
  const top30District = Object.values(districtSchoolScores)
    .sort((a, b) => {
      if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
      if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
      if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
      return b.totalScore - a.totalScore;
    })
    .slice(0, 30);
  const maxGoldDistrict = Math.max(...top30District.map(s => s.goldCount), 1);
  const displayDistrictSchool = selectedDistrictSchool || top30District[0] || null;

  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 md:p-8"
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0b0f2c 50%, #0a0e27 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,191,255,0.03),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.02),transparent_50%)]" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-cyan-400" />
          <h4 className="text-xl font-bold text-white">สถิติแบบเรียลไทม์</h4>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20"
          style={{ boxShadow: '0 0 15px rgba(52,211,153,0.1)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold">Live</span>
        </div>
      </div>

      {/* Row 1: Group bar + Medal donut */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - กลุ่มโรงเรียน */}
        <div className="relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-cyan-500/[0.03] to-transparent" />
          <div className="relative">
            <h5 className="text-sm font-semibold text-blue-200/50 mb-4">กลุ่มโรงเรียน</h5>
            <div className="space-y-2.5">
              {sortedGroups.map((g, idx) => {
                const pct = Math.round((g.value / maxVal) * 100);
                const colorSet = BAR_COLORS[idx % BAR_COLORS.length];
                return (
                  <div key={g.name} className="flex items-center gap-3">
                    <span className="text-xs text-blue-200/50 w-24 md:w-36 truncate text-right flex-shrink-0">{g.name}</span>
                    <div className="flex-1 bg-white/[0.04] rounded-xl h-6 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(pct, 8)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-xl bg-gradient-to-r ${colorSet.bar} relative`}
                        style={{ boxShadow: `0 0 20px ${colorSet.glow}` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl" />
                      </motion.div>
                    </div>
                    <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: colorSet.accent }}>{g.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Donut Chart - เหรียญรางวัล */}
        <div className="relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
          <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-amber-500/[0.03] to-transparent" />
          <div className="relative flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h5 className="text-sm font-semibold text-blue-200/50">สรุปเหรียญรางวัล</h5>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20"
                style={{ boxShadow: '0 0 15px rgba(251,191,36,0.1)' }}>
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold tabular-nums">{totalMedals}</span>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-44 h-44 rounded-full mb-6"
              style={{
                background: totalMedals > 0
                  ? `conic-gradient(#FFD700 0deg ${goldDeg}deg, #C0C0C0 ${goldDeg}deg ${silverDeg}deg, #CD7F32 ${silverDeg}deg ${bronzeDeg}deg, #60A5FA ${bronzeDeg}deg 360deg)`
                  : 'conic-gradient(#1e293b 0deg 360deg)',
                boxShadow: '0 0 50px rgba(255,215,0,0.1), 0 0 100px rgba(0,0,0,0.4)',
              }}
            >
              <div className="absolute inset-5 rounded-full flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(145deg, #0d1130 0%, #080c22 100%)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                <span className="text-3xl font-extrabold text-white">{totalMedals}</span>
                <span className="text-blue-200/35 text-xs mt-0.5">รวมทั้งหมด</span>
              </div>
              <div className="absolute inset-[-3px] rounded-full border border-white/[0.04] animate-rotate-slow" style={{ animationDuration: '30s' }}>
                <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-white/30 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {medalItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl p-2.5 transition-all duration-300 hover:bg-white/[0.04]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-white font-bold text-base tabular-nums">{item.count}</span>
                      <span className="text-blue-200/30 text-xs tabular-nums">{item.pct}%</span>
                    </div>
                    <div className="text-blue-200/35 text-xs">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* หมวดหมู่การแข่งขัน */}
      <CategorySection categories={categories} />

      {/* Row 2: Top 15 Schools (collapsible) */}
      {top15.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowGroupTop15(!showGroupTop15)}
            className="w-full flex items-center justify-between rounded-2xl p-4 mb-2 cursor-pointer transition-all duration-200 hover:bg-white/[0.04]"
            style={cardStyle}
          >
            <h5 className="text-sm font-semibold text-blue-200/50">🏆 Top 15 โรงเรียนคะแนนสูงสุด (ระดับกลุ่ม)</h5>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200/30">{showGroupTop15 ? 'ย่อ' : 'คลิกเพื่อเปิด'}</span>
              <ChevronDown className={`w-4 h-4 text-blue-200/40 transition-transform duration-200 ${showGroupTop15 ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {showGroupTop15 && (
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Top 15 list */}
          <div className="lg:col-span-3 relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-amber-500/[0.02] to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-semibold text-blue-200/50">🏆 Top 15 โรงเรียนคะแนนสูงสุด (ระดับกลุ่ม)</h5>
                <span className="text-xs text-blue-200/30">คลิกเพื่อดูรายละเอียด</span>
              </div>
              <div className="space-y-1.5">
                {top15.map((s, idx) => {
                  const pct = Math.round((s.goldCount / maxGold) * 100);
                  const isSelected = displaySchool?.name === s.name;
                  const colorSet = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div
                      key={s.name}
                      onClick={() => setSelectedSchool(s)}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-200 ${isSelected ? 'bg-white/10 ring-1 ring-cyan-400/40' : 'hover:bg-white/[0.04]'}`}
                    >
                      <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${idx < 3 ? 'text-amber-400' : 'text-blue-200/40'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs text-blue-100/70 w-32 md:w-44 truncate flex-shrink-0">{s.name}</span>
                      <div className="flex-1 bg-white/[0.04] rounded-lg h-5 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max(pct, 6)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-lg bg-gradient-to-r ${colorSet.bar} relative`}
                          style={{ boxShadow: `0 0 12px ${colorSet.glow}` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 w-24 justify-end">
                        <span className="text-yellow-400 text-xs tabular-nums">{s.goldCount}🥇</span>
                        <span className="text-gray-400 text-xs tabular-nums">{s.silverCount}🥈</span>
                        <span className="text-orange-400 text-xs tabular-nums">{s.bronzeCount}🥉</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected school detail */}
          <div className="lg:col-span-2 relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
            <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-cyan-500/[0.03] to-transparent" />
            <div className="relative flex flex-col h-full">
              {displaySchool ? (
                <>
                  <h5 className="text-sm font-semibold text-blue-200/50 mb-2">รายละเอียดโรงเรียน</h5>
                  <div className="text-lg font-bold text-white mb-4 leading-tight">{displaySchool.name}</div>

                  {/* Medal breakdown */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { emoji: '🥇', label: 'ทอง', count: displaySchool.goldCount, color: 'from-yellow-400 to-yellow-600', glow: 'rgba(250,204,21,0.3)' },
                      { emoji: '🥈', label: 'เงิน', count: displaySchool.silverCount, color: 'from-gray-300 to-gray-500', glow: 'rgba(156,163,175,0.3)' },
                      { emoji: '🥉', label: 'ทองแดง', count: displaySchool.bronzeCount, color: 'from-orange-400 to-orange-600', glow: 'rgba(251,146,60,0.3)' },
                      { emoji: '🎖️', label: 'เข้าร่วม', count: displaySchool.participantCount, color: 'from-blue-400 to-blue-600', glow: 'rgba(96,165,250,0.3)' },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-2xl">{m.emoji}</span>
                        <div className="text-2xl font-extrabold text-white mt-1">{m.count}</div>
                        <div className="text-blue-200/40 text-xs">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">คะแนนรวม</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displaySchool.totalScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">จำนวนรายการแข่ง</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displaySchool.competitionCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">เหรียญทั้งหมด</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displaySchool.goldCount + displaySchool.silverCount + displaySchool.bronzeCount + displaySchool.participantCount}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <School className="w-12 h-12 text-blue-200/20 mb-3" />
                  <p className="text-blue-200/40 text-sm">ยังไม่มีข้อมูลโรงเรียน</p>
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </div>
      )}

      {/* Row 3: Top 30 Schools (District Level) */}
      {top30District.length > 0 && (
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          {/* Left: Top 30 list */}
          <div className="lg:col-span-3 relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-cyan-500/[0.02] to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-semibold text-blue-200/50">🏅 Top 30 โรงเรียนคะแนนสูงสุด (ระดับเขตพื้นที่)</h5>
                <span className="text-xs text-blue-200/30">คลิกเพื่อดูรายละเอียด</span>
              </div>
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {top30District.map((s, idx) => {
                  const pct = Math.round((s.goldCount / maxGoldDistrict) * 100);
                  const isSelected = displayDistrictSchool?.name === s.name;
                  const colorSet = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div
                      key={s.name}
                      onClick={() => setSelectedDistrictSchool(s)}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-200 ${isSelected ? 'bg-white/10 ring-1 ring-cyan-400/40' : 'hover:bg-white/[0.04]'}`}
                    >
                      <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${idx < 3 ? 'text-amber-400' : 'text-blue-200/40'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs text-blue-100/70 w-32 md:w-44 truncate flex-shrink-0">{s.name}</span>
                      <div className="flex-1 bg-white/[0.04] rounded-lg h-5 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max(pct, 6)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-lg bg-gradient-to-r ${colorSet.bar} relative`}
                          style={{ boxShadow: `0 0 12px ${colorSet.glow}` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 w-24 justify-end">
                        <span className="text-yellow-400 text-xs tabular-nums">{s.goldCount}🥇</span>
                        <span className="text-gray-400 text-xs tabular-nums">{s.silverCount}🥈</span>
                        <span className="text-orange-400 text-xs tabular-nums">{s.bronzeCount}🥉</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected district school detail */}
          <div className="lg:col-span-2 relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
            <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-cyan-500/[0.03] to-transparent" />
            <div className="relative flex flex-col h-full">
              {displayDistrictSchool ? (
                <>
                  <h5 className="text-sm font-semibold text-blue-200/50 mb-2">รายละเอียดโรงเรียน (ระดับเขต)</h5>
                  <div className="text-lg font-bold text-white mb-4 leading-tight">{displayDistrictSchool.name}</div>

                  {/* Medal breakdown */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { emoji: '🥇', label: 'ทอง', count: displayDistrictSchool.goldCount, color: 'from-yellow-400 to-yellow-600', glow: 'rgba(250,204,21,0.3)' },
                      { emoji: '🥈', label: 'เงิน', count: displayDistrictSchool.silverCount, color: 'from-gray-300 to-gray-500', glow: 'rgba(156,163,175,0.3)' },
                      { emoji: '🥉', label: 'ทองแดง', count: displayDistrictSchool.bronzeCount, color: 'from-orange-400 to-orange-600', glow: 'rgba(251,146,60,0.3)' },
                      { emoji: '🎖️', label: 'เข้าร่วม', count: displayDistrictSchool.participantCount, color: 'from-blue-400 to-blue-600', glow: 'rgba(96,165,250,0.3)' },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-2xl">{m.emoji}</span>
                        <div className="text-2xl font-extrabold text-white mt-1">{m.count}</div>
                        <div className="text-blue-200/40 text-xs">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">คะแนนรวม</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displayDistrictSchool.totalScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">จำนวนรายการแข่ง</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displayDistrictSchool.competitionCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-blue-200/50 text-sm">เหรียญทั้งหมด</span>
                      <span className="text-white font-bold text-lg tabular-nums">{displayDistrictSchool.goldCount + displayDistrictSchool.silverCount + displayDistrictSchool.bronzeCount + displayDistrictSchool.participantCount}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <School className="w-12 h-12 text-blue-200/20 mb-3" />
                  <p className="text-blue-200/40 text-sm">ยังไม่มีข้อมูลโรงเรียนระดับเขต</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Overview Stats Section - ภาพรวมการแข่งขัน (dark theme with animated counters)
const OverviewStatsSection = ({ overview }) => {
  if (!overview) return null;

  const values = {
    schools: (overview.total_groups || 0) * 30,
    registrations: overview.total_registrations || 0,
    competitions: overview.total_competitions || 0,
    groups: overview.total_groups || 0,
  };

  return (
    <div
      className="relative rounded-t-3xl overflow-hidden px-6 py-10 md:px-8 md:py-14"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #4338ca 100%)' }}
    >
      {/* Soft overlay pattern */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.2),transparent_50%)]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 relative"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/60" />
          <span className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase">Live Statistics</span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/60" />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-md">ภาพรวมการแข่งขัน</h2>
      </motion.div>

      {/* Cards */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STAT_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const val = values[item.key];
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div
                className="relative bg-white/20 backdrop-blur-xl rounded-2xl p-5 md:p-7 overflow-hidden transition-all duration-500 h-full"
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(67,56,202,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-white/10" />

                {/* Icon */}
                <div className="relative mb-4 md:mb-6 flex justify-center">
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} blur-xl opacity-30 mx-auto w-12 h-12 md:w-16 md:h-16`}
                    style={{ transform: 'translateY(6px)' }} />
                  <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/30`}
                    style={{ boxShadow: `0 8px 30px ${item.glow}40, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                  </div>
                </div>

                {/* Number — gold gradient */}
                <div className="relative mb-1 text-center">
                  <span
                    className="text-3xl md:text-5xl font-extrabold tracking-wider"
                    style={{
                      background: 'linear-gradient(180deg, #fff8dc 0%, #ffd700 25%, #ffb700 50%, #ff8c00 75%, #b8860b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(184,134,11,0.5)) drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
                      letterSpacing: '2px',
                    }}
                  >
                    <AnimatedCounter value={val} />
                  </span>
                  {item.suffix && (
                    <span
                      className="text-xl md:text-2xl font-bold ml-1"
                      style={{
                        background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >{item.suffix}</span>
                  )}
                  {/* Gold glow */}
                  <div className="absolute -inset-4 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity blur-2xl"
                    style={{ background: 'rgba(255,215,0,0.6)' }} />
                </div>

                {/* Label */}
                <p className="text-white/70 text-xs md:text-sm font-medium relative text-center">{item.label}</p>

                {/* Bottom bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${item.color} opacity-60`} />

                {/* Corner ticks */}
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20 rounded-tr-md" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20 rounded-bl-md" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ── Icon & Color mapping for CategorySection ──
const catIconMap = {
  thai: '/images/icons/icon-thai.png', math: '/images/icons/icon-math.png',
  science: '/images/icons/icon-science.png', robotics: '/images/icons/icon-robotics.png',
  coding: '/images/icons/icon-coding.png', innovation: '/images/icons/icon-innovation.png',
  art: '/images/icons/icon-awards.png', music: '/images/icons/icon-awards.png',
  music_art: '/images/icons/icon-awards.png', health: '/images/icons/icon-health.png',
  foreign: '/images/icons/icon-foreign.png', social: '/images/icons/icon-social.png',
  career: '/images/icons/icon-career.png', stem: '/images/icons/icon-stem.png',
  awards: '/images/icons/icon-awards.png', default: '/images/icons/icon-awards.png',
};
const matchCatType = (name) => {
  if (!name) return 'default';
  const n = name.toLowerCase();
  if (n.includes('หุ่นยนต์') || n.includes('robot')) return 'robotics';
  if (n.includes('โปรแกรม') || n.includes('คอมพิวเตอร์') || n.includes('coding')) return 'coding';
  if (n.includes('นวัตกรรม') || n.includes('สิ่งประดิษฐ์')) return 'innovation';
  if (n.includes('stem') || n.includes('สะเต็ม')) return 'stem';
  if (n.includes('รางวัล') || n.includes('เกียรติ')) return 'awards';
  if (n.includes('ศิลปะ-ดนตรี') || (n.includes('ดนตรี') && n.includes('ศิลปะ'))) return 'music_art';
  if (n.includes('ทัศนศิลป์') || n.includes('นาฏศิลป์')) return 'art';
  if (n.includes('ดนตรี') || n.includes('เพลง') || n.includes('ขับร้อง') || n.includes('ลูกทุ่ง')) return 'music';
  if (n.includes('ภาษาไทย')) return 'thai';
  if (n.includes('คณิตศาสตร์')) return 'math';
  if (n.includes('วิทยาศาสตร์') || n.includes('เทคโนโลยี')) return 'science';
  if (n.includes('สุขศึกษา') || n.includes('พลศึกษา')) return 'health';
  if (n.includes('ภาษาต่างประเทศ') || n.includes('อังกฤษ') || n.includes('จีน')) return 'foreign';
  if (n.includes('สังคม') || n.includes('ศาสนา')) return 'social';
  if (n.includes('การงาน') || n.includes('อาชีพ')) return 'career';
  if (n.includes('ศิลปะ')) return 'art';
  if (n.includes('พัฒนาผู้เรียน') || n.includes('กิจกรรม')) return 'awards';
  return 'default';
};
const catColorSchemes = {
  thai:       { gradient: 'from-blue-500 via-indigo-600 to-blue-700',      glow: 'rgba(59,130,246,0.45)',   particle: '#60a5fa', hex: '#3b82f6' },
  math:       { gradient: 'from-emerald-500 via-green-600 to-teal-600',    glow: 'rgba(16,185,129,0.45)',   particle: '#34d399', hex: '#10b981' },
  science:    { gradient: 'from-cyan-500 via-sky-600 to-blue-600',         glow: 'rgba(6,182,212,0.45)',    particle: '#22d3ee', hex: '#06b6d4' },
  robotics:   { gradient: 'from-violet-500 via-purple-600 to-indigo-700',  glow: 'rgba(139,92,246,0.45)',   particle: '#a78bfa', hex: '#8b5cf6' },
  coding:     { gradient: 'from-green-500 via-emerald-600 to-cyan-700',    glow: 'rgba(34,197,94,0.45)',    particle: '#4ade80', hex: '#22c55e' },
  innovation: { gradient: 'from-amber-500 via-yellow-500 to-orange-600',   glow: 'rgba(245,158,11,0.45)',   particle: '#fbbf24', hex: '#f59e0b' },
  art:        { gradient: 'from-pink-500 via-rose-600 to-red-600',         glow: 'rgba(236,72,153,0.45)',   particle: '#f472b6', hex: '#ec4899' },
  music:      { gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', glow: 'rgba(168,85,247,0.45)',   particle: '#c084fc', hex: '#a855f7' },
  music_art:  { gradient: 'from-orange-500 via-amber-600 to-yellow-600',   glow: 'rgba(234,88,12,0.45)',    particle: '#fb923c', hex: '#ea580c' },
  health:     { gradient: 'from-red-500 via-rose-600 to-pink-600',         glow: 'rgba(239,68,68,0.45)',    particle: '#f87171', hex: '#ef4444' },
  foreign:    { gradient: 'from-sky-500 via-cyan-600 to-teal-600',         glow: 'rgba(14,165,233,0.45)',   particle: '#38bdf8', hex: '#0ea5e9' },
  social:     { gradient: 'from-indigo-500 via-blue-700 to-violet-700',    glow: 'rgba(99,102,241,0.45)',   particle: '#818cf8', hex: '#6366f1' },
  career:     { gradient: 'from-orange-600 via-amber-600 to-yellow-600',   glow: 'rgba(234,88,12,0.45)',    particle: '#fb923c', hex: '#ea580c' },
  stem:       { gradient: 'from-teal-500 via-cyan-600 to-blue-600',        glow: 'rgba(20,184,166,0.45)',   particle: '#2dd4bf', hex: '#14b8a6' },
  awards:     { gradient: 'from-yellow-500 via-amber-500 to-orange-600',   glow: 'rgba(234,179,8,0.45)',    particle: '#facc15', hex: '#eab308' },
  default:    { gradient: 'from-slate-500 via-gray-600 to-slate-700',      glow: 'rgba(148,163,184,0.35)',  particle: '#94a3b8', hex: '#64748b' },
};

// CategorySection - หมวดหมู่การแข่งขัน (Futuristic glassmorphism)
const CategorySection = ({ categories = [] }) => {
  if (!categories || categories.length === 0) return null;

  // 0) กรองหมวดที่ไม่ต้องแสดง
  const hiddenKeywords = ['พิเศษเรียนรวม', 'ศิลปะ-นาฎศิลป์', 'ศิลปะ-นาฏศิลป์'];
  const hiddenPrefixes = ['หมวดวิทยาศาสตร์และเทคโนโลยี (กิจกรรม'];
  const filtered = categories.filter(cat => {
    const name = (cat.category || '').trim();
    if (hiddenKeywords.some(kw => name.includes(kw))) return false;
    if (hiddenPrefixes.some(pf => name.startsWith(pf))) return false;
    return true;
  });

  // 1) Deduplicate categories ที่ชื่อซ้ำกัน (รวม count + competitions)
  const deduped = {};
  for (const cat of filtered) {
    const key = (cat.category || '').trim();
    if (!key) continue;
    if (!deduped[key]) {
      deduped[key] = { category: key, count: cat.count || cat.competitions?.length || 0, competitions: [...(cat.competitions || [])] };
    } else {
      deduped[key].count += cat.count || cat.competitions?.length || 0;
      deduped[key].competitions = [...deduped[key].competitions, ...(cat.competitions || [])];
    }
  }

  // 2) รวมหมวดศิลปะ (ทัศนศิลป์ + ดนตรี + นาฏศิลป์) เป็นหมวดเดียว
  const merged = [];
  let artGroup = null;
  for (const cat of Object.values(deduped)) {
    const name = (cat.category || '').toLowerCase();
    if (name.includes('ศิลปะ') && (name.includes('ทัศนศิลป์') || name.includes('ดนตรี') || name.includes('นาฏศิลป์'))) {
      if (!artGroup) {
        artGroup = { category: 'กลุ่มสาระศิลปะ', count: cat.count, competitions: [...cat.competitions] };
      } else {
        artGroup.count += cat.count;
        artGroup.competitions = [...artGroup.competitions, ...cat.competitions];
      }
    } else {
      merged.push(cat);
    }
  }
  if (artGroup) merged.push(artGroup);

  // 3) เรียงตามจำนวนรายการมาก→น้อย
  merged.sort((a, b) => (b.count || 0) - (a.count || 0));

  return (
    <div className="relative mt-6">
      <div className="relative z-10">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <span className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">Category Section</span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
            หมวดหมู่การแข่งขัน
          </h2>
          <p className="text-blue-200/30 text-sm max-w-xl mx-auto">
            กิจกรรมการแข่งขันศิลปหัตถกรรมนักเรียน แบ่งตามกลุ่มสาระการเรียนรู้
          </p>
        </motion.div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {merged.slice(0, 15).map((cat, idx) => {
            const type = matchCatType(cat.category);
            const scheme = catColorSchemes[type] || catColorSchemes.default;
            const iconSrc = catIconMap[type] || catIconMap.default;
            const count = cat.count || cat.competitions?.length || 0;

            return (
              <motion.div
                key={cat.category || idx}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.06, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -10, scale: 1.04 }}
                className="group relative cursor-default"
              >
                <div className="relative bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-5 pt-20 text-center overflow-hidden transition-all duration-700 hover:border-white/15 hover:bg-white/[0.05]"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,0.4)' }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{ background: `radial-gradient(circle at 50% 15%, ${scheme.glow}, transparent 65%)` }}
                  />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 transition-all duration-1000"
                    style={{ background: `radial-gradient(circle at 50% 80%, ${scheme.glow.replace('0.45', '0.15')}, transparent 50%)` }}
                  />

                  {/* Floating particles */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i}
                      className="absolute rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700"
                      style={{
                        width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
                        backgroundColor: scheme.particle,
                        left: `${10 + i * 16}%`, top: `${8 + (i * 14) % 60}%`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                        filter: `blur(${i % 2}px)`,
                      }}
                    />
                  ))}

                  {/* 3D Icon */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                    <motion.div
                      whileHover={{ rotateY: 12, rotateX: -8, scale: 1.08 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 180 }}
                      className="relative"
                      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
                    >
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${scheme.gradient} blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700`}
                        style={{ transform: 'translateZ(-30px) translateY(10px) scale(1.1)' }}
                      />
                      <div className="relative w-[3.85rem] h-[3.85rem] rounded-xl overflow-hidden border border-white/20"
                        style={{
                          boxShadow: `0 16px 50px ${scheme.glow}, 0 0 0 1px rgba(255,255,255,0.1), 0 0 30px ${scheme.glow.replace('0.45', '0.2')}, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.25)`,
                        }}
                      >
                        <img src={iconSrc} alt={cat.category} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                      </div>
                      <div className={`absolute -bottom-4 left-1 right-1 h-5 rounded-full bg-gradient-to-r ${scheme.gradient} opacity-15 blur-lg group-hover:opacity-30 transition-opacity duration-500`} />
                    </motion.div>
                  </div>

                  {/* Scan line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 mt-2">
                    <h3 className="text-white font-bold text-xs md:text-sm mb-2 line-clamp-2 min-h-[2.2rem] leading-tight tracking-tight">
                      {cat.category}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500"
                      style={{ backgroundColor: `${scheme.hex}08`, borderColor: `${scheme.hex}20` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: scheme.particle, boxShadow: `0 0 6px ${scheme.particle}` }} />
                      <span className="text-blue-200/60 text-xs font-semibold">{count} รายการ</span>
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-80 transition-opacity duration-500`} />

                  {/* Corner accents */}
                  <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-white/[0.04] rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-white/[0.04] rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// District Section Component - แสดงข้อมูลระดับเขต
const DistrictSection = ({ overview, announcements = [], schedules = [], results = [], groups = [], categories = [] }) => {
  // Filter ประกาศระดับเขต
  const districtAnnouncements = announcements.filter(a => a.scope === 'district');

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
      {/* Overview Stats - ภาพรวมการแข่งขัน บนสุด */}
      <OverviewStatsSection overview={overview} />

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
        {/* District Results - ผลการแข่งขันระดับเขต */}
        <ResultsSection results={results} level="district" />

        {/* District Certificates - เกียรติบัตรระดับเขต */}
        <CertificateSection level="district" />

        {/* School Ranking - อันดับโรงเรียนระดับเขต */}
        <SchoolRankingSection
          results={results}
          title="อันดับโรงเรียน (ระดับเขต)"
          level="district"
        />

        {/* Real-Time Dashboard */}
        <RealtimeSection groups={groups} overview={overview} results={results} categories={categories} />

        {/* ✅ Competition List - รายการกิจกรรมระดับเขต */}
        <CompetitionListSection level="district" />

        {/* ✅ ลิงก์ไปหน้ารายชื่อตัวแทนระดับเขต + กิจกรรมแต่ละโรงเรียน */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a
            href="/public-district"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium shadow-lg text-lg"
          >
            <Users className="w-5 h-5" />
            ดูรายชื่อตัวแทนแข่งขันระดับเขต
            <ChevronRight className="w-5 h-5" />
          </a>
          <a
            href="/public-committee"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg text-lg"
          >
            <Users className="w-5 h-5" />
            ดูรายชื่อคณะกรรมการระดับเขต
            <ChevronRight className="w-5 h-5" />
          </a>
          <a
            href="/public-schools"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-medium shadow-lg text-lg"
          >
            <School className="w-5 h-5" />
            ดูรายชื่อกิจกรรมของแต่ละโรงเรียน
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        {/* District Schedules - ตารางสถานที่แข่งขันระดับเขต */}
        <ScheduleSection schedules={schedules} level="district" groupName="ระดับเขตพื้นที่" />

        {/* District Announcements - ประกาศระดับเขต (ล่างสุด) */}
        {districtAnnouncements && districtAnnouncements.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #4338ca 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />
            <div className="relative p-6">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-amber-300" />
                <h4 className="text-lg font-bold text-white">ประกาศระดับเขต</h4>
              </div>
              <AnnouncementGroupedList announcements={districtAnnouncements} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const GroupDashboard = ({ group, allAnnouncements = [], schedules = [], results = [], isExpanded = false, onToggle }) => {
  // Filter ประกาศของกลุ่มนี้
  const groupAnnouncements = allAnnouncements.filter(a => {
    return a.scope === 'group' && a.school_group_id === group.id;
  });

  return (
  <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
    <div
      className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-8 cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl">
          <School className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <h3 className="text-3xl font-extrabold">{group.name}</h3>
          <p className="text-blue-100 mt-1">{group.stats?.schools || 0} โรงเรียน</p>
        </div>
        <div className="bg-white/20 p-2 rounded-xl">
          {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </div>
      </div>
    </div>

    {isExpanded && (
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
      <ScheduleSection schedules={schedules} groupId={group.id} level="group" groupName={group.name} />

      {/* Results - ผลการแข่งขัน */}
      <ResultsSection results={results} groupId={group.id} groupName={group.name} level="group" />

      {/* Certificates - เกียรติบัตรระดับกลุ่ม */}
      <CertificateSection level="group" groupId={group.id} />

      {/* School Ranking - อันดับโรงเรียนในกลุ่ม */}
      <SchoolRankingSection
        results={results}
        title={`อันดับโรงเรียน (${group.name})`}
        level="group"
        groupId={group.id}
      />

      {/* Announcements - Grouped by Category */}
      {groupAnnouncements && groupAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <h4 className="text-xl font-bold">ประกาศล่าสุด</h4>
          </div>
          <AnnouncementGroupedList announcements={groupAnnouncements} />
        </div>
      )}
    </div>
    )}
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const expandAllGroups = () => {
    if (groups) setExpandedGroups(new Set(groups.map(g => g.id)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch overview, groups, announcements, schedules, results, and categories
      const [overviewRes, groupsRes, announcementsRes, schedulesRes, resultsRes, competitionsRes] = await Promise.all([
        api.get("/public/dashboard/overview"),
        api.get("/public/dashboard/groups"),
        api.get("/announcements/public", { params: { active_only: true, limit: 200 } }),
        api.get("/schedules/public").catch(() => ({ data: { data: [] } })),
        api.get("/results/public").catch(() => ({ data: { data: [] } })),
        api.get("/public/competitions").catch(() => ({ data: { data: { categories: [] } } }))
      ]);

      setOverview(overviewRes.data);
      // กรองกลุ่มที่ไม่มีทีมลงทะเบียนออก (เช่น กลุ่มขยายโอกาส)
      const allGroups = groupsRes.data || [];
      setGroups(allGroups.filter(g => (g.stats?.registrations || 0) > 0));

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

      // โหลดหมวดหมู่การแข่งขัน
      const catData = competitionsRes.data?.data?.categories || competitionsRes.data?.categories || [];
      setCategories(catData);

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
          groups={groups}
          categories={categories}
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
      {groups && groups.length > 0 && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={expandAllGroups}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            ขยายทั้งหมด
          </button>
          <button
            onClick={collapseAllGroups}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            ย่อทั้งหมด
          </button>
        </div>
      )}

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
              isExpanded={expandedGroups.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
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
