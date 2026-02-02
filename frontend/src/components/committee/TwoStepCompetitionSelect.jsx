import { useState, useEffect } from 'react';

const TwoStepCompetitionSelect = ({ value, onChange, competitions }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  useEffect(() => {
    // Find selected competition and its category
    if (value && competitions) {
      Object.keys(competitions).forEach(categoryName => {
        const found = competitions[categoryName].find(c => c.id === parseInt(value));
        if (found) {
          setSelectedCategory(categoryName);
          setSelectedCompetition(found);
        }
      });
    } else {
      setSelectedCategory('');
      setSelectedCompetition(null);
    }
  }, [value, competitions]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    // Reset competition when category changes
    if (category !== selectedCategory) {
      setSelectedCompetition(null);
      onChange('');
    }
  };

  const handleCompetitionChange = (e) => {
    const compId = e.target.value;
    onChange(compId);
    
    if (compId && selectedCategory) {
      const comp = competitions[selectedCategory].find(c => c.id === parseInt(compId));
      setSelectedCompetition(comp);
    } else {
      setSelectedCompetition(null);
    }
  };

  const categories = competitions ? Object.keys(competitions).sort() : [];
  const competitionsInCategory = selectedCategory && competitions ? competitions[selectedCategory] : [];

  return (
    <div className="space-y-3">
      {/* Step 1: Select Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          1. เลือกหมวดหมู่
        </label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- เลือกหมวดหมู่ --</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Select Competition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          2. เลือกการแข่งขัน
        </label>
        <select
          value={value || ''}
          onChange={handleCompetitionChange}
          disabled={!selectedCategory}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {selectedCategory ? '-- เลือกการแข่งขัน --' : 'กรุณาเลือกหมวดหมู่ก่อน'}
          </option>
          {competitionsInCategory.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.code} - {comp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Display Selected */}
      {selectedCompetition && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-900">
            <div className="font-medium">เลือกแล้ว:</div>
            <div className="mt-1">
              <span className="font-semibold">{selectedCompetition.code}</span> - {selectedCompetition.name}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              หมวด: {selectedCategory}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoStepCompetitionSelect;
