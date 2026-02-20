<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('registration_photos')) {
            // ถ้าตารางไม่มี ให้สร้างใหม่ทั้งหมด
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
            return;
        }

        // ถ้าตารางมีอยู่แล้ว ให้เพิ่ม column ที่หายไป
        Schema::table('registration_photos', function (Blueprint $table) {
            if (!Schema::hasColumn('registration_photos', 'photo_data')) {
                $table->longText('photo_data')->nullable()->after('photo_path');
            }
            if (!Schema::hasColumn('registration_photos', 'mime_type')) {
                $table->string('mime_type')->default('image/jpeg')->after('photo_data');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('registration_photos')) {
            Schema::table('registration_photos', function (Blueprint $table) {
                if (Schema::hasColumn('registration_photos', 'photo_data')) {
                    $table->dropColumn('photo_data');
                }
                if (Schema::hasColumn('registration_photos', 'mime_type')) {
                    $table->dropColumn('mime_type');
                }
            });
        }
    }
};
