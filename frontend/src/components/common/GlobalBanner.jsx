import React from 'react';

/**
 * 🎨 Global Banner Component - ติดขอบบนสุด
 */
export default function GlobalBanner() {
  return (
    <div className="w-full" style={{ margin: 0, padding: 0 }}>
      <div className="relative w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
        <img
          src="/images/group-banner.png"
          alt="งานศิลปหัตถกรรมนักเรียน ครั้งที่ ๗๔"
          className="w-full h-auto object-cover"
          style={{ 
            maxHeight: '250px',
            display: 'block',
            margin: 0,
            padding: 0
          }}
          loading="lazy"
          onError={(e) => {
            console.error('Cannot load banner image');
            e.target.parentElement.parentElement.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
