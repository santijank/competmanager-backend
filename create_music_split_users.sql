-- สร้าง 12 users ใหม่สำหรับแยกหมวด ศิลปะ-ดนตรี (category_id=12)
-- ชุดที่ 1: เห็นเฉพาะกิจกรรม "การขับร้อง" (MUSIC_01-08) — 1 admin + 5 data_entry
-- ชุดที่ 2: เห็นกิจกรรมที่เหลือ (MUSIC_09-10) — 1 admin + 5 data_entry

-- Password: password123 (bcrypt hash)
SET @hashed_password = '$2y$10$.9z4nFbEMizQ4BPqwXhy7uL4YNvMcwZUg8RH3OfrHLZ3z83z5BRK6';

-- ชุดที่ 1: ขับร้อง (1 admin + 5 data_entry)
INSERT INTO users (name, email, password, role, category_id, competition_name_filter, is_active, created_at, updated_at)
VALUES
  ('Admin ดนตรี-ขับร้อง', 'cat_admin_music_singing@competmanager.com', @hashed_password, 'category_admin', 12, 'ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-ขับร้อง 1', 'data_music_singing1@competmanager.com', @hashed_password, 'data_entry', 12, 'ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-ขับร้อง 2', 'data_music_singing2@competmanager.com', @hashed_password, 'data_entry', 12, 'ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-ขับร้อง 3', 'data_music_singing3@competmanager.com', @hashed_password, 'data_entry', 12, 'ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-ขับร้อง 4', 'data_music_singing4@competmanager.com', @hashed_password, 'data_entry', 12, 'ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-ขับร้อง 5', 'data_music_singing5@competmanager.com', @hashed_password, 'data_entry', 12, 'ขับร้อง', 1, NOW(), NOW());

-- ชุดที่ 2: ที่เหลือ (1 admin + 5 data_entry)
INSERT INTO users (name, email, password, role, category_id, competition_name_filter, is_active, created_at, updated_at)
VALUES
  ('Admin ดนตรี-อื่นๆ', 'cat_admin_music_other@competmanager.com', @hashed_password, 'category_admin', 12, '!ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-อื่นๆ 1', 'data_music_other1@competmanager.com', @hashed_password, 'data_entry', 12, '!ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-อื่นๆ 2', 'data_music_other2@competmanager.com', @hashed_password, 'data_entry', 12, '!ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-อื่นๆ 3', 'data_music_other3@competmanager.com', @hashed_password, 'data_entry', 12, '!ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-อื่นๆ 4', 'data_music_other4@competmanager.com', @hashed_password, 'data_entry', 12, '!ขับร้อง', 1, NOW(), NOW()),
  ('พิมพ์ข้อมูล ดนตรี-อื่นๆ 5', 'data_music_other5@competmanager.com', @hashed_password, 'data_entry', 12, '!ขับร้อง', 1, NOW(), NOW());

-- ตรวจสอบผลลัพธ์
SELECT id, name, email, role, category_id, competition_name_filter, is_active
FROM users
WHERE category_id = 12
ORDER BY id;
