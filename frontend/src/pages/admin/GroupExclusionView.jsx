import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
  Ban,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * Group Exclusion View
 *
 * มุมมองแบบกลุ่ม: เลือกกลุ่มโรงเรียน → เห็นกิจกรรมทั้งหมด → ติ๊กเลือกกิจกรรมที่กลุ่มนี้เข้าแข่งได้
 * กิจกรรมที่ไม่ได้ติ๊ก = ถูกยกเว้น (excluded)
 */
export default function GroupExclusionView() {
  const { hasRole } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [competitions, setCompetitions] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [categories, setCategories] = useState([]);

  // Selected group
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all'); // 'all', 'visible', 'hidden'

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // Track changes (local state of which competitions this group can see)
  const [allowedCompIds, setAllowedCompIds] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasRole(['admin', 'district_admin'])) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compsRes, groupsRes, catsRes] = await Promise.all([
        api.get('/competitions', { params: { is_active: true } }),
        api.get('/school-groups'),
        api.get('/categories')
      ]);

      setCompetitions(compsRes.data.data || []);
      setSchoolGroups(groupsRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // When group is selected, compute which competitions are allowed
  const selectGroup = (groupId) => {
    const gid = parseInt(groupId);
    setSelectedGroupId(gid);
    setHasChanges(false);

    // Build set of allowed competition IDs
    // A competition is allowed if the group is NOT in its excluded_school_groups
    const allowed = new Set();
    competitions.forEach((comp) => {
      const excluded = comp.excluded_school_groups || [];
      if (!excluded.includes(gid)) {
        allowed.add(comp.id);
      }
    });
    setAllowedCompIds(allowed);

    // Auto-expand all categories
    const allExpanded = {};
    categories.forEach(cat => {
      allExpanded[cat.name] = true;
    });
    allExpanded['ไม่ระบุหมวดหมู่'] = true;
    setExpandedCategories(allExpanded);
  };

  // Toggle single competition
  const toggleCompetition = (compId) => {
    setAllowedCompIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(compId)) {
        newSet.delete(compId);
      } else {
        newSet.add(compId);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  // Toggle all in category
  const toggleCategory = (categoryComps) => {
    const compIds = categoryComps.map((c) => c.id);
    const allAllowed = compIds.every((id) => allowedCompIds.has(id));

    setAllowedCompIds((prev) => {
      const newSet = new Set(prev);
      if (allAllowed) {
        // ยกเลิกทั้งหมดในหมวดหมู่
        compIds.forEach((id) => newSet.delete(id));
      } else {
        // เลือกทั้งหมดในหมวดหมู่
        compIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
    setHasChanges(true);
  };

  // Toggle all visible competitions
  const toggleAll = (selectAll) => {
    setAllowedCompIds((prev) => {
      const newSet = new Set(prev);
      filteredCompetitions.forEach((comp) => {
        if (selectAll) {
          newSet.add(comp.id);
        } else {
          newSet.delete(comp.id);
        }
      });
      return newSet;
    });
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!selectedGroupId) return;

    try {
      setSaving(true);

      // For each competition, determine if this group should be excluded or not
      // We batch into add/remove operations
      const toExclude = []; // competitions where group should be in excluded list
      const toAllow = []; // competitions where group should NOT be in excluded list

      competitions.forEach((comp) => {
        const currentlyExcluded = (comp.excluded_school_groups || []).includes(selectedGroupId);
        const shouldBeAllowed = allowedCompIds.has(comp.id);

        if (shouldBeAllowed && currentlyExcluded) {
          // Need to REMOVE from exclusion
          toAllow.push(comp.id);
        } else if (!shouldBeAllowed && !currentlyExcluded) {
          // Need to ADD to exclusion
          toExclude.push(comp.id);
        }
      });

      const promises = [];

      if (toExclude.length > 0) {
        promises.push(
          api.post('/competitions/bulk-update-excluded-groups', {
            competition_ids: toExclude,
            action: 'add',
            school_group_ids: [selectedGroupId],
          })
        );
      }

      if (toAllow.length > 0) {
        promises.push(
          api.post('/competitions/bulk-update-excluded-groups', {
            competition_ids: toAllow,
            action: 'remove',
            school_group_ids: [selectedGroupId],
          })
        );
      }

      if (promises.length === 0) {
        toast.info('ไม่มีการเปลี่ยนแปลง');
        return;
      }

      await Promise.all(promises);

      // Update local state
      setCompetitions((prev) =>
        prev.map((comp) => {
          let excluded = [...(comp.excluded_school_groups || [])];
          if (toExclude.includes(comp.id) && !excluded.includes(selectedGroupId)) {
            excluded.push(selectedGroupId);
          }
          if (toAllow.includes(comp.id)) {
            excluded = excluded.filter((id) => id !== selectedGroupId);
          }
          return { ...comp, excluded_school_groups: excluded };
        })
      );

      setHasChanges(false);
      toast.success(
        `บันทึกสำเร็จ: เพิ่มการยกเว้น ${toExclude.length} กิจกรรม, ยกเลิกการยกเว้น ${toAllow.length} กิจกรรม`
      );
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Filter competitions
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !comp.name?.toLowerCase().includes(search) &&
          !comp.code?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (filterCategory !== 'all' && comp.category?.id !== parseInt(filterCategory)) {
        return false;
      }

      if (filterLevel !== 'all' && comp.competition_level !== filterLevel) {
        return false;
      }

      if (selectedGroupId && filterVisibility !== 'all') {
        const isAllowed = allowedCompIds.has(comp.id);
        if (filterVisibility === 'visible' && !isAllowed) return false;
        if (filterVisibility === 'hidden' && isAllowed) return false;
      }

      return true;
    });
  }, [competitions, searchTerm, filterCategory, filterLevel, filterVisibility, selectedGroupId, allowedCompIds]);

  // Group by category
  const groupedCompetitions = useMemo(() => {
    return filteredCompetitions.reduce((acc, comp) => {
      const categoryName = comp.category?.name || 'ไม่ระบุหมวดหมู่';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(comp);
      return acc;
    }, {});
  }, [filteredCompetitions]);

  // Stats
  const stats = useMemo(() => {
    if (!selectedGroupId) return { total: 0, allowed: 0, excluded: 0 };
    const total = competitions.length;
    const allowed = allowedCompIds.size;
    return { total, allowed, excluded: total - allowed };
  }, [selectedGroupId, competitions, allowedCompIds]);

  const selectedGroup = schoolGroups.find((g) => g.id === selectedGroupId);

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupedCompetitions).forEach((cat) => (allExpanded[cat] = true));
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Eye className="w-7 h-7 text-blue-600" />
          กำหนดกิจกรรมแต่ละกลุ่ม
        </h1>
        <p className="text-gray-600 mt-2">
          เลือกกลุ่มโรงเรียน แล้วกำหนดว่ากลุ่มนั้นเห็นกิจกรรมใดบ้างในหน้าลงทะเบียน
        </p>
      </div>

      {/* Group Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Building2 className="w-4 h-4 inline mr-2" />
          เลือกกลุ่มโรงเรียนที่ต้องการจัดการ
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {schoolGroups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            // Count excluded for this group
            const excludedCount = competitions.filter(
              (c) => (c.excluded_school_groups || []).includes(group.id)
            ).length;

            return (
              <button
                key={group.id}
                onClick={() => selectGroup(group.id)}
                className={`relative flex flex-col items-center px-3 py-3 text-sm rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <Building2 className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium text-center leading-tight">{group.name}</span>
                {excludedCount > 0 && (
                  <span className="mt-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
                    ยกเว้น {excludedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No group selected */}
      {!selectedGroupId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">กรุณาเลือกกลุ่มโรงเรียนด้านบน</p>
          <p className="text-gray-400 text-sm mt-2">
            เพื่อดูและจัดการกิจกรรมที่กลุ่มนั้นสามารถเห็นได้
          </p>
        </div>
      )}

      {/* Selected group content */}
      {selectedGroupId && (
        <>
          {/* Sticky Save Bar */}
          {hasChanges && (
            <div className="sticky top-0 z-20 bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectGroup(selectedGroupId)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.allowed}</p>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                มองเห็น
              </p>
            </div>
            <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.excluded}</p>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <EyeOff className="w-4 h-4" />
                ยกเว้น (ซ่อน)
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อหรือรหัสกิจกรรม..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm"
                >
                  <option value="all">ทุกระดับ</option>
                  <option value="group">ระดับกลุ่ม</option>
                  <option value="district">ระดับเขต</option>
                </select>
              </div>

              {/* Visibility Filter */}
              <div className="relative">
                <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="visible">เฉพาะที่มองเห็น</option>
                  <option value="hidden">เฉพาะที่ซ่อน (ยกเว้น)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAll(true)}
                className="text-sm text-green-600 hover:text-green-800 hover:underline flex items-center gap-1"
              >
                <CheckSquare className="w-4 h-4" />
                เลือกทั้งหมด
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => toggleAll(false)}
                className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
              >
                <Square className="w-4 h-4" />
                ยกเลิกทั้งหมด
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={expandAll} className="text-sm text-blue-600 hover:underline">
                ขยายทั้งหมด
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={collapseAll} className="text-sm text-blue-600 hover:underline">
                ย่อทั้งหมด
              </button>
            </div>
          </div>

          {/* Competition List by Category */}
          <div className="space-y-3">
            {Object.entries(groupedCompetitions).map(([categoryName, comps]) => {
              const isExpanded = expandedCategories[categoryName];
              const allAllowed = comps.every((c) => allowedCompIds.has(c.id));
              const someAllowed = comps.some((c) => allowedCompIds.has(c.id));
              const allowedCount = comps.filter((c) => allowedCompIds.has(c.id)).length;

              return (
                <div
                  key={categoryName}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      {/* Category checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(comps);
                        }}
                        className="flex-shrink-0"
                        title={allAllowed ? 'ยกเว้นทั้งหมดในหมวดนี้' : 'อนุญาตทั้งหมดในหมวดนี้'}
                      >
                        {allAllowed ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : someAllowed ? (
                          <MinusSquare className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <Square className="w-5 h-5 text-red-400" />
                        )}
                      </button>

                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [categoryName]: !prev[categoryName],
                          }))
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-800">{categoryName}</span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                          {comps.length} กิจกรรม
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          allowedCount === comps.length
                            ? 'bg-green-100 text-green-700'
                            : allowedCount === 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        เห็น {allowedCount}/{comps.length}
                      </span>
                    </div>
                  </div>

                  {/* Competition List */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {comps.map((comp) => {
                        const isAllowed = allowedCompIds.has(comp.id);

                        return (
                          <div
                            key={comp.id}
                            onClick={() => toggleCompetition(comp.id)}
                            className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${
                              isAllowed
                                ? 'hover:bg-green-50'
                                : 'bg-red-50/40 hover:bg-red-50'
                            }`}
                          >
                            {/* Checkbox icon */}
                            <div className="flex-shrink-0 mr-3">
                              {isAllowed ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-red-400" />
                              )}
                            </div>

                            {/* Competition info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500">
                                  {comp.code}
                                </span>
                                <span
                                  className={`text-sm font-medium ${
                                    isAllowed ? 'text-gray-900' : 'text-gray-500 line-through'
                                  }`}
                                >
                                  {comp.name}
                                </span>
                              </div>
                              {comp.level && (
                                <span className="text-xs text-gray-400">{comp.level}</span>
                              )}
                            </div>

                            {/* Level badge */}
                            <span
                              className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium mr-3 ${
                                comp.competition_level === 'district'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {comp.competition_level === 'district' ? 'เขต' : 'กลุ่ม'}
                            </span>

                            {/* Status icon */}
                            <div className="flex-shrink-0">
                              {isAllowed ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-red-400" />
                              )}
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

          {filteredCompetitions.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ไม่พบกิจกรรมที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}

          {/* Bottom Save Button */}
          {hasChanges && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => selectGroup(selectedGroupId)}
                className="px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิกการเปลี่ยนแปลง
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
