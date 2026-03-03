<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) เพิ่ม school_group_id ใน certificate_number_settings
        DB::statement('ALTER TABLE certificate_number_settings ADD COLUMN school_group_id BIGINT UNSIGNED NULL');

        // 2) ลบ unique constraint เก่า (level, type)
        try {
            DB::statement('ALTER TABLE certificate_number_settings DROP INDEX certificate_number_settings_level_type_unique');
        } catch (\Exception $e) {
            // อาจใช้ชื่ออื่น
            try {
                DB::statement('DROP INDEX certificate_number_settings_level_type_unique ON certificate_number_settings');
            } catch (\Exception $e2) {
                // ข้ามถ้าไม่มี index นี้
            }
        }

        // 3) เพิ่ม unique constraint ใหม่ รวม school_group_id
        DB::statement('CREATE UNIQUE INDEX cert_num_level_type_group ON certificate_number_settings (level, type, school_group_id)');

        // 4) เพิ่ม competition_date_text ใน school_groups
        DB::statement('ALTER TABLE school_groups ADD COLUMN competition_date_text VARCHAR(255) NULL');

        // 5) Seed per-group rows (student + teacher สำหรับแต่ละกลุ่ม)
        $thaiDigits = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
        $buddhistYear = (int)date('Y') + 543;
        $thaiYear = preg_replace_callback('/\d/', function ($m) use ($thaiDigits) {
            return $thaiDigits[(int)$m[0]];
        }, (string)$buddhistYear);

        $groups = DB::table('school_groups')->get();
        $types = [
            'student' => 'สพป.นฐ.๑-นร.',
            'teacher' => 'สพป.นฐ.๑-คร.',
        ];

        foreach ($groups as $group) {
            foreach ($types as $type => $prefix) {
                $exists = DB::table('certificate_number_settings')
                    ->where('level', 'group')
                    ->where('type', $type)
                    ->where('school_group_id', $group->id)
                    ->exists();

                if (!$exists) {
                    DB::table('certificate_number_settings')->insert([
                        'level' => 'group',
                        'type' => $type,
                        'school_group_id' => $group->id,
                        'prefix' => $prefix,
                        'year' => $thaiYear,
                        'last_number' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE school_groups DROP COLUMN IF EXISTS competition_date_text');

        // ลบ per-group rows
        DB::table('certificate_number_settings')->whereNotNull('school_group_id')->delete();

        try {
            DB::statement('DROP INDEX cert_num_level_type_group ON certificate_number_settings');
        } catch (\Exception $e) {}

        DB::statement('ALTER TABLE certificate_number_settings DROP COLUMN IF EXISTS school_group_id');
    }
};
