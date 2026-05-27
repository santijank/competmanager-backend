-- =====================================================
-- SQL Script: อัพเดทจำนวนนักเรียนสำหรับกิจกรรมที่ระบุ
-- วันที่: 2026-02-04
-- =====================================================

-- 1. หุ่นยนต์ผสม (ป.1-6) → เปลี่ยนเป็น 4 คน
-- รหัส: ROBOT_D_ป1_6_7_G2 หรือชื่อที่มีคำว่า "หุ่นยนต์ผสม" และ "ป.1-6"
UPDATE competitions
SET min_students = 4, max_students = 4, updated_at = NOW()
WHERE code = 'ROBOT_D_ป1_6_7_G2'
   OR (name LIKE '%หุ่นยนต์ผสม%' AND name LIKE '%ป.1-6%');

-- ตรวจสอบผลลัพธ์
SELECT id, code, name, min_students, max_students
FROM competitions
WHERE name LIKE '%หุ่นยนต์ผสม%' AND name LIKE '%ป.1-6%';

-- =====================================================

-- 2. การร้อยมาลัยดอกไม้สด (บกพร่องทางการเรียนรู้) (ป.1-6) → เปลี่ยนเป็น 2 คน
-- รหัส: ART_SP_D_ป1_6_8_G8
UPDATE competitions
SET min_students = 2, max_students = 2, updated_at = NOW()
WHERE code = 'ART_SP_D_ป1_6_8_G8'
   OR (name LIKE '%ร้อยมาลัยดอกไม้สด%' AND name LIKE '%บกพร่องทางการเรียนรู้%' AND name LIKE '%ป.1-6%');

-- ตรวจสอบผลลัพธ์
SELECT id, code, name, min_students, max_students
FROM competitions
WHERE name LIKE '%ร้อยมาลัยดอกไม้สด%' AND name LIKE '%บกพร่องทางการเรียนรู้%';

-- =====================================================

-- 3. การร้อยมาลัยดอกไม้สด (บกพร่องทางสติปัญญา) (ป.1-6) → เปลี่ยนเป็น 2 คน
-- รหัส: ART_SP_D_ป1_6_7_G8
UPDATE competitions
SET min_students = 2, max_students = 2, updated_at = NOW()
WHERE code = 'ART_SP_D_ป1_6_7_G8'
   OR (name LIKE '%ร้อยมาลัยดอกไม้สด%' AND name LIKE '%บกพร่องทางสติปัญญา%' AND name LIKE '%ป.1-6%');

-- ตรวจสอบผลลัพธ์
SELECT id, code, name, min_students, max_students
FROM competitions
WHERE name LIKE '%ร้อยมาลัยดอกไม้สด%' AND name LIKE '%บกพร่องทางสติปัญญา%';

-- =====================================================
-- สรุป: ตรวจสอบการเปลี่ยนแปลงทั้งหมด
-- =====================================================
SELECT id, code, name, min_students, max_students, updated_at
FROM competitions
WHERE name LIKE '%หุ่นยนต์ผสม%'
   OR name LIKE '%ร้อยมาลัยดอกไม้สด%'
ORDER BY name;
