<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_group_competitions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_group_id');
            $table->unsignedBigInteger('competition_id');
            $table->timestamps();

            // กลุ่มหนึ่งเลือกกิจกรรมหนึ่งได้แค่ครั้งเดียว
            $table->unique(['school_group_id', 'competition_id']);
            
            $table->index('school_group_id');
            $table->index('competition_id');
            
            // Foreign Keys
            $table->foreign('school_group_id')->references('id')->on('school_groups')->onDelete('cascade');
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_group_competitions');
    }
};
