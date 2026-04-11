import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Award, Download, Eye, Trash2, Loader,
  CheckSquare, Square, Filter, FileDown, ChevronDown, Users, Settings, X, Save, RotateCcw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { certificateService, categoryService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const medalLabels = {
  gold: 'เหรียญทอง',
  silver: 'เหรียญเงิน',
  bronze: 'เหรียญทองแดง',
  participant: 'เข้าร่วม',
};

const medalColors = {
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  participant: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function CertificateList() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const urlLevel = searchParams.get('level'); // 'group' or 'district' from sidebar

  // Tab state
  const [activeTab, setActiveTab] = useState('eligible');

  // Eligible tab state
  const [eligible, setEligible] = useState([]);
  const [eligibleSummary, setEligibleSummary] = useState({});
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedScoreIds, setSelectedScoreIds] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Generated tab state
  const [certificates, setCertificates] = useState([]);
  const [certSummary, setCertSummary] = useState({});
  const [certMeta, setCertMeta] = useState({});
  const [certLoading, setCertLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCertIds, setSelectedCertIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Committee tab state
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [committeeSummary, setCommitteeSummary] = useState({});
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [generatingCommittee, setGeneratingCommittee] = useState(false);

  // Staff tab state (คณะกรรมการดำเนินการ)
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffSummary, setStaffSummary] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [generatingStaff, setGeneratingStaff] = useState(false);

  // Shared filters
  const [categories, setCategories] = useState([]);
  const [filterLevel, setFilterLevel] = useState(urlLevel || 'district');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMedal, setFilterMedal] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCompetition, setFilterCompetition] = useState('');
  const [competitions, setCompetitions] = useState([]);
  const [search, setSearch] = useState('');

  // Number settings state
  const [showNumberSettings, setShowNumberSettings] = useState(false);
  const [numberSettings, setNumberSettings] = useState([]);
  const [numberSettingsLoading, setNumberSettingsLoading] = useState(false);
  const [editingNumbers, setEditingNumbers] = useState({});

  // Sync filterLevel เมื่อ URL query param เปลี่ยน (เช่น กดเมนู sidebar)
  useEffect(() => {
    if (urlLevel && urlLevel !== filterLevel) {
      setFilterLevel(urlLevel);
      setSelectedScoreIds([]);
      setSelectedCertIds([]);
      setSelectedMemberIds([]);
      setSelectedStaffIds([]);
      setFilterType('');
      setFilterCompetition('');
    }
  }, [urlLevel]);

  // Load categories
  useEffect(() => {
    categoryService.getAll().then(res => {
      setCategories(res.data?.data || []);
    }).catch(() => {});
  }, []);

  // Load eligible
  const loadEligible = useCallback(async () => {
    setEligibleLoading(true);
    try {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      if (filterMedal) params.medal = filterMedal;
      const res = await certificateService.getEligible(params);
      // Filter by level on frontend (API returns competition_level)
      const allData = res.data?.data || [];
      const filtered = filterLevel ? allData.filter(e => e.competition_level === filterLevel) : allData;
      setEligible(filtered);
      // Recalculate summary for filtered data
      const filteredSummary = {
        total: filtered.length,
        gold: filtered.filter(e => e.medal === 'gold').length,
        silver: filtered.filter(e => e.medal === 'silver').length,
        bronze: filtered.filter(e => e.medal === 'bronze').length,
        participant: filtered.filter(e => e.medal === 'participant').length,
        already_generated: filtered.filter(e => e.has_certificate).length,
      };
      setEligibleSummary(filteredSummary);
    } catch {
      toast.error('ไม่สามารถโหลดรายการได้');
    } finally {
      setEligibleLoading(false);
    }
  }, [filterCategory, filterMedal, filterLevel]);

  // Load certificates
  const loadCertificates = useCallback(async () => {
    setCertLoading(true);
    try {
      const params = {};
      if (filterLevel) params.level = filterLevel;
      if (filterCategory) params.category_id = filterCategory;
      if (filterMedal) params.medal = filterMedal;
      if (filterType) params.recipient_type = filterType;
      if (filterCompetition) params.competition_id = filterCompetition;
      if (search) params.search = search;
      params.page = currentPage;
      const res = await certificateService.getAll(params);
      setCertificates(res.data?.data || []);
      setCertSummary(res.data?.summary || {});
      setCertMeta(res.data?.meta || {});
      setCompetitions(res.data?.competitions || []);
    } catch {
      toast.error('ไม่สามารถโหลดเกียรติบัตรได้');
    } finally {
      setCertLoading(false);
    }
  }, [filterLevel, filterCategory, filterMedal, filterType, filterCompetition, search, currentPage]);

  // Load committee members
  const loadCommittee = useCallback(async () => {
    setCommitteeLoading(true);
    try {
      const params = {};
      if (filterLevel) params.level = filterLevel;
      if (filterCategory) params.category_id = filterCategory;
      const res = await certificateService.getEligibleCommittee(params);
      const allData = res.data?.data || [];
      const filtered = filterLevel ? allData.filter(e => e.competition_level === filterLevel) : allData;
      setCommitteeMembers(filtered);
      setCommitteeSummary({
        total: filtered.length,
        already_generated: filtered.filter(e => e.has_certificate).length,
      });
    } catch {
      toast.error('ไม่สามารถโหลดรายการคณะกรรมการได้');
    } finally {
      setCommitteeLoading(false);
    }
  }, [filterLevel, filterCategory]);

  // Load staff members (คณะกรรมการดำเนินการ) — ไม่ผูกกิจกรรม, filter ตาม member.level
  // โหลดทั้งหมดจาก API แล้ว filter ระดับบน frontend (เหมือน eligible/committee tabs)
  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const params = {};
      // ไม่ส่ง level ไป API → โหลดทั้งหมด → filter บน frontend
      const res = await certificateService.getEligibleStaff(params);
      const allData = res.data?.data || [];
      const filtered = filterLevel ? allData.filter(e => e.level === filterLevel) : allData;
      setStaffMembers(filtered);
      setStaffSummary({
        total: filtered.length,
        already_generated: filtered.filter(e => e.has_certificate).length,
      });
    } catch {
      toast.error('ไม่สามารถโหลดรายการคณะกรรมการดำเนินการได้');
    } finally {
      setStaffLoading(false);
    }
  }, [filterLevel]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel, filterCategory, filterMedal, filterType, filterCompetition, search]);

  useEffect(() => {
    if (activeTab === 'eligible') loadEligible();
    else if (activeTab === 'committee') loadCommittee();
    else if (activeTab === 'staff') loadStaff();
    else loadCertificates();
  }, [activeTab, loadEligible, loadCertificates, loadCommittee, loadStaff]);

  // Filter eligible by search locally
  const filteredEligible = eligible.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.competition_name?.toLowerCase().includes(q) ||
      item.school_name?.toLowerCase().includes(q) ||
      item.student_names?.some(n => n.toLowerCase().includes(q))
    );
  });

  // === Eligible Tab Actions ===

  const toggleSelectScore = (id) => {
    setSelectedScoreIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ===== Number Settings =====
  const loadNumberSettings = async () => {
    setNumberSettingsLoading(true);
    try {
      const res = await certificateService.getNumberSettings();
      const all = res.data?.data || [];
      // Filter by current level
      const filtered = all.filter(s => s.level === filterLevel);
      setNumberSettings(filtered);
      // Initialize editing values
      const init = {};
      filtered.forEach(s => { init[s.id] = s.last_number; });
      setEditingNumbers(init);
    } catch {
      toast.error('ไม่สามารถโหลดการตั้งค่าเลขที่ได้');
    } finally {
      setNumberSettingsLoading(false);
    }
  };

  const handleSaveNumber = async (setting) => {
    const newVal = parseInt(editingNumbers[setting.id], 10);
    if (isNaN(newVal) || newVal < 0) {
      toast.warning('กรุณากรอกตัวเลขที่ถูกต้อง');
      return;
    }
    try {
      await certificateService.updateNumberSetting({ id: setting.id, last_number: newVal });
      toast.success(`ตั้งค่าเลขที่ ${typeLabels[setting.type] || setting.type} เป็น ${newVal} แล้ว`);
      loadNumberSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถบันทึกได้');
    }
  };

  const typeLabels = {
    student: 'นักเรียน',
    teacher: 'ครูผู้ฝึกสอน',
    committee: 'กก.ตัดสิน',
    staff: 'กก.ดำเนินการ',
  };

  const selectAllEligible = () => {
    const allIds = filteredEligible.map(e => e.score_id);
    if (selectedScoreIds.length === allIds.length) {
      setSelectedScoreIds([]);
    } else {
      setSelectedScoreIds(allIds);
    }
  };

  const handleGenerate = async () => {
    if (selectedScoreIds.length === 0) {
      toast.warning('กรุณาเลือกรายการ');
      return;
    }
    setGenerating(true);
    try {
      const res = await certificateService.generate({ score_ids: selectedScoreIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedScoreIds([]);
      loadEligible();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    const allIds = filteredEligible.map(e => e.score_id);
    if (allIds.length === 0) {
      toast.info('ไม่มีรายการที่จะสร้าง');
      return;
    }
    const alreadyGenerated = filteredEligible.filter(e => e.has_certificate).length;
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    const regenNote = alreadyGenerated > 0 ? `\n(มี ${alreadyGenerated} รายการที่จะออกใหม่)` : '';
    if (!confirm(`สร้างเกียรติบัตร ${levelLabel} ทั้งหมด ${allIds.length} รายการ?${regenNote}`)) return;
    setGenerating(true);
    try {
      const res = await certificateService.generate({ score_ids: allIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedScoreIds([]);
      loadEligible();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewScore = (scoreId) => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/certificates/preview?score_id=${scoreId}&token=${encodeURIComponent(token)}`, '_blank');
  };

  // === Generated Tab Actions ===

  const toggleSelectCert = (id) => {
    setSelectedCertIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllCerts = () => {
    if (selectedCertIds.length === certificates.length) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(certificates.map(c => c.id));
    }
  };

  const handleDownload = async (id) => {
    try {
      await certificateService.download(id);
    } catch {
      toast.error('ไม่สามารถดาวน์โหลดได้');
    }
  };

  const handleBatchDownload = async () => {
    if (selectedCertIds.length === 0) {
      toast.warning('กรุณาเลือกเกียรติบัตร');
      return;
    }
    try {
      await certificateService.batchDownload(selectedCertIds);
    } catch {
      toast.error('ไม่สามารถดาวน์โหลดได้');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบเกียรติบัตรนี้?')) return;
    try {
      await certificateService.destroy(id);
      toast.success('ลบเกียรติบัตรสำเร็จ');
      loadCertificates();
    } catch {
      toast.error('ไม่สามารถลบได้');
    }
  };

  const hasActiveFilters = filterType || filterCategory || filterMedal || filterCompetition || search;

  const handleDeleteAll = async () => {
    const total = certSummary.total || certificates.length;
    if (!confirm(`⚠️ ต้องการลบเกียรติบัตรทั้งหมด ${total} ฉบับ?\n\nเลขรันจะถูกรีเซ็ตกลับเป็น 0 ด้วย\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!`)) return;
    if (!confirm(`⚠️ ยืนยันอีกครั้ง: ลบเกียรติบัตรทั้งหมด ${total} ฉบับ?`)) return;

    setDeleting(true);
    try {
      const res = await certificateService.destroyAll();
      toast.success(res.data?.message || 'ลบเกียรติบัตรทั้งหมดสำเร็จ');
      setSelectedCertIds([]);
      loadCertificates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบเกียรติบัตรทั้งหมดได้');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFiltered = async () => {
    const params = {};
    if (filterLevel) params.level = filterLevel;
    if (filterCategory) params.category_id = filterCategory;
    if (filterMedal) params.medal = filterMedal;
    if (filterType) params.recipient_type = filterType;
    if (filterCompetition) params.competition_id = filterCompetition;
    if (search) params.search = search;

    try {
      const countRes = await certificateService.countFiltered(params);
      const count = countRes.data?.count || 0;
      if (count === 0) {
        toast.info('ไม่พบเกียรติบัตรที่ตรงกับตัวกรอง');
        return;
      }

      const filterDescs = [];
      if (filterType) filterDescs.push(`ประเภท: ${typeLabels[filterType] || filterType}`);
      if (filterMedal) filterDescs.push(`เหรียญ: ${medalLabels[filterMedal]}`);
      if (filterCategory) {
        const cat = categories.find(c => String(c.id) === String(filterCategory));
        filterDescs.push(`หมวดหมู่: ${cat?.name || filterCategory}`);
      }
      if (filterCompetition) {
        const comp = competitions.find(c => String(c.competition_id) === String(filterCompetition));
        filterDescs.push(`กิจกรรม: ${comp?.competition_name || filterCompetition}`);
      }
      if (search) filterDescs.push(`ค้นหา: "${search}"`);

      const filterText = filterDescs.length > 0 ? `\nตัวกรอง: ${filterDescs.join(', ')}` : '';

      if (!confirm(`⚠️ ต้องการลบเกียรติบัตร ${count} ฉบับ?${filterText}\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!`)) return;
      if (!confirm(`⚠️ ยืนยันอีกครั้ง: ลบเกียรติบัตร ${count} ฉบับ?`)) return;

      setDeleting(true);
      const res = await certificateService.destroyFiltered(params);
      toast.success(res.data?.message || `ลบเกียรติบัตร ${count} ฉบับ สำเร็จ`);
      setSelectedCertIds([]);
      loadCertificates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบเกียรติบัตรได้');
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewCert = (certId) => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/certificates/preview?certificate_id=${certId}&token=${encodeURIComponent(token)}`, '_blank');
  };

  // === Committee Tab Actions ===

  const filteredCommittee = committeeMembers.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.organization?.toLowerCase().includes(q) ||
      item.competition_name?.toLowerCase().includes(q) ||
      item.position?.toLowerCase().includes(q)
    );
  });

  const toggleSelectMember = (id) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllMembers = () => {
    const allIds = filteredCommittee.map(e => e.member_id);
    if (selectedMemberIds.length === allIds.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(allIds);
    }
  };

  const selectNotGeneratedMembers = () => {
    const ids = filteredCommittee.filter(e => !e.has_certificate).map(e => e.member_id);
    setSelectedMemberIds(ids);
  };

  const handleGenerateCommittee = async () => {
    if (selectedMemberIds.length === 0) {
      toast.warning('กรุณาเลือกรายการ');
      return;
    }
    setGeneratingCommittee(true);
    try {
      const res = await certificateService.generateCommittee({ member_ids: selectedMemberIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedMemberIds([]);
      loadCommittee();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGeneratingCommittee(false);
    }
  };

  const handleGenerateAllCommittee = async () => {
    const allIds = filteredCommittee.map(e => e.member_id);
    if (allIds.length === 0) {
      toast.info('ไม่มีรายการที่จะสร้าง');
      return;
    }
    const alreadyGenerated = filteredCommittee.filter(e => e.has_certificate).length;
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    const regenNote = alreadyGenerated > 0 ? `\n(มี ${alreadyGenerated} รายการที่จะออกใหม่)` : '';
    if (!confirm(`สร้างเกียรติบัตรคณะกรรมการ ${levelLabel} ทั้งหมด ${allIds.length} รายการ?${regenNote}`)) return;
    setGeneratingCommittee(true);
    try {
      const res = await certificateService.generateCommittee({ member_ids: allIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedMemberIds([]);
      loadCommittee();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGeneratingCommittee(false);
    }
  };

  // === Staff Tab Actions ===

  const filteredStaff = staffMembers.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.organization?.toLowerCase().includes(q) ||
      item.competition_name?.toLowerCase().includes(q) ||
      item.position?.toLowerCase().includes(q)
    );
  });

  const toggleSelectStaff = (id) => {
    setSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllStaff = () => {
    const allIds = filteredStaff.map(e => e.member_id);
    if (selectedStaffIds.length === allIds.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(allIds);
    }
  };

  const selectNotGeneratedStaff = () => {
    const ids = filteredStaff.filter(e => !e.has_certificate).map(e => e.member_id);
    setSelectedStaffIds(ids);
  };

  const handleGenerateStaff = async () => {
    if (selectedStaffIds.length === 0) {
      toast.warning('กรุณาเลือกรายการ');
      return;
    }
    setGeneratingStaff(true);
    try {
      const res = await certificateService.generateStaff({ member_ids: selectedStaffIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedStaffIds([]);
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGeneratingStaff(false);
    }
  };

  const handleGenerateAllStaff = async () => {
    const allIds = filteredStaff.map(e => e.member_id);
    if (allIds.length === 0) {
      toast.info('ไม่มีรายการที่จะสร้าง');
      return;
    }
    const alreadyGenerated = filteredStaff.filter(e => e.has_certificate).length;
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    const regenNote = alreadyGenerated > 0 ? `\n(มี ${alreadyGenerated} รายการที่จะออกใหม่)` : '';
    if (!confirm(`สร้างเกียรติบัตรคณะกรรมการดำเนินการ ${levelLabel} ทั้งหมด ${allIds.length} รายการ?${regenNote}`)) return;
    setGeneratingStaff(true);
    try {
      const res = await certificateService.generateStaff({ member_ids: allIds });
      toast.success(res.data?.message || 'สร้างเกียรติบัตรสำเร็จ');
      setSelectedStaffIds([]);
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setGeneratingStaff(false);
    }
  };

  // === Summary Badge ===
  const SummaryBadges = ({ summary }) => (
    <div className="flex flex-wrap gap-2 text-sm">
      {summary.total > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          ทั้งหมด {summary.total}
        </span>
      )}
      {summary.gold > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
          ทอง {summary.gold}
        </span>
      )}
      {summary.silver > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          เงิน {summary.silver}
        </span>
      )}
      {summary.bronze > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
          ทองแดง {summary.bronze}
        </span>
      )}
      {summary.participant > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          เข้าร่วม {summary.participant}
        </span>
      )}
      {summary.already_generated > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          สร้างแล้ว {summary.already_generated}
        </span>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-7 h-7 text-yellow-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {urlLevel === 'group' ? 'เกียรติบัตรระดับกลุ่ม' : urlLevel === 'district' ? 'เกียรติบัตรระดับเขต' : 'เกียรติบัตร'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('eligible')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'eligible'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ออกเกียรติบัตร
        </button>
        <button
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'committee'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          คณะกรรมการตัดสิน
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'staff'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          คณะกรรมการดำเนินการ
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'generated'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          เกียรติบัตรที่สร้างแล้ว
          {certSummary.total > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              {certSummary.total}
            </span>
          )}
        </button>
      </div>

      {/* Level Tabs — ซ่อนถ้าเข้ามาจากเมนูที่ระบุ level แล้ว */}
      {!urlLevel && (
        <div className="flex gap-2 mb-4">
          {[
            { value: 'group', label: 'ระดับกลุ่มโรงเรียน', color: 'green' },
            { value: 'district', label: 'ระดับเขตพื้นที่', color: 'blue' },
          ].map(lv => (
            <button
              key={lv.value}
              onClick={() => { setFilterLevel(lv.value); setSelectedScoreIds([]); setSelectedCertIds([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                filterLevel === lv.value
                  ? lv.color === 'green'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {lv.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, โรงเรียน, กิจกรรม..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterMedal}
            onChange={(e) => setFilterMedal(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกระดับเหรียญ</option>
            <option value="gold">เหรียญทอง</option>
            <option value="silver">เหรียญเงิน</option>
            <option value="bronze">เหรียญทองแดง</option>
            <option value="participant">เข้าร่วม</option>
          </select>
          {activeTab === 'generated' && competitions.length > 0 && (
            <select
              value={filterCompetition}
              onChange={(e) => { setFilterCompetition(e.target.value); setSelectedCertIds([]); }}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 max-w-[300px]"
            >
              <option value="">ทุกกิจกรรม</option>
              {competitions.map(c => (
                <option key={`${c.competition_id}-${c.group_name || ''}`} value={c.competition_id}>
                  {c.competition_name}{c.group_name ? ` (${c.group_name})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Type badge filter row */}
        {activeTab === 'generated' && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t items-center">
            <span className="text-xs text-gray-500 mr-1">ประเภท:</span>
            {[
              { value: '', label: 'ทั้งหมด', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', activeBg: 'bg-gray-700', count: certSummary.student + certSummary.teacher + certSummary.committee + certSummary.staff },
              { value: 'student', label: 'นักเรียน', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', activeBg: 'bg-blue-600', count: certSummary.student },
              { value: 'teacher', label: 'ครูผู้ฝึกสอน', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', activeBg: 'bg-green-600', count: certSummary.teacher },
              { value: 'committee', label: 'กก.ตัดสิน', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', activeBg: 'bg-purple-600', count: certSummary.committee },
              { value: 'staff', label: 'กก.ดำเนินการ', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', activeBg: 'bg-teal-600', count: certSummary.staff },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => { setFilterType(type.value); setSelectedCertIds([]); setFilterCompetition(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filterType === type.value
                    ? `${type.activeBg} text-white border-transparent`
                    : `${type.bg} ${type.text} ${type.border} hover:opacity-80`
                }`}
              >
                {type.label} {type.count != null && !isNaN(type.count) ? type.count : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =================== ELIGIBLE TAB =================== */}
      {activeTab === 'eligible' && (
        <div>
          {/* Summary + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SummaryBadges summary={eligibleSummary} />
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating || selectedScoreIds.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                สร้างที่เลือก ({selectedScoreIds.length})
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                สร้างทั้งหมด
              </button>
              {(user?.role === 'admin' || user?.role === 'district_admin') && (
                <button
                  onClick={() => { setShowNumberSettings(true); loadNumberSettings(); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 border border-gray-300"
                  title="ตั้งค่าเลขที่เอกสาร"
                >
                  <Settings className="w-4 h-4" />
                  เลขที่
                </button>
              )}
            </div>
          </div>

          {/* Number Settings Modal */}
          {showNumberSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    ตั้งค่าเลขที่เอกสาร ({filterLevel === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'})
                  </h3>
                  <button onClick={() => setShowNumberSettings(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    ตั้งค่าเลขรันปัจจุบัน — เกียรติบัตรฉบับถัดไปจะใช้เลขที่ต่อจากค่านี้
                    <br /><span className="text-orange-600 font-medium">เช่น ตั้งเป็น 0 = เกียรติบัตรฉบับถัดไปจะเริ่มที่ 1</span>
                  </p>
                  {numberSettingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : numberSettings.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">ยังไม่มีข้อมูล (จะสร้างอัตโนมัติเมื่อออกเกียรติบัตรครั้งแรก)</p>
                  ) : (
                    <div className="space-y-3">
                      {numberSettings.map(setting => (
                        <div key={setting.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">
                              {typeLabels[setting.type] || setting.type}
                            </div>
                            <div className="text-xs text-gray-400">
                              {setting.prefix} | ปี {setting.year}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">เลขปัจจุบัน:</span>
                            <input
                              type="number"
                              min="0"
                              value={editingNumbers[setting.id] ?? setting.last_number}
                              onChange={(e) => setEditingNumbers(prev => ({ ...prev, [setting.id]: e.target.value }))}
                              className="w-24 border rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSaveNumber(setting)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl flex justify-end">
                  <button
                    onClick={() => setShowNumberSettings(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {eligibleLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">กำลังโหลด...</span>
              </div>
            ) : filteredEligible.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                ไม่พบรายการที่มีสิทธิ์ออกเกียรติบัตร
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">
                        <button onClick={selectAllEligible}>
                          {selectedScoreIds.length === filteredEligible.length && filteredEligible.length > 0
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">กิจกรรม</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">โรงเรียน</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ผู้เข้าแข่งขัน</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">คะแนน</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">เหรียญ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">อันดับ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">สถานะ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600 w-20">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEligible.map((item) => (
                      <tr key={item.score_id} className={`hover:bg-gray-50 ${item.has_certificate ? 'bg-green-50/50' : ''}`}>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => toggleSelectScore(item.score_id)}>
                            {selectedScoreIds.includes(item.score_id)
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{item.competition_name}</div>
                          <div className="text-xs text-gray-500">
                            {item.category_name} | {item.competition_level === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'}
                            {item.group_name && <span className="text-blue-600 font-medium"> | {item.group_name}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-[150px]">{item.school_name}</td>
                        <td className="px-3 py-2">
                          <div className="text-gray-800 text-xs">
                            <div><span className="text-blue-600 font-medium">นร.</span> {item.student_names?.join(', ') || '-'}</div>
                            {item.teacher_names?.length > 0 && (
                              <div className="mt-0.5"><span className="text-green-600 font-medium">คร.</span> {item.teacher_names.join(', ')}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.score ?? '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${medalColors[item.medal] || 'bg-gray-100'}`}>
                            {medalLabels[item.medal] || item.medal}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.rank ?? '-'}</td>
                        <td className="px-3 py-2 text-center">
                          {item.has_certificate ? (
                            <span className={`text-xs font-medium ${selectedScoreIds.includes(item.score_id) ? 'text-orange-600' : 'text-green-600'}`}>
                              {selectedScoreIds.includes(item.score_id) ? 'ออกใหม่' : 'สร้างแล้ว'} {item.certificate_count > 0 ? `(${item.certificate_count})` : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              รอสร้าง ({item.total_persons || 0} คน)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handlePreviewScore(item.score_id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                            title="ดูตัวอย่าง"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== COMMITTEE TAB =================== */}
      {activeTab === 'committee' && (
        <div>
          {/* Summary + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 text-sm">
              {committeeSummary.total > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  ทั้งหมด {committeeSummary.total}
                </span>
              )}
              {committeeSummary.already_generated > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  สร้างแล้ว {committeeSummary.already_generated}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={selectNotGeneratedMembers}
                disabled={generatingCommittee}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" />
                เลือกที่ยังไม่สร้าง ({filteredCommittee.filter(e => !e.has_certificate).length})
              </button>
              <button
                onClick={handleGenerateCommittee}
                disabled={generatingCommittee || selectedMemberIds.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingCommittee ? <Loader className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                สร้างที่เลือก ({selectedMemberIds.length})
              </button>
              <button
                onClick={handleGenerateAllCommittee}
                disabled={generatingCommittee}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                สร้างทั้งหมด
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {committeeLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-500">กำลังโหลด...</span>
              </div>
            ) : filteredCommittee.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                ไม่พบรายการคณะกรรมการตัดสิน
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">
                        <button onClick={selectAllMembers}>
                          {selectedMemberIds.length === filteredCommittee.length && filteredCommittee.length > 0
                            ? <CheckSquare className="w-4 h-4 text-purple-600" />
                            : <Square className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ชื่อ-สกุล</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ตำแหน่ง</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">หน่วยงาน</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">กิจกรรม</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">หมวดหมู่</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredCommittee.map((item) => (
                      <tr key={`${item.member_id}-${item.competition_id}`} className={`hover:bg-gray-50 ${item.has_certificate ? 'bg-green-50/50' : ''}`}>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => toggleSelectMember(item.member_id)}>
                            {selectedMemberIds.includes(item.member_id)
                              ? <CheckSquare className="w-4 h-4 text-purple-600" />
                              : <Square className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{item.position || '-'}</td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-[150px]">{item.organization || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{item.competition_name}</div>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{item.category_name}</td>
                        <td className="px-3 py-2 text-center">
                          {item.has_certificate ? (
                            <span className={`text-xs font-medium ${selectedMemberIds.includes(item.member_id) ? 'text-orange-600' : 'text-green-600'}`}>
                              {selectedMemberIds.includes(item.member_id) ? 'ออกใหม่' : 'สร้างแล้ว'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">รอสร้าง</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== STAFF TAB =================== */}
      {activeTab === 'staff' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 text-sm">
              {staffSummary.total > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  ทั้งหมด {staffSummary.total}
                </span>
              )}
              {staffSummary.already_generated > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  สร้างแล้ว {staffSummary.already_generated}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={selectNotGeneratedStaff}
                disabled={generatingStaff}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" />
                เลือกที่ยังไม่สร้าง ({filteredStaff.filter(e => !e.has_certificate).length})
              </button>
              <button
                onClick={handleGenerateStaff}
                disabled={generatingStaff || selectedStaffIds.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingStaff ? <Loader className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                สร้างที่เลือก ({selectedStaffIds.length})
              </button>
              <button
                onClick={handleGenerateAllStaff}
                disabled={generatingStaff}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                สร้างทั้งหมด
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            {staffLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 animate-spin text-teal-500" />
                <span className="ml-2 text-gray-500">กำลังโหลด...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                ไม่พบรายการคณะกรรมการดำเนินการ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">
                        <button onClick={selectAllStaff}>
                          {selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0
                            ? <CheckSquare className="w-4 h-4 text-teal-600" />
                            : <Square className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ชื่อ-สกุล</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ตำแหน่ง</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">หน่วยงาน</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">ระดับ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStaff.map((item) => (
                      <tr key={item.member_id} className={`hover:bg-gray-50 ${item.has_certificate ? 'bg-green-50/50' : ''}`}>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => toggleSelectStaff(item.member_id)}>
                            {selectedStaffIds.includes(item.member_id)
                              ? <CheckSquare className="w-4 h-4 text-teal-600" />
                              : <Square className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{item.position || '-'}</td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-[200px]">{item.organization || '-'}</td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{item.level === 'district' ? 'เขต' : 'กลุ่ม'}</td>
                        <td className="px-3 py-2 text-center">
                          {item.has_certificate ? (
                            <span className={`text-xs font-medium ${selectedStaffIds.includes(item.member_id) ? 'text-orange-600' : 'text-green-600'}`}>
                              {selectedStaffIds.includes(item.member_id) ? 'ออกใหม่' : 'สร้างแล้ว'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">รอสร้าง</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== GENERATED TAB =================== */}
      {activeTab === 'generated' && (
        <div>
          {/* Summary + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SummaryBadges summary={certSummary} />
            <div className="flex gap-2">
              <button
                onClick={handleBatchDownload}
                disabled={selectedCertIds.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4" />
                ดาวน์โหลดที่เลือก ({selectedCertIds.length})
              </button>
              <button
                onClick={hasActiveFilters ? handleDeleteFiltered : handleDeleteAll}
                disabled={deleting || certificates.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {hasActiveFilters ? 'ลบตามตัวกรอง' : 'ลบทั้งหมด'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {certLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">กำลังโหลด...</span>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                ยังไม่มีเกียรติบัตรที่สร้างแล้ว
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">
                        <button onClick={selectAllCerts}>
                          {selectedCertIds.length === certificates.length && certificates.length > 0
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">เลขที่</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">กิจกรรม</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">ผู้รับเกียรติบัตร</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-600">โรงเรียน</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">ประเภท</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">เหรียญ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600">อันดับ</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600 w-32">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => toggleSelectCert(cert.id)}>
                            {selectedCertIds.includes(cert.id)
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs font-medium text-gray-800">{cert.document_number || '-'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{cert.certificate_code}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{cert.competition_name}</div>
                          {(cert.category_name || cert.group_name) && (
                            <div className="text-xs text-gray-500">
                              {cert.category_name}
                              {cert.group_name && <span className="text-blue-600 font-medium"> | {cert.group_name}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700 text-xs max-w-[200px]">
                          {cert.recipient_name || cert.student_name}
                        </td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-[150px]">{cert.school_name}</td>
                        <td className="px-3 py-2 text-center">
                          {(cert.recipient_type || 'student') === 'committee' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">กก.ตัดสิน</span>
                          ) : (cert.recipient_type || 'student') === 'staff' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-300">กก.ดำเนินการ</span>
                          ) : (cert.recipient_type || 'student') === 'teacher' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">ครู</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">นักเรียน</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {cert.medal ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${medalColors[cert.medal] || 'bg-gray-100'}`}>
                              {medalLabels[cert.medal] || cert.medal}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">{cert.rank ?? '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePreviewCert(cert.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                              title="ดูตัวอย่าง"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(cert.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600"
                              title="ดาวน์โหลด"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cert.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
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
            )}
          </div>

          {/* Pagination */}
          {certMeta.total > 0 && (
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-500">
                หน้า {certMeta.current_page || 1} / {certMeta.last_page || 1} — แสดง {certificates.length} จาก {certMeta.total} รายการ
              </div>
              {(certMeta.last_page || 1) > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-gray-100"
                  >«</button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-gray-100"
                  >‹ ก่อนหน้า</button>
                  {(() => {
                    const last = certMeta.last_page || 1;
                    const pages = [];
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(last, currentPage + 2);
                    if (end - start < 4) {
                      start = Math.max(1, end - 4);
                      end = Math.min(last, start + 4);
                    }
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2 py-1 text-xs rounded border ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
                      >{p}</button>
                    ));
                  })()}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(certMeta.last_page || 1, p + 1))}
                    disabled={currentPage >= (certMeta.last_page || 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-gray-100"
                  >ถัดไป ›</button>
                  <button
                    onClick={() => setCurrentPage(certMeta.last_page || 1)}
                    disabled={currentPage >= (certMeta.last_page || 1)}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-gray-100"
                  >»</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
