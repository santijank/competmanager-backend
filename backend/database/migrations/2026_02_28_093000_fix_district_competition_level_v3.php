<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: ตั้งค่า district สำหรับกิจกรรมที่มี _D_ ในรหัส (ใช้ LOCATE แทน LIKE)
        $setDistrict = DB::update(
            "UPDATE competitions SET competition_level = 'district' WHERE LOCATE('_D_', code) > 0 AND competition_level != 'district'"
        );
        \Log::info("v3 Step1: Set {$setDistrict} competitions to district (LOCATE '_D_' in code)");

        // Step 2: Revert กลับเป็น group สำหรับรหัสที่ลงท้ายด้วย _G + ตัวเลข (เป็นระดับกลุ่ม)
        $revertGroup = DB::update(
            "UPDATE competitions SET competition_level = 'group' WHERE LOCATE('_D_', code) > 0 AND code REGEXP '_G[0-9]+$' AND competition_level = 'district'"
        );
        \Log::info("v3 Step2: Reverted {$revertGroup} competitions back to group (codes ending _G+number)");

        // Step 3: Log สรุป
        $districtCount = DB::table('competitions')->where('competition_level', 'district')->count();
        $groupCount = DB::table('competitions')->where('competition_level', 'group')->count();
        \Log::info("v3 Summary: district={$districtCount}, group={$groupCount}");
    }

    public function down(): void
    {
        // ไม่ rollback
    }
};
