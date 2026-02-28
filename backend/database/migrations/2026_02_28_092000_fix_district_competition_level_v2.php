<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // แก้ไข migration ก่อนหน้า — กิจกรรมที่มี _G + ตัวเลข ท้ายรหัสเป็นระดับกลุ่ม ไม่ใช่เขต
        // เช่น STUDENT_D_ป1_3_1_G1 = ระดับกลุ่ม, DANCE_D_ทุกระดับ_9 = ระดับเขต

        // Step 1: Revert กิจกรรมที่มี _G + ตัวเลข ท้ายรหัส กลับเป็น 'group'
        $reverted = DB::table('competitions')
            ->where('code', 'LIKE', '%\_D\_%')
            ->where('code', 'REGEXP', '_G[0-9]+$')
            ->where('competition_level', 'district')
            ->update(['competition_level' => 'group']);

        if ($reverted > 0) {
            \Log::info("Reverted {$reverted} competitions back to 'group' (codes ending with _G + number)");
        }

        // Step 2: Log สรุปจำนวน
        $districtCount = DB::table('competitions')->where('competition_level', 'district')->count();
        $groupCount = DB::table('competitions')->where('competition_level', 'group')->count();
        \Log::info("Competition levels summary: district={$districtCount}, group={$groupCount}");
    }

    public function down(): void
    {
        // ไม่ rollback
    }
};
