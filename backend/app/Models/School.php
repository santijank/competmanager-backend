<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'school_group_id',
        'code',
        'name',
        'school_type',
        'address',
        'phone',
        'email',
        'director_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the school group that owns the school
     */
    public function schoolGroup(): BelongsTo
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    /**
     * Get the users (teachers) for the school
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the registrations for the school
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Scope: Only active schools
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filter by school group
     */
    public function scopeInGroup($query, int $schoolGroupId)
    {
        return $query->where('school_group_id', $schoolGroupId);
    }

    /**
     * Scope: Government schools
     */
    public function scopeGovernment($query)
    {
        return $query->where('school_type', 'government');
    }

    /**
     * Scope: Private schools
     */
    public function scopePrivate($query)
    {
        return $query->where('school_type', 'private');
    }
}
