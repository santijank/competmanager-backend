<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Seed committee + staff rows สำหรับแต่ละกลุ่ม
        $thaiDigits = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
        $buddhistYear = (int)date('Y') + 543;
        $thaiYear = preg_replace_callback('/\d/', function ($m) use ($thaiDigits) {
            return $thaiDigits[(int)$m[0]];
        }, (string)$buddhistYear);

        $groups = DB::table('school_groups')->get();
        $types = [
            'committee' => 'สพป.นฐ.๑-กก.',
            'staff'     => 'สพป.นฐ.๑-จก.',
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

        // เพิ่ม district-level committee + staff ด้วย (ถ้ายังไม่มี)
        foreach ($types as $type => $prefix) {
            $exists = DB::table('certificate_number_settings')
                ->where('level', 'district')
                ->where('type', $type)
                ->whereNull('school_group_id')
                ->exists();

            if (!$exists) {
                DB::table('certificate_number_settings')->insert([
                    'level' => 'district',
                    'type' => $type,
                    'school_group_id' => null,
                    'prefix' => $prefix,
                    'year' => $thaiYear,
                    'last_number' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('certificate_number_settings')
            ->whereIn('type', ['committee', 'staff'])
            ->delete();
    }
};
