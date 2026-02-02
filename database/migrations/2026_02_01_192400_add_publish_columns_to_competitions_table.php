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
        // Fix invalid dates first (MySQL strict mode issue)
        // Use current date instead of NULL since start_date column doesn't allow NULL
        DB::statement("UPDATE competitions SET start_date = CURDATE() WHERE start_date = '0000-00-00' OR start_date = '0000-00-00 00:00:00'");
        DB::statement("UPDATE competitions SET end_date = CURDATE() WHERE end_date = '0000-00-00' OR end_date = '0000-00-00 00:00:00'");

        Schema::table('competitions', function (Blueprint $table) {
            if (!Schema::hasColumn('competitions', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('competitions', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('is_published');
            }
            if (!Schema::hasColumn('competitions', 'published_by')) {
                // Use unsignedBigInteger instead of foreignId to avoid constraint issues
                $table->unsignedBigInteger('published_by')->nullable()->after('published_at');
            }
        });

        // Add foreign key separately after column is created
        Schema::table('competitions', function (Blueprint $table) {
            if (Schema::hasColumn('competitions', 'published_by')) {
                $table->foreign('published_by')
                      ->references('id')
                      ->on('users')
                      ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // Drop foreign key first
            if (Schema::hasColumn('competitions', 'published_by')) {
                $table->dropForeign(['published_by']);
            }
        });

        Schema::table('competitions', function (Blueprint $table) {
            if (Schema::hasColumn('competitions', 'is_published')) {
                $table->dropColumn('is_published');
            }
            if (Schema::hasColumn('competitions', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('competitions', 'published_by')) {
                $table->dropColumn('published_by');
            }
        });
    }
};
