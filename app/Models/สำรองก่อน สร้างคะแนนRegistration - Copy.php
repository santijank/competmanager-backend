<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'competition_id',
        'school_id',
        'teacher_id',
        'team_name',
        'student_names',
        'student_count',
        'status',
        'registration_date',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'student_names' => 'array',
        'registration_date' => 'datetime',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the competition that the registration belongs to.
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Get the school that the registration belongs to.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the teacher (user) that made the registration.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the user who approved the registration.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by competition
     */
    public function scopeForCompetition($query, $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    /**
     * Scope: Filter by school group
     */
    public function scopeForSchoolGroup($query, $schoolGroupId)
    {
        return $query->whereHas('school', function ($q) use ($schoolGroupId) {
            $q->where('school_group_id', $schoolGroupId);
        });
    }

    /**
     * Scope: Filter by teacher
     */
    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Check if registration is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if registration is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if registration is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if registration is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if registration can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['pending', 'rejected']);
    }

    /**
     * Check if registration can be cancelled
     */
    public function canCancel(): bool
    {
        return !in_array($this->status, ['cancelled', 'approved']);
    }
}
