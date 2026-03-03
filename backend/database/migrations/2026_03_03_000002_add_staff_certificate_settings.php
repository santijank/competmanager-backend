<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // เพิ่ม staff number settings (คณะกรรมการดำเนินการ)
        $exists = DB::table('certificate_number_settings')
            ->where('type', 'staff')
            ->exists();

        if (!$exists) {
            DB::table('certificate_number_settings')->insert([
                [
                    'level' => 'district',
                    'type' => 'staff',
                    'prefix' => 'สพป.นฐ.๑-คท.',
                    'year' => '๒๕๖๙',
                    'last_number' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'level' => 'group',
                    'type' => 'staff',
                    'prefix' => 'สพป.นฐ.๑-คท.',
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
            ->where('type', 'staff')
            ->delete();
    }
};
