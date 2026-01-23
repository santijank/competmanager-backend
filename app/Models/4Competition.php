import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { competitionService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { format } from 'date-fns';
import JudgeManagement from '../../components/judges/JudgeManagement';

// ✅ Tab Component
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isCommittee, isGroupAdmin } = useAuthStore();
  
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [registrationsCount, setRegistrationsCount] = useState(0);

  useEffect(() => {
    fetchCompetition();
    fetchRegistrationsCount();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const response = await competitionService.getById(id);
      setCompetition(response.data.data || response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationsCount = async () => {
    try {
      // สมมติว่ามี API endpoint นี้ หรือดึงจาก competition data
      // const response = await api.get(`/competitions/${id}/registrations/count`);
      // setRegistrationsCount(response.data.count);
      
      // ถ้าไม่มี API แยก ให้ใช้จาก competition.participants_count
      // จะ update หลังจาก fetchCompetition เสร็จ
    } catch (error) {
      console.error('Error fetching registrations count:', error);
    }
  };

  // อัปเดต registrationsCount จาก competition data
  useEffect(() => {
    if (competition) {
      setRegistrationsCount(competition.participants_count || 0);
    }
  }, [competition]);

  const handleDelete = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบการแข่งขันนี้?')) return;

    try {
      await competitionService.delete(id);
      toast.success('ลบการแข่งขันสำเร็จ');
      navigate('/competitions');
    } catch (error) {
      toast.error('ไม่สามารถลบการแข่งขันได้');
    }
  };

  const canEdit = isAdmin() || isCommittee() || isGroupAdmin();
  const canDelete = isAdmin() || isCommittee();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  if (!competition) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/competitions')}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
            <p className="text-gray-600 mt-1">รหัส: {competition.code}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/competitions/${id}/edit`}
              className="btn btn-outline"
            >
              <Edit className="h-5 w-5 mr-2" />
              แก้ไข
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              ลบ
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <TabButton
              active={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            >
              รายละเอียด
            </TabButton>
            
            <TabButton
              active={activeTab === 'registrations'}
              onClick={() => setActiveTab('registrations')}
            >
              ทีมที่ลงทะเบียน ({registrationsCount})
            </TabButton>
            
            {/* ✅ แสดง Tab กรรมการเฉพาะเมื่อมีทีมลงทะเบียน */}
            {registrationsCount > 0 && (
              <TabButton
                active={activeTab === 'judges'}
                onClick={() => setActiveTab('judges')}
              >
                กรรมการตัดสิน
              </TabButton>
            )}
            
            {/* ✅ แสดง Tab ลงคะแนนเฉพาะเมื่อมีทีมลงทะเบียน */}
            {registrationsCount > 0 && (
              <TabButton
                active={activeTab === 'scoring'}
                onClick={() => setActiveTab('scoring')}
              >
                ลงคะแนน
              </TabButton>
            )}
            
            <TabButton
              active={activeTab === 'results'}
              onClick={() => setActiveTab('results')}
            >
              ผลการแข่งขัน
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab: รายละเอียด */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียด</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {competition.description || 'ไม่มีรายละเอียด'}
                  </p>
                </div>

                {/* Rules */}
                {competition.rules && (
                  <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">กติกา</h2>
                    <p className="text-gray-700 whitespace-pre-line">{competition.rules}</p>
                  </div>
                )}

                {/* Venue & Contact */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานที่และผู้ติดต่อ</h2>
                  <div className="space-y-3">
                    {competition.venue && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">สถานที่</p>
                          <p className="text-gray-600">{competition.venue}</p>
                        </div>
                      </div>
                    )}
                    {competition.contact_person && (
                      <div className="flex items-start">
                        <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">ผู้ติดต่อ</p>
                          <p className="text-gray-600">{competition.contact_person}</p>
                          {competition.contact_phone && (
                            <p className="text-gray-600">{competition.contact_phone}</p>
                          )}
                          {competition.contact_email && (
                            <p className="text-gray-600">{competition.contact_email}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">สถานะ</h3>
                  <div className="space-y-2">
                    <div>
                      {competition.is_active ? (
                        <span className="badge badge-success">เปิดใช้งาน</span>
                      ) : (
                        <span className="badge badge-gray">ปิดใช้งาน</span>
                      )}
                    </div>
                    <div>
                      {competition.registration_status === 'open' ? (
                        <span className="badge badge-success">เปิดรับสมัคร</span>
                      ) : competition.registration_status === 'closed' ? (
                        <span className="badge badge-danger">ปิดรับสมัคร</span>
                      ) : (
                        <span className="badge badge-warning">ร่าง</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">วันที่</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">วันแข่งขัน</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(competition.start_date), 'dd/MM/yyyy')}
                        {competition.end_date !== competition.start_date && 
                          ` - ${format(new Date(competition.end_date), 'dd/MM/yyyy')}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">วันรับสมัคร</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(competition.registration_start_date), 'dd/MM/yyyy')}
                        {' - '}
                        {format(new Date(competition.registration_end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">จำนวนผู้เข้าร่วม</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">นักเรียน:</span>
                      <span className="font-medium">
                        {competition.min_students === competition.max_students 
                          ? `${competition.max_students} คน`
                          : `${competition.min_students}-${competition.max_students} คน`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ครู:</span>
                      <span className="font-medium">
                        {competition.min_teachers === competition.max_teachers 
                          ? `${competition.max_teachers} คน`
                          : `${competition.min_teachers}-${competition.max_teachers} คน`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">กรรมการ:</span>
                      <span className="font-medium">
                        {competition.min_judges === competition.max_judges 
                          ? `${competition.max_judges} คน`
                          : `${competition.min_judges}-${competition.max_judges} คน`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">การดำเนินการ</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('registrations')}
                      className="w-full btn btn-outline text-sm"
                    >
                      ดูการลงทะเบียน
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className="w-full btn btn-outline text-sm"
                    >
                      ดูผลการแข่งขัน
                    </button>
                    <Link
                      to={`/results/leaderboard/${id}`}
                      className="w-full btn btn-primary text-sm flex items-center justify-center"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      กระดานคะแนน
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: ทีมที่ลงทะเบียน */}
          {activeTab === 'registrations' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">ทีมที่ลงทะเบียน</h2>
              {registrationsCount > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800">
                    มีทีมลงทะเบียนแล้ว {registrationsCount} ทีม
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">ยังไม่มีทีมลงทะเบียน</p>
                </div>
              )}
              
              {/* TODO: เพิ่ม RegistrationList component ที่นี่ */}
              <div className="text-center text-gray-500 py-8">
                <p>Component RegistrationList จะแสดงที่นี่</p>
                <Link 
                  to={`/registrations?competition_id=${id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  ดูรายการทั้งหมด →
                </Link>
              </div>
            </div>
          )}

          {/* Tab: กรรมการตัดสิน */}
          {activeTab === 'judges' && (
            <JudgeManagement competitionId={id} />
          )}

          {/* Tab: ลงคะแนน */}
          {activeTab === 'scoring' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">ลงคะแนน</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">ระบบลงคะแนน</p>
                {/* TODO: เพิ่ม ScoreManagement component ที่นี่ */}
                <Link 
                  to={`/scores?competition_id=${id}`}
                  className="btn btn-primary"
                >
                  เข้าสู่หน้าลงคะแนน
                </Link>
              </div>
            </div>
          )}

          {/* Tab: ผลการแข่งขัน */}
          {activeTab === 'results' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">ผลการแข่งขัน</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">ผลการแข่งขันและเหรียญรางวัล</p>
                {/* TODO: เพิ่ม ResultsList component ที่นี่ */}
                <Link 
                  to={`/results/leaderboard/${id}`}
                  className="btn btn-primary"
                >
                  ดูกระดานคะแนน
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
