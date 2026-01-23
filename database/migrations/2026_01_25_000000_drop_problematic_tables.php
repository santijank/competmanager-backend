<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::dropIfExists('registration_participants');
        Schema::dropIfExists('registrations');
    }

    public function down()
    {
        // No rollback needed
    }
};
