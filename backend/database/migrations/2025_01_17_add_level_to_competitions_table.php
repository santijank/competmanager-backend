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
        Schema::table('competitions', function (Blueprint $table) {
            // ✅ เพิ่มฟิลด์ level ถ้ายังไม่มี
            if (!Schema::hasColumn('competitions', 'level')) {
                $table->enum('level', ['group', 'district'])
                    ->default('group')
                    ->after('level_type')
                    ->comment('ระดับการแข่งขัน: group=กลุ่ม, district=เขต');
            }
        });
        
        // ✅ Update ข้อมูลเดิมให้มี level
        DB::table('competitions')
            ->whereNull('level')
            ->update(['level' => 'group']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            if (Schema::hasColumn('competitions', 'level')) {
                $table->dropColumn('level');
            }
        });
    }
};
