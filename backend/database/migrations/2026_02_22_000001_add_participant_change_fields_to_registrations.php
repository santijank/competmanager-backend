<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->json('original_student_names')->nullable()->after('student_names');
            $table->unsignedTinyInteger('max_changes_allowed')->default(0)->after('original_student_names');
            $table->unsignedTinyInteger('change_count')->default(0)->after('max_changes_allowed');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['original_student_names', 'max_changes_allowed', 'change_count']);
        });
    }
};
