<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'position',
        'organization',
        'responsibility',
        'member_type',
        'level',           // group หรือ district
        'note',
        'school_group_id',
        'competition_id',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function schoolGroup()
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    public function competition()
    {
        return $this->belongsTo(Competition::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('member_type', $type);
    }

    public function scopeByGroup($query, $groupId)
    {
        return $query->where('school_group_id', $groupId);
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeGroupLevel($query)
    {
        return $query->where('level', 'group');
    }

    public function scopeDistrictLevel($query)
    {
        return $query->where('level', 'district');
    }

    /**
     * Accessor - ชื่อเต็มพร้อมตำแหน่ง
     */
    public function getFullTitleAttribute()
    {
        if ($this->position) {
            return "{$this->name} ({$this->position})";
        }
        return $this->name;
    }

    /**
     * Helper Methods
     */
    public function getMemberTypeLabel()
    {
        $labels = [
            'committee' => 'คณะกรรมการ',
            'staff' => 'คณะกรรมการดำเนินงาน',
            'volunteer' => 'อาสาสมัคร',
        ];

        return $labels[$this->member_type] ?? $this->member_type;
    }

    public function getLevelLabel()
    {
        $labels = [
            'group' => 'ระดับกลุ่ม',
            'district' => 'ระดับเขตพื้นที่',
        ];

        return $labels[$this->level] ?? $this->level;
    }
}
