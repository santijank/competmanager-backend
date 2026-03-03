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
        'document_number',
        'recipient_type',
        'recipient_name',
        'score_id',
        'result_id',
        'competition_id',
        'template_id',
        'student_name',
        'school_name',
        'competition_name',
        'category_name',
        'teacher_names',
        'level',
        'group_name',
        'competition_date_text',
        'rank',
        'medal',
        'score',
        'judges',
        'committee',
        'signed_by',
        'signer_position',
        'issue_date',
        'generated_by',
        'generated_at',
        'pdf_path',
    ];

    protected $casts = [
        'judges' => 'array',
        'committee' => 'array',
        'teacher_names' => 'array',
        'score' => 'decimal:2',
        'issue_date' => 'date',
        'generated_at' => 'datetime',
    ];

    public function scoreRecord(): BelongsTo
    {
        return $this->belongsTo(Score::class, 'score_id');
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function getMedalLabelAttribute(): string
    {
        return match($this->medal) {
            'gold' => 'เหรียญทอง',
            'silver' => 'เหรียญเงิน',
            'bronze' => 'เหรียญทองแดง',
            'participant' => 'เข้าร่วม',
            default => $this->medal ?? '-',
        };
    }

    /**
     * ข้อความลำดับ: ชนะเลิศ/รองชนะเลิศ
     */
    public function getRankingTextAttribute(): string
    {
        if (!$this->rank || (int)$this->rank > 3) {
            return '';
        }

        switch ((int)$this->rank) {
            case 1: return 'ชนะเลิศ อันดับ ๑';
            case 2: return 'รองชนะเลิศ อันดับ ๑';
            case 3: return 'รองชนะเลิศ อันดับ ๒';
            default: return '';
        }
    }

    /**
     * เป็นเกียรติบัตรครูหรือไม่
     */
    public function getIsTeacherCertAttribute(): bool
    {
        return ($this->recipient_type ?? 'student') === 'teacher';
    }

    public function getLevelLabelAttribute(): string
    {
        return match($this->level) {
            'group' => 'ระดับกลุ่ม',
            'district' => 'ระดับเขต',
            default => $this->level ?? '',
        };
    }

    public function scopeGenerated($query)
    {
        return $query->whereNotNull('pdf_path');
    }

    public function scopeForCompetition($query, int $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    public function scopeForLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public function scopeForMedal($query, string $medal)
    {
        return $query->where('medal', $medal);
    }
}
