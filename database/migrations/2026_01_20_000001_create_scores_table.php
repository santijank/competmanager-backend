<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->onDelete('cascade');
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->decimal('score', 5, 2)->nullable()->comment('คะแนนที่ได้ (0.00-100.00)');
            $table->enum('medal', ['gold', 'silver', 'bronze', 'participant', 'absent'])->nullable()->comment('เหรียญที่ได้');
            $table->integer('rank')->nullable()->comment('อันดับที่');
            $table->foreignId('scored_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('scored_at')->nullable()->comment('วันเวลาที่ใส่คะแนน');
            $table->text('notes')->nullable()->comment('หมายเหตุ');
            $table->boolean('is_finalized')->default(false)->comment('ล็อคคะแนนแล้วหรือยัง');
            $table->foreignId('finalized_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('finalized_at')->nullable()->comment('วันเวลาที่ล็อค');
            $table->boolean('advanced_to_district')->default(false)->comment('ส่งไปแข่งเขตแล้วหรือยัง');
            $table->timestamp('advanced_at')->nullable()->comment('วันเวลาที่ส่ง');
            $table->timestamps();
            
            $table->index(['registration_id', 'competition_id']);
            $table->index('medal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scores');
    }
};