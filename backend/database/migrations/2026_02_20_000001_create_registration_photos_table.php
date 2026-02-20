<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('registration_photos')) {
            return;
        }

        Schema::create('registration_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->onDelete('cascade');
            $table->enum('person_type', ['student', 'teacher']);
            $table->unsignedInteger('person_index');
            $table->string('photo_path')->nullable();
            $table->longText('photo_data')->nullable();
            $table->string('mime_type')->default('image/jpeg');
            $table->timestamps();

            $table->unique(['registration_id', 'person_type', 'person_index']);
            $table->index(['registration_id', 'person_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_photos');
    }
};
