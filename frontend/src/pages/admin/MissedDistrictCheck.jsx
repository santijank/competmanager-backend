import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  School,
  Trophy,
  ChevronDown,
  ChevronRight,
  FileWarning,
  Info,
  ArrowUpRight,
  Loader2,
  Clock,
  XCircle,
  Star,
  GraduationCap,
} from 'lucide-react';
import api from '@/lib/api';

// ====== Tab Config ======
const TABS = [
  { id: 'missed', label: 'ตกหล่นระดับเขต', icon: FileWarning, color: 'orange' },
  { id: 'no_score', label: 'อนุมัติแต่ไม่ได้แข่ง', icon: XCircle, color: 'red' },
  { id: 'pending', label: 'ค้าง pending', icon: Clock, color: 'yellow' },
  { id: 'special', label: '(พิเศษเรียนรวม) สมัครกลุ่ม', icon: Star, color: 'purple' },
  { id: 'm13', label: 'ม.1-3 สมัครกลุ่ม', icon: GraduationCap, color: 'indigo' },
];

const MissedDistrictCheck = () => {
  const [activeTab, setActiveTab] = useState('missed');

  // ===== Tab 1: ตกหล่นระดับเขต (เดิม) =====
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [promotingIds, setPromotingIds] = useState(new Set());
  const [promotedIds, setPromotedIds] = useState(new Set());

  // ===== Tab 2,3,4 =====
  const [checkData, setCheckData] = useState({ no_score: null, pending: null, special: null, m13: null });
  const [checkLoading, setCheckLoading] = useState({ no_score: false, pending: false, special: false, m13: false });
  const [checkSearch, setCheckSearch] = useState('');

  // ===== Tab 1: fetch =====
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setPromotedIds(new Set());
      const response = await api.get('/registrations/check-missed-district');
      setData(response.data);
      if (response.data.missed?.length > 0) {
        const groups = new Set(response.data.missed.map(m => m.competition_name));
        setExpandedGroups(groups);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // ===== Tab 2: อนุมัติแต่ไม่ได้แข่ง =====
  const fetchNoScore = async () => {
    try {
      setCheckLoading(p => ({ ...p, no_score: true }));
      const res = await api.get('/registrations/check-approved-no-score?level=district');
      setCheckData(p => ({ ...p, no_score: res.data }));
    } catch (err) {
      toast.error('โหลดข้อมูลไม่ได้');
    } finally {
      setCheckLoading(p => ({ ...p, no_score: false }));
    }
  };

  // ===== Tab 3: ค้าง pending =====
  const fetchPending = async () => {
    try {
      setCheckLoading(p => ({ ...p, pending: true }));
      const res = await api.get('/registrations/check-pending?level=district');
      setCheckData(p => ({ ...p, pending: res.data }));
    } catch (err) {
      toast.error('โหลดข้อมูลไม่ได้');
    } finally {
      setCheckLoading(p => ({ ...p, pending: false }));
    }
  };

  // ===== Tab 4: พิเศษเรียนรวม =====
  const fetchSpecial = async () => {
    try {
      setCheckLoading(p => ({ ...p, special: true }));
      const res = await api.get('/registrations/check-special-in-group');
      setCheckData(p => ({ ...p, special: res.data }));
    } catch (err) {
      toast.error('โหลดข้อมูลไม่ได้');
    } finally {
      setCheckLoading(p => ({ ...p, special: false }));
    }
  };

  // ===== Tab 5: ม.1-3 สมัครกลุ่ม =====
  const fetchM13 = async () => {
    try {
      setCheckLoading(p => ({ ...p, m13: true }));
      const res = await api.get('/registrations/check-m13-in-group');
      setCheckData(p => ({ ...p, m13: res.data }));
    } catch (err) {
      toast.error('โหลดข้อมูลไม่ได้');
    } finally {
      setCheckLoading(p => ({ ...p, m13: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'no_score' && !checkData.no_score) fetchNoScore();
    if (activeTab === 'pending' && !checkData.pending) fetchPending();
    if (activeTab === 'special' && !checkData.special) fetchSpecial();
    if (activeTab === 'm13' && !checkData.m13) fetchM13();
  }, [activeTab]);

  const handleRefresh = () => {
    setCheckSearch('');
    if (activeTab === 'missed') fetchData();
    else if (activeTab === 'no_score') fetchNoScore();
    else if (activeTab === 'pending') fetchPending();
    else if (activeTab === 'special') fetchSpecial();
    else if (activeTab === 'm13') fetchM13();
  };

  // ===== Tab 1 promote =====
  const handlePromote = async (item) => {
    const key = `${item.group_registration_id}-${item.district_competition_id}`;
    try {
      setPromotingIds(prev => new Set([...prev, key]));
      const response = await api.post('/registrations/promote-to-district', {
        group_registration_id: item.group_registration_id,
        district_competition_id: item.district_competition_id,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setPromotedIds(prev => new Set([...prev, key]));
      } else {
        toast.error(response.data.message || 'ไม่สามารถส่งเข้าระดับเขตได้');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPromotingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const handlePromoteAll = async (items) => {
    const toPromote = items.filter(item => {
      const key = `${item.group_registration_id}-${item.district_competition_id}`;
      return !promotedIds.has(key);
    });
    if (toPromote.length === 0) { toast.info('ส่งเข้าระดับเขตหมดแล้ว'); return; }
    for (const item of toPromote) await handlePromote(item);
  };

  // ===== Tab 1 filter =====
  const filteredMissed = useMemo(() => {
    if (!data?.missed) return [];
    if (!search.trim()) return data.missed;
    const q = search.toLowerCase();
    return data.missed.filter(m =>
      m.school_name.toLowerCase().includes(q) ||
      m.competition_name.toLowerCase().includes(q) ||
      m.category_name?.toLowerCase().includes(q)
    );
  }, [data?.missed, search]);

  const groupedMissed = useMemo(() => {
    const groups = {};
    filteredMissed.forEach(m => {
      const key = m.competition_name;
      if (!groups[key]) groups[key] = { competition_name: m.competition_name, competition_code: m.competition_code, category_name: m.category_name, items: [] };
      groups[key].items.push(m);
    });
    return Object.values(groups);
  }, [filteredMissed]);

  const toggleGroup = (name) => setExpandedGroups(prev => {
    const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n;
  });

  const getName = (person) => (!person ? '-' : typeof person === 'string' ? person : person?.name || '-');

  const statusLabel = (status) => {
    const map = {
      approved: { text: 'อนุมัติ', color: 'bg-green-100 text-green-700' },
      pending: { text: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
      rejected: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.text}</span>;
  };

  // ===== Generic list for Tab 2,3,4 =====
  const filteredCheckData = (tabKey) => {
    const items = checkData[tabKey]?.data || [];
    if (!checkSearch.trim()) return items;
    const q = checkSearch.toLowerCase();
    return items.filter(m =>
      m.school_name?.toLowerCase().includes(q) ||
      m.competition_name?.toLowerCase().includes(q) ||
      m.category_name?.toLowerCase().includes(q)
    );
  };

  const groupByCompetition = (items) => {
    const groups = {};
    items.forEach(m => {
      const key = m.competition_name;
      if (!groups[key]) groups[key] = { competition_name: m.competition_name, competition_code: m.competition_code, category_name: m.category_name, items: [] };
      groups[key].items.push(m);
    });
    return Object.values(groups);
  };

  // ===== RENDER =====
  const summary = data?.summary || {};
  const isCurrentLoading = activeTab === 'missed' ? loading : checkLoading[activeTab];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileWarning className="w-7 h-7 text-orange-500" />
              ตรวจสอบทีมที่ตกหล่น
            </h1>
            <p className="text-gray-600 mt-1">ตรวจสอบปัญหาต่างๆ ของการลงทะเบียนแข่งขัน</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isCurrentLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isCurrentLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'missed'
              ? (data?.missed?.length || 0)
              : (checkData[tab.id]?.total || 0);
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCheckSearch(''); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? `text-${tab.color}-600 border-${tab.color}-600 bg-${tab.color}-50`
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== Tab 1: ตกหล่นระดับเขต ==================== */}
      {activeTab === 'missed' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">กำลังตรวจสอบข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
              <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">ลองอีกครั้ง</button>
            </div>
          ) : (
            <>
              {/* สรุป */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Trophy} color="blue" value={summary.total_skip_competitions || 0} label="กิจกรรม skip" />
                <StatCard icon={Users} color="purple" value={summary.total_group_registrations || 0} label="ลงทะเบียนกลุ่ม" />
                <StatCard icon={CheckCircle} color="green" value={summary.total_already_registered || 0} label="สมัครเขตแล้ว" />
                <StatCard icon={AlertTriangle} color={(summary.total_missed || 0) > 0 ? 'red' : 'green'} value={summary.total_missed || 0} label="ตกหล่น" />
              </div>

              {(!data?.missed || data.missed.length === 0) ? (
                <SuccessBox message="ไม่พบทีมที่ตกหล่น" detail="ทุกโรงเรียนที่สมัครระดับกลุ่มได้สมัครตรงระดับเขตเรียบร้อยแล้ว" />
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold">รายการด้านล่างคือโรงเรียนที่สมัครกิจกรรมระดับกลุ่มแล้ว แต่ยังไม่ได้สมัครตรงระดับเขต</p>
                      <p className="mt-1">กดปุ่ม <strong>"ส่งเข้าระดับเขต"</strong> เพื่อสร้างลงทะเบียนเขตให้อัตโนมัติ</p>
                    </div>
                  </div>

                  <SearchBar value={search} onChange={setSearch} />

                  <div className="space-y-3">
                    {groupedMissed.map(group => {
                      const isExpanded = expandedGroups.has(group.competition_name);
                      const unpromotedCount = group.items.filter(item => !promotedIds.has(`${item.group_registration_id}-${item.district_competition_id}`)).length;
                      return (
                        <div key={group.competition_name} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <button onClick={() => toggleGroup(group.competition_name)} className="flex items-center gap-3 flex-1 text-left">
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                              <div>
                                <div className="font-bold text-gray-900">{group.competition_name}</div>
                                <div className="text-sm text-gray-500">
                                  {group.category_name && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs mr-2">{group.category_name}</span>}
                                  {group.competition_code && <span className="text-gray-400">รหัส: {group.competition_code}</span>}
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              {unpromotedCount > 0 && (
                                <button onClick={() => handlePromoteAll(group.items)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
                                  <ArrowUpRight className="w-3.5 h-3.5" /> ส่งทั้งหมด ({unpromotedCount})
                                </button>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${unpromotedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {unpromotedCount > 0 ? `${group.items.length} ทีม` : 'เสร็จแล้ว'}
                              </span>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-gray-100 divide-y divide-gray-100">
                              {group.items.map((item, idx) => {
                                const key = `${item.group_registration_id}-${item.district_competition_id}`;
                                const isPromoting = promotingIds.has(key);
                                const isPromoted = promotedIds.has(key);
                                return (
                                  <div key={idx} className={`p-4 ${isPromoted ? 'bg-green-50/50' : 'hover:bg-orange-50/50'}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <School className="w-4 h-4 text-gray-400" />
                                          <span className="font-bold text-gray-900">{item.school_name}</span>
                                          {statusLabel(item.group_status)}
                                        </div>
                                        {item.student_names?.length > 0 && (
                                          <div className="ml-6 mt-1 flex flex-wrap gap-1">
                                            {item.student_names.map((s, i) => (
                                              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{getName(s)}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4 flex-shrink-0">
                                        {isPromoted ? (
                                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                                            <CheckCircle className="w-3.5 h-3.5" /> ส่งเข้าเขตแล้ว
                                          </span>
                                        ) : (
                                          <button onClick={() => handlePromote(item)} disabled={isPromoting}
                                            className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">
                                            {isPromoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                            ส่งเข้าระดับเขต
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ==================== Tab 2: อนุมัติแต่ไม่ได้แข่ง ==================== */}
      {activeTab === 'no_score' && (
        <GenericCheckTab
          loading={checkLoading.no_score}
          data={checkData.no_score}
          filtered={filteredCheckData('no_score')}
          grouped={groupByCompetition(filteredCheckData('no_score'))}
          search={checkSearch}
          setSearch={setCheckSearch}
          emptyMessage="ทุกทีมที่อนุมัติแล้วมีคะแนนครบ"
          warningMessage="ทีมด้านล่างได้รับอนุมัติแล้ว แต่ยังไม่มีคะแนนในระบบ (อาจไม่ได้เข้าแข่งขัน)"
          color="red"
          getName={getName}
        />
      )}

      {/* ==================== Tab 3: ค้าง pending ==================== */}
      {activeTab === 'pending' && (
        <GenericCheckTab
          loading={checkLoading.pending}
          data={checkData.pending}
          filtered={filteredCheckData('pending')}
          grouped={groupByCompetition(filteredCheckData('pending'))}
          search={checkSearch}
          setSearch={setCheckSearch}
          emptyMessage="ไม่มีทีมที่ค้าง pending"
          warningMessage="ทีมด้านล่างสมัครแล้วแต่ยังไม่ได้รับการอนุมัติ (สถานะ pending)"
          color="yellow"
          getName={getName}
        />
      )}

      {/* ==================== Tab 4: พิเศษเรียนรวม ==================== */}
      {activeTab === 'special' && (
        <GenericCheckTab
          loading={checkLoading.special}
          data={checkData.special}
          filtered={filteredCheckData('special')}
          grouped={groupByCompetition(filteredCheckData('special'))}
          search={checkSearch}
          setSearch={setCheckSearch}
          emptyMessage="ไม่พบทีม (พิเศษเรียนรวม) ที่สมัครระดับกลุ่ม"
          warningMessage="ทีมด้านล่างเป็นกิจกรรม (พิเศษเรียนรวม) ที่ไปสมัครระดับกลุ่ม ซึ่งควรสมัครตรงระดับเขตแทน"
          color="purple"
          getName={getName}
          showStatus
        />
      )}

      {/* ==================== Tab 5: ม.1-3 สมัครกลุ่ม ==================== */}
      {activeTab === 'm13' && (
        <GenericCheckTab
          loading={checkLoading.m13}
          data={checkData.m13}
          filtered={filteredCheckData('m13')}
          grouped={groupByCompetition(filteredCheckData('m13'))}
          search={checkSearch}
          setSearch={setCheckSearch}
          emptyMessage="ไม่พบกิจกรรม ม.1-3 ที่สมัครระดับกลุ่ม"
          warningMessage="ทีมด้านล่างเป็นกิจกรรมระดับ ม.1-3 ที่ไปสมัครระดับกลุ่ม ซึ่งควรสมัครตรงระดับเขตแทน"
          color="indigo"
          getName={getName}
          showStatus
        />
      )}
    </div>
  );
};

// ===== Shared Components =====

const StatCard = ({ icon: Icon, color, value, label }) => (
  <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4 text-center`}>
    <Icon className={`w-6 h-6 text-${color}-600 mx-auto mb-1`} />
    <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
    <div className={`text-sm text-${color}-600`}>{label}</div>
  </div>
);

const SuccessBox = ({ message, detail }) => (
  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
    <h3 className="text-lg font-bold text-green-800">{message}</h3>
    {detail && <p className="text-green-600 mt-1">{detail}</p>}
  </div>
);

const SearchBar = ({ value, onChange }) => (
  <div className="flex-1 relative mb-4">
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="ค้นหาชื่อโรงเรียน, กิจกรรม, หมวดหมู่..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

const GenericCheckTab = ({ loading, data, filtered, grouped, search, setSearch, emptyMessage, warningMessage, color, getName, showStatus }) => {
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    if (grouped.length > 0) {
      setExpanded(new Set(grouped.map(g => g.competition_name)));
    }
  }, [grouped.length]);

  const toggle = (name) => setExpanded(prev => {
    const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-600">กำลังตรวจสอบข้อมูล...</span>
      </div>
    );
  }

  if (!data) return null;

  const total = data.total || 0;

  return (
    <>
      {/* สรุป */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold ${
          total > 0 ? `bg-${color}-50 text-${color}-700 border border-${color}-200` : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {total > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          พบ {total} รายการ
        </div>
      </div>

      {total === 0 ? (
        <SuccessBox message={emptyMessage} />
      ) : (
        <>
          <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4 mb-4 flex items-start gap-3`}>
            <Info className={`w-5 h-5 text-${color}-600 mt-0.5 flex-shrink-0`} />
            <p className={`text-sm text-${color}-800 font-medium`}>{warningMessage}</p>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          {search && (
            <p className="text-sm text-gray-500 mb-3">พบ {filtered.length} รายการ จาก {total} รายการทั้งหมด</p>
          )}

          <div className="space-y-3">
            {grouped.map(group => {
              const isExpanded = expanded.has(group.competition_name);
              return (
                <div key={group.competition_name} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => toggle(group.competition_name)} className="flex items-center justify-between p-4 w-full hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      <div>
                        <div className="font-bold text-gray-900">{group.competition_name}</div>
                        <div className="text-sm text-gray-500">
                          {group.category_name && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs mr-2">{group.category_name}</span>}
                          {group.competition_code && <span className="text-gray-400">รหัส: {group.competition_code}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold bg-${color}-100 text-${color}-700`}>
                      {group.items.length} ทีม
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-center gap-2 mb-1">
                            <School className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-gray-900">{item.school_name}</span>
                            {showStatus && item.status && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                              }`}>{item.status === 'approved' ? 'อนุมัติ' : item.status === 'pending' ? 'รออนุมัติ' : item.status}</span>
                            )}
                          </div>
                          {item.team_name && <p className="text-sm text-gray-600 ml-6">ชื่อทีม: {item.team_name}</p>}
                          {item.student_names?.length > 0 && (
                            <div className="ml-6 mt-1 flex flex-wrap gap-1">
                              {item.student_names.map((s, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{getName(s)}</span>
                              ))}
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
        </>
      )}
    </>
  );
};

export default MissedDistrictCheck;
