<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DROP ALL dependent tables in correct order
        // (child → parent, most dependent first)
        
        // Level 1: Most dependent
        Schema::dropIfExists('registration_participants');
        
        // Level 2: Tables with FK to 'results' or 'registrations'
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('scores');
        
        // Level 3: Tables with FK to 'registrations'
        Schema::dropIfExists('results');
        
        // Level 4: Parent table
        Schema::dropIfExists('registrations');
    }

    public function down(): void
    {
        // No rollback
    }
};
