import { useState, useEffect } from 'react';
import { 
  Trophy, 
  ChevronDown, 
  ChevronRight, 
  Award,
  Calendar,
  TrendingUp,
  Search,
  X,
  Users,
  ChevronUp
} from 'lucide-react';
import api from '@/lib/api';

/**
 * 🏆 หน้าประกาศผลสาธารณะ - แยกตามกลุ่มโรงเรียน
 */
export default function PublicResults() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCompetitions: 0,
    totalGroups: 0,
    totalMedals: { gold: 0, silver: 0, bronze: 0 }
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/results');
      
      // จัดกลุ่มตามโรงเรียน
      const grouped = groupBySchoolGroup(response.data);
      setGroups(grouped);
      
      // คำนวณสถิติ
      calculateStats(response.data);
      
      // ขยายกลุ่มแรกโดยอัตโนมัติ
      if (grouped.length > 0) {
        setExpandedGroups(new Set([grouped[0].id]));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBySchoolGroup = (competitions) => {
    const groupMap = {};
    
    competitions.forEach(comp => {
      // หากลุ่มจากการแข่งขันหรือจากโรงเรียนของผู้เข้าแข่งขัน
      const groupId = comp.school_group_id || 'district';
      const groupName = comp.school_group?.name || 'ระดับเขต';
      
      if (!groupMap[groupId]) {
        groupMap[groupId] = {
          id: groupId,
          name: groupName,
          competitions: [],
          medals: { gold: 0, silver: 0, bronze: 0 }
        };
      }
      
      groupMap[groupId].competitions.push(comp);
      
      // นับเหรียญ
      comp.registrations?.forEach(reg => {
        if (reg.score?.medal === 'gold') groupMap[groupId].medals.gold++;
        else if (reg.score?.medal === 'silver') groupMap[groupId].medals.silver++;
        else if (reg.score?.medal === 'bronze') groupMap[groupId].medals.bronze++;
      });
    });
    
    // เรียงตามชื่อกลุ่ม
    return Object.values(groupMap).sort((a, b) => {
      if (a.id === 'district') return 1;
      if (b.id === 'district') return -1;
      return a.name.localeCompare(b.name, 'th');
    });
  };

  const calculateStats = (competitions) => {
    let totalGold = 0, totalSilver = 0, totalBronze = 0;
    
    competitions.forEach(comp => {
      comp.registrations?.forEach(reg => {
        if (reg.score?.medal === 'gold') totalGold++;
        else if (reg.score?.medal === 'silver') totalSilver++;
        else if (reg.score?.medal === 'bronze') totalBronze++;
      });
    });
    
    setStats({
      totalCompetitions: competitions.length,
      totalGroups: new Set(competitions.map(c => c.school_group_id || 'district')).size,
      totalMedals: { gold: totalGold, silver: totalSilver, bronze: totalBronze }
    });
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getMedalIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-600';
      case 3: return 'text-orange-600';
      default: return 'text-gray-900';
    }
  };

  // Filter ตาม search
  const filteredGroups = groups.map(group => ({
    ...group,
    competitions: group.competitions.filter(comp => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchComp = comp.name.toLowerCase().includes(query);
      const matchSchool = comp.registrations?.some(reg => 
        reg.school?.name?.toLowerCase().includes(query)
      );
      return matchComp || matchSchool;
    })
  })).filter(group => group.competitions.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดผลการแข่งขัน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-t-4 border-blue-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-10 h-10 text-yellow-500" />
                <h1 className="text-4xl font-bold text-gray-900">
                  ผลการแข่งขัน
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalCompetitions}
              </div>
              <div className="text-sm text-gray-600">รายการแข่งขัน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalGroups}
              </div>
              <div className="text-sm text-gray-600">กลุ่มโรงเรียน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.totalMedals.gold}
              </div>
              <div className="text-sm text-gray-600">🥇 ทอง</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {stats.totalMedals.silver}
              </div>
              <div className="text-sm text-gray-600">🥈 เงิน</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalMedals.bronze}
              </div>
              <div className="text-sm text-gray-600">🥉 ทองแดง</div>
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารายการแข่งขัน หรือ โรงเรียน..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Expand/Collapse Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={expandAll}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                <span>ขยายทั้งหมด</span>
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
                <span>ยุบทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">
              {searchQuery ? 'ไม่พบผลการค้นหา' : 'ยังไม่มีการประกาศผล'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              
              return (
                <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-gray-500 flex-shrink-0" />
                      )}
                      <Users className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div className="text-left">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {group.name}
                        </h2>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                          <span>{group.competitions.length} รายการ</span>
                          {group.medals.gold > 0 && (
                            <span className="flex items-center space-x-1">
                              <span>🥇</span>
                              <span className="font-semibold text-yellow-600">{group.medals.gold}</span>
                            </span>
                          )}
                          {group.medals.silver > 0 && (
                            <span className="flex items-center space-x-1">
                              <span>🥈</span>
                              <span className="font-semibold text-gray-600">{group.medals.silver}</span>
                            </span>
                          )}
                          {group.medals.bronze > 0 && (
                            <span className="flex items-center space-x-1">
                              <span>🥉</span>
                              <span className="font-semibold text-orange-600">{group.medals.bronze}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Award className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  </button>

                  {/* Competitions List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {group.competitions.map(comp => {
                        const sortedRegistrations = [...(comp.registrations || [])]
                          .filter(r => r.status === 'approved' && r.score?.rank)
                          .sort((a, b) => (a.score?.rank || 999) - (b.score?.rank || 999));

                        return (
                          <div key={comp.id} className="p-6 border-b border-gray-200 last:border-b-0">
                            
                            {/* Competition Header */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {comp.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  comp.competition_level === 'group' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {comp.competition_level === 'group' ? '🏫 ระดับกลุ่ม' : '🏆 ระดับเขต'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Award className="w-4 h-4" />
                                  <span>{comp.category?.name || 'ทั่วไป'}</span>
                                </div>
                                {comp.published_at && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {new Date(comp.published_at).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Results Table */}
                            {sortedRegistrations.length > 0 ? (
                              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <table className="w-full">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">
                                        อันดับ
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        โรงเรียน
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        ผู้เข้าแข่งขัน
                                      </th>
                                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">
                                        คะแนน
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {sortedRegistrations.map((reg) => {
                                      const rank = reg.score?.rank || 0;
                                      const score = parseFloat(reg.score?.score) || 0;
                                      
                                      return (
                                        <tr key={reg.id} className={`
                                          ${rank <= 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                                          transition-colors
                                        `}>
                                          <td className="px-4 py-4">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-2xl">{getMedalIcon(rank)}</span>
                                              <span className="font-bold text-gray-900">{rank}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-4">
                                            <span className="font-medium text-gray-900">
                                              {reg.school?.name || 'ไม่ระบุ'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-4 text-gray-700">
                                            {reg.team_name || '-'}
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                            <span className={`text-lg font-bold ${getMedalColor(rank)}`}>
                                              {score.toFixed(2)}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                                ไม่มีข้อมูลผู้เข้าแข่งขัน
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

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1</p>
        </div>
      </div>
    </div>
  );
}
