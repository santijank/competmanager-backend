import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle,
  User, Paperclip, Send, Loader2, Image, FileText, Download,
  UserPlus, RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { issueService } from '@/lib/api';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const TYPE_LABELS = {
  system_bug: 'แจ้งปัญหาระบบ', data_issue: 'แก้ไขข้อมูล',
  feature_request: 'เสนอแนะ', inquiry: 'สอบถาม',
  complaint: 'ร้องเรียน', other: 'อื่นๆ',
};
const PRIORITY_LABELS = { urgent: 'ด่วนมาก', high: 'สำคัญ', normal: 'ปกติ', low: 'ต่ำ' };
const STATUS_LABELS = { open: 'เปิด', in_progress: 'กำลังดำเนินการ', resolved: 'แก้ไขแล้ว', closed: 'ปิด' };

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};
const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS = {
  admin: 'ผู้ดูแลระบบ', district_admin: 'ผู้ดูแลเขต',
  group_admin: 'ผู้ดูแลกลุ่ม', school_admin: 'ผู้ดูแลโรงเรียน',
  teacher: 'ครู', judge: 'กรรมการ', committee: 'คณะทำงาน',
};

const STATUS_ACTIONS = [
  { status: 'open', label: 'เปิดใหม่', icon: AlertCircle, color: 'bg-blue-600 hover:bg-blue-700' },
  { status: 'in_progress', label: 'กำลังดำเนินการ', icon: Clock, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { status: 'resolved', label: 'แก้ไขแล้ว', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
  { status: 'closed', label: 'ปิด', icon: XCircle, color: 'bg-gray-600 hover:bg-gray-700' },
];

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const isAdmin = hasRole(['admin', 'district_admin']);
  const repliesEndRef = useRef(null);

  const [issue, setIssue] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assigningTo, setAssigningTo] = useState('');

  useEffect(() => {
    fetchIssue();
    if (isAdmin) fetchAdminUsers();
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await issueService.getById(id);
      if (res.data.success) {
        setIssue(res.data.data.issue);
        setReplies(res.data.data.replies || []);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      navigate('/issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'admin,district_admin', per_page: 100 } });
      if (res.data.success) {
        setAdminUsers(res.data.data || []);
      }
    } catch (e) {}
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setChangingStatus(true);
      await issueService.updateStatus(id, { status: newStatus });
      toast.success('เปลี่ยนสถานะสำเร็จ');
      fetchIssue();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningTo) return;
    try {
      await issueService.assign(id, { assigned_to: parseInt(assigningTo) });
      toast.success('มอบหมายสำเร็จ');
      setShowAssign(false);
      fetchIssue();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('กรุณาพิมพ์ข้อความ');
      return;
    }

    setSubmittingReply(true);
    try {
      const fd = new FormData();
      fd.append('content', replyContent);
      if (isInternalNote) fd.append('is_internal_note', '1');
      replyFiles.forEach(f => fd.append('attachments[]', f));

      await issueService.addReply(id, fd);
      toast.success('ตอบกลับสำเร็จ');
      setReplyContent('');
      setReplyFiles([]);
      setIsInternalNote(false);
      fetchIssue();
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const getApiBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return apiUrl.replace('/api', '');
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mt-3 space-y-2">
        {attachments.map(att => {
          const isImg = att.file_type?.startsWith('image/');
          const fileUrl = att.file_path?.startsWith('http') ? att.file_path : getApiBaseUrl() + att.file_path;
          return (
            <div key={att.id}>
              {isImg ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={fileUrl} alt={att.original_name} className="max-w-xs max-h-48 rounded-lg border border-gray-200 hover:shadow-md transition-shadow" />
                </a>
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-700"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="truncate max-w-[200px]">{att.original_name}</span>
                  <Download className="w-3 h-3 text-gray-400" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/issues')}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </button>

        {/* Issue Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-sm font-mono text-gray-400">{issue.ticket_number}</span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{issue.title}</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full flex-shrink-0 ${STATUS_STYLES[issue.status]}`}>
              {STATUS_LABELS[issue.status]}
            </span>
          </div>

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${PRIORITY_STYLES[issue.priority]}`}>
              {PRIORITY_LABELS[issue.priority]}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {TYPE_LABELS[issue.type]}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-4">
            <div>
              <p className="text-gray-500 text-xs">ผู้แจ้ง</p>
              <p className="font-medium text-gray-900">{issue.creator?.name || '-'}</p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[issue.creator?.role] || issue.creator?.role}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">ผู้รับผิดชอบ</p>
              <p className="font-medium text-gray-900">{issue.assignee?.name || 'ยังไม่มอบหมาย'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">วันที่แจ้ง</p>
              <p className="font-medium text-gray-900">{formatDate(issue.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">กลุ่ม</p>
              <p className="font-medium text-gray-900">{issue.school_group?.name || '-'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">รายละเอียด:</p>
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{issue.description}</div>
            {renderAttachments(issue.attachments)}
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {/* Status Buttons */}
                {STATUS_ACTIONS.filter(a => a.status !== issue.status).map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.status}
                      onClick={() => handleStatusChange(action.status)}
                      disabled={changingStatus}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {action.label}
                    </button>
                  );
                })}

                {/* Assign Button */}
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  มอบหมาย
                </button>
              </div>

              {/* Assign Dropdown */}
              {showAssign && (
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={assigningTo}
                    onChange={(e) => setAssigningTo(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- เลือกผู้รับผิดชอบ --</option>
                    {adminUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role] || u.role})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!assigningTo}
                    className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    ยืนยัน
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Replies Thread */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              การสนทนา ({replies.length})
            </h2>
          </div>

          {/* Replies List */}
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {replies.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีการตอบกลับ</p>
              </div>
            ) : (
              replies.map(reply => {
                const isOwnReply = reply.user_id === user?.id;
                return (
                  <div
                    key={reply.id}
                    className={`p-4 ${reply.is_internal_note ? 'bg-amber-50 border-l-4 border-amber-400' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${isOwnReply ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                        {reply.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{reply.user?.name || '-'}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {ROLE_LABELS[reply.user?.role] || reply.user?.role}
                          </span>
                          {reply.is_internal_note && (
                            <span className="text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">
                              บันทึกภายใน
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</div>
                        {renderAttachments(reply.attachments)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={repliesEndRef} />
          </div>

          {/* Reply Form */}
          {issue.status !== 'closed' && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <form onSubmit={handleSubmitReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-sm"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    {/* File Upload */}
                    <label className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-indigo-600">
                      <Paperclip className="w-4 h-4" />
                      <span>แนบไฟล์</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                        onChange={(e) => {
                          const newFiles = Array.from(e.target.files);
                          setReplyFiles(prev => [...prev, ...newFiles].slice(0, 5));
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                    {replyFiles.length > 0 && (
                      <span className="text-xs text-gray-400">{replyFiles.length} ไฟล์</span>
                    )}

                    {/* Internal Note (Admin only) */}
                    {isAdmin && (
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-amber-700 text-xs">บันทึกภายใน</span>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReply || !replyContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>ส่ง</span>
                  </button>
                </div>

                {/* File Preview */}
                {replyFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {replyFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                        {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
                        <button type="button" onClick={() => setReplyFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
