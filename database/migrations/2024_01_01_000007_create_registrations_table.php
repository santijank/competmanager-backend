<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('registrations');
        
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('team_name');
            $table->json('student_names');
            $table->integer('student_count')->default(0);
            $table->json('teacher_names')->nullable();
            $table->unsignedInteger('teacher_count')->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->date('registration_date')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['competition_id', 'school_id']);
            $table->index('status');
            
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};