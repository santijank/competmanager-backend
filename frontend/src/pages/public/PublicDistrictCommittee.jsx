import { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
  Users,
  Award,
  MapPin,
  UserCheck,
} from 'lucide-react';
import api from '@/lib/api';

const PublicDistrictCommittee = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [generalMembers, setGeneralMembers] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedCompetitions, setExpandedCompetitions] = useState(new Set());
  const [showGeneral, setShowGeneral] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalComps, setTotalComps] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/district-committee-members');

      if (response.data.success) {
        setCategories(response.data.data || []);
        setGeneralMembers(response.data.general_members || []);
        setTotalMembers(response.data.total_members || 0);
        setTotalComps(response.data.total_competitions || 0);

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

  const getPositionColor = (position) => {
    if (!position) return '';
    if (position.includes('ประธาน')) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (position.includes('รองประธาน')) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (position.includes('เลขานุการ')) return 'text-green-700 bg-green-50 border-green-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
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

  const filteredTotalComps = filteredCategories.reduce((sum, cat) => sum + (cat.competitions?.length || 0), 0);
  const filteredTotalMembers = filteredCategories.reduce((sum, cat) =>
    sum + (cat.competitions || []).reduce((s, comp) => s + (comp.member_count || 0), 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
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
              <UserCheck className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  คณะกรรมการระดับเขตพื้นที่
                </h1>
                <p className="text-gray-600 mt-1">
                  รายชื่อคณะกรรมการจัดการแข่งขันระดับเขตพื้นที่การศึกษา
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
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">กรรมการทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">กิจกรรม</p>
                <p className="text-2xl font-bold text-green-600">{totalComps}</p>
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
              พบ {filteredTotalComps} กิจกรรม, {filteredTotalMembers} คน
            </div>
          )}
        </div>

        {/* General Members (ไม่ผูกกิจกรรม) */}
        {generalMembers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div
              onClick={() => setShowGeneral(!showGeneral)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {showGeneral ? (
                  <ChevronDown className="w-5 h-5 text-amber-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    คณะกรรมการอำนวยการ (ไม่ระบุกิจกรรม)
                  </h3>
                  <p className="text-sm text-gray-600">
                    {generalMembers.length} คน
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                ทั่วไป
              </span>
            </div>

            {showGeneral && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="divide-y divide-gray-200">
                  {generalMembers.map((member, idx) => (
                    <div key={member.id} className="py-2 first:pt-0 last:pb-0 flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400 w-8 text-right flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                        {member.position && (
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getPositionColor(member.position)}`}>
                            {member.position}
                          </span>
                        )}
                        {member.organization && (
                          <span className="ml-2 text-xs text-gray-500">{member.organization}</span>
                        )}
                      </div>
                      {member.responsibility && (
                        <span className="text-xs text-gray-500 flex-shrink-0">{member.responsibility}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {filteredCategories.length === 0 && generalMembers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีข้อมูลคณะกรรมการ</p>
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
                        <ChevronDown className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cat.category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {competitions.length} กิจกรรม | {cat.member_count} คน
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
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {comp.name}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  <Users className="w-3 h-3 mr-1" />
                                  {comp.member_count} คน
                                </span>
                                {!isCompExpanded && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full animate-pulse">
                                    <Eye className="w-3 h-3 mr-1" />
                                    คลิกดูรายชื่อ
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Expanded: Member List */}
                            {isCompExpanded && comp.members && comp.members.length > 0 && (
                              <div className="bg-gray-50 px-4 py-3">
                                <div className="divide-y divide-gray-200">
                                  {comp.members.map((member, idx) => (
                                    <div key={member.id} className="py-2 first:pt-0 last:pb-0">
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm font-semibold text-gray-400 mt-0.5 flex-shrink-0 w-8 text-right">{idx + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                          {member.position && (
                                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getPositionColor(member.position)}`}>
                                              {member.position}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {(member.organization || member.responsibility) && (
                                        <div className="ml-10 mt-0.5">
                                          {member.organization && (
                                            <span className="text-xs text-gray-500">{member.organization}</span>
                                          )}
                                          {member.responsibility && (
                                            <span className="text-xs text-blue-600 ml-2">{member.responsibility}</span>
                                          )}
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

export default PublicDistrictCommittee;
