<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ลบ foreign key เดิม
        Schema::table('certificates', function ($table) {
            $table->dropForeign(['competition_id']);
        });

        // เปลี่ยน competition_id เป็น nullable
        DB::statement('ALTER TABLE certificates MODIFY competition_id BIGINT UNSIGNED NULL');

        // สร้าง foreign key ใหม่
        Schema::table('certificates', function ($table) {
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function ($table) {
            $table->dropForeign(['competition_id']);
        });

        DB::statement('ALTER TABLE certificates MODIFY competition_id BIGINT UNSIGNED NOT NULL');

        Schema::table('certificates', function ($table) {
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
        });
    }
};
