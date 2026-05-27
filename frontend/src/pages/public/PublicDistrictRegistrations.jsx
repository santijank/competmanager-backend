import { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
  Users,
  Award,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import api from '@/lib/api';

const PublicDistrictRegistrations = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedCompetitions, setExpandedCompetitions] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [totalComps, setTotalComps] = useState(0);
  const [totalRegs, setTotalRegs] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/district-registrations');

      if (response.data.success) {
        setCategories(response.data.data || []);
        setTotalComps(response.data.total_competitions || 0);
        setTotalRegs(response.data.total_registrations || 0);

        // Auto-expand all categories
        const data = response.data.data || [];
        if (data.length > 0) {
          setExpandedCategories(new Set(data.map(c => c.category)));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleCompetition = (compId) => {
    setExpandedCompetitions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(compId)) {
        newSet.delete(compId);
      } else {
        newSet.add(compId);
      }
      return newSet;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(filteredCategories.map(c => c.category)));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
    setExpandedCompetitions(new Set());
  };

  const getMedalEmoji = (medal) => {
    const map = { gold: '🥇', silver: '🥈', bronze: '🥉', participant: '🎖️' };
    return map[medal] || '';
  };

  const getMedalText = (medal) => {
    const map = { gold: 'ทอง', silver: 'เงิน', bronze: 'ทองแดง', participant: 'เข้าร่วม' };
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

  // Filter by search
  const filteredCategories = searchTerm
    ? categories.map(cat => ({
        ...cat,
        competitions: (cat.competitions || []).filter(comp =>
          comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(cat => cat.competitions.length > 0)
    : categories;

  // Count totals for filtered data
  const filteredTotalComps = filteredCategories.reduce((sum, cat) => sum + (cat.competitions?.length || 0), 0);
  const filteredTotalRegs = filteredCategories.reduce((sum, cat) =>
    sum + (cat.competitions || []).reduce((s, comp) => s + (comp.registration_count || 0), 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
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
              <MapPin className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  รายชื่อตัวแทนแข่งขันระดับเขตพื้นที่
                </h1>
                <p className="text-gray-600 mt-1">
                  รายชื่อนักเรียนและครูที่เป็นตัวแทนเข้าแข่งขันระดับเขตพื้นที่การศึกษา
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">กิจกรรมระดับเขต</p>
                <p className="text-2xl font-bold text-gray-900">{totalComps}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">ทีมที่เข้าแข่งขัน</p>
                <p className="text-2xl font-bold text-green-600">{totalRegs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">หมวดหมู่</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
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
                placeholder="ค้นหากิจกรรม..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={expandAllCategories}
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                ขยายทั้งหมด
              </button>
              <button
                onClick={collapseAllCategories}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ย่อทั้งหมด
              </button>
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              พบ {filteredTotalComps} กิจกรรม, {filteredTotalRegs} ทีม
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              ยังไม่มีกิจกรรมที่เข้าแข่งขันระดับเขต
            </p>
            <p className="text-gray-400 text-sm mt-2">
              กิจกรรมจะแสดงเมื่อมีการลงทะเบียนที่อนุมัติแล้วในระดับเขตพื้นที่
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategories.has(cat.category);
              const competitions = cat.competitions || [];
              const catRegs = competitions.reduce((sum, c) => sum + (c.registration_count || 0), 0);

              return (
                <div key={cat.category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.category)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-purple-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cat.category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {competitions.length} กิจกรรม | {catRegs} ทีม
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                      ระดับเขต
                    </span>
                  </div>

                  {/* Expanded: Competition List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {competitions.map((comp) => {
                        const isCompExpanded = expandedCompetitions.has(comp.id);

                        return (
                          <div key={comp.id} className="border-b border-gray-100 last:border-b-0">
                            {/* Competition Row */}
                            <div
                              onClick={() => toggleCompetition(comp.id)}
                              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                {comp.registration_count > 0 ? (
                                  isCompExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )
                                ) : (
                                  <div className="w-4 h-4 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {comp.name}
                                    </h4>
                                    {comp.skip_group_level && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        สมัครตรง
                                      </span>
                                    )}
                                    {comp.is_published && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        <CheckCircle className="w-3 h-3 mr-0.5" />
                                        ประกาศผลแล้ว
                                      </span>
                                    )}
                                  </div>
                                  {comp.level && (
                                    <p className="text-xs text-gray-500">{comp.level}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                                  <Users className="w-3 h-3 mr-1" />
                                  {comp.registration_count} ทีม
                                </span>
                                {comp.registration_count > 0 && !isCompExpanded && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full animate-pulse">
                                    <Eye className="w-3 h-3 mr-1" />
                                    คลิกดูรายชื่อ
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Expanded: Registration Cards */}
                            {isCompExpanded && comp.registrations && comp.registrations.length > 0 && (
                              <div className="bg-gray-50 px-4 py-3">
                                <div className="divide-y divide-gray-200">
                                  {comp.registrations.map((reg, idx) => (
                                    <div key={reg.id} className="py-3 first:pt-0 last:pb-0">
                                      {/* School name + group + score */}
                                      <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="flex items-start gap-2 min-w-0">
                                          <span className="text-sm font-semibold text-gray-400 mt-0.5 flex-shrink-0">{idx + 1}.</span>
                                          <div className="min-w-0">
                                            <span className="text-sm font-semibold text-gray-900">{reg.school_name}</span>
                                            <span className="text-xs text-gray-500 ml-2">({reg.school_group_name})</span>
                                            {reg.team_name && (
                                              <span className="text-xs text-gray-400 ml-2">ทีม: {reg.team_name}</span>
                                            )}
                                          </div>
                                        </div>
                                        {comp.is_published && (reg.score || reg.medal) && (
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {reg.rank && (
                                              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-800 font-semibold rounded-full text-xs">
                                                {reg.rank}
                                              </span>
                                            )}
                                            {reg.score && (
                                              <span className="text-xs font-medium text-gray-700">{reg.score} คะแนน</span>
                                            )}
                                            {reg.medal && (
                                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getMedalColor(reg.medal)}`}>
                                                {getMedalEmoji(reg.medal)} {getMedalText(reg.medal)}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Student names - shown immediately */}
                                      {reg.student_names && reg.student_names.length > 0 && (
                                        <div className="mt-1.5 ml-6">
                                          <p className="text-xs font-medium text-blue-700 mb-0.5">นักเรียน:</p>
                                          <div className="text-xs text-gray-700 leading-relaxed">
                                            {reg.student_names.map((student, sIdx) => (
                                              <span key={sIdx}>
                                                {sIdx > 0 && ', '}
                                                {typeof student === 'string' ? student : student.name}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Teacher names - shown immediately */}
                                      {reg.teacher_names && reg.teacher_names.length > 0 && (
                                        <div className="mt-1 ml-6">
                                          <p className="text-xs font-medium text-green-700 mb-0.5">ครูผู้ฝึกสอน:</p>
                                          <div className="text-xs text-gray-700 leading-relaxed">
                                            {reg.teacher_names.map((teacher, tIdx) => (
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDistrictRegistrations;
