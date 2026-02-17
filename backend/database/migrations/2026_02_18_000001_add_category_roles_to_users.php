<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Expand role enum to include category_admin and data_entry
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','district_admin','group_admin','school_admin','committee','teacher','category_admin','data_entry') NOT NULL DEFAULT 'teacher'");

        // 2. Add category_id column
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->after('school_group_id');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);
            $table->dropColumn('category_id');
        });

        // Revert role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','district_admin','group_admin','school_admin','committee','teacher') NOT NULL DEFAULT 'teacher'");
    }
};
