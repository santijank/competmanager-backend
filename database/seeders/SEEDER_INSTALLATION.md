# 🎯 Phase 2: Seeders Installation Guide

---

## ✅ **ไฟล์ที่ได้รับ (Phase 2)**

```
database/seeders/
├── DatabaseSeeder.php          ← Main seeder
├── SchoolGroupsSeeder.php      ← 10 กลุ่มโรงเรียน
├── SchoolsSeeder.php           ← โครงสร้าง (ต้อง Import จาก SQL)
├── CategoriesSeeder.php        ← 19 หมวดหมู่
├── TestUsersSeeder.php         ← 7 Test accounts
└── DataExtractorSeeder.php     ← Import จาก SQL file
```

---

## 🚀 **วิธีติดตั้ง**

### **ขั้นตอนที่ 1: Copy Seeders**

```powershell
# คัดลอกไฟล์ทั้งหมดจาก backend-complete/database/seeders/
# ไปวางที่: C:\StudentArtsCompetition\backend\database\seeders\
```

### **ขั้นตอนที่ 2: วางไฟล์ SQL**

```powershell
# คัดลอกไฟล์ student_arts_competition.sql
# ไปวางที่: C:\StudentArtsCompetition\backend\storage\app\
```

### **ขั้นตอนที่ 3: รัน Seeder**

```powershell
cd C:\StudentArtsCompetition\backend

# วิธีที่ 1: รัน Seeder ทั้งหมด (แนะนำ)
php artisan db:seed

# หรือวิธีที่ 2: รันทีละ Seeder
php artisan db:seed --class=SchoolGroupsSeeder
php artisan db:seed --class=CategoriesSeeder
php artisan db:seed --class=TestUsersSeeder
php artisan db:seed --class=DataExtractorSeeder
```

---

## ✅ **ผลลัพธ์ที่ควรเห็น**

```
🚀 เริ่มต้น Seeding ระบบ CompetManager
=====================================

📍 Step 1/5: กลุ่มโรงเรียน...
✅ สร้างกลุ่มโรงเรียน 10 กลุ่มเรียบร้อย

📚 Step 2/5: หมวดหมู่กิจกรรม...
✅ สร้างหมวดหมู่ 19 หมวดเรียบร้อย

👥 Step 3/5: ผู้ใช้งานทดสอบ...
✅ สร้าง Test Users 7 รายการ

📧 Test Accounts (รหัสผ่านทั้งหมด: password):
+------------------------------+--------------+---------------------------+
| Email                        | Role         | หมายเหตุ                  |
+------------------------------+--------------+---------------------------+
| admin@compet.site            | admin        | District Admin            |
| groupadmin1@test.com         | group_admin  | Group Admin กลุ่ม 1       |
| groupadmin2@test.com         | group_admin  | Group Admin กลุ่ม 2       |
| teacher1@test.com            | teacher      | ครู - วัดดอนยายหอม        |
| teacher2@test.com            | teacher      | ครู - วัดเกาะวังไทร       |
| committee-group1@test.com    | committee    | คณะทำงานกลุ่ม 1           |
| committee-district@test.com  | committee    | คณะทำงานระดับเขต          |
+------------------------------+--------------+---------------------------+

🏫 Step 4/5: โรงเรียนและกิจกรรม...
🔄 กำลัง Extract ข้อมูลจากไฟล์ SQL...
✅ Import โรงเรียน 121 แห่ง
✅ Import กิจกรรม 292 รายการ

✅ Step 5/5: สรุปผลการ Seeding
=====================================
+----------------+---------+---------+
| ตาราง          | จำนวน   | สถานะ   |
+----------------+---------+---------+
| school_groups  | 10      | ✅      |
| categories     | 19      | ✅      |
| users          | 7       | ✅      |
| schools        | 121     | ✅      |
| competitions   | 292     | ✅      |
+----------------+---------+---------+

🎉 Seeding เสร็จสมบูรณ์!
```

---

## 🔍 **ตรวจสอบข้อมูล**

### **1. ตรวจสอบใน phpMyAdmin**

```sql
-- นับข้อมูลในแต่ละตาราง
SELECT 'school_groups' AS table_name, COUNT(*) AS count FROM school_groups
UNION ALL
SELECT 'schools', COUNT(*) FROM schools
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'competitions', COUNT(*) FROM competitions
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- ควรได้:
-- school_groups: 10
-- schools: 121
-- categories: 19
-- competitions: 292
-- users: 7
```

### **2. ตรวจสอบข้อมูลตัวอย่าง**

```sql
-- ดูกลุ่มโรงเรียน
SELECT id, code, name FROM school_groups ORDER BY id;

-- ดูโรงเรียน 10 แห่งแรก
SELECT id, code, name, school_group_id FROM schools ORDER BY id LIMIT 10;

-- ดูกิจกรรม 10 รายการแรก
SELECT id, code, name, level, max_students FROM competitions ORDER BY id LIMIT 10;

-- ดู Test Users
SELECT id, name, email, role FROM users ORDER BY id;
```

---

## ⚠️ **แก้ปัญหา**

### **ปัญหา 1: ไม่พบไฟล์ SQL**

```
❌ ไม่พบไฟล์ student_arts_competition.sql
📁 กรุณาวางไฟล์ที่: C:\StudentArtsCompetition\backend\storage\app\student_arts_competition.sql
```

**วิธีแก้:**
```powershell
# คัดลอกไฟล์ student_arts_competition.sql
# ไปวางที่: C:\StudentArtsCompetition\backend\storage\app\
```

### **ปัญหา 2: Import ไม่ครบ**

```sql
-- ตรวจสอบจำนวน
SELECT COUNT(*) FROM schools;    -- ต้องได้ 121
SELECT COUNT(*) FROM competitions; -- ต้องได้ 292
```

**วิธีแก้:**
```powershell
# ลบข้อมูลและ Import ใหม่
php artisan db:seed:fresh
```

### **ปัญหา 3: Duplicate Entry**

```
SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry
```

**วิธีแก้:**
```powershell
# ลบข้อมูลเดิมก่อน
php artisan migrate:fresh
php artisan db:seed
```

---

## 📊 **ข้อมูลที่ได้**

### **1. กลุ่มโรงเรียน (10 กลุ่ม)**
```
1. กลุ่มโรงเรียนบูรพาศึกษา
2. กลุ่มโรงเรียนเมืองนครปฐม
3. กลุ่มโรงเรียนปฐมนคร
4. กลุ่มโรงเรียนพระปฐมเจดีย์
5. กลุ่มโรงเรียนกำแพงแสน 4
6. กลุ่มโรงเรียนกำแพงแสน 1
7. กลุ่มโรงเรียนกำแพงแสน 2
8. กลุ่มโรงเรียนกำแพงแสน 3
9. กลุ่มโรงเรียนบ้านหลวง
10. กลุ่มโรงเรียนดอนตูม
```

### **2. โรงเรียน (121 แห่ง)**
- กลุ่ม 1: 14 โรงเรียน
- กลุ่ม 2-10: ~12 โรงเรียนต่อกลุ่ม

### **3. หมวดหมู่ (19 หมวด)**
- ภาษาไทย, คณิตศาสตร์, วิทยาศาสตร์
- คอมพิวเตอร์, หุ่นยนต์, นักบินน้อย
- ภาษาต่างประเทศ, การงานอาชีพ
- ศิลปะ, ดนตรี, นาฏศิลป์
- Soft Power, ฯลฯ

### **4. กิจกรรม (292 รายการ)**
- ครบทุก field: max_students, max_teachers, max_judges
- แบ่งตามระดับชั้น: ป.1-3, ป.4-6, ม.1-3

### **5. Test Accounts (7 ราย)**
- 1 Admin
- 2 Group Admin
- 2 Teacher  
- 2 Committee

**Password ทั้งหมด: `password`**

---

## 🎯 **ขั้นตอนต่อไป**

**Phase 2 เสร็จแล้ว! ✅**

**พร้อมสำหรับ Phase 3:**
- Models (9 Models)
- Relationships
- Business Logic Methods

---

**Phase 2: Seeders Complete! 🎉**
