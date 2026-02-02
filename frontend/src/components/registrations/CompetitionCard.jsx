import React from 'react';

const CompetitionCard = ({ competition, isSelected, onSelect }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    const today = new Date();
    
    // ⭐ Fallback: ใช้ group_registration_end ถ้า registration_end_date เป็น null
    const endDateString = competition.registration_end_date || competition.group_registration_end;
    if (!endDateString) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ไม่ระบุ
        </span>
      );
    }
    
    const endDate = new Date(endDateString);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ปิดรับสมัคร
        </span>
      );
    } else if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⚠️ เหลือ {daysLeft} วัน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ เปิดรับสมัคร
      </span>
    );
  };

  return (
    <button
      onClick={() => onSelect(competition)}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {isSelected && <span className="text-blue-600 mr-1">✓</span>}
              {competition.name}
            </h4>
          </div>
          {getStatusBadge()}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">📊 ระดับ:</span>
            <span>{competition.level || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">🎯 รับ:</span>
            <span>
              {competition.max_students || competition.max_student || 0} นร., {' '}
              {competition.max_teachers || competition.max_teacher || 0} ครู
            </span>
          </div>
        </div>

        {/* Date & Venue */}
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">📅 วันแข่งขัน:</span>
            <span>{formatDate(competition.start_date || competition.competition_date)}</span>
          </div>
          {competition.venue && (
            <div className="flex items-center gap-1">
              <span className="font-medium">📍 สถานที่:</span>
              <span className="truncate">{competition.venue}</span>
            </div>
          )}
        </div>

        {/* Registration Period */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            รับสมัคร: {' '}
            {formatDate(competition.registration_start_date || competition.group_registration_start)} - {' '}
            {formatDate(competition.registration_end_date || competition.group_registration_end)}
          </p>
        </div>
      </div>
    </button>
  );
};

export default CompetitionCard;
