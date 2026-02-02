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
        // 1. เปลี่ยน role จาก 'teacher' เป็น 'school_admin'
        DB::table('users')
            ->where('role', 'teacher')
            ->update(['role' => 'school_admin']);
        
        // 2. แก้ไข enum ใน users table
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('district_admin', 'group_admin', 'school_admin', 'committee') NOT NULL DEFAULT 'school_admin'");
        
        echo "✓ Changed 'teacher' role to 'school_admin'\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // เปลี่ยนกลับเป็น teacher
        DB::table('users')
            ->where('role', 'school_admin')
            ->update(['role' => 'teacher']);
        
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('district_admin', 'group_admin', 'teacher', 'committee') NOT NULL DEFAULT 'teacher'");
    }
};
