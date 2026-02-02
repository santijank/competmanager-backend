<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * CompetitionJudge Model
 * 
 * เก็บข้อมูลกรรมการตัดสินแต่ละการแข่งขัน
 * - ชื่อกรรมการ
 * - โรงเรียน/หน่วยงาน (พิมพ์เอง)
 * - ผู้สร้าง (Group Admin)
 */
class CompetitionJudge extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'name',
        'school_name',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ==========================================
    // Relationships
    // ==========================================

    /**
     * การแข่งขันที่กรรมการตัดสิน
     */
    public function competition()
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Group Admin ที่เพิ่มกรรมการ
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ==========================================
    // Scopes
    // ==========================================

    /**
     * Scope: กรรมการของการแข่งขันนี้
     */
    public function scopeForCompetition($query, $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    /**
     * Scope: กรรมการที่ Group Admin คนนี้เพิ่ม
     */
    public function scopeCreatedBy($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    // ==========================================
    // Accessors
    // ==========================================

    /**
     * แสดงชื่อกรรมการพร้อมโรงเรียน
     */
    public function getFullDisplayAttribute()
    {
        if ($this->school_name) {
            return "{$this->name} ({$this->school_name})";
        }
        return $this->name;
    }
}
