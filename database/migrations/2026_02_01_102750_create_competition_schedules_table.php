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
        Schema::create('competition_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_group_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('level', ['group', 'district'])->default('group'); // ระดับกลุ่ม หรือ ระดับเขต

            // ข้อมูลสถานที่และเวลา
            $table->string('venue')->nullable(); // สถานที่แข่งขัน
            $table->string('room')->nullable(); // ห้อง/อาคาร
            $table->date('competition_date')->nullable(); // วันที่แข่งขัน
            $table->time('start_time')->nullable(); // เวลาเริ่ม
            $table->time('end_time')->nullable(); // เวลาจบ
            $table->text('notes')->nullable(); // หมายเหตุเพิ่มเติม

            // สถานะการเผยแพร่
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();

            // ผู้สร้าง/แก้ไข
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();

            // Index
            $table->index(['competition_id', 'level']);
            $table->index(['school_group_id', 'level']);
            $table->index('is_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_schedules');
    }
};
