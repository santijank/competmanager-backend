-- ============================================
-- เพิ่มกลุ่มโรงเรียนเทศบาล + 10 โรงเรียน
-- ============================================

-- 1. เพิ่มกลุ่มโรงเรียนเทศบาล (G13)
INSERT INTO school_groups (code, name, description, is_active, color, icon, display_order, created_at, updated_at)
VALUES ('G13', 'กลุ่มโรงเรียนเทศบาล', 'กลุ่มโรงเรียนสังกัดเทศบาล', 1, 'amber', '🏛️', 13, NOW(), NOW());

-- เก็บ id ของกลุ่มที่เพิ่ง insert
SET @group_id = LAST_INSERT_ID();

-- 2. เพิ่มโรงเรียน (10 โรงเรียน)
INSERT INTO schools (code, name, school_group_id, school_type, is_active, created_at, updated_at) VALUES
('MUN001', 'โรงเรียนเทศบาล 1 วัดพระงาม (สามัคคีพิทยา)', @group_id, 'government', 1, NOW(), NOW()),
('MUN002', 'โรงเรียนเทศบาล 2 วัดเสนหา (สมัครพลผดุง)', @group_id, 'government', 1, NOW(), NOW()),
('MUN003', 'โรงเรียนเทศบาล 3 สระกระเทียม', @group_id, 'government', 1, NOW(), NOW()),
('MUN004', 'โรงเรียนเทศบาล 4 เชาวนปรีชาอุทิศ', @group_id, 'government', 1, NOW(), NOW()),
('MUN005', 'โรงเรียนเทศบาล 5 วัดพระปฐมเจดีย์', @group_id, 'government', 1, NOW(), NOW()),
('MUN006', 'โรงเรียนกีฬาเทศบาลนครนครปฐม', @group_id, 'government', 1, NOW(), NOW()),
('MUN007', 'โรงเรียนอนุบาลเทศบาลนครนครปฐม', @group_id, 'government', 1, NOW(), NOW()),
('MUN008', 'โรงเรียนอนุบาลสระแก้ว', @group_id, 'government', 1, NOW(), NOW()),
('MUN009', 'โรงเรียนอนุบาลประปานคร', @group_id, 'government', 1, NOW(), NOW()),
('MUN010', 'โรงเรียนอนุบาลสุขสวัสดิ์ (ประถมศึกษา)', @group_id, 'government', 1, NOW(), NOW());

-- 3. เพิ่ม Users สำหรับแต่ละโรงเรียน (school_admin)
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
WHERE s.code LIKE 'MUN%';

-- 4. เพิ่ม Group Admin สำหรับกลุ่มเทศบาล
INSERT INTO users (name, email, password, role, school_id, school_group_id, is_active, created_at, updated_at)
VALUES (
    'ผู้ดูแลกลุ่มโรงเรียนเทศบาล',
    'groupadmin-mun@school.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'group_admin',
    NULL,
    @group_id,
    1,
    NOW(),
    NOW()
);

-- 5. ตรวจสอบผลลัพธ์
SELECT sg.id as group_id, sg.code as group_code, sg.name as group_name
FROM school_groups sg WHERE sg.code = 'G13';

SELECT s.id, s.code, s.name, u.email, u.role
FROM schools s
LEFT JOIN users u ON u.school_id = s.id
WHERE s.code LIKE 'MUN%'
ORDER BY s.code;

SELECT id, name, email, role FROM users WHERE email = 'groupadmin-mun@school.com';
