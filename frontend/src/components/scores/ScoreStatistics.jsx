// ไฟล์: frontend/src/components/scores/ScoreStatistics.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Trophy,
  Medal,
  Award,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import scoreService from '@/services/scoreService';

/**
 * 📊 Score Statistics Component
 * 
 * แสดงสถิติคะแนน:
 * - จำนวนเหรียญแต่ละประเภท
 * - คะแนนเฉลี่ย, สูงสุด, ต่ำสุด
 * - กราฟแจกแจง (optional)
 */
const ScoreStatistics = ({ competitionId }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [competitionId]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await scoreService.getStatistics(competitionId);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('ไม่สามารถโหลดสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="ml-2 text-gray-600">กำลังโหลดสถิติ...</span>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const medalStats = [
    {
      type: 'gold',
      label: 'ทอง',
      count: statistics.medals?.gold || 0,
      color: 'yellow',
      icon: Trophy,
    },
    {
      type: 'silver',
      label: 'เงิน',
      count: statistics.medals?.silver || 0,
      color: 'gray',
      icon: Medal,
    },
    {
      type: 'bronze',
      label: 'ทองแดง',
      count: statistics.medals?.bronze || 0,
      color: 'orange',
      icon: Award,
    },
    {
      type: 'participant',
      label: 'เข้าร่วม',
      count: statistics.medals?.participant || 0,
      color: 'blue',
      icon: Users,
    },
  ];

  const scoreStats = [
    {
      label: 'คะแนนเฉลี่ย',
      value: statistics.average_score?.toFixed(2) || '0.00',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      label: 'คะแนนสูงสุด',
      value: statistics.highest_score?.toFixed(2) || '0.00',
      icon: Trophy,
      color: 'green',
    },
    {
      label: 'คะแนนต่ำสุด',
      value: statistics.lowest_score?.toFixed(2) || '0.00',
      icon: BarChart3,
      color: 'red',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        สถิติคะแนน
      </h3>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scoreStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Medal Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">การกระจายตัวของเหรียญ</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {medalStats.map((medal) => {
            const Icon = medal.icon;
            const percentage = statistics.total_participants > 0
              ? ((medal.count / statistics.total_participants) * 100).toFixed(1)
              : 0;

            return (
              <div key={medal.type} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-2 bg-${medal.color}-100 rounded-full flex items-center justify-center`}>
                  <Icon className={`h-8 w-8 text-${medal.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{medal.count}</p>
                <p className="text-sm text-gray-600">{medal.label}</p>
                <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Distribution Bar */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">การกระจายตัวของคะแนน</h4>
        <div className="space-y-2">
          {medalStats.map((medal) => {
            const percentage = statistics.total_participants > 0
              ? (medal.count / statistics.total_participants) * 100
              : 0;

            return (
              <div key={medal.type} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600">{medal.label}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`bg-${medal.color}-500 h-full rounded-full transition-all duration-500 flex items-center justify-end px-2`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 10 && (
                      <span className="text-xs font-medium text-white">
                        {medal.count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-600">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ผู้เข้าร่วมทั้งหมด</span>
          <span className="font-semibold text-gray-900">{statistics.total_participants} คน</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">ให้คะแนนแล้ว</span>
          <span className="font-semibold text-gray-900">{statistics.scored_count} / {statistics.total_participants}</span>
        </div>
        {statistics.absent_count > 0 && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">ขาดสอบ</span>
            <span className="font-semibold text-red-600">{statistics.absent_count} คน</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreStatistics;
