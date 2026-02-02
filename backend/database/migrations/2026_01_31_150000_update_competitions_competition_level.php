<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Update all existing competitions to have competition_level = 'group' if null
     */
    public function up(): void
    {
        // Update all competitions that have null competition_level
        DB::table('competitions')
            ->whereNull('competition_level')
            ->update(['competition_level' => 'group']);

        // Also update all competitions to have registration_status = 'open' if currently 'upcoming'
        // to enable registration
        DB::table('competitions')
            ->where('registration_status', 'upcoming')
            ->where('is_active', true)
            ->update(['registration_status' => 'open']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed
    }
};
