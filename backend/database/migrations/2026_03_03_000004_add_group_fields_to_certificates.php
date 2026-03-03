<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // เพิ่ม group_name (ชื่อกลุ่มโรงเรียน) และ competition_date_text (วันแข่งขัน)
        DB::statement('ALTER TABLE certificates ADD COLUMN group_name VARCHAR(255) NULL AFTER level');
        DB::statement('ALTER TABLE certificates ADD COLUMN competition_date_text VARCHAR(255) NULL AFTER group_name');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE certificates DROP COLUMN IF EXISTS competition_date_text');
        DB::statement('ALTER TABLE certificates DROP COLUMN IF EXISTS group_name');
    }
};
