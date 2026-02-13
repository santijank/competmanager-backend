<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CompetitionJudge;  // ✅ เพิ่ม Judge Model

class Competition extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'category_id',
        'level',  // ระดับชั้น (u.1-3, u.4-6, etc.)
        'competition_level',  // ระดับการแข่งขัน (group, district)

        // ✅ Multi-Participant Support
        'min_students',      // ✅ เพิ่ม - จำนวนนักเรียนขั้นต่ำ
        'max_students',
        'min_teachers',      // ✅ เพิ่ม - จำนวนครูขั้นต่ำ
        'max_teachers',
        'min_judges',        // ✅ เพิ่ม - จำนวนกรรมการขั้นต่ำ
        'max_judges',        // ✅ เพิ่ม - จำนวนกรรมการสูงสุด

        'school_group_id',
        'excluded_school_groups',  // ✅ กลุ่มที่ไม่อนุญาตให้ลงทะเบียน
        'exclusion_reason',        // ✅ เหตุผลที่ยกเว้น
        'skip_group_level',        // ✅ ข้ามระดับกลุ่ม (bypass ไประดับเขตเลย)
        'start_date',
        'end_date',
        'status',
        'is_active',
        'registration_status',
        'metadata',
        'registration_start_date',
        'registration_end_date',
        'competition_date',
        'competition_start_time',
        'competition_end_time',
        'venue',
        'notes',
        'auto_close_registration',
        'participants_count',
        'parent_competition_id',
        'advancement_count',
    ];

    protected $casts = [
        'metadata' => 'array',
        'excluded_school_groups' => 'array',  // ✅ Cast เป็น array
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_start_date' => 'date',
        'registration_end_date' => 'date',
        'competition_date' => 'date',
        'is_active' => 'boolean',
        'auto_close_registration' => 'boolean',
        'auto_generated' => 'boolean',
        'skip_group_level' => 'boolean',  // ✅ Cast เป็น boolean

        // ✅ Cast participant limits เป็น integer
        'min_students' => 'integer',
        'max_students' => 'integer',
        'min_teachers' => 'integer',
        'max_teachers' => 'integer',
        'min_judges' => 'integer',
        'max_judges' => 'integer',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function schoolGroup()
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function scores()
    {
        return $this->hasMany(Score::class, 'competition_id');
    }

    public function parentCompetition()
    {
        return $this->belongsTo(Competition::class, 'parent_competition_id');
    }

    public function childCompetitions()
    {
        return $this->hasMany(Competition::class, 'parent_competition_id');
    }

    public function advancements()
    {
        return $this->hasMany(CompetitionAdvancement::class, 'source_competition_id');
    }

    // ✅✅✅ Judge Relationships (เพิ่มใหม่) ✅✅✅
    
    /**
     * กรรมการตัดสินในการแข่งขันนี้
     */
    public function judges()
    {
        return $this->hasMany(CompetitionJudge::class, 'competition_id');
    }

    /**
     * จำนวนกรรมการที่เพิ่มแล้ว
     */
    public function getJudgesCountAttribute()
    {
        return $this->judges()->count();
    }

    /**
     * เช็คว่ากรรมการครบแล้วหรือยัง (>= min_judges)
     */
    public function hasEnoughJudges()
    {
        return $this->judges()->count() >= ($this->min_judges ?? 3);
    }

    /**
     * เช็คว่ากรรมการครบจำนวนสูงสุดแล้วหรือยัง (>= max_judges)
     */
    public function hasMaxJudges()
    {
        return $this->judges()->count() >= ($this->max_judges ?? 3);
    }

    // Scopes
    public function scopeGroupLevel($query)
    {
        return $query->where('competition_level', 'group');
    }

    public function scopeDistrictLevel($query)
    {
        return $query->where('competition_level', 'district');
    }

    public function scopeOpenForRegistration($query)
    {
        return $query->where('registration_status', 'open')
                    ->where('is_active', true)
                    ->whereDate('registration_start_date', '<=', now())
                    ->whereDate('registration_end_date', '>=', now());
    }

    // Helper Methods
    public function isRegistrationOpen()
    {
        if ($this->registration_status !== 'open' || !$this->is_active) {
            return false;
        }

        $now = now();
        return $now->between($this->registration_start_date, $this->registration_end_date);
    }

    public function canSchedule()
    {
        return $this->registration_status === 'closed' 
               && $this->participants_count > 0
               && !$this->competition_date;
    }

    public function updateParticipantsCount()
    {
        $this->participants_count = $this->registrations()
            ->where('status', 'approved')
            ->count();
        $this->save();
    }
    
    public function isGroupLevel()
    {
        return $this->competition_level === 'group';
    }
    
    public function isDistrictLevel()
    {
        return $this->competition_level === 'district';
    }

    // ✅ NEW: Multi-Participant Helper Methods
    
    /**
     * รับข้อมูลจำนวนผู้เข้าร่วมขั้นต่ำ-สูงสุด
     */
    public function getParticipantLimits(): array
    {
        return [
            'students' => [
                'min' => $this->min_students ?? 1,
                'max' => $this->max_students ?? 5,
            ],
            'teachers' => [
                'min' => $this->min_teachers ?? 1,
                'max' => $this->max_teachers ?? 3,
            ],
        ];
    }

    /**
     * ตรวจสอบว่าจำนวนนักเรียนอยู่ในขอบเขตที่กำหนดหรือไม่
     */
    public function isValidStudentCount(int $count): bool
    {
        $min = $this->min_students ?? 1;
        $max = $this->max_students ?? 999;
        
        return $count >= $min && $count <= $max;
    }

    /**
     * ตรวจสอบว่าจำนวนครูอยู่ในขอบเขตที่กำหนดหรือไม่
     */
    public function isValidTeacherCount(int $count): bool
    {
        $min = $this->min_teachers ?? 1;
        $max = $this->max_teachers ?? 999;
        
        return $count >= $min && $count <= $max;
    }

    /**
     * รับข้อความแสดงจำนวนผู้เข้าร่วม
     */
    public function getParticipantRequirementText(): string
    {
        $studentText = $this->min_students === $this->max_students
            ? "{$this->min_students} คน"
            : "{$this->min_students}-{$this->max_students} คน";

        $teacherText = $this->min_teachers === $this->max_teachers
            ? "{$this->min_teachers} คน"
            : "{$this->min_teachers}-{$this->max_teachers} คน";

        return "นักเรียน: {$studentText} | ครู: {$teacherText}";
    }

    // ✅ NEW: School Group Exclusion Methods

    /**
     * ตรวจสอบว่ากลุ่มโรงเรียนถูกยกเว้นจากการลงทะเบียนหรือไม่
     */
    public function isSchoolGroupExcluded(int $schoolGroupId): bool
    {
        $excludedGroups = $this->excluded_school_groups ?? [];
        return in_array($schoolGroupId, $excludedGroups);
    }

    /**
     * ตรวจสอบว่าโรงเรียนสามารถลงทะเบียนกิจกรรมนี้ได้หรือไม่
     */
    public function canSchoolRegister(int $schoolGroupId): bool
    {
        // ถ้ากลุ่มถูก exclude ให้ return false
        if ($this->isSchoolGroupExcluded($schoolGroupId)) {
            return false;
        }

        return true;
    }

    /**
     * เพิ่มกลุ่มโรงเรียนที่ยกเว้น
     */
    public function addExcludedSchoolGroup(int $schoolGroupId): void
    {
        $excludedGroups = $this->excluded_school_groups ?? [];
        if (!in_array($schoolGroupId, $excludedGroups)) {
            $excludedGroups[] = $schoolGroupId;
            $this->excluded_school_groups = $excludedGroups;
            $this->save();
        }
    }

    /**
     * ลบกลุ่มโรงเรียนออกจากรายการยกเว้น
     */
    public function removeExcludedSchoolGroup(int $schoolGroupId): void
    {
        $excludedGroups = $this->excluded_school_groups ?? [];
        $excludedGroups = array_values(array_filter($excludedGroups, fn($id) => $id !== $schoolGroupId));
        $this->excluded_school_groups = $excludedGroups;
        $this->save();
    }

    /**
     * ตั้งค่ากลุ่มโรงเรียนที่ยกเว้นทั้งหมด
     */
    public function setExcludedSchoolGroups(array $schoolGroupIds): void
    {
        $this->excluded_school_groups = array_values(array_unique($schoolGroupIds));
        $this->save();
    }

    /**
     * Scope: กรองเฉพาะกิจกรรมที่กลุ่มโรงเรียนสามารถลงทะเบียนได้
     */
    public function scopeAvailableForSchoolGroup($query, int $schoolGroupId)
    {
        return $query->where(function ($q) use ($schoolGroupId) {
            $q->whereNull('excluded_school_groups')
              ->orWhereJsonDoesntContain('excluded_school_groups', $schoolGroupId);
        });
    }
}