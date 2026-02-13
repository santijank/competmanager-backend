import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Save,
  CheckSquare,
  Square,
  MinusSquare,
  AlertCircle,
  SkipForward,
  Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * SkipGroupLevelManager
 *
 * Admin page to manage which district competitions can bypass group level
 * When skip_group_level = true, schools register directly for district level (status = pending)
 */
export default function SkipGroupLevelManager() {
  const { hasRole } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'skip', 'normal'

  // Expanded categories - default collapsed
  const [expandedCategories, setExpandedCategories] = useState({});

  // Track which competitions have skip_group_level = true
  const [skipCompIds, setSkipCompIds] = useState(new Set());
  const [originalSkipCompIds, setOriginalSkipCompIds] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasRole(['admin', 'district_admin'])) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }
    fetchData();
  }, []);

  // Detect changes
  useEffect(() => {
    if (originalSkipCompIds.size === 0 && skipCompIds.size === 0) {
      setHasChanges(false);
      return;
    }
    const changed =
      skipCompIds.size !== originalSkipCompIds.size ||
      [...skipCompIds].some((id) => !originalSkipCompIds.has(id)) ||
      [...originalSkipCompIds].some((id) => !skipCompIds.has(id));
    setHasChanges(changed);
  }, [skipCompIds, originalSkipCompIds]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compsRes, catsRes] = await Promise.all([
        api.get('/competitions', { params: { is_active: true, per_page: 500, competition_level: 'district' } }),
        api.get('/categories'),
      ]);

      const districtComps = compsRes.data.data || [];
      setCompetitions(districtComps);
      setCategories(catsRes.data.data || []);

      // Set initial skip state
      const skipIds = new Set();
      districtComps.forEach((comp) => {
        if (comp.skip_group_level) {
          skipIds.add(comp.id);
        }
      });
      setSkipCompIds(new Set(skipIds));
      setOriginalSkipCompIds(new Set(skipIds));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Toggle single competition
  const toggleCompetition = (compId) => {
    setSkipCompIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(compId)) {
        newSet.delete(compId);
      } else {
        newSet.add(compId);
      }
      return newSet;
    });
  };

  // Toggle all in category
  const toggleCategoryComps = (categoryComps) => {
    const compIds = categoryComps.map((c) => c.id);
    const allSkipped = compIds.every((id) => skipCompIds.has(id));

    setSkipCompIds((prev) => {
      const newSet = new Set(prev);
      if (allSkipped) {
        compIds.forEach((id) => newSet.delete(id));
      } else {
        compIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // Toggle all visible
  const toggleAll = (selectAll) => {
    setSkipCompIds((prev) => {
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
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);

      const toSkip = [];
      const toNormal = [];

      competitions.forEach((comp) => {
        const wasSkipped = originalSkipCompIds.has(comp.id);
        const shouldSkip = skipCompIds.has(comp.id);

        if (shouldSkip && !wasSkipped) {
          toSkip.push(comp.id);
        } else if (!shouldSkip && wasSkipped) {
          toNormal.push(comp.id);
        }
      });

      const promises = [];

      if (toSkip.length > 0) {
        promises.push(
          api.post('/competitions/bulk-update-skip-group', {
            competition_ids: toSkip,
            skip_group_level: true,
          })
        );
      }

      if (toNormal.length > 0) {
        promises.push(
          api.post('/competitions/bulk-update-skip-group', {
            competition_ids: toNormal,
            skip_group_level: false,
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
        prev.map((comp) => ({
          ...comp,
          skip_group_level: skipCompIds.has(comp.id),
        }))
      );

      setOriginalSkipCompIds(new Set(skipCompIds));
      setHasChanges(false);
      toast.success(
        `บันทึกสำเร็จ: ข้ามระดับกลุ่ม ${toSkip.length} กิจกรรม, คืนค่าปกติ ${toNormal.length} กิจกรรม`
      );
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setSkipCompIds(new Set(originalSkipCompIds));
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

      if (filterStatus !== 'all') {
        const isSkipped = skipCompIds.has(comp.id);
        if (filterStatus === 'skip' && !isSkipped) return false;
        if (filterStatus === 'normal' && isSkipped) return false;
      }

      return true;
    });
  }, [competitions, searchTerm, filterCategory, filterStatus, skipCompIds]);

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
    const total = competitions.length;
    const skipped = skipCompIds.size;
    return { total, skipped, normal: total - skipped };
  }, [competitions, skipCompIds]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
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
          <SkipForward className="w-7 h-7 text-purple-600" />
          ข้ามระดับกลุ่ม (Bypass)
        </h1>
        <p className="text-gray-600 mt-2">
          กำหนดกิจกรรมระดับเขตที่โรงเรียนสามารถสมัครตรงได้เลย โดยไม่ต้องผ่านการแข่งขันระดับกลุ่ม
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-purple-900">วิธีการทำงาน</p>
            <ul className="text-sm text-purple-700 mt-1 space-y-1">
              <li>- กิจกรรมที่ติ๊กเลือก = โรงเรียนสมัครตรงระดับเขตได้เลย (ไม่ต้องแข่งระดับกลุ่ม)</li>
              <li>- เมื่อโรงเรียนสมัครเข้ามา สถานะจะเป็น "รอการอนุมัติ" → admin เขตอนุมัติ</li>
              <li>- กิจกรรมที่ไม่ได้ติ๊ก = ต้องผ่านการแข่งขันระดับกลุ่มก่อนตามปกติ</li>
            </ul>
          </div>
        </div>
      </div>

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
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
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
          <p className="text-sm text-gray-600">กิจกรรมระดับเขตทั้งหมด</p>
        </div>
        <div className="bg-white rounded-lg border border-purple-200 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.skipped}</p>
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <SkipForward className="w-4 h-4" />
            ข้ามระดับกลุ่ม
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-600">{stats.normal}</p>
          <p className="text-sm text-gray-600">ปกติ (ต้องแข่งระดับกลุ่มก่อน)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัสกิจกรรม..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <SkipForward className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="skip">เฉพาะที่ข้ามระดับกลุ่ม</option>
              <option value="normal">เฉพาะปกติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAll(true)}
            className="text-sm text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
          >
            <CheckSquare className="w-4 h-4" />
            เลือกทั้งหมด
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => toggleAll(false)}
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center gap-1"
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
          const allSkipped = comps.every((c) => skipCompIds.has(c.id));
          const someSkipped = comps.some((c) => skipCompIds.has(c.id));
          const skippedCount = comps.filter((c) => skipCompIds.has(c.id)).length;

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
                      toggleCategoryComps(comps);
                    }}
                    className="flex-shrink-0"
                    title={allSkipped ? 'คืนค่าปกติทั้งหมดในหมวดนี้' : 'ข้ามระดับกลุ่มทั้งหมดในหมวดนี้'}
                  >
                    {allSkipped ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : someSkipped ? (
                      <MinusSquare className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
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
                      skippedCount === comps.length
                        ? 'bg-purple-100 text-purple-700'
                        : skippedCount === 0
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    ข้าม {skippedCount}/{comps.length}
                  </span>
                </div>
              </div>

              {/* Competition List */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {comps.map((comp) => {
                    const isSkipped = skipCompIds.has(comp.id);

                    return (
                      <div
                        key={comp.id}
                        onClick={() => toggleCompetition(comp.id)}
                        className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${
                          isSkipped
                            ? 'bg-purple-50/40 hover:bg-purple-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Checkbox icon */}
                        <div className="flex-shrink-0 mr-3">
                          {isSkipped ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Competition info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">
                              {comp.code}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {comp.name}
                            </span>
                          </div>
                          {comp.level && (
                            <span className="text-xs text-gray-400">{comp.level}</span>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="flex-shrink-0">
                          {isSkipped ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                              <SkipForward className="w-3 h-3" />
                              ข้ามกลุ่ม
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                              ปกติ
                            </span>
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
            onClick={handleCancel}
            className="px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิกการเปลี่ยนแปลง
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 font-medium"
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
    </div>
  );
}
