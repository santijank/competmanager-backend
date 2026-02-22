<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old table completely (user approved full reset)
        Schema::dropIfExists('certificates');

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_code')->unique();
            $table->unsignedBigInteger('score_id')->nullable();
            $table->unsignedBigInteger('result_id')->nullable();
            $table->unsignedBigInteger('competition_id');
            $table->string('student_name');
            $table->string('school_name');
            $table->string('competition_name');
            $table->string('category_name')->nullable();
            $table->json('teacher_names')->nullable();
            $table->string('level')->default('group'); // group, district
            $table->integer('rank')->nullable();
            $table->string('medal')->nullable(); // gold, silver, bronze, participant
            $table->decimal('score', 5, 2)->nullable();
            $table->json('judges')->nullable();
            $table->json('committee')->nullable();
            $table->string('signed_by')->nullable();
            $table->string('signer_position')->nullable();
            $table->date('issue_date')->nullable();
            $table->unsignedBigInteger('generated_by')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();

            $table->foreign('score_id')->references('id')->on('scores')->onDelete('cascade');
            $table->foreign('competition_id')->references('id')->on('competitions')->onDelete('cascade');
            $table->foreign('generated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
