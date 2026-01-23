<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DROP ตามลำดับที่ถูกต้อง (child tables ก่อน, parent tables ทีหลัง)
        
        // Level 1: Most dependent tables
        Schema::dropIfExists('registration_participants');
        
        // Level 2: Tables with FK to 'results'
        Schema::dropIfExists('certificates');
        
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
