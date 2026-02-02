<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'competition_id',
        'score',
        'medal',
        'rank',
        'scored_by',
        'scored_at',
        'notes',
        'is_finalized',
        'finalized_by',
        'finalized_at',
        'advanced_to_district',
        'advanced_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'is_finalized' => 'boolean',
        'advanced_to_district' => 'boolean',
        'scored_at' => 'datetime',
        'finalized_at' => 'datetime',
        'advanced_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function registration()
    {
        return $this->belongsTo(Registration::class);
    }

    public function competition()
    {
        return $this->belongsTo(Competition::class);
    }

    public function scorer()
    {
        return $this->belongsTo(User::class, 'scored_by');
    }

    public function finalizer()
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    /**
     * Calculate medal based on score
     */
    public static function calculateMedal($score)
    {
        if ($score === null || $score == 0) {
            return 'absent';
        } elseif ($score >= 80) {
            return 'gold';
        } elseif ($score >= 70) {
            return 'silver';
        } elseif ($score >= 60) {
            return 'bronze';
        } else {
            return 'participant';
        }
    }

    /**
     * Get medal display name in Thai
     */
    public function getMedalNameAttribute()
    {
        $medals = [
            'gold' => 'เหรียญทอง',
            'silver' => 'เหรียญเงิน',
            'bronze' => 'เหรียญทองแดง',
            'participant' => 'เข้าร่วม',
            'absent' => 'ไม่มาแข่งขัน',
        ];

        return $medals[$this->medal] ?? '-';
    }

    /**
     * Get medal emoji
     */
    public function getMedalEmojiAttribute()
    {
        $emojis = [
            'gold' => '🥇',
            'silver' => '🥈',
            'bronze' => '🥉',
            'participant' => '🎖️',
            'absent' => '❌',
        ];

        return $emojis[$this->medal] ?? '';
    }

    /**
     * Get medal color class
     */
    public function getMedalColorAttribute()
    {
        $colors = [
            'gold' => 'text-yellow-600 bg-yellow-100',
            'silver' => 'text-gray-600 bg-gray-100',
            'bronze' => 'text-orange-600 bg-orange-100',
            'participant' => 'text-blue-600 bg-blue-100',
            'absent' => 'text-red-600 bg-red-100',
        ];

        return $colors[$this->medal] ?? '';
    }

    /**
     * Check if score is editable
     */
    public function isEditable()
    {
        return !$this->is_finalized;
    }

    /**
     * Scope: Only finalized scores
     */
    public function scopeFinalized($query)
    {
        return $query->where('is_finalized', true);
    }

    /**
     * Scope: Not finalized scores
     */
    public function scopeNotFinalized($query)
    {
        return $query->where('is_finalized', false);
    }

    /**
     * Scope: Has score (not null and not 0)
     */
    public function scopeHasScore($query)
    {
        return $query->whereNotNull('score')->where('score', '>', 0);
    }

    /**
     * Scope: By medal type
     */
    public function scopeByMedal($query, $medal)
    {
        return $query->where('medal', $medal);
    }

    /**
     * Scope: Advanced to district
     */
    public function scopeAdvanced($query)
    {
        return $query->where('advanced_to_district', true);
    }
}
