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
        Schema::table('committee_members', function (Blueprint $table) {
            $table->foreignId('competition_id')
                ->nullable()
                ->after('school_group_id')
                ->constrained('competitions')
                ->onDelete('set null');
            
            // Add index for better query performance
            $table->index('competition_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('committee_members', function (Blueprint $table) {
            $table->dropForeign(['competition_id']);
            $table->dropColumn('competition_id');
        });
    }
};
