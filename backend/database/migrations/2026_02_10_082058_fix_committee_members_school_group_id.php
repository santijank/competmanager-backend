<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * อัพเดต school_group_id ของ committee_members ที่เป็น NULL
     * ดึงจาก competition ที่ผูกอยู่
     */
    public function up(): void
    {
        // อัพเดต committee_members ที่ school_group_id เป็น NULL แต่มี competition_id
        DB::statement("
            UPDATE committee_members cm
            JOIN competitions c ON cm.competition_id = c.id
            SET cm.school_group_id = c.school_group_id
            WHERE cm.school_group_id IS NULL
            AND cm.competition_id IS NOT NULL
            AND c.school_group_id IS NOT NULL
        ");
    }

    public function down(): void
    {
        // ไม่ต้อง rollback
    }
};
