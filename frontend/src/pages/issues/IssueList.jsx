import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Plus, Search, RefreshCw, AlertCircle,
  Clock, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { issueService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import CreateIssueModal from './CreateIssueModal';

const TYPE_LABELS = {
  system_bug: 'แจ้งปัญหาระบบ',
  data_issue: 'แก้ไขข้อมูล',
  feature_request: 'เสนอแนะ',
  inquiry: 'สอบถาม',
  complaint: 'ร้องเรียน',
  other: 'อื่นๆ',
};

const PRIORITY_LABELS = {
  urgent: 'ด่วนมาก',
  high: 'สำคัญ',
  normal: 'ปกติ',
  low: 'ต่ำ',
};

const STATUS_LABELS = {
  open: 'เปิด',
  in_progress: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
  closed: 'ปิด',
};

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_STYLES = {
  system_bug: 'bg-red-50 text-red-700',
  data_issue: 'bg-purple-50 text-purple-700',
  feature_request: 'bg-teal-50 text-teal-700',
  inquiry: 'bg-sky-50 text-sky-700',
  complaint: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-50 text-gray-700',
};

const STATUS_ICONS = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

const IssueList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole(['admin', 'district_admin']);

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({ by_status: {} });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    search: '',
    per_page: 15,
    page: 1,
  });

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.status, filters.type, filters.priority]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      // Remove empty filters
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

      const [issuesRes, statsRes] = await Promise.all([
        issueService.getAll(params),
        issueService.getStatistics(),
      ]);

      if (issuesRes.data.success) {
        setIssues(issuesRes.data.data || []);
        setMeta(issuesRes.data.meta || {});
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data || {});
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const goToPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const statusCounts = stats.by_status || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">แจ้งปัญหา</h1>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'จัดการปัญหาทั้งหมดในระบบ' : 'แจ้งปัญหาและติดตามสถานะ'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>แจ้งปัญหาใหม่</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'open', label: 'เปิด', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { key: 'in_progress', label: 'กำลังดำเนินการ', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
            { key: 'resolved', label: 'แก้ไขแล้ว', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
            { key: 'closed', label: 'ปิดแล้ว', icon: XCircle, color: 'text-gray-500 bg-gray-50 border-gray-200' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleFilterChange('status', filters.status === item.key ? '' : item.key)}
                className={`p-3 rounded-lg border transition-all ${filters.status === item.key ? 'ring-2 ring-indigo-400 ' + item.color : 'bg-white border-gray-200 hover:shadow'}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${item.color.split(' ')[0]}`} />
                  <span className="text-2xl font-bold text-gray-900">{statusCounts[item.key] || 0}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-left">{item.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ค้นหาหัวข้อ / เลขที่..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">ทุกประเภท</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">ทุกความสำคัญ</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Issue List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500">กำลังโหลด...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">ยังไม่มีรายการแจ้งปัญหา</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              แจ้งปัญหาใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => {
              const StatusIcon = STATUS_ICONS[issue.status] || AlertCircle;
              return (
                <div
                  key={issue.id}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-gray-400">{issue.ticket_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_STYLES[issue.priority]}`}>
                          {PRIORITY_LABELS[issue.priority]}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${TYPE_STYLES[issue.type]}`}>
                          {TYPE_LABELS[issue.type]}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 truncate">{issue.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>โดย {issue.creator?.name || '-'}</span>
                        {issue.creator?.role && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                            {issue.creator.role}
                          </span>
                        )}
                        <span>{formatDate(issue.created_at)}</span>
                        {issue.replies_count > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="w-3 h-3" /> {issue.replies_count}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[issue.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_LABELS[issue.status]}
                      </span>
                      {isAdmin && issue.assignee && (
                        <span className="text-xs text-gray-400">
                          ผู้รับ: {issue.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              ทั้งหมด {meta.total} รายการ
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                let page;
                if (meta.last_page <= 5) {
                  page = i + 1;
                } else if (meta.current_page <= 3) {
                  page = i + 1;
                } else if (meta.current_page >= meta.last_page - 2) {
                  page = meta.last_page - 4 + i;
                } else {
                  page = meta.current_page - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm rounded-lg border ${page === meta.current_page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default IssueList;
