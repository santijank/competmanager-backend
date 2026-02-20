<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('registration_photos') && Schema::hasColumn('registration_photos', 'photo_path')) {
            Schema::table('registration_photos', function (Blueprint $table) {
                $table->string('photo_path')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // ไม่ต้อง revert เพราะ nullable เป็นสิ่งที่ถูกต้อง
    }
};
