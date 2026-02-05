import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, RefreshCw, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { resultService, competitionService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function ResultLeaderboard() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isCommittee } = useAuthStore();
  const [competition, setCompetition] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('group');
  const [calculating, setCalculating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchData();
  }, [competitionId, selectedLevel]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [competitionRes, resultsRes] = await Promise.all([
        competitionService.getById(competitionId),
        resultService.getLeaderboard(competitionId, selectedLevel),
      ]);
      setCompetition(competitionRes.data.data);
      setResults(resultsRes.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดกระดานคะแนนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRanks = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการคำนวณ',
      message: 'คุณแน่ใจหรือไม่ที่จะคำนวณอันดับใหม่?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setCalculating(true);
          await resultService.calculateRanks(competitionId, { level: selectedLevel });
          toast.success('คำนวณอันดับสำเร็จ');
          fetchData();
        } catch (error) {
          toast.error('ไม่สามารถคำนวณอันดับได้');
        } finally {
          setCalculating(false);
        }
      },
    });
  };

  const getMedalIcon = (medal) => {
    const medals = {
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
    };
    return medals[medal] || '';
  };

  const getMedalBadge = (medal) => {
    const badges = {
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return badges[medal] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-300 text-yellow-900';
    if (rank === 2) return 'bg-gray-50 border-gray-300 text-gray-900';
    if (rank === 3) return 'bg-orange-50 border-orange-300 text-orange-900';
    return 'bg-white border-gray-200';
  };

  const canManage = isAdmin() || isCommittee();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/results')}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              กระดานคะแนน
            </h1>
            {competition && (
              <p className="text-gray-600 mt-1">{competition.name}</p>
            )}
          </div>
        </div>
        {canManage && (
          <button
            onClick={handleCalculateRanks}
            disabled={calculating}
            className="btn btn-primary"
          >
            {calculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังคำนวณ...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                คำนวณอันดับใหม่
              </>
            )}
          </button>
        )}
      </div>

      {/* Level Tabs */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLevel('group')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedLevel === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ระดับกลุ่มโรงเรียน
          </button>
          <button
            onClick={() => setSelectedLevel('district')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedLevel === 'district'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ระดับเขตพื้นที่
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {results.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">ยังไม่มีผลการแข่งขัน</p>
          <p className="text-sm text-gray-500">
            บันทึกผลการแข่งขันเพื่อแสดงในกระดานคะแนน
          </p>
          {canManage && (
            <Link to="/results/create" className="btn btn-primary mt-4 inline-flex">
              บันทึกผลการแข่งขัน
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`card border-2 ${getRankBadge(result.rank)}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-16 text-center">
                  {result.rank <= 3 ? (
                    <div className="text-4xl">
                      {result.rank === 1 && '🥇'}
                      {result.rank === 2 && '🥈'}
                      {result.rank === 3 && '🥉'}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-400">
                      #{result.rank}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {result.registration?.students?.[0]?.name || 'ไม่ระบุ'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {result.registration?.school?.name || 'ไม่ระบุ'}
                      </p>
                      {result.registration?.school_group && (
                        <p className="text-xs text-gray-500 mt-1">
                          กลุ่ม: {result.registration.school_group.name}
                        </p>
                      )}
                    </div>

                    {/* Score & Medal */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">คะแนน</div>
                      </div>
                      {result.medal && (
                        <div className={`px-4 py-2 rounded-lg border-2 ${getMedalBadge(result.medal)}`}>
                          <div className="text-3xl mb-1">{getMedalIcon(result.medal)}</div>
                          <div className="text-xs font-medium text-center">
                            {result.medal === 'gold' && 'ทอง'}
                            {result.medal === 'silver' && 'เงิน'}
                            {result.medal === 'bronze' && 'ทองแดง'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  {result.comments && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      💬 {result.comments}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="card text-center">
            <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            <p className="text-sm text-gray-600">ผู้เข้าแข่งขัน</p>
          </div>
          <div className="card text-center bg-yellow-50">
            <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">
              {results.filter(r => r.medal === 'gold').length}
            </p>
            <p className="text-sm text-yellow-700">เหรียญทอง</p>
          </div>
          <div className="card text-center bg-gray-50">
            <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {results.filter(r => r.medal === 'silver').length}
            </p>
            <p className="text-sm text-gray-700">เหรียญเงิน</p>
          </div>
          <div className="card text-center bg-orange-50">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-900">
              {results.filter(r => r.medal === 'bronze').length}
            </p>
            <p className="text-sm text-orange-700">เหรียญทองแดง</p>
          </div>
        </div>
      )}

      {/* Back to Competition */}
      {competition && (
        <div className="mt-6">
          <Link
            to={`/competitions/${competition.id}`}
            className="btn btn-outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปยังการแข่งขัน
          </Link>
        </div>
      )}

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
