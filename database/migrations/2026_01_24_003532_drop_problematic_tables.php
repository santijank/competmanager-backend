<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop problematic tables
        Schema::dropIfExists('registration_participants');
        Schema::dropIfExists('registrations');
        
        // Also drop related tables if exist
        Schema::dropIfExists('results');
    }

    public function down(): void
    {
        // No rollback needed
    }
};
