import * as XLSX from 'xlsx';

/**
 * Export ตารางสถานที่แข่งขันเป็น Excel (.xlsx)
 * จัดกลุ่มตามหมวดหมู่ เรียง A-Z
 *
 * @param {Array} schedules - รายการ schedule ที่ filter ตาม level แล้ว
 * @param {string} groupName - ชื่อกลุ่ม/ระดับ สำหรับชื่อ sheet และชื่อไฟล์
 */
export function exportScheduleToExcel(schedules, groupName = 'ตารางสถานที่') {
  if (!schedules || schedules.length === 0) return;

  // จัดกลุ่มตามหมวดหมู่ (เหมือน ScheduleSection)
  const grouped = {};
  schedules.forEach(s => {
    const cat = s.competition?.category?.name || 'อื่นๆ';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  const sortedCategories = Object.keys(grouped).sort();

  // สร้าง rows
  const rows = [];
  let num = 1;

  sortedCategories.forEach(catName => {
    grouped[catName].forEach(s => {
      const startTime = s.start_time?.substring(0, 5) || '';
      const endTime = s.end_time?.substring(0, 5) || '';
      const timeStr = endTime ? `${startTime} - ${endTime}` : startTime ? `${startTime} น.` : '-';

      rows.push({
        'ลำดับ': num++,
        'หมวดหมู่': catName,
        'กิจกรรม': s.competition?.name || '-',
        'สถานที่': s.venue || '-',
        'ห้อง': s.room || '-',
        'วันที่': formatDate(s.competition_date),
        'เวลา': timeStr,
        'หมายเหตุ': s.notes || '',
      });
    });
  });

  // สร้าง workbook
  const ws = XLSX.utils.json_to_sheet(rows);

  // ตั้ง column widths
  ws['!cols'] = [
    { wch: 6 },   // ลำดับ
    { wch: 30 },  // หมวดหมู่
    { wch: 45 },  // กิจกรรม
    { wch: 30 },  // สถานที่
    { wch: 15 },  // ห้อง
    { wch: 18 },  // วันที่
    { wch: 15 },  // เวลา
    { wch: 20 },  // หมายเหตุ
  ];

  const sheetName = groupName.substring(0, 31); // Excel sheet name max 31 chars
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Download
  const filename = `ตารางสถานที่_${groupName}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
