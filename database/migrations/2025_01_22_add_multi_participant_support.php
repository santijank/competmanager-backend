<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ✅ Migration: Multi-Participant Support
 * 
 * เพิ่มการรองรับนักเรียน/ครูหลายคนต่อทีม:
 * 1. competitions: เพิ่ม min_students, min_teachers
 * 2. registrations: เพิ่ม teacher_names (JSON), teacher_count
 * 
 * Created: 2025-01-22
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ✅ 1. เพิ่ม min_students, min_teachers ใน competitions
        Schema::table('competitions', function (Blueprint $table) {
            // ตรวจสอบก่อนว่ามี column หรือยัง
            if (!Schema::hasColumn('competitions', 'min_students')) {
                $table->unsignedInteger('min_students')->default(1)->after('description');
            }
            
            if (!Schema::hasColumn('competitions', 'min_teachers')) {
                $table->unsignedInteger('min_teachers')->default(1)->after('max_teachers');
            }
        });

        // ✅ 2. เพิ่ม teacher_names, teacher_count ใน registrations
        Schema::table('registrations', function (Blueprint $table) {
            // ตรวจสอบก่อนว่ามี column หรือยัง
            if (!Schema::hasColumn('registrations', 'teacher_names')) {
                $table->json('teacher_names')->nullable()->after('student_count');
            }
            
            if (!Schema::hasColumn('registrations', 'teacher_count')) {
                $table->unsignedInteger('teacher_count')->default(0)->after('teacher_names');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // ลบ columns ที่เพิ่มเข้าไป (เฉพาะที่ยังไม่มีค่า default ใน schema เดิม)
            if (Schema::hasColumn('competitions', 'min_students')) {
                $table->dropColumn('min_students');
            }
            if (Schema::hasColumn('competitions', 'min_teachers')) {
                $table->dropColumn('min_teachers');
            }
        });

        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'teacher_names')) {
                $table->dropColumn('teacher_names');
            }
            if (Schema::hasColumn('registrations', 'teacher_count')) {
                $table->dropColumn('teacher_count');
            }
        });
    }
};
