<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DROP ตามลำดับที่ถูกต้อง (ต้อง drop child tables ก่อน)
        Schema::dropIfExists('registration_participants');
        Schema::dropIfExists('results'); // DROP results ก่อน!
        Schema::dropIfExists('registrations'); // แล้วค่อย DROP registrations
    }

    public function down(): void
    {
        // No rollback
    }
};
