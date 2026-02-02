<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'type',
        'scope',
        'school_group_id',
        'competition_id',
        'priority',
        'is_pinned',
        'published_at',
        'expired_at',
        'created_by',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'published_at' => 'datetime',
        'expired_at' => 'datetime',
    ];

    /**
     * ความสัมพันธ์กับ SchoolGroup
     */
    public function schoolGroup()
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    /**
     * ความสัมพันธ์กับ Competition
     */
    public function competition()
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * ความสัมพันธ์กับ User (ผู้สร้าง)
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * ความสัมพันธ์กับ AnnouncementFiles
     */
    public function files()
    {
        return $this->hasMany(AnnouncementFile::class);
    }

    /**
     * Scope: เฉพาะประกาศที่ active (ยังไม่หมดอายุ)
     */
    public function scopeActive(Builder $query)
    {
        return $query->where('published_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('expired_at')
                  ->orWhere('expired_at', '>', now());
            });
    }

    /**
     * Scope: เฉพาะประกาศที่ปักหมุด
     */
    public function scopePinned(Builder $query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope: ตามระดับความสำคัญ
     */
    public function scopeByPriority(Builder $query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope: ตามประเภท
     */
    public function scopeByType(Builder $query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * ตรวจสอบว่าประกาศยังใช้งานได้หรือไม่
     */
    public function isActive()
    {
        $now = now();
        
        if ($this->published_at > $now) {
            return false;
        }
        
        if ($this->expired_at && $this->expired_at < $now) {
            return false;
        }
        
        return true;
    }

    /**
     * ตรวจสอบว่าหมดอายุแล้วหรือยัง
     */
    public function isExpired()
    {
        return $this->expired_at && $this->expired_at < now();
    }
}
