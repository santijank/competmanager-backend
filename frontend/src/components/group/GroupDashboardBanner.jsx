import React from 'react';

/**
 * 🎨 Banner Component สำหรับหน้า Group Dashboard
 * แสดงรูปภาพแบนเนอร์งานศิลปหัตถกรรมนักเรียน
 */
export default function GroupDashboardBanner() {
  return (
    <div className="mb-6">
      {/* Banner Image */}
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
        <img
          src="/images/group-banner.png"
          alt="งานศิลปหัตถกรรมนักเรียน ครั้งที่ ๗๔"
          className="w-full h-auto object-cover"
          style={{ maxHeight: '300px' }}
        />
      </div>
    </div>
  );
}
