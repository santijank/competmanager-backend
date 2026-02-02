<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['general', 'competition', 'result', 'urgent'])->default('general');
            $table->foreignId('school_group_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('competition_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('priority', ['normal', 'high', 'urgent'])->default('normal');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['school_group_id', 'published_at']);
            $table->index(['is_pinned', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
