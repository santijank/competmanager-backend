<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'school_id',
        'team_name',
        
        // ✅ Multi-Participant Support
        'student_names',     // JSON array - นักเรียนหลายคน
        'student_count',     // จำนวนนักเรียน
        'teacher_names',     // ✅ เพิ่ม - JSON array - ครูหลายคน
        'teacher_count',     // ✅ เพิ่ม - จำนวนครู
        
        'teacher_id',        // FK - ครูที่ลงทะเบียน (backward compatibility)
        'status',
        'notes',
        'registered_at',
        'registered_by',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
    ];

    protected $casts = [
        'student_names' => 'array',      // Cast JSON เป็น array
        'teacher_names' => 'array',      // ✅ เพิ่ม - Cast JSON เป็น array
        'registered_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'student_count' => 'integer',
        'teacher_count' => 'integer',    // ✅ เพิ่ม
    ];

    // Relationships
    public function competition()
    {
        return $this->belongsTo(Competition::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function registeredBy()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function score()
    {
        return $this->hasOne(Score::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helper Methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function canEdit(): bool
    {
        return $this->status === 'pending' && $this->competition->isRegistrationOpen();
    }

    // ✅ NEW: Multi-Participant Helper Methods

    /**
     * รับรายชื่อนักเรียนทั้งหมด (array of names)
     */
    public function getStudentNamesList(): array
    {
        if (!$this->student_names || !is_array($this->student_names)) {
            return [];
        }
        
        return collect($this->student_names)
            ->pluck('name')
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * รับรายชื่อครูทั้งหมด (array of names)
     */
    public function getTeacherNamesList(): array
    {
        if (!$this->teacher_names || !is_array($this->teacher_names)) {
            return [];
        }
        
        return collect($this->teacher_names)
            ->pluck('name')
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * รับรายชื่อนักเรียนในรูปแบบ string (คั่นด้วย comma)
     */
    public function getStudentNamesString(string $separator = ', '): string
    {
        return implode($separator, $this->getStudentNamesList());
    }

    /**
     * รับรายชื่อครูในรูปแบบ string (คั่นด้วย comma)
     */
    public function getTeacherNamesString(string $separator = ', '): string
    {
        return implode($separator, $this->getTeacherNamesList());
    }

    /**
     * รับรายชื่อนักเรียนพร้อมเลขที่ (สำหรับแสดงผล)
     */
    public function getFormattedStudentNames(): string
    {
        $names = $this->getStudentNamesList();
        
        return collect($names)
            ->map(fn($name, $index) => ($index + 1) . '. ' . $name)
            ->implode("\n");
    }

    /**
     * รับรายชื่อครูพร้อมเลขที่ (สำหรับแสดงผล)
     */
    public function getFormattedTeacherNames(): string
    {
        $names = $this->getTeacherNamesList();
        
        return collect($names)
            ->map(fn($name, $index) => ($index + 1) . '. ' . $name)
            ->implode("\n");
    }

    /**
     * ตรวจสอบว่าจำนวนผู้เข้าร่วมตรงตามข้อกำหนดหรือไม่
     */
    public function hasValidParticipantCount(): bool
    {
        $competition = $this->competition;
        
        if (!$competition) {
            return false;
        }
        
        $validStudents = $competition->isValidStudentCount($this->student_count);
        $validTeachers = $competition->isValidTeacherCount($this->teacher_count);
        
        return $validStudents && $validTeachers;
    }

    /**
     * Event: อัพเดท student_count และ teacher_count อัตโนมัติ
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($registration) {
            // อัพเดท student_count
            if ($registration->student_names && is_array($registration->student_names)) {
                $registration->student_count = count($registration->student_names);
            }
            
            // อัพเดท teacher_count
            if ($registration->teacher_names && is_array($registration->teacher_names)) {
                $registration->teacher_count = count($registration->teacher_names);
            }
        });
    }
}
