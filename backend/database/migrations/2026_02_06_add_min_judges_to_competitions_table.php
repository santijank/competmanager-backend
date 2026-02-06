<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('competitions', 'min_judges')) {
            Schema::table('competitions', function (Blueprint $table) {
                $table->integer('min_judges')->default(1)->after('max_judges');
            });
        }
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn('min_judges');
        });
    }
};
