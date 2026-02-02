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
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'link_url')) {
                $table->string('link_url', 500)->nullable()->after('content');
            }
            if (!Schema::hasColumn('announcements', 'link_title')) {
                $table->string('link_title', 255)->nullable()->after('link_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'link_url')) {
                $table->dropColumn('link_url');
            }
            if (Schema::hasColumn('announcements', 'link_title')) {
                $table->dropColumn('link_title');
            }
        });
    }
};
