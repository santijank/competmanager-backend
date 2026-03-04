import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Award, Download, Eye, Trash2, Loader,
  CheckSquare, Square, Filter, FileDown, ChevronDown, Users,
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
  const [search, setSearch] = useState('');

  // Sync filterLevel เมื่อ URL query param เปลี่ยน (เช่น กดเมนู sidebar)
  useEffect(() => {
    if (urlLevel && urlLevel !== filterLevel) {
      setFilterLevel(urlLevel);
      setSelectedScoreIds([]);
      setSelectedCertIds([]);
      setSelectedMemberIds([]);
      setSelectedStaffIds([]);
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
      if (search) params.search = search;
      const res = await certificateService.getAll(params);
      setCertificates(res.data?.data || []);
      setCertSummary(res.data?.summary || {});
      setCertMeta(res.data?.meta || {});
    } catch {
      toast.error('ไม่สามารถโหลดเกียรติบัตรได้');
    } finally {
      setCertLoading(false);
    }
  }, [filterLevel, filterCategory, filterMedal, search]);

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
  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const params = {};
      if (filterLevel) params.level = filterLevel;
      const res = await certificateService.getEligibleStaff(params);
      const allData = res.data?.data || [];
      setStaffMembers(allData);
      setStaffSummary(res.data?.summary || {
        total: allData.length,
        already_generated: allData.filter(e => e.has_certificate).length,
      });
    } catch {
      toast.error('ไม่สามารถโหลดรายการคณะกรรมการดำเนินการได้');
    } finally {
      setStaffLoading(false);
    }
  }, [filterLevel]);

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

  const selectAllEligible = () => {
    const notGenerated = filteredEligible.filter(e => !e.has_certificate).map(e => e.score_id);
    if (selectedScoreIds.length === notGenerated.length) {
      setSelectedScoreIds([]);
    } else {
      setSelectedScoreIds(notGenerated);
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
    const notGenerated = filteredEligible.filter(e => !e.has_certificate).map(e => e.score_id);
    if (notGenerated.length === 0) {
      toast.info('สร้างเกียรติบัตรครบแล้ว');
      return;
    }
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    if (!confirm(`สร้างเกียรติบัตร ${levelLabel} ทั้งหมด ${notGenerated.length} รายการ?`)) return;
    setGenerating(true);
    try {
      const res = await certificateService.generate({ score_ids: notGenerated });
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
    window.open(`${baseUrl}/certificates/preview?score_id=${scoreId}&token=${token}`, '_blank');
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

  const handlePreviewCert = (certId) => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/certificates/preview?certificate_id=${certId}&token=${token}`, '_blank');
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
    const notGenerated = filteredCommittee.filter(e => !e.has_certificate).map(e => e.member_id);
    if (selectedMemberIds.length === notGenerated.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(notGenerated);
    }
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
    const notGenerated = filteredCommittee.filter(e => !e.has_certificate).map(e => e.member_id);
    if (notGenerated.length === 0) {
      toast.info('สร้างเกียรติบัตรครบแล้ว');
      return;
    }
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    if (!confirm(`สร้างเกียรติบัตรคณะกรรมการ ${levelLabel} ทั้งหมด ${notGenerated.length} รายการ?`)) return;
    setGeneratingCommittee(true);
    try {
      const res = await certificateService.generateCommittee({ member_ids: notGenerated });
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
    const notGenerated = filteredStaff.filter(e => !e.has_certificate).map(e => e.member_id);
    if (selectedStaffIds.length === notGenerated.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(notGenerated);
    }
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
    const notGenerated = filteredStaff.filter(e => !e.has_certificate).map(e => e.member_id);
    if (notGenerated.length === 0) {
      toast.info('สร้างเกียรติบัตรครบแล้ว');
      return;
    }
    const levelLabel = filterLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';
    if (!confirm(`สร้างเกียรติบัตรคณะกรรมการดำเนินการ ${levelLabel} ทั้งหมด ${notGenerated.length} รายการ?`)) return;
    setGeneratingStaff(true);
    try {
      const res = await certificateService.generateStaff({ member_ids: notGenerated });
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
        </div>
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
            </div>
          </div>

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
                          {selectedScoreIds.length === filteredEligible.filter(e => !e.has_certificate).length && filteredEligible.filter(e => !e.has_certificate).length > 0
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
                          {item.has_certificate ? (
                            <span className="text-green-500 text-xs font-medium">&#10003;</span>
                          ) : (
                            <button onClick={() => toggleSelectScore(item.score_id)}>
                              {selectedScoreIds.includes(item.score_id)
                                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                : <Square className="w-4 h-4 text-gray-400" />
                              }
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{item.competition_name}</div>
                          <div className="text-xs text-gray-500">{item.category_name} | {item.competition_level === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'}</div>
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
                            <span className="text-xs text-green-600 font-medium">
                              สร้างแล้ว {item.certificate_count > 0 ? `(${item.certificate_count} ฉบับ)` : ''}
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
            <div className="flex gap-2">
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
                          {selectedMemberIds.length === filteredCommittee.filter(e => !e.has_certificate).length && filteredCommittee.filter(e => !e.has_certificate).length > 0
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
                          {item.has_certificate ? (
                            <span className="text-green-500 text-xs font-medium">&#10003;</span>
                          ) : (
                            <button onClick={() => toggleSelectMember(item.member_id)}>
                              {selectedMemberIds.includes(item.member_id)
                                ? <CheckSquare className="w-4 h-4 text-purple-600" />
                                : <Square className="w-4 h-4 text-gray-400" />
                              }
                            </button>
                          )}
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
                            <span className="text-xs text-green-600 font-medium">สร้างแล้ว</span>
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
            <div className="flex gap-2">
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
                          {selectedStaffIds.length === filteredStaff.filter(e => !e.has_certificate).length && filteredStaff.filter(e => !e.has_certificate).length > 0
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
                          {item.has_certificate ? (
                            <span className="text-green-500 text-xs font-medium">&#10003;</span>
                          ) : (
                            <button onClick={() => toggleSelectStaff(item.member_id)}>
                              {selectedStaffIds.includes(item.member_id)
                                ? <CheckSquare className="w-4 h-4 text-teal-600" />
                                : <Square className="w-4 h-4 text-gray-400" />
                              }
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{item.position || '-'}</td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-[200px]">{item.organization || '-'}</td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{item.level === 'district' ? 'เขต' : 'กลุ่ม'}</td>
                        <td className="px-3 py-2 text-center">
                          {item.has_certificate ? (
                            <span className="text-xs text-green-600 font-medium">สร้างแล้ว</span>
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
                onClick={handleDeleteAll}
                disabled={deleting || certificates.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                ลบทั้งหมด
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
                          {cert.category_name && (
                            <div className="text-xs text-gray-500">{cert.category_name}</div>
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

          {/* Pagination info */}
          {certMeta.total > 0 && (
            <div className="text-xs text-gray-500 mt-2 text-right">
              แสดง {certificates.length} จาก {certMeta.total} รายการ
            </div>
          )}
        </div>
      )}
    </div>
  );
}
