import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ScoreExportButtons from '@/components/scores/ScoreExportButtons';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  ArrowLeft,
  Save,
  Lock,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Trophy,
  TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

/**
 * 🎯 Score Entry - หน้าใส่คะแนนจริง
 * 
 * Features:
 * - Bulk score entry (ใส่หลายทีมพร้อมกัน)
 * - Real-time medal preview
 * - Auto calculate rank
 * - Save draft
 * - Finalize scores
 */
const ScoreEntry = () => {
  const navigate = useNavigate();
  const { id: competitionId } = useParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [promotingToDistrict, setPromotingToDistrict] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [competition, setCompetition] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchData();
  }, [competitionId]);

  /**
   * ✅ Fetch scorable registrations
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/competitions/${competitionId}/scorable`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCompetition(data.competition);
        setRegistrations(data.registrations);
        setStatistics(data.statistics);
        
        // Load existing scores
        const initialScores = {};
        const initialNotes = {};
        
        // ✅ เช็คว่าทุกทีมที่มีคะแนนต้อง finalized หมด
        const regsWithScores = data.registrations.filter(reg => reg.score);
        const allFinalized = regsWithScores.length > 0 && 
                             regsWithScores.every(reg => reg.score.is_finalized);
        
        console.log('📊 Score Status:', {
          totalRegistrations: data.registrations.length,
          regsWithScores: regsWithScores.length,
          allFinalized: allFinalized,
          isPublished: data.competition.is_published
        });
        
        data.registrations.forEach(reg => {
          if (reg.score) {
            initialScores[reg.id] = reg.score.score;
            initialNotes[reg.id] = reg.score.notes || '';
          }
        });
        
        setScores(initialScores);
        setNotes(initialNotes);
        setIsFinalized(allFinalized);
        setIsPublished(data.competition.is_published || false);
        
        console.log('✅ State Updated:', {
          isFinalized: allFinalized,
          isPublished: data.competition.is_published || false
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 403) {
        toast.error('คุณไม่มีสิทธิ์ใส่คะแนนการแข่งขันนี้');
        navigate('/scores');
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Calculate medal based on score
   */
  const calculateMedal = (score) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore === 0) return null;
    if (numScore >= 80) return 'gold';
    if (numScore >= 70) return 'silver';
    if (numScore >= 60) return 'bronze';
    return 'participant';
  };

  /**
   * ✅ Get medal display
   */
  const getMedalDisplay = (medal) => {
    const medals = {
      gold: { emoji: '🥇', text: 'ทอง', color: 'text-yellow-600 bg-yellow-100' },
      silver: { emoji: '🥈', text: 'เงิน', color: 'text-gray-600 bg-gray-100' },
      bronze: { emoji: '🥉', text: 'ทองแดง', color: 'text-orange-600 bg-orange-100' },
      participant: { emoji: '🎖️', text: 'เข้าร่วม', color: 'text-blue-600 bg-blue-100' },
    };
    
    return medals[medal] || null;
  };

  /**
   * ✅ Handle score change
   */
  const handleScoreChange = (registrationId, value) => {
    // Validate: 0-100
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      return;
    }
    
    setScores(prev => ({
      ...prev,
      [registrationId]: value
    }));
  };

  /**
   * ✅ Handle note change
   */
  const handleNoteChange = (registrationId, value) => {
    setNotes(prev => ({
      ...prev,
      [registrationId]: value
    }));
  };

  /**
   * ✅ Save scores (draft)
   */
  const handleSaveScores = async () => {
    // Prepare scores to save
    const scoresToSave = Object.entries(scores)
      .filter(([regId, score]) => score !== '' && score !== undefined)
      .map(([regId, score]) => ({
        registration_id: parseInt(regId),
        score: parseFloat(score),
        notes: notes[regId] || ''
      }));
    
    if (scoresToSave.length === 0) {
      toast.warning('กรุณาใส่คะแนนอย่างน้อย 1 ทีม');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await api.post(`/competitions/${competitionId}/scores`, {
        scores: scoresToSave
      });
      
      if (response.data.success) {
        toast.success('บันทึกคะแนนสำเร็จ');
        
        // Refresh data
        await fetchData();
      }
      
    } catch (error) {
      console.error('Error saving scores:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  /**
   * ✅ Finalize scores (lock)
   */
  const handleFinalizeScores = () => {
    // Check if all teams have scores
    const unscoredCount = registrations.filter(reg => !scores[reg.id] || scores[reg.id] === '').length;

    const canOverride = ['admin', 'district_admin', 'category_admin'].includes(user.role);
    const message = unscoredCount > 0
      ? `ยังมี ${unscoredCount} ทีมที่ยังไม่ได้ใส่คะแนน\n\nต้องการยืนยันคะแนนหรือไม่?\n\n` +
        `(หลังยืนยันแล้วจะไม่สามารถแก้ไขได้ ${canOverride ? 'เว้นแต่ผู้ดูแลระบบยกเลิกยืนยัน' : ''})`
      : 'ยืนยันคะแนนสุดท้าย?\n\n' +
        `หลังยืนยันแล้วจะไม่สามารถแก้ไขได้ ${canOverride ? 'เว้นแต่ผู้ดูแลระบบยกเลิกยืนยัน' : ''}`;

    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันคะแนน',
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setFinalizing(true);

          const response = await api.post(`/competitions/${competitionId}/finalize`);

          if (response.data.success) {
            toast.success('ยืนยันคะแนนสำเร็จ');
            setIsFinalized(true);

            // Refresh data
            await fetchData();
          }

        } catch (error) {
          console.error('Error finalizing scores:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยัน');
        } finally {
          setFinalizing(false);
        }
      },
    });
  };

  /**
   * ✅ Promote to district (Top 2 only)
   */
  const handlePromoteToDistrict = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ส่งผู้ผ่านเกณฑ์เข้ารอบเขต',
      message: 'ส่งผู้ผ่านเกณฑ์เข้ารอบเขต?\n\n' +
        '- จะส่งเฉพาะอันดับที่ 1 และ 2 เท่านั้น\n' +
        '- ระบบจะสร้างการลงทะเบียนใหม่สำหรับระดับเขต\n' +
        '- District Admin ต้องอนุมัติอีกครั้ง',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setPromotingToDistrict(true);

          const response = await api.post(`/competitions/${competitionId}/promote-to-district`);

          if (response.data.success) {
            const data = response.data.data;

            toast.success(
              `ส่งเข้ารอบเขตสำเร็จ ${data.promoted_count} ทีม`,
              { autoClose: 5000 }
            );

            // แสดงรายละเอียดผู้ที่ส่ง
            if (data.promoted_teams && data.promoted_teams.length > 0) {
              console.log('ทีมที่ส่งเข้ารอบเขต:', data.promoted_teams);

              const teamList = data.promoted_teams
                .map(t => `อันดับ ${t.rank}: ${t.team_name} (${t.school_name})`)
                .join('\n');

              setTimeout(() => {
                toast.info(
                  `ส่งเข้ารอบเขตสำเร็จ!\n${teamList}\nการแข่งขันระดับเขต: ${data.district_competition.name}`,
                  { autoClose: 10000 }
                );
              }, 500);
            }
          }

        } catch (error) {
          console.error('Error promoting:', error);
          toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งเข้ารอบเขต');
        } finally {
          setPromotingToDistrict(false);
        }
      },
    });
  };

  /**
   * 📢 Publish Results
   */
  const handlePublish = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ประกาศผลการแข่งขัน',
      message: 'คุณต้องการประกาศผลการแข่งขันนี้หรือไม่?\n\nผลจะถูกเผยแพร่ให้บุคคลทั่วไปสามารถดูได้',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setPublishing(true);
          await api.post(`/competitions/${competitionId}/publish`);
          toast.success('ประกาศผลสำเร็จ');
          setIsPublished(true);
          fetchData();
        } catch (error) {
          console.error('Error publishing:', error);
          toast.error(error.response?.data?.message || 'ไม่สามารถประกาศผลได้');
        } finally {
          setPublishing(false);
        }
      },
    });
  };

  /**
   * 🔙 Unpublish Results
   */
  const handleUnpublish = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ยกเลิกประกาศผล',
      message: 'คุณต้องการยกเลิกประกาศผลหรือไม่?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setUnpublishing(true);
          await api.post(`/competitions/${competitionId}/unpublish`);
          toast.success('ยกเลิกประกาศผลสำเร็จ');
          setIsPublished(false);
          fetchData();
        } catch (error) {
          console.error('Error unpublishing:', error);
          toast.error('ไม่สามารถยกเลิกประกาศผลได้');
        } finally {
          setUnpublishing(false);
        }
      },
    });
  };

  /**
   * 🔓 Unfinalize scores (admin/district_admin only)
   */
  const handleUnfinalize = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ยกเลิกการยืนยันคะแนน',
      message: 'คุณต้องการยกเลิกการยืนยันคะแนนหรือไม่?\n\nGroup Admin จะสามารถแก้ไขคะแนนได้อีกครั้ง',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await api.post(`/competitions/${competitionId}/unfinalize`);
          if (response.data.success) {
            toast.success('ยกเลิกการยืนยันคะแนนสำเร็จ');
            setIsFinalized(false);
            await fetchData();
          }
        } catch (error) {
          console.error('Error unfinalizing:', error);
          toast.error(error.response?.data?.message || 'ไม่สามารถยกเลิกการยืนยันคะแนนได้');
        }
      },
    });
  };

  /**
   * ✅ Calculate rank preview
   */
  const calculateRankPreview = () => {
    const scoredTeams = Object.entries(scores)
      .filter(([regId, score]) => score !== '' && parseFloat(score) > 0)
      .map(([regId, score]) => ({
        regId: parseInt(regId),
        score: parseFloat(score)
      }))
      .sort((a, b) => b.score - a.score);
    
    const ranks = {};
    let rank = 1;
    let previousScore = null;
    let sameRankCount = 0;
    
    scoredTeams.forEach(team => {
      if (previousScore !== null && team.score < previousScore) {
        rank += sameRankCount;
        sameRankCount = 1;
      } else {
        sameRankCount++;
      }
      
      ranks[team.regId] = rank;
      previousScore = team.score;
    });
    
    return ranks;
  };

  const rankPreview = calculateRankPreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/scores')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {competition?.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>รหัส: {competition?.code}</span>
                <span>หมวดหมู่: {competition?.category?.name || '-'}</span>
                {competition?.school_group?.name && (
                  <span>กลุ่ม: {competition.school_group.name}</span>
                )}
              </div>
            </div>
            
            {isFinalized && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg">
                <Lock className="w-4 h-4" />
                <span className="font-medium">ยืนยันคะแนนแล้ว</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">ทีมทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">ใส่คะแนนแล้ว</p>
              <p className="text-2xl font-bold text-green-600">{statistics.scored}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">ยังไม่ใส่</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.unscored}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">ยืนยันแล้ว</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.finalized}</p>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="mb-6">
          <ScoreExportButtons 
            competitionId={competitionId}
            hasScores={registrations.some(r => scores[r.id] && scores[r.id] !== '')}
          />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">เกณฑ์การให้เหรียญ:</p>
              <div className="flex items-center space-x-4">
                <span>🥇 ทอง: 80-100</span>
                <span>🥈 เงิน: 70-79</span>
                <span>🥉 ทองแดง: 60-69</span>
                <span>🎖️ เข้าร่วม: 1-59</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Entry Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '900px' }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '60px' }}>
                    ลำดับ
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    โรงเรียน
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ทีม
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '80px' }}>
                    จำนวนนักเรียน
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '160px' }}>
                    คะแนน
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '100px' }}>
                    เหรียญ
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '70px' }}>
                    อันดับ
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '150px' }}>
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      ไม่มีทีมที่ต้องใส่คะแนน
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg, index) => {
                    const score = scores[reg.id] || '';
                    const medal = score !== '' ? calculateMedal(score) : null;
                    const medalDisplay = medal ? getMedalDisplay(medal) : null;
                    const rank = rankPreview[reg.id];
                    const isLocked = reg.score?.is_finalized && !['admin', 'district_admin', 'category_admin'].includes(user.role);
                    
                    return (
                      <tr key={reg.id} className={isLocked ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-3 text-sm text-gray-900 text-center">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {reg.school.name}
                          </div>
                          {reg.school.school_group?.name && (
                            <div className="text-xs text-gray-500">
                              {reg.school.school_group.name}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {reg.team_name}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 text-center">
                          {reg.student_count}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={score}
                            onChange={(e) => handleScoreChange(reg.id, e.target.value)}
                            disabled={isLocked}
                            placeholder="0.00"
                            className={`w-full px-3 py-3 text-center text-lg font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isLocked
                                ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                                : 'border-gray-300 bg-yellow-50'
                            }`}
                            style={{ minWidth: '120px', fontSize: '18px' }}
                          />
                        </td>
                        <td className="px-3 py-3">
                          {medalDisplay && (
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center space-x-1 px-3 py-1 ${medalDisplay.color} text-xs font-medium rounded-full`}>
                                <span>{medalDisplay.emoji}</span>
                                <span>{medalDisplay.text}</span>
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {rank && (
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-semibold rounded-full">
                              {rank}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={notes[reg.id] || ''}
                            onChange={(e) => handleNoteChange(reg.id, e.target.value)}
                            disabled={isLocked}
                            placeholder="หมายเหตุ..."
                            className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isLocked
                                ? 'bg-gray-100 cursor-not-allowed'
                                : 'border-gray-300'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between space-x-4">
          <button
            onClick={() => navigate('/scores')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรช</span>
            </button>
            
            <button
              onClick={handleSaveScores}
              disabled={saving || (isFinalized && !['admin', 'district_admin', 'category_admin'].includes(user.role))}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกคะแนน</span>
                </>
              )}
            </button>
            
            {!isFinalized && user.role !== 'data_entry' && (
              <button
                onClick={handleFinalizeScores}
                disabled={finalizing}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finalizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังยืนยัน...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>ยืนยันคะแนนสุดท้าย</span>
                  </>
                )}
              </button>
            )}

            {/* ปุ่มยกเลิกยืนยัน - เฉพาะ admin/district_admin/category_admin */}
            {isFinalized && ['admin', 'district_admin', 'category_admin'].includes(user.role) && (
              <button
                onClick={handleUnfinalize}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ยกเลิกยืนยัน</span>
              </button>
            )}

            {/* ✅ ปุ่มส่งเข้ารอบเขต - แสดงเฉพาะระดับกลุ่มที่ finalize แล้ว (ไม่แสดงสำหรับ data_entry) */}
            {competition?.competition_level === 'group' && isFinalized && user.role !== 'data_entry' && (
              <button
                onClick={handlePromoteToDistrict}
                disabled={promotingToDistrict}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promotingToDistrict ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังส่งเข้ารอบเขต...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>ส่งเข้ารอบเขต (Top 2)</span>
                  </>
                )}
              </button>
            )}

            {/* 📢 ปุ่มประกาศผล - แสดงเฉพาะเมื่อ finalize แล้ว (ไม่แสดงสำหรับ data_entry) */}
            {isFinalized && !isPublished && user.role !== 'data_entry' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังประกาศผล...</span>
                  </>
                ) : (
                  <>
                    <span>📢</span>
                    <span>ประกาศผล</span>
                  </>
                )}
              </button>
            )}

            {/* ✅ แสดง Badge และปุ่มเมื่อประกาศผลแล้ว */}
            {isPublished && (
              <>
                <span className="flex items-center space-x-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
                  <span>✅</span>
                  <span>ประกาศผลแล้ว</span>
                </span>

                <button
                  onClick={() => window.open('/public-dashboard', '_blank')}
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>🔗</span>
                  <span>ดูผลสาธารณะ</span>
                </button>

                {user.role !== 'data_entry' && (
                  <button
                    onClick={handleUnpublish}
                    disabled={unpublishing}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {unpublishing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังยกเลิก...</span>
                      </>
                    ) : (
                      <span>ยกเลิกประกาศผล</span>
                    )}
                  </button>
                )}
              </>
            )}
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
};

export default ScoreEntry;
