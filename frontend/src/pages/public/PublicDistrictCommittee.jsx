import { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import api from '@/lib/api';

const PublicDistrictCommittee = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/district-committee-members');

      if (response.data.success) {
        setGroups(response.data.data || []);
        setTotalMembers(response.data.total_members || 0);

        // Auto-expand all groups
        const data = response.data.data || [];
        if (data.length > 0) {
          setExpandedGroups(new Set(data.map(g => g.type)));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (type) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'committee': return <UserCheck className="w-5 h-5 text-amber-600" />;
      case 'staff': return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'volunteer': return <Users className="w-5 h-5 text-green-600" />;
      default: return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'committee': return 'border-amber-200 bg-amber-50';
      case 'staff': return 'border-blue-200 bg-blue-50';
      case 'volunteer': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="text-blue-200 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-2xl font-bold">คณะกรรมการระดับเขตพื้นที่</h1>
          </div>
          <p className="text-blue-200 ml-8">
            งานศิลปหัตถกรรมนักเรียน ระดับเขตพื้นที่การศึกษา
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-6 ml-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{totalMembers}</div>
              <div className="text-blue-200 text-sm">รายชื่อทั้งหมด</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{groups.length}</div>
              <div className="text-blue-200 text-sm">ประเภท</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Refresh */}
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีข้อมูลคณะกรรมการ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.type} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.type)}
                  className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(group.type)}
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-gray-900">{group.label}</h2>
                      <p className="text-sm text-gray-500">{group.count} คน</p>
                    </div>
                  </div>
                  {expandedGroups.has(group.type) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Members Table */}
                {expandedGroups.has(group.type) && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`text-sm ${getTypeColor(group.type)}`}>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 w-16">ลำดับ</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700">ตำแหน่ง</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700">สังกัด</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700">หน้าที่</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.members.map((member, idx) => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3 text-sm text-gray-500 text-center">{idx + 1}</td>
                              <td className="px-6 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">{member.position || '-'}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">{member.organization || '-'}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">{member.responsibility || member.competition || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDistrictCommittee;
