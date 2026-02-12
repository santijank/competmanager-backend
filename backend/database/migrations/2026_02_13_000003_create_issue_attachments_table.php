<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_id')->nullable()->constrained('issues')->onDelete('cascade');
            $table->foreignId('issue_reply_id')->nullable()->constrained('issue_replies')->onDelete('cascade');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index('issue_id');
            $table->index('issue_reply_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_attachments');
    }
};
