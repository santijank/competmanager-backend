import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, CheckCircle2, Ban, ChevronDown, Layers, Building2, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * 🔒 Competition Exclusion Manager
 *
 * สำหรับ District Admin จัดการกลุ่มโรงเรียนที่ยกเว้นจากการลงทะเบียน
 * เช่น กลุ่มโรงเรียนเอกชนไม่สามารถลงทะเบียนบางกิจกรรมได้
 */
export default function CompetitionExclusionManager() {
  const { user, isDistrictAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [competitions, setCompetitions] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);

  // Selected items for bulk action
  const [selectedCompetitions, setSelectedCompetitions] = useState([]);
  const [selectedGroupsToExclude, setSelectedGroupsToExclude] = useState([]);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('add'); // 'add', 'remove', 'set'
  const [exclusionReason, setExclusionReason] = useState('');

  useEffect(() => {
    if (!isDistrictAdmin()) {
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

  // Filter competitions
  const filteredCompetitions = competitions.filter(comp => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!comp.name?.toLowerCase().includes(search) &&
          !comp.code?.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Category filter
    if (filterCategory !== 'all' && comp.category?.id !== parseInt(filterCategory)) {
      return false;
    }

    // Level filter
    if (filterLevel !== 'all' && comp.competition_level !== filterLevel) {
      return false;
    }

    // Show excluded only
    if (showExcludedOnly) {
      const hasExclusions = comp.excluded_school_groups && comp.excluded_school_groups.length > 0;
      if (!hasExclusions) return false;
    }

    return true;
  });

  // Group by category
  const groupedCompetitions = filteredCompetitions.reduce((acc, comp) => {
    const categoryName = comp.category?.name || 'ไม่ระบุหมวดหมู่';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(comp);
    return acc;
  }, {});

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupedCompetitions).forEach(cat => allExpanded[cat] = true);
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Selection handlers
  const toggleCompetitionSelection = (compId) => {
    setSelectedCompetitions(prev =>
      prev.includes(compId)
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

  const selectAllInCategory = (categoryName) => {
    const categoryCompIds = groupedCompetitions[categoryName]?.map(c => c.id) || [];
    const allSelected = categoryCompIds.every(id => selectedCompetitions.includes(id));

    if (allSelected) {
      setSelectedCompetitions(prev => prev.filter(id => !categoryCompIds.includes(id)));
    } else {
      setSelectedCompetitions(prev => [...new Set([...prev, ...categoryCompIds])]);
    }
  };

  const selectAll = () => {
    if (selectedCompetitions.length === filteredCompetitions.length) {
      setSelectedCompetitions([]);
    } else {
      setSelectedCompetitions(filteredCompetitions.map(c => c.id));
    }
  };

  // Update single competition's excluded groups
  const updateSingleExclusion = async (competitionId, excludedGroups, reason = null) => {
    try {
      await api.put(`/competitions/${competitionId}`, {
        excluded_school_groups: excludedGroups,
        exclusion_reason: reason
      });

      setCompetitions(prev => prev.map(c =>
        c.id === competitionId
          ? { ...c, excluded_school_groups: excludedGroups, exclusion_reason: reason }
          : c
      ));

      toast.success('บันทึกสำเร็จ');
    } catch (error) {
      console.error('Failed to update exclusion:', error);
      toast.error('ไม่สามารถบันทึกได้');
    }
  };

  // Bulk update handler
  const handleBulkUpdate = async () => {
    if (selectedCompetitions.length === 0) {
      toast.warning('กรุณาเลือกกิจกรรมก่อน');
      return;
    }

    if (selectedGroupsToExclude.length === 0 && bulkAction !== 'set') {
      toast.warning('กรุณาเลือกกลุ่มโรงเรียนที่ต้องการ');
      return;
    }

    try {
      setSaving(true);

      const response = await api.post('/competitions/bulk-update-excluded-groups', {
        competition_ids: selectedCompetitions,
        action: bulkAction,
        school_group_ids: selectedGroupsToExclude,
        exclusion_reason: exclusionReason || null
      });

      toast.success(response.data.message);
      setShowBulkModal(false);
      setSelectedCompetitions([]);
      setSelectedGroupsToExclude([]);
      setExclusionReason('');

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  // Get school group name by ID
  const getGroupName = (groupId) => {
    return schoolGroups.find(g => g.id === groupId)?.name || `กลุ่ม ${groupId}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <Ban className="w-7 h-7 text-red-600" />
          จัดการการยกเว้นกลุ่มโรงเรียน
        </h1>
        <p className="text-gray-600 mt-2">
          กำหนดกิจกรรมที่กลุ่มโรงเรียนบางกลุ่มไม่สามารถลงทะเบียนได้ (เช่น กลุ่มโรงเรียนเอกชน)
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">หมายเหตุ:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>กลุ่มโรงเรียนที่ถูกยกเว้นจะไม่เห็นกิจกรรมนี้ในหน้าลงทะเบียน</li>
              <li>การยกเว้นมีผลทันทีหลังบันทึก</li>
              <li>สามารถเลือกหลายกิจกรรมแล้วกำหนดการยกเว้นพร้อมกันได้</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">ทุกระดับ</option>
              <option value="group">ระดับกลุ่ม</option>
              <option value="district">ระดับเขต</option>
            </select>
          </div>

          {/* Show Excluded Only */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExcludedOnly}
                onChange={(e) => setShowExcludedOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">แสดงเฉพาะที่มีการยกเว้น</span>
            </label>
          </div>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedCompetitions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              เลือก {selectedCompetitions.length} กิจกรรม
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCompetitions([])}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              ยกเลิกการเลือก
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              กำหนดการยกเว้น
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{filteredCompetitions.length}</p>
          <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
          <p className="text-3xl font-bold text-red-600">
            {filteredCompetitions.filter(c => c.excluded_school_groups?.length > 0).length}
          </p>
          <p className="text-sm text-gray-600">มีการยกเว้น</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-600">{schoolGroups.length}</p>
          <p className="text-sm text-gray-600">กลุ่มโรงเรียน</p>
        </div>
      </div>

      {/* Expand/Collapse & Select All */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {selectedCompetitions.length === filteredCompetitions.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Competition List by Category */}
      <div className="space-y-4">
        {Object.entries(groupedCompetitions).map(([categoryName, comps]) => {
          const categoryCompIds = comps.map(c => c.id);
          const allSelected = categoryCompIds.every(id => selectedCompetitions.includes(id));
          const someSelected = categoryCompIds.some(id => selectedCompetitions.includes(id));

          return (
            <div key={categoryName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleCategory(categoryName)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => selectAllInCategory(categoryName)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Layers className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-gray-800">{categoryName}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                    {comps.length} กิจกรรม
                  </span>
                  {comps.some(c => c.excluded_school_groups?.length > 0) && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                      มีการยกเว้น
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedCategories[categoryName] ? 'rotate-180' : ''}`} />
              </div>

              {/* Competition Table */}
              {expandedCategories[categoryName] && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left w-12"></th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">รหัส</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อกิจกรรม</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">ระดับ</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">กลุ่มที่ยกเว้น</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comps.map((comp) => (
                        <CompetitionRow
                          key={comp.id}
                          competition={comp}
                          schoolGroups={schoolGroups}
                          isSelected={selectedCompetitions.includes(comp.id)}
                          onToggleSelect={() => toggleCompetitionSelection(comp.id)}
                          onUpdateExclusion={updateSingleExclusion}
                          getGroupName={getGroupName}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <BulkUpdateModal
          selectedCount={selectedCompetitions.length}
          schoolGroups={schoolGroups}
          selectedGroups={selectedGroupsToExclude}
          setSelectedGroups={setSelectedGroupsToExclude}
          action={bulkAction}
          setAction={setBulkAction}
          reason={exclusionReason}
          setReason={setExclusionReason}
          onClose={() => setShowBulkModal(false)}
          onConfirm={handleBulkUpdate}
          saving={saving}
        />
      )}
    </div>
  );
}

// Competition Row Component
const CompetitionRow = ({ competition, schoolGroups, isSelected, onToggleSelect, onUpdateExclusion, getGroupName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExclusions, setEditedExclusions] = useState(competition.excluded_school_groups || []);
  const [editedReason, setEditedReason] = useState(competition.exclusion_reason || '');

  const handleSave = async () => {
    await onUpdateExclusion(competition.id, editedExclusions, editedReason);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedExclusions(competition.excluded_school_groups || []);
    setEditedReason(competition.exclusion_reason || '');
    setIsEditing(false);
  };

  const toggleGroupExclusion = (groupId) => {
    setEditedExclusions(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-600">{competition.code}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{competition.name}</div>
        {competition.exclusion_reason && (
          <div className="text-xs text-gray-500 mt-1">
            เหตุผล: {competition.exclusion_reason}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          competition.competition_level === 'district'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {competition.competition_level === 'district' ? 'เขต' : 'กลุ่ม'}
        </span>
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {schoolGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => toggleGroupExclusion(group.id)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    editedExclusions.includes(group.id)
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editedReason}
              onChange={(e) => setEditedReason(e.target.value)}
              placeholder="เหตุผล (ถ้ามี)"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {competition.excluded_school_groups && competition.excluded_school_groups.length > 0 ? (
              competition.excluded_school_groups.map(groupId => (
                <span key={groupId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                  <Ban className="w-3 h-3" />
                  {getGroupName(groupId)}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="บันทึก"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="ยกเลิก"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
          >
            แก้ไข
          </button>
        )}
      </td>
    </tr>
  );
};

// Bulk Update Modal Component
const BulkUpdateModal = ({
  selectedCount,
  schoolGroups,
  selectedGroups,
  setSelectedGroups,
  action,
  setAction,
  reason,
  setReason,
  onClose,
  onConfirm,
  saving
}) => {
  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-600" />
            กำหนดการยกเว้น ({selectedCount} กิจกรรม)
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทการดำเนินการ
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setAction('add')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  action === 'add'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                เพิ่มการยกเว้น
              </button>
              <button
                onClick={() => setAction('remove')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  action === 'remove'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ยกเลิกการยกเว้น
              </button>
              <button
                onClick={() => setAction('set')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  action === 'set'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ตั้งค่าใหม่
              </button>
            </div>
          </div>

          {/* School Groups Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกกลุ่มโรงเรียน
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {schoolGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                    selectedGroups.includes(group.id)
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {group.name}
                </button>
              ))}
            </div>
            {selectedGroups.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                เลือก {selectedGroups.length} กลุ่ม
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เหตุผล (ถ้ามี)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น: กิจกรรมเฉพาะโรงเรียนรัฐบาล"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={saving || (selectedGroups.length === 0 && action !== 'set')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};
