import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchableCompetitionSelect = ({ value, onChange, competitions, placeholder = "เลือกการแข่งขัน" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedComp, setSelectedComp] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Find selected competition
    if (value && competitions) {
      Object.keys(competitions).forEach(categoryName => {
        const found = competitions[categoryName].find(c => c.id === parseInt(value));
        if (found) {
          setSelectedComp(found);
        }
      });
    } else {
      setSelectedComp(null);
    }
  }, [value, competitions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (comp) => {
    onChange(comp ? comp.id : '');
    setSelectedComp(comp);
    setIsOpen(false);
    setSearch('');
  };

  const filteredCompetitions = {};
  if (competitions) {
    Object.keys(competitions).forEach(categoryName => {
      const filtered = competitions[categoryName].filter(comp =>
        comp.name.toLowerCase().includes(search.toLowerCase()) ||
        comp.code.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length > 0) {
        filteredCompetitions[categoryName] = filtered;
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Display / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <span className={selectedComp ? 'text-gray-900' : 'text-gray-500'}>
          {selectedComp ? `${selectedComp.code} - ${selectedComp.name}` : placeholder}
        </span>
        <Search className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Box */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาการแข่งขัน..."
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* ทั่วไป */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b"
            >
              <span className="text-gray-500 text-sm">ทั่วไป (ไม่ระบุการแข่งขัน)</span>
            </button>

            {/* Grouped Options */}
            {Object.keys(filteredCompetitions).sort().map((categoryName) => (
              <div key={categoryName}>
                <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-700 sticky top-0 z-10">
                  {categoryName}
                </div>
                {filteredCompetitions[categoryName].map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 ${
                      selectedComp?.id === comp.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="text-sm">
                      <span className="font-medium">{comp.code}</span> - {comp.name}
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(filteredCompetitions).length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                ไม่พบการแข่งขันที่ค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCompetitionSelect;
