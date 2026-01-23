<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ขั้นที่ 1: ขยาย ENUM ให้รองรับทุก role (เก่าและใหม่)
        DB::statement("
            ALTER TABLE users 
            MODIFY COLUMN role ENUM(
                'district_admin', 
                'group_admin', 
                'school_admin', 
                'teacher', 
                'judge', 
                'student', 
                'committee'
            ) NOT NULL
        ");
        
        // ขั้นที่ 2: ย้ายข้อมูล
        
        // เปลี่ยน 'teacher' เป็น 'school_admin'
        DB::table('users')
            ->where('role', 'teacher')
            ->update(['role' => 'school_admin']);
        
        // เปลี่ยน 'committee' เป็น 'judge'
        DB::table('users')
            ->where('role', 'committee')
            ->update(['role' => 'judge']);
        
        // ขั้นที่ 3: ลด ENUM เหลือแค่ role ที่ใช้งาน
        DB::statement("
            ALTER TABLE users 
            MODIFY COLUMN role ENUM(
                'district_admin', 
                'group_admin', 
                'school_admin', 
                'judge', 
                'student'
            ) NOT NULL 
            DEFAULT 'school_admin'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback กลับไปเป็น ENUM เดิม
        DB::statement("
            ALTER TABLE users 
            MODIFY COLUMN role ENUM(
                'district_admin', 
                'group_admin', 
                'teacher', 
                'judge', 
                'student', 
                'committee'
            ) NOT NULL
        ");
        
        // เปลี่ยนข้อมูลกลับ
        DB::table('users')
            ->where('role', 'judge')
            ->limit(2)
            ->update(['role' => 'committee']);
            
        DB::table('users')
            ->where('role', 'school_admin')
            ->update(['role' => 'teacher']);
    }
};
