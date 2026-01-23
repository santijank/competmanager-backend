<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_code',
        'result_id',
        'competition_id',
        'student_name',
        'school_name',
        'competition_name',
        'level',
        'rank',
        'medal',
        'judges',
        'committee',
        'issue_date',
        'generated_by',
        'generated_at',
        'pdf_path',
    ];

    protected $casts = [
        'judges' => 'array',
        'committee' => 'array',
        'issue_date' => 'date',
        'generated_at' => 'datetime',
    ];

    /**
     * Get the result that owns the certificate
     */
    public function result(): BelongsTo
    {
        return $this->belongsTo(Result::class);
    }

    /**
     * Get the competition
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Get the user who generated the certificate
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Get the full PDF URL
     */
    public function getPdfUrlAttribute(): ?string
    {
        return $this->pdf_path ? asset('storage/' . $this->pdf_path) : null;
    }

    /**
     * Check if certificate has been generated
     */
    public function isGenerated(): bool
    {
        return !is_null($this->pdf_path);
    }

    /**
     * Get medal label in Thai
     */
    public function getMedalLabelAttribute(): string
    {
        return match($this->medal) {
            'gold' => 'เหรียญทอง',
            'silver' => 'เหรียญเงิน',
            'bronze' => 'เหรียญทองแดง',
            'none' => 'ไม่มีเหรียญ',
            default => $this->medal ?? 'ไม่มีเหรียญ',
        };
    }

    /**
     * Get level label in Thai
     */
    public function getLevelLabelAttribute(): string
    {
        return match($this->level) {
            'group' => 'ระดับกลุ่ม',
            'district' => 'ระดับเขต',
            default => $this->level ?? '',
        };
    }

    /**
     * Scope: Only generated certificates
     */
    public function scopeGenerated($query)
    {
        return $query->whereNotNull('pdf_path');
    }

    /**
     * Scope: Filter by competition
     */
    public function scopeForCompetition($query, int $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    /**
     * Scope: Filter by level
     */
    public function scopeForLevel($query, string $level)
    {
        return $query->where('level', $level);
    }
}