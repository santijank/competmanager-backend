import { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const SchoolResults = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalComps: 0, gold: 0, silver: 0, bronze: 0 });
  const [exportingPdf, setExportingPdf] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('group'); // 'group' | 'district'

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/results/public', {
        params: { school_group_id: user?.school_group_id }
      });
      const data = response.data?.data || [];
      setCategories(data);

      // Auto-expand first category
      if (data.length > 0) {
        setExpandedCategories(new Set([data[0].category]));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
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

  const expandAll = () => {
    setExpandedCategories(new Set(filteredCategories.map(c => c.category)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
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

  /**
   * ดาวน์โหลด PDF สำหรับกิจกรรมเดียว
   */
  const handleExportPdf = async (competitionId) => {
    try {
      setExportingPdf(competitionId);
      const response = await api.get(`/competitions/${competitionId}/scores/export/pdf`, {
        responseType: 'blob'
      });

      // ตรวจสอบว่า response เป็น JSON error หรือไม่
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

  /**
   * ดาวน์โหลด PDF รวมทุกกิจกรรมของโรงเรียน (ตาม tab ที่เลือก)
   */
  const handleExportAll = async () => {
    const allCompIds = filteredCategories.flatMap(cat =>
      (cat.competitions || []).map(comp => comp.id)
    );
    if (allCompIds.length === 0) {
      toast.warning('ไม่มีกิจกรรมที่จะดาวน์โหลด');
      return;
    }
    try {
      setExportingAll(true);
      const response = await api.get('/scores/export/batch-pdf', {
        params: { ids: allCompIds.join(',') },
        responseType: 'blob',
      });

      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'เกิดข้อผิดพลาด');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const tabLabel = activeTab === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม';
      link.setAttribute('download', `ผลคะแนนรวม_${tabLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`ดาวน์โหลด PDF รวม ${allCompIds.length} กิจกรรมสำเร็จ`);
    } catch (error) {
      console.error('Export all PDF error:', error);
      let message = 'ไม่สามารถดาวน์โหลดได้';
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
      setExportingAll(false);
    }
  };

  // Filter categories by active tab + search + only show competitions where user's school has results
  const schoolId = user?.school_id;
  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      competitions: (cat.competitions || []).filter(comp => {
        const matchesTab = comp.competition_level === activeTab;
        const matchesSearch = !searchTerm ||
          comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.code?.toLowerCase().includes(searchTerm.toLowerCase());
        // แสดงเฉพาะกิจกรรมที่โรงเรียนตัวเองมีผลรางวัล
        const hasSchoolResults = schoolId
          ? (comp.results || []).some(r => r.school_id === schoolId)
          : (comp.results || []).length > 0;
        return matchesTab && matchesSearch && hasSchoolResults;
      })
    }))
    .filter(cat => cat.competitions.length > 0);

  // Recalculate stats when tab or data changes (count only user's school medals)
  useEffect(() => {
    let totalComps = 0, gold = 0, silver = 0, bronze = 0;
    categories.forEach(cat => {
      (cat.competitions || []).forEach(comp => {
        if (comp.competition_level !== activeTab) return;
        const schoolResults = schoolId
          ? (comp.results || []).filter(r => r.school_id === schoolId)
          : (comp.results || []);
        if (schoolResults.length === 0) return;
        totalComps++;
        schoolResults.forEach(r => {
          if (r.medal === 'gold') gold++;
          else if (r.medal === 'silver') silver++;
          else if (r.medal === 'bronze') bronze++;
        });
      });
    });
    setStats({ totalComps, gold, silver, bronze });
  }, [categories, activeTab, schoolId]);

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
                  ประกาศผลการแข่งขัน
                </h1>
                <p className="text-gray-600 mt-1">
                  ผลการแข่งขันที่ประกาศแล้วทั้งหมด
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportAll}
                disabled={exportingAll || filteredCategories.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className={`w-4 h-4 ${exportingAll ? 'animate-bounce' : ''}`} />
                <span>{exportingAll ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดทั้งหมด'}</span>
              </button>
              <button
                onClick={fetchResults}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalComps}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">🥇 เหรียญทอง</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.gold}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">🥈 เหรียญเงิน</p>
            <p className="text-2xl font-bold text-gray-600">{stats.silver}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">🥉 เหรียญทองแดง</p>
            <p className="text-2xl font-bold text-orange-600">{stats.bronze}</p>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('group'); setExpandedCategories(new Set()); }}
              className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-colors ${
                activeTab === 'group'
                  ? 'text-white bg-green-600'
                  : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
              }`}
            >
              ระดับกลุ่มโรงเรียน
            </button>
            <button
              onClick={() => { setActiveTab('district'); setExpandedCategories(new Set()); }}
              className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-colors ${
                activeTab === 'district'
                  ? 'text-white bg-blue-600'
                  : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              ระดับเขตพื้นที่การศึกษา
            </button>
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
                onClick={expandAll}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
        </div>

        {/* Category Accordion */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีประกาศผลการแข่งขัน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategories.has(cat.category);
              const competitions = cat.competitions || [];

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
                          {competitions.length} กิจกรรม
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Competition Results */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {competitions.map((comp) => (
                        <div key={comp.id} className="border-b border-gray-100 last:border-b-0">
                          {/* Competition Header */}
                          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-3">
                                <h4 className="text-base font-medium text-gray-900">
                                  {comp.name}
                                </h4>
                              </div>
                              {comp.level && (
                                <p className="text-sm text-gray-500 mt-1">ระดับชั้น: {comp.level}</p>
                              )}
                            </div>
                            {/* PDF Download Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportPdf(comp.id);
                              }}
                              disabled={exportingPdf === comp.id}
                              className="flex items-center px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="ดาวน์โหลด PDF ผลคะแนน"
                            >
                              <FileDown className="h-3.5 w-3.5 mr-1" />
                              {exportingPdf === comp.id ? 'กำลังสร้าง...' : 'PDF'}
                            </button>
                          </div>

                          {/* Results Table */}
                          {comp.results && comp.results.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">อันดับ</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">โรงเรียน</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">ทีม</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase w-24">คะแนน</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase w-28">เหรียญ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {comp.results.map((result, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-semibold rounded-full text-sm">
                                          {result.rank}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{result.school_name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{result.team_name}</td>
                                      <td className="px-4 py-2 text-center text-sm font-medium text-gray-900">
                                        {result.score !== null ? parseFloat(result.score).toFixed(2) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {result.medal && (
                                          <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full ${getMedalColor(result.medal)}`}>
                                            <span>{getMedalEmoji(result.medal)}</span>
                                            <span>{getMedalText(result.medal)}</span>
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="px-4 py-4 text-center text-gray-500 text-sm">
                              ยังไม่มีผลการแข่งขัน
                            </div>
                          )}
                        </div>
                      ))}
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

export default SchoolResults;
