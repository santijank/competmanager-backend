import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Download,
  Edit2,
  Building2,
  Globe,
  Layers,
  Trash2,
  CheckCheck
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import RegistrationApprovalModal from '@/components/registrations/RegistrationApprovalModal';
import EditRegistrationModal from '@/components/registrations/EditRegistrationModal';
import DocumentButtons from '@/components/documents/DocumentButtons';
import documentService from '@/services/documentService';
import ResetRegistrationsModal from '@/components/registrations/ResetRegistrationsModal';
import ConfirmModal from '@/components/common/ConfirmModal';

const RegistrationManagement = () => {
  const { user, isDistrictAdmin, isGroupAdmin } = useAuthStore();

  const [registrations, setRegistrations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // ✅ category-scoped roles
  const isCategoryScoped = ['category_admin', 'data_entry'].includes(user?.role);

  // ✅ Tab สำหรับ District Admin แยกระดับ (เก็บค่าใน localStorage)
  // category_admin/data_entry เริ่มต้นที่ district เสมอ
  const [activeLevel, setActiveLevelState] = useState(() => {
    if (isCategoryScoped) return 'district';
    return localStorage.getItem('reg_activeLevel') || 'group';
  });
  const setActiveLevel = (level) => {
    localStorage.setItem('reg_activeLevel', level);
    setActiveLevelState(level);
  };

  // ✅ Filter สำหรับเลือกกลุ่ม (district admin)
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  // State สำหรับออกเอกสาร
  const [competitions, setCompetitions] = useState([]);
  const [competitionsByCategory, setCompetitionsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompetitionForDoc, setSelectedCompetitionForDoc] = useState(null);
  const [loadingStaffPdf, setLoadingStaffPdf] = useState(false);
  const [showDocumentSection, setShowDocumentSection] = useState(false);
  const [batchLoading, setBatchLoading] = useState({
    student: false, teacher: false, summary: false,
    committee: false, scoreSheet: false, coverSheet: false,
  });
  const [batchAllLoading, setBatchAllLoading] = useState({
    student: false, teacher: false, summary: false,
    committee: false, scoreSheet: false, coverSheet: false,
  });
  const [showExportAllDropdown, setShowExportAllDropdown] = useState(false);
  const exportAllDropdownRef = useRef(null);
  const [categoryOverviewLoading, setCategoryOverviewLoading] = useState(false);
  const [batchAllProgress, setBatchAllProgress] = useState({
    isRunning: false,
    currentCategory: '',
    currentIndex: 0,
    totalCategories: 0,
    completedCategories: [],
    failedCategories: [],
  });

  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // ✅ State สำหรับอนุมัติทั้งหมด
  const [bulkApproving, setBulkApproving] = useState(false);

  // ✅ State สำหรับ ConfirmModal (แทน window.confirm ที่ถูก block ใน sandboxed env)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    variant: 'danger',
    onConfirm: null,
  });

  useEffect(() => {
    // โหลดรายชื่อกลุ่มสำหรับ District Admin
    if (isDistrictAdmin()) {
      loadSchoolGroups();
    }
  }, []);

  useEffect(() => {
    loadData();
    loadCompetitionsWithApprovedRegistrations();
  }, [filters, activeLevel, selectedGroupId]);

  // Click-outside เพื่อปิด dropdown ออกเอกสารทุกหมวด
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportAllDropdownRef.current && !exportAllDropdownRef.current.contains(event.target)) {
        setShowExportAllDropdown(false);
      }
    };
    if (showExportAllDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportAllDropdown]);

  const loadSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      if (response.data.success) {
        setSchoolGroups(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load school groups:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const params = {
        ...filters,
        paginate: false
      };

      // ✅ เพิ่ม filter ตาม level สำหรับทุก role ที่มี tab
      if (isDistrictAdmin() || isGroupAdmin()) {
        params.competition_level = activeLevel;
      }
      // category-scoped users ดูเฉพาะระดับเขต (backend กรอง category ให้แล้ว)
      if (isCategoryScoped) {
        params.competition_level = 'district';
      }

      if (isDistrictAdmin()) {
        // ถ้าเลือกดูระดับกลุ่ม และเลือกกลุ่มเฉพาะ
        if (activeLevel === 'group' && selectedGroupId !== 'all') {
          params.school_group_id = selectedGroupId;
        }
      }

      const regResponse = await api.get('/registrations', { params });

      const regData = regResponse.data.data?.data || regResponse.data.data || regResponse.data || [];
      setRegistrations(Array.isArray(regData) ? regData : []);

      const statsResponse = await api.get('/registrations/statistics', { params });
      setStatistics(statsResponse.data.data);

    } catch (error) {
      console.error('Load data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // โหลด competitions ที่มี approved registrations เท่านั้น
  // ดาวน์โหลด PDF คณะกรรมการดำเนินงาน (ทั้งหมดในกลุ่ม ไม่ต้องเลือกกิจกรรม)
  const handleDownloadStaffPdf = async () => {
    try {
      setLoadingStaffPdf(true);
      toast.info('กำลังสร้าง PDF คณะกรรมการดำเนินงาน...');

      const response = await api.get('/committee-members/staff-pdf', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ลงทะเบียนคณะกรรมการดำเนินงาน_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลด PDF สำเร็จ');
    } catch (error) {
      console.error('Download Staff PDF error:', error);
      toast.error('ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setLoadingStaffPdf(false);
    }
  };

  const loadCompetitionsWithApprovedRegistrations = async () => {
    try {
      const params = { paginate: false };

      if (isDistrictAdmin() || isGroupAdmin()) {
        params.competition_level = activeLevel;
      }
      if (isCategoryScoped) {
        params.competition_level = 'district';
      }
      if (isDistrictAdmin() && activeLevel === 'group' && selectedGroupId !== 'all') {
        params.school_group_id = selectedGroupId;
      }

      const regResponse = await api.get('/registrations', { params });

      const allRegs = regResponse.data.data?.data || regResponse.data.data || regResponse.data || [];

      // กรองเฉพาะ approved
      const approvedRegs = allRegs.filter(reg => reg.status === 'approved');

      // ดึง competitions จาก registrations โดยตรง
      const competitionsMap = new Map();

      approvedRegs.forEach(reg => {
        if (reg.competition && reg.competition.id) {
          const comp = reg.competition;
          if (!competitionsMap.has(comp.id)) {
            competitionsMap.set(comp.id, comp);
          }
        }
      });

      const filteredCompetitions = Array.from(competitionsMap.values());
      setCompetitions(filteredCompetitions);

      // จัดกลุ่มตาม category
      const grouped = filteredCompetitions.reduce((acc, comp) => {
        const categoryId = comp.category_id || 0;
        const categoryName = comp.category?.name || 'ไม่มีหมวดหมู่';

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            competitions: []
          };
        }

        acc[categoryId].competitions.push(comp);
        return acc;
      }, {});

      setCompetitionsByCategory(grouped);

    } catch (error) {
      console.error('Load competitions error:', error);
    }
  };

  // Helper: แยกระดับประถม/มัธยม
  const getEducationLevel = (level) => {
    if (!level) return 'other';
    if (level.includes('ป.')) return 'primary';
    if (level.includes('ม.')) return 'secondary';
    return 'other';
  };

  const getEducationLevelLabel = (eduLevel) => {
    if (eduLevel === 'primary') return 'ระดับประถมศึกษา';
    if (eduLevel === 'secondary') return 'ระดับมัธยมศึกษา';
    return 'อื่นๆ';
  };

  // Batch export handler
  const handleBatchExport = async (type, typeKey) => {
    if (!selectedCategory) return;
    setBatchLoading(prev => ({ ...prev, [typeKey]: true }));
    try {
      toast.info('กำลังสร้างเอกสารแบบรวม กรุณารอสักครู่...');
      const blob = await documentService.batchExport(parseInt(selectedCategory), type);
      const categoryName = competitionsByCategory[selectedCategory]?.name || 'export';
      const typeNames = {
        'student-checkin': 'ลงทะเบียนนักเรียน',
        'teacher-checkin': 'ลงทะเบียนครู',
        'summary': 'สรุปผู้เข้าแข่ง',
        'committee-checkin': 'ลงทะเบียนกรรมการ',
        'score-sheet': 'ใบลงคะแนน',
        'cover-sheet': 'ใบปะหน้าซอง',
      };
      documentService.downloadPDF(blob, `${typeNames[type]}_${categoryName}_รวม.pdf`);
      toast.success('สร้างเอกสารสำเร็จ');
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('ไม่สามารถสร้างเอกสารแบบรวมได้');
    } finally {
      setBatchLoading(prev => ({ ...prev, [typeKey]: false }));
    }
  };

  // Batch export ALL categories handler — วนลูปทีละหมวด พร้อม progress bar
  const handleBatchExportAll = async (type, typeKey) => {
    const categoryIds = Object.keys(competitionsByCategory);
    if (categoryIds.length === 0) {
      toast.warning('ไม่พบหมวดหมู่ที่มีกิจกรรม');
      return;
    }

    const typeNames = {
      'student-checkin': 'ลงทะเบียนนักเรียน',
      'teacher-checkin': 'ลงทะเบียนครู',
      'summary': 'สรุปผู้เข้าแข่ง',
      'committee-checkin': 'ลงทะเบียนกรรมการ',
      'score-sheet': 'ใบลงคะแนน',
      'cover-sheet': 'ใบปะหน้าซอง',
    };

    setBatchAllLoading(prev => ({ ...prev, [typeKey]: true }));
    setBatchAllProgress({
      isRunning: true,
      currentCategory: '',
      currentIndex: 0,
      totalCategories: categoryIds.length,
      completedCategories: [],
      failedCategories: [],
    });

    const completed = [];
    const failed = [];

    for (let i = 0; i < categoryIds.length; i++) {
      const catId = categoryIds[i];
      const categoryName = competitionsByCategory[catId]?.name || `หมวด ${catId}`;

      setBatchAllProgress(prev => ({
        ...prev,
        currentCategory: categoryName,
        currentIndex: i + 1,
      }));

      try {
        const blob = await documentService.batchExport(parseInt(catId), type);
        documentService.downloadPDF(blob, `${typeNames[type]}_${categoryName}_รวม.pdf`);
        completed.push(categoryName);
        setBatchAllProgress(prev => ({
          ...prev,
          completedCategories: [...prev.completedCategories, categoryName],
        }));
      } catch (error) {
        console.error(`Batch export failed for ${categoryName}:`, error);
        failed.push(categoryName);
        setBatchAllProgress(prev => ({
          ...prev,
          failedCategories: [...prev.failedCategories, categoryName],
        }));
      }

      // หน่วง 1.5 วินาทีระหว่างไฟล์ กันเบราว์เซอร์บล็อคดาวน์โหลด
      if (i < categoryIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // สรุปผล
    if (failed.length === 0) {
      toast.success(`สร้างเอกสารสำเร็จทั้งหมด ${completed.length} หมวด`);
    } else {
      toast.warning(`สำเร็จ ${completed.length} หมวด, ล้มเหลว ${failed.length} หมวด: ${failed.join(', ')}`);
    }

    setBatchAllLoading(prev => ({ ...prev, [typeKey]: false }));
    setBatchAllProgress(prev => ({ ...prev, isRunning: false }));
  };

  // Generate Category Overview PDF
  const handleCategoryOverview = async () => {
    setCategoryOverviewLoading(true);
    try {
      toast.info('กำลังสร้าง PDF สรุปหมวดหมู่...');
      const blob = await documentService.generateCategoryOverview();
      documentService.downloadPDF(blob, `สรุปหมวดหมู่การแข่งขัน_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('สร้างเอกสารสำเร็จ');
    } catch (error) {
      console.error('Category overview error:', error);
      toast.error('ไม่สามารถสร้างเอกสารสรุปหมวดหมู่ได้');
    } finally {
      setCategoryOverviewLoading(false);
    }
  };

  const handleApprove = (registration) => {
    setSelectedRegistration(registration);
    setActionType('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (registration) => {
    setSelectedRegistration(registration);
    setActionType('reject');
    setShowApprovalModal(true);
  };

  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadData();
  };

  const handleApprovalSubmit = async (data) => {
    try {
      let response;

      if (actionType === 'approve') {
        response = await api.post(`/registrations/${selectedRegistration.id}/approve`);
      } else {
        response = await api.post(`/registrations/${selectedRegistration.id}/reject`, {
          rejection_reason: data.rejection_reason
        });
      }

      if (response.data.success) {
        toast.success(
          actionType === 'approve'
            ? 'อนุมัติการลงทะเบียนสำเร็จ'
            : 'ปฏิเสธการลงทะเบียนสำเร็จ'
        );
        setShowApprovalModal(false);
        setSelectedRegistration(null);
        loadData();
        loadCompetitionsWithApprovedRegistrations();
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // ✅ ลบการลงทะเบียน (สำหรับ Group Admin และ District Admin)
  const handleDelete = (registration) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: `คุณต้องการลบการลงทะเบียน "${registration.competition?.name}" ของ "${registration.school?.name}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!`,
      confirmText: 'ลบ',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await api.delete(`/registrations/${registration.id}`);
          if (response.data.success) {
            toast.success('ลบการลงทะเบียนสำเร็จ');
            loadData();
            loadCompetitionsWithApprovedRegistrations();
          } else {
            toast.error(response.data.message || 'ไม่สามารถลบได้');
          }
        } catch (error) {
          console.error('Delete registration error:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
        }
      },
    });
  };

  // ✅ อนุมัติทั้งหมดที่รอการอนุมัติ
  const handleBulkApprove = () => {
    const pendingRegistrations = registrations.filter(reg => reg.status === 'pending');

    if (pendingRegistrations.length === 0) {
      toast.info('ไม่มีรายการที่รอการอนุมัติ');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการอนุมัติทั้งหมด',
      message: `ต้องการอนุมัติทั้งหมด ${pendingRegistrations.length} รายการหรือไม่?`,
      confirmText: 'อนุมัติทั้งหมด',
      variant: 'info',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setBulkApproving(true);
          const registrationIds = pendingRegistrations.map(reg => reg.id);
          const response = await api.post('/registrations/bulk-approve', {
            registration_ids: registrationIds
          });

          if (response.data.success) {
            toast.success(response.data.message || `อนุมัติสำเร็จ ${response.data.approved_count} รายการ`);
            if (response.data.errors && response.data.errors.length > 0) {
              response.data.errors.forEach(err => toast.warning(err));
            }
            loadData();
            loadCompetitionsWithApprovedRegistrations();
          } else {
            toast.error(response.data.message || 'เกิดข้อผิดพลาด');
          }
        } catch (error) {
          console.error('Bulk approve error:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
        } finally {
          setBulkApproving(false);
        }
      },
    });
  };

  // ✅ จัดกลุ่ม registrations ตาม category > competition
  const groupedByCategoryAndCompetition = registrations.reduce((acc, reg) => {
    const categoryId = reg.competition?.category_id || 0;
    const categoryName = reg.competition?.category?.name || 'ไม่มีหมวดหมู่';
    const competitionId = reg.competition?.id || 0;
    const competitionName = reg.competition?.name || 'ไม่ระบุกิจกรรม';

    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        competitions: {},
        totalRegistrations: 0
      };
    }

    if (!acc[categoryId].competitions[competitionId]) {
      acc[categoryId].competitions[competitionId] = {
        id: competitionId,
        name: competitionName,
        competition: reg.competition,
        registrations: []
      };
    }

    acc[categoryId].competitions[competitionId].registrations.push(reg);
    acc[categoryId].totalRegistrations++;
    return acc;
  }, {});

  // ✅ สำหรับ District Admin - จัดกลุ่มตาม school_group > competition
  const groupedBySchoolGroupAndCompetition = registrations.reduce((acc, reg) => {
    const groupId = reg.competition?.school_group_id || 0;
    const groupName = reg.competition?.school_group?.name ||
                     schoolGroups.find(g => g.id === groupId)?.name ||
                     'ไม่ระบุกลุ่ม';
    const competitionId = reg.competition?.id || 0;
    const competitionName = reg.competition?.name || 'ไม่ระบุกิจกรรม';

    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        name: groupName,
        competitions: {},
        totalRegistrations: 0
      };
    }

    if (!acc[groupId].competitions[competitionId]) {
      acc[groupId].competitions[competitionId] = {
        id: competitionId,
        name: competitionName,
        competition: reg.competition,
        registrations: []
      };
    }

    acc[groupId].competitions[competitionId].registrations.push(reg);
    acc[groupId].totalRegistrations++;
    return acc;
  }, {});

  const categories = Object.values(groupedByCategoryAndCompetition);
  const schoolGroupCategories = Object.values(groupedBySchoolGroupAndCompetition);

  // Get competitions for selected category
  const competitionsForSelectedCategory = selectedCategory
    ? competitionsByCategory[selectedCategory]?.competitions || []
    : [];

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'รอการอนุมัติ' },
      approved: { color: 'bg-green-100 text-green-800', text: 'อนุมัติแล้ว' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'ไม่อนุมัติ' },
    };

    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    if (level === 'district') {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Globe className="w-3 h-3" />
          ระดับเขต
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
        <Building2 className="w-3 h-3" />
        ระดับกลุ่ม
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                จัดการการลงทะเบียน
              </h1>
              <p className="text-gray-600 mt-2">
                อนุมัติ/ปฏิเสธการลงทะเบียนการแข่งขัน
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDocumentSection(!showDocumentSection)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ออกเอกสาร</span>
              </button>

              {/* ปุ่มออกเอกสารทุกหมวด - Dropdown */}
              <div className="relative" ref={exportAllDropdownRef}>
                <button
                  onClick={() => setShowExportAllDropdown(!showExportAllDropdown)}
                  disabled={batchAllProgress.isRunning}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  <span>{batchAllProgress.isRunning ? 'กำลังสร้างเอกสาร...' : 'ออกเอกสารทุกหมวด'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportAllDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showExportAllDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">เลือกประเภทเอกสาร (ทุกหมวด)</div>
                    <button onClick={() => { handleBatchExportAll('student-checkin', 'student'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.student}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.student ? <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> : <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>}
                      <span>{batchAllLoading.student ? 'กำลังสร้าง...' : 'ลงทะเบียนนักเรียน (DC.01)'}</span>
                    </button>
                    <button onClick={() => { handleBatchExportAll('teacher-checkin', 'teacher'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.teacher}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.teacher ? <RefreshCw className="w-4 h-4 animate-spin text-green-600" /> : <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>}
                      <span>{batchAllLoading.teacher ? 'กำลังสร้าง...' : 'ลงทะเบียนครู (DC.02)'}</span>
                    </button>
                    <button onClick={() => { handleBatchExportAll('committee-checkin', 'committee'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.committee}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.committee ? <RefreshCw className="w-4 h-4 animate-spin text-orange-600" /> : <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>}
                      <span>{batchAllLoading.committee ? 'กำลังสร้าง...' : 'ลงทะเบียนกรรมการ (DC.03)'}</span>
                    </button>
                    <button onClick={() => { handleBatchExportAll('score-sheet', 'scoreSheet'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.scoreSheet}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.scoreSheet ? <RefreshCw className="w-4 h-4 animate-spin text-red-600" /> : <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>}
                      <span>{batchAllLoading.scoreSheet ? 'กำลังสร้าง...' : 'ใบลงคะแนน (DC.04)'}</span>
                    </button>
                    <button onClick={() => { handleBatchExportAll('cover-sheet', 'coverSheet'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.coverSheet}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.coverSheet ? <RefreshCw className="w-4 h-4 animate-spin text-gray-600" /> : <span className="w-2 h-2 rounded-full bg-gray-600 inline-block"></span>}
                      <span>{batchAllLoading.coverSheet ? 'กำลังสร้าง...' : 'ใบปะหน้าซอง'}</span>
                    </button>
                    <button onClick={() => { handleBatchExportAll('summary', 'summary'); setShowExportAllDropdown(false); }}
                      disabled={batchAllLoading.summary}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex items-center space-x-2 disabled:opacity-50">
                      {batchAllLoading.summary ? <RefreshCw className="w-4 h-4 animate-spin text-purple-600" /> : <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>}
                      <span>{batchAllLoading.summary ? 'กำลังสร้าง...' : 'สรุปผู้เข้าแข่ง'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ ปุ่มอนุมัติทั้งหมด - สำหรับ Group Admin และ District Admin */}
              {(isGroupAdmin() || isDistrictAdmin()) && statistics?.pending > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkApproving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkApproving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span>{bulkApproving ? 'กำลังอนุมัติ...' : `อนุมัติทั้งหมด (${statistics?.pending})`}</span>
                </button>
              )}

              {/* ปุ่มรีเซ็ต - เฉพาะ Group Admin และ District Admin */}
              {(isGroupAdmin() || isDistrictAdmin()) && (
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>รีเซ็ตข้อมูล</span>
                </button>
              )}

              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Level Tabs - สำหรับ District Admin และ Group Admin */}
        {(isDistrictAdmin() || isGroupAdmin()) && (
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-2 inline-flex gap-2">
              <button
                onClick={() => {
                  setActiveLevel('group');
                  setExpandedCategories({});
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeLevel === 'group'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>ระดับกลุ่ม</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeLevel === 'group' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {activeLevel === 'group' ? statistics?.total || 0 : '-'}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveLevel('district');
                  setSelectedGroupId('all');
                  setExpandedCategories({});
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeLevel === 'district'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>ระดับเขต</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeLevel === 'district' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {activeLevel === 'district' ? statistics?.total || 0 : '-'}
                </span>
              </button>
            </div>

            {/* ✅ Level Info Banner */}
            <div className={`mt-4 p-4 rounded-lg border ${
              activeLevel === 'district'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              {activeLevel === 'district' ? (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900">การแข่งขันระดับเขต</p>
                    <p className="text-sm text-purple-700 mt-1">
                      แสดงรายการลงทะเบียนจากทุกกลุ่มที่ผ่านเข้ารอบมาแข่งระดับเขต (292 กิจกรรม)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">การแข่งขันระดับกลุ่ม</p>
                    <p className="text-sm text-blue-700 mt-1">
                      แสดงรายการลงทะเบียนแยกตามกลุ่มโรงเรียน (12 กลุ่ม × 292 กิจกรรม = 3,504 กิจกรรม)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Section */}
        {showDocumentSection && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              ออกเอกสารลงทะเบียน (เฉพาะที่อนุมัติแล้ว)
              {isDistrictAdmin() && (
                <span className={`ml-3 px-2 py-1 rounded text-xs ${
                  activeLevel === 'district' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {activeLevel === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม'}
                </span>
              )}
            </h2>

            {/* 1. เลือกหมวดหมู่ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. เลือกหมวดหมู่
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedCompetitionForDoc(null);
                }}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {Object.values(competitionsByCategory).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.competitions.length} กิจกรรม)
                  </option>
                ))}
              </select>
            </div>

            {/* ปุ่ม Batch Export - ออกเอกสารทั้งหมดในหมวด */}
            {selectedCategory && competitionsForSelectedCategory.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  ออกเอกสารทั้งหมดในหมวด ({competitionsForSelectedCategory.length} กิจกรรม)
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleBatchExport('student-checkin', 'student')} disabled={batchLoading.student}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.student ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'ลงทะเบียนนักเรียน (ทั้งหมด)'}
                  </button>
                  <button onClick={() => handleBatchExport('teacher-checkin', 'teacher')} disabled={batchLoading.teacher}
                    className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.teacher ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'ลงทะเบียนครู (ทั้งหมด)'}
                  </button>
                  <button onClick={() => handleBatchExport('summary', 'summary')} disabled={batchLoading.summary}
                    className="inline-flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.summary ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'สรุปผู้เข้าแข่ง (ทั้งหมด)'}
                  </button>
                  <button onClick={() => handleBatchExport('committee-checkin', 'committee')} disabled={batchLoading.committee}
                    className="inline-flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.committee ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'ลงทะเบียนกรรมการ (ทั้งหมด)'}
                  </button>
                  <button onClick={() => handleBatchExport('score-sheet', 'scoreSheet')} disabled={batchLoading.scoreSheet}
                    className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.scoreSheet ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'ใบลงคะแนน (ทั้งหมด)'}
                  </button>
                  <button onClick={() => handleBatchExport('cover-sheet', 'coverSheet')} disabled={batchLoading.coverSheet}
                    className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {batchLoading.coverSheet ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังสร้าง...</> : 'ใบปะหน้าซอง (ทั้งหมด)'}
                  </button>
                </div>
              </div>
            )}

            {/* หรือเลือกกิจกรรมเดี่ยว */}
            {selectedCategory && (
              <div className="mb-4">
                <div className="relative flex items-center mb-3">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500">หรือเลือกกิจกรรมเดี่ยว</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. เลือกกิจกรรม
                </label>
                <select
                  value={selectedCompetitionForDoc?.id || ''}
                  onChange={(e) => {
                    const comp = competitionsForSelectedCategory.find(
                      c => c.id === parseInt(e.target.value)
                    );
                    setSelectedCompetitionForDoc(comp);
                  }}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- เลือกกิจกรรม --</option>
                  {(() => {
                    const primary = competitionsForSelectedCategory.filter(c => getEducationLevel(c.level) === 'primary');
                    const secondary = competitionsForSelectedCategory.filter(c => getEducationLevel(c.level) === 'secondary');
                    const other = competitionsForSelectedCategory.filter(c => getEducationLevel(c.level) === 'other');
                    return (
                      <>
                        {primary.length > 0 && (
                          <optgroup label={`ระดับประถมศึกษา (${primary.length})`}>
                            {primary.map((comp) => (
                              <option key={comp.id} value={comp.id}>
                                {comp.name} ({comp.level})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {secondary.length > 0 && (
                          <optgroup label={`ระดับมัธยมศึกษา (${secondary.length})`}>
                            {secondary.map((comp) => (
                              <option key={comp.id} value={comp.id}>
                                {comp.name} ({comp.level})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {other.length > 0 && (
                          <optgroup label={`อื่นๆ (${other.length})`}>
                            {other.map((comp) => (
                              <option key={comp.id} value={comp.id}>
                                {comp.name} {comp.level ? `(${comp.level})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
                </select>
              </div>
            )}

            {selectedCompetitionForDoc && (
              <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>กิจกรรมที่เลือก:</strong> {selectedCompetitionForDoc.name}
                    {selectedCompetitionForDoc.level && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                        {selectedCompetitionForDoc.level}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    หมวดหมู่: {selectedCompetitionForDoc.category?.name}
                  </p>
                </div>
                <DocumentButtons competition={selectedCompetitionForDoc} />
              </div>
            )}

            {Object.keys(competitionsByCategory).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>ไม่มีกิจกรรมที่มีการลงทะเบียนอนุมัติแล้ว</p>
              </div>
            )}

            {/* ปุ่มออกเอกสารคณะกรรมการดำเนินงาน (ไม่ต้องเลือกกิจกรรม) */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">เอกสารอื่นๆ (ไม่ต้องเลือกกิจกรรม)</h3>
              <button
                onClick={handleDownloadStaffPdf}
                disabled={loadingStaffPdf}
                className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingStaffPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    ลงทะเบียนคณะกรรมการดำเนินงาน
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`bg-white rounded-lg border p-6 ${
              activeLevel === 'district' ? 'border-purple-200' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statistics.total}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  activeLevel === 'district' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    activeLevel === 'district' ? 'text-purple-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">รอการอนุมัติ</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {statistics.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {statistics.approved}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ไม่อนุมัติ</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {statistics.rejected}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ✅ Filter เลือกกลุ่ม - เฉพาะ district admin และ ระดับกลุ่ม */}
            {isDistrictAdmin() && activeLevel === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Layers className="w-4 h-4 inline mr-2" />
                  กลุ่มโรงเรียน
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ทุกกลุ่ม</option>
                  {schoolGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอการอนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                ค้นหา
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="ชื่อทีม, ครู..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={handleCategoryOverview}
                  disabled={categoryOverviewLoading}
                  className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="สรุปหมวดหมู่การแข่งขัน (PDF)"
                >
                  {categoryOverviewLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="text-sm">PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Registration List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่พบรายการลงทะเบียน
            </h3>
            <p className="text-gray-600">
              {isDistrictAdmin() && activeLevel === 'district'
                ? 'ยังไม่มีรายการลงทะเบียนระดับเขต (ผู้ที่ผ่านการคัดเลือกจากระดับกลุ่ม)'
                : 'ไม่มีรายการลงทะเบียนที่ตรงกับเงื่อนไข'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✅ สำหรับ District Admin ที่ดูระดับกลุ่ม - แสดงแยกตามกลุ่ม */}
            {isDistrictAdmin() && activeLevel === 'group' && selectedGroupId === 'all' ? (
              // ✅ แสดงแยกตามกลุ่มโรงเรียน > กิจกรรม (2 ระดับ)
              schoolGroupCategories.map((group) => {
                const competitionsList = Object.values(group.competitions);

                return (
                  <div key={group.id} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                    {/* Group Header - ระดับที่ 1 */}
                    <button
                      onClick={() => toggleCategory(`group_${group.id}`)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedCategories[`group_${group.id}`] ? (
                          <ChevronDown className="w-5 h-5 text-blue-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-blue-500" />
                        )}
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-900">
                          {group.name}
                        </h3>
                        <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                          {competitionsList.length} กิจกรรม
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
                          {group.totalRegistrations} รายการ
                        </span>
                      </div>
                    </button>

                    {/* Competitions List - ระดับที่ 2 */}
                    {expandedCategories[`group_${group.id}`] && (
                      <div className="border-t border-blue-200">
                        {competitionsList.map((comp) => (
                          <div key={comp.id} className="border-b border-blue-100 last:border-b-0">
                            {/* Competition Header */}
                            <button
                              onClick={() => toggleCategory(`group_comp_${group.id}_${comp.id}`)}
                              className="w-full px-6 py-3 flex items-center justify-between bg-white hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3 pl-6">
                                {expandedCategories[`group_comp_${group.id}_${comp.id}`] ? (
                                  <ChevronDown className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-blue-400" />
                                )}
                                <FileText className="w-4 h-4 text-blue-500" />
                                <h4 className="text-base font-medium text-gray-800">
                                  {comp.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  {comp.registrations.length} ทีม
                                </span>
                                {comp.registrations.some(r => r.status === 'pending') && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                    {comp.registrations.filter(r => r.status === 'pending').length} รอ
                                  </span>
                                )}
                              </div>
                            </button>

                            {/* Registrations for this Competition */}
                            {expandedCategories[`group_comp_${group.id}_${comp.id}`] && (
                              <div className="bg-blue-50 border-t border-blue-100">
                                {comp.registrations.map((registration) => (
                                  <RegistrationItem
                                    key={registration.id}
                                    registration={registration}
                                    getStatusBadge={getStatusBadge}
                                    getLevelBadge={getLevelBadge}
                                    handleEdit={handleEdit}
                                    handleApprove={handleApprove}
                                    handleReject={handleReject}
                                    handleDelete={handleDelete}
                                    showLevel={false}
                                    nested={true}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // ✅ แสดงแยกตามหมวดหมู่ > กิจกรรม (2 ระดับ)
              categories.map((category) => {
                const competitionsList = Object.values(category.competitions);

                return (
                  <div key={category.id} className={`bg-white rounded-lg border overflow-hidden ${
                    activeLevel === 'district' ? 'border-purple-200' : 'border-gray-200'
                  }`}>
                    {/* Category Header - ระดับที่ 1 */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                        activeLevel === 'district'
                          ? 'bg-purple-50 hover:bg-purple-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {expandedCategories[category.id] ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <Layers className={`w-5 h-5 ${activeLevel === 'district' ? 'text-purple-600' : 'text-blue-600'}`} />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeLevel === 'district'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {competitionsList.length} กิจกรรม
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                          {category.totalRegistrations} รายการ
                        </span>
                      </div>
                    </button>

                    {/* Competitions List - ระดับที่ 2 (แยกประถม/มัธยม) */}
                    {expandedCategories[category.id] && (
                      <div className="border-t border-gray-200">
                        {(() => {
                          const primaryComps = competitionsList.filter(c => getEducationLevel(c.competition?.level) === 'primary');
                          const secondaryComps = competitionsList.filter(c => getEducationLevel(c.competition?.level) === 'secondary');
                          const otherComps = competitionsList.filter(c => getEducationLevel(c.competition?.level) === 'other');
                          const groups = [];
                          if (primaryComps.length > 0) groups.push({ label: 'ระดับประถมศึกษา', comps: primaryComps, color: 'bg-blue-50 text-blue-700 border-blue-200' });
                          if (secondaryComps.length > 0) groups.push({ label: 'ระดับมัธยมศึกษา', comps: secondaryComps, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
                          if (otherComps.length > 0) groups.push({ label: 'อื่นๆ', comps: otherComps, color: 'bg-gray-50 text-gray-600 border-gray-200' });

                          // ถ้ามีแค่กลุ่มเดียว ไม่ต้องแสดง sub-header
                          if (groups.length <= 1) {
                            return competitionsList.map((comp) => (
                              <div key={comp.id} className="border-b border-gray-100 last:border-b-0">
                                <button
                                  onClick={() => toggleCategory(`comp_${comp.id}`)}
                                  className="w-full px-6 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center space-x-3 pl-6">
                                    {expandedCategories[`comp_${comp.id}`] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <h4 className="text-base font-medium text-gray-800">{comp.name}</h4>
                                    {comp.competition?.level && (
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{comp.competition.level}</span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{comp.registrations.length} ทีม</span>
                                    {comp.registrations.some(r => r.status === 'pending') && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{comp.registrations.filter(r => r.status === 'pending').length} รอ</span>
                                    )}
                                  </div>
                                </button>
                                {expandedCategories[`comp_${comp.id}`] && (
                                  <div className="bg-gray-50 border-t border-gray-100">
                                    {comp.registrations.map((registration) => (
                                      <RegistrationItem key={registration.id} registration={registration} getStatusBadge={getStatusBadge} getLevelBadge={getLevelBadge} handleEdit={handleEdit} handleApprove={handleApprove} handleReject={handleReject} handleDelete={handleDelete} showLevel={activeLevel === 'district'} nested={true} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ));
                          }

                          return groups.map((group) => (
                            <div key={group.label}>
                              {/* Sub-header ระดับการศึกษา */}
                              <div className={`px-8 py-2 ${group.color} border-b font-semibold text-sm`}>
                                {group.label} ({group.comps.length} กิจกรรม)
                              </div>
                              {group.comps.map((comp) => (
                                <div key={comp.id} className="border-b border-gray-100 last:border-b-0">
                                  <button
                                    onClick={() => toggleCategory(`comp_${comp.id}`)}
                                    className="w-full px-6 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3 pl-6">
                                      {expandedCategories[`comp_${comp.id}`] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <h4 className="text-base font-medium text-gray-800">{comp.name}</h4>
                                      {comp.competition?.level && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{comp.competition.level}</span>
                                      )}
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{comp.registrations.length} ทีม</span>
                                      {comp.registrations.some(r => r.status === 'pending') && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{comp.registrations.filter(r => r.status === 'pending').length} รอ</span>
                                      )}
                                    </div>
                                  </button>
                                  {expandedCategories[`comp_${comp.id}`] && (
                                    <div className="bg-gray-50 border-t border-gray-100">
                                      {comp.registrations.map((registration) => (
                                        <RegistrationItem key={registration.id} registration={registration} getStatusBadge={getStatusBadge} getLevelBadge={getLevelBadge} handleEdit={handleEdit} handleApprove={handleApprove} handleReject={handleReject} handleDelete={handleDelete} showLevel={activeLevel === 'district'} nested={true} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <RegistrationApprovalModal
          registration={selectedRegistration}
          actionType={actionType}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRegistration(null);
          }}
          onSubmit={handleApprovalSubmit}
        />
      )}

      {/* Edit Registration Modal */}
      {showEditModal && (
        <EditRegistrationModal
          isOpen={showEditModal}
          registration={selectedRegistration}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRegistration(null);
          }}
          onSuccess={handleEditSuccess}
          userRole={user?.role}
        />
      )}

      {/* Reset Registrations Modal */}
      <ResetRegistrationsModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => {
          loadData();
          loadCompetitionsWithApprovedRegistrations();
        }}
      />

      {/* Confirm Modal (แทน window.confirm) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Progress indicator สำหรับ batch export ทุกหมวด */}
      {batchAllProgress.isRunning && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              กำลังออกเอกสารทุกหมวด
            </span>
            <span className="text-xs text-gray-500">
              {batchAllProgress.currentIndex}/{batchAllProgress.totalCategories}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${(batchAllProgress.currentIndex / batchAllProgress.totalCategories) * 100}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-600 flex items-center">
            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            {batchAllProgress.currentCategory}
          </p>
          {batchAllProgress.completedCategories.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              สำเร็จ {batchAllProgress.completedCategories.length} หมวด
            </p>
          )}
          {batchAllProgress.failedCategories.length > 0 && (
            <p className="text-xs text-red-500 mt-1">
              <XCircle className="w-3 h-3 inline mr-1" />
              ล้มเหลว: {batchAllProgress.failedCategories.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ Component แยกสำหรับแสดงรายการ Registration
const RegistrationItem = ({
  registration,
  getStatusBadge,
  getLevelBadge,
  handleEdit,
  handleApprove,
  handleReject,
  handleDelete,
  showLevel = false,
  nested = false
}) => {
  return (
    <div className={`${nested ? 'px-8 pl-16' : 'px-6'} py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-100 bg-white`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            {/* แสดงชื่อกิจกรรมเฉพาะเมื่อไม่ใช่ nested */}
            {!nested && (
              <h4 className="text-lg font-semibold text-gray-900">
                {registration.competition?.name || '-'}
              </h4>
            )}
            {getStatusBadge(registration.status)}
            {showLevel && getLevelBadge(registration.competition?.competition_level)}
          </div>

          <div className={`grid ${nested ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'} gap-4 text-sm text-gray-600 ${nested ? '' : 'mb-3'}`}>
            <div>
              <span className="font-medium">ชื่อทีม:</span> {registration.team_name || '-'}
            </div>
            <div>
              <span className="font-medium">โรงเรียน:</span> {registration.school?.name || '-'}
            </div>
            <div>
              <span className="font-medium">กลุ่ม:</span> {registration.competition?.school_group?.name || registration.school?.school_group?.name || '-'}
            </div>
            <div>
              <span className="font-medium">จำนวน:</span> {registration.student_count || 0} นักเรียน, {registration.teacher_count || 0} ครู
            </div>
            {nested && (
              <div className="text-gray-500">
                <span className="font-medium">ลงทะเบียน:</span> {new Date(registration.created_at).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          {!nested && (
            <div className="text-sm text-gray-500 mt-2">
              <span className="font-medium">ลงทะเบียนเมื่อ:</span> {new Date(registration.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => handleEdit(registration)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="แก้ไขรายชื่อ"
          >
            <Edit2 className="w-4 h-4" />
            <span>แก้ไข</span>
          </button>

          {registration.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(registration)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>อนุมัติ</span>
              </button>
              <button
                onClick={() => handleReject(registration)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>ปฏิเสธ</span>
              </button>
            </>
          )}

          {/* ✅ ปุ่มลบ - สำหรับทุกสถานะ (Group Admin / District Admin) */}
          <button
            onClick={() => handleDelete(registration)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="ลบการลงทะเบียน"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationManagement;
