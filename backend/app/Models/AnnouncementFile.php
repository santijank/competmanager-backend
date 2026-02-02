<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnouncementFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'original_name',
        'stored_name',
        'file_path',
        'file_type',
        'file_size',
        'download_count',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
    ];

    /**
     * ความสัมพันธ์กับ Announcement
     */
    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }

    /**
     * เพิ่มจำนวนการดาวน์โหลด
     */
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
    }

    /**
     * Format file size เป็น human readable
     */
    public function getFormattedFileSizeAttribute()
    {
        $bytes = $this->file_size;
        
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }
}
