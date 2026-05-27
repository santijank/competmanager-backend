# Plan: เพิ่มกรรมการแบบกลุ่ม (Bulk Add Committee/Judges)

## สรุปความต้องการ
ปรับระบบเพิ่มกรรมการจากเดิมที่ต้องเพิ่มทีละคน → ให้เลือกกิจกรรมแข่งขัน แล้วเพิ่มกรรมการทั้งหมดพร้อมกันในครั้งเดียว

ปรับทั้ง 2 ระบบ:
1. **CommitteeMember** (คณะทำงาน/กรรมการ) - หน้า settings/committee
2. **CompetitionJudge** (กรรมการตัดสิน) - หน้า judges/:id

---

## Step 1: แก้ Bug route กรรมการตัดสิน (JudgeController)

**ปัญหา**: routes/api.php ใช้ fallback closure แทน JudgeController จริง + JudgeController ใช้ `group_id` ผิด (ต้องเป็น `school_group_id`)

**ไฟล์**:
- `backend/routes/api.php` (บรรทัด 127-139) - เปลี่ยน closure เป็น JudgeController
- `backend/app/Http/Controllers/Api/JudgeController.php` - แก้ `group_id` → `school_group_id`

---

## Step 2: Backend - เพิ่ม min_judges/max_judges ใน API competitions

**ไฟล์**: `backend/app/Http/Controllers/Api/CommitteeMemberController.php`

- เพิ่ม `competitions.min_judges`, `competitions.max_judges` ใน `getAllCompetitions()` select clause
- เพิ่มใน map function

---

## Step 3: Backend - เพิ่ม storeBulk() ใน CommitteeMemberController

**ไฟล์**: `backend/app/Http/Controllers/Api/CommitteeMemberController.php`

- Endpoint: `POST /api/committee-members/bulk`
- รับ: `competition_id`, `member_type`, `level`, `members[]` (array ของ name, position, organization, responsibility)
- ใช้ DB::beginTransaction() สร้างทั้งหมดพร้อมกัน
- ข้าม row ที่ชื่อว่าง

---

## Step 4: Backend - เพิ่ม storeBulk() ใน JudgeController

**ไฟล์**: `backend/app/Http/Controllers/Api/JudgeController.php`

- Endpoint: `POST /api/competitions/{competitionId}/judges/bulk`
- รับ: `judges[]` (array ของ name, school_name)
- ตรวจสอบ max_judges limit (จำนวนเดิม + ใหม่ ต้องไม่เกิน max_judges)
- ใช้ DB::beginTransaction()

---

## Step 5: Backend - ลงทะเบียน routes ใหม่

**ไฟล์**: `backend/routes/api.php`

- เพิ่ม `POST committee-members/bulk` (ก่อน apiResource)
- เพิ่ม `POST competitions/{competitionId}/judges/bulk`

---

## Step 6: Frontend - สร้าง BulkAddCommitteeModal

**ไฟล์ใหม่**: `frontend/src/components/committee/BulkAddCommitteeModal.jsx`

**Flow**:
1. เลือกกิจกรรม (ใช้ TwoStepCompetitionSelect เดิม)
2. ระบบดึง min_judges/max_judges แสดงจำนวน row ฟอร์ม
3. กรอกข้อมูลกรรมการทุกคน (ชื่อ, ตำแหน่ง, สังกัด, หน้าที่)
4. บันทึกทั้งหมดพร้อมกัน → `POST /api/committee-members/bulk`

---

## Step 7: Frontend - สร้าง BulkAddJudgeModal

**ไฟล์ใหม่**: `frontend/src/components/judges/BulkAddJudgeModal.jsx`

**Flow** (ง่ายกว่าเพราะรู้ competition แล้ว):
1. รับ props: competitionId, minJudges, maxJudges, currentCount
2. แสดง (maxJudges - currentCount) rows สำหรับกรอก name + school_name
3. บันทึก → `POST /api/competitions/{id}/judges/bulk`

---

## Step 8: Frontend - ใส่ปุ่มเพิ่มกลุ่มในหน้า CommitteeManagement

**ไฟล์**: `frontend/src/pages/settings/CommitteeManagement.jsx`

- เพิ่มปุ่ม "เพิ่มกรรมการตามกิจกรรม" ข้างปุ่มเดิม
- เปิด BulkAddCommitteeModal

---

## Step 9: Frontend - ใส่ปุ่มเพิ่มกลุ่มในหน้า JudgesPage

**ไฟล์**: `frontend/src/pages/judges/JudgesPage.jsx`

- เปลี่ยนปุ่ม "เพิ่มกรรมการ" (ทีละคน) เป็น "เพิ่มกรรมการทั้งหมด" (bulk)
- เปิด BulkAddJudgeModal แทน JudgeModal เดิม
- ยังคงมี JudgeModal สำหรับแก้ไขรายคน
