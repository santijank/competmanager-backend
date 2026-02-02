<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedBigInteger('school_group_id');
            $table->enum('school_type', ['government', 'private', 'autonomous'])->default('government');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('director_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('code');
            $table->index('school_group_id');
            $table->index('is_active');
            
            // Foreign Key
            $table->foreign('school_group_id')->references('id')->on('school_groups')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
