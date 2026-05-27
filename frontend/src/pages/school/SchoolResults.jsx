import { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  RefreshCw,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const SchoolResults = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalComps: 0, gold: 0, silver: 0, bronze: 0 });
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
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
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (medal) => {
    const map = { gold: '🥇', silver: '🥈', bronze: '🥉', participant: '🎖️' };
    return map[medal] || '';
  };

  const getMedalText = (medal) => {
    const map = { gold: 'เหรียญทอง', silver: 'เหรียญเงิน', bronze: 'เหรียญทองแดง', participant: 'เข้าร่วม' };
    return map[medal] || '-';
  };

  const getMedalBgColor = (medal) => {
    const map = {
      gold: 'bg-yellow-50 border-yellow-200',
      silver: 'bg-gray-50 border-gray-200',
      bronze: 'bg-orange-50 border-orange-200',
      participant: 'bg-blue-50 border-blue-200',
    };
    return map[medal] || 'bg-white border-gray-200';
  };

  const getMedalBadgeColor = (medal) => {
    const map = {
      gold: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      silver: 'text-gray-700 bg-gray-100 border-gray-300',
      bronze: 'text-orange-700 bg-orange-100 border-orange-300',
      participant: 'text-blue-700 bg-blue-100 border-blue-300',
    };
    return map[medal] || '';
  };

  /**
   * ดาวน์โหลด PDF รวมทุกกิจกรรมของโรงเรียน (ตาม tab ที่เลือก)
   */
  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      const response = await api.get('/scores/export/my-school-pdf', {
        params: { level: activeTab },
        responseType: 'blob',
        timeout: 300000,
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
      toast.success('ดาวน์โหลด PDF รวมสำเร็จ');
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

  /**
   * ดาวน์โหลด Excel รวมทุกกิจกรรมของโรงเรียน (ตาม tab ที่เลือก)
   */
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const response = await api.get('/scores/export/my-school-excel', {
        params: { level: activeTab },
        responseType: 'blob',
        timeout: 300000,
      });

      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'เกิดข้อผิดพลาด');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      const tabLabel = activeTab === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม';
      link.setAttribute('download', `ผลคะแนนรวม_${tabLabel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด Excel สำเร็จ');
    } catch (error) {
      console.error('Export Excel error:', error);
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
      setExportingExcel(false);
    }
  };

  // สร้างรายการแบน (flat list) — แต่ละ item = 1 กิจกรรม + ผลของโรงเรียน
  const schoolId = user?.school_id;
  const flatList = [];
  categories.forEach(cat => {
    (cat.competitions || []).forEach(comp => {
      if (comp.competition_level !== activeTab) return;
      const matchesSearch = !searchTerm ||
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.code?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return;

      // เอาเฉพาะผลของโรงเรียนตนเอง
      const myResults = schoolId
        ? (comp.results || []).filter(r => r.school_id === schoolId)
        : (comp.results || []);

      if (myResults.length === 0) return;

      // ถ้าโรงเรียนมีหลายทีมในกิจกรรมเดียว → แสดงแต่ละทีม
      myResults.forEach(result => {
        flatList.push({
          compId: comp.id,
          compName: comp.name,
          category: cat.category,
          score: result.score,
          rank: result.rank,
          medal: result.medal,
          teamName: result.team_name,
        });
      });
    });
  });

  // Recalculate stats
  useEffect(() => {
    let totalComps = 0, gold = 0, silver = 0, bronze = 0;
    const counted = new Set();
    categories.forEach(cat => {
      (cat.competitions || []).forEach(comp => {
        if (comp.competition_level !== activeTab) return;
        const myResults = schoolId
          ? (comp.results || []).filter(r => r.school_id === schoolId)
          : (comp.results || []);
        if (myResults.length === 0) return;
        if (!counted.has(comp.id)) {
          totalComps++;
          counted.add(comp.id);
        }
        myResults.forEach(r => {
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
      <div className="max-w-4xl mx-auto">
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
                  ผลการแข่งขันของโรงเรียน
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportAll}
                disabled={exportingAll || flatList.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className={`w-4 h-4 ${exportingAll ? 'animate-bounce' : ''}`} />
                <span>{exportingAll ? 'กำลังสร้าง...' : 'PDF'}</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel || flatList.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className={`w-4 h-4 ${exportingExcel ? 'animate-bounce' : ''}`} />
                <span>{exportingExcel ? 'กำลังสร้าง...' : 'Excel'}</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalComps}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600">🥇 เหรียญทอง</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.gold}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600">🥈 เหรียญเงิน</p>
            <p className="text-2xl font-bold text-gray-600">{stats.silver}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600">🥉 เหรียญทองแดง</p>
            <p className="text-2xl font-bold text-orange-600">{stats.bronze}</p>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-colors ${
                activeTab === 'group'
                  ? 'text-white bg-green-600'
                  : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
              }`}
            >
              ระดับกลุ่มโรงเรียน
            </button>
            <button
              onClick={() => setActiveTab('district')}
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

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหากิจกรรม..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Flat numbered list */}
        {flatList.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีประกาศผลการแข่งขัน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flatList.map((item, idx) => (
              <div
                key={`${item.compId}-${idx}`}
                className={`rounded-lg border p-4 ${getMedalBgColor(item.medal)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* ลำดับ */}
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-white border border-gray-300 text-gray-700 font-bold rounded-full text-sm">
                      {idx + 1}
                    </span>
                    {/* ชื่อกิจกรรม + เหรียญ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-medium text-gray-900">
                          {item.compName}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getMedalBadgeColor(item.medal)}`}>
                          {getMedalEmoji(item.medal)} {getMedalText(item.medal)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>หมวด: {item.category}</span>
                        {item.score !== null && item.score !== undefined && (
                          <span>คะแนน: <strong className="text-gray-700">{parseFloat(item.score).toFixed(2)}</strong></span>
                        )}
                        {item.rank && (
                          <span>อันดับที่: <strong className="text-gray-700">{item.rank}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolResults;
