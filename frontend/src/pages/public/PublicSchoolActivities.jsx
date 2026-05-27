import { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
  School,
  Trophy,
  Eye,
} from 'lucide-react';
import api from '@/lib/api';

const PublicSchoolActivities = () => {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [expandedSchools, setExpandedSchools] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [totalSchools, setTotalSchools] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/district-registrations');

      if (response.data.success) {
        const categories = response.data.data || [];
        const grouped = regroupBySchool(categories);
        setSchools(grouped);
        setTotalSchools(grouped.length);
        setTotalActivities(grouped.reduce((sum, s) => sum + s.activities.length, 0));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const regroupBySchool = (categories) => {
    const schoolMap = {};

    for (const cat of categories) {
      for (const comp of cat.competitions || []) {
        for (const reg of comp.registrations || []) {
          const key = reg.school_name || '-';
          if (!schoolMap[key]) {
            schoolMap[key] = {
              school_name: reg.school_name,
              school_group_name: reg.school_group_name,
              activities: [],
            };
          }
          schoolMap[key].activities.push({
            competition_name: comp.name,
            competition_level: comp.level,
            category_name: cat.category,
            student_names: reg.student_names || [],
            teacher_names: reg.teacher_names || [],
            student_count: reg.student_count,
            score: reg.score,
            medal: reg.medal,
            rank: reg.rank,
            is_published: comp.is_published,
          });
        }
      }
    }

    return Object.values(schoolMap).sort((a, b) =>
      a.school_name.localeCompare(b.school_name, 'th')
    );
  };

  const toggleSchool = (schoolName) => {
    setExpandedSchools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(schoolName)) {
        newSet.delete(schoolName);
      } else {
        newSet.add(schoolName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSchools(new Set(filteredSchools.map((s) => s.school_name)));
  };

  const collapseAll = () => {
    setExpandedSchools(new Set());
  };

  const getMedalEmoji = (medal) => {
    const map = { gold: '\u{1F947}', silver: '\u{1F948}', bronze: '\u{1F949}', participant: '\u{1F396}\uFE0F' };
    return map[medal] || '';
  };

  const getMedalText = (medal) => {
    const map = { gold: '\u0E17\u0E2D\u0E07', silver: '\u0E40\u0E07\u0E34\u0E19', bronze: '\u0E17\u0E2D\u0E07\u0E41\u0E14\u0E07', participant: '\u0E40\u0E02\u0E49\u0E32\u0E23\u0E48\u0E27\u0E21' };
    return map[medal] || '-';
  };

  const getMedalColor = (medal) => {
    const map = {
      gold: 'text-yellow-600 bg-yellow-100',
      silver: 'text-gray-600 bg-gray-100',
      bronze: 'text-orange-600 bg-orange-100',
      participant: 'text-blue-600 bg-blue-100',
    };
    return map[medal] || '';
  };

  const filteredSchools = searchTerm
    ? schools.filter(
        (s) =>
          s.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.school_group_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : schools;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <School className="w-8 h-8 text-teal-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  รายชื่อกิจกรรมของแต่ละโรงเรียน
                </h1>
                <p className="text-gray-600 mt-1">
                  แสดงกิจกรรมที่แต่ละโรงเรียนส่งเข้าแข่งขันระดับเขตพื้นที่
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <School className="w-8 h-8 text-teal-500" />
              <div>
                <p className="text-sm text-gray-600">จำนวนโรงเรียน</p>
                <p className="text-2xl font-bold text-gray-900">{totalSchools}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">จำนวนรายการที่ส่งแข่ง</p>
                <p className="text-2xl font-bold text-indigo-600">{totalActivities}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อโรงเรียน..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                ขยายทั้งหมด
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ย่อทั้งหมด
              </button>
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              พบ {filteredSchools.length} โรงเรียน
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredSchools.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ไม่พบข้อมูลโรงเรียน</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีโรงเรียนที่ส่งเข้าแข่งขันระดับเขต'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchools.map((school) => {
              const isExpanded = expandedSchools.has(school.school_name);

              return (
                <div key={school.school_name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* School Header */}
                  <div
                    onClick={() => toggleSchool(school.school_name)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-teal-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {school.school_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          กลุ่ม: {school.school_group_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                        <Trophy className="w-3 h-3 mr-1" />
                        {school.activities.length} กิจกรรม
                      </span>
                      {!isExpanded && (
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full animate-pulse">
                          <Eye className="w-3 h-3 mr-1" />
                          คลิกดูรายชื่อ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Activities */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="divide-y divide-gray-200">
                        {school.activities.map((act, idx) => (
                          <div key={idx} className="py-3 first:pt-0 last:pb-0">
                            {/* Activity name */}
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="text-sm font-semibold text-gray-400 mt-0.5 flex-shrink-0">{idx + 1}.</span>
                                <div className="min-w-0">
                                  <span className="text-sm font-semibold text-gray-900">{act.competition_name}</span>
                                  {act.competition_level && (
                                    <span className="text-xs text-gray-500 ml-1">({act.competition_level})</span>
                                  )}
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded ml-2">
                                    {act.category_name}
                                  </span>
                                </div>
                              </div>
                              {act.is_published && (act.score || act.medal) && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {act.rank && (
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-800 font-semibold rounded-full text-xs">
                                      {act.rank}
                                    </span>
                                  )}
                                  {act.score && (
                                    <span className="text-xs font-medium text-gray-700">{act.score} คะแนน</span>
                                  )}
                                  {act.medal && (
                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getMedalColor(act.medal)}`}>
                                      {getMedalEmoji(act.medal)} {getMedalText(act.medal)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Student names */}
                            {act.student_names.length > 0 && (
                              <div className="mt-1.5 ml-6">
                                <p className="text-xs font-medium text-blue-700 mb-0.5">
                                  <Users className="w-3 h-3 inline mr-1" />
                                  นักเรียน:
                                </p>
                                <div className="text-xs text-gray-700 leading-relaxed">
                                  {act.student_names.map((student, sIdx) => (
                                    <span key={sIdx}>
                                      {sIdx > 0 && ', '}
                                      {typeof student === 'string' ? student : student.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Teacher names */}
                            {act.teacher_names && act.teacher_names.length > 0 && (
                              <div className="mt-1 ml-6">
                                <p className="text-xs font-medium text-green-700 mb-0.5">ครูผู้ฝึกสอน:</p>
                                <div className="text-xs text-gray-700 leading-relaxed">
                                  {act.teacher_names.map((teacher, tIdx) => (
                                    <span key={tIdx}>
                                      {tIdx > 0 && ', '}
                                      {typeof teacher === 'string' ? teacher : teacher.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSchoolActivities;
