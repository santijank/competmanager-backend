import { useState, useEffect, useMemo } from 'react';
import { Trophy, Search, ChevronDown, ChevronRight, Download, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const medalLabel = { gold: 'เหรียญทอง', silver: 'เหรียญเงิน', bronze: 'เหรียญทองแดง', participant: 'เข้าร่วม' };
const medalColor = {
  gold:        'bg-yellow-100 text-yellow-800 border border-yellow-300',
  silver:      'bg-gray-100 text-gray-700 border border-gray-300',
  bronze:      'bg-orange-100 text-orange-800 border border-orange-300',
  participant: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function ArchiveResults() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'district_admin';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('medals');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterMedal, setFilterMedal] = useState('');
  const [filterGroupTab, setFilterGroupTab] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [expandedComps, setExpandedComps] = useState(new Set());

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/scores/archive-export');
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'results-2568.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด results-2568.json เรียบร้อยแล้ว');
    } catch {
      toast.error('ไม่สามารถ export ได้');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetch('/archive/results-2568.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    const all = [...(data.district_results || []), ...(data.group_results || [])];
    return [...new Set(all.map(c => c.category))].filter(Boolean).sort();
  }, [data]);

  const schoolGroups = useMemo(() => {
    if (!data) return [];
    return [...new Set((data.district_results || []).map(c => c.school_group))].filter(Boolean).sort();
  }, [data]);

  const groupSchoolGroups = useMemo(() => {
    if (!data) return [];
    return [...new Set((data.group_results || []).map(c => c.school_group))].filter(Boolean).sort();
  }, [data]);

  const filteredGroup = useMemo(() => {
    if (!data) return [];
    return (data.group_results || []).filter(comp => {
      if (filterGroupTab && comp.school_group !== filterGroupTab) return false;
      if (searchGroup) {
        const q = searchGroup.toLowerCase();
        if (!comp.name.toLowerCase().includes(q) && !(comp.category || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, filterGroupTab, searchGroup]);

  const filteredDistrict = useMemo(() => {
    if (!data) return [];
    return (data.district_results || []).filter(comp => {
      if (filterCategory && comp.category !== filterCategory) return false;
      if (filterGroup && comp.school_group !== filterGroup) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!comp.name.toLowerCase().includes(q) && !comp.category.toLowerCase().includes(q)) return false;
      }
      if (filterMedal) {
        if (!comp.teams.some(t => t.medal === filterMedal)) return false;
      }
      return true;
    });
  }, [data, filterCategory, filterGroup, search, filterMedal]);

  const toggleComp = (id) => setExpandedComps(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">กำลังโหลดข้อมูล...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-red-400">ไม่พบข้อมูล archive</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <h1 className="text-2xl font-bold">ผลการแข่งขันศิลปหัตถกรรมนักเรียน</h1>
            </div>
            {isAdmin && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {exporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export JSON
              </button>
            )}
          </div>
          <p className="text-blue-200 text-lg">ปีการศึกษา 2568 — ระดับเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</p>
          <div className="flex gap-6 mt-4 text-sm text-blue-100">
            <span>กิจกรรมระดับเขต: <strong className="text-white">{data.stats?.total_district_competitions}</strong> รายการ</span>
            <span>กิจกรรมระดับกลุ่ม: <strong className="text-white">{data.stats?.total_group_competitions}</strong> รายการ</span>
            <span>ผลคะแนนทั้งหมด: <strong className="text-white">{data.stats?.total_scores?.toLocaleString()}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { key: 'medals', label: '🏅 ตารางเหรียญ' },
            { key: 'district', label: '🏆 ผลระดับเขต' },
            { key: 'group', label: '🏫 ผลระดับกลุ่ม' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ตารางเหรียญ */}
        {activeTab === 'medals' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">ตารางเหรียญระดับเขต แยกตามกลุ่มโรงเรียน</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-center">
                  <th className="text-left px-5 py-3 text-gray-600 font-semibold w-8">#</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-semibold">กลุ่มโรงเรียน</th>
                  <th className="py-3 text-yellow-600 font-semibold">🥇 ทอง</th>
                  <th className="py-3 text-gray-500 font-semibold">🥈 เงิน</th>
                  <th className="py-3 text-orange-600 font-semibold">🥉 ทองแดง</th>
                  <th className="py-3 text-blue-500 font-semibold">🎖️ เข้าร่วม</th>
                  <th className="py-3 text-gray-600 font-semibold">รวม</th>
                </tr>
              </thead>
              <tbody>
                {(data.medals_by_group || []).map((g, idx) => {
                  const total = (+g.gold || 0) + (+g.silver || 0) + (+g.bronze || 0) + (+g.participant || 0);
                  return (
                    <tr key={g.group_name} className={`border-b ${idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{g.group_name}</td>
                      <td className="py-3 text-center"><span className={`px-3 py-0.5 rounded-full font-bold ${medalColor.gold}`}>{g.gold || 0}</span></td>
                      <td className="py-3 text-center"><span className={`px-3 py-0.5 rounded-full font-bold ${medalColor.silver}`}>{g.silver || 0}</span></td>
                      <td className="py-3 text-center"><span className={`px-3 py-0.5 rounded-full font-bold ${medalColor.bronze}`}>{g.bronze || 0}</span></td>
                      <td className="py-3 text-center"><span className={`px-3 py-0.5 rounded-full font-bold ${medalColor.participant}`}>{g.participant || 0}</span></td>
                      <td className="py-3 text-center font-semibold text-gray-700">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ผลระดับเขต */}
        {activeTab === 'district' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="ค้นหากิจกรรม..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">ทุกกลุ่มสาระ</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterMedal} onChange={e => setFilterMedal(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">ทุกเหรียญ</option>
                <option value="gold">เหรียญทอง</option>
                <option value="silver">เหรียญเงิน</option>
                <option value="bronze">เหรียญทองแดง</option>
                <option value="participant">เข้าร่วม</option>
              </select>
              <span className="self-center text-sm text-gray-500">{filteredDistrict.length} กิจกรรม</span>
            </div>

            <div className="space-y-2">
              {filteredDistrict.map(comp => {
                const isOpen = expandedComps.has(comp.id);
                const teams = filterMedal ? comp.teams.filter(t => t.medal === filterMedal) : comp.teams;
                return (
                  <div key={comp.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <button
                      onClick={() => toggleComp(comp.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 text-left"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{comp.name}</p>
                        <p className="text-xs text-gray-400">{comp.category}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {comp.gold > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.gold}`}>ทอง {comp.gold}</span>}
                        {comp.silver > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.silver}`}>เงิน {comp.silver}</span>}
                        {comp.bronze > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.bronze}`}>ทองแดง {comp.bronze}</span>}
                        {comp.participant > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.participant}`}>เข้าร่วม {comp.participant}</span>}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500">
                              <th className="text-left px-5 py-2">อันดับ</th>
                              <th className="text-left px-5 py-2">เหรียญ</th>
                              <th className="text-left px-5 py-2">โรงเรียน</th>
                              <th className="text-left px-5 py-2">ชื่อ-สกุล</th>
                              <th className="text-left px-5 py-2">ครูผู้ฝึกสอน</th>
                              <th className="text-center px-5 py-2">คะแนน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teams.map((team, i) => (
                              <tr key={i} className="border-t hover:bg-gray-50">
                                <td className="px-5 py-2.5 text-gray-500 font-medium">{team.rank || '-'}</td>
                                <td className="px-5 py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor[team.medal] || ''}`}>
                                    {medalLabel[team.medal] || team.medal}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-gray-700">{team.school_name}</td>
                                <td className="px-5 py-2.5 text-gray-700">
                                  {Array.isArray(team.student_names) ? team.student_names.join(', ') : team.student_names || '-'}
                                </td>
                                <td className="px-5 py-2.5 text-gray-500 text-xs">
                                  {Array.isArray(team.teacher_names) ? team.teacher_names.join(', ') : team.teacher_names || '-'}
                                </td>
                                <td className="px-5 py-2.5 text-center font-semibold text-gray-700">{team.score}</td>
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
          </>
        )}
        {/* ผลระดับกลุ่ม */}
        {activeTab === 'group' && (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="ค้นหากิจกรรม..."
                  value={searchGroup} onChange={e => setSearchGroup(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <select value={filterGroupTab} onChange={e => setFilterGroupTab(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">ทุกกลุ่มโรงเรียน</option>
                {groupSchoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="self-center text-sm text-gray-500">{filteredGroup.length} กิจกรรม</span>
            </div>

            <div className="space-y-2">
              {filteredGroup.map(comp => {
                const isOpen = expandedComps.has('g-' + comp.id);
                return (
                  <div key={comp.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <button
                      onClick={() => toggleComp('g-' + comp.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 text-left"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{comp.name}</p>
                        <p className="text-xs text-gray-400">{comp.school_group} · {comp.category}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {comp.gold > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.gold}`}>ทอง {comp.gold}</span>}
                        {comp.silver > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.silver}`}>เงิน {comp.silver}</span>}
                        {comp.bronze > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.bronze}`}>ทองแดง {comp.bronze}</span>}
                        {comp.participant > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor.participant}`}>เข้าร่วม {comp.participant}</span>}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500">
                              <th className="text-left px-5 py-2">อันดับ</th>
                              <th className="text-left px-5 py-2">เหรียญ</th>
                              <th className="text-left px-5 py-2">โรงเรียน</th>
                              <th className="text-left px-5 py-2">ชื่อ-สกุล</th>
                              <th className="text-left px-5 py-2">ครูผู้ฝึกสอน</th>
                              <th className="text-center px-5 py-2">คะแนน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(comp.teams || []).map((team, i) => (
                              <tr key={i} className="border-t hover:bg-gray-50">
                                <td className="px-5 py-2.5 text-gray-500 font-medium">{team.rank || '-'}</td>
                                <td className="px-5 py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${medalColor[team.medal] || ''}`}>
                                    {medalLabel[team.medal] || team.medal}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-gray-700">{team.school_name}</td>
                                <td className="px-5 py-2.5 text-gray-700">
                                  {Array.isArray(team.student_names) ? team.student_names.join(', ') : team.student_names || '-'}
                                </td>
                                <td className="px-5 py-2.5 text-gray-500 text-xs">
                                  {Array.isArray(team.teacher_names) ? team.teacher_names.join(', ') : team.teacher_names || '-'}
                                </td>
                                <td className="px-5 py-2.5 text-center font-semibold text-gray-700">{team.score}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
