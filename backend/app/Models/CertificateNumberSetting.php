<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CertificateNumberSetting extends Model
{
    protected $fillable = [
        'level', 'type', 'school_group_id', 'prefix', 'year', 'last_number',
    ];

    protected $casts = [
        'last_number' => 'integer',
    ];

    /**
     * ดึง setting ตาม level + type + school_group_id
     */
    public static function getSetting(string $level, string $type, ?int $schoolGroupId = null): ?self
    {
        $query = static::where('level', $level)->where('type', $type);

        if ($schoolGroupId) {
            $query->where('school_group_id', $schoolGroupId);
        } else {
            $query->whereNull('school_group_id');
        }

        return $query->first();
    }

    /**
     * สร้างเลขที่เอกสารถัดไป พร้อม lock เพื่อป้องกัน race condition
     * เช่น สพป.นฐ.๑-นร.๐๐๐๑/๒๕๖๙
     */
    public static function getNextNumber(string $level, string $type, ?int $schoolGroupId = null): string
    {
        return DB::transaction(function () use ($level, $type, $schoolGroupId) {
            $query = static::where('level', $level)->where('type', $type);

            if ($schoolGroupId) {
                $query->where('school_group_id', $schoolGroupId);
            } else {
                $query->whereNull('school_group_id');
            }

            $setting = $query->lockForUpdate()->first();

            if (!$setting) {
                // สร้าง default ถ้ายังไม่มี
                $setting = static::create([
                    'level' => $level,
                    'type' => $type,
                    'school_group_id' => $schoolGroupId,
                    'prefix' => match($type) {
                        'teacher' => 'สพป.นฐ.๑-คร.',
                        'staff' => 'สพป.นฐ.๑-กก.',
                        'committee' => 'สพป.นฐ.๑-ตส.',
                        default => 'สพป.นฐ.๑-นร.',
                    },
                    'year' => self::toBuddhistYear(),
                    'last_number' => 0,
                ]);
            }

            $setting->last_number += 1;
            $setting->save();

            // แปลงเลขเป็นเลขไทย 4 หลัก
            $thaiNumber = self::toThaiDigits(str_pad($setting->last_number, 4, '0', STR_PAD_LEFT));

            return "{$setting->prefix}{$thaiNumber}/{$setting->year}";
        });
    }

    /**
     * แปลงเลข Arabic เป็นเลขไทย
     */
    public static function toThaiDigits(string $number): string
    {
        $thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str_replace(
            ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            $thaiDigits,
            $number
        );
    }

    /**
     * ปี พ.ศ. ปัจจุบัน เป็นเลขไทย
     */
    public static function toBuddhistYear(): string
    {
        $buddhistYear = (int)date('Y') + 543;
        return self::toThaiDigits((string)$buddhistYear);
    }
}
