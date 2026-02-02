<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_code')->unique();
            $table->foreignId('result_id')->constrained()->onDelete('cascade');
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->string('student_name');
            $table->string('school_name');
            $table->string('competition_name');
            $table->enum('level', ['group', 'district']);
            $table->integer('rank');
            $table->enum('medal', ['gold', 'silver', 'bronze', 'participant'])->default('participant');
            $table->json('judges')->nullable();
            $table->json('committee')->nullable();
            $table->string('signed_by')->nullable();
            $table->string('signer_position')->nullable();
            $table->string('pdf_path')->nullable();
            $table->date('issue_date');
            $table->foreignId('generated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            
            $table->index('certificate_code');
            $table->index(['result_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};