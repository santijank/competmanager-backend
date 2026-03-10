<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * ดึงค่า setting ตาม key
     */
    public static function getValue(string $key, $default = null): ?string
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * ตั้งค่า setting
     */
    public static function setValue(string $key, ?string $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * ตรวจสอบ permission switch (admin/district_admin exempt เสมอ)
     * ค่าเริ่มต้น = เปิด ('1')
     */
    public static function isPermissionAllowed(string $key, $user = null): bool
    {
        if ($user && in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }
        return static::getValue($key, '1') === '1';
    }

    /**
     * ตรวจสอบว่าอยู่ในช่วงเวลาเปิดแก้ไขรายชื่อหรือไม่
     */
    public static function isEditNameAllowed(): bool
    {
        $start = static::getValue('edit_name_start_date');
        $end = static::getValue('edit_name_end_date');

        if (!$start || !$end) {
            return false; // ถ้ายังไม่ตั้งค่า = ไม่อนุญาต
        }

        $now = now();
        return $now->between($start, $end);
    }
}
