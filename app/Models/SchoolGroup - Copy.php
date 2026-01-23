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
    ];

    protected $casts = [
        'is_active' => 'boolean',
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
     * Scope: Only active school groups
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
