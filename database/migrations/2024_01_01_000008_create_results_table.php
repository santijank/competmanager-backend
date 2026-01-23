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
            $table->foreignId('registration_id')->constrained()->onDelete('cascade');
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->enum('level', ['group', 'district']);
            $table->decimal('score', 5, 2)->nullable();
            $table->integer('rank')->nullable();
            $table->enum('medal', ['gold', 'silver', 'bronze', 'none'])->default('none');
            $table->json('judges')->nullable();
            $table->json('committee')->nullable();
            $table->foreignId('scored_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('scored_at')->nullable();
            $table->boolean('is_confirmed')->default(false);
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('confirmed_to_district')->default(false);
            $table->timestamp('advanced_at')->nullable();
            $table->foreignId('advanced_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('comments')->nullable();
            $table->timestamps();
            
            $table->index(['registration_id', 'level']);
            $table->index('medal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};