<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('registration_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->onDelete('cascade');
            $table->string('student_name', 255);
            $table->string('student_id', 50)->nullable(); // รหัสนักเรียน
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->string('grade_level', 20); // ระดับชั้น เช่น ป.1, ม.3
            $table->date('birth_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->enum('role', ['participant', 'reserve'])->default('participant'); // ตัวจริง/สำรอง
            $table->integer('display_order')->default(0); // ลำดับการแสดง
            $table->timestamps();
            
            // Indexes
            $table->index('registration_id');
            $table->index('student_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_participants');
    }
};
