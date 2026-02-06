import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  Trophy,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Filter,
  Building2,
  Users,
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';

/**
 * 🎯 Score Management - แยกตามระดับกลุ่ม/เขต
 *
 * สำหรับ Admin ใหญ่: แสดงทั้งระดับกลุ่มและระดับเขต แยก Tab
 * สำหรับ Group Admin: แสดงเฉพาะระดับกลุ่มของตัวเอง
 */
const ScoreManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [publishingCompetition, setPublishingCompetition] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Tab สำหรับแยกระดับ (สำหรับ admin/district_admin)
  const [activeLevel, setActiveLevel] = useState('group'); // 'group' | 'district'
  const [selectedGroupId, setSelectedGroupId] = useState(''); // กรองกลุ่มโรงเรียน

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);

      const response = await api.get('/scores/competitions');
      let comps = Array.isArray(response.data) ? response.data : [];

      console.log('📊 Total competitions from API:', comps.length);

      // กรองเฉพาะการแข่งขันที่มีทีมอนุมัติแล้ว
      comps = comps.filter(comp => {
        const approvedCount = comp.registrations?.filter(r => r.status === 'approved').length || 0;
        return approvedCount > 0;
      });

      console.log('✅ Competitions with approved teams:', comps.length);

      // Filter สำหรับ group_admin - เห็นเฉพาะกลุ่มตัวเอง
      if (user?.role === 'group_admin' && user?.school_group_id) {
        comps = comps.filter(comp => {
          return comp.competition_level === 'group' &&
                 comp.school_group_id === user.school_group_id;
        });
        console.log('🔒 Group admin filtered:', comps.length, 'competitions');
      }

      const compsWithStats = comps.map(comp => ({
        ...comp,
        scoreStats: {
          total_registrations: comp.registration_count || 0,
          total_scored: comp.registrations?.filter(r => r.score?.score !== null).length || 0,
          total_unscored: (comp.registration_count || 0) - (comp.registrations?.filter(r => r.score?.score !== null).length || 0),
          finalized: comp.registrations?.filter(r => r.score?.is_finalized).length || 0
        }
      }));

      setCompetitions(compsWithStats);

      // ขยายหมวดหมู่แรกโดยอัตโนมัติ
      const grouped = groupByCategory(compsWithStats.filter(c => c.competition_level === activeLevel));
      if (grouped.length > 0) {
        setExpandedCategories(new Set([grouped[0].id]));
      }

    } catch (error) {
      console.error('❌ Error fetching competitions:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการแข่งขันได้');
    } finally {
      setLoading(false);
    }
  };

  // แยกการแข่งขันตามระดับ
  const groupCompetitions = competitions.filter(c => c.competition_level === 'group');
  const districtCompetitions = competitions.filter(c => c.competition_level === 'district');

  // ดึงรายชื่อกลุ่มโรงเรียนจาก competitions (สำหรับ admin/district_admin)
  const schoolGroups = (() => {
    const groups = {};
    groupCompetitions.forEach(c => {
      if (c.school_group?.id && c.school_group?.name) {
        groups[c.school_group.id] = c.school_group.name;
      }
    });
    return Object.entries(groups)
      .map(([id, name]) => ({ id: parseInt(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  })();

  // คำนวณ stats แยกตามระดับ
  const calculateLevelStats = (comps) => {
    const filtered = searchTerm
      ? comps.filter(c =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : comps;

    return {
      total: filtered.length,
      scored: filtered.filter(c => c.scoreStats?.total_scored > 0).length,
      unscored: filtered.filter(c => !c.scoreStats || c.scoreStats.total_scored === 0).length,
      finalized: filtered.filter(c => c.scoreStats?.finalized > 0).length
    };
  };

  const groupStats = calculateLevelStats(groupCompetitions);
  const districtStats = calculateLevelStats(districtCompetitions);

  const groupByCategory = (comps) => {
    const groups = {};

    comps.forEach(comp => {
      const categoryId = comp.category?.id || 'other';
      const categoryName = comp.category?.name || 'อื่นๆ';

      if (!groups[categoryId]) {
        groups[categoryId] = {
          id: categoryId,
          name: categoryName,
          competitions: [],
          stats: { total: 0, scored: 0, unscored: 0, finalized: 0 }
        };
      }

      groups[categoryId].competitions.push(comp);
      groups[categoryId].stats.total++;

      if (comp.scoreStats?.total_scored > 0) {
        groups[categoryId].stats.scored++;
      } else {
        groups[categoryId].stats.unscored++;
      }

      if (comp.scoreStats?.finalized > 0) {
        groups[categoryId].stats.finalized++;
      }
    });

    return Object.values(groups).sort((a, b) =>
      a.name.localeCompare(b.name, 'th')
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAll = (categories) => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getFilteredCompetitions = (categoryComps) => {
    let filtered = [...categoryComps];

    if (searchTerm) {
      filtered = filtered.filter(comp =>
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleEnterScore = (competitionId) => {
    navigate(`/scores/entry/${competitionId}`);
  };

  const handlePublish = (competitionId) => {
    setConfirmModal({
      isOpen: true,
      title: 'ประกาศผลการแข่งขัน',
      message: 'คุณต้องการประกาศผลการแข่งขันนี้หรือไม่?\n\nผลจะถูกเผยแพร่ให้บุคคลทั่วไปสามารถดูได้',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setPublishingCompetition(competitionId);
          await api.post(`/competitions/${competitionId}/publish`);
          toast.success('ประกาศผลสำเร็จ');
          fetchCompetitions();
        } catch (error) {
          console.error('Error publishing:', error);
          toast.error(error.response?.data?.message || 'ไม่สามารถประกาศผลได้');
        } finally {
          setPublishingCompetition(null);
        }
      },
    });
  };

  const handleUnpublish = (competitionId) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยกเลิกประกาศผล',
      message: 'คุณต้องการยกเลิกประกาศผลหรือไม่?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/competitions/${competitionId}/unpublish`);
          toast.success('ยกเลิกประกาศผลสำเร็จ');
          fetchCompetitions();
        } catch (error) {
          console.error('Error unpublishing:', error);
          toast.error('ไม่สามารถยกเลิกประกาศผลได้');
        }
      },
    });
  };

  const getLevelBadge = (competitionLevel) => {
    const badges = {
      group: { color: 'bg-blue-100 text-blue-800', text: 'ระดับกลุ่ม' },
      district: { color: 'bg-purple-100 text-purple-800', text: 'ระดับเขต' }
    };
    const badge = badges[competitionLevel] || badges.group;
    return (
      <span className={`px-2 py-1 ${badge.color} text-xs font-medium rounded-full`}>
        {badge.text}
      </span>
    );
  };

  const getProgress = (stats) => {
    if (!stats || !stats.total_registrations || stats.total_registrations === 0) return 0;
    return Math.round((stats.total_scored / stats.total_registrations) * 100);
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('ศิลป')) return '🎨';
    if (name.includes('วิทย')) return '🔬';
    if (name.includes('ภาษา')) return '📚';
    if (name.includes('คณิต')) return '🔢';
    if (name.includes('กีฬา')) return '⚽';
    if (name.includes('ดนตรี') || name.includes('นาฏ')) return '🎵';
    if (name.includes('คอมพิวเตอร์')) return '💻';
    if (name.includes('ภูมิ')) return '🗺️';
    if (name.includes('ประวัติ')) return '📜';
    return '📋';
  };

  // เปลี่ยน tab และ reset expanded categories
  const handleTabChange = (level) => {
    setActiveLevel(level);
    setSelectedGroupId(''); // reset กลุ่มที่เลือก
    const comps = level === 'group' ? groupCompetitions : districtCompetitions;
    const grouped = groupByCategory(comps);
    if (grouped.length > 0) {
      setExpandedCategories(new Set([grouped[0].id]));
    } else {
      setExpandedCategories(new Set());
    }
  };

  // Stats Card Component
  const StatsCard = ({ title, value, color, icon: Icon, bgColor }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );

  // Competition Card Component
  const CompetitionCard = ({ competition }) => {
    const progress = getProgress(competition.scoreStats || {});
    const stats = competition.scoreStats || {};

    return (
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="text-base font-medium text-gray-900">
                {competition.name}
              </h4>
              {getLevelBadge(competition.competition_level)}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>รหัส: {competition.code}</span>
              <span>ระดับชั้น: {competition.level}</span>
              {competition.school_group && (
                <span>กลุ่ม: {competition.school_group.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => handleEnterScore(competition.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>ใส่คะแนน</span>
            </button>

            {stats.total_scored > 0 && (
              <>
                {!competition.is_published ? (
                  <button
                    onClick={() => handlePublish(competition.id)}
                    disabled={publishingCompetition === competition.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <span>📢</span>
                    <span>{publishingCompetition === competition.id ? 'กำลังประกาศผล...' : 'ประกาศผล'}</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      <span>✅</span>
                      <span>ประกาศผลแล้ว</span>
                    </span>

                    <button
                      onClick={() => window.open(`/public-results/${competition.id}`, '_blank')}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <span>🔗</span>
                      <span>ดูผล</span>
                    </button>

                    <button
                      onClick={() => handleUnpublish(competition.id)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>ความคืบหน้า</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                activeLevel === 'district' ? 'bg-purple-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <p className="text-gray-600">ทีมทั้งหมด</p>
            <p className="font-semibold text-gray-900">{stats.total_registrations || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">ใส่แล้ว</p>
            <p className="font-semibold text-green-600">{stats.total_scored || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">ยังไม่ใส่</p>
            <p className="font-semibold text-orange-600">{stats.total_unscored || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">ยืนยันแล้ว</p>
            <p className="font-semibold text-purple-600">{stats.finalized || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // Category Section Component
  const CategorySection = ({ categories, levelColor }) => {
    if (categories.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">ไม่พบการแข่งขัน</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const filteredComps = getFilteredCompetitions(category.competitions);

          if (filteredComps.length === 0 && searchTerm) {
            return null;
          }

          const filteredStats = {
            total: filteredComps.length,
            scored: filteredComps.filter(c => c.scoreStats?.total_scored > 0).length,
            unscored: filteredComps.filter(c => !c.scoreStats || c.scoreStats.total_scored === 0).length,
            finalized: filteredComps.filter(c => c.scoreStats?.finalized > 0).length
          };

          return (
            <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filteredStats.total} รายการ ·
                      <span className="text-green-600 ml-1">
                        {filteredStats.scored} ใส่แล้ว
                      </span> ·
                      <span className="text-orange-600 ml-1">
                        {filteredStats.unscored} ยังไม่ใส่
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">ความคืบหน้า</p>
                    <p className={`text-lg font-semibold ${levelColor}`}>
                      {filteredStats.total > 0
                        ? Math.round((filteredStats.scored / filteredStats.total) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200">
                  {filteredComps.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      ไม่พบการแข่งขันที่ตรงกับการค้นหา
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredComps.map((competition) => (
                        <CompetitionCard key={competition.id} competition={competition} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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

  // สำหรับ group_admin แสดงเฉพาะระดับกลุ่ม
  const isGroupAdminOnly = user?.role === 'group_admin';
  const isAdmin = ['admin', 'district_admin'].includes(user?.role);

  // กรองตามกลุ่มโรงเรียนที่เลือก (สำหรับ admin ที่ดู tab ระดับกลุ่ม)
  const filteredGroupCompetitions = (isAdmin && selectedGroupId && activeLevel === 'group')
    ? groupCompetitions.filter(c => c.school_group_id === parseInt(selectedGroupId))
    : groupCompetitions;

  const currentCompetitions = activeLevel === 'group' ? filteredGroupCompetitions : districtCompetitions;
  const currentStats = calculateLevelStats(currentCompetitions);
  const currentCategories = groupByCategory(
    searchTerm
      ? currentCompetitions.filter(c =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : currentCompetitions
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              จัดการคะแนนการแข่งขัน
            </h1>
          </div>
          <p className="text-gray-600">
            {isGroupAdminOnly
              ? `ใส่คะแนนการแข่งขันระดับกลุ่มของคุณ (${groupCompetitions.length} รายการ)`
              : `ใส่คะแนนการแข่งขันทุกระดับ (${competitions.length} รายการ)`
            }
          </p>
        </div>

        {/* Tab Navigation - สำหรับ Admin/District Admin */}
        {!isGroupAdminOnly && (
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => handleTabChange('group')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeLevel === 'group'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>ระดับกลุ่ม</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeLevel === 'group'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {groupCompetitions.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('district')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeLevel === 'district'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>ระดับเขต</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeLevel === 'district'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {districtCompetitions.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Level Header Banner */}
        <div className={`rounded-xl p-4 mb-6 ${
          activeLevel === 'district'
            ? 'bg-gradient-to-r from-purple-500 to-purple-600'
            : 'bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-white">
              {activeLevel === 'district' ? (
                <Building2 className="w-8 h-8" />
              ) : (
                <Users className="w-8 h-8" />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {activeLevel === 'district' ? '🏆 การแข่งขันระดับเขต' : '🏫 การแข่งขันระดับกลุ่ม'}
                </h2>
                <p className="text-sm opacity-90">
                  {activeLevel === 'district'
                    ? 'การแข่งขันระดับสำนักงานเขตพื้นที่การศึกษา'
                    : selectedGroupId
                      ? `กลุ่ม: ${schoolGroups.find(g => g.id === parseInt(selectedGroupId))?.name || ''}`
                      : 'การแข่งขันระดับกลุ่มโรงเรียน'
                  }
                </p>
              </div>
            </div>
            <div className="text-right text-white">
              <p className="text-3xl font-bold">{currentStats.total}</p>
              <p className="text-sm opacity-90">รายการแข่งขัน</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="การแข่งขันทั้งหมด"
            value={currentStats.total}
            color="text-gray-900"
            icon={Trophy}
            bgColor={activeLevel === 'district' ? 'bg-purple-100' : 'bg-blue-100'}
          />
          <StatsCard
            title="ใส่คะแนนแล้ว"
            value={currentStats.scored}
            color="text-green-600"
            icon={CheckCircle}
            bgColor="bg-green-100"
          />
          <StatsCard
            title="ยังไม่ใส่คะแนน"
            value={currentStats.unscored}
            color="text-orange-600"
            icon={Clock}
            bgColor="bg-orange-100"
          />
          <StatsCard
            title="ยืนยันแล้ว"
            value={currentStats.finalized}
            color="text-purple-600"
            icon={TrendingUp}
            bgColor="bg-purple-100"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาการแข่งขัน..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* กรองกลุ่มโรงเรียน - เฉพาะ admin/district_admin ที่ดู tab ระดับกลุ่ม */}
            {isAdmin && activeLevel === 'group' && schoolGroups.length > 0 && (
              <div className="min-w-[220px]">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ทุกกลุ่มโรงเรียน</option>
                  {schoolGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => expandAll(currentCategories)}
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

          <div className="mt-3 text-sm text-gray-600">
            แสดง <strong>{currentCategories.length}</strong> หมวดหมู่ ·
            <strong className="ml-1">{currentStats.total}</strong> รายการ
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              activeLevel === 'district'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {activeLevel === 'district' ? '🏆 ระดับเขต' : '🏫 ระดับกลุ่ม'}
            </span>
          </div>
        </div>

        {/* Categories List */}
        <CategorySection
          categories={currentCategories}
          levelColor={activeLevel === 'district' ? 'text-purple-600' : 'text-blue-600'}
        />

        {/* Quick Stats Footer */}
        {!isGroupAdminOnly && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปภาพรวม</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border-2 ${
                activeLevel === 'group' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">ระดับกลุ่ม</h4>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">ทั้งหมด</p>
                    <p className="text-xl font-bold text-gray-900">{groupStats.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ใส่แล้ว</p>
                    <p className="text-xl font-bold text-green-600">{groupStats.scored}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ยังไม่ใส่</p>
                    <p className="text-xl font-bold text-orange-600">{groupStats.unscored}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ยืนยันแล้ว</p>
                    <p className="text-xl font-bold text-purple-600">{groupStats.finalized}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                activeLevel === 'district' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Building2 className="w-6 h-6 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">ระดับเขต</h4>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">ทั้งหมด</p>
                    <p className="text-xl font-bold text-gray-900">{districtStats.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ใส่แล้ว</p>
                    <p className="text-xl font-bold text-green-600">{districtStats.scored}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ยังไม่ใส่</p>
                    <p className="text-xl font-bold text-orange-600">{districtStats.unscored}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">ยืนยันแล้ว</p>
                    <p className="text-xl font-bold text-purple-600">{districtStats.finalized}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ScoreManagement;
