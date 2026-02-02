<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('registration_participants');
        
        Schema::create('registration_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->onDelete('cascade');
            $table->string('student_name');
            $table->string('student_id', 50)->nullable();
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->string('grade_level', 20);
            $table->date('birth_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->enum('role', ['participant', 'reserve'])->default('participant');
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            $table->index('registration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_participants');
    }
};