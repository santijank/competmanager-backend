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
        Schema::create('committee_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');                           // ชื่อ-นามสกุล
            $table->string('position')->nullable();           // ตำแหน่ง (เช่น ประธาน, กรรมการ)
            $table->string('organization')->nullable();       // สังกัด (เช่น สพป.นฐ.เขต 1)
            $table->enum('member_type', ['committee', 'staff', 'volunteer'])->default('committee'); // ประเภท
            $table->text('note')->nullable();                 // หมายเหตุ
            
            // สำหรับ group_admin - จำกัดเฉพาะกลุ่ม
            $table->foreignId('school_group_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->boolean('is_active')->default(true);      // สถานะ
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes
            $table->index('school_group_id');
            $table->index('is_active');
            $table->index('member_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('committee_members');
    }
};
