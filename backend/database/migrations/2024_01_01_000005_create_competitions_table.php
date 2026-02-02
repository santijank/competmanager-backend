<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            
            // Basic Info
            $table->unsignedBigInteger('category_id');
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            
            // Type & Level
            $table->enum('competition_type', ['regular', 'special', 'special_needs'])->default('regular');
            $table->string('level'); // ป.1-3, ป.4-6, ม.1-3, etc.
            
            // Participants Requirements
            $table->integer('max_students')->default(1); // จำนวนนักเรียนสูงสุด
            $table->integer('max_teachers')->default(1); // จำนวนครู
            $table->integer('max_judges')->default(3);   // จำนวนกรรมการ
            
            // Competition Dates
            $table->date('start_date'); // วันเริ่มต้นการแข่งขัน
            $table->date('end_date');   // วันสิ้นสุดการแข่งขัน
            $table->date('competition_date')->nullable(); // วันแข่งขันจริง
            $table->time('competition_start_time')->nullable();
            $table->time('competition_end_time')->nullable();
            
            // Registration Period
            $table->date('registration_start_date')->nullable(); // วันเปิดรับสมัคร
            $table->date('registration_end_date')->nullable();   // วันปิดรับสมัคร
            $table->enum('registration_status', ['upcoming', 'open', 'closed'])->default('upcoming');
            
            // District Level Settings
            $table->boolean('allow_direct_registration')->default(false); // เปิดให้ลงทะเบียนระดับเขตโดยตรง
            
            // Scoring & Rules
            $table->string('criterion')->nullable(); // เกณฑ์การให้คะแนน (P = ระดับชั้น)
            $table->text('rules')->nullable();
            
            // Venue
            $table->string('venue')->nullable();
            
            // Advancement
            $table->integer('advancement_slots')->nullable(); // จำนวนที่เลื่อนไปแข่งระดับเขต
            
            // Group Restriction (null = all groups)
            $table->foreignId('school_group_id')->nullable()->constrained('school_groups')->onDelete('set null');
            
            // Status
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Indexes
            $table->index('code');
            $table->index('category_id');
            $table->index('level');
            $table->index('status');
            $table->index('registration_status');
            $table->index(['registration_start_date', 'registration_end_date']);
            
            // Foreign Keys (ต้องอยู่ท้ายสุด)
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
