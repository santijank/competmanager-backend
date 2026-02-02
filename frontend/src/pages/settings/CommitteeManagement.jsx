import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Layers
} from 'lucide-react';
import api from '@/lib/api';
import CommitteeMemberModal from '@/components/committee/CommitteeMemberModal';
import useAuthStore from '@/stores/authStore';

const CommitteeManagement = () => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeLevel, setActiveLevel] = useState('group'); // 'group' หรือ 'district'
  const [expandedCategories, setExpandedCategories] = useState({}); // สำหรับ accordion
  const [filters, setFilters] = useState({
    member_type: '',
    is_active: '',
    competition_id: '',
    search: '',
    level: 'group',
  });

  // Group admin เห็นเฉพาะ tab ระดับกลุ่ม
  const canSeeDistrictLevel = user?.role === 'district_admin' || user?.role === 'admin';

  useEffect(() => {
    loadData();
    loadCompetitions();
  }, [filters]);

  useEffect(() => {
    // อัพเดต filter เมื่อเปลี่ยน tab
    setFilters(prev => ({ ...prev, level: activeLevel }));
  }, [activeLevel]);

  const loadCompetitions = async () => {
    try {
      // ใช้ endpoint ใหม่ที่ไม่มี role-based filtering
      const response = await api.get('/committee-members/competitions');
      const comps = response.data.data || [];

      const grouped = {};
      comps.forEach(comp => {
        const categoryName = comp.category?.name || 'อื่นๆ';
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(comp);
      });

      setCompetitions(grouped);
    } catch (error) {
      console.error('Load competitions error:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [membersRes, statsRes] = await Promise.all([
        api.get('/committee-members', {
          params: { ...filters, paginate: false }
        }),
        api.get('/committee-members/statistics', {
          params: { level: filters.level }
        })
      ]);

      const membersData = membersRes.data.data?.data || membersRes.data.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
      setStatistics(statsRes.data.data);

    } catch (error) {
      console.error('Load data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setShowModal(true);
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const handleDelete = async (member) => {
    if (!confirm(`คุณต้องการลบ "${member.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await api.delete(`/committee-members/${member.id}`);
      toast.success('ลบคณะทำงานสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถลบได้');
    }
  };

  const handleSuccess = () => {
    loadData();
  };

  // ดาวน์โหลด PDF สำหรับกรรมการเซ็นชื่อ
  const handleDownloadPdf = async (competitionId, competitionName) => {
    try {
      toast.info('กำลังสร้าง PDF...');

      const response = await api.get(`/committee-members/signin-pdf/${competitionId}`, {
        responseType: 'blob'
      });

      // สร้าง URL สำหรับดาวน์โหลด
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `committee_signin_${competitionId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลด PDF สำเร็จ');
    } catch (error) {
      console.error('Download PDF error:', error);
      toast.error('ไม่สามารถดาวน์โหลด PDF ได้');
    }
  };

  // รวบรวมกิจกรรมที่มีกรรมการและสามารถพิมพ์ PDF
  const getCompetitionsWithMembers = () => {
    const competitionIds = new Set();
    members.forEach(member => {
      if (member.competition_id) {
        competitionIds.add(member.competition_id);
      }
    });
    return competitionIds;
  };

  // จัดกลุ่มสมาชิกตามหมวดหมู่และกิจกรรม
  const groupMembersByCategory = () => {
    const grouped = {};

    members.forEach(member => {
      const categoryName = member.competition?.category?.name || 'ทั่วไป';
      const competitionKey = member.competition_id || 'general';
      const competitionName = member.competition
        ? `${member.competition.code} - ${member.competition.name}`
        : 'ทั่วไป (ไม่ระบุกิจกรรม)';

      if (!grouped[categoryName]) {
        grouped[categoryName] = {};
      }

      if (!grouped[categoryName][competitionKey]) {
        grouped[categoryName][competitionKey] = {
          competition: member.competition,
          competitionName,
          members: []
        };
      }

      grouped[categoryName][competitionKey].members.push(member);
    });

    return grouped;
  };

  // Toggle accordion category
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Expand/Collapse all
  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupMembersByCategory()).forEach(cat => {
      allExpanded[cat] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  const getMemberTypeBadge = (type) => {
    const badges = {
      committee: { label: 'คณะกรรมการ', class: 'bg-blue-100 text-blue-700' },
      staff: { label: 'เจ้าหน้าที่', class: 'bg-green-100 text-green-700' },
      volunteer: { label: 'อาสาสมัคร', class: 'bg-purple-100 text-purple-700' },
    };

    const badge = badges[type] || { label: type, class: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    if (level === 'district') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <MapPin className="w-3 h-3" />
          เขต
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        <Building2 className="w-3 h-3" />
        กลุ่ม
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          ใช้งาน
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        <XCircle className="w-3 h-3" />
        ไม่ใช้งาน
      </span>
    );
  };

  // สีตาม Level
  const levelColors = {
    group: {
      primary: 'blue',
      bgLight: 'bg-blue-50',
      bgDark: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-500',
      icon: Building2,
    },
    district: {
      primary: 'purple',
      bgLight: 'bg-purple-50',
      bgDark: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-500',
      icon: MapPin,
    },
  };

  const currentColors = levelColors[activeLevel];
  const LevelIcon = currentColors.icon;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คณะทำงาน</h1>
          <p className="text-gray-600 mt-1">จัดการคณะทำงาน เจ้าหน้าที่ และอาสาสมัคร</p>
        </div>
        <button
          onClick={handleAdd}
          className={`flex items-center gap-2 px-4 py-2 ${currentColors.bgDark} text-white rounded-lg hover:opacity-90 transition-colors`}
        >
          <Plus className="w-5 h-5" />
          เพิ่มคณะทำงาน
        </button>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveLevel('group')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeLevel === 'group'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          ระดับกลุ่ม
          {statistics?.by_level?.group !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeLevel === 'group' ? 'bg-blue-500' : 'bg-blue-100 text-blue-600'
            }`}>
              {statistics.by_level.group || 0}
            </span>
          )}
        </button>

        {canSeeDistrictLevel && (
          <button
            onClick={() => setActiveLevel('district')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeLevel === 'district'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
            }`}
          >
            <MapPin className="w-5 h-5" />
            ระดับเขตพื้นที่
            {statistics?.by_level?.district !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeLevel === 'district' ? 'bg-purple-500' : 'bg-purple-100 text-purple-600'
              }`}>
                {statistics.by_level.district || 0}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Level Header Banner */}
      <div className={`${currentColors.bgLight} border-l-4 ${currentColors.border} rounded-lg p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <LevelIcon className={`w-6 h-6 ${currentColors.text}`} />
          <div>
            <h2 className={`font-semibold ${currentColors.text}`}>
              {activeLevel === 'group' ? 'คณะทำงานระดับกลุ่ม' : 'คณะทำงานระดับเขตพื้นที่'}
            </h2>
            <p className="text-sm text-gray-600">
              {activeLevel === 'group'
                ? 'จัดการคณะทำงานสำหรับการแข่งขันระดับกลุ่มโรงเรียน'
                : 'จัดการคณะทำงานสำหรับการแข่งขันระดับเขตพื้นที่การศึกษา'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`bg-white rounded-lg border-2 ${currentColors.border} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ทั้งหมด ({activeLevel === 'group' ? 'กลุ่ม' : 'เขต'})</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <div className={`p-3 ${currentColors.bgLight} rounded-lg`}>
                <Users className={`w-6 h-6 ${currentColors.text}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">คณะกรรมการ</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.by_type?.committee || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เจ้าหน้าที่</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.by_type?.staff || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">อาสาสมัคร</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.by_type?.volunteer || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              ค้นหา
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="ชื่อ, ตำแหน่ง, สังกัด..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              ประเภท
            </label>
            <select
              value={filters.member_type}
              onChange={(e) => setFilters({ ...filters, member_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="committee">คณะกรรมการ</option>
              <option value="staff">เจ้าหน้าที่</option>
              <option value="volunteer">อาสาสมัคร</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              การแข่งขัน
            </label>
            <select
              value={filters.competition_id}
              onChange={(e) => setFilters({ ...filters, competition_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="null">ทั่วไป (ไม่ระบุ)</option>
              {Object.keys(competitions).sort().map((categoryName) => (
                <optgroup key={categoryName} label={categoryName}>
                  {competitions[categoryName].map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.code} - {comp.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="1">ใช้งาน</option>
              <option value="0">ไม่ใช้งาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List - Accordion View */}
      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block w-8 h-8 border-4 ${currentColors.border} border-t-transparent rounded-full animate-spin`} />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ไม่พบรายชื่อคณะทำงาน{activeLevel === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'}
          </h3>
          <p className="text-gray-600 mb-4">
            เริ่มต้นด้วยการเพิ่มคณะทำงานคนแรก
          </p>
          <button
            onClick={handleAdd}
            className={`inline-flex items-center gap-2 px-4 py-2 ${currentColors.bgDark} text-white rounded-lg hover:opacity-90`}
          >
            <Plus className="w-5 h-5" />
            เพิ่มคณะทำงาน
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Expand/Collapse All Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ขยายทั้งหมด
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ย่อทั้งหมด
            </button>
          </div>

          {/* Category Accordions */}
          {Object.entries(groupMembersByCategory()).sort(([a], [b]) => a.localeCompare(b)).map(([categoryName, competitionsInCategory]) => {
            const totalMembersInCategory = Object.values(competitionsInCategory).reduce(
              (sum, comp) => sum + comp.members.length, 0
            );
            const isExpanded = expandedCategories[categoryName];

            return (
              <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${currentColors.bgLight} hover:opacity-90 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${currentColors.bgDark} text-white p-1.5 rounded-lg`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-800">{categoryName}</span>
                    <span className={`${currentColors.bgLight} ${currentColors.text} px-2 py-0.5 rounded-full text-xs font-medium border`}>
                      {totalMembersInCategory} คน
                    </span>
                  </div>
                  <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </div>
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {Object.entries(competitionsInCategory).map(([compKey, compData]) => (
                      <div key={compKey} className="border border-gray-100 rounded-lg overflow-hidden">
                        {/* Competition Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${currentColors.text}`}>
                              {compData.competitionName}
                            </span>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                              {compData.members.length} คน
                            </span>
                          </div>
                          {compData.competition && (
                            <button
                              onClick={() => handleDownloadPdf(compData.competition.id, compData.competition.name)}
                              className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                              title="ดาวน์โหลดใบลงทะเบียนกรรมการ"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          )}
                        </div>

                        {/* Members Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ลำดับ</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ตำแหน่ง</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">สังกัด</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ประเภท</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">สถานะ</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {compData.members.map((member, index) => (
                                <tr key={member.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                  <td className="px-4 py-2 text-center font-medium text-gray-500">{index + 1}</td>
                                  <td className="px-4 py-2 font-medium text-gray-900">{member.name}</td>
                                  <td className="px-4 py-2 text-gray-600">{member.position || '-'}</td>
                                  <td className="px-4 py-2 text-gray-600">{member.organization || '-'}</td>
                                  <td className="px-4 py-2">{getMemberTypeBadge(member.member_type)}</td>
                                  <td className="px-4 py-2">{getStatusBadge(member.is_active)}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => handleEdit(member)}
                                        className={`p-1.5 ${currentColors.text} hover:bg-blue-100 rounded`}
                                        title="แก้ไข"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(member)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        title="ลบ"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats Footer */}
      {statistics?.by_level && canSeeDistrictLevel && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">ระดับกลุ่ม:</span>
              <span className="font-bold text-blue-600">{statistics.by_level.group || 0} คน</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="text-gray-600">ระดับเขต:</span>
              <span className="font-bold text-purple-600">{statistics.by_level.district || 0} คน</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">รวมทั้งหมด:</span>
              <span className="font-bold text-gray-900">
                {(statistics.by_level.group || 0) + (statistics.by_level.district || 0)} คน
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CommitteeMemberModal
          isOpen={showModal}
          member={selectedMember}
          defaultLevel={activeLevel}
          onClose={() => {
            setShowModal(false);
            setSelectedMember(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default CommitteeManagement;
