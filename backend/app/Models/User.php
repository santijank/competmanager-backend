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
        'category_id',
        'is_active',
        'committee_level',
        'last_activity_at',
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
        'is_active' => 'boolean',
        'last_activity_at' => 'datetime',
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
     * NOTE: ใช้ school_group ใน with() แทน schoolGroup
     */
    public function school_group(): BelongsTo
    {
        return $this->belongsTo(SchoolGroup::class, 'school_group_id');
    }

    /**
     * Alternative method name for backwards compatibility
     */
    public function schoolGroup(): BelongsTo
    {
        return $this->school_group();
    }

    /**
     * Get the category assigned to this user (for category_admin/data_entry)
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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
     * Check if user is district admin
     */
    public function isDistrictAdmin(): bool
    {
        return $this->role === 'district_admin';
    }

    /**
     * Check if user is group admin
     */
    public function isGroupAdmin(): bool
    {
        return $this->role === 'group_admin';
    }

    /**
     * Check if user is school admin
     */
    public function isSchoolAdmin(): bool
    {
        return $this->role === 'school_admin';
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
     * Check if user is category admin
     */
    public function isCategoryAdmin(): bool
    {
        return $this->role === 'category_admin';
    }

    /**
     * Check if user is data entry
     */
    public function isDataEntry(): bool
    {
        return $this->role === 'data_entry';
    }

    /**
     * Get category IDs this user can access.
     * If user's category name contains "พิเศษเรียนรวม", returns ALL such category IDs.
     * Otherwise returns just the user's single category_id.
     */
    public function getCategoryIdsForScope(): array
    {
        if (!$this->category_id) return [];

        $category = $this->relationLoaded('category')
            ? $this->category
            : Category::find($this->category_id);

        if ($category && str_contains($category->name, 'พิเศษเรียนรวม')) {
            return Category::where('name', 'like', '%พิเศษเรียนรวม%')
                ->pluck('id')->toArray();
        }

        return [$this->category_id];
    }

    /**
     * Check if user can access a specific category
     */
    public function canAccessCategory(int $categoryId): bool
    {
        // admin (super_admin) can access everything
        if ($this->role === 'admin') return true;

        // category_admin and data_entry: check against scoped category IDs
        if (in_array($this->role, ['category_admin', 'data_entry'])) {
            return in_array($categoryId, $this->getCategoryIdsForScope());
        }

        // other roles (district_admin, group_admin) can access all categories
        return true;
    }

    /**
     * Check if user is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Scope: Only admins
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope: Only district admins
     */
    public function scopeDistrictAdmins($query)
    {
        return $query->where('role', 'district_admin');
    }

    /**
     * Scope: Only group admins
     */
    public function scopeGroupAdmins($query)
    {
        return $query->where('role', 'group_admin');
    }

    /**
     * Scope: Only school admins
     */
    public function scopeSchoolAdmins($query)
    {
        return $query->where('role', 'school_admin');
    }

    /**
     * Scope: Only teachers
     */
    public function scopeTeachers($query)
    {
        return $query->where('role', 'teacher');
    }

    /**
     * Scope: Only active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
