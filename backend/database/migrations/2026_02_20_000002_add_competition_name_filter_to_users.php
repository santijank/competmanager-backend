<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'competition_name_filter')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('competition_name_filter')->nullable()->after('category_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('competition_name_filter');
        });
    }
};
