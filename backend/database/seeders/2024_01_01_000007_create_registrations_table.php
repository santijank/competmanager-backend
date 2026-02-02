<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('registration_code')->unique();
            
            // Relations
            $table->unsignedBigInteger('competition_id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('school_group_id');
            $table->unsignedBigInteger('created_by'); // Teacher who registered
            
            // Participants Data (JSON)
            $table->json('students'); // [{name: "ชื่อ", grade: "ป.1"}, ...]
            $table->json('teachers')->nullable(); // [{name: "ชื่อ", phone: "0812345678"}, ...]
            $table->string('contact_phone')->nullable();
            
            // Registration Type
            $table->enum('registration_type', ['manual', 'auto_advanced'])->default('manual');
            // manual = ครูลงทะเบียนเอง
            // auto_advanced = ระบบสร้างอัตโนมัติจากการส่งต่อระดับเขต
            
            // Source (if auto_advanced)
            $table->enum('source_level', ['group', 'district'])->nullable();
            $table->unsignedBigInteger('source_result_id')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Approval
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            
            // Notes
            $table->text('admin_notes')->nullable(); // หมายเหตุจาก Admin
            $table->text('notes')->nullable();  // หมายเหตุจากครู
            $table->text('remarks')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('registration_code');
            $table->index('competition_id');
            $table->index('school_id');
            $table->index('school_group_id');
            $table->index('status');
            $table->index('registration_type');
            $table->index('created_by');
            
            // Foreign Keys
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('school_group_id')->references('id')->on('school_groups')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');
            // Note: source_result_id จะเพิ่มทีหลังผ่าน migration แยก
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
