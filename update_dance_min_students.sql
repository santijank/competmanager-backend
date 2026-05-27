-- อัปเดตกิจกรรม "การเต้นหางเครื่องประกอบเพลง (บกพร่องทางการเรียนรู้) (ป.1-6)"
-- เปลี่ยน min_students จาก 7 เป็น 3 (รับสมัครได้ตั้งแต่ 3-7 คน)
-- รหัส: DANCE_SP_D_ป1_6_1_G8

UPDATE competitions
SET min_students = 3
WHERE code = 'DANCE_SP_D_ป1_6_1_G8';

-- ตรวจสอบผลลัพธ์
SELECT id, code, name, min_students, max_students
FROM competitions
WHERE code = 'DANCE_SP_D_ป1_6_1_G8';
