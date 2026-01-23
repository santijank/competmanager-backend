<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * เพิ่ม column registration_open ให้ตาราง competitions
     */
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // เพิ่ม column registration_open (true/false)
            $table->boolean('registration_open')->default(false)->after('competition_level');
            
            // เพิ่ม column วันที่เปิด-ปิดลงทะเบียน (ถ้ายังไม่มี)
            if (!Schema::hasColumn('competitions', 'registration_start_date')) {
                $table->date('registration_start_date')->nullable()->after('registration_open');
            }
            if (!Schema::hasColumn('competitions', 'registration_end_date')) {
                $table->date('registration_end_date')->nullable()->after('registration_start_date');
            }
        });
    }

    /**
     * Rollback
     */
    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn(['registration_open', 'registration_start_date', 'registration_end_date']);
        });
    }
};
