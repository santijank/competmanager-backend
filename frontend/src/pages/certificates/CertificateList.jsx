import { useState, useEffect } from 'react';
import { Search, Award, Download, FileText, Filter, Eye, CheckSquare, Square, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { certificateService, competitionService, certificateTemplateService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';

export default function CertificateList() {
  const { isAdmin, isCommittee, isDistrictAdmin } = useAuthStore();
  const [certificates, setCertificates] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('generated');
  
  const [filterCompetition, setFilterCompetition] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterMedal, setFilterMedal] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (view === 'generated') {
      fetchCertificates();
    } else {
      fetchEligibleStudents();
    }
  }, [view, filterCompetition, filterLevel, filterMedal]);

  const fetchData = async () => {
    try {
      const [competitionsRes, templatesRes] = await Promise.all([
        competitionService.getAll(),
        certificateTemplateService.getAll()
      ]);
      setCompetitions(competitionsRes?.data?.data || []);
      const templateList = templatesRes?.data?.data || [];
      setTemplates(templateList);
      setSelectedTemplate(templateList.find(t => t.code === 'default')?.id || templateList[0]?.id || '');
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCompetition) params.competition_id = filterCompetition;
      if (filterLevel !== 'all') params.level = filterLevel;
      if (filterMedal !== 'all') params.medal = filterMedal;

      const response = await certificateService.getAll(params);
      setCertificates(response?.data?.data || []);
    } catch (error) {
      console.error('Fetch certificates error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลเกียรติบัตรได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCompetition) params.competition_id = filterCompetition;
      if (filterMedal !== 'all') params.medal = filterMedal;

      const response = await certificateService.getEligible(params);
      setEligibleStudents(response?.data?.data || []);
    } catch (error) {
      console.error('Fetch eligible error:', error);
      toast.error('ไม่สามารถโหลดรายการนักเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      await certificateService.download(certificateId);
      toast.success('กำลังดาวน์โหลดเกียรติบัตร');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถดาวน์โหลดเกียรติบัตรได้');
    }
  };

  const handleGenerateSingle = async (resultId) => {
    if (!selectedTemplate) {
      toast.warning('กรุณาเลือกเทมเพลต');
      return;
    }

    try {
      await certificateService.generateFromResult(resultId, { template_id: selectedTemplate });
      toast.success('สร้างเกียรติบัตรสำเร็จ');
      fetchData();
      setView('generated');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('ไม่สามารถสร้างเกียรติบัตรได้');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.result_id || item.id));
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedItems.length === 0) {
      toast.warning('กรุณาเลือกรายการที่ต้องการสร้างเกียรติบัตร');
      return;
    }

    if (!selectedTemplate) {
      toast.warning('กรุณาเลือกเทมเพลต');
      return;
    }

    if (!confirm(`ต้องการสร้างเกียรติบัตร ${selectedItems.length} รายการใช่หรือไม่?`)) {
      return;
    }

    try {
      setBulkGenerating(true);
      
      const competitionId = filterCompetition || competitions[0]?.id;
      const response = await certificateService.bulkGenerate(competitionId, {
        result_ids: selectedItems,
        template_id: selectedTemplate,
      });

      if (response.data.success) {
        const { created, failed } = response.data.data.summary;
        
        if (created > 0) {
          toast.success(`สร้างเกียรติบัตรสำเร็จ ${created} รายการ`);
        }
        
        if (failed > 0) {
          toast.warning(`สร้างไม่สำเร็จ ${failed} รายการ`);
        }

        setSelectedItems([]);
        fetchData();
        setView('generated');
      }
    } catch (error) {
      console.error('Bulk generate error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างเกียรติบัตร');
    } finally {
      setBulkGenerating(false);
    }
  };

  const getMedalBadge = (medal) => {
    const badges = {
      gold: { text: 'ทอง', class: 'bg-yellow-100 text-yellow-800', icon: '🥇' },
      silver: { text: 'เงิน', class: 'bg-gray-100 text-gray-800', icon: '🥈' },
      bronze: { text: 'ทองแดง', class: 'bg-orange-100 text-orange-800', icon: '🥉' },
    };
    const badge = badges[medal];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    const badges = {
      group: { text: 'กลุ่มโรงเรียน', class: 'badge-primary' },
      district: { text: 'เขตพื้นที่', class: 'badge-success' },
    };
    const badge = badges[level] || { text: level, class: 'badge-gray' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const filteredItems = (view === 'generated' ? certificates : eligibleStudents).filter(item => {
    const studentName = item?.student_name?.toLowerCase() || '';
    const schoolName = item?.school_name?.toLowerCase() || '';
    const certCode = item?.certificate_code?.toLowerCase() || '';
    const search = searchTerm?.toLowerCase() || '';
    
    return studentName.includes(search) || 
           schoolName.includes(search) || 
           certCode.includes(search);
  });

  const canManage = isAdmin() || isCommittee() || isDistrictAdmin();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เกียรติบัตร</h1>
          <p className="text-gray-600 mt-1">จัดการเกียรติบัตรทั้งหมด</p>
        </div>
        
        {canManage && view === 'eligible' && selectedItems.length > 0 && (
          <button
            onClick={handleBulkGenerate}
            disabled={bulkGenerating}
            className="btn btn-primary"
          >
            {bulkGenerating ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                สร้างเกียรติบัตร ({selectedItems.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* View Toggle */}
      {canManage && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('generated')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'generated'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            เกียรติบัตรที่สร้างแล้ว
          </button>
          <button
            onClick={() => setView('eligible')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'eligible'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            รายการที่มีสิทธิ์
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="text-sm font-medium mb-1 block">
              ค้นหา
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="ชื่อนักเรียน, โรงเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Competition */}
          <div>
            <label htmlFor="competition" className="text-sm font-medium mb-1 block">
              การแข่งขัน
            </label>
            <select
              id="competition"
              value={filterCompetition}
              onChange={(e) => setFilterCompetition(e.target.value)}
              className="input"
            >
              <option value="">ทั้งหมด</option>
              {competitions.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          {view === 'generated' && (
            <div>
              <label htmlFor="level" className="text-sm font-medium mb-1 block">
                ระดับ
              </label>
              <select
                id="level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="input"
              >
                <option value="all">ทั้งหมด</option>
                <option value="group">กลุ่มโรงเรียน</option>
                <option value="district">เขตพื้นที่</option>
              </select>
            </div>
          )}

          {/* Medal */}
          <div>
            <label htmlFor="medal" className="text-sm font-medium mb-1 block">
              เหรียญ
            </label>
            <select
              id="medal"
              value={filterMedal}
              onChange={(e) => setFilterMedal(e.target.value)}
              className="input"
            >
              <option value="all">ทั้งหมด</option>
              <option value="gold">🥇 ทอง</option>
              <option value="silver">🥈 เงิน</option>
              <option value="bronze">🥉 ทองแดง</option>
            </select>
          </div>

          {/* Template */}
          {canManage && view === 'eligible' && (
            <div>
              <label htmlFor="template" className="text-sm font-medium mb-1 block">
                เทมเพลต
              </label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="input"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Select All */}
      {canManage && view === 'eligible' && filteredItems.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedItems.length === filteredItems.length ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            {selectedItems.length === filteredItems.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        </div>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {view === 'generated' ? 'ไม่พบเกียรติบัตร' : 'ไม่พบรายการที่มีสิทธิ์'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id || item.result_id} className="card hover:shadow-lg transition-shadow">
              {/* Selection Checkbox */}
              {canManage && view === 'eligible' && !item.has_certificate && (
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.result_id)}
                    onChange={() => handleToggleSelect(item.result_id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-600">เลือก</label>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">
                      {item?.certificate_code || 'รอสร้าง'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item?.student_name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">{item?.school_name || 'N/A'}</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {item?.competition_name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item?.level && getLevelBadge(item.level)}
                  {item?.medal && getMedalBadge(item.medal)}
                </div>
                {item?.rank && (
                  <div className="text-sm text-gray-600">
                    อันดับที่ <span className="font-semibold">{item.rank}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {view === 'generated' ? (
                  <>
                    {item?.pdf_path ? (
                      <button
                        onClick={() => handleDownload(item.id)}
                        className="flex-1 btn btn-primary text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ดาวน์โหลด
                      </button>
                    ) : (
                      <div className="flex-1 text-center text-sm text-gray-500 py-2">
                        กำลังสร้าง PDF...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {!item?.has_certificate && canManage ? (
                      <button
                        onClick={() => handleGenerateSingle(item.result_id)}
                        className="flex-1 btn btn-primary text-sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        สร้าง
                      </button>
                    ) : (
                      <div className="flex-1 text-center text-sm text-green-600 py-2">
                        ✓ สร้างแล้ว
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="card text-center">
            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
            <p className="text-sm text-gray-600">
              {view === 'generated' ? 'เกียรติบัตรทั้งหมด' : 'รายการทั้งหมด'}
            </p>
          </div>
          <div className="card text-center bg-yellow-50">
            <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">
              {filteredItems.filter(c => c.medal === 'gold').length}
            </p>
            <p className="text-sm text-yellow-700">เหรียญทอง</p>
          </div>
          <div className="card text-center bg-gray-50">
            <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {filteredItems.filter(c => c.medal === 'silver').length}
            </p>
            <p className="text-sm text-gray-700">เหรียญเงิน</p>
          </div>
          <div className="card text-center bg-orange-50">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-900">
              {filteredItems.filter(c => c.medal === 'bronze').length}
            </p>
            <p className="text-sm text-orange-700">เหรียญทองแดง</p>
          </div>
        </div>
      )}
    </div>
  );
}
