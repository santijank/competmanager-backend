import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

export default function ResultList() {
  const { user, isAdmin, isCommittee, isTeacher, hasRole } = useAuthStore();
  const isSchoolAdmin = hasRole(['school_admin']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    competition_id: '',
    level: '',
    medal: '',
  });

  useEffect(() => {
    fetchResults();
  }, [filters]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // ⭐ Teacher จะถูก filter โดยอัตโนมัติจาก backend
      const params = { ...filters };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/results', { params });
      let data = response.data.data || [];
      
      // ✅ Filter for school_admin - show only their school's results
      if (isSchoolAdmin && user.school_id) {
        data = data.filter(result => 
          result.registration?.school_id === user.school_id
        );
      }
      
      setResults(data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (medal) => {
    const icons = {
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
    };
    return icons[medal] || '';
  };

  const getMedalBadge = (medal) => {
    const badges = {
      gold: <span className="badge badge-warning">🥇 ทอง</span>,
      silver: <span className="badge badge-secondary">🥈 เงิน</span>,
      bronze: <span className="badge badge-danger">🥉 ทองแดง</span>,
    };
    return badges[medal] || <span className="badge">-</span>;
  };

  const getLevelBadge = (level) => {
    const badges = {
      group: <span className="badge badge-info">กลุ่ม</span>,
      district: <span className="badge badge-primary">เขต</span>,
    };
    return badges[level] || level;
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <Trophy className="inline h-8 w-8 mr-2 text-yellow-500" />
            ผลการแข่งขัน
          </h1>
          {(isTeacher() || isSchoolAdmin) && (
            <p className="text-gray-600 mt-1">
              โรงเรียน: {user.school?.name || '-'}
            </p>
          )}
        </div>
        {(isAdmin() || isCommittee()) && (
          <Link to="/results/create" className="btn btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            บันทึกผลการแข่งขัน
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">เหรียญทอง</div>
              <div className="text-2xl font-bold text-yellow-600">
                {results.filter(r => r.medal === 'gold').length}
              </div>
            </div>
            <div className="text-4xl">🥇</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">เหรียญเงิน</div>
              <div className="text-2xl font-bold text-gray-600">
                {results.filter(r => r.medal === 'silver').length}
              </div>
            </div>
            <div className="text-4xl">🥈</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">เหรียญทองแดง</div>
              <div className="text-2xl font-bold text-orange-600">
                {results.filter(r => r.medal === 'bronze').length}
              </div>
            </div>
            <div className="text-4xl">🥉</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
              <div className="text-2xl font-bold text-blue-600">
                {results.length > 0
                  ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">ระดับ</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="input"
            >
              <option value="">ทั้งหมด</option>
              <option value="group">กลุ่ม</option>
              <option value="district">เขต</option>
            </select>
          </div>

          <div>
            <label className="label">เหรียญ</label>
            <select
              value={filters.medal}
              onChange={(e) => setFilters({ ...filters, medal: e.target.value })}
              className="input"
            >
              <option value="">ทั้งหมด</option>
              <option value="gold">🥇 ทอง</option>
              <option value="silver">🥈 เงิน</option>
              <option value="bronze">🥉 ทองแดง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อันดับ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การแข่งขัน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">โรงเรียน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระดับ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คะแนน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เหรียญ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getMedalIcon(result.medal)}</span>
                      <span className="text-lg font-bold text-gray-900">
                        #{result.rank || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {result.competition?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.competition?.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {result.registration?.school?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLevelBadge(result.level)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-blue-600">
                      {result.score}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getMedalBadge(result.medal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีผลการแข่งขัน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
