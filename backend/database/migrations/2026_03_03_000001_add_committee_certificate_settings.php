<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // เพิ่ม committee number settings (ถ้ายังไม่มี)
        $exists = DB::table('certificate_number_settings')
            ->where('type', 'committee')
            ->exists();

        if (!$exists) {
            DB::table('certificate_number_settings')->insert([
                [
                    'level' => 'district',
                    'type' => 'committee',
                    'prefix' => 'สพป.นฐ.๑-กส.',
                    'year' => '๒๕๖๙',
                    'last_number' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'level' => 'group',
                    'type' => 'committee',
                    'prefix' => 'สพป.นฐ.๑-กส.',
                    'year' => '๒๕๖๙',
                    'last_number' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('certificate_number_settings')
            ->where('type', 'committee')
            ->delete();
    }
};
