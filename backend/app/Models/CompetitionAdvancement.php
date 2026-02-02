<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompetitionAdvancement extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_competition_id',
        'source_result_id',
        'source_rank',
        'target_competition_id',
        'target_registration_id',
        'advanced_by',
        'advanced_at',
        'status',
    ];

    protected $casts = [
        'advanced_at' => 'datetime',
    ];

    // Relationships
    public function sourceCompetition()
    {
        return $this->belongsTo(Competition::class, 'source_competition_id');
    }

    public function sourceResult()
    {
        return $this->belongsTo(Result::class, 'source_result_id');
    }

    public function targetCompetition()
    {
        return $this->belongsTo(Competition::class, 'target_competition_id');
    }

    public function targetRegistration()
    {
        return $this->belongsTo(Registration::class, 'target_registration_id');
    }

    public function advancedByUser()
    {
        return $this->belongsTo(User::class, 'advanced_by');
    }
}