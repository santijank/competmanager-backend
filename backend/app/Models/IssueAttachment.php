<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IssueAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_id',
        'issue_reply_id',
        'original_name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // === Relationships ===

    public function issue()
    {
        return $this->belongsTo(Issue::class);
    }

    public function reply()
    {
        return $this->belongsTo(IssueReply::class, 'issue_reply_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // === Helpers ===

    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if (!$bytes) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 1) . ' ' . $units[$i];
    }

    public function isImage(): bool
    {
        return in_array($this->file_type, [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
        ]);
    }
}
