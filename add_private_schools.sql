-- ============================================
-- เพิ่มโรงเรียนเอกชน 27 โรงเรียน
-- กลุ่มโรงเรียนเอกชน id = 12
-- ============================================

-- 1. เพิ่มโรงเรียน (27 โรงเรียน)
INSERT INTO schools (code, name, school_group_id, school_type, is_active, created_at, updated_at) VALUES
('PRI001', 'โรงเรียนการดีวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI002', 'โรงเรียนหอเอกวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI003', 'โรงเรียนอนุบาลสุธีร', 12, 'private', 1, NOW(), NOW()),
('PRI004', 'โรงเรียนอนุบาลไพวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI005', 'โรงเรียนอนุบาลเพ็ญศิริ', 12, 'private', 1, NOW(), NOW()),
('PRI006', 'โรงเรียนอนุบาลจันทร์สว่างภู', 12, 'private', 1, NOW(), NOW()),
('PRI007', 'โรงเรียนอนุบาลเสริมปัญญา', 12, 'private', 1, NOW(), NOW()),
('PRI008', 'โรงเรียนอำนวยวิทย์นครปฐม', 12, 'private', 1, NOW(), NOW()),
('PRI009', 'โรงเรียนสว่างวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI010', 'โรงเรียนบอสโกพิทักษ์', 12, 'private', 1, NOW(), NOW()),
('PRI011', 'โรงเรียนบำรุงวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI012', 'โรงเรียนเอกจิตรานุสรณ์', 12, 'private', 1, NOW(), NOW()),
('PRI013', 'โรงเรียนสารสาสน์วิเทศนครปฐม', 12, 'private', 1, NOW(), NOW()),
('PRI014', 'โรงเรียนราชูปถัมภ์', 12, 'private', 1, NOW(), NOW()),
('PRI015', 'โรงเรียนสหบำรุงวิทยา', 12, 'private', 1, NOW(), NOW()),
('PRI016', 'โรงเรียนเด็กสายรุ้ง', 12, 'private', 1, NOW(), NOW()),
('PRI017', 'โรงเรียนอนุบาลณัฎฐดุตา', 12, 'private', 1, NOW(), NOW()),
('PRI018', 'โรงเรียนเทพนาทบาล 1 วัดพระยร', 12, 'private', 1, NOW(), NOW()),
('PRI019', 'โรงเรียนเทพนาทบาล 2 วัดเสน่ห์', 12, 'private', 1, NOW(), NOW()),
('PRI020', 'โรงเรียนเทพนาทบาล 3 สระกระเทียม', 12, 'private', 1, NOW(), NOW()),
('PRI021', 'โรงเรียนเทพนาทบาล 4 เขาวนปริง', 12, 'private', 1, NOW(), NOW()),
('PRI022', 'โรงเรียนเทพนาทบาล 5 วัดพระประโทนเจดีย์', 12, 'private', 1, NOW(), NOW()),
('PRI023', 'โรงเรียนกีฬาเทศบาลนครปฐม', 12, 'private', 1, NOW(), NOW()),
('PRI024', 'โรงเรียนอนุบาลเทศบาลนคร', 12, 'private', 1, NOW(), NOW()),
('PRI025', 'โรงเรียนอนุบาลสระแก้ว', 12, 'private', 1, NOW(), NOW()),
('PRI026', 'โรงเรียนอนุบาลประปานคร', 12, 'private', 1, NOW(), NOW()),
('PRI027', 'โรงเรียนอนุบาลสุขสวัสดิ์', 12, 'private', 1, NOW(), NOW());

-- 2. เพิ่ม Users สำหรับแต่ละโรงเรียน (school_admin)
-- password123 = $2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (name, email, password, role, school_id, school_group_id, is_active, created_at, updated_at)
SELECT
    CONCAT('ผู้ดูแล ', s.name) as name,
    CONCAT(LOWER(s.code), '@school.com') as email,
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' as password,
    'school_admin' as role,
    s.id as school_id,
    s.school_group_id,
    1 as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM schools s
WHERE s.code LIKE 'PRI%';

-- 3. ตรวจสอบผลลัพธ์
SELECT s.id, s.code, s.name, u.email
FROM schools s
LEFT JOIN users u ON u.school_id = s.id
WHERE s.code LIKE 'PRI%'
ORDER BY s.code;
