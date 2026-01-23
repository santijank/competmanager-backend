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
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('competition_id')
                ->constrained('competitions')
                ->onDelete('cascade');
            
            $table->foreignId('school_id')
                ->constrained('schools')
                ->onDelete('cascade');
            
            $table->foreignId('teacher_id')
                ->constrained('users')
                ->onDelete('cascade');
            
            // Team Information
            $table->string('team_name');
            $table->json('student_names'); // [{name: 'ชื่อ-สกุล', student_id: 'รหัส'}]
            $table->integer('student_count')->default(0);
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
                ->default('pending');
            
            $table->dateTime('registration_date');
            
            // Approval
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Additional
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('competition_id');
            $table->index('school_id');
            $table->index('teacher_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
