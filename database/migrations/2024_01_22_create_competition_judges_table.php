<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * สร้างตาราง competition_judges สำหรับเก็บข้อมูลกรรมการตัดสิน
     */
    public function up(): void
    {
        Schema::create('competition_judges', function (Blueprint $table) {
            $table->id();
            
            // การแข่งขันที่ตัดสิน
            $table->foreignId('competition_id')
                ->constrained('competitions')
                ->onDelete('cascade')
                ->comment('การแข่งขันที่ตัดสิน');
            
            // ชื่อกรรมการ
            $table->string('name')
                ->comment('ชื่อ-นามสกุลกรรมการ');
            
            // โรงเรียน/หน่วยงาน (พิมพ์เอง)
            $table->string('school_name')->nullable()
                ->comment('โรงเรียน/หน่วยงานที่สังกัด');
            
            // ผู้สร้าง (Group Admin)
            $table->foreignId('created_by')->nullable()
                ->constrained('users')
                ->onDelete('set null')
                ->comment('Group Admin ที่เพิ่ม');
            
            $table->timestamps();
            
            // Indexes
            $table->index('competition_id');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_judges');
    }
};
