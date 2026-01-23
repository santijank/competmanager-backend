<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ✅ Migration: เพิ่มช่วงเวลาการรับสมัคร (Global) ใน school_groups
 * 
 * ระบบ Registration Lock:
 * - Group Admin กำหนดวันเปิด-ปิดรับสมัครครั้งเดียว
 * - ใช้กับการแข่งขันทุกรายการในกลุ่ม
 * - Frontend ตรวจสอบและซ่อน/แสดงปุ่มตามเวลา
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
        Schema::table('school_groups', function (Blueprint $table) {
            // ✅ วันเริ่ม-สิ้นสุดการรับสมัคร
            $table->dateTime('registration_start_date')->nullable()->after('is_active');
            $table->dateTime('registration_end_date')->nullable()->after('registration_start_date');
            
            // ✅ ข้อความประกาศ (ถ้ามี)
            $table->text('registration_announcement')->nullable()->after('registration_end_date');
            
            // ✅ สำหรับ audit trail
            $table->unsignedBigInteger('registration_configured_by')->nullable()->after('registration_announcement');
            $table->dateTime('registration_configured_at')->nullable()->after('registration_configured_by');
            
            // Foreign key (ถ้าต้องการ)
            $table->foreign('registration_configured_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_groups', function (Blueprint $table) {
            $table->dropForeign(['registration_configured_by']);
            $table->dropColumn([
                'registration_start_date',
                'registration_end_date',
                'registration_announcement',
                'registration_configured_by',
                'registration_configured_at',
            ]);
        });
    }
};
