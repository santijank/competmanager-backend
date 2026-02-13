<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->boolean('skip_group_level')->default(false)->after('excluded_school_groups')
                ->comment('ถ้า true = โรงเรียนสมัครตรงระดับเขตได้เลย ไม่ต้องแข่งระดับกลุ่ม');
        });
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn('skip_group_level');
        });
    }
};
