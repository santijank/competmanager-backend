import { useState, useEffect, useCallback } from 'react';
import {
  Search, Award, Download, Eye, Loader,
  CheckSquare, Square, FileDown, Users, GraduationCap,
  ChevronLeft, ChevronRight, DownloadCloud,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { certificateService } from '@/lib/api';

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

export default function SchoolCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMedal, setFilterMedal] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState('group');
  const [selectedIds, setSelectedIds] = useState([]);
  const [summary, setSummary] = useState({});
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { my_school: 1, level: activeTab, page };
      if (filterMedal) params.medal = filterMedal;
      if (filterType) params.recipient_type = filterType;
      if (search) params.search = search;

      const res = await certificateService.getAll(params);
      setCertificates(res.data?.data || []);
      setSummary(res.data?.summary || {});
      setMeta(res.data?.meta || {});
    } catch {
      toast.error('ไม่สามารถโหลดเกียรติบัตรได้');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterMedal, filterType, search, page]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  // Reset page + selection when tab or filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [activeTab, filterMedal, filterType, search]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === certificates.length && certificates.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(certificates.map(c => c.id));
    }
  };

  const handlePreview = (certId) => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/certificates/preview?certificate_id=${certId}&token=${token}`, '_blank');
  };

  const handleDownload = (id) => {
    certificateService.download(id);
  };

  const handleBatchDownload = () => {
    if (selectedIds.length === 0) {
      toast.warning('กรุณาเลือกเกียรติบัตร');
      return;
    }
    certificateService.batchDownload(selectedIds);
  };

  const handleDownloadAll = async () => {
    if (!summary.total || summary.total === 0) {
      toast.warning('ไม่มีเกียรติบัตรให้ดาวน์โหลด');
      return;
    }
    setDownloadingAll(true);
    try {
      const params = { my_school: 1, level: activeTab, per_page: 9999 };
      if (filterMedal) params.medal = filterMedal;
      if (filterType) params.recipient_type = filterType;
      if (search) params.search = search;

      toast.info('กำลังเตรียมดาวน์โหลด...');
      const res = await certificateService.getAll(params);
      const allCerts = res.data?.data || [];
      if (allCerts.length === 0) {
        toast.warning('ไม่พบเกียรติบัตร');
        return;
      }
      certificateService.batchDownload(allCerts.map(c => c.id));
    } catch {
      toast.error('ไม่สามารถดาวน์โหลดได้');
    } finally {
      setDownloadingAll(false);
    }
  };

  const levelLabel = activeTab === 'group' ? 'ระดับกลุ่ม' : 'ระดับเขต';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-7 h-7 text-yellow-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เกียรติบัตรของโรงเรียน</h1>
          <p className="text-sm text-gray-500">ดาวน์โหลดเกียรติบัตรนักเรียนและครูผู้ฝึกสอน</p>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-colors ${
              activeTab === 'group'
                ? 'text-white bg-green-600'
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            ระดับกลุ่มโรงเรียน
          </button>
          <button
            onClick={() => setActiveTab('district')}
            className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-colors ${
              activeTab === 'district'
                ? 'text-white bg-blue-600'
                : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            ระดับเขตพื้นที่การศึกษา
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2 text-sm mb-4">
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
      </div>

      {/* Filters + Download All */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, กิจกรรม, เลขที่..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกประเภท</option>
            <option value="student">นักเรียน</option>
            <option value="teacher">ครูผู้ฝึกสอน</option>
            <option value="committee">คณะกรรมการตัดสิน</option>
            <option value="staff">คณะกรรมการดำเนินการ</option>
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
          <button
            onClick={handleDownloadAll}
            disabled={!summary.total || downloadingAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingAll ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4" />
            )}
            ดาวน์โหลดทั้งหมด ({summary.total || 0})
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleBatchDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <FileDown className="w-4 h-4" />
            ดาวน์โหลดที่เลือก ({selectedIds.length})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">กำลังโหลด...</span>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">ยังไม่มีเกียรติบัตร{levelLabel}</p>
            <p className="text-sm mt-1">เกียรติบัตรจะแสดงเมื่อผู้ดูแลระบบสร้างเกียรติบัตรแล้ว</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-center w-10">
                    <button onClick={selectAll}>
                      {selectedIds.length === certificates.length && certificates.length > 0
                        ? <CheckSquare className="w-4 h-4 text-blue-600" />
                        : <Square className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-gray-600">เลขที่</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">ประเภท</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-600">ชื่อ-สกุล</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-600">กิจกรรม</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">เหรียญ</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">อันดับ</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600 w-28">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => toggleSelect(cert.id)}>
                        {selectedIds.includes(cert.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4 text-gray-400" />
                        }
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-800">
                      {cert.document_number || '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const t = cert.recipient_type || 'student';
                        if (t === 'teacher') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><Users className="w-3 h-3" /> ครู</span>;
                        if (t === 'committee') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Users className="w-3 h-3" /> กก.ตัดสิน</span>;
                        if (t === 'staff') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700"><Users className="w-3 h-3" /> กก.ดำเนินการ</span>;
                        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><GraduationCap className="w-3 h-3" /> นร.</span>;
                      })()}
                    </td>
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {cert.recipient_name || cert.student_name}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 truncate max-w-[200px]">{cert.competition_name}</div>
                      {cert.category_name && (
                        <div className="text-xs text-gray-500">{cert.category_name}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${medalColors[cert.medal] || 'bg-gray-100'}`}>
                        {medalLabels[cert.medal] || cert.medal}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">{cert.rank ?? '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handlePreview(cert.id)}
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
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            หน้า {meta.current_page} จาก {meta.last_page} (ทั้งหมด {meta.total} รายการ)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
              let pageNum;
              if (meta.last_page <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= meta.last_page - 2) {
                pageNum = meta.last_page - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
