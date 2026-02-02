import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Trash2,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
  User,
  Monitor,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import api from '../../services/api';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cleanup dialog
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);

  const actionOptions = [
    { value: 'login', label: 'เข้าสู่ระบบ' },
    { value: 'logout', label: 'ออกจากระบบ' },
    { value: 'create', label: 'สร้าง' },
    { value: 'update', label: 'แก้ไข' },
    { value: 'delete', label: 'ลบ' },
    { value: 'view', label: 'ดู' },
    { value: 'export', label: 'ส่งออก' },
    { value: 'import', label: 'นำเข้า' },
    { value: 'approve', label: 'อนุมัติ' },
    { value: 'reject', label: 'ปฏิเสธ' },
  ];

  const moduleOptions = [
    { value: 'auth', label: 'การยืนยันตัวตน' },
    { value: 'competitions', label: 'การแข่งขัน' },
    { value: 'registrations', label: 'การลงทะเบียน' },
    { value: 'users', label: 'ผู้ใช้' },
    { value: 'schools', label: 'โรงเรียน' },
    { value: 'school_groups', label: 'กลุ่มโรงเรียน' },
    { value: 'announcements', label: 'ประกาศ' },
    { value: 'categories', label: 'หมวดหมู่' },
    { value: 'results', label: 'ผลการแข่งขัน' },
  ];

  const roleOptions = [
    { value: 'district_admin', label: 'ผู้ดูแลระดับเขต' },
    { value: 'admin', label: 'ผู้ดูแลระบบ' },
    { value: 'group_admin', label: 'ผู้ดูแลกลุ่ม' },
    { value: 'school_admin', label: 'ผู้ดูแลโรงเรียน' },
    { value: 'teacher', label: 'ครู' },
    { value: 'judge', label: 'กรรมการ' },
  ];

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, perPage, search, actionFilter, moduleFilter, roleFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page,
        per_page: perPage,
      };

      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;
      if (roleFilter) params.role = roleFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/activity-logs', { params });

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalCount(response.data.meta.total);
        setTotalPages(response.data.meta.last_page);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('ไม่สามารถโหลดข้อมูล Activity Logs ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/activity-logs/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await api.post('/activity-logs/cleanup', { days: cleanupDays });
      if (response.data.success) {
        setCleanupDialogOpen(false);
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Error cleaning up logs:', err);
      setError('ไม่สามารถลบ logs เก่าได้');
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/activity-logs/export', { params });

      if (response.data.success) {
        const data = response.data.data;
        const headers = ['วันที่', 'ผู้ใช้', 'อีเมล', 'บทบาท', 'การกระทำ', 'โมดูล', 'รายละเอียด', 'IP Address'];
        const csvContent = [
          headers.join(','),
          ...data.map(log => [
            format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
            log.user_name || '-',
            log.user_email || '-',
            log.user_role || '-',
            log.action,
            log.module || '-',
            `"${(log.description || '').replace(/"/g, '""')}"`,
            log.ip_address || '-',
          ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activity_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        link.click();
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const getActionIcon = (action) => {
    const iconClass = "w-4 h-4";
    switch (action) {
      case 'login': return <LogIn className={iconClass} />;
      case 'logout': return <LogOut className={iconClass} />;
      case 'create': return <Plus className={iconClass} />;
      case 'update': return <Edit className={iconClass} />;
      case 'delete': return <Trash className={iconClass} />;
      case 'view': return <Eye className={iconClass} />;
      case 'export': return <Download className={iconClass} />;
      case 'import': return <Upload className={iconClass} />;
      case 'approve': return <CheckCircle className={iconClass} />;
      case 'reject': return <XCircle className={iconClass} />;
      default: return <Activity className={iconClass} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-700';
      case 'logout': return 'bg-yellow-100 text-yellow-700';
      case 'create': return 'bg-blue-100 text-blue-700';
      case 'update': return 'bg-indigo-100 text-indigo-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'approve': return 'bg-green-100 text-green-700';
      case 'reject': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role) => {
    const found = roleOptions.find(r => r.value === role);
    return found ? found.label : role || 'ไม่ระบุ';
  };

  const getActionLabel = (action) => {
    const found = actionOptions.find(a => a.value === action);
    return found ? found.label : action;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Activity Logs
        </h1>
        <p className="text-gray-500 mt-1">ติดตามการใช้งานระบบของผู้ใช้ทั้งหมด</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">เข้าสู่ระบบวันนี้</p>
            <p className="text-3xl font-bold text-blue-600">{stats.today?.logins || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">ผู้ใช้งานวันนี้</p>
            <p className="text-3xl font-bold text-green-600">{stats.today?.active_users || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">กิจกรรมทั้งหมด</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.total?.logs?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">การเข้าสู่ระบบทั้งหมด</p>
            <p className="text-3xl font-bold text-orange-600">{stats.total?.logins?.toLocaleString() || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, รายละเอียด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">การกระทำทั้งหมด</option>
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">โมดูลทั้งหมด</option>
            {moduleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="ตั้งแต่"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="ถึง"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 justify-end">
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setCleanupDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
          >
            <Trash2 className="w-4 h-4" />
            ล้าง Logs เก่า
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันเวลา</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ใช้</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">การกระทำ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    ไม่พบข้อมูล Activity Logs
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: th })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name || '-'}</div>
                          <div className="text-xs text-gray-500">{log.user_email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getRoleLabel(log.user_role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{log.description || log.module || '-'}</div>
                      {log.url && (
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={log.url}>
                          {log.method} {log.url.replace(/^https?:\/\/[^\/]+/, '')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-900" title={log.user_agent || ''}>
                        <Monitor className="w-4 h-4 text-gray-400" />
                        {log.ip_address || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">แสดง</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">รายการ จาก {totalCount.toLocaleString()} รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              หน้า {page} จาก {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cleanup Dialog */}
      {cleanupDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ล้าง Activity Logs เก่า</h3>
            <p className="text-gray-600 mb-4">
              ลบ logs ที่เก่ากว่าจำนวนวันที่กำหนด เพื่อประหยัดพื้นที่เก็บข้อมูล
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เก็บ logs ไว้ (วัน)
              </label>
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
                min={7}
                max={365}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">ลบ logs ที่เก่ากว่านี้</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCleanupDialogOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCleanup}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                ล้าง Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
