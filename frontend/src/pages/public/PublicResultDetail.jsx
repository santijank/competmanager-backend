import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Award,
  School,
  User,
  MapPin,
} from 'lucide-react';
import api from '@/lib/api';

/**
 * 🏆 Public Result Detail - หน้าแสดงผลรายละเอียดการแข่งขัน
 */
const PublicResultDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);

  useEffect(() => {
    fetchCompetitionDetail();
  }, [id]);

  const fetchCompetitionDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/results/${id}`);
      setCompetition(response.data);
    } catch (error) {
      console.error('❌ Error fetching detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      group: { color: 'bg-blue-100 text-blue-800', text: 'ระดับกลุ่ม' },
      district: { color: 'bg-purple-100 text-purple-800', text: 'ระดับเขต' }
    };
    const badge = badges[level] || badges.group;
    return (
      <span className={`px-3 py-1 ${badge.color} text-sm font-medium rounded-full`}>
        {badge.text}
      </span>
    );
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'border-yellow-400 bg-yellow-50';
    if (rank === 2) return 'border-gray-400 bg-gray-50';
    if (rank === 3) return 'border-orange-400 bg-orange-50';
    return 'border-gray-200 bg-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ไม่พบข้อมูลการแข่งขัน</p>
            <button
              onClick={() => navigate('/results')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              กลับหน้าผลการแข่งขัน
            </button>
          </div>
        </div>
      </div>
    );
  }

  // เรียงลำดับผู้เข้าแข่งขันตามอันดับ
  const sortedRegistrations = [...(competition.registrations || [])]
    .filter(r => r.score?.rank)
    .sort((a, b) => (a.score?.rank || 999) - (b.score?.rank || 999));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/results')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>กลับหน้าผลการแข่งขัน</span>
        </button>

        {/* Competition Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {competition.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{competition.category?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    ประกาศผล: {new Date(competition.published_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            {getLevelBadge(competition.competition_level)}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sortedRegistrations.length}
              </div>
              <div className="text-sm text-gray-600">ผู้เข้าแข่งขัน</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sortedRegistrations.filter(r => r.score?.rank && r.score.rank <= 3).length}
              </div>
              <div className="text-sm text-gray-600">รางวัล Top 3</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sortedRegistrations[0]?.score?.score ? parseFloat(sortedRegistrations[0].score.score).toFixed(2) : '-'}
              </div>
              <div className="text-sm text-gray-600">คะแนนสูงสุด</div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ผลการแข่งขัน</h2>
          </div>

          {sortedRegistrations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              ยังไม่มีข้อมูลผลการแข่งขัน
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedRegistrations.map((reg) => {
                const rank = reg.score?.rank || 0;
                const score = parseFloat(reg.score?.score) || 0;
                
                return (
                  <div
                    key={reg.id}
                    className={`p-5 hover:bg-gray-50 transition-colors border-l-4 ${getMedalColor(rank)}`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank & Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Medal/Rank */}
                        <div className="text-center w-16">
                          {rank ? (
                            <>
                              <div className="text-3xl">{getMedalIcon(rank)}</div>
                              <div className="text-sm font-semibold text-gray-700">
                                อันดับ {rank}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">-</div>
                          )}
                        </div>

                        {/* School & Student Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <School className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              {reg.school?.name || 'ไม่ระบุโรงเรียน'}
                            </span>
                          </div>
                          {reg.team_name && (
                            <div className="text-sm text-gray-600">
                              ทีม: {reg.team_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {score.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">คะแนน</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/results')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← กลับหน้าผลการแข่งขัน
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicResultDetail;
