# 📚 Models Documentation

## ภาพรวมโครงสร้าง Database Models

---

## 📋 **Models ทั้งหมด**

| Model | Description | Relations |
|-------|-------------|-----------|
| **User** | ผู้ใช้งานระบบ | school, schoolGroup, registrations |
| **School** | โรงเรียน | schoolGroup, users, registrations |
| **SchoolGroup** | กลุ่มโรงเรียน | schools, users, competitions, selectedCompetitions |
| **Category** | หมวดหมู่กิจกรรม | competitions |
| **Competition** | กิจกรรมการแข่งขัน | category, schoolGroup, registrations, results |
| **Registration** | การลงทะเบียน | competition, school, schoolGroup, registeredBy, approvedBy, result |
| **Result** | ผลการแข่งขัน | competition, registration, school, scoredBy, certificate |
| **Certificate** | เกียรติบัตร | result, competition, registration, issuedBy |

---

## 👤 **User Model**

### Fillable Fields
```php
'name', 'email', 'password', 'role', 'school_id', 'school_group_id'
```

### Roles
- `admin` - ผู้ดูแลระบบระดับเขต
- `group_admin` - ผู้ดูแลกลุ่มโรงเรียน
- `teacher` - ครู
- `committee` - คณะทำงาน
- `judge` - กรรมการตัดสิน

### Relations
```php
$user->school          // BelongsTo School
$user->schoolGroup     // BelongsTo SchoolGroup
$user->registrations   // HasMany Registration
```

### Helper Methods
```php
$user->isAdmin()
$user->isGroupAdmin()
$user->isTeacher()
$user->isCommittee()
$user->isJudge()
```

### Scopes
```php
User::admins()->get()
User::groupAdmins()->get()
User::teachers()->get()
User::inSchool($schoolId)->get()
User::inSchoolGroup($groupId)->get()
```

---

## 🏫 **School Model**

### Fillable Fields
```php
'school_group_id', 'code', 'name', 'school_type', 'address', 
'phone', 'email', 'director_name', 'is_active'
```

### School Types
- `government` - โรงเรียนรัฐบาล
- `private` - โรงเรียนเอกชน

### Relations
```php
$school->schoolGroup    // BelongsTo SchoolGroup
$school->users          // HasMany User
$school->registrations  // HasMany Registration
```

### Scopes
```php
School::active()->get()
School::inGroup($groupId)->get()
School::government()->get()
School::private()->get()
```

---

## 🎯 **SchoolGroup Model**

### Fillable Fields
```php
'code', 'name', 'description', 'is_active'
```

### Relations
```php
$group->schools                // HasMany School
$group->users                  // HasMany User
$group->competitions           // HasMany Competition (group-specific)
$group->selectedCompetitions   // BelongsToMany Competition (via school_group_competitions)
```

### Example Usage
```php
// กลุ่มโรงเรียนเลือกกิจกรรมที่จะเข้าร่วม
$group->selectedCompetitions()->attach($competitionId);

// ดูกิจกรรมที่เลือกไว้
$selectedComps = $group->selectedCompetitions;
```

---

## 📂 **Category Model**

### Fillable Fields
```php
'code', 'name', 'description', 'color', 'icon', 'is_active'
```

### Relations
```php
$category->competitions  // HasMany Competition
```

### Example Categories
1. ภาษาไทย
2. คณิตศาสตร์
3. วิทยาศาสตร์
4. สังคมศึกษา
5. ฯลฯ (ทั้งหมด 19 หมวด)

---

## 🏆 **Competition Model**

### Fillable Fields
```php
'category_id', 'code', 'name', 'description', 'competition_type',
'level', 'max_students', 'max_teachers', 'max_judges',
'start_date', 'end_date', 'competition_date',
'registration_start_date', 'registration_end_date',
'registration_status', 'allow_direct_registration',
'criterion', 'rules', 'venue', 'advancement_slots',
'school_group_id', 'status', 'is_active'
```

### Competition Types
- `regular` - กิจกรรมทั่วไป
- `special` - กิจกรรมพิเศษ
- `special_needs` - กิจกรรมเด็กพิเศษ

### Status
- `draft` - ร่าง
- `active` - เปิดใช้งาน
- `closed` - ปิด

### Registration Status
- `upcoming` - เปิดรับสมัครเร็วๆ นี้
- `open` - เปิดรับสมัคร
- `closed` - ปิดรับสมัคร

### Relations
```php
$comp->category                    // BelongsTo Category
$comp->schoolGroup                 // BelongsTo SchoolGroup (null = district level)
$comp->registrations               // HasMany Registration
$comp->results                     // HasMany Result
$comp->selectedBySchoolGroups      // BelongsToMany SchoolGroup
```

### Helper Methods
```php
$comp->isDistrictLevel()     // true if school_group_id is null
$comp->isRegistrationOpen()
$comp->isActive()
```

### Scopes
```php
Competition::active()->get()
Competition::districtLevel()->get()
Competition::groupLevel()->get()
Competition::byCategory($categoryId)->get()
Competition::byLevel('ป.1-3')->get()
Competition::registrationOpen()->get()
```

---

## 📝 **Registration Model**

### Fillable Fields
```php
'competition_id', 'school_id', 'school_group_id',
'student_name', 'student_class', 'student_number',
'teacher_name', 'teacher_phone', 'teacher_email',
'status', 'registered_by', 'approved_by', 'approved_at',
'rejected_reason', 'notes'
```

### Status
- `pending` - รอการอนุมัติ
- `approved` - อนุมัติแล้ว
- `rejected` - ไม่อนุมัติ

### Relations
```php
$reg->competition     // BelongsTo Competition
$reg->school          // BelongsTo School
$reg->schoolGroup     // BelongsTo SchoolGroup
$reg->registeredBy    // BelongsTo User
$reg->approvedBy      // BelongsTo User
$reg->result          // BelongsTo Result
```

### Helper Methods
```php
$reg->isPending()
$reg->isApproved()
$reg->isRejected()
```

### Scopes
```php
Registration::pending()->get()
Registration::approved()->get()
Registration::rejected()->get()
Registration::forCompetition($compId)->get()
Registration::fromSchool($schoolId)->get()
Registration::fromSchoolGroup($groupId)->get()
```

---

## 🏅 **Result Model**

### Fillable Fields
```php
'competition_id', 'registration_id', 'school_id',
'rank', 'score', 'medal', 'is_advanced',
'judge_notes', 'scored_by', 'scored_at'
```

### Medal Types
- `gold` - เหรียญทอง
- `silver` - เหรียญเงิน
- `bronze` - เหรียญทองแดง

### Relations
```php
$result->competition   // BelongsTo Competition
$result->registration  // BelongsTo Registration
$result->school        // BelongsTo School
$result->scoredBy      // BelongsTo User (Judge)
$result->certificate   // HasOne Certificate
```

### Helper Methods
```php
$result->isGold()
$result->isSilver()
$result->isBronze()
$result->hasAdvanced()
```

### Scopes
```php
Result::gold()->get()
Result::silver()->get()
Result::bronze()->get()
Result::advanced()->get()
Result::forCompetition($compId)->get()
Result::byRank()->get()
Result::byScore()->get()
```

---

## 🎓 **Certificate Model**

### Fillable Fields
```php
'result_id', 'competition_id', 'registration_id',
'certificate_number', 'student_name', 'school_name',
'competition_name', 'rank', 'medal', 'issued_date',
'issued_by', 'template', 'pdf_path'
```

### Relations
```php
$cert->result         // BelongsTo Result
$cert->competition    // BelongsTo Competition
$cert->registration   // BelongsTo Registration
$cert->issuedBy       // BelongsTo User
```

### Helper Methods
```php
$cert->isGenerated()   // Check if PDF exists
$cert->pdf_url         // Get full PDF URL (Accessor)
```

### Scopes
```php
Certificate::generated()->get()
Certificate::forCompetition($compId)->get()
```

---

## 🔗 **Relationship Examples**

### ดึงข้อมูลที่เกี่ยวข้อง

```php
// Competition พร้อม Category และ School Group
$comp = Competition::with(['category', 'schoolGroup'])->find(1);

// Registration พร้อม Competition, School, และ User
$reg = Registration::with([
    'competition',
    'school',
    'registeredBy'
])->find(1);

// Result พร้อม Certificate
$result = Result::with('certificate')->find(1);

// User พร้อม School และ School Group
$user = User::with(['school', 'schoolGroup'])->find(1);
```

### การใช้งาน Scopes

```php
// หากิจกรรมที่เปิดรับสมัครในหมวดภาษาไทย
$comps = Competition::active()
    ->registrationOpen()
    ->byCategory(1)
    ->get();

// หาการลงทะเบียนที่รออนุมัติของโรงเรียน
$regs = Registration::pending()
    ->fromSchool($schoolId)
    ->get();

// หาผลการแข่งขันที่ได้เหรียญทอง
$results = Result::forCompetition($compId)
    ->gold()
    ->byRank()
    ->get();
```

---

## 💡 **Best Practices**

1. **ใช้ Eager Loading** เพื่อหลีกเลี่ยง N+1 Query Problem
```php
Competition::with(['category', 'schoolGroup'])->get();
```

2. **ใช้ Scopes** สำหรับ query ที่ใช้บ่อย
```php
Competition::active()->registrationOpen()->get();
```

3. **ใช้ Helper Methods** เพื่อความชัดเจน
```php
if ($user->isAdmin()) { ... }
```

4. **Type Hinting** ใน Relations
```php
public function school(): BelongsTo
```

---

## 🎯 **Next Steps**

- ✅ Models พร้อมใช้งาน
- 🔄 สร้าง Controllers สำหรับแต่ละ Model
- 🔄 สร้าง Form Requests สำหรับ Validation
- 🔄 สร้าง API Resources สำหรับ Transform Data
