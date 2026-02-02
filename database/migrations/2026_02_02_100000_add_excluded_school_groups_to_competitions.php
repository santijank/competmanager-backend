<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * เพิ่ม field สำหรับกำหนดกลุ่มโรงเรียนที่ไม่อนุญาตให้ลงทะเบียน
 * ใช้สำหรับกรณี เช่น กลุ่มโรงเรียนเอกชนไม่สามารถลงทะเบียนบางกิจกรรมได้
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // เก็บ array ของ school_group_id ที่ไม่อนุญาตให้ลงทะเบียน
            // ตัวอย่าง: [5, 8] หมายถึง กลุ่ม 5 และ 8 ไม่สามารถลงทะเบียนได้
            $table->json('excluded_school_groups')->nullable()->after('school_group_id');

            // หมายเหตุอธิบายเหตุผลที่ยกเว้น (optional)
            $table->string('exclusion_reason')->nullable()->after('excluded_school_groups');
        });
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn(['excluded_school_groups', 'exclusion_reason']);
        });
    }
};
