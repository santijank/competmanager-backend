<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Issue extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'type',
        'priority',
        'status',
        'created_by',
        'assigned_to',
        'school_group_id',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // === Relationships ===

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function schoolGroup()
    {
        return $this->belongsTo(SchoolGroup::class);
    }

    public function replies()
    {
        return $this->hasMany(IssueReply::class)->orderBy('created_at', 'asc');
    }

    public function attachments()
    {
        return $this->hasMany(IssueAttachment::class)->whereNull('issue_reply_id');
    }

    // === Scopes ===

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    // === Helpers ===

    public static function generateTicketNumber(): string
    {
        $today = now()->format('Ymd');
        $count = DB::table('issues')
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return 'TK-' . $today . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }

    public static function getTypeLabels(): array
    {
        return [
            'system_bug' => 'แจ้งปัญหาระบบ',
            'data_issue' => 'แก้ไขข้อมูล',
            'feature_request' => 'เสนอแนะ',
            'inquiry' => 'สอบถาม',
            'complaint' => 'ร้องเรียน',
            'other' => 'อื่นๆ',
        ];
    }

    public static function getPriorityLabels(): array
    {
        return [
            'urgent' => 'ด่วนมาก',
            'high' => 'สำคัญ',
            'normal' => 'ปกติ',
            'low' => 'ต่ำ',
        ];
    }

    public static function getStatusLabels(): array
    {
        return [
            'open' => 'เปิด',
            'in_progress' => 'กำลังดำเนินการ',
            'resolved' => 'แก้ไขแล้ว',
            'closed' => 'ปิด',
        ];
    }

    public function getTypeLabelAttribute(): string
    {
        return self::getTypeLabels()[$this->type] ?? $this->type;
    }

    public function getPriorityLabelAttribute(): string
    {
        return self::getPriorityLabels()[$this->priority] ?? $this->priority;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::getStatusLabels()[$this->status] ?? $this->status;
    }
}
