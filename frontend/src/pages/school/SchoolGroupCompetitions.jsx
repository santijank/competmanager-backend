import { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
  Award,
  FileDown,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const SchoolGroupCompetitions = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedCompetitions, setExpandedCompetitions] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [totalComps, setTotalComps] = useState(0);
  const [totalRegs, setTotalRegs] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/registrations/group-overview');

      if (response.data.success) {
        setCategories(response.data.data || []);
        setTotalComps(response.data.total_competitions || 0);
        setTotalRegs(response.data.total_registrations || 0);

        // Auto-expand first category
        const data = response.data.data || [];
        if (data.length > 0) {
          setExpandedCategories(new Set([data[0].category]));
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

  const handleExportPdf = async (competitionId) => {
    try {
      setExportingPdf(competitionId);
      const response = await api.get(`/competitions/${competitionId}/scores/export/pdf`, {
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
      link.setAttribute('download', `ผลคะแนน_${competitionId}.pdf`);
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
  const filteredTotalRegs = filteredCategories.reduce((sum, cat) =>
    sum + (cat.competitions || []).reduce((s, comp) => s + (comp.registration_count || 0), 0), 0);

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
                  กิจกรรมแข่งขันของกลุ่ม
                </h1>
                <p className="text-gray-600 mt-1">
                  รายการกิจกรรมทั้งหมดที่มีการลงทะเบียน (อนุมัติแล้ว) ของกลุ่มโรงเรียน
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
                <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{totalComps}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">ทีมลงทะเบียน (อนุมัติ)</p>
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
              พบ {filteredTotalComps} กิจกรรม, {filteredTotalRegs} ทีม
            </div>
          )}
        </div>

        {/* Category Accordion */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีกิจกรรมแข่งขัน</p>
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
                        <ChevronDown className="w-5 h-5 text-gray-500" />
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

                              <div className="flex items-center space-x-3 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  <Users className="w-3 h-3 mr-1" />
                                  {comp.registration_count} ทีม
                                </span>

                                {comp.is_published && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPdf(comp.id);
                                    }}
                                    disabled={exportingPdf === comp.id}
                                    className="flex items-center px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-white transition-colors disabled:opacity-50"
                                    title="ดาวน์โหลด PDF"
                                  >
                                    <FileDown className="h-3 w-3 mr-1" />
                                    {exportingPdf === comp.id ? '...' : 'PDF'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded: Registration Details */}
                            {isCompExpanded && comp.registrations && comp.registrations.length > 0 && (
                              <div className="bg-gray-50 px-4 pb-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                      <th className="py-2 text-left pl-8 w-10">#</th>
                                      <th className="py-2 text-left">โรงเรียน</th>
                                      <th className="py-2 text-left">ชื่อทีม</th>
                                      <th className="py-2 text-center w-20">นร.</th>
                                      {comp.is_published && (
                                        <>
                                          <th className="py-2 text-center w-20">คะแนน</th>
                                          <th className="py-2 text-center w-20">อันดับ</th>
                                          <th className="py-2 text-center w-24">เหรียญ</th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comp.registrations.map((reg, idx) => (
                                      <tr key={reg.id} className="border-b border-gray-100 last:border-b-0">
                                        <td className="py-1.5 text-center pl-8 text-gray-500">{idx + 1}</td>
                                        <td className="py-1.5 text-gray-900">{reg.school_name}</td>
                                        <td className="py-1.5 text-gray-600">{reg.team_name}</td>
                                        <td className="py-1.5 text-center text-gray-600">{reg.student_count}</td>
                                        {comp.is_published && (
                                          <>
                                            <td className="py-1.5 text-center font-medium">
                                              {reg.score ?? '-'}
                                            </td>
                                            <td className="py-1.5 text-center">
                                              {reg.rank ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 font-semibold rounded-full text-xs">
                                                  {reg.rank}
                                                </span>
                                              ) : '-'}
                                            </td>
                                            <td className="py-1.5 text-center">
                                              {reg.medal ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getMedalColor(reg.medal)}`}>
                                                  {getMedalEmoji(reg.medal)} {getMedalText(reg.medal)}
                                                </span>
                                              ) : '-'}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    ))}
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

export default SchoolGroupCompetitions;
