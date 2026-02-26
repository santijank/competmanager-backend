import { useState, useEffect, Fragment } from 'react';
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
  Award,
  FileDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const DistrictResults = () => {
  const { user, hasRole } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedCompetitions, setExpandedCompetitions] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [totalComps, setTotalComps] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scores/district-results');

      if (response.data.success) {
        setCategories(response.data.data || []);
        setTotalComps(response.data.total_competitions || 0);

        // Auto-expand all categories
        const data = response.data.data || [];
        if (data.length > 0) {
          setExpandedCategories(new Set(data.map(c => c.category)));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
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

  const handleExportPdf = async (competitionId, type = 'all') => {
    try {
      setExportingPdf(competitionId);
      const response = await api.get(`/scores/district-certificates-pdf/${competitionId}`, {
        params: { type },
        responseType: 'blob'
      });

      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'เกิดข้อผิดพลาด');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `เกียรติบัตรระดับเขต_${competitionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลด PDF สำเร็จ');
    } catch (error) {
      console.error('Export PDF error:', error);
      let message = 'ไม่สามารถดาวน์โหลด PDF ได้';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch (e) { /* ignore */ }
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setExportingPdf(null);
    }
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
  const filteredTotalTeams = filteredCategories.reduce((sum, cat) =>
    sum + (cat.competitions || []).reduce((s, comp) => s + (comp.team_count || 0), 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ผลการแข่งขันระดับเขต
                </h1>
                <p className="text-gray-600 mt-1">
                  สรุปผลการแข่งขันระดับเขตพื้นที่การศึกษาที่ยืนยันแล้ว สำหรับออกเกียรติบัตร
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
              <Trophy className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">กิจกรรมที่มีผล</p>
                <p className="text-2xl font-bold text-gray-900">{totalComps}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">ทีมทั้งหมด</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.reduce((sum, cat) =>
                    sum + (cat.competitions || []).reduce((s, comp) => s + (comp.team_count || 0), 0), 0)}
                </p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={expandAllCategories}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
              พบ {filteredTotalComps} กิจกรรม, {filteredTotalTeams} ทีม
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              ยังไม่มีผลการแข่งขันระดับเขตที่ยืนยันแล้ว
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ผลจะแสดงเมื่อมีการยืนยันคะแนน (Finalize) ในระดับเขต
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategories.has(cat.category);
              const competitions = cat.competitions || [];
              const catTeams = competitions.reduce((sum, c) => sum + (c.team_count || 0), 0);

              return (
                <div key={cat.category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.category)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cat.category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {competitions.length} กิจกรรม | {catTeams} ทีม
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
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
                                {isCompExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {comp.name}
                                    </h4>
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    {comp.level && <span>{comp.level}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  <Users className="w-3 h-3 mr-1" />
                                  {comp.team_count} ทีม
                                </span>

                                {/* PDF Export Buttons */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPdf(comp.id, 'all');
                                    }}
                                    disabled={exportingPdf === comp.id}
                                    className="flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                                    title="PDF ทั้งหมด"
                                  >
                                    <FileDown className="h-3 w-3 mr-1" />
                                    {exportingPdf === comp.id ? '...' : 'PDF'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded: Team Details */}
                            {isCompExpanded && comp.teams && comp.teams.length > 0 && (
                              <div className="bg-gray-50 px-4 pb-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                      <th className="py-2 text-center pl-8 w-10">อันดับ</th>
                                      <th className="py-2 text-left">โรงเรียน</th>
                                      <th className="py-2 text-center w-20">คะแนน</th>
                                      <th className="py-2 text-center w-24">เหรียญ</th>
                                      <th className="py-2 text-center w-10">นร.</th>
                                      <th className="py-2 text-left">ผู้เข้าแข่งขัน</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comp.teams.map((team, idx) => {
                                      const studentNames = Array.isArray(team.student_names) ? team.student_names : [];
                                      const teacherNames = Array.isArray(team.teacher_names) ? team.teacher_names : [];

                                      return (
                                        <tr key={team.registration_id} className="border-b border-gray-100 last:border-b-0">
                                          <td className="py-1.5 text-center pl-8 font-medium text-gray-700">
                                            {team.rank || '-'}
                                          </td>
                                          <td className="py-1.5">
                                            <div className="text-gray-900">{team.school_name}</div>
                                            {team.team_name && (
                                              <div className="text-xs text-gray-500">{team.team_name}</div>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-center font-medium">{team.score}</td>
                                          <td className="py-1.5 text-center">
                                            {team.medal && (
                                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getMedalColor(team.medal)}`}>
                                                {getMedalEmoji(team.medal)} {getMedalText(team.medal)}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-center text-gray-600">{team.student_count}</td>
                                          <td className="py-1.5">
                                            <div className="text-xs text-gray-700">
                                              {studentNames.map((s, i) => {
                                                const name = typeof s === 'string' ? s : (s?.name || '-');
                                                return <div key={i}>{i + 1}. {name}</div>;
                                              })}
                                            </div>
                                            {teacherNames.length > 0 && (
                                              <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
                                                <span className="font-medium">ครู: </span>
                                                {teacherNames.map((t, i) => {
                                                  const name = typeof t === 'string' ? t : (t?.name || '-');
                                                  return <span key={i}>{i > 0 ? ', ' : ''}{name}</span>;
                                                })}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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

export default DistrictResults;
