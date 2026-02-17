<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 0. ตรวจสอบและแก้ไข role ที่อาจไม่ตรงกับ ENUM ใหม่
        // แปลง role ที่ไม่รู้จักให้เป็น school_admin เพื่อป้องกัน Data truncated
        $validRoles = ['admin','district_admin','group_admin','school_admin','committee','teacher','category_admin','data_entry'];
        $validRolesStr = implode("','", $validRoles);
        DB::statement("UPDATE users SET role = 'school_admin' WHERE role NOT IN ('{$validRolesStr}')");

        // 1. ปิด strict mode ชั่วคราวเพื่อป้องกัน warning -> error
        DB::statement("SET SESSION sql_mode = ''");

        // 2. Expand role enum to include category_admin and data_entry
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','district_admin','group_admin','school_admin','committee','teacher','category_admin','data_entry') NOT NULL DEFAULT 'teacher'");

        // 3. คืน strict mode
        DB::statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");

        // 4. Add category_id column (เช็คก่อนว่ายังไม่มี)
        if (!Schema::hasColumn('users', 'category_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('category_id')->nullable()->after('school_group_id');
                $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
                $table->index('category_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);
            $table->dropColumn('category_id');
        });

        // Revert role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','district_admin','group_admin','school_admin','committee','teacher') NOT NULL DEFAULT 'teacher'");
    }
};
