import React, { useState, useMemo } from 'react';
import CompetitionCard from './CompetitionCard';

const CompetitionList = ({ 
  competitions, 
  selectedCompetition, 
  onSelectCompetition,
  categoryName 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  // Get unique levels
  const levels = useMemo(() => {
    const uniqueLevels = [...new Set(competitions.map(c => c.level))];
    return uniqueLevels.sort();
  }, [competitions]);

  // Filter competitions
  const filteredCompetitions = useMemo(() => {
    return competitions.filter(comp => {
      const matchSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = filterLevel === 'all' || comp.level === filterLevel;
      return matchSearch && matchLevel;
    });
  }, [competitions, searchTerm, filterLevel]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          เลือกรายการแข่งขัน
        </h3>
        {categoryName && (
          <p className="text-sm text-gray-600 mt-1">
            หมวด: {categoryName} • {competitions.length} รายการ
          </p>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหารายการแข่งขัน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Level Filter */}
        <div className="sm:w-48">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทุกระดับชั้น</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          แสดง {filteredCompetitions.length} จาก {competitions.length} รายการ
        </span>
        {selectedCompetition && (
          <button
            onClick={() => onSelectCompetition(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ยกเลิกการเลือก
          </button>
        )}
      </div>

      {/* Competition Cards */}
      {filteredCompetitions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCompetitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              isSelected={selectedCompetition?.id === competition.id}
              onSelect={onSelectCompetition}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">ไม่พบรายการแข่งขันที่ตรงกับเงื่อนไข</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionList;