import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Users, Phone, Mail, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { registrationService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import { format } from 'date-fns';

export default function RegistrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isCommittee, isGroupAdmin } = useAuthStore();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchRegistration();
  }, [id]);

  const fetchRegistration = async () => {
    try {
      const response = await registrationService.getById(id);
      setRegistration(response.data.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      navigate('/registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการอนุมัติ',
      message: 'คุณแน่ใจหรือไม่ที่จะอนุมัติการลงทะเบียนนี้?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await registrationService.approve(id);
          toast.success('อนุมัติการลงทะเบียนสำเร็จ');
          fetchRegistration();
        } catch (error) {
          toast.error('ไม่สามารถอนุมัติได้');
        }
      },
    });
  };

  const handleReject = async () => {
    const notes = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!notes) return;

    try {
      await registrationService.reject(id, { admin_notes: notes });
      toast.success('ปฏิเสธการลงทะเบียนสำเร็จ');
      fetchRegistration();
    } catch (error) {
      toast.error('ไม่สามารถปฏิเสธได้');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'รออนุมัติ', class: 'badge-warning' },
      approved: { text: 'อนุมัติแล้ว', class: 'badge-success' },
      rejected: { text: 'ปฏิเสธ', class: 'badge-danger' },
    };
    const badge = badges[status] || { text: status, class: 'badge-gray' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const canApprove = (isAdmin() || isCommittee() || isGroupAdmin()) && 
                      registration?.status === 'pending';

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบข้อมูลการลงทะเบียน</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/registrations')}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดการลงทะเบียน</h1>
            <p className="text-gray-600 mt-1">รหัส: {registration.registration_code}</p>
          </div>
        </div>
        {getStatusBadge(registration.status)}
      </div>

      {/* Action Buttons */}
      {canApprove && (
        <div className="card mb-6">
          <div className="flex gap-4">
            <button onClick={handleApprove} className="btn btn-success">
              <CheckCircle className="h-5 w-5 mr-2" />
              อนุมัติ
            </button>
            <button onClick={handleReject} className="btn btn-danger">
              <XCircle className="h-5 w-5 mr-2" />
              ปฏิเสธ
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Competition Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              ข้อมูลการแข่งขัน
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">ชื่อการแข่งขัน:</span>
                <p className="font-medium">
                  {registration.competition ? (
                    <Link 
                      to={`/competitions/${registration.competition.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {registration.competition.name}
                    </Link>
                  ) : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">รหัสการแข่งขัน:</span>
                <p className="font-medium">{registration.competition?.code || '-'}</p>
              </div>
              {registration.competition?.level && (
                <div>
                  <span className="text-sm text-gray-500">ระดับ:</span>
                  <p className="font-medium">{registration.competition.level}</p>
                </div>
              )}
            </div>
          </div>

          {/* School Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              ข้อมูลโรงเรียน
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">ชื่อโรงเรียน:</span>
                <p className="font-medium">{registration.school?.name || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">กลุ่มโรงเรียน:</span>
                <p className="font-medium">{registration.school_group?.name || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">เบอร์โทรติดต่อ:</span>
                <p className="font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {registration.contact_phone || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Students */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              นักเรียนผู้เข้าแข่งขัน
            </h2>
            <div className="space-y-3">
              {registration.students && registration.students.length > 0 ? (
                registration.students.map((student, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          ชั้น {student.grade} ห้อง {student.class}
                        </p>
                      </div>
                      <span className="badge badge-primary">#{index + 1}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">ไม่มีข้อมูลนักเรียน</p>
              )}
            </div>
          </div>

          {/* Teachers */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              ครูผู้ฝึกสอน
            </h2>
            <div className="space-y-3">
              {registration.teachers && registration.teachers.length > 0 ? (
                registration.teachers.map((teacher, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{teacher.name}</p>
                    {teacher.phone && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {teacher.phone}
                      </p>
                    )}
                    {teacher.email && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {teacher.email}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">ไม่มีข้อมูลครู</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {registration.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">หมายเหตุ</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{registration.notes}</p>
            </div>
          )}

          {/* Admin Notes (if rejected) */}
          {registration.admin_notes && (
            <div className="card bg-red-50 border-red-200">
              <h2 className="text-lg font-semibold mb-4 text-red-900">เหตุผลที่ปฏิเสธ</h2>
              <p className="text-red-700 whitespace-pre-wrap">{registration.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">ไทม์ไลน์</h2>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">ลงทะเบียนเมื่อ</p>
                  <p className="text-sm text-gray-500">
                    {registration.created_at && format(new Date(registration.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {/* Approved */}
              {registration.approved_at && (
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">อนุมัติเมื่อ</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(registration.approved_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {registration.rejected_at && (
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">ปฏิเสธเมื่อ</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(registration.rejected_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">การดำเนินการ</h2>
            <div className="space-y-2">
              <Link
                to="/registrations"
                className="btn btn-outline w-full"
              >
                กลับหน้ารายการ
              </Link>
              {registration.competition?.id && (
                <Link
                  to={`/competitions/${registration.competition.id}`}
                  className="btn btn-outline w-full"
                >
                  ดูข้อมูลการแข่งขัน
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="ยืนยัน"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
