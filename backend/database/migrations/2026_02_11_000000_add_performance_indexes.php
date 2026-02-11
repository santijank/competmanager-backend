<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // competitions: เพิ่ม index สำหรับ school_group_id (ใช้ filter ใน dashboard, registrations)
        Schema::table('competitions', function (Blueprint $table) {
            if (!$this->hasIndex('competitions', 'competitions_school_group_id_index')) {
                $table->index('school_group_id');
            }
            if (!$this->hasIndex('competitions', 'competitions_competition_level_index')) {
                $table->index('competition_level');
            }
        });

        // registrations: เพิ่ม index เดี่ยวสำหรับ school_id
        Schema::table('registrations', function (Blueprint $table) {
            if (!$this->hasIndex('registrations', 'registrations_school_id_index')) {
                $table->index('school_id');
            }
        });

        // scores: เพิ่ม composite index สำหรับ is_finalized + medal (ใช้ใน medal counting)
        Schema::table('scores', function (Blueprint $table) {
            if (!$this->hasIndex('scores', 'scores_is_finalized_medal_index')) {
                $table->index(['is_finalized', 'medal']);
            }
        });

        // users: เพิ่ม composite index สำหรับ online users query
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'users_is_active_last_activity_at_index')) {
                $table->index(['is_active', 'last_activity_at']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->dropIndex(['school_group_id']);
            $table->dropIndex(['competition_level']);
        });
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
        });
        Schema::table('scores', function (Blueprint $table) {
            $table->dropIndex(['is_finalized', 'medal']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'last_activity_at']);
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = collect(
            \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName])
        );
        return $indexes->isNotEmpty();
    }
};
