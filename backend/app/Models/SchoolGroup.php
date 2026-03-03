<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SchoolGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
        'competition_date_text',
        'registration_start_date',
        'registration_end_date',
        'registration_announcement',
        'registration_configured_by',
        'registration_configured_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'registration_start_date' => 'datetime',
        'registration_end_date' => 'datetime',
        'registration_configured_at' => 'datetime',
    ];

    /**
     * Get the schools in this group
     */
    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }

    /**
     * Get the users in this group
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get competitions specific to this group
     */
    public function competitions(): HasMany
    {
        return $this->hasMany(Competition::class);
    }

    /**
     * Get the competitions selected by this school group
     */
    public function selectedCompetitions(): BelongsToMany
    {
        return $this->belongsToMany(Competition::class, 'school_group_competitions')
            ->withTimestamps();
    }

    /**
     * ========================================
     * 🎯 Registration Lock System Methods
     * ========================================
     */
    
    /**
     * ตรวจสอบว่าเปิดรับสมัครหรือไม่
     * 
     * @return bool
     */
    public function isRegistrationOpen(): bool
    {
        // ถ้าไม่ได้กำหนดวันเปิด-ปิด = ไม่เปิดรับสมัคร
        if (!$this->registration_start_date || !$this->registration_end_date) {
            return false;
        }
        
        $now = now();
        
        // ตรวจสอบว่าอยู่ในช่วงเวลาหรือไม่
        return $now->between(
            $this->registration_start_date,
            $this->registration_end_date
        );
    }
    
    /**
     * จำนวนวันที่เหลือในการรับสมัคร
     * 
     * @return int
     */
    public function daysRemaining(): int
    {
        if (!$this->isRegistrationOpen()) {
            return 0;
        }
        
        return now()->diffInDays($this->registration_end_date, false);
    }
    
    /**
     * จำนวนชั่วโมงที่เหลือในการรับสมัคร
     * 
     * @return int
     */
    public function hoursRemaining(): int
    {
        if (!$this->isRegistrationOpen()) {
            return 0;
        }
        
        return now()->diffInHours($this->registration_end_date, false);
    }
    
    /**
     * สถานะการรับสมัครแบบละเอียด
     * 
     * @return array
     */
    public function getRegistrationStatus(): array
    {
        $now = now();
        
        // ยังไม่ได้กำหนดช่วงเวลา
        if (!$this->registration_start_date || !$this->registration_end_date) {
            return [
                'status' => 'not_set',
                'is_open' => false,
                'message' => 'ยังไม่ได้กำหนดช่วงเวลารับสมัคร',
                'message_en' => 'Registration period not set',
            ];
        }
        
        // ยังไม่เริ่ม
        if ($now->lt($this->registration_start_date)) {
            $startsIn = $now->diffForHumans($this->registration_start_date, true);
            
            return [
                'status' => 'upcoming',
                'is_open' => false,
                'message' => 'เปิดรับสมัครวันที่ ' . $this->registration_start_date->format('d/m/Y H:i'),
                'message_en' => 'Registration opens on ' . $this->registration_start_date->format('Y-m-d H:i'),
                'starts_in' => $startsIn,
                'starts_in_thai' => 'เปิดรับสมัครใน ' . $startsIn,
                'start_date' => $this->registration_start_date,
            ];
        }
        
        // ปิดแล้ว
        if ($now->gt($this->registration_end_date)) {
            return [
                'status' => 'closed',
                'is_open' => false,
                'message' => 'ปิดรับสมัครแล้ว (ปิดเมื่อ ' . $this->registration_end_date->format('d/m/Y H:i') . ')',
                'message_en' => 'Registration closed',
                'ended_at' => $this->registration_end_date,
            ];
        }
        
        // กำลังเปิดอยู่
        $endsIn = $now->diffForHumans($this->registration_end_date, true);
        $daysRemaining = $this->daysRemaining();
        $hoursRemaining = $this->hoursRemaining();
        
        return [
            'status' => 'open',
            'is_open' => true,
            'message' => 'กำลังเปิดรับสมัคร',
            'message_en' => 'Registration is open',
            'ends_in' => $endsIn,
            'ends_in_thai' => 'ปิดรับสมัครใน ' . $endsIn,
            'days_remaining' => $daysRemaining,
            'hours_remaining' => $hoursRemaining,
            'end_date' => $this->registration_end_date,
            'warning' => $daysRemaining <= 2 ? 'เหลือเวลาน้อย!' : null,
        ];
    }

    /**
     * Scope: Only active school groups
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
