<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
     * ✅ IMPORTANT: Cast student_names เป็น array
     * 
     * @var array<string, string>
     */
    protected $casts = [
        'student_names' => 'array', // ✅ Cast JSON to array automatically
        'registration_date' => 'datetime',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Append attributes to JSON
     */
    protected $appends = [
        'has_score',
        'score_value',
        'medal',
        'rank',
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
     * Get the score for this registration.
     * 
     * @return HasOne
     */
    public function score(): HasOne
    {
        return $this->hasOne(Score::class);
    }

    /**
     * Check if registration has score
     * 
     * @return bool
     */
    public function hasScore(): bool
    {
        return $this->score !== null && $this->score->score !== null;
    }

    /**
     * Get has_score attribute
     * 
     * @return bool
     */
    public function getHasScoreAttribute(): bool
    {
        return $this->hasScore();
    }

    /**
     * Get score value
     * 
     * @return float|null
     */
    public function getScoreValueAttribute(): ?float
    {
        return $this->score ? $this->score->score : null;
    }

    /**
     * Get medal
     * 
     * @return string|null
     */
    public function getMedalAttribute(): ?string
    {
        return $this->score ? $this->score->medal : null;
    }

    /**
     * Get rank
     * 
     * @return int|null
     */
    public function getRankAttribute(): ?int
    {
        return $this->score ? $this->score->rank : null;
    }

    /**
     * ✅ Accessor: Ensure student_names is always an array
     * 
     * This handles cases where cast might fail
     */
    public function getStudentNamesAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        // If it's a string, try to decode JSON
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * ✅ NEW: Get student names as a formatted string
     * 
     * @param string $separator
     * @return string
     */
    public function getStudentNamesString(string $separator = ', '): string
    {
        $names = $this->getAllStudentNames();
        
        if (empty($names)) {
            return $this->team_name ?? 'ไม่ระบุชื่อ';
        }
        
        return implode($separator, $names);
    }

    /**
     * ✅ NEW: Accessor for student_names_string attribute
     * 
     * @return string
     */
    public function getStudentNamesStringAttribute(): string
    {
        return $this->getStudentNamesString();
    }

    /**
     * ✅ NEW: Get all student names as array
     * 
     * Supports two formats:
     * - Format 1: ["name1", "name2"] - simple array
     * - Format 2: [{"name": "name1", "student_id": "001"}, ...] - array of objects
     * 
     * @return array
     */
    public function getAllStudentNames(): array
    {
        // Get student_names (already cast to array via accessor)
        $names = $this->attributes['student_names'] ?? $this->student_names ?? [];
        
        // Handle string (JSON)
        if (is_string($names)) {
            $decoded = json_decode($names, true);
            $names = is_array($decoded) ? $decoded : [];
        }
        
        // If not array, return empty
        if (!is_array($names)) {
            return [];
        }
        
        // ✅ Extract names based on format
        $result = [];
        foreach ($names as $item) {
            if (is_string($item)) {
                // Format 1: simple string
                $result[] = $item;
            } elseif (is_array($item) && isset($item['name'])) {
                // Format 2: object with 'name' key
                $result[] = $item['name'];
            }
        }
        
        return array_filter($result); // Remove empty values
    }

    /**
     * ✅ NEW: Get first student name (for backward compatibility)
     * 
     * @return string|null
     */
    public function getFirstStudentName(): ?string
    {
        $names = $this->getAllStudentNames();
        return !empty($names) ? $names[0] : null;
    }

    /**
     * ✅ NEW: Count number of students
     * 
     * @return int
     */
    public function getStudentNamesCount(): int
    {
        return count($this->getAllStudentNames());
    }

    /**
     * ✅ NEW: Add a student name
     * 
     * @param string $name
     * @return void
     */
    public function addStudentName(string $name): void
    {
        $names = $this->getAllStudentNames();
        
        if (!in_array($name, $names)) {
            $names[] = $name;
            $this->student_names = $names;
        }
    }

    /**
     * ✅ NEW: Remove a student name
     * 
     * @param string $name
     * @return void
     */
    public function removeStudentName(string $name): void
    {
        $names = $this->getAllStudentNames();
        $names = array_filter($names, fn($n) => $n !== $name);
        $this->student_names = array_values($names); // Re-index
    }

    /**
     * ✅ NEW: Check if registration can be scored
     * 
     * @return bool
     */
    public function canBeScored(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * ✅ NEW: Get display name for this registration
     * 
     * @return string
     */
    public function getDisplayName(): string
    {
        if ($this->team_name) {
            return $this->team_name;
        }
        
        $studentNames = $this->getStudentNamesString();
        if ($studentNames !== 'ไม่ระบุชื่อ') {
            return $studentNames;
        }
        
        return 'ทีม #' . $this->id;
    }

    /**
     * ✅ NEW: Scope - Get approved registrations
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * ✅ NEW: Scope - Get pending registrations
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * ✅ NEW: Scope - Get rejected registrations
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * ✅ NEW: Scope - Get cancelled registrations
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * ✅ NEW: Scope - Get registrations with scores
     */
    public function scopeWithScores($query)
    {
        return $query->has('score');
    }

    /**
     * ✅ NEW: Scope - Get registrations without scores
     */
    public function scopeWithoutScores($query)
    {
        return $query->doesntHave('score');
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