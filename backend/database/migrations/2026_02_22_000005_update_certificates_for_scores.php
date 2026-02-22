<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            // เพิ่ม score_id สำหรับ link กับ scores table
            $table->unsignedBigInteger('score_id')->nullable()->after('result_id');
            $table->foreign('score_id')->references('id')->on('scores')->onDelete('cascade');

            // เพิ่ม fields สำหรับข้อมูลเพิ่มเติม
            $table->json('teacher_names')->nullable()->after('school_name');
            $table->string('category_name')->nullable()->after('competition_name');
            $table->decimal('score', 5, 2)->nullable()->after('medal');

            // ทำ result_id เป็น nullable (เพราะจะใช้ score_id แทน)
            $table->unsignedBigInteger('result_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['score_id']);
            $table->dropColumn(['score_id', 'teacher_names', 'category_name', 'score']);
        });
    }
};
