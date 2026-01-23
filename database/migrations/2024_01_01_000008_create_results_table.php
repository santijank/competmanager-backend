<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->unsignedBigInteger('registration_id');
            $table->unsignedBigInteger('competition_id');
            
            // Level
            $table->enum('level', ['group', 'district']); // ระดับการแข่งขัน
            
            // Results
            $table->decimal('score', 5, 2)->nullable(); // คะแนน 0-100
            $table->integer('rank')->nullable(); // อันดับ 1, 2, 3, ...
            $table->enum('medal', ['gold', 'silver', 'bronze', 'none'])->default('none');
            
            // Judges & Committee (JSON Arrays)
            $table->json('judges')->nullable(); // ["นายสมชาย ใจดี", "นางสาวสมหญิง รักงาม"]
            $table->json('committee')->nullable(); // ["นายธนา ศรีสุข (ประธาน)", "นางวิภา จันทร์เจ้า"]
            
            // Scoring Info
            $table->unsignedBigInteger('scored_by')->nullable();
            $table->timestamp('scored_at')->nullable();
            
            // Confirmation (for Group Level)
            $table->boolean('is_confirmed')->default(false);
            $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            
            // Advancement to District
            $table->boolean('confirmed_to_district')->default(false); // ยืนยันส่งไประดับเขตแล้ว
            $table->timestamp('advanced_at')->nullable();
            $table->unsignedBigInteger('advanced_by')->nullable();
            
            // Comments
            $table->text('comments')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('registration_id');
            $table->index('competition_id');
            $table->index('level');
            $table->index('rank');
            $table->index('confirmed_to_district');
            
            // Foreign Keys
            $table->foreign('registration_id')->references('id')->on('registrations')->onDelete('cascade');
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
            $table->foreign('scored_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('confirmed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('advanced_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
