import React from 'react';

const CategorySelector = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  competitionsCount = {} 
}) => {
  // กลุ่มหมวดหมู่ตามประเภท
  const categoryGroups = {
    'วิชาการหลัก': [1, 2, 3, 7], // ภาษาไทย, คณิต, วิทยา, ภาษาต่าง
    'วิทยาศาสตร์และเทคโนโลยี': [4, 5, 6], // นักบิน, คอมพิวเตอร์, หุ่นยนต์
    'ศิลปะและกีฬา': [11, 12, 13, 10], // ทัศนศิลป์, ดนตรี, นาฏศิลป์, พลศึกษา
    'กิจกรรมและพัฒนา': [8, 9, 14, 15], // การงาน, สังคม, ปฐมวัย, พัฒนาผู้เรียน
    'Soft Power': [16, 17, 18, 19],
  };

  const getCategoryColor = (code) => {
    const colors = {
      THAI: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
      MATH: 'bg-purple-100 border-purple-300 hover:bg-purple-200',
      SCI: 'bg-green-100 border-green-300 hover:bg-green-200',
      PILOT: 'bg-cyan-100 border-cyan-300 hover:bg-cyan-200',
      COMP: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200',
      ROBOT: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
      LANG: 'bg-pink-100 border-pink-300 hover:bg-pink-200',
      CAREER: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
      SOCIAL: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
      HEALTH: 'bg-red-100 border-red-300 hover:bg-red-200',
      ART: 'bg-rose-100 border-rose-300 hover:bg-rose-200',
      MUSIC: 'bg-violet-100 border-violet-300 hover:bg-violet-200',
      DANCE: 'bg-fuchsia-100 border-fuchsia-300 hover:bg-fuchsia-200',
      EARLY: 'bg-teal-100 border-teal-300 hover:bg-teal-200',
      STUDENT: 'bg-lime-100 border-lime-300 hover:bg-lime-200',
    };
    return colors[code] || 'bg-gray-100 border-gray-300 hover:bg-gray-200';
  };

  const getIcon = (code) => {
    const icons = {
      THAI: '📚',
      MATH: '🔢',
      SCI: '🔬',
      PILOT: '✈️',
      COMP: '💻',
      ROBOT: '🤖',
      LANG: '🌍',
      CAREER: '🔨',
      SOCIAL: '🏛️',
      HEALTH: '⚽',
      ART: '🎨',
      MUSIC: '🎵',
      DANCE: '💃',
      EARLY: '🧸',
      STUDENT: '🌟',
    };
    return icons[code] || '📁';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          เลือกหมวดหมู่การแข่งขัน
        </h3>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← กลับไปเลือกหมวดใหม่
          </button>
        )}
      </div>

      {Object.entries(categoryGroups).map(([groupName, categoryIds]) => {
        const groupCategories = categories.filter(cat => categoryIds.includes(cat.id));
        if (groupCategories.length === 0) return null;

        return (
          <div key={groupName} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600 border-b pb-2">
              {groupName}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {groupCategories.map((category) => {
                const count = competitionsCount[category.id] || 0;
                const isSelected = selectedCategory?.id === category.id;
                const colorClass = getCategoryColor(category.code);

                return (
                  <button
                    key={category.id}
                    onClick={() => onSelectCategory(category)}
                    disabled={count === 0}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200
                      ${isSelected 
                        ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
                        : 'shadow-sm hover:shadow-md'
                      }
                      ${count === 0 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                        : colorClass
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-3xl">{getIcon(category.code)}</span>
                      <span className="text-xs font-medium text-center leading-tight">
                        {category.name.replace(/^\d+\.\s*/, '')}
                      </span>
                      <span className={`
                        text-xs font-bold px-2 py-0.5 rounded-full
                        ${count > 0 ? 'bg-white text-gray-700' : 'bg-gray-200 text-gray-500'}
                      `}>
                        {count} รายการ
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <span className="text-blue-600">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategorySelector;