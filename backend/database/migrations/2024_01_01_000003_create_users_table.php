<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // Roles: admin (District Admin), group_admin, teacher, committee
            $table->enum('role', ['admin', 'group_admin', 'teacher', 'committee'])->default('teacher');
            
            // Committee level (for committee role only)
            $table->enum('committee_level', ['group', 'district'])->nullable();
            
            // School & Group relations
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('school_group_id')->nullable();
            
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('role');
            $table->index('school_id');
            $table->index('school_group_id');
            
            // Foreign Keys
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('set null');
            $table->foreign('school_group_id')->references('id')->on('school_groups')->onDelete('set null');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
