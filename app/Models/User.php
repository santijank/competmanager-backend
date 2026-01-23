<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'school_id',
        'school_group_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the school that owns the user
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the school group that owns the user
     */
    public function schoolGroup(): BelongsTo
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    /**
     * Get the registrations created by the user
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'registered_by');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is group admin
     */
    public function isGroupAdmin(): bool
    {
        return $this->role === 'group_admin';
    }

    /**
     * Check if user is teacher
     */
    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    /**
     * Check if user is committee
     */
    public function isCommittee(): bool
    {
        return $this->role === 'committee';
    }

    /**
     * Check if user is judge
     */
    public function isJudge(): bool
    {
        return $this->role === 'judge';
    }

    /**
     * Scope: Only admins
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope: Only group admins
     */
    public function scopeGroupAdmins($query)
    {
        return $query->where('role', 'group_admin');
    }

    /**
     * Scope: Only teachers
     */
    public function scopeTeachers($query)
    {
        return $query->where('role', 'teacher');
    }

    /**
     * Scope: Filter by school
     */
    public function scopeInSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Scope: Filter by school group
     */
    public function scopeInSchoolGroup($query, int $schoolGroupId)
    {
        return $query->where('school_group_id', $schoolGroupId);
    }
}
