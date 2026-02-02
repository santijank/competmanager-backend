<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'school_group_id',
        'level',
        'venue',
        'room',
        'competition_date',
        'start_time',
        'end_time',
        'notes',
        'is_published',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'competition_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    // Relationships
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function schoolGroup(): BelongsTo
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeForGroup($query, $schoolGroupId)
    {
        return $query->where('school_group_id', $schoolGroupId)
                     ->where('level', 'group');
    }

    public function scopeForDistrict($query)
    {
        return $query->where('level', 'district');
    }

    // Helpers
    public function getFormattedTimeAttribute(): string
    {
        if (!$this->start_time) return '-';

        $start = $this->start_time->format('H:i');
        $end = $this->end_time ? $this->end_time->format('H:i') : '';

        return $end ? "{$start} - {$end} น." : "{$start} น.";
    }

    public function getFormattedDateAttribute(): string
    {
        if (!$this->competition_date) return '-';

        return $this->competition_date->locale('th')->translatedFormat('j F Y');
    }

    public function getFullLocationAttribute(): string
    {
        $parts = [];
        if ($this->venue) $parts[] = $this->venue;
        if ($this->room) $parts[] = $this->room;

        return implode(' - ', $parts) ?: '-';
    }
}
