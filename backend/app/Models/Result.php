<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'competition_id',
        'level',
        'score',
        'rank',
        'medal',
        'judges',
        'committee',
        'scored_by',
        'scored_at',
        'is_confirmed',
        'confirmed_at',
        'confirmed_by',
        'confirmed_to_district',
        'advanced_at',
        'advanced_by',
        'comments',
    ];

    protected $casts = [
        'judges' => 'array',
        'committee' => 'array',
        'scored_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'advanced_at' => 'datetime',
        'is_confirmed' => 'boolean',
        'confirmed_to_district' => 'boolean',
        'score' => 'decimal:2',
    ];

    protected $appends = ['medal_label', 'level_label'];

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

    public function getLevelLabelAttribute(): string
    {
        return match($this->level) {
            'group' => 'ระดับกลุ่ม',
            'district' => 'ระดับเขต',
            default => $this->level ?? '',
        };
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function scorer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scored_by');
    }

    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function advancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'advanced_by');
    }

    public function certificate(): HasOne
    {
        return $this->hasOne(Certificate::class);
    }

    public function scopeLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('is_confirmed', true);
    }

    public function scopeAdvanced($query)
    {
        return $query->where('confirmed_to_district', true);
    }

    public function scopeGoldMedal($query)
    {
        return $query->where('medal', 'gold');
    }
}
