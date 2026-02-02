<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 🎯 Migration: Add Two-Tier Competition Support
 * 
 * ไฟล์: database/migrations/2026_01_16_000000_add_two_tier_competition_support.php
 * 
 * เพิ่มฟิลด์เพื่อรองรับระบบ 2 ระดับ:
 * - District Level (ระดับเขต) - Admin ใหญ่
 * - Group Level (ระดับกลุ่ม) - Admin กลุ่ม
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // ✅ Competition Level (district = เขต, group = กลุ่ม)
            $table->enum('competition_level', ['district', 'group'])
                  ->default('district')
                  ->after('school_group_id');
            
            // ✅ Parent Competition ID (สำหรับ group level)
            // ถ้าเป็น group level จะ link กับ district competition
            $table->unsignedBigInteger('parent_competition_id')
                  ->nullable()
                  ->after('competition_level');
            
            // ✅ Master Competition (เปิดให้ทุกกลุ่มหรือไม่)
            $table->boolean('is_master')->default(false)->after('parent_competition_id');
            
            // ✅ Group-specific dates (แยกจาก master)
            $table->date('group_registration_start')->nullable()->after('registration_end_date');
            $table->date('group_registration_end')->nullable()->after('group_registration_start');
            $table->date('group_competition_date')->nullable()->after('group_registration_end');
            
            // ✅ Advancement status (ส่งข้อมูลไปเขตแล้วหรือยัง)
            $table->boolean('submitted_to_district')->default(false)->after('is_active');
            $table->timestamp('submitted_at')->nullable()->after('submitted_to_district');
            
            // ✅ Total registrations (cache)
            $table->integer('total_registrations')->default(0)->after('submitted_at');
            
            // Indexes
            $table->index('competition_level');
            $table->index('parent_competition_id');
            $table->index('is_master');
            $table->index('submitted_to_district');
            
            // Foreign key
            $table->foreign('parent_competition_id')
                  ->references('id')
                  ->on('competitions')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['parent_competition_id']);
            
            // Drop indexes
            $table->dropIndex(['competition_level']);
            $table->dropIndex(['parent_competition_id']);
            $table->dropIndex(['is_master']);
            $table->dropIndex(['submitted_to_district']);
            
            // Drop columns
            $table->dropColumn([
                'competition_level',
                'parent_competition_id',
                'is_master',
                'group_registration_start',
                'group_registration_end',
                'group_competition_date',
                'submitted_to_district',
                'submitted_at',
                'total_registrations'
            ]);
        });
    }
};
