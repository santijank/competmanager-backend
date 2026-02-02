<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_groups', function (Blueprint $table) {
            if (!Schema::hasColumn('school_groups', 'registration_start_date')) {
                $table->datetime('registration_start_date')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('school_groups', 'registration_end_date')) {
                $table->datetime('registration_end_date')->nullable()->after('registration_start_date');
            }
            if (!Schema::hasColumn('school_groups', 'registration_announcement')) {
                $table->text('registration_announcement')->nullable()->after('registration_end_date');
            }
            if (!Schema::hasColumn('school_groups', 'registration_configured_by')) {
                $table->unsignedBigInteger('registration_configured_by')->nullable()->after('registration_announcement');
            }
            if (!Schema::hasColumn('school_groups', 'registration_configured_at')) {
                $table->datetime('registration_configured_at')->nullable()->after('registration_configured_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_groups', function (Blueprint $table) {
            $table->dropColumn([
                'registration_start_date',
                'registration_end_date',
                'registration_announcement',
                'registration_configured_by',
                'registration_configured_at',
            ]);
        });
    }
};
