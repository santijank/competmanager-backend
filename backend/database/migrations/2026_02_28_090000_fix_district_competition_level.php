<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // อัพเดทกิจกรรมที่มี _D_ ในรหัสให้เป็น competition_level = 'district'
        $updated = DB::table('competitions')
            ->where('code', 'LIKE', '%\_D\_%')
            ->where('competition_level', '!=', 'district')
            ->update(['competition_level' => 'district']);

        if ($updated > 0) {
            \Log::info("Fixed {$updated} competitions: set competition_level to 'district' for codes containing '_D_'");
        }
    }

    public function down(): void
    {
        // ไม่ rollback เพราะไม่รู้ค่าเดิม
    }
};
