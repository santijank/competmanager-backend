<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // เพิ่ม field ในตาราง certificates
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('document_number')->nullable()->after('certificate_code');
            $table->string('recipient_type', 20)->default('student')->after('document_number'); // student | teacher
            $table->string('recipient_name')->nullable()->after('recipient_type'); // ชื่อคนที่ได้รับ (1 คน)
        });

        // ตาราง certificate_number_settings — เก็บ prefix, ปี, เลขรันล่าสุด
        Schema::create('certificate_number_settings', function (Blueprint $table) {
            $table->id();
            $table->string('level', 20); // district | group
            $table->string('type', 20);  // student | teacher
            $table->string('prefix')->default('สพป.นฐ.๑-นร.'); // เช่น สพป.นฐ.๑-นร.
            $table->string('year', 10)->default('๒๕๖๙'); // ปี พ.ศ. เป็นเลขไทย
            $table->unsignedInteger('last_number')->default(0); // เลขรันล่าสุด
            $table->timestamps();

            $table->unique(['level', 'type']);
        });

        // Seed default settings
        \DB::table('certificate_number_settings')->insert([
            ['level' => 'district', 'type' => 'student', 'prefix' => 'สพป.นฐ.๑-นร.', 'year' => '๒๕๖๙', 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['level' => 'district', 'type' => 'teacher', 'prefix' => 'สพป.นฐ.๑-คร.', 'year' => '๒๕๖๙', 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['level' => 'group', 'type' => 'student', 'prefix' => 'สพป.นฐ.๑-นร.', 'year' => '๒๕๖๙', 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['level' => 'group', 'type' => 'teacher', 'prefix' => 'สพป.นฐ.๑-คร.', 'year' => '๒๕๖๙', 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['document_number', 'recipient_type', 'recipient_name']);
        });
        Schema::dropIfExists('certificate_number_settings');
    }
};
