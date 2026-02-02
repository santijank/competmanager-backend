import { useState, useEffect } from 'react';
import { 
  Trophy, 
  ChevronDown, 
  ChevronRight, 
  Award,
  Calendar,
  TrendingUp
} from 'lucide-react';
import api from '@/lib/api';

/**
 * 🏆 หน้าประกาศผลสาธารณะ - ไม่ต้อง login
 * แสดงผลการแข่งขันที่ประกาศแล้ว จัดกลุ่มตามหมวดหมู่
 */
export default function PublicResults() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/results');
      
      // จัดกลุ่มตามหมวดหมู่
      const grouped = groupByCategory(response.data);
      setCategories(grouped);
      
      // ขยายหมวดแรกโดยอัตโนมัติ
      if (grouped.length > 0) {
        setExpandedCategories(new Set([grouped[0].id]));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (competitions) => {
    const groups = {};
    
    competitions.forEach(comp => {
      const categoryId = comp.category?.id || 'other';
      const categoryName = comp.category?.name || 'อื่นๆ';
      
      if (!groups[categoryId]) {
        groups[categoryId] = {
          id: categoryId,
          name: categoryName,
          competitions: []
        };
      }
      
      groups[categoryId].competitions.push(comp);
    });
    
    return Object.values(groups).sort((a, b) => 
      a.name.localeCompare(b.name, 'th')
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getMedalIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('ศิลป')) return '🎨';
    if (name.includes('วิทย')) return '🔬';
    if (name.includes('ภาษา')) return '📚';
    if (name.includes('คณิต')) return '🔢';
    if (name.includes('กีฬา')) return '⚽';
    if (name.includes('ดนตรี') || name.includes('นาฏ')) return '🎵';
    if (name.includes('คอมพิวเตอร์')) return '💻';
    return '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดผลการแข่งขัน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-t-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-10 h-10 text-yellow-500" />
                <h1 className="text-4xl font-bold text-gray-900">
                  ผลการแข่งขัน
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">ประกาศผลแล้ว</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {categories.reduce((sum, cat) => sum + cat.competitions.length, 0)}
              </p>
              <p className="text-sm text-gray-500">รายการ</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">ยังไม่มีการประกาศผล</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map(category => {
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-gray-500" />
                      )}
                      <span className="text-3xl">{getCategoryIcon(category.name)}</span>
                      <div className="text-left">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {category.name}
                        </h2>
                        <p className="text-gray-500">
                          {category.competitions.length} รายการ
                        </p>
                      </div>
                    </div>
                    
                    <Award className="w-8 h-8 text-blue-500" />
                  </button>

                  {/* Competitions List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {category.competitions.map(comp => {
                        // เรียงลำดับผู้เข้าแข่งขันตามคะแนน
                        const sortedRegistrations = [...(comp.registrations || [])]
                          .filter(r => r.status === 'approved')
                          .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

                        return (
                          <div key={comp.id} className="p-6 border-b border-gray-200 last:border-b-0">
                            
                            {/* Competition Header */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {comp.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  comp.competition_level === 'group' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {comp.competition_level === 'group' ? '🏫 ระดับกลุ่ม' : '🏆 ระดับเขต'}
                                </span>
                              </div>
                              
                              {comp.published_at && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    ประกาศผลเมื่อ: {new Date(comp.published_at).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Results Table */}
                            {sortedRegistrations.length > 0 ? (
                              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <table className="w-full">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">
                                        อันดับ
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        โรงเรียน
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        ผู้เข้าแข่งขัน
                                      </th>
                                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">
                                        คะแนน
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {sortedRegistrations.map((reg, index) => (
                                      <tr key={reg.id} className={`
                                        ${index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                                        transition-colors
                                      `}>
                                        <td className="px-4 py-4">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{getMedalIcon(index + 1)}</span>
                                            <span className="font-bold text-gray-900">{index + 1}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-4">
                                          <span className="font-medium text-gray-900">
                                            {reg.school?.name || 'ไม่ระบุ'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-700">
                                          {reg.student?.name || reg.team_name || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                          <span className={`text-lg font-bold ${
                                            index === 0 ? 'text-yellow-600' :
                                            index === 1 ? 'text-gray-600' :
                                            index === 2 ? 'text-orange-600' :
                                            'text-gray-900'
                                          }`}>
                                            {reg.final_score?.toFixed(2) || '0.00'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                ไม่มีข้อมูลผู้เข้าแข่งขัน
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 สำนักงานเขตพื้นที่การศึกษานครปฐม เขต 1</p>
        </div>
      </div>
    </div>
  );
}
