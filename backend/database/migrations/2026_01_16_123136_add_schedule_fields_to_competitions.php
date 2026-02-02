<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // เพิ่มเฉพาะ columns ที่ยังไม่มี
            
            // ตรวจสอบก่อนเพิ่ม
            if (!Schema::hasColumn('competitions', 'registration_start_date')) {
                $table->date('registration_start_date')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'registration_end_date')) {
                $table->date('registration_end_date')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'competition_date')) {
                $table->date('competition_date')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'competition_start_time')) {
                $table->time('competition_start_time')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'competition_end_time')) {
                $table->time('competition_end_time')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'venue')) {
                $table->text('venue')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'auto_close_registration')) {
                $table->boolean('auto_close_registration')->default(true);
            }
            if (!Schema::hasColumn('competitions', 'participants_count')) {
                $table->integer('participants_count')->default(0);
            }
            if (!Schema::hasColumn('competitions', 'level')) {
                $table->enum('level', ['group', 'district'])->default('group');
            }
            if (!Schema::hasColumn('competitions', 'parent_competition_id')) {
                $table->unsignedBigInteger('parent_competition_id')->nullable();
            }
            if (!Schema::hasColumn('competitions', 'advancement_count')) {
                $table->integer('advancement_count')->default(2);
            }
        });
    }

    public function down(): void
    {
        // ไม่ต้อง drop เพราะ migration ตัวแรกจะดูแล
    }
};